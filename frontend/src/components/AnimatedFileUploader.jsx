import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Check, X, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function AnimatedFileUploader({
  files = [],
  previews = [],
  onFilesSelected,
  onRemoveFile,
  isUploading = false,
  uploadProgress = 0,
  maxFiles = 5,
  acceptedTypes = 'image/*',
  customSubtext,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const fileInputRef = useRef(null);
  const animationTimerRef = useRef(null);

  // Clean up any running timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, []);

  // Synchronize when external upload/scanning is happening
  useEffect(() => {
    if (isUploading) {
      setIsSending(true);
      setCurrentProgress(uploadProgress > 0 ? uploadProgress : 68);
    } else if (!animationTimerRef.current) {
      setIsSending(false);
    }
  }, [isUploading, uploadProgress]);

  // Smooth realistic progress animation
  const playUploadProgress = () => {
    if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    setIsSending(true);
    setCurrentProgress(20);

    let progress = 20;
    animationTimerRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 22 + 16);
      if (progress >= 100) {
        progress = 100;
        setCurrentProgress(100);
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
        setTimeout(() => {
          setIsSending(false);
          setCurrentProgress(0);
        }, 700);
      } else {
        setCurrentProgress(progress);
      }
    }, 180);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onFilesSelected) {
        onFilesSelected({ target: { files: e.dataTransfer.files } });
      }
      playUploadProgress();
    }
  };

  const handleFileChange = (e) => {
    const incomingFiles = e?.target?.files ? Array.from(e.target.files) : [];
    if (incomingFiles.length === 0) return;

    // Immediately pass files to parent without any delay
    if (onFilesSelected) {
      onFilesSelected(e);
    }

    // Reset input value to prevent stale repeated events
    if (e.target) {
      e.target.value = '';
    }

    // Play smooth sending animation
    playUploadProgress();
  };

  const handleClickPill = () => {
    if (!isSending && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Outer Card with Dashed Border & Tech Grid Pattern */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full rounded-3xl border-2 border-dashed transition-all duration-500 overflow-hidden tech-grid-pattern p-6 sm:p-10 flex flex-col items-center justify-center select-none ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
            : isSending
            ? 'border-emerald-400 bg-emerald-50/40 shadow-inner'
            : 'border-emerald-300 hover:border-emerald-400 bg-white/80 shadow-xs'
        }`}
      >
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileChange}
          id="animated-file-upload-input"
          className="hidden"
        />



        {/* STAGE: Stacked Center Elements Matching the Reference Design Exactly */}
        <div className="relative w-full max-w-md h-72 sm:h-80 flex flex-col items-center justify-center">
          {/* Radial Center Glow */}
          <div
            className={`absolute w-56 h-56 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
              isSending ? 'bg-emerald-400/30 scale-110' : 'bg-emerald-300/20 scale-95'
            }`}
          ></div>

          {/* Sonar Ripple Waves when Sending */}
          {isSending && (
            <>
              <div className="absolute w-52 h-52 rounded-full border border-emerald-400/50 pointer-events-none animate-sonar-1"></div>
              <div className="absolute w-52 h-52 rounded-full border border-teal-300/40 pointer-events-none animate-sonar-2"></div>
            </>
          )}

          {/* Concentric Outer Circle with Orbiting Satellite Dots */}
          <div
            className={`absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-slate-300/90 pointer-events-none ${
              isSending ? 'animate-orbit-cw-fast' : 'animate-orbit-cw'
            }`}
          >
            {/* 4 Satellite Dots located precisely at 45°, 135°, 225°, 315° as in the reference */}
            <div className="absolute top-[14%] right-[14%] w-3 h-3 rounded-full bg-[#047857] shadow-[0_0_10px_rgba(4,120,87,0.9)] ring-2 ring-white/80"></div>
            <div className="absolute bottom-[14%] right-[14%] w-3 h-3 rounded-full bg-[#047857] shadow-[0_0_10px_rgba(4,120,87,0.9)] ring-2 ring-white/80"></div>
            <div className="absolute bottom-[14%] left-[14%] w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_8px_rgba(5,150,105,0.9)] ring-2 ring-white/80"></div>
            <div className="absolute top-[14%] left-[14%] w-2.5 h-2.5 rounded-full bg-[#047857] shadow-[0_0_8px_rgba(4,120,87,0.9)] ring-2 ring-white/80"></div>
          </div>

          {/* Concentric Inner Circle (Opposite Rotation) */}
          <div
            className={`absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full border border-emerald-300/50 pointer-events-none ${
              isSending ? 'animate-orbit-ccw opacity-100' : 'animate-orbit-ccw opacity-70'
            }`}
          >
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-700 shadow-[0_0_6px_rgba(13,148,136,0.8)]"></div>
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-700 shadow-[0_0_6px_rgba(13,148,136,0.8)]"></div>
          </div>

          {/* 1. TOP LABEL: • READY TO UPLOAD (Positioned above pill, exactly like reference) */}
          <div className="z-10 mb-4 transition-all duration-300">
            <div className="inline-flex items-center space-x-2 text-[12px] sm:text-[13px] font-bold tracking-[0.22em] text-slate-600 uppercase">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isSending
                    ? 'bg-amber-500 scale-125 animate-ping'
                    : isDragging
                    ? 'bg-sky-500 animate-pulse'
                    : 'bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.9)]'
                }`}
              ></span>
              <span className={isSending ? 'text-amber-700' : 'text-slate-600'}>
                {isDragging
                  ? 'Drop to Upload'
                  : isSending
                  ? `Sending File (${currentProgress}%)...`
                  : files.length > 0
                  ? `${files.length} File(s) Ready`
                  : 'Ready to Upload'}
              </span>
            </div>
          </div>

          {/* 2. CENTER PILL: Lush Gradient "Sending File" Button (Exact visual style from reference) */}
          <div className="z-10 my-1">
            <button
              type="button"
              onClick={handleClickPill}
              className={`group relative inline-flex items-center space-x-3.5 px-8 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                isSending
                  ? 'bg-gradient-to-r from-[#2dd4bf] via-[#10b981] to-[#059669] scale-105 shadow-[0_14px_30px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#059669] hover:from-[#2dd4bf] hover:via-[#10b981] hover:to-[#047857] shadow-[0_12px_26px_rgba(16,185,129,0.4)] hover:shadow-[0_16px_32px_rgba(16,185,129,0.55)] hover:scale-[1.03] active:scale-[0.98]'
              }`}
            >
              {/* Embossed Upload Icon on Left */}
              <div className="w-7 h-7 rounded-xl bg-black/10 flex items-center justify-center text-[#064e3b] transition-transform duration-300 group-hover:-translate-y-0.5">
                <UploadCloud className={`w-4 h-4 text-[#064e3b] stroke-[2.7] ${isSending ? 'animate-arrow-float' : ''}`} />
              </div>

              {/* Pill Text: "Sending File" */}
              <span className="text-sm sm:text-base font-extrabold text-[#064e3b] tracking-tight">
                {isSending
                  ? 'Sending File'
                  : files.length > 0
                  ? 'Add More Photos'
                  : 'Sending File'}
              </span>

              {/* Specular Highlight Sheen */}
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/20 to-white/35 pointer-events-none opacity-60 group-hover:opacity-85 transition-opacity"></span>
            </button>
          </div>

          {/* 3. BOTTOM LABEL: • Uploading your file... (Positioned below pill, exactly like reference) */}
          <div className="z-10 mt-4 transition-all duration-300">
            <div className="inline-flex items-center space-x-2 text-xs sm:text-[13px] font-semibold text-amber-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSending ? 'bg-amber-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span>
                {isSending
                  ? 'Uploading your file...'
                  : files.length > 0
                  ? 'File attached successfully • Ready to submit'
                  : 'Uploading your file...'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar when Sending */}
        {isSending && (
          <div className="w-full max-w-xs mt-1 bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
        )}

        {/* Subtitle File Limits */}
        <p className="text-[11px] text-slate-500 font-medium text-center mt-2">
          {customSubtext || 'JPEG, PNG or WebP (up to 5 images, max 10MB each)'}
        </p>
      </div>

      {/* Uploaded Photos Preview Strip */}
      {previews && previews.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span className="flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attached Photo Evidence ({previews.length}/{maxFiles})</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Ready for Submission</span>
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {previews.map((preview, idx) => (
              <div
                key={idx}
                className="relative group rounded-2xl overflow-hidden h-24 border border-slate-200 bg-slate-100 shadow-xs hover:border-emerald-400 transition"
              >
                <img
                  src={preview}
                  alt={`Upload preview ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 rounded-full text-white transition shadow-sm"
                    title="Remove this photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                  <span className="text-[9px] text-white font-medium px-1 truncate block">
                    Photo #{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
