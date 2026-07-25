const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const MonthlyFee = require('../models/MonthlyFee');
const { generateReceiptNo } = require('../utils/serialNoGenerator');
const asyncHandler = require('../utils/asyncHandler');

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const computeAcademicYear = (monthName, yearNum, passedAcademicYear) => {
  if (passedAcademicYear && typeof passedAcademicYear === 'string' && passedAcademicYear.includes('-')) {
    return passedAcademicYear.trim();
  }
  const y = Number(yearNum);
  const mIndex = MONTH_NAMES.indexOf(monthName) + 1;
  if (mIndex >= 10 || ['January', 'February', 'March'].includes(monthName)) {
    const currentYear = new Date().getFullYear();
    if (y > currentYear) {
      return `${y - 1}-${y}`;
    }
    return `${y}-${y + 1}`;
  }
  return `${y}-${y + 1}`;
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

  // Sync the updated fee structure to all unpaid FeeRecords for the current academic year
  const unpaidRecords = await FeeRecord.find({
    student: studentId,
    academicYear: student.academicYear,
    amountPaid: 0
  });

  if (unpaidRecords.length > 0) {
    for (const record of unpaidRecords) {
      let targetTuition = student.tuitionFee;
      if (targetTuition === 0) {
        // Fallback to monthly config if tuition is 0
        const feeConfig = await MonthlyFee.findOne({
          class: student.class,
          month: record.month,
          year: record.year
        });
        targetTuition = feeConfig ? feeConfig.amountDue : 0;
      }

      const transport = student.usesTransport ? (student.transportFee || 0) : 0;
      const other = record.otherFee || 0;

      record.tuitionFee = targetTuition;
      record.transportFee = transport;
      record.amountDue = targetTuition + transport + other;
      await record.save();
    }
  }

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

  const payments = await FeePayment.find({ student: studentId }).lean();

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

  const paymentQueryToday = { receiptDate: { $gte: today } };
  const paymentQueryMonth = { receiptDate: { $gte: startOfMonth } };

  if (className || section) {
    const matchedStudents = await Student.find(studentQuery).select('_id').lean();
    const matchedStudentIds = matchedStudents.map(s => s._id);
    paymentQueryToday.student = { $in: matchedStudentIds };
    paymentQueryMonth.student = { $in: matchedStudentIds };
  }

  // Parallelize database queries using Promise.all and lean execution for sub-50ms speed
  const [
    todayPayments,
    monthPayments,
    activeStudents,
    transportStudentsCount,
    studentsThisYearCount,
    recentAdmissions
  ] = await Promise.all([
    FeePayment.find(paymentQueryToday).select('totalReceived').lean(),
    FeePayment.find(paymentQueryMonth).select('totalReceived').lean(),
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

  const numMonthIndex = (monthIndex !== undefined && monthIndex !== null) ? Number(monthIndex) : (MONTH_NAMES.indexOf(month) + 1);

  if (!className || !month || !numMonthIndex || !year || amountDue === undefined || amountDue === null) {
    res.status(400);
    throw new Error('Please provide class, month, monthIndex, year, and a valid amountDue');
  }

  const parsedAmount = Number(amountDue);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    res.status(400);
    throw new Error('Monthly fee amount cannot be negative');
  }

  const targetAcademicYear = computeAcademicYear(month, year, academicYear);
  const actualYear = getMonthYear(targetAcademicYear, numMonthIndex);

  // Upsert MonthlyFee configuration for class + month + year
  const config = await MonthlyFee.findOneAndUpdate(
    { class: className, month, year: actualYear },
    {
      class: className,
      month,
      monthIndex: numMonthIndex,
      year: actualYear,
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
  })
    .select('_id class section tuitionFee usesTransport transportFee')
    .lean();

  if (activeStudents.length > 0) {
    const ops = activeStudents.map((st) => {
      const baseTuition = (st.tuitionFee > 0) ? st.tuitionFee : parsedAmount;
      const transport = (st.usesTransport && st.transportFee > 0) ? st.transportFee : 0;
      const studentFeeDue = baseTuition + transport;

      return {
        updateOne: {
          filter: {
            student: st._id,
            academicYear: targetAcademicYear,
            monthIndex: numMonthIndex
          },
          update: {
            $set: {
              student: st._id,
              class: st.class,
              section: st.section,
              academicYear: targetAcademicYear,
              month,
              monthIndex: numMonthIndex,
              year: actualYear,
              isConfigured: true,
              amountDue: studentFeeDue,
              tuitionFee: baseTuition,
              transportFee: transport
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

  const activeStudents = await Student.find(query)
    .sort({ firstName: 1 })
    .select('firstName lastName serialNo rollNo class section tuitionFee usesTransport transportFee transportRoute')
    .lean();
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
        const baseTuition = (st.tuitionFee > 0) ? st.tuitionFee : feeConfig.amountDue;
        const transport = (st.usesTransport && st.transportFee > 0) ? st.transportFee : 0;
        const studentFeeDue = baseTuition + transport;
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

    if (rec && rec.isConfigured) {
      isConfigured = true;
      amountDue = rec.amountDue;
    } else if (feeConfig) {
      isConfigured = true;
      amountDue = feeConfig.amountDue;
    }

    const amountPaid = rec ? rec.amountPaid : 0;
    let status = 'Not Set';

    if (isConfigured) {
      if (amountDue === 0 || amountPaid >= amountDue) {
        status = 'Paid';
        paidCount++;
      } else if (amountPaid === 0) {
        status = 'Due';
        dueCount++;
      } else {
        status = 'Partial';
        partialCount++;
      }
    } else {
      notSetCount++;
    }

    const stTransport = (st.usesTransport && st.transportFee > 0) ? st.transportFee : 0;
    const transport = (rec && rec.transportFee !== undefined && rec.transportFee !== null && rec.transportFee > 0)
      ? rec.transportFee
      : stTransport;

    const other = rec ? (rec.otherFee || 0) : 0;
    const otherType = rec ? (rec.otherFeeType || '') : '';

    const baseTuition = (rec && rec.tuitionFee !== undefined && rec.tuitionFee !== null && rec.tuitionFee > 0)
      ? rec.tuitionFee
      : Math.max(0, amountDue - transport - other);

    return {
      feeRecordId: rec ? rec._id : null,
      student: {
        _id: st._id,
        serialNo: st.serialNo,
        rollNo: st.rollNo,
        firstName: st.firstName,
        lastName: st.lastName,
        class: st.class,
        section: st.section,
        usesTransport: st.usesTransport,
        transportFee: st.transportFee,
        transportRoute: st.transportRoute
      },
      isConfigured,
      amountDue,
      tuitionFee: baseTuition,
      transportFee: transport,
      otherFee: other,
      otherFeeType: otherType,
      amountPaid,
      balance: Math.max(0, amountDue - amountPaid),
      status,
      payments: rec ? rec.payments : [],
      carriedForwardFrom: rec ? rec.carriedForwardFrom : undefined,
      carriedForwardTo: rec ? rec.carriedForwardTo : undefined,
      carriedNote: rec ? rec.carriedNote : ''
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
    let tuitionFee = 0;
    let transportFee = 0;
    let otherFee = 0;
    let otherFeeType = '';

    const stTransport = (student.usesTransport && student.transportFee > 0) ? student.transportFee : 0;

    if (rec && rec.isConfigured) {
      isConfigured = true;
      amountDue = rec.amountDue;
      transportFee = (rec.transportFee !== undefined && rec.transportFee !== null && rec.transportFee > 0)
        ? rec.transportFee
        : stTransport;
      otherFee = rec.otherFee || 0;
      otherFeeType = rec.otherFeeType || '';
      tuitionFee = (rec.tuitionFee !== undefined && rec.tuitionFee !== null && rec.tuitionFee > 0)
        ? rec.tuitionFee
        : Math.max(0, amountDue - transportFee - otherFee);
    } else if (feeConfig) {
      isConfigured = true;
      const baseTuition = (student.tuitionFee > 0) ? student.tuitionFee : feeConfig.amountDue;
      transportFee = stTransport;
      tuitionFee = baseTuition;
      otherFee = 0;
      otherFeeType = '';
      amountDue = tuitionFee + transportFee;
    }

    const amountPaid = rec ? rec.amountPaid : 0;
    let status = 'Not Set';

    if (isConfigured) {
      if (amountDue === 0 || amountPaid >= amountDue) status = 'Paid';
      else if (amountPaid === 0) status = 'Due';
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
      tuitionFee,
      transportFee,
      otherFee,
      otherFeeType,
      amountPaid,
      status,
      payments: rec ? rec.payments : [],
      carriedForwardFrom: rec ? rec.carriedForwardFrom : undefined,
      carriedForwardTo: rec ? rec.carriedForwardTo : undefined,
      carriedNote: rec ? rec.carriedNote : ''
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
  const {
    studentId, month, year, amount, paymentMode, remark, carryForwardPreviousDue,
    tuitionPaid, transportPaid, otherPaid, carriedPaid
  } = req.body;

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
  const monthIndex = MONTH_NAMES.indexOf(month) + 1;
  const targetYear = computeAcademicYear(month, numYear, req.body.academicYear);
  const actualYear = getMonthYear(targetYear, monthIndex);

  // Validation: Check if MonthlyFee or individual FeeRecord has been configured
  const feeConfig = await MonthlyFee.findOne({
    class: student.class,
    academicYear: targetYear,
    monthIndex
  }) || await MonthlyFee.findOne({
    class: student.class,
    month,
    year: actualYear
  });

  let record = await FeeRecord.findOne({
    student: studentId,
    academicYear: targetYear,
    monthIndex
  }) || await FeeRecord.findOne({
    student: studentId,
    month,
    year: actualYear
  });

  if (!feeConfig && (!record || !record.isConfigured)) {
    res.status(400);
    throw new Error(`Fee for Class ${student.class} (${month} ${actualYear}) has not been configured by admin yet.`);
  }

  if (!record) {
    const studentFeeDue = feeConfig ? feeConfig.amountDue : 0;

    record = await FeeRecord.create({
      student: studentId,
      class: student.class,
      section: student.section,
      academicYear: targetYear,
      month,
      monthIndex,
      year: actualYear,
      isConfigured: true,
      amountDue: studentFeeDue,
      amountPaid: 0,
      payments: []
    });
  }

  // Handle optional Carry Forward of previous month's partial due
  if (carryForwardPreviousDue && monthIndex > 1) {
    const prevRecord = await FeeRecord.findOne({
      student: studentId,
      academicYear: targetYear,
      monthIndex: monthIndex - 1
    });

    if (prevRecord && prevRecord.amountDue > prevRecord.amountPaid) {
      const carriedAmount = prevRecord.amountDue - prevRecord.amountPaid;

      record.amountDue += carriedAmount;
      record.carriedForwardFrom = {
        month: prevRecord.month,
        year: prevRecord.year,
        amount: carriedAmount
      };

      prevRecord.carriedForwardTo = {
        month,
        year: actualYear,
        amount: carriedAmount,
        carriedAt: new Date()
      };
      prevRecord.amountDue = prevRecord.amountPaid;
      await prevRecord.save();
    }
  }

  const receiptNo = await generateReceiptNo(targetYear);

  const priorAmountPaid = Number(record.amountPaid) || 0;
  const openingDues = Math.max(0, record.amountDue - priorAmountPaid);

  const stTransport = (student.usesTransport && student.transportFee > 0) ? student.transportFee : 0;
  const recTransport = (record.transportFee !== undefined && record.transportFee !== null && record.transportFee > 0)
    ? record.transportFee
    : stTransport;
  const recOther = record.otherFee || 0;
  const recOtherType = record.otherFeeType || 'Other Fee';
  const recCarried = record.carriedForwardFrom?.amount || 0;

  const baseTuition = (record.tuitionFee !== undefined && record.tuitionFee !== null && record.tuitionFee > 0)
    ? record.tuitionFee
    : Math.max(0, record.amountDue - recCarried - recTransport - recOther);

  const recTuition = baseTuition > 0 ? baseTuition : Math.max(0, record.amountDue - recCarried - recTransport - recOther);

  const carriedNoteStr = recCarried > 0
    ? `Includes ₹${recCarried} carried forward from ${record.carriedForwardFrom?.month} ${record.carriedForwardFrom?.year || actualYear}`
    : '';

  // Calculate received amounts per category
  let remPayment = paymentAmount;

  let carriedDues = recCarried;
  let carriedReceived = (carriedPaid !== undefined && carriedPaid !== null) ? Number(carriedPaid) : Math.min(remPayment, carriedDues);
  remPayment = Math.max(0, remPayment - carriedReceived);

  let tuitionDues = recTuition;
  let tuitionReceived = (tuitionPaid !== undefined && tuitionPaid !== null) ? Number(tuitionPaid) : Math.min(remPayment, tuitionDues);
  remPayment = Math.max(0, remPayment - tuitionReceived);

  let transportDues = recTransport;
  let transportReceived = (transportPaid !== undefined && transportPaid !== null) ? Number(transportPaid) : Math.min(remPayment, transportDues);
  remPayment = Math.max(0, remPayment - transportReceived);

  let otherDues = recOther;
  let otherReceived = (otherPaid !== undefined && otherPaid !== null) ? Number(otherPaid) : Math.min(remPayment, otherDues);
  remPayment = Math.max(0, remPayment - otherReceived);

  record.payments.push({
    amount: paymentAmount,
    paymentMode: paymentMode || 'Cash',
    receiptNo,
    date: new Date(),
    remark: remark || `Monthly Fee for ${month}`,
    tuitionFee: recTuition,
    transportFee: recTransport,
    otherFee: recOther,
    otherFeeType: recOtherType,
    carriedForwardFrom: record.carriedForwardFrom?.amount > 0 ? record.carriedForwardFrom : undefined,
    carriedNote: carriedNoteStr,
    tuitionPaid: tuitionReceived,
    transportPaid: transportReceived,
    otherPaid: otherReceived,
    carriedPaid: carriedReceived
  });

  record.amountPaid += paymentAmount;
  await record.save();

  const closingBalance = Math.max(0, record.amountDue - record.amountPaid);

  let carriedBalance = Math.max(0, carriedDues - carriedReceived);
  let tuitionBalance = Math.max(0, tuitionDues - tuitionReceived);
  let transportBalance = Math.max(0, transportDues - transportReceived);
  let otherBalance = Math.max(0, otherDues - otherReceived);

  const feeItems = [
    {
      particular: `Tuition Fee - ${month} ${actualYear}`,
      dueDate: new Date(),
      dues: tuitionDues,
      received: tuitionReceived,
      balance: tuitionBalance
    }
  ];

  if (transportDues > 0 || student.usesTransport) {
    feeItems.push({
      particular: `Transport Fee (${student.transportRoute || 'School Bus'}) - ${month} ${actualYear}`,
      dueDate: new Date(),
      dues: transportDues,
      received: transportReceived,
      balance: transportBalance
    });
  }

  if (otherDues > 0) {
    feeItems.push({
      particular: `${recOtherType} - ${month} ${actualYear}`,
      dueDate: new Date(),
      dues: otherDues,
      received: otherReceived,
      balance: otherBalance
    });
  }

  if (carriedDues > 0) {
    feeItems.push({
      particular: `Previous month due (carried forward from ${record.carriedForwardFrom?.month}) - ${month} ${actualYear}`,
      dueDate: new Date(),
      dues: carriedDues,
      received: carriedReceived,
      balance: carriedBalance
    });
  }

  // Synchronize receipt in FeePayment collection with accurate Opening Dues & Closing Balance
  const feePayment = await FeePayment.create({
    student: studentId,
    receiptNo,
    receiptDate: new Date(),
    academicYear: targetYear,
    month,
    year: actualYear,
    tuitionFee: recTuition,
    transportFee: recTransport,
    otherFee: recOther,
    otherFeeType: recOtherType,
    carriedForwardFrom: record.carriedForwardFrom?.amount > 0 ? record.carriedForwardFrom : undefined,
    carriedNote: carriedNoteStr,
    feeItems,
    totalDues: openingDues,
    totalReceived: paymentAmount,
    totalBalance: closingBalance,
    paymentMode: paymentMode || 'Cash',
    remark: remark || `Monthly Fee payment for ${month}`,
    collectedBy: req.admin._id
  });

  res.status(200).json({
    success: true,
    message: `Payment of ₹${paymentAmount} recorded for ${month} ${numYear}`,
    data: record,
    payment: feePayment
  });
});

// @desc    Set or update individual student monthly fee amount
// @route   PUT /api/fees/monthly/student-fee
// @access  Private (Admin)
const setIndividualStudentMonthlyFee = asyncHandler(async (req, res) => {
  const { studentId, month, year, amountDue, tuitionFee, transportFee, otherFee, otherFeeType } = req.body;

  if (!studentId || !month || !year) {
    res.status(400);
    throw new Error('Please provide studentId, month, and year');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const parsedTuition = tuitionFee !== undefined ? Number(tuitionFee) : undefined;
  const parsedTransport = transportFee !== undefined ? Number(transportFee) : undefined;
  const parsedOther = otherFee !== undefined ? Number(otherFee) : 0;

  const totalAmountDue = (parsedTuition !== undefined || parsedTransport !== undefined || parsedOther > 0)
    ? ((parsedTuition || 0) + (parsedTransport || 0) + (parsedOther || 0))
    : Number(amountDue);

  if (isNaN(totalAmountDue) || totalAmountDue < 0) {
    res.status(400);
    throw new Error('Fee amount cannot be negative');
  }

  const numYear = Number(year);
  const monthIndex = MONTH_NAMES.indexOf(month) + 1;
  const targetYear = computeAcademicYear(month, numYear, req.body.academicYear);
  const actualYear = getMonthYear(targetYear, monthIndex);

  // Find or create FeeRecord entry ONLY for this specific student & month
  let record = await FeeRecord.findOne({
    student: studentId,
    academicYear: targetYear,
    monthIndex
  });

  if (!record) {
    record = await FeeRecord.findOne({
      student: studentId,
      month,
      year: actualYear
    });
  }

  if (!record) {
    record = await FeeRecord.create({
      student: studentId,
      class: student.class,
      section: student.section,
      academicYear: targetYear,
      month,
      monthIndex,
      year: actualYear,
      isConfigured: true,
      amountDue: totalAmountDue,
      tuitionFee: parsedTuition !== undefined ? parsedTuition : totalAmountDue,
      transportFee: parsedTransport !== undefined ? parsedTransport : 0,
      otherFee: parsedOther,
      otherFeeType: otherFeeType || '',
      amountPaid: 0,
      payments: []
    });
  } else {
    record.amountDue = totalAmountDue + (record.carriedForwardFrom?.amount || 0);
    if (parsedTuition !== undefined) record.tuitionFee = parsedTuition;
    if (parsedTransport !== undefined) record.transportFee = parsedTransport;
    if (parsedOther !== undefined) record.otherFee = parsedOther;
    if (otherFeeType !== undefined) record.otherFeeType = otherFeeType;
    record.academicYear = targetYear;
    record.year = actualYear;
    record.isConfigured = true;
    await record.save();
  }

  res.status(200).json({
    success: true,
    message: `Monthly fee for ${student.firstName} ${student.lastName} (${month} ${numYear}) set to ₹${totalAmountDue}`,
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
