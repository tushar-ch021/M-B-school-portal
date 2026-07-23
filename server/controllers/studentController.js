const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const { uploadAndOptimize } = require('../utils/cloudinaryUpload');
const { generateStudentSerial } = require('../utils/serialNoGenerator');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to convert base64 image string to buffer
const getBufferFromBase64 = (base64String) => {
  const base64Data = base64String.split(';base64,').pop();
  return Buffer.from(base64Data, 'base64');
};

// @desc    Admit a new student
// @route   POST /api/students
// @access  Private
const admitStudent = asyncHandler(async (req, res) => {
  let fileBuffer;

  // Extract file from either multipart upload or camera base64 string
  if (req.file) {
    fileBuffer = req.file.buffer;
  } else if (req.body.photoBase64) {
    fileBuffer = getBufferFromBase64(req.body.photoBase64);
  }

  if (!fileBuffer) {
    res.status(400);
    throw new Error('Please upload or capture a student photo');
  }

  // Upload photo via optimization utility
  const photoUpload = await uploadAndOptimize(fileBuffer, {
    folder: 'br-school/students',
    isStudentPhoto: true
  });

  // Extract student attributes from request body
  // Support nested address string parse if sent as JSON string in multipart/form-data
  let addressData = req.body.address;
  if (typeof addressData === 'string') {
    try {
      addressData = JSON.parse(addressData);
    } catch (e) {
      res.status(400);
      throw new Error('Invalid address format');
    }
  }

  let previousSchoolData = req.body.previousSchool;
  if (typeof previousSchoolData === 'string') {
    try {
      previousSchoolData = JSON.parse(previousSchoolData);
    } catch (e) {
      previousSchoolData = {};
    }
  }

  let siblingsData = req.body.siblings;
  if (typeof siblingsData === 'string') {
    try {
      siblingsData = JSON.parse(siblingsData);
    } catch (e) {
      siblingsData = { brother: { name: '', class: '', school: '' }, sister: { name: '', class: '', school: '' } };
    }
  }

  const {
    firstName,
    lastName,
    dob,
    gender,
    bloodGroup,
    class: studentClass,
    section,
    rollNo,
    academicYear,
    admissionDate,
    fatherName,
    fatherOccupation,
    fatherPhone,
    motherName,
    motherOccupation,
    motherPhone,
    guardianName,
    contactNo,
    category,
    usesTransport,
    transportRoute,
    apaarId,
    aadharNo,
    nationality,
    fatherQualification,
    motherQualification,
    officeAddress,
    email,
    tuitionFee,
    transportFee
  } = req.body;

  // Generate atomic serial number
  const serialNo = await generateStudentSerial(academicYear);

  const isTransport = usesTransport === 'true' || usesTransport === true;
  const parsedTuition = tuitionFee !== undefined ? (Number(tuitionFee) || 0) : 0;
  const parsedTransport = transportFee !== undefined ? (Number(transportFee) || 0) : 0;
  const calculatedTotalFee = parsedTuition + (isTransport ? parsedTransport : 0);

  const student = await Student.create({
    serialNo,
    apaarId: apaarId || '',
    aadharNo: aadharNo || '',
    nationality: nationality || 'Indian',
    fatherQualification: fatherQualification || '',
    motherQualification: motherQualification || '',
    officeAddress: officeAddress || '',
    email: email || '',
    siblings: siblingsData || {
      brother: { name: '', class: '', school: '' },
      sister: { name: '', class: '', school: '' }
    },
    photo: {
      url: photoUpload.url,
      thumbnailUrl: photoUpload.thumbnailUrl,
      publicId: photoUpload.publicId
    },
    firstName,
    lastName,
    dob,
    gender,
    bloodGroup: bloodGroup || '',
    class: studentClass,
    section,
    rollNo,
    academicYear,
    admissionDate: admissionDate || new Date(),
    fatherName,
    fatherOccupation: fatherOccupation || '',
    fatherPhone,
    motherName,
    motherOccupation: motherOccupation || '',
    motherPhone,
    guardianName: guardianName || '',
    address: addressData,
    contactNo,
    category: category || 'General',
    previousSchool: previousSchoolData || { name: '', tcNo: '' },
    usesTransport: isTransport,
    transportRoute: transportRoute || '',
    tuitionFee: parsedTuition,
    transportFee: parsedTransport,
    totalFee: calculatedTotalFee,
    isActive: true
  });

  res.status(201).json(student);
});

// @desc    Get filtered list of students
// @route   GET /api/students
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const { className, section, search, page = 1, limit = 20 } = req.query;
  const query = { isActive: true, isRemoved: { $ne: true } };

  if (className) {
    query.class = new RegExp(`^${escapeRegex(className.trim())}$`, 'i');
  }
  if (section) {
    query.section = new RegExp(`^${escapeRegex(section.trim())}$`, 'i');
  }

  // Handle keyword search for name or serial number
  if (search) {
    const safeSearch = escapeRegex(search);
    const searchRegex = new RegExp(safeSearch, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { serialNo: searchRegex }
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ serialNo: 1 })
    .skip(skip)
    .limit(limitNum);

  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    students,
    totalCount,
    totalPages,
    currentPage: pageNum,
    limit: limitNum
  });
});

// @desc    Get single student details by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student record not found');
  }

  res.status(200).json(student);
});

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student record not found');
  }

  let photoUpdate = student.photo;

  // Process photo replace if a file or base64 data was supplied
  let fileBuffer;
  if (req.file) {
    fileBuffer = req.file.buffer;
  } else if (req.body.photoBase64) {
    fileBuffer = getBufferFromBase64(req.body.photoBase64);
  }

  if (fileBuffer) {
    // Delete old image from Cloudinary to maintain clean folder storage
    if (student.photo && student.photo.publicId) {
      await cloudinary.uploader.destroy(student.photo.publicId).catch((err) => {
        console.error('Failed to clean up old image asset from Cloudinary:', err);
      });
    }

    // Upload new optimized copy
    const newPhoto = await uploadAndOptimize(fileBuffer, {
      folder: 'br-school/students',
      isStudentPhoto: true
    });

    photoUpdate = {
      url: newPhoto.url,
      thumbnailUrl: newPhoto.thumbnailUrl,
      publicId: newPhoto.publicId
    };
  }

  // Extract payload fields
  let addressData = req.body.address;
  if (typeof addressData === 'string') {
    try {
      addressData = JSON.parse(addressData);
    } catch (e) {
      res.status(400);
      throw new Error('Invalid address format');
    }
  }

  let previousSchoolData = req.body.previousSchool;
  if (typeof previousSchoolData === 'string') {
    try {
      previousSchoolData = JSON.parse(previousSchoolData);
    } catch (e) {
      previousSchoolData = {};
    }
  }

  let siblingsData = req.body.siblings;
  if (typeof siblingsData === 'string') {
    try {
      siblingsData = JSON.parse(siblingsData);
    } catch (e) {
      siblingsData = null;
    }
  }

  const isTransport = req.body.usesTransport !== undefined
    ? (req.body.usesTransport === 'true' || req.body.usesTransport === true)
    : student.usesTransport;
  const tuition = req.body.tuitionFee !== undefined ? (Number(req.body.tuitionFee) || 0) : (student.tuitionFee ?? 0);
  const transport = req.body.transportFee !== undefined ? (Number(req.body.transportFee) || 0) : (student.transportFee ?? 0);
  const total = tuition + (isTransport ? transport : 0);

  const fieldsToUpdate = {
    apaarId: req.body.apaarId !== undefined ? req.body.apaarId : student.apaarId,
    aadharNo: req.body.aadharNo !== undefined ? req.body.aadharNo : student.aadharNo,
    nationality: req.body.nationality !== undefined ? req.body.nationality : student.nationality,
    fatherQualification: req.body.fatherQualification !== undefined ? req.body.fatherQualification : student.fatherQualification,
    motherQualification: req.body.motherQualification !== undefined ? req.body.motherQualification : student.motherQualification,
    officeAddress: req.body.officeAddress !== undefined ? req.body.officeAddress : student.officeAddress,
    email: req.body.email !== undefined ? req.body.email : student.email,
    siblings: siblingsData || student.siblings,
    firstName: req.body.firstName || student.firstName,
    lastName: req.body.lastName || student.lastName,
    dob: req.body.dob || student.dob,
    gender: req.body.gender || student.gender,
    bloodGroup: req.body.bloodGroup !== undefined ? req.body.bloodGroup : student.bloodGroup,
    class: req.body.class || student.class,
    section: req.body.section || student.section,
    rollNo: req.body.rollNo || student.rollNo,
    academicYear: req.body.academicYear || student.academicYear,
    admissionDate: req.body.admissionDate || student.admissionDate,
    fatherName: req.body.fatherName || student.fatherName,
    fatherOccupation: req.body.fatherOccupation !== undefined ? req.body.fatherOccupation : student.fatherOccupation,
    fatherPhone: req.body.fatherPhone || student.fatherPhone,
    motherName: req.body.motherName || student.motherName,
    motherOccupation: req.body.motherOccupation !== undefined ? req.body.motherOccupation : student.motherOccupation,
    motherPhone: req.body.motherPhone || student.motherPhone,
    guardianName: req.body.guardianName !== undefined ? req.body.guardianName : student.guardianName,
    address: addressData || student.address,
    contactNo: req.body.contactNo || student.contactNo,
    category: req.body.category || student.category,
    previousSchool: previousSchoolData || student.previousSchool,
    usesTransport: isTransport,
    transportRoute: req.body.transportRoute !== undefined ? req.body.transportRoute : student.transportRoute,
    tuitionFee: tuition,
    transportFee: transport,
    totalFee: total,
    photo: photoUpdate
  };

  const updatedStudent = await Student.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedStudent);
});

// @desc    Delete (or deactivate) a student record
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student record not found');
  }

  // Delete Cloudinary assets to save subscription space
  if (student.photo && student.photo.publicId) {
    await cloudinary.uploader.destroy(student.photo.publicId).catch((err) => {
      console.error('Cloudinary cleanup failure:', err);
    });
  }

  // Cascade delete all associated fee payment records to prevent orphaned documents
  await FeePayment.deleteMany({ student: student._id }).catch((err) => {
    console.error('Failed to cascade delete fee payments for student:', err);
  });

  await student.deleteOne();
  res.status(200).json({ success: true, message: 'Student record, associated fee payments, and photo asset deleted successfully' });
});

// @desc    Soft-remove a student (mark as removed with reason)
// @route   PUT /api/students/:id/remove
// @access  Private
const removeStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student record not found');
  }

  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    res.status(400);
    throw new Error('Please provide a reason for removing this student');
  }

  // Use findByIdAndUpdate to bypass validation rules on other unmodified fields
  const updatedStudent = await Student.findByIdAndUpdate(
    req.params.id,
    {
      isRemoved: true,
      isActive: false,
      removalReason: reason.trim(),
      removedAt: new Date()
    },
    { new: true, runValidators: false }
  );

  res.status(200).json({ success: true, message: 'Student has been removed successfully', student: updatedStudent });
});

// @desc    Get list of removed students
// @route   GET /api/students/removed
// @access  Private
const getRemovedStudents = asyncHandler(async (req, res) => {
  const { className, section, search, page = 1, limit = 50 } = req.query;
  const query = { isRemoved: true };

  if (className) {
    query.class = className;
  }
  if (section) {
    query.section = section;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    const searchRegex = new RegExp(safeSearch, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { serialNo: searchRegex }
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ removedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    students,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
    currentPage: pageNum
  });
});

// @desc    Restore a removed student back to active
// @route   PUT /api/students/:id/restore
// @access  Private
const restoreStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student record not found');
  }

  if (!student.isRemoved) {
    res.status(400);
    throw new Error('This student is not in the removed list');
  }

  // Use findByIdAndUpdate to bypass validation rules on other fields
  const updatedStudent = await Student.findByIdAndUpdate(
    req.params.id,
    {
      isRemoved: false,
      isActive: true,
      removalReason: '',
      $unset: { removedAt: 1 }
    },
    { new: true, runValidators: false }
  );

  res.status(200).json({ success: true, message: 'Student has been restored successfully', student: updatedStudent });
});

module.exports = {
  admitStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  removeStudent,
  getRemovedStudents,
  restoreStudent
};
