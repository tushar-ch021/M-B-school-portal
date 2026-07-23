import React, { forwardRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../utils/brandingConfig';

const IDCardTemplate = forwardRef(({ student }, ref) => {
  const { admin } = useAuth();
  const { branding } = useBranding();
  if (!student) return null;

  const signatureSrc = admin?.signatureUrl || "";

  return (
    <div 
      ref={ref}
      className="print-container identity-card-container bg-white border border-gray-300 rounded-[12px] shadow-lg overflow-hidden font-sans select-none relative"
      style={{ 
        width: '324px',
        height: '516px',
        minWidth: '324px',
        minHeight: '516px',
        maxWidth: '324px',
        maxHeight: '516px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}
    >
      {/* 1. Header with Dual Curved Background (Blue + Green Arch) */}
      <div style={{ position: 'relative', width: '324px', height: '116px', flexShrink: 0 }}>
        {/* SVG Curved Layer */}
        <svg 
          style={{ position: 'absolute', top: 0, left: 0, width: '324px', height: '116px' }} 
          viewBox="0 0 324 116" 
          preserveAspectRatio="none"
        >
          {/* Green Bottom Curved Arc */}
          <path d="M0,0 L324,0 L324,90 Q162,122 0,90 Z" fill="#0E8A20" />
          {/* Main Blue Top Header Curved Shape */}
          <path d="M0,0 L324,0 L324,78 Q162,108 0,78 Z" fill="#0B3092" />
        </svg>

        {/* Header Text & Logo Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', paddingTop: '4px' }}>
          {/* Emblem Logo */}
          <div 
            style={{
              height: '36px',
              width: '36px',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              margin: '0 auto 2px auto',
              padding: '1px',
              border: '1px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img 
              src="/logo.png" 
              alt="BRIS Logo" 
              style={{ height: '100%', width: '100%', objectFit: 'contain', display: 'block' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* School Name Lines */}
          <h1 
            style={{ 
              fontSize: '17px', 
              fontWeight: '900', 
              letterSpacing: '0.01em', 
              lineHeight: '1.1', 
              margin: 0, 
              color: '#ffffff', 
              fontFamily: 'Arial, sans-serif',
              textTransform: 'uppercase' 
            }}
          >
            {branding.schoolName}
          </h1>
        </div>
      </div>

      {/* 2. Photo & Core Student Details Section */}
      <div 
        style={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 14px 8px 14px',
          position: 'relative',
          zIndex: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Student Image Box */}
          <div 
            style={{
              height: '138px',
              width: '145px',
              overflow: 'hidden',
              border: '1px solid #111111',
              backgroundColor: '#f9fafb',
              margin: '0 auto',
              flexShrink: 0,
            }}
          >
            {student.photo?.url ? (
              <img 
                src={student.photo.url} 
                alt={student.firstName} 
                style={{ height: '100%', width: '100%', objectFit: 'cover', display: 'block' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>No Photo</span>
              </div>
            )}
          </div>

          {/* Identity Card Academic Year Banner Strip */}
          <div
            className="identity-strip"
            style={{
              width: '145px',
              height: '27px',
              minHeight: '27px',
              backgroundColor: '#0B3092',
              color: '#ffffff',
              boxSizing: 'border-box',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '0px',
              paddingTop: '2px',
              paddingBottom: '4px',
              paddingLeft: '2px',
              paddingRight: '2px'
            }}
          >
            <span 
              style={{ 
                fontSize: '8.8px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                letterSpacing: '0.02em', 
                lineHeight: '1', 
                whiteSpace: 'nowrap',
                display: 'inline-block',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                paddingBottom: '2px'
              }}
            >
              IDENTITY CARD-{student.academicYear || '2026-2027'}
            </span>
          </div>

          {/* Student Name */}
          <h3 
            style={{ 
              fontSize: '18px', 
              fontWeight: '900', 
              letterSpacing: '0.01em', 
              textAlign: 'center', 
              color: '#D31027', 
              marginTop: '4px', 
              marginBottom: '4px', 
              lineHeight: '1.1',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {student.firstName} {student.lastName}
          </h3>

          {/* Student Information Table */}
          <div 
            style={{ 
              width: '100%', 
              fontSize: '11.5px', 
              color: '#000000', 
              lineHeight: '1.45', 
              fontWeight: '800', 
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif',
              paddingLeft: '2px',
              paddingRight: '2px'
            }}
          >
            {student.serialNo && (
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2px' }}>
                <span style={{ width: '102px', color: '#000000', fontWeight: '900', flexShrink: 0 }}>Reg. No</span>
                <span style={{ margin: '0 4px', fontWeight: '900' }}>:</span>
                <span style={{ flex: '1', color: '#000000', fontWeight: '900' }}>{student.serialNo}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2px' }}>
              <span style={{ width: '102px', color: '#000000', fontWeight: '900', flexShrink: 0 }}>Father's Name</span>
              <span style={{ margin: '0 4px', fontWeight: '900' }}>:</span>
              <span style={{ flex: '1', color: '#000000', fontWeight: '900' }}>Mr. {student.fatherName}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2px' }}>
              <span style={{ width: '102px', color: '#000000', fontWeight: '900', flexShrink: 0 }}>Class & Sec</span>
              <span style={{ margin: '0 4px', fontWeight: '900' }}>:</span>
              <span style={{ flex: '1', color: '#000000', fontWeight: '900' }}>{student.class} -{student.section}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2px' }}>
              <span style={{ width: '102px', color: '#000000', fontWeight: '900', flexShrink: 0 }}>Address</span>
              <span style={{ margin: '0 4px', fontWeight: '900' }}>:</span>
              <span style={{ flex: '1', color: '#000000', fontWeight: '900' }}>{student.address?.city || student.address?.current}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
              <span style={{ width: '102px', color: '#000000', fontWeight: '900', flexShrink: 0 }}>Mobile No</span>
              <span style={{ margin: '0 4px', fontWeight: '900' }}>:</span>
              <span style={{ flex: '1', color: '#000000', fontWeight: '900' }}>{student.fatherPhone || student.motherPhone || student.contactNo || ''}</span>
            </div>
          </div>
        </div>

        {/* 3. Principal Signature Row (Right Aligned Above Footer) */}
        <div 
          style={{ 
            width: '100%',
            display: 'flex', 
            justifyContent: 'flex-end',
            paddingRight: '6px',
            marginTop: '4px',
            marginBottom: '4px'
          }}
        >
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {signatureSrc ? (
              <img 
                src={signatureSrc} 
                alt="Principal Signature" 
                style={{ height: '26px', maxWidth: '85px', objectFit: 'contain', display: 'block', marginBottom: '1px' }}
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : null}
            <span 
              style={{ 
                fontSize: '10.5px', 
                fontWeight: '900', 
                color: '#0B3092', 
                letterSpacing: '0.01em',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              Principal Sig.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Dark Blue Footer Contact details banner */}
      <div 
        style={{
          width: '100%',
          backgroundColor: '#0B3092',
          color: '#ffffff',
          fontSize: '8px',
          padding: '5px 6px',
          textAlign: 'center',
          lineHeight: '1.25',
          fontWeight: '900',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          fontFamily: 'Arial, sans-serif',
          flexShrink: 0,
        }}
      >
        <p style={{ margin: 0, color: '#ffffff' }}>{branding.schoolAddress}</p>
        <p style={{ margin: 0, marginTop: '1px', color: '#ffffff' }}>
          MOB :- {branding.schoolPhone1}, {branding.schoolPhone2}
        </p>
      </div>
    </div>
  );
});

IDCardTemplate.displayName = 'IDCardTemplate';

export default IDCardTemplate;
