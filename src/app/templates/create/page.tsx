"use client";
import React from "react";
import { useRouter } from "next/navigation";

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
];

const TYPE_OPTIONS = {
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

export default function CreateTemplatePage() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: "",
    category: "MARKETING",
    type: "custom",
    language: "en_US",
    header: "",
    headerVarType: "none",
    body: "",
    footer: "",
    samples: [],
    buttons: [],
    variableType: "none",
  });
  const [headerFile, setHeaderFile] = React.useState(null);
  const [formErrors, setFormErrors] = React.useState({});
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [step, setStep] = React.useState(1);

  // Function to sanitize template name (same logic as backend)
  const sanitizeTemplateName = (name) => {
    if (!name) return "";
    let sanitized = name.toLowerCase().trim();
    sanitized = sanitized.replace(/[^a-z0-9_]/g, '_');
    sanitized = sanitized.replace(/_+/g, '_');
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    return sanitized;
  };

  // Button management functions
  const addButton = () => {
    if (form.buttons.length < 3) {
      setForm(prev => ({
        ...prev,
        buttons: [...prev.buttons, { type: 'QUICK_REPLY', text: '' }]
      }));
    }
  };

  const removeButton = (index) => {
    setForm(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const updateButton = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => 
        i === index ? { ...btn, [field]: value } : btn
      )
    }));
  };

  const sanitizedName = sanitizeTemplateName(form.name);
  const nameNeedsSanitization = form.name && sanitizedName !== form.name;

  const variableType = form.variableType;
  const variableWarning = variableType === 'named' ? 'Meta only accepts numbered variables like {{"{{1}}"}, {{"{{2}}"}}. Please update your template.' : '';
  const variableMatches = variableType === 'none' ? [] : (form.body.match(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*|\d+)\s*}}/g) || []);

  React.useEffect(() => {
    if (variableMatches.length !== (form.samples?.length || 0)) {
      setForm((prev) => ({
        ...prev,
        samples: variableMatches.map((v, i) => prev.samples?.[i] || "")
      }));
    }
  }, [form.body]);

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'radio' && name === 'variableType') {
      setForm(prev => ({
        ...prev,
        variableType: value,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
    }
  };

  const handleSampleChange = (idx, value) => {
    setForm((prev) => {
      const samples = [...(prev.samples || [])];
      samples[idx] = value;
      return { ...prev, samples };
    });
  };

  const handleHeaderVarTypeChange = (e) => {
    setForm((prev) => ({ ...prev, headerVarType: e.target.value }));
    // Clear file when changing header type
    setHeaderFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderFile(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    
    let errors = {};
    if (!form.name) errors.name = "Name is required";
    if (!form.body) errors.body = "Body is required";
    
    // Validate file upload for media header types
    if (['image', 'video', 'document'].includes(form.headerVarType) && !headerFile) {
      errors.headerFile = `${form.headerVarType.charAt(0).toUpperCase() + form.headerVarType.slice(1)} file is required`;
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setSubmitLoading(false);
      return;
    }
    
    // Create FormData to handle file uploads
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('language', form.language);
    
    // Handle header based on type
    if (form.headerVarType === 'text' && form.header) {
      formData.append('header_type', 'text');
      formData.append('header_text', form.header);
    } else if (['image', 'video', 'document'].includes(form.headerVarType) && headerFile) {
      formData.append('header_type', form.headerVarType);
      formData.append('header_file', headerFile);
    }
    
    formData.append('body', form.body);
    
    if (form.footer) {
      formData.append('footer', form.footer);
    }
    
    if (form.samples && form.samples.length > 0) {
      formData.append('samples', JSON.stringify(form.samples));
    }
    
    if (form.buttons && form.buttons.length > 0) {
      formData.append('buttons', JSON.stringify(form.buttons));
    }
    
    try {
      const res = await fetch("http://localhost:8000/submit-template-with-file", {
        method: "POST",
        body: formData, // Browser automatically sets Content-Type with boundary for FormData
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccessMsg("Template submitted successfully!");
        setTimeout(() => router.push("/templates"), 1200);
      } else {
        console.error("Template submission error:", data);
        setErrorMsg(data.error || data.details?.error?.message || "Failed to submit template");
      }
    } catch (err) {
      console.error("Network error:", err);
      setErrorMsg("Failed to submit template. Please check your connection.");
    }
    setSubmitLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F6FF' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition"
            onClick={() => router.push("/templates")}
            aria-label="Back to templates"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.25 6.75L4.75 12L10.25 17.25"/>
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.25 12H5"/>
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-black">Create Template</h1>
        </div>
        
        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 flex overflow-hidden">
        
        <div className="flex-1 p-8">
          {/* Stepper */}
          <div className="flex gap-4 mb-8">
            {[1,2,3].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 ${step === n ? 'bg-[#2A8B8A] border-[#2A8B8A] text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                  {n}
                </div>
                {n < 3 && <div className="w-12 h-0.5 bg-gray-200 rounded" />}
              </div>
            ))}
          </div>
          
          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="space-y-6">
              <div>
                <div className="font-medium mb-2 text-black">Category</div>
                <div className="flex gap-2 border-b border-gray-200 mb-4">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`px-5 py-2 rounded-t-xl font-medium border-b-2 transition text-base ${form.category === opt.value ? 'border-[#2A8B8A] text-black bg-[#2A8B8A]/10' : 'border-transparent text-black bg-white hover:bg-gray-50'}`}
                      onClick={e => { 
                        e.preventDefault(); 
                        setForm(prev => ({ 
                          ...prev, 
                          category: opt.value, 
                          type: TYPE_OPTIONS[opt.value][0].value 
                        })); 
                      }}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-2 text-black">Type</div>
                <div className="flex flex-col gap-2">
                  {TYPE_OPTIONS[form.category].map(typeOpt => (
                    <label key={typeOpt.value} className="flex items-center gap-3 cursor-pointer text-base">
                      <input
                        type="radio"
                        name="type"
                        value={typeOpt.value}
                        checked={form.type === typeOpt.value}
                        onChange={handleFormChange}
                        className="accent-[#2A8B8A] w-4 h-4"
                      />
                      <span className="font-medium text-black">{typeOpt.label}</span>
                      <span className="text-xs text-black">{typeOpt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-2 text-black">Variable Type</div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="variableType" value="numbered" checked={variableType === 'numbered'} onChange={handleFormChange} className="accent-[#2A8B8A] w-4 h-4" />
                    <span className="text-black">Numbered ({'{{1}}'}, {'{{2}}'})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="variableType" value="named" checked={variableType === 'named'} onChange={handleFormChange} className="accent-[#2A8B8A] w-4 h-4" />
                    <span className="text-black">Named ({'{{name}}'}, {'{{code}}'})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="variableType" value="none" checked={variableType === 'none'} onChange={handleFormChange} className="accent-[#2A8B8A] w-4 h-4" />
                    <span className="text-black">None</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <button type="button" className="bg-gray-200 text-gray-600 font-semibold px-6 py-2 rounded-xl transition-all duration-200" onClick={() => router.push("/templates")}>
                  Cancel
                </button>
                <button type="submit" className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-200">
                  Next
                </button>
              </div>
            </form>
          )}
          
          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); setStep(3); }} className="space-y-6">
              <div>
                <label className="block font-medium mb-1 text-black">Template Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={form.name} 
                  onChange={handleFormChange} 
                  className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:border-[#2A8B8A] focus:bg-white outline-none transition text-black placeholder-black" 
                  placeholder="Enter template name (e.g., Order Confirmation)"
                />
                {nameNeedsSanitization && (
                  <div className="text-black text-xs mt-1">
                    <span className="text-black">Will be saved as:</span> <code className="bg-blue-50 px-1 rounded">{sanitizedName}</code>
                  </div>
                )}
                {formErrors.name && <div className="text-red-500 text-xs mt-1">{formErrors.name}</div>}
                <div className="text-black text-xs mt-1">Only lowercase letters, numbers, and underscores are allowed</div>
              </div>
              
              <div>
                <label className="block font-medium mb-1 text-black">Header Variable Type</label>
                <select 
                  name="headerVarType" 
                  value={form.headerVarType || "none"} 
                  onChange={handleHeaderVarTypeChange} 
                  className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:border-[#2A8B8A] focus:bg-white outline-none transition text-black"
                >
                  {HEADER_VARIABLE_TYPES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                {form.headerVarType === 'text' ? (
                  <>
                    <label className="block font-medium mb-1 text-black">Header <span className="text-xs text-black">(optional)</span></label>
                    <input 
                      type="text" 
                      name="header" 
                      value={form.header} 
                      onChange={handleFormChange} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition text-black placeholder-black" 
                    />
                  </>
                ) : form.headerVarType === 'image' ? (
                  <>
                    <label className="block font-medium mb-1 text-black">Header Image <span className="text-xs text-black">(required)</span></label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                    {headerFile && <div className="text-sm text-green-600 mt-1">Selected: {headerFile.name}</div>}
                    {formErrors.headerFile && <div className="text-red-500 text-xs mt-1">{formErrors.headerFile}</div>}
                    <div className="text-black text-xs mt-1">
                      This file will be uploaded and used as the header image for this template.
                    </div>
                  </>
                ) : form.headerVarType === 'video' ? (
                  <>
                    <label className="block font-medium mb-1 text-black">Header Video <span className="text-xs text-black">(required)</span></label>
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={handleFileChange}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                    {headerFile && <div className="text-sm text-green-600 mt-1">Selected: {headerFile.name}</div>}
                    {formErrors.headerFile && <div className="text-red-500 text-xs mt-1">{formErrors.headerFile}</div>}
                    <div className="text-black text-xs mt-1">
                      This file will be uploaded and used as the header video for this template.
                    </div>
                  </>
                ) : form.headerVarType === 'document' ? (
                  <>
                    <label className="block font-medium mb-1 text-black">Header Document <span className="text-xs text-black">(required)</span></label>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      onChange={handleFileChange}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                    {headerFile && <div className="text-sm text-green-600 mt-1">Selected: {headerFile.name}</div>}
                    {formErrors.headerFile && <div className="text-red-500 text-xs mt-1">{formErrors.headerFile}</div>}
                    <div className="text-black text-xs mt-1">
                      This file will be uploaded and used as the header document for this template.
                    </div>
                  </>
                ) : (
                  <div className="text-black text-sm">No header content needed for this type.</div>
                )}
              </div>
              
              <div className="flex justify-between mt-8">
                <button type="button" className="bg-gray-200 text-gray-600 font-semibold px-6 py-2 rounded-xl transition-all duration-200" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-200">
                  Next
                </button>
              </div>
            </form>
          )}
          
          {step === 3 && (
            <div>
              <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
                <div>
                  <label className="block font-medium mb-1 text-black">Body</label>
                  <textarea 
                    name="body" 
                    value={form.body} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-200 rounded-lg p-2.5 min-h-[80px] bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition text-black placeholder-black" 
                  />
                  {formErrors.body && <div className="text-red-500 text-xs mt-1">{formErrors.body}</div>}
                </div>
                
                {variableMatches.length > 0 && (
                  <div className="mt-6">
                    <div className="font-semibold text-lg mb-1 text-black">Samples for body content</div>
                    <div className="text-black mb-4 text-base">To help us review your message template, please add an example for each variable in your body text.</div>
                    {variableMatches.map((v, idx) => (
                      <div key={v} className="flex items-center gap-3 mb-3">
                        <span className="text-black text-base min-w-[120px]">{v}</span>
                        <input
                          type="text"
                          className="flex-1 border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition text-black placeholder-black"
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
                                    <label className="block font-medium mb-1 text-black">Footer <span className="text-xs text-black">(optional)</span></label>
                  <input 
                    type="text" 
                    name="footer" 
                    value={form.footer} 
                    onChange={handleFormChange} 
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none transition text-black placeholder-black" 
                  />
                </div>

                {/* Buttons Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block font-medium text-black">Buttons <span className="text-xs text-black">(optional, max 3)</span></label>
                    <button
                      type="button"
                      onClick={addButton}
                      disabled={form.buttons.length >= 3}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + Add Button
                    </button>
                  </div>
                  
                  {form.buttons.map((button, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-black">Button {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeButton(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-black mb-1">Button Type</label>
                          <select
                            value={button.type}
                            onChange={(e) => updateButton(index, 'type', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2 bg-white focus:border-blue-500 outline-none transition text-black"
                          >
                            <option value="QUICK_REPLY" className="text-black">Quick Reply</option>
                            <option value="URL" className="text-black">Website URL</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-black mb-1">Button Text</label>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            placeholder="Button text (max 20 chars)"
                            maxLength={20}
                            className="w-full border border-gray-200 rounded-lg p-2 bg-white focus:border-blue-500 outline-none transition text-black placeholder-black"
                          />
                        </div>
                      </div>
                      
                      {button.type === 'URL' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-black mb-1">Website URL</label>
                          <input
                            type="url"
                            value={button.url || ''}
                            onChange={(e) => updateButton(index, 'url', e.target.value)}
                            placeholder="https://example.com"
                            className="w-full border border-gray-200 rounded-lg p-2 bg-white focus:border-blue-500 outline-none transition text-black placeholder-black"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="text-black text-xs mt-2">
                    • Quick Reply buttons trigger responses within the chat
                    • URL buttons open websites when tapped
                    • Button text is limited to 20 characters
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <button type="button" className="bg-gray-200 text-gray-600 font-semibold px-6 py-2 rounded-xl transition-all duration-200" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60" 
                    disabled={submitLoading || variableType === 'named'}
                  >
                    Submit to Meta
                  </button>
                </div>
              </form>
              
              <div className="mt-8">
                <div className="mb-6">
                  <div className="font-medium mb-1 text-black">Review Template</div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-line text-base text-black">
                    {form.body}
                  </div>
                  {variableWarning && <div className="text-red-500 text-xs mt-2 font-semibold">{variableWarning}</div>}
                </div>
                
                <div className="mb-4">
                  <div className="font-medium text-black">Category</div>
                  <div className="text-base text-black font-semibold">{form.category}</div>
                </div>
                
                <div className="mb-4">
                  <div className="font-medium text-black">Type</div>
                  <div className="text-base text-black font-semibold">{form.type}</div>
                </div>
                
                <div className="mb-4">
                  <div className="font-medium text-black">Header Variable Type</div>
                  <div className="text-base text-black font-semibold">
                    {HEADER_VARIABLE_TYPES.find(opt => opt.value === (form.headerVarType || "none"))?.label}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="font-medium text-black">Variable Type</div>
                  <div className="text-base text-black font-semibold">
                    {variableType === 'none' ? 'None' : variableType.charAt(0).toUpperCase() + variableType.slice(1)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="font-medium text-black">Variables Detected</div>
                  <div className="text-base text-black font-semibold">{variableMatches.join(', ') || 'None'}</div>
                </div>
                
                {variableMatches.length > 0 && (
                  <div className="mb-4">
                    <div className="font-medium text-black">Sample Values</div>
                    <div className="flex flex-col gap-2 mt-2">
                      {variableMatches.map((v, idx) => (
                        <div key={v} className="flex items-center gap-3">
                          <span className="text-black text-base min-w-[120px]">{v}</span>
                          <span className="text-base text-black">
                            {form.samples?.[idx] || <span className="italic text-black">(no sample)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {form.buttons && form.buttons.length > 0 && (
                  <div className="mb-4">
                    <div className="font-medium text-black">Buttons</div>
                    <div className="flex flex-col gap-2 mt-2">
                      {form.buttons.map((button, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <span className="text-black text-sm min-w-[100px]">
                            {button.type === 'URL' ? '🔗 URL Button' : '💬 Quick Reply'}
                          </span>
                          <span className="text-sm text-black font-medium">
                            {button.text || `Button ${idx + 1}`}
                          </span>
                          {button.type === 'URL' && button.url && (
                            <span className="text-xs text-black bg-blue-50 px-2 py-1 rounded">
                              {button.url}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {successMsg && <div className="text-green-600 text-center mt-3">{successMsg}</div>}
                {errorMsg && <div className="text-red-500 text-center mt-3">{errorMsg}</div>}
              </div>
            </div>
          )}
        </div>
        
        {/* Right: Live Preview */}
        <div className="hidden lg:flex flex-col bg-white/50 backdrop-blur-sm min-w-[400px] border-l border-white/50 p-8">
          <h3 className="text-lg font-semibold mb-4 text-black">Live Preview</h3>
          
          {/* iPhone WhatsApp Replica */}
          <div className="bg-black rounded-[2.5rem] p-2 shadow-2xl mx-auto" style={{width: '320px', height: '640px'}}>
            {/* iPhone Screen */}
            <div className="bg-white rounded-[2rem] h-full flex flex-col overflow-hidden">
              
              {/* Status Bar */}
              <div className="bg-white px-6 py-2 flex justify-between items-center text-black text-sm font-medium">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                  <svg width="18" height="10" viewBox="0 0 25 15" fill="none">
                    <rect x="2" y="3" width="17" height="9" rx="2" stroke="black" strokeWidth="1" fill="none"/>
                    <path d="M21 6V9" stroke="black" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* WhatsApp Header */}
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"/>
                </svg>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">SB</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-base">Stitchbyte</div>
                  <div className="text-green-200 text-xs">online</div>
                </div>
                <div className="flex gap-4">
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>

              {/* Chat Background */}
              <div className="flex-1 bg-[#E5DDD5] px-4 py-6 overflow-y-auto" 
                   style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><defs><pattern id=\"circles\" x=\"0\" y=\"0\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"%23D4EDDA\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23circles)\"/></svg>')"}}>
                
                {/* Business Message Bubble */}
                <div className="flex justify-start mb-4">
                  <div className="bg-white rounded-lg shadow-sm max-w-[80%] relative">
                    {/* Message Tail */}
                    <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[16px] border-r-white border-b-[8px] border-b-transparent"></div>
                    
                    <div className="p-3">
                      {/* Business Header Info */}
                      <div className="text-[#075E54] text-xs font-medium mb-2 border-b border-gray-100 pb-2">
                        Stitchbyte Message
                      </div>

                      {/* Header Preview */}
                      {form.headerVarType === 'text' && form.header ? (
                        <div className="font-semibold text-sm mb-2 text-black">{form.header}</div>
                      ) : form.headerVarType === 'image' && headerFile ? (
                        <div className="mb-2">
                          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center border">
                            <div className="text-center text-black">
                              <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24" className="mx-auto mb-1">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              </svg>
                              <div className="text-xs">{headerFile.name}</div>
                            </div>
                          </div>
                        </div>
                      ) : form.headerVarType === 'video' && headerFile ? (
                        <div className="mb-2">
                          <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center border relative">
                            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                              {headerFile.name}
                            </div>
                          </div>
                        </div>
                      ) : form.headerVarType === 'document' && headerFile ? (
                        <div className="mb-2">
                          <div className="bg-gray-50 border rounded-lg p-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-black">{headerFile.name}</div>
                              <div className="text-xs text-black">{(headerFile.size / 1024 / 1024).toFixed(2)} MB</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* Body Text */}
                      <div className="text-sm text-black leading-relaxed whitespace-pre-line mb-2">
                        {form.body || "Your message body will appear here..."}
                      </div>
                      
                      {/* Variables */}
                      {(form.body.match(/{{.*?}}/g) || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(form.body.match(/{{.*?}}/g) || []).map((v, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Footer */}
                      {form.footer && (
                        <div className="text-xs text-black border-t border-gray-100 pt-2 mt-2">
                          {form.footer}
                        </div>
                      )}
                      
                      {/* Buttons */}
                      {form.buttons && form.buttons.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {form.buttons.map((button, index) => (
                            <button
                              key={index}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
                                button.type === 'URL' 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100' 
                                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {button.type === 'URL' && (
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className="inline mr-1">
                                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                </svg>
                              )}
                              {button.text || `Button ${index + 1}`}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Message Time */}
                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-black">12:34 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Bar */}
              <div className="bg-[#F0F0F0] px-4 py-2 flex items-center gap-3">
                <svg width="24" height="24" fill="#999" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
                <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-black">
                  Type a message
                </div>
                <svg width="24" height="24" fill="#999" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
