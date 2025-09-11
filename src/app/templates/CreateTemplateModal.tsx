import React, { useState } from "react";

// Type definitions
interface FormData {
  name: string;
  category: string;
  type: string;
  language: string;
  header: string;
  body: string;
  footer: string;
  variables: string[];
  buttons: string[];
  validityPeriod: boolean;
}

interface FormErrors {
  name?: string;
  body?: string;
}

interface Props {
  onClose: () => void;
  onSubmit?: (formData: FormData) => void;
}

const CATEGORY_OPTIONS = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
];

const TYPE_OPTIONS: Record<string, Array<{ value: string; label: string; desc: string }>> = {
  MARKETING: [
    { value: "custom", label: "Custom", desc: "Send promotions or announcements to increase awareness and engagement." },
    { value: "catalogue", label: "Catalogue", desc: "Send messages about your entire catalogue or multiple products from it." },
    { value: "flows", label: "Flows", desc: "Send a form to capture customer interests, appointment requests or run surveys." },
    { value: "calling_permissions_request", label: "Calling permissions request", desc: "Ask customers if you can call them on WhatsApp." },
  ],
  UTILITY: [
    { value: "custom", label: "Custom", desc: "Send account updates, order updates, reminders, etc." },
    { value: "order_management", label: "Order management", desc: "Send order confirmations, shipping updates, etc." },
    { value: "event_reminder", label: "Event reminder", desc: "Remind customers about upcoming events or appointments." },
    { value: "payments", label: "Payments", desc: "Send payment confirmations, receipts, etc." },
  ],
  AUTHENTICATION: [
    { value: "custom", label: "Custom", desc: "Send authentication codes or login confirmations." },
  ],
};

const LANGUAGES = [
  { value: "en_US", label: "English" },
  { value: "hi_IN", label: "Hindi" },
  // Add more as needed
];

const initialForm: FormData = {
  name: "",
  category: "MARKETING",
  type: "custom",
  language: "en_US",
  header: "",
  body: "",
  footer: "",
  variables: [],
  buttons: [],
  validityPeriod: false,
};

export default function CreateTemplateModal({ onClose, onSubmit }: Props) {
  const [step, setStep] = useState(0); // 0: setup, 1: edit, 2: review
  const [form, setForm] = useState<FormData>(initialForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [buttonText, setButtonText] = useState("");

  // Stepper navigation
  const steps = ["Set up template", "Edit template", "Submit for Review"];

  // Handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "category" ? { type: TYPE_OPTIONS[value][0].value } : {}),
    }));
  };

  const handleAddButton = () => {
    if (buttonText.trim()) {
      setForm((prev) => ({ ...prev, buttons: [...prev.buttons, buttonText.trim()] }));
      setButtonText("");
    }
  };
  const handleRemoveButton = (idx: number) => {
    setForm((prev) => ({ ...prev, buttons: prev.buttons.filter((_, i) => i !== idx) }));
  };

  const validateStep = () => {
    let errors: FormErrors = {};
    if (step === 0) {
      if (!form.name) errors.name = "You need to enter a name for your template.";
    }
    if (step === 1) {
      if (!form.body) errors.body = "Body is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      if (onSubmit) onSubmit(form);
      setStep(2);
    }
  };

  // UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm text-black rounded-xl shadow-2xl max-w-5xl w-full relative flex flex-col md:flex-row overflow-y-auto border border-white/50">
        <button className="absolute top-3 right-3 text-black text-2xl hover:text-red-500 transition z-10" onClick={onClose}>✖</button>
        {/* Left: Steps and Form */}
        <div className="flex-1 p-8 min-w-[350px]">
          {/* Stepper */}
          <div className="flex gap-4 mb-8 items-center">
            {steps.map((label, idx) => (
              <React.Fragment key={label}>
                <div className={`font-semibold ${step === idx ? 'text-black' : 'text-gray-400'}`}>{label}</div>
                {idx < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>
          {/* Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 flex items-center gap-4 border border-white/50">
            <div className="flex-1">
              <div className="font-bold text-lg">{form.name || "your_template_name"} • {LANGUAGES.find(l => l.value === form.language)?.label || "English"}</div>
              <div className="text-xs text-gray-500 mt-1">{CATEGORY_OPTIONS.find(c => c.value === form.category)?.label} • {TYPE_OPTIONS[form.category].find(t => t.value === form.type)?.label}</div>
            </div>
            <select name="language" value={form.language} onChange={handleFormChange} className="border rounded-xl p-1 text-sm bg-white/70 border-gray-300 focus:border-[#2A8B8A] focus:outline-none transition-all duration-200">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          {/* Step 0: Set up template */}
          {step === 0 && (
            <>
              <div className="mb-6">
                <label className="block font-semibold mb-1">Name your template</label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl p-2 focus:border-[#2A8B8A] focus:outline-none transition-all duration-200 bg-white/70" maxLength={512} />
                {formErrors.name && <div className="text-red-500 text-xs mt-1">{formErrors.name}</div>}
              </div>
              <div className="mb-6">
                <div className="font-semibold mb-2">Category</div>
                <div className="flex gap-2 mb-2">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`px-5 py-2 rounded-t-xl font-semibold border-b-2 transition ${form.category === opt.value ? 'border-[#2A8B8A] bg-[#2A8B8A]/10' : 'border-transparent bg-white hover:bg-gray-50'}`}
                      onClick={() => setForm(prev => ({ ...prev, category: opt.value, type: TYPE_OPTIONS[opt.value][0].value }))}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Type Selection */}
                <div className="flex flex-col gap-2">
                  {TYPE_OPTIONS[form.category].map(typeOpt => (
                    <label key={typeOpt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={typeOpt.value}
                        checked={form.type === typeOpt.value}
                        onChange={handleFormChange}
                        className="accent-[#2A8B8A]"
                      />
                      <span className="font-medium">{typeOpt.label}</span>
                      <span className="text-xs text-gray-500">{typeOpt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-lg" onClick={handleNext}>Next</button>
              </div>
            </>
          )}
          {/* Step 1: Edit template */}
          {step === 1 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Body</label>
                <textarea name="body" value={form.body} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl p-2 min-h-[80px] focus:border-[#2A8B8A] focus:outline-none transition-all duration-200 bg-white/70" maxLength={1024} />
                {formErrors.body && <div className="text-red-500 text-xs mt-1">{formErrors.body}</div>}
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Header (optional)</label>
                <input type="text" name="header" value={form.header} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl p-2 focus:border-[#2A8B8A] focus:outline-none transition-all duration-200 bg-white/70" maxLength={60} />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Footer (optional)</label>
                <input type="text" name="footer" value={form.footer} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl p-2 focus:border-[#2A8B8A] focus:outline-none transition-all duration-200 bg-white/70" maxLength={60} />
              </div>
              {/* Buttons */}
              <div className="mb-4">
                <label className="block font-semibold mb-1">Buttons (optional)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} className="border border-gray-300 rounded-xl p-2 flex-1 focus:border-[#2A8B8A] focus:outline-none transition-all duration-200 bg-white/70" placeholder="Button text" maxLength={20} />
                  <button type="button" className="bg-[#2A8B8A]/20 hover:bg-[#2A8B8A]/30 px-3 py-1 rounded-xl transition-all duration-200" onClick={handleAddButton}>Add button</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.buttons.map((btn, idx) => (
                    <span key={idx} className="bg-[#2A8B8A]/10 border border-[#2A8B8A]/30 px-2 py-1 rounded-xl text-xs flex items-center gap-1">
                      {btn}
                      <button type="button" className="text-red-500 ml-1" onClick={() => handleRemoveButton(idx)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              {/* Message validity period */}
              <div className="mb-4">
                <label className="block font-semibold mb-1">Message validity period</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="validityPeriod" checked={form.validityPeriod} onChange={handleFormChange} />
                  <span className="text-xs text-gray-500">Set custom validity period for your message</span>
                </div>
                {form.validityPeriod && (
                  <div className="text-xs text-gray-500 mt-1">If you don't set a custom validity period, the standard 10 minutes WhatsApp message validity period will be applied.</div>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <button type="button" className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-xl transition-all duration-200" onClick={handlePrev}>Previous</button>
                <button type="submit" className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-lg">Submit for Review</button>
              </div>
            </form>
          )}
          {/* Step 2: Review/Success */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="text-2xl font-bold mb-4">Template submitted for review!</div>
              <button className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-6 py-2 rounded-xl mt-4 transition-all duration-200 shadow-lg" onClick={onClose}>Close</button>
            </div>
          )}
        </div>
        {/* Right: Live Preview */}
        <div className="hidden md:flex flex-col items-center justify-start bg-white/50 backdrop-blur-sm min-w-[350px] max-w-[400px] border-l border-white/50 p-8">
          <div className="w-full max-w-xs bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="font-bold text-lg mb-2">{form.header || "Template preview"}</div>
            <div className="mb-3 text-base whitespace-pre-line">{form.body || "Your message body will appear here."}</div>
            {form.footer && <div className="text-xs text-gray-500 border-t pt-2 mt-2">{form.footer}</div>}
            <div className="mt-4 flex flex-wrap gap-2">
              {form.buttons && form.buttons.length > 0 && form.buttons.map((btn, idx) => (
                <span key={idx} className="bg-[#2A8B8A]/20 text-[#2A8B8A] px-2 py-1 rounded-xl text-xs">{btn}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
