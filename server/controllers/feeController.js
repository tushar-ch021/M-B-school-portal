const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const MonthlyFee = require('../models/MonthlyFee');
const { generateReceiptNo } = require('../utils/serialNoGenerator');
const asyncHandler = require('../utils/asyncHandler');

const MONTH_NAMES = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
];

const getMonthYear = (academicYear, monthIndex) => {
  const years = (academicYear || '').split('-');
  const startYear = parseInt(years[0], 10) || new Date().getFullYear();
  const endYear = parseInt(years[1], 10) || (startYear + 1);
  return monthIndex <= 9 ? startYear : endYear;
};

// @desc    Record a new fee collection payment
// @route   POST /api/fees/collect
// @access  Private
const collectFee = asyncHandler(async (req, res) => {
  const {
    studentId,
    academicYear,
    feeItems,
    paymentMode,
    bankDetails,
    payableAt,
    remark
  } = req.body;

  if (!studentId || !feeItems || !feeItems.length) {
    res.status(400);
    throw new Error('Student ID and at least one fee item is required');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  let totalDues = 0;
  let totalReceived = 0;
  let totalBalance = 0;

  const processedFeeItems = feeItems.map((item) => {
    const dues = Number(item.dues) || 0;
    const received = Number(item.received) || 0;
    const balance = dues - received;

    totalDues += dues;
    totalReceived += received;
    totalBalance += balance;

    return {
      particular: item.particular,
      dueDate: item.dueDate || new Date(),
      dues,
      received,
      balance
    };
  });

  const receiptNo = await generateReceiptNo(academicYear);

  const feePayment = await FeePayment.create({
    student: studentId,
    receiptNo,
    receiptDate: new Date(),
    academicYear: academicYear || student.academicYear,
    feeItems: processedFeeItems,
    totalDues,
    totalReceived,
    totalBalance,
    paymentMode: paymentMode || 'Cash',
    bankDetails: bankDetails || {},
    payableAt: payableAt || '',
    remark: remark || '',
    collectedBy: req.admin._id
  });

  student.tuitionFee = Math.max(0, student.tuitionFee - totalReceived);
  await student.save();

  res.status(201).json(feePayment);
});

// @desc    Get fee collection history for a student
// @route   GET /api/fees/history/:studentId
// @access  Private
const getFeeHistoryByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const payments = await FeePayment.find({ student: studentId })
    .populate('collectedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json(payments);
});

// @desc    Update student dues (Assign new fee items or adjust balance)
// @route   PUT /api/fees/update-dues/:studentId
// @access  Private
const updateStudentDues = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { tuitionFee, transportFee } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (tuitionFee !== undefined) {
    student.tuitionFee = Math.max(0, Number(tuitionFee));
  }
  if (transportFee !== undefined) {
    student.transportFee = Math.max(0, Number(transportFee));
  }

  student.totalFee = (student.tuitionFee || 0) + (student.usesTransport ? (student.transportFee || 0) : 0);
  await student.save();

  res.status(200).json({
    message: 'Fee dues updated successfully',
    student
  });
});

// @desc    Get fee summary stats for a student
// @route   GET /api/fees/summary/:studentId
// @access  Private
const getStudentFeeSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const payments = await FeePayment.find({ student: studentId });

  const totalPaid = payments.reduce((acc, curr) => acc + (curr.totalReceived || 0), 0);
  const currentDue = student.totalFee || 0;

  res.status(200).json({
    studentId: student._id,
    serialNo: student.serialNo,
    studentName: `${student.firstName} ${student.lastName}`,
    class: student.class,
    section: student.section,
    totalAssignedFee: currentDue + totalPaid,
    totalPaid,
    currentDue,
    paymentCount: payments.length
  });
});

// @desc    Get overall fee collection dashboard analytics
// @route   GET /api/fees/dashboard-stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const { className, section } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const studentQuery = { isActive: true, isRemoved: { $ne: true } };
  if (className) studentQuery.class = new RegExp(`^${escapeRegex(className.trim())}$`, 'i');
  if (section) studentQuery.section = new RegExp(`^${escapeRegex(section.trim())}$`, 'i');

  // Parallelize database queries using Promise.all and lean execution for sub-50ms speed
  const [
    todayPayments,
    monthPayments,
    activeStudents,
    transportStudentsCount,
    studentsThisYearCount,
    recentAdmissions
  ] = await Promise.all([
    FeePayment.find({ receiptDate: { $gte: today } }).select('totalReceived').lean(),
    FeePayment.find({ receiptDate: { $gte: startOfMonth } }).select('totalReceived').lean(),
    Student.find(studentQuery).select('totalFee tuitionFee transportFee class section').lean(),
    Student.countDocuments({ ...studentQuery, usesTransport: true }),
    Student.countDocuments({ ...studentQuery, createdAt: { $gte: startOfYear } }),
    Student.find(studentQuery).sort({ createdAt: -1 }).limit(5).select('firstName lastName class section serialNo rollNo photo createdAt').lean()
  ]);

  const totalTodayCollected = todayPayments.reduce((acc, curr) => acc + (curr.totalReceived || 0), 0);
  const totalMonthCollected = monthPayments.reduce((acc, curr) => acc + (curr.totalReceived || 0), 0);
  const totalStudents = activeStudents.length;
  const totalPendingDues = activeStudents.reduce((acc, curr) => acc + (curr.totalFee || 0), 0);

  res.status(200).json({
    totalTodayCollected,
    totalMonthCollected,
    monthlyFeeCollected: totalMonthCollected,
    totalPendingDues,
    totalStudents,
    transportStudents: transportStudentsCount,
    studentsThisYear: studentsThisYearCount,
    todayTransactionCount: todayPayments.length,
    monthTransactionCount: monthPayments.length,
    recentAdmissions
  });
});

// =========================================================================
// MONTHLY FEE TRACKING CONTROLLERS (ADMIN-CONTROLLED INDIAN SCHOOL WORKFLOW)
// =========================================================================

// @desc    Set or update class-wide fee amount for a specific month & year
// @route   POST /api/fees/monthly/config
// @access  Private
const setMonthlyFeeConfig = asyncHandler(async (req, res) => {
  const { className, month, monthIndex, year, academicYear, amountDue } = req.body;

  if (!className || !month || !monthIndex || !year || amountDue === undefined || amountDue === null) {
    res.status(400);
    throw new Error('Please provide class, month, monthIndex, year, and a valid amountDue');
  }

  const parsedAmount = Number(amountDue);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    res.status(400);
    throw new Error('Monthly fee amount cannot be negative');
  }

  const targetAcademicYear = academicYear || `${year}-${year + 1}`;

  // Upsert MonthlyFee configuration for class + month + year
  const config = await MonthlyFee.findOneAndUpdate(
    { class: className, month, year },
    {
      class: className,
      month,
      monthIndex: Number(monthIndex),
      year: Number(year),
      academicYear: targetAcademicYear,
      amountDue: parsedAmount,
      configuredBy: req.admin._id
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Immediately active-generate/update FeeRecord entries for all active students in this class
  const activeStudents = await Student.find({
    class: className,
    isActive: true,
    isRemoved: { $ne: true }
  });

  if (activeStudents.length > 0) {
    const ops = activeStudents.map((st) => {
      // Custom student override takes priority if student has individual fee set
      const studentFeeDue = (st.tuitionFee > 0)
        ? st.tuitionFee
        : parsedAmount;

      return {
        updateOne: {
          filter: {
            student: st._id,
            academicYear: targetAcademicYear,
            monthIndex: Number(monthIndex)
          },
          update: {
            $set: {
              student: st._id,
              class: st.class,
              section: st.section,
              academicYear: targetAcademicYear,
              month,
              monthIndex: Number(monthIndex),
              year: Number(year),
              isConfigured: true,
              amountDue: studentFeeDue
            },
            $setOnInsert: {
              amountPaid: 0,
              payments: []
            }
          },
          upsert: true
        }
      };
    });

    await FeeRecord.bulkWrite(ops);
  }

  res.status(200).json({
    success: true,
    message: `Fee of ₹${parsedAmount} configured for Class ${className} (${month} ${year}). Synced ${activeStudents.length} student records.`,
    data: config
  });
});

// @desc    Get configured monthly fee for a class + month + year
// @route   GET /api/fees/monthly/config
// @access  Private
const getMonthlyFeeConfig = asyncHandler(async (req, res) => {
  const { className, month, year } = req.query;

  if (!className || !month || !year) {
    res.status(400);
    throw new Error('Please provide className, month, and year');
  }

  const config = await MonthlyFee.findOne({ class: className, month, year: Number(year) });

  res.status(200).json({
    isConfigured: Boolean(config),
    monthlyFee: config || null
  });
});

// @desc    Get class monthly fee overview roster (Status badges: Not Set, Due, Partial, Paid)
// @route   GET /api/fees/monthly/class
// @access  Private
const getClassMonthlyFeeOverview = asyncHandler(async (req, res) => {
  const { className, section, month, monthIndex = 1, year = new Date().getFullYear(), academicYear } = req.query;

  if (!className || !month) {
    res.status(400);
    throw new Error('Please select class and month');
  }

  const query = { class: className, isActive: true, isRemoved: { $ne: true } };
  if (section) query.section = section;

  const activeStudents = await Student.find(query).sort({ firstName: 1 }).select('firstName lastName serialNo rollNo class section tuitionFee').lean();
  const numYear = Number(year);
  const numMonthIndex = Number(monthIndex);
  const targetYearStr = academicYear || `${numYear}-${numYear + 1}`;

  // Check if MonthlyFee is configured for this class + month + year
  const feeConfig = await MonthlyFee.findOne({ class: className, month, year: numYear }).lean();

  const studentIds = activeStudents.map(s => s._id);
  const existingRecords = await FeeRecord.find({
    student: { $in: studentIds },
    academicYear: targetYearStr,
    monthIndex: numMonthIndex
  }).lean();

  const recordMap = new Map();
  existingRecords.forEach(r => recordMap.set(r.student.toString(), r));

  // If class fee is configured, lazy-upsert missing student records
  if (feeConfig) {
    const missingStudents = activeStudents.filter(st => !recordMap.has(st._id.toString()));

    if (missingStudents.length > 0) {
      const ops = missingStudents.map(st => {
        const studentFeeDue = (st.tuitionFee > 0) ? st.tuitionFee : feeConfig.amountDue;
        return {
          updateOne: {
            filter: { student: st._id, academicYear: targetYearStr, monthIndex: numMonthIndex },
            update: {
              $set: {
                student: st._id,
                class: st.class,
                section: st.section,
                academicYear: targetYearStr,
                month,
                monthIndex: numMonthIndex,
                year: numYear,
                isConfigured: true,
                amountDue: studentFeeDue
              },
              $setOnInsert: { amountPaid: 0, payments: [] }
            },
            upsert: true
          }
        };
      });
      await FeeRecord.bulkWrite(ops);
    }
  }

  // Refetch records
  const allRecords = await FeeRecord.find({
    student: { $in: studentIds },
    academicYear: targetYearStr,
    monthIndex: numMonthIndex
  }).lean();

  const updatedRecordMap = new Map();
  allRecords.forEach(r => updatedRecordMap.set(r.student.toString(), r));

  let paidCount = 0;
  let partialCount = 0;
  let dueCount = 0;
  let notSetCount = 0;

  const roster = activeStudents.map(st => {
    const rec = updatedRecordMap.get(st._id.toString());
    let isConfigured = false;
    let amountDue = 0;

    if (rec && rec.isConfigured && rec.amountDue > 0 && rec.amountDue !== 1000) {
      isConfigured = true;
      amountDue = rec.amountDue;
    } else if (feeConfig && feeConfig.amountDue > 0) {
      isConfigured = true;
      amountDue = feeConfig.amountDue;
    }

    const amountPaid = rec ? rec.amountPaid : 0;
    let status = 'Not Set';

    if (isConfigured && amountDue > 0) {
      if (amountPaid === 0) {
        status = 'Due';
        dueCount++;
      } else if (amountPaid >= amountDue) {
        status = 'Paid';
        paidCount++;
      } else {
        status = 'Partial';
        partialCount++;
      }
    } else {
      notSetCount++;
    }

    return {
      feeRecordId: rec ? rec._id : null,
      student: {
        _id: st._id,
        serialNo: st.serialNo,
        rollNo: st.rollNo,
        firstName: st.firstName,
        lastName: st.lastName,
        class: st.class,
        section: st.section
      },
      isConfigured,
      amountDue,
      amountPaid,
      balance: Math.max(0, amountDue - amountPaid),
      status,
      payments: rec ? rec.payments : []
    };
  });

  res.status(200).json({
    isConfigured: Boolean(feeConfig || roster.some(r => r.isConfigured)),
    month,
    year: numYear,
    class: className,
    section: section || 'All',
    configAmount: feeConfig ? feeConfig.amountDue : 0,
    summary: {
      totalStudents: roster.length,
      paidCount,
      partialCount,
      dueCount,
      notSetCount
    },
    students: roster
  });
});

// @desc    Get 12-month matrix for a student (April to March)
// @route   GET /api/fees/monthly/student/:studentId
// @access  Private
const getStudentMonthlyFees = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { academicYear } = req.query;

  const student = await Student.findById(studentId).lean();
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const targetYear = academicYear || student.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const years = (targetYear || '').split('-');
  const startYear = parseInt(years[0], 10) || new Date().getFullYear();
  const endYear = parseInt(years[1], 10) || (startYear + 1);

  // Batch query all 12 monthly fee configs at once to eliminate N+1 loop queries
  const [existingRecords, monthlyConfigs] = await Promise.all([
    FeeRecord.find({
      student: studentId,
      academicYear: targetYear
    }).lean(),
    MonthlyFee.find({
      class: student.class,
      year: { $in: [startYear, endYear] }
    }).lean()
  ]);

  const recordMap = new Map();
  existingRecords.forEach(r => recordMap.set(r.monthIndex, r));

  const configMap = new Map();
  monthlyConfigs.forEach(c => configMap.set(`${c.month}_${c.year}`, c));

  const monthlyMatrix = [];

  for (let index = 0; index < MONTH_NAMES.length; index++) {
    const monthName = MONTH_NAMES[index];
    const monthIndex = index + 1;
    const year = getMonthYear(targetYear, monthIndex);

    // Fast O(1) in-memory lookup instead of DB query inside loop
    const feeConfig = configMap.get(`${monthName}_${year}`);
    let rec = recordMap.get(monthIndex);

    let isConfigured = false;
    let amountDue = 0;

    if (feeConfig && feeConfig.amountDue > 0) {
      isConfigured = true;
      amountDue = feeConfig.amountDue;
    } else if (rec && rec.isConfigured && rec.amountDue > 0) {
      isConfigured = true;
      amountDue = rec.amountDue;
    }

    const amountPaid = rec ? rec.amountPaid : 0;
    let status = 'Not Set';

    if (isConfigured && amountDue > 0) {
      if (amountPaid === 0) status = 'Due';
      else if (amountPaid >= amountDue) status = 'Paid';
      else status = 'Partial';
    } else {
      isConfigured = false;
      amountDue = 0;
      status = 'Not Set';
    }

    monthlyMatrix.push({
      monthIndex,
      month: monthName,
      year,
      isConfigured,
      amountDue,
      amountPaid,
      status,
      payments: rec ? rec.payments : []
    });
  }

  res.status(200).json({
    student,
    academicYear: targetYear,
    monthlyMatrix
  });
});

// @desc    Collect monthly fee payment for a student
// @route   POST /api/fees/monthly/payment
// @access  Private
const collectMonthlyFeePayment = asyncHandler(async (req, res) => {
  const { studentId, month, year, amount, paymentMode, remark } = req.body;

  if (!studentId || !month || !year || !amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error('Please provide studentId, month, year, and a valid payment amount');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const numYear = Number(year);
  const paymentAmount = Number(amount);

  // Validation: Check if MonthlyFee or individual FeeRecord has been configured
  const feeConfig = await MonthlyFee.findOne({ class: student.class, month, year: numYear });

  let record = await FeeRecord.findOne({
    student: studentId,
    month,
    year: numYear
  });

  if (!feeConfig && (!record || !record.isConfigured)) {
    res.status(400);
    throw new Error(`Fee for Class ${student.class} (${month} ${numYear}) has not been configured by admin yet.`);
  }

  const monthIndex = MONTH_NAMES.indexOf(month) + 1;
  const targetYear = `${numYear}-${numYear + 1}`;

  if (!record) {
    const studentFeeDue = feeConfig ? feeConfig.amountDue : 0;

    record = await FeeRecord.create({
      student: studentId,
      class: student.class,
      section: student.section,
      academicYear: targetYear,
      month,
      monthIndex,
      year: numYear,
      isConfigured: true,
      amountDue: studentFeeDue,
      amountPaid: 0,
      payments: []
    });
  }

  const receiptNo = await generateReceiptNo(targetYear);

  record.payments.push({
    amount: paymentAmount,
    paymentMode: paymentMode || 'Cash',
    receiptNo,
    date: new Date(),
    remark: remark || `Monthly Fee for ${month}`
  });

  record.amountPaid += paymentAmount;
  await record.save();

  // Synchronize receipt in FeePayment collection
  await FeePayment.create({
    student: studentId,
    receiptNo,
    receiptDate: new Date(),
    academicYear: targetYear,
    feeItems: [
      {
        particular: `Monthly Tuition Fee - ${month} ${numYear}`,
        dueDate: new Date(),
        dues: record.amountDue,
        received: paymentAmount,
        balance: Math.max(0, record.amountDue - record.amountPaid)
      }
    ],
    totalDues: record.amountDue,
    totalReceived: paymentAmount,
    totalBalance: Math.max(0, record.amountDue - record.amountPaid),
    paymentMode: paymentMode || 'Cash',
    remark: remark || `Monthly Fee payment for ${month}`,
    collectedBy: req.admin._id
  });

  res.status(200).json({
    success: true,
    message: `Payment of ₹${paymentAmount} recorded for ${month} ${numYear}`,
    data: record
  });
});

// @desc    Set or update individual student monthly fee amount
// @route   PUT /api/fees/monthly/student-fee
// @access  Private (Admin)
const setIndividualStudentMonthlyFee = asyncHandler(async (req, res) => {
  const { studentId, month, year, amountDue } = req.body;

  if (!studentId || !month || !year || amountDue === undefined || amountDue === null) {
    res.status(400);
    throw new Error('Please provide studentId, month, year, and a valid amountDue');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const parsedAmount = Number(amountDue);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    res.status(400);
    throw new Error('Fee amount cannot be negative');
  }

  const numYear = Number(year);
  const monthIndex = MONTH_NAMES.indexOf(month) + 1;
  const targetYear = `${numYear}-${numYear + 1}`;

  // Find or create FeeRecord entry ONLY for this specific student & month
  let record = await FeeRecord.findOne({
    student: studentId,
    month,
    year: numYear
  });

  if (!record) {
    record = await FeeRecord.create({
      student: studentId,
      class: student.class,
      section: student.section,
      academicYear: targetYear,
      month,
      monthIndex,
      year: numYear,
      isConfigured: true,
      amountDue: parsedAmount,
      amountPaid: 0,
      payments: []
    });
  } else {
    record.amountDue = parsedAmount;
    record.isConfigured = true;
    await record.save();
  }

  // NOTE: Do NOT mutate student.tuitionFee so other months remain untouched!

  res.status(200).json({
    success: true,
    message: `Monthly fee for ${student.firstName} ${student.lastName} (${month} ${numYear}) set to ₹${parsedAmount}`,
    data: record
  });
});

module.exports = {
  collectFee,
  getFeeHistoryByStudent,
  updateStudentDues,
  getStudentFeeSummary,
  getDashboardStats,
  setMonthlyFeeConfig,
  getMonthlyFeeConfig,
  getClassMonthlyFeeOverview,
  getStudentMonthlyFees,
  collectMonthlyFeePayment,
  setIndividualStudentMonthlyFee
};
