const Student = require('../models/Student');
const { generateTCNo } = require('../utils/serialNoGenerator');
const asyncHandler = require('../utils/asyncHandler');

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Issue Transfer Certificate (TC) for a student
// @route   POST /api/tc/issue/:studentId
// @access  Private
const issueTC = asyncHandler(async (req, res) => {
  const { 
    reasonForLeaving, 
    lastClassAttended, 
    conduct, 
    duesCleared,
    tcIssueDate,
    panNumber,
    aadharNo,
    apaarId
  } = req.body;
  const { studentId } = req.params;

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student record not found');
  }

  if (student.tcIssued) {
    res.status(400);
    throw new Error('Transfer Certificate has already been issued for this student');
  }

  // Atomically generate the certificate sequence serial
  const tcNumber = await generateTCNo(student.academicYear);

  student.tcIssued = true;
  student.tcNumber = tcNumber;
  student.tcIssueDate = tcIssueDate ? new Date(tcIssueDate) : new Date();
  student.reasonForLeaving = reasonForLeaving || 'Course Completed';
  student.lastClassAttended = lastClassAttended || student.class;
  student.conduct = conduct || 'Good';
  student.duesCleared = duesCleared === 'true' || duesCleared === true;
  student.isActive = false; // Deactivate from active student listings

  if (panNumber !== undefined) student.panNumber = panNumber.trim();
  if (aadharNo !== undefined) student.aadharNo = aadharNo.trim();
  if (apaarId !== undefined) student.apaarId = apaarId.trim();

  await student.save();

  res.status(200).json(student);
});

// @desc    Get all students who have been issued a TC
// @route   GET /api/tc/records
// @access  Private
const getTCRecords = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const query = { tcIssued: true };

  if (search) {
    const safeSearch = escapeRegex(search);
    const searchRegex = new RegExp(safeSearch, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { tcNumber: searchRegex },
      { serialNo: searchRegex }
    ];
  }

  const tcRecords = await Student.find(query).sort({ tcIssueDate: -1 });
  res.status(200).json(tcRecords);
});

// @desc    Fetch TC details for preview
// @route   GET /api/tc/:studentId
// @access  Private
const getTCDetails = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  
  if (!student) {
    res.status(404);
    throw new Error('Student record not found');
  }
  
  if (!student.tcIssued) {
    res.status(400);
    throw new Error('Transfer Certificate has not been issued for this student yet');
  }

  res.status(200).json(student);
});

module.exports = {
  issueTC,
  getTCRecords,
  getTCDetails
};
