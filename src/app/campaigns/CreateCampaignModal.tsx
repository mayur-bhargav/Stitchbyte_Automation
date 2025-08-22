"use client";
import { useState, useEffect } from "react";
import { useBalance, MESSAGE_COST } from "../contexts/BalanceContext";
import apiService from "../services/apiService";

type Template = {
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  content: string;
  variables?: string[];
  header_type?: string;
  header_media?: {
    type: string;
    handle: string;
  };
};

type CreateCampaignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
};

export default function CreateCampaignModal({ isOpen, onClose, onCampaignCreated }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    recipients: [] as string[],
    tags: [] as string[],
    budget: '',
    variable_values: {} as { [key: string]: string }
  });
  
  const [phone, setPhone] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for contact selection modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactTagFilter, setContactTagFilter] = useState('');
  
  // State for media upload (for templates with image/video/document headers)
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  // Use global balance context
  const { balance: userBalance, addBalance: addBalanceContext } = useBalance();

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      console.log('Fetching templates from backend...');
      const data = await apiService.getOptional('/templates');
      console.log('Raw templates data:', data);
      
      if (data) {
        const approvedTemplates = (data.templates || [])
          .map((t: any) => {
            if (typeof t === 'string') {
              return { name: t, status: 'approved', content: '' };
            }
            return t;
          })
          .filter((t: Template) => {
            console.log('Template:', t.name, 'Status:', t.status);
            return t.status === 'APPROVED' || t.status === 'approved';
          });
        
        console.log('Filtered approved templates:', approvedTemplates);
        setTemplates(approvedTemplates);
        
        if (approvedTemplates.length === 0) {
          setError('No approved templates found. Please create and approve templates first.');
        }
      } else {
        console.log('Templates endpoint not available, showing empty templates');
        setTemplates([]);
      }
    } catch (error) {
      console.log('Failed to load templates, showing empty templates:', error);
      setError('Failed to load templates. Please check your connection and try again.');
    }
    setTemplatesLoading(false);
  };

  // Fetch contacts from API
  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const data = await apiService.getContacts();
      const contactsData = data.contacts || [];
      setAllContacts(contactsData);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setAllContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  // Open contact selection modal
  const openContactModal = () => {
    setShowContactModal(true);
    fetchContacts();
  };

  // Handle contact selection
  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  // Select/deselect all contacts
  const toggleSelectAll = () => {
    const filteredContacts = getFilteredContacts();
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c._id)));
    }
  };

  // Filter contacts based on search and tag, excluding blocked contacts
  const getFilteredContacts = () => {
    return allContacts.filter(contact => {
      // Exclude blocked contacts
      if (contact.status === 'blocked') {
        return false;
      }
      
      const matchesSearch = !contactSearchTerm || 
        contact.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
        contact.phone.includes(contactSearchTerm);
      
      const matchesTag = !contactTagFilter || 
        (contact.tags && contact.tags.includes(contactTagFilter));
      
      return matchesSearch && matchesTag;
    });
  };

  // Get unique tags from all contacts
  const getAllTags = () => {
    const tags = new Set<string>();
    allContacts.forEach(contact => {
      if (contact.tags) {
        contact.tags.forEach((tag: string) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  };

  // Check if media is required but not provided
  const isMediaRequired = () => {
    const selectedTemplate = templates.find(t => t.name === formData.template);
    if (!selectedTemplate?.header_type) return false;
    
    const hasMediaHeader = ['image', 'video', 'document'].includes(selectedTemplate.header_type.toLowerCase());
    const hasExistingMedia = selectedTemplate.header_media?.handle;
    
    if (!hasMediaHeader) return false;
    
    // If template has existing media, media is not required (can use default)
    if (hasExistingMedia) return false;
    
    // If no existing media, require either file or URL
    return !(mediaFile || mediaUrl);
  };

  // Apply selected contacts to recipients with budget validation
  const applySelectedContacts = () => {
    const selectedContactsData = allContacts.filter(c => selectedContacts.has(c._id));
    const phoneNumbers = selectedContactsData.map(c => c.phone);
    
    // Merge with existing recipients, removing duplicates
    const allRecipients = [...new Set([...formData.recipients, ...phoneNumbers])];
    
    // Budget validation if budget is set
    if (formData.budget && parseFloat(formData.budget) > 0) {
      const budget = parseFloat(formData.budget);
      const campaignStartupFee = 1.0;
      const totalCost = (allRecipients.length * MESSAGE_COST) + campaignStartupFee;
      
      if (totalCost > budget) {
        // Calculate how many contacts can be afforded within budget
        const affordableContacts = Math.floor((budget - campaignStartupFee) / MESSAGE_COST);
        const maxSelectableFromModal = Math.max(0, affordableContacts - formData.recipients.length);
        
        if (maxSelectableFromModal === 0) {
          setError(`Budget exceeded! With current budget of ₹${budget.toFixed(2)}, you cannot add any more contacts. Current cost: ₹${((formData.recipients.length * MESSAGE_COST) + campaignStartupFee).toFixed(2)}`);
          return;
        } else {
          setError(`Budget exceeded! You can only select ${maxSelectableFromModal} more contact${maxSelectableFromModal !== 1 ? 's' : ''} with your budget of ₹${budget.toFixed(2)}. Total cost would be ₹${totalCost.toFixed(2)} but budget allows only ₹${budget.toFixed(2)}. Please increase budget or select fewer contacts.`);
          return;
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      recipients: allRecipients
    }));
    
    // Clear the main phone input if it was added to the list
    if (phone.trim() && phoneNumbers.includes(phone.trim())) {
      setPhone('');
    }
    
    // Close modal and reset selection
    setShowContactModal(false);
    setSelectedContacts(new Set());
    setContactSearchTerm('');
    setContactTagFilter('');
    setError(''); // Clear any previous errors
  };

  const handlePhoneKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPhoneNumber();
    }
  };

  const addPhoneNumber = () => {
    if (phone.trim() && !formData.recipients.includes(phone.trim())) {
      const newRecipients = [...formData.recipients, phone.trim()];
      
      // Budget validation if budget is set
      if (formData.budget && parseFloat(formData.budget) > 0) {
        const budget = parseFloat(formData.budget);
        const campaignStartupFee = 1.0;
        const totalCost = (newRecipients.length * MESSAGE_COST) + campaignStartupFee;
        
        if (totalCost > budget) {
          const affordableContacts = Math.floor((budget - campaignStartupFee) / MESSAGE_COST);
          setError(`Budget exceeded! You can only add ${affordableContacts} contact${affordableContacts !== 1 ? 's' : ''} with your budget of ₹${budget.toFixed(2)}. Please increase budget or remove some contacts.`);
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        recipients: newRecipients
      }));
      setPhone('');
      setError(''); // Clear any previous errors
    }
  };

  const removePhoneNumber = (phoneToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(p => p !== phoneToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleTemplateChange = (templateName: string) => {
    setFormData(prev => ({
      ...prev,
      template: templateName,
      variable_values: {}
    }));
    
    // Reset media when template changes
    setMediaUrl('');
    setMediaFile(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleVariableChange = (variable: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variable_values: {
        ...prev.variable_values,
        [variable]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (!formData.template) {
      setError('Please select a template');
      return;
    }

    if (formData.recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    // Check if media is required but not provided
    if (isMediaRequired()) {
      setError('This template requires media. Please upload a file or provide a URL.');
      return;
    }

    // Check if user has sufficient balance
    const campaignStartupFee = 1.0;
    const totalCost = (formData.recipients.length * MESSAGE_COST) + campaignStartupFee;
    if (userBalance < totalCost) {
      setError(`Insufficient balance. You need ₹${totalCost.toFixed(2)} but only have ₹${userBalance.toFixed(2)}. Please add ₹${(totalCost - userBalance).toFixed(2)} to continue.`);
      return;
    }

    // Validate template variables
    const selectedTemplate = templates.find(t => t.name === formData.template);
    if (selectedTemplate?.variables) {
      for (const variable of selectedTemplate.variables) {
        if (!formData.variable_values[variable]?.trim()) {
          setError(`Please provide a value for {{${variable}}}`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Always use FormData to handle potential media files
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('template', formData.template);
      formDataToSend.append('recipients', JSON.stringify(formData.recipients));
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      formDataToSend.append('variable_values', JSON.stringify(formData.variable_values));
      if (formData.budget) {
        formDataToSend.append('budget', formData.budget);
      }
      if (mediaFile) {
        formDataToSend.append('media_file', mediaFile);
      }
      if (mediaUrl) {
        formDataToSend.append('media_url', mediaUrl);
      }

      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8000/campaigns', {
        method: 'POST',
        headers,
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        onCampaignCreated();
        resetForm();
        onClose();
      } else {
        setError(data.error || 'Failed to create campaign');
      }
    } catch (error) {
      setError('Failed to create campaign. Please try again.');
      console.error('Campaign creation error:', error);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template: '',
      recipients: [],
      tags: [],
      budget: '',
      variable_values: {}
    });
    setPhone('');
    setTagInput('');
    setError('');
    setMediaUrl('');
    setMediaFile(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedTemplate = templates.find(t => t.name === formData.template);

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2A8B8A] flex items-center justify-center rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Create New Campaign</h2>
                <p className="text-gray-600">Set up a new WhatsApp marketing campaign</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter campaign name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Description
                </label>
                <textarea
                  placeholder="Describe your campaign..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Message Template *
                </label>
                <select
                  value={formData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                  required
                  disabled={templatesLoading}
                >
                  <option value="">{templatesLoading ? "Loading templates..." : "Select Template"}</option>
                  {templates.map((template) => (
                    <option key={template.name} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Variables */}
              {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Template Variables
                  </label>
                  <div className="space-y-3">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {variable.charAt(0).toUpperCase() + variable.slice(1)}
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter value for {{${variable}}}`}
                          value={formData.variable_values[variable] || ''}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          className="w-full border border-gray-300 bg-white text-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Upload for Templates with Image/Video/Document Headers */}
              {selectedTemplate?.header_type && ['image', 'video', 'document'].includes(selectedTemplate.header_type.toLowerCase()) && (
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    {selectedTemplate.header_type.toUpperCase()} Media for Header
                    {selectedTemplate.header_media?.handle && (
                      <span className="text-xs text-gray-500 ml-2">(Override template media)</span>
                    )}
                  </label>
                  
                  {/* Show existing media info if available */}
                  {selectedTemplate.header_media?.handle && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-blue-800">
                          Template has default {selectedTemplate.header_type} media. You can override it below.
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Media Upload Options */}
                  <div className="space-y-4">
                    {/* File Upload Option */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          id="upload-file"
                          name="media-option"
                          checked={!mediaUrl || mediaFile}
                          onChange={() => {
                            setMediaUrl('');
                          }}
                          className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                        />
                        <label htmlFor="upload-file" className="text-sm font-medium text-gray-700">
                          Upload {selectedTemplate.header_type} file
                        </label>
                      </div>
                      <input
                        type="file"
                        accept={
                          selectedTemplate.header_type === 'image' ? 'image/*' :
                          selectedTemplate.header_type === 'video' ? 'video/*' :
                          selectedTemplate.header_type === 'document' ? '*/*' : '*/*'
                        }
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setMediaFile(file || null);
                          if (file) {
                            setMediaUrl(''); // Clear URL when file is selected
                          }
                        }}
                        className="w-full border border-gray-300 bg-white text-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                        disabled={mediaUrl.length > 0}
                      />
                      {mediaFile && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-green-800 font-medium">
                              Selected: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setMediaFile(null);
                                // Reset the file input
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="ml-auto text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* URL Option */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          id="use-url"
                          name="media-option"
                          checked={mediaUrl.length > 0 && !mediaFile}
                          onChange={() => {
                            setMediaFile(null);
                            // Reset the file input
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                        />
                        <label htmlFor="use-url" className="text-sm font-medium text-gray-700">
                          Use {selectedTemplate.header_type} URL
                        </label>
                      </div>
                      <input
                        type="url"
                        placeholder={`Enter ${selectedTemplate.header_type} URL (e.g., https://example.com/image.jpg)`}
                        value={mediaUrl}
                        onChange={e => {
                          setMediaUrl(e.target.value);
                          if (e.target.value) {
                            setMediaFile(null);
                            // Reset the file input
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }
                        }}
                        className="w-full border border-gray-300 bg-white text-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                        disabled={!!mediaFile}
                      />
                    </div>
                    
                    {/* Default Media Option (if exists) */}
                    {selectedTemplate.header_media?.handle && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="radio"
                            id="use-default"
                            name="media-option"
                            checked={!mediaFile && !mediaUrl}
                            onChange={() => {
                              setMediaFile(null);
                              setMediaUrl('');
                              // Reset the file input
                              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                            className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                          />
                          <label htmlFor="use-default" className="text-sm font-medium text-gray-700">
                            Use template's default {selectedTemplate.header_type}
                          </label>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                          Template includes its own {selectedTemplate.header_type} media
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {selectedTemplate.header_type === 'image' && 'Supported: JPG, PNG, GIF (max 5MB)'}
                      {selectedTemplate.header_type === 'video' && 'Supported: MP4, 3GP (max 16MB)'}
                      {selectedTemplate.header_type === 'document' && 'Supported: PDF, DOC, XLS, PPT, etc. (max 100MB)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional budget limit"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  className="w-full border border-gray-300 bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-black">
                    Recipients *
                  </label>
                  <button
                    type="button"
                    onClick={openContactModal}
                    className="text-[#2A8B8A] hover:text-[#238080] text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Select from Contacts
                  </button>
                </div>
                <div className="border border-gray-300 bg-white p-3 focus-within:ring-2 focus-within:ring-[#2A8B8A] focus-within:border-transparent transition-all rounded-lg">
                  <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                    {formData.recipients.map((phoneNumber, index) => (
                      <span
                        key={index}
                        className="bg-[#2A8B8A] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {phoneNumber}
                        <button
                          type="button"
                          onClick={() => removePhoneNumber(phoneNumber)}
                          className="text-white hover:text-red-200 font-bold text-lg leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      className="flex-1 min-w-[200px] bg-transparent text-black outline-none placeholder-gray-500"
                      placeholder={formData.recipients.length === 0 ? "Enter phone numbers (with country code)" : "Add another number..."}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyPress={handlePhoneKeyPress}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Total recipients: {formData.recipients.length}
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Tags
                </label>
                <div className="border border-gray-300 bg-white p-3 focus-within:ring-2 focus-within:ring-[#2A8B8A] focus-within:border-transparent transition-all rounded-lg">
                  <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-red-500 font-bold text-lg leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      className="flex-1 min-w-[150px] bg-transparent text-black outline-none placeholder-gray-500"
                      placeholder={formData.tags.length === 0 ? "Add tags for organization..." : "Add another tag..."}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Press Enter to add tags for better organization
                </p>
              </div>

              {/* Campaign Preview */}
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Message Preview
                  </label>
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <div className="p-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {(() => {
                          let preview = selectedTemplate.content || selectedTemplate.name;
                          if (selectedTemplate.variables) {
                            selectedTemplate.variables.forEach(variable => {
                              const value = formData.variable_values[variable] || `{{${variable}}}`;
                              preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), value);
                            });
                          }
                          return preview;
                        })()}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This message will be sent to {formData.recipients.length} recipient{formData.recipients.length !== 1 ? 's' : ''}
                    </p>
                    <div className="mt-3 p-3 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">Estimated Cost:</span>
                        <span className="text-lg font-bold text-blue-900">₹{((formData.recipients.length * MESSAGE_COST) + 1.0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1 space-y-1">
                        <p>₹1.00 campaign startup fee</p>
                        <p>₹{MESSAGE_COST.toFixed(2)} per message × {formData.recipients.length} recipients</p>
                      </div>
                      {userBalance < ((formData.recipients.length * MESSAGE_COST) + 1.0) && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-red-800 font-medium">Insufficient Balance</p>
                              <p className="text-xs text-red-600">
                                Need ₹{(((formData.recipients.length * MESSAGE_COST) + 1.0) - userBalance).toFixed(2)} more
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addBalanceContext(Math.ceil(((formData.recipients.length * MESSAGE_COST) + 1.0) - userBalance + 50), "Balance added for campaign creation")}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Add Balance
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || userBalance < ((formData.recipients.length * MESSAGE_COST) + 1.0) || isMediaRequired()}
              className="flex-1 bg-[#2A8B8A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#238080] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Campaign..." : 
               userBalance < ((formData.recipients.length * MESSAGE_COST) + 1.0) ? "Insufficient Balance" :
               isMediaRequired() ? "Media Required" :
               "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
      
      {/* Contact Selection Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-black">Select Contacts</h2>
                <p className="text-gray-600 text-sm">Choose contacts for your campaign</p>
              </div>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSelectedContacts(new Set());
                  setContactSearchTerm('');
                  setContactTagFilter('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-4 mb-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                  />
                </div>

                {/* Tag Filter */}
                <select
                  value={contactTagFilter}
                  onChange={(e) => setContactTagFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent bg-white"
                >
                  <option value="">All Tags</option>
                  {getAllTags().map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[#2A8B8A] hover:text-[#238080] text-sm font-medium flex items-center gap-1"
                  >
                    {selectedContacts.size === getFilteredContacts().length && getFilteredContacts().length > 0 ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Deselect All
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Select All
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedContacts.size} of {getFilteredContacts().length} contacts selected
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Total: {allContacts.length} contacts
                </span>
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-6">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8B8A]"></div>
                  <span className="ml-3 text-gray-600">Loading contacts...</span>
                </div>
              ) : getFilteredContacts().length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                  <p className="text-gray-600">
                    {contactSearchTerm || contactTagFilter 
                      ? "Try adjusting your search or filter criteria" 
                      : "You don't have any contacts yet"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFilteredContacts().map((contact) => (
                    <div
                      key={contact._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedContacts.has(contact._id)
                          ? 'border-[#2A8B8A] bg-[#2A8B8A]/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => toggleContactSelection(contact._id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          selectedContacts.has(contact._id)
                            ? 'bg-[#2A8B8A] border-[#2A8B8A]'
                            : 'border-gray-300'
                        }`}>
                          {selectedContacts.has(contact._id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">{contact.name}</h4>
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="truncate">{contact.phone}</span>
                          </div>

                          {contact.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}

                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {contact.tags.length > 3 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{contact.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedContacts.size}</span> contacts selected
                  {selectedContacts.size > 0 && (
                    <span className="ml-2">
                      (Cost: ₹{(selectedContacts.size * MESSAGE_COST + 1.0).toFixed(2)})
                    </span>
                  )}
                  {formData.budget && parseFloat(formData.budget) > 0 && (
                    <div className="mt-1 text-xs">
                      {(() => {
                        const budget = parseFloat(formData.budget);
                        const campaignStartupFee = 1.0;
                        const currentCost = (formData.recipients.length * MESSAGE_COST) + campaignStartupFee;
                        const newTotalCost = ((formData.recipients.length + selectedContacts.size) * MESSAGE_COST) + campaignStartupFee;
                        const affordableContacts = Math.floor((budget - campaignStartupFee) / MESSAGE_COST);
                        const remainingBudget = budget - currentCost;
                        const maxNewContacts = Math.max(0, affordableContacts - formData.recipients.length);
                        
                        if (newTotalCost > budget) {
                          return (
                            <span className="text-red-600 font-medium">
                              ⚠️ Budget exceeded! Can select max {maxNewContacts} more contacts
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-green-600">
                              ✓ Within budget (₹{remainingBudget.toFixed(2)} remaining)
                            </span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowContactModal(false);
                      setSelectedContacts(new Set());
                      setContactSearchTerm('');
                      setContactTagFilter('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applySelectedContacts}
                    disabled={selectedContacts.size === 0 || (formData.budget && parseFloat(formData.budget) > 0 && 
                      ((formData.recipients.length + selectedContacts.size) * MESSAGE_COST + 1.0) > parseFloat(formData.budget))}
                    className="px-6 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add {selectedContacts.size} Contact{selectedContacts.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
