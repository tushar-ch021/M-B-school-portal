import React, { forwardRef } from 'react';
import { useBranding } from '../../utils/brandingConfig';

const CertificateTemplate = forwardRef(({ student, category, title, reasonText, certificateNo, issueDate, signatureUrl }, ref) => {
  const { branding } = useBranding();

  if (!student) return null;

  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  return (
    <div
      ref={ref}
      className="print-container relative bg-white mx-auto shadow-2xl text-gray-900 overflow-hidden select-none font-sans"
      style={{
        width: '100%',
        maxWidth: '850px',
        minHeight: '600px',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box'
      }}
    >
      {/* Outer Golden & Navy Luxury Double Frame */}
      <div 
        className="absolute inset-3 border-[3px] pointer-events-none rounded-xs"
        style={{ borderColor: '#0B2545' }}
      >
        <div 
          className="absolute inset-1.5 border-[2px] pointer-events-none rounded-xs"
          style={{ borderColor: '#D4AF37' }}
        />
      </div>

      {/* Decorative Corner Ornaments */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 pointer-events-none" style={{ borderColor: '#D4AF37' }} />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 pointer-events-none" style={{ borderColor: '#D4AF37' }} />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 pointer-events-none" style={{ borderColor: '#D4AF37' }} />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 pointer-events-none" style={{ borderColor: '#D4AF37' }} />

      {/* Background Subtle Emblem Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <img
          src="/logo.png"
          alt=""
          className="w-96 h-96 object-contain"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Certificate Content Container */}
      <div className="relative z-10 p-8 sm:p-10 flex flex-col justify-between h-full">
        
        {/* Certificate Top Bar (Certificate Serial & Category Badge) */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-2">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="School Logo"
              className="h-14 w-14 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h1 className="text-base font-black tracking-widest uppercase text-[#0B2545] font-serif leading-none">
                {branding.schoolName}
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mt-1">
                {branding.schoolAddress}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 mt-1">
            <span className="inline-block px-3 py-1 bg-[#0B2545] text-amber-300 text-[10px] font-bold tracking-widest uppercase rounded-xs shadow-xs">
              {category || 'OFFICIAL RECOGNITION'}
            </span>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center my-2">
          <p className="text-[11px] font-bold tracking-[0.3em] text-[#B8860B] uppercase mb-1">
            THIS CERTIFICATE IS PROUDLY PRESENTED TO
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-[#0B2545] uppercase font-serif underline decoration-amber-400 decoration-2 underline-offset-8">
            {title || 'CERTIFICATE OF EXCELLENCE'}
          </h2>
        </div>

        {/* Recipient Student Particulars */}
        <div className="text-center my-3 space-y-3 px-6">
          <h3 className="text-2xl font-black tracking-wide text-[#0B2545] font-serif">
            {student.firstName} {student.lastName}
          </h3>
          <div className="w-48 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <p className="text-xs text-gray-700 leading-relaxed font-sans max-w-xl mx-auto">
            Son/Daughter of <span className="font-bold text-gray-900">{student.fatherName || 'N/A'}</span>, Student of Class{' '}
            <span className="font-bold text-[#0B2545]">{student.class || '-'}</span> (Section{' '}
            <span className="font-bold text-[#0B2545]">{student.section || '-'}</span>)
            {student.apaarId && (
              <>, APAAR ID: <span className="font-bold text-[#0B2545]">{student.apaarId}</span></>
            )}
            {student.panNumber && (
              <>, PAN No: <span className="font-bold text-[#0B2545]">{student.panNumber}</span></>
            )}.
          </p>

          <div className="bg-amber-50/60 border border-amber-200/70 p-3 rounded-md text-xs text-gray-800 font-medium italic max-w-xl mx-auto shadow-xs">
            "{reasonText || 'For outstanding achievement, exemplary conduct, and exceptional dedication in academic and co-curricular performance.'}"
          </div>
        </div>

        {/* Certificate Footer (Date, Gold Seal Emblem, Signature Block) */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between px-6 mt-3">
          {/* Issue Date */}
          <div className="text-left">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date of Issue</p>
            <p className="text-xs font-bold text-gray-900">{formattedDate}</p>
          </div>

          {/* Principal Signature Block */}
          <div className="text-center min-w-[120px]">
            <div className="h-10 flex items-end justify-center mb-1">
              {signatureUrl ? (
                <img src={signatureUrl} alt="Signature" className="h-9 object-contain" />
              ) : (
                <span className="text-[10px] text-gray-400 italic">Signed</span>
              )}
            </div>
            <div className="w-32 border-t-2 border-gray-800 mx-auto" />
            <p className="text-[10px] font-black text-[#0B2545] uppercase tracking-wider mt-1">Authorized Signatory</p>
          </div>

        </div>

      </div>
    </div>
  );
});

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;

