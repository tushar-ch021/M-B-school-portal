import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, RefreshCw, CheckCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const PhotoCapture = ({ onPhotoSelect, initialPreviewUrl = '' }) => {
  const [mode, setMode] = useState('upload'); // 'upload' or 'camera'
  const [preview, setPreview] = useState(initialPreviewUrl);
  const [cameraActive, setCameraActive] = useState(false);
  
  const webcamRef = useRef(null);

  const videoConstraints = {
    width: 480,
    height: 480,
    facingMode: 'user'
  };

  // Convert File object to base64 for previewing
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image is too large (maximum 15MB allowed)');
      return;
    }

    // Pass the raw file directly to the parent form handlers
    onPhotoSelect({ file, base64: null });

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Webcam Capture screenshot logic
  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error('Failed to capture screenshot from camera');
      return;
    }

    setPreview(imageSrc);
    setCameraActive(false);
    
    // Send base64 to parent form handlers
    onPhotoSelect({ file: null, base64: imageSrc });
    toast.success('Photo captured successfully');
  }, [webcamRef, onPhotoSelect]);

  const handleRetake = () => {
    setPreview('');
    onPhotoSelect({ file: null, base64: null });
    if (mode === 'camera') {
      setCameraActive(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Student Photo Configuration
      </label>

      {/* Mode selectors toggles */}
      <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('upload');
            setCameraActive(false);
          }}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
            mode === 'upload' ? 'bg-white text-navy-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Image
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('camera');
            if (!preview) setCameraActive(true);
          }}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
            mode === 'camera' ? 'bg-white text-navy-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          Use Camera
        </button>
      </div>

      {/* Media Capture/Upload Box viewport */}
      <div className="relative flex h-60 w-60 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 shadow-inner">
        {preview ? (
          <div className="relative h-full w-full">
            <img 
              src={preview} 
              alt="Student Preview" 
              className="h-full w-full object-cover" 
            />
            <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1 text-white shadow-xs">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
        ) : mode === 'camera' && cameraActive ? (
          <div className="h-full w-full">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-gray-400 p-4">
            <ImageIcon className="h-10 w-10 text-gray-300" />
            <p className="text-xs">No image selected or captured yet</p>
          </div>
        )}
      </div>

      {/* Actions Triggers */}
      <div className="flex gap-2">
        {preview ? (
          <button
            type="button"
            onClick={handleRetake}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Photo
          </button>
        ) : mode === 'camera' ? (
          cameraActive ? (
            <button
              type="button"
              onClick={handleCapture}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              <Camera className="h-3.5 w-3.5" />
              Capture Photo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCameraActive(true)}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              <Camera className="h-3.5 w-3.5" />
              Start Webcam
            </button>
          )
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800">
            <Upload className="h-3.5 w-3.5" />
            Select File
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default PhotoCapture;
