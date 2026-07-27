const Student = require('../models/Student');

const runPromotionIfApplicable = async () => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed (Jan=1, Dec=12)
    const currentYear = today.getFullYear();

    // We promote on/after May 1st.
    // The academic year transition starts in April/May.
    // Expected academic year for students on/after May 1st, 2027 should be "2027-2028".
    // If month is Jan-Apr (1-4), academic year is "${currentYear-1}-${currentYear}"
    // If month is May-Dec (5-12), academic year is "${currentYear}-${currentYear+1}"
    let targetStartYear = currentYear;
    if (currentMonth < 5) {
      targetStartYear = currentYear - 1;
    }
    const targetAcademicYear = `${targetStartYear}-${targetStartYear + 1}`;

    // Query active, non-removed students whose academicYear is NOT the target academic year
    const studentsToPromote = await Student.find({
      isActive: true,
      isRemoved: false,
      academicYear: { $ne: targetAcademicYear }
    });

    if (studentsToPromote.length === 0) {
      return;
    }

    console.log(`[Promotion Scheduler] Found ${studentsToPromote.length} students to transition to academic year ${targetAcademicYear}...`);

    const CLASS_SEQUENCE = [
      'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
    ];

    let promotedCount = 0;
    let failedCount = 0;
    let graduatedCount = 0;

    for (const student of studentsToPromote) {
      // Check promotion status
      if (student.promotionStatus === 'Failed') {
        // Student remains in the same class but updates to new academic year
        student.reattemptCount = (student.reattemptCount || 0) + 1;
        student.promotionStatus = 'Pending';
        student.academicYear = targetAcademicYear;
        failedCount++;
      } else {
        // Promote to next class
        const currentClassIdx = CLASS_SEQUENCE.indexOf(student.class);
        if (currentClassIdx === -1) {
          // Unknown class, just update academicYear to target
          student.academicYear = targetAcademicYear;
          promotedCount++;
        } else if (student.class === '12th') {
          // Graduated / Alumni
          student.isActive = false;
          student.class = 'Graduated';
          student.academicYear = targetAcademicYear;
          student.promotionStatus = 'Pending';
          graduatedCount++;
        } else {
          // Promote to next in sequence
          student.class = CLASS_SEQUENCE[currentClassIdx + 1];
          student.academicYear = targetAcademicYear;
          student.promotionStatus = 'Pending';
          promotedCount++;
        }
      }
      await student.save();
    }

    console.log(`[Promotion Scheduler] Successfully processed promotions. Promoted: ${promotedCount}, Failed/Detained (Reattempts): ${failedCount}, Graduated: ${graduatedCount}`);
  } catch (err) {
    console.error('[Promotion Scheduler] Error running promotions:', err);
  }
};

// Schedule checking to run once every 24 hours
const startPromotionScheduler = () => {
  // Run on startup
  setTimeout(runPromotionIfApplicable, 5000); // delay 5s to ensure DB is fully connected
  
  // Run once daily (every 24 hours)
  setInterval(runPromotionIfApplicable, 24 * 60 * 60 * 1000);
};

module.exports = {
  startPromotionScheduler,
  runPromotionIfApplicable
};
