import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import AdmissionForm from '../components/students/AdmissionForm';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const NewAdmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Admitting new student and uploading optimized photos...');
    try {
      const newStudent = await studentService.admitStudent(formData);
      toast.success(`Admission successful! Assigned Serial No: ${newStudent.serialNo}`, { id: toastId, duration: 5000 });
      // Redirect to the dedicated admission print preview page
      navigate(`/admission/preview/${newStudent._id}`);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit student admission records';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-navy-900" />
          New Admission Form
        </h2>
        <p className="text-xs text-gray-500 font-medium">
          Fill out the student details to allocate a sequence serial number.
        </p>
      </div>

      {/* Renders the intake form */}
      <AdmissionForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};

export default NewAdmission;
