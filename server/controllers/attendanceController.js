const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');

// Helper to normalize date to YYYY-MM-DD midnight UTC
const normalizeDate = (dateString) => {
  const d = dateString ? new Date(dateString) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// @desc    Mark or update student attendance in bulk for a class & section on a given date
// @route   POST /api/attendance/student/bulk
// @access  Private (Admin)
const markStudentAttendanceBulk = asyncHandler(async (req, res) => {
  const { date, class: className, section, records } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('Please provide student attendance records array');
  }

  const targetDate = normalizeDate(date);
  const markedBy = req.admin._id;

  // Prepare bulkWrite operations for upsert
  const bulkOps = records.map((item) => {
    return {
      updateOne: {
        filter: {
          type: 'student',
          student: item.studentId,
          date: targetDate
        },
        update: {
          $set: {
            type: 'student',
            student: item.studentId,
            date: targetDate,
            status: item.status,
            class: className,
            section: section,
            remark: item.remark || '',
            markedBy: markedBy
          }
        },
        upsert: true
      }
    };
  });

  await Attendance.bulkWrite(bulkOps);

  res.status(200).json({
    success: true,
    message: `Attendance successfully marked for ${records.length} students`
  });
});

// @desc    Get student attendance for a class & section on a given date
// @route   GET /api/attendance/student/class
// @access  Private (Admin)
const getClassAttendanceByDate = asyncHandler(async (req, res) => {
  const { class: className, section, date } = req.query;

  if (!className || !section || !date) {
    res.status(400);
    throw new Error('Please specify class, section, and date');
  }

  const targetDate = normalizeDate(date);

  // 1. Fetch all active and unremoved students in this class and section
  const students = await Student.find({
    class: className,
    section: section,
    isActive: true,
    isRemoved: false
  }).select('firstName lastName serialNo rollNo photo gender').sort({ rollNo: 1, firstName: 1 });

  // 2. Fetch existing attendance records for this class, section, and date
  const attendanceRecords = await Attendance.find({
    type: 'student',
    class: className,
    section: section,
    date: targetDate
  });

  // Create lookup map: studentId -> attendance record
  const attendanceMap = new Map();
  attendanceRecords.forEach((rec) => {
    attendanceMap.set(rec.student.toString(), rec);
  });

  // Merge students with their attendance status
  const mergedList = students.map((student) => {
    const record = attendanceMap.get(student._id.toString());
    return {
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        serialNo: student.serialNo,
        rollNo: student.rollNo,
        photo: student.photo,
        gender: student.gender
      },
      status: record ? record.status : 'Unmarked',
      remark: record ? record.remark : '',
      attendanceId: record ? record._id : null
    };
  });

  const totalStudents = students.length;
  const presentCount = mergedList.filter((item) => item.status === 'Present').length;
  const absentCount = mergedList.filter((item) => item.status === 'Absent').length;
  const leaveCount = mergedList.filter((item) => item.status === 'Leave').length;

  res.status(200).json({
    success: true,
    data: {
      date: targetDate,
      class: className,
      section: section,
      stats: {
        totalStudents,
        presentCount,
        absentCount,
        leaveCount,
        percentage: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
      },
      records: mergedList
    }
  });
});

// @desc    Get attendance history and metrics for a specific student
// @route   GET /api/attendance/student/:studentId/history
// @access  Private (Admin)
const getStudentAttendanceHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  const student = await Student.findById(studentId).select('firstName lastName serialNo rollNo class section photo');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const query = {
    type: 'student',
    student: studentId
  };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = normalizeDate(startDate);
    if (endDate) query.date.$lte = normalizeDate(endDate);
  }

  const history = await Attendance.find(query).sort({ date: -1 });

  const totalDays = history.length;
  const presentCount = history.filter((r) => r.status === 'Present').length;
  const absentCount = history.filter((r) => r.status === 'Absent').length;
  const leaveCount = history.filter((r) => r.status === 'Leave').length;
  const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      student,
      stats: {
        totalDays,
        presentCount,
        absentCount,
        leaveCount,
        percentage
      },
      history
    }
  });
});

// ==========================================
// FEATURE 2: STAFF ATTENDANCE ENDPOINTS
// ==========================================

// @desc    Mark or update staff attendance in bulk for a date
// @route   POST /api/attendance/staff/bulk
// @access  Private (Admin)
const markStaffAttendanceBulk = asyncHandler(async (req, res) => {
  const { date, records } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('Please provide staff attendance records array');
  }

  const targetDate = normalizeDate(date);
  const markedBy = req.admin._id;

  const bulkOps = records.map((item) => {
    return {
      updateOne: {
        filter: {
          type: 'staff',
          staff: item.staffId,
          date: targetDate
        },
        update: {
          $set: {
            type: 'staff',
            staff: item.staffId,
            date: targetDate,
            status: item.status,
            remark: item.remark || '',
            markedBy: markedBy
          }
        },
        upsert: true
      }
    };
  });

  await Attendance.bulkWrite(bulkOps);

  res.status(200).json({
    success: true,
    message: `Staff attendance successfully marked for ${records.length} staff members`
  });
});

// @desc    Get staff attendance list for a given date
// @route   GET /api/attendance/staff
// @access  Private (Admin)
const getStaffAttendanceByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    res.status(400);
    throw new Error('Please specify date');
  }

  const targetDate = normalizeDate(date);

  // Fetch all staff / admin accounts
  const staffList = await Admin.find().select('name email signatureUrl').sort({ name: 1 });

  // Fetch existing attendance records for staff on targetDate
  const attendanceRecords = await Attendance.find({
    type: 'staff',
    date: targetDate
  });

  const attendanceMap = new Map();
  attendanceRecords.forEach((rec) => {
    attendanceMap.set(rec.staff.toString(), rec);
  });

  const mergedList = staffList.map((staff) => {
    const record = attendanceMap.get(staff._id.toString());
    return {
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email
      },
      status: record ? record.status : 'Unmarked',
      remark: record ? record.remark : '',
      attendanceId: record ? record._id : null
    };
  });

  const totalStaff = staffList.length;
  const presentCount = mergedList.filter((item) => item.status === 'Present').length;
  const absentCount = mergedList.filter((item) => item.status === 'Absent').length;
  const leaveCount = mergedList.filter((item) => item.status === 'Leave').length;

  res.status(200).json({
    success: true,
    data: {
      date: targetDate,
      stats: {
        totalStaff,
        presentCount,
        absentCount,
        leaveCount,
        percentage: totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0
      },
      records: mergedList
    }
  });
});

// @desc    Add a new staff member (creates staff admin account)
// @route   POST /api/attendance/staff
// @desc    Add a new staff member (creates staff account)
// @route   POST /api/attendance/staff
// @access  Private (Admin)
const addStaffMember = asyncHandler(async (req, res) => {
  const { name, email, phone, role, assignedClass, assignedSection } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Please provide staff member name');
  }

  let cleanEmail = email ? email.trim().toLowerCase() : '';
  if (!cleanEmail) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    cleanEmail = `${slug}_${Date.now()}_${randomSuffix}@mbps.internal`;
  } else {
    const existingStaff = await Admin.findOne({ email: cleanEmail });
    if (existingStaff) {
      res.status(400);
      throw new Error('A staff member or admin account with this email already exists');
    }
  }

  const bcrypt = require('bcryptjs');
  const staffPassword = 'staff' + Math.floor(100000 + Math.random() * 900000);
  const hashedPassword = await bcrypt.hash(staffPassword, 12);

  const newStaff = await Admin.create({
    name: name.trim(),
    email: cleanEmail,
    phone: phone ? phone.trim() : '',
    password: hashedPassword,
    role: role || 'Teacher',
    assignedClass: assignedClass || '',
    assignedSection: assignedSection || ''
  });

  res.status(201).json({
    success: true,
    message: `Staff member ${newStaff.name} added successfully`,
    data: {
      _id: newStaff._id,
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role,
      assignedClass: newStaff.assignedClass,
      assignedSection: newStaff.assignedSection
    }
  });
});

// @desc    Get month-wise attendance list and summary for student or staff member
// @route   GET /api/attendance/monthly
// @access  Private (Admin)
const getMonthWiseAttendance = asyncHandler(async (req, res) => {
  const { type = 'student', id, month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

  if (!id) {
    res.status(400);
    throw new Error('Please provide student or staff ID');
  }

  const numMonth = Number(month);
  const numYear = Number(year);

  if (numMonth < 1 || numMonth > 12 || isNaN(numYear)) {
    res.status(400);
    throw new Error('Invalid month or year parameters');
  }

  // Calculate start and end dates for target month
  const startDate = new Date(Date.UTC(numYear, numMonth - 1, 1, 0, 0, 0, 0));
  const daysInMonth = new Date(numYear, numMonth, 0).getDate();
  const endDate = new Date(Date.UTC(numYear, numMonth - 1, daysInMonth, 23, 59, 59, 999));

  let subjectInfo = null;
  const attendanceQuery = {
    type,
    date: { $gte: startDate, $lte: endDate }
  };

  if (type === 'student') {
    const student = await Student.findById(id).select('firstName lastName serialNo rollNo class section photo');
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }
    subjectInfo = {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      serialNo: student.serialNo,
      rollNo: student.rollNo,
      class: student.class,
      section: student.section,
      photo: student.photo?.url || ''
    };
    attendanceQuery.student = id;
  } else {
    const staff = await Admin.findById(id).select('name email role');
    if (!staff) {
      res.status(404);
      throw new Error('Staff member not found');
    }
    subjectInfo = {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role
    };
    attendanceQuery.staff = id;
  }

  const existingRecords = await Attendance.find(attendanceQuery).sort({ date: 1 }).lean();

  const recordMap = new Map();
  existingRecords.forEach(r => {
    const dateStr = new Date(r.date).toISOString().split('T')[0];
    recordMap.set(dateStr, r);
  });

  const monthDayList = [];
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let notMarkedCount = 0;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(numYear, numMonth - 1, day);
    const dateKey = `${numYear}-${String(numMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = dayNames[d.getDay()];
    const isSunday = d.getDay() === 0;

    const rec = recordMap.get(dateKey);
    let status = 'Not Marked';
    let remark = '';

    if (rec) {
      status = rec.status;
      remark = rec.remark || '';
    } else if (isSunday) {
      status = 'Sunday';
    }

    if (status === 'Present') presentCount++;
    else if (status === 'Absent') absentCount++;
    else if (status === 'Leave') leaveCount++;
    else if (status === 'Not Marked') notMarkedCount++;

    monthDayList.push({
      day,
      date: dateKey,
      dayOfWeek,
      isSunday,
      status,
      remark
    });
  }

  const markedDaysTotal = presentCount + absentCount + leaveCount;
  const attendancePercentage = markedDaysTotal > 0 ? Math.round((presentCount / markedDaysTotal) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      type,
      subject: subjectInfo,
      month: numMonth,
      year: numYear,
      daysInMonth,
      summary: {
        totalDays: daysInMonth,
        presentCount,
        absentCount,
        leaveCount,
        notMarkedCount,
        percentage: attendancePercentage
      },
      records: monthDayList
    }
  });
});

module.exports = {
  markStudentAttendanceBulk,
  getClassAttendanceByDate,
  getStudentAttendanceHistory,
  markStaffAttendanceBulk,
  getStaffAttendanceByDate,
  addStaffMember,
  getMonthWiseAttendance
};
