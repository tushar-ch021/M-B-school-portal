const Counter = require('../models/Counter');

/**
 * Increments the counter atomically and returns the new sequence number.
 * @param {string} counterId The unique ID of the counter.
 * @returns {Promise<number>} The updated sequence value.
 */
const getNextSequence = async (counterId) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

/**
 * Generates an atomic Student Serial Number in format: BRIS-YYYY-XXXX (e.g. BRIS-2026-0001)
 * Resets/keeps sequence relative to academic year.
 * @param {string} academicYear The academic year string, e.g., "2026-2027" or "2026"
 */
const generateStudentSerial = async (academicYear) => {
  const schoolCode = process.env.SCHOOL_CODE || 'BRIS';
  // Standardize the year portion (e.g., "2026-2027" -> "2026")
  const yearPart = academicYear ? academicYear.split('-')[0] : new Date().getFullYear().toString();
  const counterId = `student_serial_${academicYear || yearPart}`;
  
  const seq = await getNextSequence(counterId);
  const paddedSeq = String(seq).padStart(4, '0');
  return `${schoolCode}-${yearPart}-${paddedSeq}`;
};

/**
 * Generates an atomic Fee Receipt Number in format: RCPT-YYYY-XXXX (e.g. RCPT-2026-0001)
 * @param {string} academicYear The academic year string, e.g., "2026-2027"
 */
const generateReceiptNo = async (academicYear) => {
  const yearPart = academicYear ? academicYear.split('-')[0] : new Date().getFullYear().toString();
  const counterId = `receipt_no_${academicYear || yearPart}`;
  
  const seq = await getNextSequence(counterId);
  const paddedSeq = String(seq).padStart(4, '0');
  return `RCPT-${yearPart}-${paddedSeq}`;
};

/**
 * Generates an atomic Transfer Certificate Number in format: TC-YYYY-XXXX (e.g. TC-2026-0001)
 * @param {string} academicYear The academic year string, e.g., "2026-2027"
 */
const generateTCNo = async (academicYear) => {
  const yearPart = academicYear ? academicYear.split('-')[0] : new Date().getFullYear().toString();
  const counterId = `tc_no_${academicYear || yearPart}`;
  
  const seq = await getNextSequence(counterId);
  const paddedSeq = String(seq).padStart(4, '0');
  return `TC-${yearPart}-${paddedSeq}`;
};

module.exports = {
  generateStudentSerial,
  generateReceiptNo,
  generateTCNo
};
