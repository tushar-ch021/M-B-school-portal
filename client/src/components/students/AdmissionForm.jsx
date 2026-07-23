import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { admissionSchema } from '../../utils/validators';
import PhotoCapture from './PhotoCapture';
import { ArrowRight, Save, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const AdmissionForm = ({ onSubmit, initialData = null, isSubmitting = false }) => {
  const [selectedPhoto, setSelectedPhoto] = useState({ file: null, base64: null });
  const [usesTransportState, setUsesTransportState] = useState(false);

  // Format initial values if in edit mode (transforming Dates/Bools for inputs)
  const getInitialValues = () => {
    if (!initialData) {
      const year = new Date().getFullYear();
      return {
        firstName: '',
        lastName: '',
        dob: '',
        gender: 'Male',
        bloodGroup: '',
        class: '1st',
        section: 'A',
        rollNo: '',
        academicYear: `${year}-${year + 1}`,
        admissionDate: new Date().toISOString().split('T')[0],
        fatherName: '',
        fatherOccupation: '',
        fatherPhone: '',
        motherName: '',
        motherOccupation: '',
        motherPhone: '',
        guardianName: '',
        address: { current: '', city: '', state: '', pincode: '' },
        contactNo: '',
        category: 'General',
        previousSchool: { name: '', tcNo: '' },
        usesTransport: false,
        transportRoute: '',
        apaarId: '',
        aadharNo: '',
        nationality: 'Indian',
        fatherQualification: '',
        motherQualification: '',
        officeAddress: '',
        email: '',
        siblings: {
          brother: { name: '', class: '', school: '' },
          sister: { name: '', class: '', school: '' }
        }
      };
    }

    return {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
      gender: initialData.gender || 'Male',
      bloodGroup: initialData.bloodGroup || '',
      class: initialData.class || '1st',
      section: initialData.section || 'A',
      rollNo: initialData.rollNo || '',
      academicYear: initialData.academicYear || '',
      admissionDate: initialData.admissionDate ? new Date(initialData.admissionDate).toISOString().split('T')[0] : '',
      fatherName: initialData.fatherName || '',
      fatherOccupation: initialData.fatherOccupation || '',
      fatherPhone: initialData.fatherPhone || '',
      motherName: initialData.motherName || '',
      motherOccupation: initialData.motherOccupation || '',
      motherPhone: initialData.motherPhone || '',
      guardianName: initialData.guardianName || '',
      address: {
        current: initialData.address?.current || '',
        city: initialData.address?.city || '',
        state: initialData.address?.state || '',
        pincode: initialData.address?.pincode || ''
      },
      contactNo: initialData.contactNo || '',
      category: initialData.category || 'General',
      previousSchool: {
        name: initialData.previousSchool?.name || '',
        tcNo: initialData.previousSchool?.tcNo || ''
      },
      usesTransport: !!initialData.usesTransport,
      transportRoute: initialData.transportRoute || '',
      apaarId: initialData.apaarId || '',
      aadharNo: initialData.aadharNo || '',
      panNumber: initialData.panNumber || '',
      nationality: initialData.nationality || 'Indian',
      fatherQualification: initialData.fatherQualification || '',
      motherQualification: initialData.motherQualification || '',
      officeAddress: initialData.officeAddress || '',
      email: initialData.email || '',
      siblings: {
        brother: {
          name: initialData.siblings?.brother?.name || '',
          class: initialData.siblings?.brother?.class || '',
          school: initialData.siblings?.brother?.school || ''
        },
        sister: {
          name: initialData.siblings?.sister?.name || '',
          class: initialData.siblings?.sister?.class || '',
          school: initialData.siblings?.sister?.school || ''
        }
      }
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(admissionSchema),
    defaultValues: getInitialValues()
  });

  // Watch usesTransport input to toggle route input
  const watchedUsesTransport = watch('usesTransport');

  useEffect(() => {
    setUsesTransportState(watchedUsesTransport);
    if (!watchedUsesTransport) {
      setValue('transportRoute', '');
    }
  }, [watchedUsesTransport, setValue]);

  const handlePhotoSelect = (photoData) => {
    setSelectedPhoto(photoData);
  };

  const onFormSubmit = (data) => {
    // Photo validation is required for new admissions
    if (!initialData && !selectedPhoto.file && !selectedPhoto.base64) {
      toast.error('Student photo is required to complete admission registration.');
      return;
    }
    
    // Construct FormData to support file upload streams
    const formData = new FormData();
    
    Object.keys(data).forEach((key) => {
      if (key === 'address' || key === 'previousSchool' || key === 'siblings') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'usesTransport') {
        formData.append(key, data[key] ? 'true' : 'false');
      } else {
        formData.append(key, data[key]);
      }
    });

    if (selectedPhoto.file) {
      formData.append('photo', selectedPhoto.file);
    } else if (selectedPhoto.base64) {
      formData.append('photoBase64', selectedPhoto.base64);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 no-print">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Columns - Form Inputs */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Section 1: Student Details */}
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat">
            <h3 className="mb-4 text-sm font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              1. Personal Student Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700">First Name *</label>
                <input
                  type="text"
                  {...register('firstName')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Last Name *</label>
                <input
                  type="text"
                  {...register('lastName')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  {...register('dob')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.dob && <span className="text-xs text-red-500">{errors.dob.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Gender *</label>
                <select
                  {...register('gender')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="text-xs text-red-500">{errors.gender.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Blood Group</label>
                <input
                  type="text"
                  placeholder="e.g. O+, A-"
                  {...register('bloodGroup')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Category *</label>
                <select
                  {...register('category')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
                {errors.category && <span className="text-xs text-red-500">{errors.category.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Student Contact Number (Optional)</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="10-digit student mobile number"
                  {...register('contactNo')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.contactNo && <span className="text-xs text-red-500">{errors.contactNo.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">APAAR ID (12-Digit, Optional)</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="Government APAAR portal ID"
                  {...register('apaarId')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.apaarId && <span className="text-xs text-red-500">{errors.apaarId.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Aadhar Number (12-Digit, Optional)</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="Student Aadhaar card number"
                  {...register('aadharNo')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.aadharNo && <span className="text-xs text-red-500">{errors.aadharNo.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">PAN Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Permanent Account Number"
                  {...register('panNumber')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.panNumber && <span className="text-xs text-red-500">{errors.panNumber.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Nationality</label>
                <input
                  type="text"
                  {...register('nationality')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Class Details */}
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat">
            <h3 className="mb-4 text-sm font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              2. Academic Class Parameters
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Class *</label>
                <select
                  {...register('class')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  {['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                {errors.class && <span className="text-xs text-red-500">{errors.class.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Section *</label>
                <select
                  {...register('section')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  {['A', 'B', 'C', 'D'].map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
                {errors.section && <span className="text-xs text-red-500">{errors.section.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Roll Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional roll number"
                  {...register('rollNo')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.rollNo && <span className="text-xs text-red-500">{errors.rollNo.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Academic Year * (YYYY-YYYY)</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-2027"
                  {...register('academicYear')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.academicYear && <span className="text-xs text-red-500">{errors.academicYear.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Admission Date *</label>
                <input
                  type="date"
                  {...register('admissionDate')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.admissionDate && <span className="text-xs text-red-500">{errors.admissionDate.message}</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Parents details */}
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat">
            <h3 className="mb-4 text-sm font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              3. Parent / Guardian Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Father's Name *</label>
                <input
                  type="text"
                  {...register('fatherName')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.fatherName && <span className="text-xs text-red-500">{errors.fatherName.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Father's Occupation</label>
                <input
                  type="text"
                  {...register('fatherOccupation')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Father's Phone Number *</label>
                <input
                  type="text"
                  maxLength={10}
                  {...register('fatherPhone')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.fatherPhone && <span className="text-xs text-red-500">{errors.fatherPhone.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Father's Educational Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. Graduate, Post Graduate"
                  {...register('fatherQualification')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div className="border-t border-gray-100 my-2 sm:hidden col-span-1" />
              <div>
                <label className="block text-xs font-semibold text-gray-700">Mother's Name *</label>
                <input
                  type="text"
                  {...register('motherName')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.motherName && <span className="text-xs text-red-500">{errors.motherName.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Mother's Occupation</label>
                <input
                  type="text"
                  {...register('motherOccupation')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Mother's Phone Number (Optional)</label>
                <input
                  type="text"
                  maxLength={10}
                  {...register('motherPhone')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.motherPhone && <span className="text-xs text-red-500">{errors.motherPhone.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Mother's Educational Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. Graduate"
                  {...register('motherQualification')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div className="border-t border-gray-100 my-2 sm:hidden col-span-1" />
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700">Guardian Name (Optional)</label>
                <input
                  type="text"
                  placeholder="If living with a guardian different from parents"
                  {...register('guardianName')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700">Parents Office Address</label>
                <input
                  type="text"
                  placeholder="Complete office or workspace address"
                  {...register('officeAddress')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700">Communication Email Address</label>
                <input
                  type="text"
                  placeholder="e.g. parent@email.com"
                  {...register('email')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
              </div>
            </div>
          </div>

          {/* Section 4: Address Details */}
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat">
            <h3 className="mb-4 text-sm font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              4. Address Specifications
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700">Current Street Address *</label>
                <input
                  type="text"
                  {...register('address.current')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.address?.current && <span className="text-xs text-red-500">{errors.address.current.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">City *</label>
                <input
                  type="text"
                  {...register('address.city')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.address?.city && <span className="text-xs text-red-500">{errors.address.city.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">State *</label>
                <input
                  type="text"
                  {...register('address.state')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.address?.state && <span className="text-xs text-red-500">{errors.address.state.message}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Pincode *</label>
                <input
                  type="text"
                  maxLength={6}
                  {...register('address.pincode')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                {errors.address?.pincode && <span className="text-xs text-red-500">{errors.address.pincode.message}</span>}
              </div>
            </div>
          </div>

          {/* Section 5: Sibling Details (Optional) */}
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat">
            <h3 className="mb-4 text-sm font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              5. Details about Siblings (Optional)
            </h3>
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">a) Brother Details</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Name of Brother</label>
                    <input
                      type="text"
                      {...register('siblings.brother.name')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Class</label>
                    <input
                      type="text"
                      {...register('siblings.brother.class')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">School Name</label>
                    <input
                      type="text"
                      {...register('siblings.brother.school')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">b) Sister Details</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Name of Sister</label>
                    <input
                      type="text"
                      {...register('siblings.sister.name')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Class</label>
                    <input
                      type="text"
                      {...register('siblings.sister.class')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">School Name</label>
                    <input
                      type="text"
                      {...register('siblings.sister.school')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Previous School (Optional) */}
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat">
            <h3 className="mb-4 text-sm font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              6. Previous Academic History (Optional)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700">School Name</label>
                <input
                  type="text"
                  {...register('previousSchool.name')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Transfer Certificate (TC) Number</label>
                <input
                  type="text"
                  {...register('previousSchool.tcNo')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Transport Details */}
          <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat">
            <h3 className="mb-4 text-sm font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              7. Transport Setup
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="usesTransport"
                  type="checkbox"
                  {...register('usesTransport')}
                  className="h-4.5 w-4.5 rounded-sm border-gray-300 text-navy-900 focus:ring-navy-900"
                />
                <label htmlFor="usesTransport" className="text-sm font-semibold text-gray-700 select-none">
                  Uses School Bus / Transportation Route
                </label>
              </div>

              {usesTransportState && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Transport Route / Bus Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. Route 4 (Saidpur-Gulaothi)"
                    {...register('transportRoute')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                  {errors.transportRoute && <span className="text-xs text-red-500">{errors.transportRoute.message}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Photo capturing widget */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <PhotoCapture 
              onPhotoSelect={handlePhotoSelect} 
              initialPreviewUrl={initialData?.photo?.url || ''} 
            />
            
            <div className="mt-6 rounded-lg bg-navy-50 p-4 border border-navy-100 flex gap-3 text-navy-900">
              <ShieldAlert className="h-5 w-5 shrink-0 text-navy-900" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Required Fields Note</p>
                <p className="text-gray-500">
                  Please make sure to supply parent phone contacts and a clean student face photo. The photo will be scaled for physical printing.
                </p>
              </div>
            </div>

            <div className="mt-6 flex w-full">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-3.5 text-sm font-bold text-white shadow-premium transition-colors hover:bg-navy-800 disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                {isSubmitting ? 'Submitting Details...' : initialData ? 'Save Changes' : 'Confirm Admission'}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AdmissionForm;
