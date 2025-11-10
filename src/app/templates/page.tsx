"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';

// Toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // console.log(`${type.toUpperCase()}: ${message}`);
};

// --- Branding ---
const STITCHBYTE_PRIMARY = "#6C47FF";
const STITCHBYTE_ACCENT = "#F5F3FF";
const STITCHBYTE_DARK = "#2B1A5A";
const STITCHBYTE_LOGO = "/stitchbyte-logo.svg"; // Place your logo in public/
const FONT_FAMILY = "'Inter', 'Segoe UI', Arial, sans-serif";

// --- Category and Type options ---
const CATEGORY_OPTIONS = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
];

const HEADER_VARIABLE_TYPES = [
  { value: "none", label: "None" },
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
  { value: "location", label: "Location" },
];

const TYPE_OPTIONS: Record<string, { value: string; label: string; desc: string }[]> = {
  MARKETING: [
    { value: "custom", label: "Custom", desc: "General marketing template" },
    { value: "promotional", label: "Promotional", desc: "Promotional message" },
  ],
  UTILITY: [
    { value: "custom", label: "Custom", desc: "General utility template" },
    { value: "transactional", label: "Transactional", desc: "Transactional message" },
  ],
  AUTHENTICATION: [
    { value: "one_time_password", label: "One Time Password", desc: "OTP for authentication" },
    { value: "two_factor", label: "Two Factor", desc: "2FA message" },
  ],
};

// --- Helper for variable substitution ---
function renderPreview(body: string, samples: string[]) {
  return body.replace(/{{\s*(\d+)\s*}}/g, (_, idx) => samples[parseInt(idx) - 1] || "");
}

// --- Phone Preview Modal ---
function PhonePreviewModal({ template, onClose }: { template: any, onClose: () => void }) {
  if (!template) return null;
  
  // Debug: Log template structure to understand the data format
  // console.log('Template data structure:', template);
  
  const previewBody = (template.body || template.content || "").replace(/{{\s*(\d+)\s*}}/g, (_: string, idx: string) =>
    (template.samples && template.samples[parseInt(idx) - 1]) || ""
  );

  // Extract buttons from template - handle both parsed and string formats
  let buttons = [];
  if (template.buttons) {
    if (typeof template.buttons === 'string') {
      try {
        buttons = JSON.parse(template.buttons);
      } catch (e) {
        // console.log('Failed to parse buttons JSON:', e);
      }
    } else if (Array.isArray(template.buttons)) {
      buttons = template.buttons;
    }
  }

  // Get header media information - check multiple possible field names
  const headerVarType = template.headerVarType || template.header_var_type || template.headerType || 'none';
  
  // Check for header media URL from backend - support various field names including header_media.handle
  let headerMediaUrl = template.header_media?.handle || template.headerMediaUrl || template.header_media_url || template.headerUrl || template.media_url || template.header;
  
  // Check if header contains "Image: <url>" format
  const isImageHeader = typeof template.header === 'string' && template.header.toLowerCase().startsWith('image:');
  if (isImageHeader) {
    headerMediaUrl = template.header.substring(6).trim(); // Remove "Image:" and trim
  }
  
  // Auto-detect media type from URL if not explicitly set
  let detectedMediaType = template.header_media?.type || headerVarType;
  if (headerMediaUrl && detectedMediaType === 'none') {
    const url = headerMediaUrl.toLowerCase();
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
      detectedMediaType = 'image';
    } else if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm')) {
      detectedMediaType = 'video';
    } else if (url.includes('.pdf') || url.includes('.doc') || url.includes('.docx') || url.includes('.txt')) {
      detectedMediaType = 'document';
    }
  }
  
  const hasHeaderMedia = (detectedMediaType && detectedMediaType !== 'none') || headerMediaUrl || isImageHeader || template.header_media?.handle;
  
  // console.log('Template data structure:', template);
  // console.log('Header media object:', template.header_media);
  // console.log('Header var type:', headerVarType);
  // console.log('Detected media type:', detectedMediaType);
  // console.log('Header media URL:', headerMediaUrl);
  // console.log('Is image header:', isImageHeader);
  // console.log('Buttons array:', buttons);
  // console.log('Buttons length:', buttons.length);
  // console.log('Raw buttons from template:', template.buttons);
  
  // Sample media URLs for preview (you can replace these with actual media URLs)
  const getSampleMediaUrl = (type: string): string => {
    // If we have a real media URL from backend, use it
    if (headerMediaUrl) {
      return headerMediaUrl;
    }
    
    // Otherwise use placeholders
    switch (type) {
      case 'image':
        return 'https://via.placeholder.com/300x200/dcf8c6/075e54?text=Sample+Image';
      case 'video':
        return 'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4';
      case 'document':
        return '/file.svg'; // Using existing file icon
      default:
        return '/globe.svg'; // Default fallback image
    }
  };

  // Prevent click inside phone from closing modal
  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        className="absolute top-6 right-6 z-60 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 text-gray-700 hover:bg-white hover:text-red-500 transition-all duration-200"
        onClick={onClose}
        aria-label="Close"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      <div className="relative" onClick={handlePhoneClick}>
        {/* Modern Phone Frame */}
        <div className="relative w-[380px] h-[780px] rounded-[50px] bg-gradient-to-b from-gray-900 to-black shadow-2xl overflow-hidden border-8 border-gray-900">
          {/* Phone Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 z-30 w-36 h-7 bg-black rounded-b-3xl flex items-center justify-center gap-2">
            <div className="w-14 h-1 bg-gray-800 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          </div>

          {/* Status Bar */}
          <div className="absolute top-0 left-0 w-full flex items-center justify-between px-8 pt-2 z-20 text-xs font-medium text-white">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="white"><rect x="2" y="14" width="2" height="4" rx="1"/><rect x="6" y="12" width="2" height="6" rx="1"/><rect x="10" y="10" width="2" height="8" rx="1"/><rect x="14" y="8" width="2" height="10" rx="1"/></svg>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="white"><path d="M3 8c4.5-4 9.5-4 14 0M6 11c2.5-2 5.5-2 8 0M9 14c1-1 2-1 3 0"/><circle cx="10" cy="16" r="1"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M20 10h2v4h-2" fill="white"/></svg>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#008069] mt-8 relative z-10">
            <button className="text-white">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center text-white font-bold">
              S
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-base">StitchByte</div>
              <div className="text-[#d0f8ce] text-xs">online</div>
            </div>
            <button className="text-white">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Chat Background */}
          <div className="flex flex-col gap-3 px-4 py-6 h-[calc(100%-140px)] overflow-y-auto bg-[#efeae2] relative">
            {/* StitchByte Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-[40px] font-bold text-gray-300/20 select-none">
                StitchByte
              </div>
            </div>

            {/* Message Bubble */}
            <div className="flex items-end gap-2 justify-end relative z-10">
              <div className="max-w-[85%]">
                <div className="bg-[#d9fdd3] rounded-lg rounded-br-sm px-4 py-3 shadow-sm">
                  {/* Header Media */}
                  {hasHeaderMedia && (
                    <div className="mb-3 -mx-4 -mt-3 rounded-t-lg overflow-hidden">
                      {/* Image Media */}
                      {(detectedMediaType === 'image' || isImageHeader || (!detectedMediaType && headerMediaUrl && (headerMediaUrl.toLowerCase().includes('.jpg') || headerMediaUrl.toLowerCase().includes('.jpeg') || headerMediaUrl.toLowerCase().includes('.png') || headerMediaUrl.toLowerCase().includes('.gif') || headerMediaUrl.toLowerCase().includes('.webp')))) && (
                        <div className="relative">
                          <img 
                            src={headerMediaUrl || getSampleMediaUrl('image')} 
                            alt="Header Image" 
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/300x200/f0f0f0/888888?text=Image+Not+Found';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Video Media */}
                      {(detectedMediaType === 'video' || (!detectedMediaType && headerMediaUrl && (headerMediaUrl.toLowerCase().includes('.mp4') || headerMediaUrl.toLowerCase().includes('.mov') || headerMediaUrl.toLowerCase().includes('.avi') || headerMediaUrl.toLowerCase().includes('.webm')))) && (
                        <div className="relative w-full h-48 bg-black flex items-center justify-center overflow-hidden">
                          {headerMediaUrl ? (
                            <video 
                              src={headerMediaUrl} 
                              className="w-full h-48 object-cover"
                              controls={false}
                              muted
                            />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Document Media */}
                      {(detectedMediaType === 'document' || (!detectedMediaType && headerMediaUrl && (headerMediaUrl.toLowerCase().includes('.pdf') || headerMediaUrl.toLowerCase().includes('.doc') || headerMediaUrl.toLowerCase().includes('.docx') || headerMediaUrl.toLowerCase().includes('.txt')))) && (
                        <div className="w-full bg-white p-4 flex items-center gap-3">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg width="24" height="24" fill="#dc2626" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {headerMediaUrl ? headerMediaUrl.split('/').pop() || 'Document.pdf' : 'Sample Document.pdf'}
                            </div>
                            <div className="text-xs text-gray-500">PDF Document</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Location Media */}
                      {detectedMediaType === 'location' && (
                        <div className="w-full h-32 bg-green-50 flex items-center justify-center">
                          <div className="text-center">
                            <svg width="40" height="40" fill="#059669" viewBox="0 0 24 24" className="mx-auto mb-2">
                              <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/>
                            </svg>
                            <div className="text-sm text-green-700 font-medium">Location</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Header Text */}
                  {template.header && !isImageHeader && !template.header_media?.handle && (
                    <div className="font-bold text-sm mb-2 text-gray-900">
                      {template.header}
                    </div>
                  )}
                  
                  {/* Body */}
                  <div className="text-sm leading-relaxed text-gray-900 mb-1">
                    {previewBody}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[11px] text-gray-600">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.071 0.99L10.364 1.698L5 7.062L5.708 7.77L11.071 2.406L11.779 1.698L11.071 0.99Z" fill="#4FC3F7"/>
                      <path d="M6.586 8.484L5.879 7.776L2.879 4.776L2.172 5.483L5.172 8.483L6.586 8.484Z" fill="#4FC3F7"/>
                      <path d="M15.071 0.99L14.364 1.698L9 7.062L9.708 7.77L15.071 2.406L15.779 1.698L15.071 0.99Z" fill="#4FC3F7"/>
                      <path d="M13.657 2.813L9 7.47L8.293 6.762L12.95 2.105L13.657 2.813Z" fill="#4FC3F7"/>
                    </svg>
                  </div>
                  
                  {/* Buttons */}
                  {buttons && buttons.length > 0 && (
                    <div className="mt-3 -mx-4 -mb-3 border-t border-gray-200">
                      {buttons.map((button: any, index: number) => {
                        const buttonText = button.text || button.title || button.display_text || button.name || `Button ${index + 1}`;
                        const buttonType = button.type || button.button_type || 'QUICK_REPLY';
                        const buttonUrl = button.url || button.link || button.href;
                        const buttonPhone = button.phone_number || button.phone;
                        
                        const isUrlButton = buttonType.toUpperCase().includes('URL') || buttonType.toUpperCase().includes('LINK') || buttonUrl;
                        const isPhoneButton = buttonType.toUpperCase().includes('PHONE') || buttonType.toUpperCase().includes('CALL') || buttonPhone;
                        
                        return (
                          <button
                            key={index}
                            className="w-full px-4 py-3 text-sm font-medium text-center text-[#008069] hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center justify-center gap-2"
                          >
                            {isUrlButton && (
                              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                              </svg>
                            )}
                            {isPhoneButton && (
                              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                              </svg>
                            )}
                            <span className="truncate">{buttonText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Footer */}
                  {template.footer && (
                    <div className="text-xs text-gray-600 border-t border-gray-200 pt-2 mt-2 -mx-4 px-4">
                      {template.footer}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <div className="absolute bottom-0 left-0 w-full px-3 py-2 bg-[#f0f2f5] flex items-center gap-2">
            <button className="text-gray-600 p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"/>
              </svg>
            </button>
            <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-500">
              Message
            </div>
            <button className="text-gray-600 p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MetaTemplateModalWithReview ---
function detectVariableType(text: string) {
  const named = text.match(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g);
  const numbered = text.match(/{{\s*\d+\s*}}/g);
  if (named && named.length > 0) return 'named';
  if (numbered && numbered.length > 0) return 'numbered';
  return 'none';
}

function MetaTemplateModalWithReview({ form, setForm, formErrors, setFormErrors, submitLoading, successMsg, errorMsg, handleFormChange, handleSubmit, setShowModal }: any) {
  const [step, setStep] = React.useState(1);
  const variableType = detectVariableType(form.body || '');
  const variableWarning = variableType === 'named' ? 'Meta only accepts numbered variables like {{1}}, {{2}}. Please update your template.' : '';
  // Extract variables from body (named or numbered)
  const variableMatches = (form.body.match(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*|\d+)\s*}}/g) || []);
  // Ensure samples array matches variable count
  React.useEffect(() => {
    if (variableMatches.length !== (form.samples?.length || 0)) {
      setForm((prev: any) => ({
        ...prev,
        samples: variableMatches.map((v: string, i: number) => prev.samples?.[i] || "")
      }));
    }
    // eslint-disable-next-line
  }, [form.body]);

  const handleSampleChange = (idx: number, value: string) => {
    setForm((prev: any) => {
      const samples = [...(prev.samples || [])];
      samples[idx] = value;
      return { ...prev, samples };
    });
  };

  const handleHeaderVarTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev: any) => ({ ...prev, headerVarType: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-[#050505]/60 flex items-center justify-center z-50">
      <div className="bg-white text-[#050505] rounded-2xl shadow-2xl max-w-5xl w-full relative max-h-[95vh] flex overflow-y-auto border border-[#e4e6eb]" style={{ fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", minWidth: 900 }}>
        <button className="absolute top-4 right-4 text-[#65676b] text-2xl hover:text-[#e55353] transition z-10" onClick={() => setShowModal(false)} aria-label="Close">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#f0f2f5"/><path d="M8 8l8 8M16 8l-8 8" stroke="#65676b" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        {/* Left: Form or Review */}
        <div className="flex-1 p-10 min-w-[350px]">
          <h3 className="text-2xl font-semibold mb-7 tracking-tight">Create Template</h3>
          {/* Category Tabs */}
          <div className="flex gap-2 mb-7 border-b border-[#e4e6eb]">
            {CATEGORY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`px-5 py-2 rounded-t-lg font-medium border-b-2 transition text-base ${form.category === opt.value ? 'border-[#1877f2] text-[#1877f2] bg-[#e7f3ff]' : 'border-transparent text-[#65676b] bg-white hover:bg-[#f0f2f5]'}`}
                onClick={() => {
                  setForm((prev: any) => ({
                    ...prev,
                    category: opt.value,
                    type: TYPE_OPTIONS[opt.value][0].value
                  }));
                }}
                type="button"
                aria-pressed={form.category === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Type Selection */}
          <div className="mb-7">
            <div className="font-medium mb-2 text-[#65676b]">Type</div>
            <div className="flex flex-col gap-2">
              {TYPE_OPTIONS[form.category].map(typeOpt => (
                <label key={typeOpt.value} className="flex items-center gap-3 cursor-pointer text-base">
                  <input
                    type="radio"
                    name="type"
                    value={typeOpt.value}
                    checked={form.type === typeOpt.value}
                    onChange={handleFormChange}
                    className="accent-[#1877f2] w-4 h-4"
                  />
                  <span className="font-medium text-[#050505]">{typeOpt.label}</span>
                  <span className="text-xs text-[#65676b]">{typeOpt.desc}</span>
                </label>
              ))}
            </div>
          </div>
          {step === 1 ? (
            <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="space-y-5">
              <div>
                <label className="block font-medium mb-1 text-[#65676b]">Template Name</label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange} className="w-full border border-[#e4e6eb] rounded-lg p-2.5 bg-[#f0f2f5] focus:border-[#1877f2] focus:bg-white outline-none transition" />
                {formErrors.name && <div className="text-[#e55353] text-xs mt-1">{formErrors.name}</div>}
              </div>
              {/* Header Variable Type Dropdown */}
              <div>
                <label className="block font-medium mb-1 text-[#65676b]">Header Variable Type</label>
                <select name="headerVarType" value={form.headerVarType || "none"} onChange={handleHeaderVarTypeChange} className="w-full border border-[#e4e6eb] rounded-lg p-2.5 bg-[#f0f2f5] focus:border-[#1877f2] focus:bg-white outline-none transition">
                  {HEADER_VARIABLE_TYPES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1 text-[#65676b]">Header <span className="text-xs text-[#b0b3b8]">(optional)</span></label>
                <input type="text" name="header" value={form.header} onChange={handleFormChange} className="w-full border border-[#e4e6eb] rounded-lg p-2.5 bg-[#f0f2f5] focus:border-[#1877f2] focus:bg-white outline-none transition" />
              </div>
              <div>
                <label className="block font-medium mb-1 text-[#65676b]">Body</label>
                <textarea name="body" value={form.body} onChange={handleFormChange} className="w-full border border-[#e4e6eb] rounded-lg p-2.5 min-h-[80px] bg-[#f0f2f5] focus:border-[#1877f2] focus:bg-white outline-none transition" />
                {formErrors.body && <div className="text-[#e55353] text-xs mt-1">{formErrors.body}</div>}
              </div>
              {/* Samples for body content */}
              {variableMatches.length > 0 && (
                <div className="mt-6">
                  <div className="font-semibold text-lg mb-1 text-[#050505]">Samples for body content</div>
                  <div className="text-[#65676b] mb-4 text-base">To help us review your message template, please add an example for each variable in your body text. Do not use real customer information. Cloud API hosted by Meta reviews templates and variable parameters to protect the security and integrity of our services.</div>
                  {variableMatches.map((v: string, idx: number) => (
                    <div key={v} className="flex items-center gap-3 mb-3">
                      <span className="text-[#050505] text-base min-w-[120px]">{v}</span>
                      <input
                        type="text"
                        className="flex-1 border border-[#e4e6eb] rounded-lg p-2.5 bg-[#f0f2f5] focus:border-[#1877f2] focus:bg-white outline-none transition"
                        placeholder={`Enter content for ${v}`}
                        value={form.samples?.[idx] || ""}
                        onChange={e => handleSampleChange(idx, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block font-medium mb-1 text-[#65676b]">Footer <span className="text-xs text-[#b0b3b8]">(optional)</span></label>
                <input type="text" name="footer" value={form.footer} onChange={handleFormChange} className="w-full border border-[#e4e6eb] rounded-lg p-2.5 bg-[#f0f2f5] focus:border-[#1877f2] focus:bg-white outline-none transition" />
              </div>
              <div className="flex justify-between mt-8">
                <button type="button" className="bg-[#e4e6eb] text-[#65676b] font-semibold px-6 py-2 rounded-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="bg-[#1877f2] text-white font-semibold px-6 py-2 rounded-full shadow hover:bg-[#166fe0] transition disabled:opacity-60" disabled={submitLoading}>Review</button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-6">
                <div className="font-medium mb-1 text-[#65676b]">Review Template</div>
                <div className="p-4 bg-[#f0f2f5] rounded-lg border border-[#e4e6eb] whitespace-pre-line text-base text-[#050505]">
                  {form.body}
                </div>
                {variableWarning && <div className="text-[#e55353] text-xs mt-2 font-semibold">{variableWarning}</div>}
              </div>
              <div className="mb-4">
                <div className="font-medium text-[#65676b]">Category</div>
                <div className="text-base text-[#1877f2] font-semibold">{form.category}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-[#65676b]">Type</div>
                <div className="text-base text-[#1877f2] font-semibold">{form.type}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-[#65676b]">Header Variable Type</div>
                <div className="text-base text-[#1877f2] font-semibold">{HEADER_VARIABLE_TYPES.find((opt: any) => opt.value === (form.headerVarType || "none"))?.label}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-[#65676b]">Variable Type</div>
                <div className="text-base text-[#1877f2] font-semibold">{variableType === 'none' ? 'None' : variableType.charAt(0).toUpperCase() + variableType.slice(1)}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-[#65676b]">Variables Detected</div>
                <div className="text-base text-[#1877f2] font-semibold">{variableMatches.join(', ') || 'None'}</div>
              </div>
              {variableMatches.length > 0 && (
                <div className="mb-4">
                  <div className="font-medium text-[#65676b]">Sample Values</div>
                  <div className="flex flex-col gap-2 mt-2">
                    {variableMatches.map((v: string, idx: number) => (
                      <div key={v} className="flex items-center gap-3">
                        <span className="text-[#050505] text-base min-w-[120px]">{v}</span>
                        <span className="text-base text-[#65676b]">{form.samples?.[idx] || <span className="italic text-[#b0b3b8]">(no sample)</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-8">
                <button type="button" className="bg-[#e4e6eb] text-[#65676b] font-semibold px-6 py-2 rounded-full" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="bg-[#1877f2] text-white font-semibold px-6 py-2 rounded-full shadow hover:bg-[#166fe0] transition disabled:opacity-60" disabled={submitLoading || variableType === 'named'} onClick={handleSubmit}>Submit to Meta</button>
              </div>
              {successMsg && <div className="text-[#31a24c] text-center mt-3">{successMsg}</div>}
              {errorMsg && <div className="text-[#e55353] text-center mt-3">{errorMsg}</div>}
            </div>
          )}
        </div>
        {/* Right: Live Preview */}
        <div className="hidden md:flex flex-col items-center justify-center bg-[#f0f2f5] min-w-[350px] max-w-[400px] border-l border-[#e4e6eb] p-8">
          <div className="w-full max-w-xs bg-white rounded-xl shadow border border-[#e4e6eb] p-6">
            <div className="font-semibold text-lg mb-2 text-[#1877f2]">{form.header || "Template preview"}</div>
            <div className="mb-3 text-base whitespace-pre-line text-[#050505]">{form.body || "Your message body will appear here."}</div>
            {form.footer && <div className="text-xs text-[#65676b] border-t border-[#e4e6eb] pt-2 mt-2">{form.footer}</div>}
            <div className="mt-4 flex flex-wrap gap-2">
              {(form.body.match(/{{.*?}}/g) || []).map((v: string, idx: number) => (
                <span key={idx} className="bg-[#e4e6eb] px-2 py-1 rounded text-xs text-[#65676b]">{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function TemplatesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadingSteps = [
    { name: "Connecting", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { name: "Authenticating", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { name: "Fetching Templates", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
    { name: "Processing Data", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
    { name: "Ready", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }
  ];

  React.useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;
    
    setTemplatesLoading(true);
    setLoadingStep(0);
    
    // Animate through loading steps (2 seconds each)
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < 4) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    try {
      const data = await apiService.getOptional('/templates');
      
      // Wait for minimum loading animation to complete (5 steps x 2 seconds = 10 seconds)
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      clearInterval(stepInterval);
      setLoadingStep(4); // Set to "Ready" step
      
      // Small delay before showing content
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (data) {
        const templatesData = data.templates || data || [];
        // Filter templates by user's company for security
        const userTemplates = templatesData.filter((template: any) => 
          template.companyId === user.companyId || !template.companyId // Include legacy templates without companyId
        );
        setTemplates(userTemplates);
      } else {
        // Templates endpoint not available
        setTemplates([]);
      }
      setIsInitialLoad(false);
    } catch (error) {
      clearInterval(stepInterval);
      // On error, keep looping through steps until retry (2 seconds each)
      const retryInterval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 5);
      }, 2000);
      
      // Retry after 10 seconds
      setTimeout(() => {
        clearInterval(retryInterval);
        fetchTemplates();
      }, 10000);
      return;
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCardClick = (tpl: any) => {
    setSelectedTemplate(tpl);
    setShowPreviewModal(true);
  };

  // --- UI ---
  return (
    <section className="min-h-screen bg-gray-50" style={{ fontFamily: FONT_FAMILY }}>
      {/* Show loading animation on initial load */}
      {isInitialLoad && templatesLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-6">
            {/* Circular Progress with Icon */}
            <div className="relative w-32 h-32">
              {/* Circular Progress Ring */}
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#2A8B8A"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - (loadingStep + 1) / 5)}`}
                  className="transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Icon in Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-[#2A8B8A] rounded-full flex items-center justify-center animate-pulse">
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d={loadingSteps[loadingStep].icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Step Name */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {loadingSteps[loadingStep].name}
              </h3>
              <p className="text-gray-600">
                Step {loadingStep + 1} of 5
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center gap-2">
              {loadingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index <= loadingStep ? 'w-8 bg-[#2A8B8A]' : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating Action Button for Mobile */}
      <button
        className="fixed bottom-8 right-8 z-40 md:hidden bg-[#2A8B8A] text-white rounded-full shadow-xl p-4"
        onClick={() => router.push("/templates/create")}
        aria-label="Create Template"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
          <path d="M14 7v14M7 14h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Main Content */}
      <div className="mx-auto relative z-10 px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
                Templates
              </h1>
              <p className="text-gray-600 text-base">
                Manage your WhatsApp message templates
              </p>
            </div>
            <button
              className="flex items-center justify-center gap-2 bg-[#2A8B8A] text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
              onClick={() => router.push("/templates/create")}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path d="M10 5v10M5 10h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span>Create New Template</span>
            </button>
          </div>

          {/* Templates Grid */}
          {templatesLoading && !isInitialLoad ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[#2A8B8A]/20 border-t-[#2A8B8A] rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading templates...</p>
            </div>
          ) : (
            <>
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="w-24 h-24 bg-[#2A8B8A]/10 rounded-2xl flex items-center justify-center mb-6">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="text-[#2A8B8A]">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No templates yet</h3>
                  <p className="text-gray-600 text-center max-w-md mb-6">
                    Create your first message template to get started
                  </p>
                  <button
                    className="flex items-center gap-2 bg-[#2A8B8A] text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                    onClick={() => router.push("/templates/create")}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path d="M10 5v10M5 10h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Create Your First Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {templates.map((tpl, index) => (
                    <div
                      key={tpl.name}
                      className="relative bg-white rounded-xl shadow-sm cursor-pointer overflow-hidden"
                      onClick={() => handleCardClick(tpl)}
                      style={{ 
                        animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both`
                      }}
                    >
                      {/* Card Content */}
                      <div className="p-6">
                        {/* Header with Icon and Status */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-11 h-11 bg-[#2A8B8A] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-white">
                                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {tpl.name}
                              </h3>
                            </div>
                          </div>
                          <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ml-2
                            ${tpl.status?.toLowerCase() === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : tpl.status?.toLowerCase() === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse
                              ${tpl.status?.toLowerCase() === 'pending'
                                ? 'bg-amber-500'
                                : tpl.status?.toLowerCase() === 'approved'
                                ? 'bg-emerald-500'
                                : 'bg-red-500'
                              }`}></span>
                            {tpl.status?.toLowerCase()}
                          </span>
                        </div>

                        {/* Header Text */}
                        {tpl.header && (
                          <div className="mb-3 p-3 bg-[#2A8B8A]/5 rounded-lg">
                            <p className="text-sm font-semibold text-[#2A8B8A] line-clamp-2">
                              {tpl.header}
                            </p>
                          </div>
                        )}

                        {/* Body Preview */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">
                            {tpl.body || tpl.content}
                          </p>
                        </div>

                        {/* Footer with Variables and Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                            {(tpl.variables || tpl.example_variables || []).slice(0, 3).map((v: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] rounded-md text-xs font-semibold">
                                <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                                  <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {v.replace(/[{}]/g, "")}
                              </span>
                            ))}
                            {(tpl.variables || tpl.example_variables || []).length > 3 && (
                              <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">
                                +{(tpl.variables || tpl.example_variables || []).length - 3}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[#2A8B8A] font-semibold text-sm ml-3 flex-shrink-0">
                            <span>View</span>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Phone Preview Modal */}
      {showPreviewModal && (
        <PhonePreviewModal
          template={selectedTemplate}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

// Wrap the component with ProtectedRoute for security
const ProtectedTemplatesPage = () => {
  return (
    <ProtectedRoute>
      <TemplatesPage />
    </ProtectedRoute>
  );
};

export default ProtectedTemplatesPage;
