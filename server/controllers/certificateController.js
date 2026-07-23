const Certificate = require('../models/Certificate');
const Student = require('../models/Student');
const Counter = require('../models/Counter');
const asyncHandler = require('../utils/asyncHandler');

// Helper to generate atomic Certificate sequence number
const generateCertificateNo = async () => {
  const year = new Date().getFullYear();
  const counterKey = `cert_${year}`;
  const counter = await Counter.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seqPadded = String(counter.seq).padStart(4, '0');
  return `CERT-${year}-${seqPadded}`;
};

// @desc    Issue a new certificate for a student
// @route   POST /api/certificates
// @access  Private (Admin)
const createCertificate = asyncHandler(async (req, res) => {
  const { studentId, category, title, reasonText, issueDate } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const certificateNo = await generateCertificateNo();

  const certificate = await Certificate.create({
    certificateNo,
    student: studentId,
    category,
    title,
    reasonText,
    issueDate: issueDate || new Date(),
    issuedBy: req.admin._id
  });

  const populatedCertificate = await Certificate.findById(certificate._id)
    .populate('student', 'firstName lastName rollNo serialNo class section fatherName motherName photo')
    .populate('issuedBy', 'name email signatureUrl');

  res.status(201).json({
    success: true,
    data: populatedCertificate
  });
});

// @desc    Get list of all issued certificates
// @route   GET /api/certificates
// @access  Private (Admin)
const getCertificates = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }

  let certificates = await Certificate.find(query)
    .populate('student', 'firstName lastName rollNo serialNo class section fatherName photo')
    .populate('issuedBy', 'name email signatureUrl')
    .sort({ createdAt: -1 });

  if (search) {
    const s = search.toLowerCase();
    certificates = certificates.filter((cert) => {
      const studentName = cert.student ? `${cert.student.firstName} ${cert.student.lastName}`.toLowerCase() : '';
      const certNo = cert.certificateNo.toLowerCase();
      const title = cert.title.toLowerCase();
      return studentName.includes(s) || certNo.includes(s) || title.includes(s);
    });
  }

  res.status(200).json({
    success: true,
    data: certificates
  });
});

// @desc    Get single certificate by ID
// @route   GET /api/certificates/:id
// @access  Private (Admin)
const getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id)
    .populate('student', 'firstName lastName rollNo serialNo class section fatherName motherName photo')
    .populate('issuedBy', 'name email signatureUrl');

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  res.status(200).json({
    success: true,
    data: certificate
  });
});

// @desc    Delete/revoke certificate
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
const deleteCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);
  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  await certificate.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Certificate successfully revoked'
  });
});

module.exports = {
  createCertificate,
  getCertificates,
  getCertificateById,
  deleteCertificate
};
