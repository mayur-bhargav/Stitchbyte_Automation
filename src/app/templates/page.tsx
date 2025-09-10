"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';

// Toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
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
  console.log('Template data structure:', template);
  
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
        console.log('Failed to parse buttons JSON:', e);
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
  
  console.log('Template data structure:', template);
  console.log('Header media object:', template.header_media);
  console.log('Header var type:', headerVarType);
  console.log('Detected media type:', detectedMediaType);
  console.log('Header media URL:', headerMediaUrl);
  console.log('Is image header:', isImageHeader);
  console.log('Buttons array:', buttons);
  console.log('Buttons length:', buttons.length);
  console.log('Raw buttons from template:', template.buttons);
  
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      {/* Close Button outside phone */}
      <button
        className="absolute top-8 right-8 z-60 bg-white rounded-full shadow p-1 text-[#6C47FF] hover:text-red-500"
        onClick={onClose}
        aria-label="Close"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#f0f2f5"/>
          <path d="M8 8l8 8M16 8l-8 8" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="relative" onClick={handlePhoneClick}>
        {/* Phone Frame */}
        <div className="relative w-[350px] h-[700px] rounded-[40px] bg-[#075e54] shadow-2xl overflow-hidden border-4 border-[#ece6ff]">
          {/* iPhone Status Bar */}
          <div className="absolute top-0 left-0 w-full flex items-center justify-between px-6 pt-3 z-30 text-[13px] font-medium text-[#fff] select-none">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              {/* Cellular */}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="14" width="2" height="4" rx="1" fill="#fff"/><rect x="6" y="12" width="2" height="6" rx="1" fill="#fff"/><rect x="10" y="10" width="2" height="8" rx="1" fill="#fff"/><rect x="14" y="8" width="2" height="10" rx="1" fill="#fff"/></svg>
              {/* WiFi */}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 8c4.5-4 9.5-4 14 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 11c2.5-2 5.5-2 8 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 14c1-1 2-1 3 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="16" r="1" fill="#fff"/></svg>
              {/* Battery */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="18" height="12" rx="4" fill="#fff" stroke="#fff" strokeWidth="1.5"/><rect x="20" y="10" width="2" height="4" rx="1" fill="#fff"/><rect x="4" y="8" width="14" height="8" rx="2" fill="#b6e388"/></svg>
            </div>
          </div>
          {/* iPhone Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20 w-24 h-6 bg-black flex items-center justify-center rounded-[16px]">
            <div className="w-2 h-2 bg-[#222] rounded-full mx-1"></div>
            <div className="w-10 h-1 bg-[#444] rounded-full mx-1"></div>
          </div>
          {/* WhatsApp Top Bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#075e54] h-[56px] rounded-t-[36px] mt-12">
            <div className="w-9 h-9 rounded-full bg-[#25d366] flex items-center justify-center text-white font-bold text-lg">S</div>
            <div>
              <div className="text-white font-semibold text-base leading-tight">StitchByte</div>
              <div className="text-[#d0f8ce] text-xs">online</div>
            </div>
            <div className="ml-auto flex gap-2">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 12h6M12 16h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12H2m4-4H2m4 8H2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          {/* Chat area */}
          <div className="flex flex-col gap-3 px-3 py-4 h-[calc(100%-56px-60px)] overflow-y-auto bg-[#ece5dd]">
            {/* Received bubble */}
            {/* <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center text-white font-bold text-base">S</div>
              <div className="max-w-[70%]">
                <div className="rounded-br-2xl rounded-tr-2xl rounded-tl-md bg-[#fff] text-[#222] px-4 py-3 text-[15px] shadow" style={{borderBottomLeftRadius: 8}}>
                  {previewBody}
                </div>
              </div>
            </div> */}
            <div className="flex items-end gap-2 justify-end">
              <div className="max-w-[70%]">
                <div className="rounded-bl-2xl rounded-tl-2xl rounded-tr-md bg-[#dcf8c6] text-[#222] px-4 py-3 text-[15px] shadow" style={{borderBottomRightRadius: 8}}>
                  {/* Header Media */}
                  {hasHeaderMedia && (
                    <div className="mb-3 -mx-4 -mt-3">
                      {/* Image Media */}
                      {(detectedMediaType === 'image' || isImageHeader || (!detectedMediaType && headerMediaUrl && (headerMediaUrl.toLowerCase().includes('.jpg') || headerMediaUrl.toLowerCase().includes('.jpeg') || headerMediaUrl.toLowerCase().includes('.png') || headerMediaUrl.toLowerCase().includes('.gif') || headerMediaUrl.toLowerCase().includes('.webp')))) && (
                        <div className="relative">
                          <img 
                            src={headerMediaUrl || getSampleMediaUrl('image')} 
                            alt="Header Image" 
                            className="w-full h-40 object-cover rounded-t-xl"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/300x200/f0f0f0/888888?text=Image+Not+Found';
                            }}
                          />
                          {/* WhatsApp-style image overlay */}
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>Image</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Video Media */}
                      {(detectedMediaType === 'video' || (!detectedMediaType && headerMediaUrl && (headerMediaUrl.toLowerCase().includes('.mp4') || headerMediaUrl.toLowerCase().includes('.mov') || headerMediaUrl.toLowerCase().includes('.avi') || headerMediaUrl.toLowerCase().includes('.webm')))) && (
                        <div className="relative w-full h-40 bg-gray-900 rounded-t-xl flex items-center justify-center overflow-hidden">
                          {headerMediaUrl ? (
                            <video 
                              src={headerMediaUrl} 
                              className="w-full h-40 object-cover"
                              controls={false}
                              muted
                              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white'%3EVideo%3C/text%3E%3C/svg%3E"
                            />
                          ) : (
                            <svg width="60" height="60" fill="white" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                          {/* Video duration overlay */}
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            0:30
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Document Media */}
                      {(detectedMediaType === 'document' || (!detectedMediaType && headerMediaUrl && (headerMediaUrl.toLowerCase().includes('.pdf') || headerMediaUrl.toLowerCase().includes('.doc') || headerMediaUrl.toLowerCase().includes('.docx') || headerMediaUrl.toLowerCase().includes('.txt')))) && (
                        <div className="w-full h-20 bg-white rounded-t-xl flex items-center justify-start px-4 border border-gray-200">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                            <svg width="24" height="24" fill="#dc2626" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {headerMediaUrl ? headerMediaUrl.split('/').pop() || 'Document.pdf' : 'Sample Document.pdf'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {headerMediaUrl && headerMediaUrl.toLowerCase().includes('.pdf') ? 'PDF Document' : 'Document'}
                            </div>
                          </div>
                          <div className="text-gray-400">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Location Media */}
                      {detectedMediaType === 'location' && (
                        <div className="w-full h-32 bg-green-50 rounded-t-xl flex items-center justify-center border border-green-200">
                          <div className="text-center">
                            <svg width="40" height="40" fill="#059669" viewBox="0 0 24 24" className="mx-auto mb-2">
                              <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/>
                            </svg>
                            <div className="text-sm text-green-700 font-medium">Live Location</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Header Text */}
                  {template.header && !isImageHeader && !template.header_media?.handle && (
                    <div className="font-semibold text-[14px] mb-2 text-[#075e54]">
                      {template.header}
                    </div>
                  )}
                  
                  {/* Body */}
                  <div className="mb-2 text-[15px] leading-relaxed">
                    {previewBody}
                  </div>
                  
                  {/* Message timestamp and status */}
                  <div className="flex items-center justify-end gap-1 mt-2 mb-1">
                    <span className="text-[11px] text-gray-500">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* WhatsApp double checkmark (delivered) */}
                    <svg width="12" height="12" viewBox="0 0 16 11" fill="none">
                      <path d="M11.071.99A1 1 0 00 9.657l.707.708zm-.707.708-5.364 5.364-.708-.707 5.364-5.364.708.707zm-6.778 4.95L2.172 5.236a1 1 0 00-1.414 1.414l1.414-1.414zm-.708.708 1.414 1.414a1 1 0 001.414 0l-1.414-1.414zm2.122 1.414L9.657 2.813a1 1 0 00-1.414-1.414L9.657 2.813z" fill="#53bdeb"/>
                      <path d="M15.071.99a1 1 0 00-1.414 0l.707.708.707-.708zM14.364 1.698l-5.364 5.364-.708-.707 5.364-5.364.708.707zM2.172 5.236l1.414 1.414-.708.708-1.414-1.414.708-.708zm2.122 2.122L13.657 2.813a1 1 0 00-1.414-1.414l-9.363 4.545z" fill="#53bdeb"/>
                    </svg>
                  </div>
                  
                  {/* Buttons */}
                  {buttons && buttons.length > 0 && (
                    <div className="mt-3 -mx-4 -mb-3">
                      <div className="border-t border-gray-200"></div>
                      {buttons.map((button: any, index: number) => {
                        // Handle different button data structures
                        const buttonText = button.text || button.title || button.display_text || button.name || `Button ${index + 1}`;
                        const buttonType = button.type || button.button_type || 'QUICK_REPLY';
                        const buttonUrl = button.url || button.link || button.href;
                        const buttonPhone = button.phone_number || button.phone;
                        
                        const isUrlButton = buttonType.toUpperCase().includes('URL') || buttonType.toUpperCase().includes('LINK') || buttonUrl;
                        const isPhoneButton = buttonType.toUpperCase().includes('PHONE') || buttonType.toUpperCase().includes('CALL') || buttonPhone;
                        
                        return (
                          <div key={index}>
                            <button
                              className="w-full px-4 py-3 text-[13px] font-medium text-center bg-white hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center justify-center gap-2 text-[#075e54]"
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
                              {!isUrlButton && !isPhoneButton && (
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                              )}
                              <span className="flex-1 truncate">{buttonText}</span>
                            </button>
                            {/* Show URL or phone under button for additional context */}
                            {(buttonUrl || buttonPhone) && (
                              <div className="px-4 py-1 text-[10px] text-gray-500 bg-gray-50 text-center border-b border-gray-200 last:border-b-0">
                                {buttonUrl && (
                                  <div className="truncate">🔗 {buttonUrl}</div>
                                )}
                                {buttonPhone && (
                                  <div>📞 {buttonPhone}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Footer */}
                  {template.footer && (
                    <div className="text-[11px] text-gray-600 border-t border-gray-200 pt-2 mt-2 -mx-4 px-4 bg-gray-50">
                      {template.footer}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#ece5dd] flex items-center justify-center text-[#075e54] font-bold text-base border border-[#bdbdbd]">S</div>
            </div>
          </div>
          {/* WhatsApp Input Bar */}
          <div className="absolute bottom-0 left-0 w-full px-4 py-3 bg-[#f7f7f7] flex items-center gap-2 rounded-b-[36px] border-t border-[#ece6ff]">
            <svg width="24" height="24" fill="#919191" viewBox="0 0 24 24"><path d="M12 22c5.522 0 10-4.477 10-10S17.522 2 12 2 2 6.477 2 12s4.478 10 10 10zm-1-7h2v2h-2v-2zm0-6h2v4h-2V9z"/></svg>
            <div className="flex-1 bg-white rounded-full px-4 py-2 text-[#222] text-base">Type a message</div>
            <svg width="24" height="24" fill="#25d366" viewBox="0 0 24 24"><path d="M2 21l21-9-21-9v7l15 2-15 2v7z"/></svg>
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

  React.useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;
    
    setTemplatesLoading(true);
    try {
      const data = await apiService.getOptional('/templates');
      if (data) {
        const templatesData = data.templates || data || [];
        // Filter templates by user's company for security
        const userTemplates = templatesData.filter((template: any) => 
          template.companyId === user.companyId || !template.companyId // Include legacy templates without companyId
        );
        setTemplates(userTemplates);
      } else {
        // Templates endpoint not available
        console.log('Templates endpoint not available, showing empty templates');
        setTemplates([]);
      }
    } catch (error) {
      console.log('Templates endpoint failed, showing empty templates:', error);
      setTemplates([]);
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
    <section className="min-h-screen" style={{ fontFamily: FONT_FAMILY }}>
      <button
        className="fixed bottom-8 right-8 z-40 md:hidden bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white rounded-full shadow-xl p-4 transition-all duration-200"
        onClick={() => router.push("/templates/create")}
        aria-label="Create Template"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#fff"/><path d="M14 7v14M7 14h14" stroke="#2A8B8A" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </button>

      {/* Main Content */}
      <div className="mx-auto">
        <div className="flex flex-col gap-8">
          {/* Header row: Title left, Button right */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: STITCHBYTE_DARK }}>
              Your Templates
            </h2>
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-200 text-base"
              onClick={() => router.push("/templates/create")}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="10" fill="#fff"/>
                <path d="M10 5v10M5 10h10" stroke="#2A8B8A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Template
            </button>
          </div>
          {templatesLoading ? (
            <div className="text-center py-10 text-lg text-[#65676b]">Loading templates...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {templates.length === 0 && (
                <div className="col-span-3 text-center text-[#b0b3b8] py-12 text-lg">
                  No templates found. Click <span className="text-[#2A8B8A] font-semibold">Create Template</span> to get started!
                </div>
              )}
              {templates.map((tpl) => (
                <div
                  key={tpl.name}
                  className="group relative rounded-xl shadow-xl border border-white/50 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200 cursor-pointer flex flex-col min-h-[230px] overflow-hidden"
                  onClick={() => handleCardClick(tpl)}
                  style={{ boxShadow: "0 6px 32px 0 rgba(42,139,138,0.07)" }}
                >
                  {/* Status badge */}
                  <span className={`absolute top-5 right-5 px-3 py-1 rounded-xl text-xs font-semibold shadow-sm border
                    ${tpl.status?.toLowerCase() === 'pending'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : tpl.status?.toLowerCase() === 'approved'
                      ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-[#2A8B8A]/30'
                      : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                    {tpl.status?.toLowerCase()}
                  </span>
                  <div className="flex-1 flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg text-[#2B1A5A] group-hover:text-[#6C47FF] tracking-tight">{tpl.name}</span>
                      </div>
                      <div className="mb-2 text-base text-[#6C47FF] font-semibold">{tpl.header || ""}</div>
                      <div className="mb-3 text-base text-[#050505] line-clamp-4 whitespace-pre-line">{tpl.body || tpl.content}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(tpl.variables || tpl.example_variables || []).map((v: string, idx: number) => (
                        <span key={idx} className="bg-[#ece6ff] px-2 py-1 rounded text-xs text-[#6C47FF] font-medium">{v.replace(/[{}]/g, "")}</span>
                      ))}
                    </div>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#2A8B8A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              ))}
            </div>
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
