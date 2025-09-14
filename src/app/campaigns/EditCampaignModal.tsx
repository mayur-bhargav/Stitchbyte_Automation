'use client';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface Template {
  name: string;
  variables?: string[];
  header_type?: string;
  header_media?: { 
    handle: string; 
    type?: string;
  };
}

interface CampaignFormData {
  name: string;
  description: string;
  template: string;
  recipients: string[];
  tags: string[];
  budget: string;
  variable_values: { [key: string]: string };
}

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  template: string;
  recipients: string[] | string;
  tags?: string[] | string;
  budget?: number;
  variable_values?: { [key: string]: string };
  media_data?: {
    type: string;
    url: string;
    public_id?: string;
    content_type?: string;
    filename?: string;
  };
}

interface Contact {
  _id: string;
  name: string;
  phone: string;
  tags?: string[];
}

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onSuccess: () => void;
}

interface ContactSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactsSelected: (contacts: string[]) => void;
  selectedContacts: string[];
}

const ContactSelectionModal: React.FC<ContactSelectionModalProps> = ({
  isOpen,
  onClose,
  onContactsSelected,
  selectedContacts
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedContacts);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  const fetchContacts = async () => {
    try {
      const data = await apiService.getContacts();
      // console.log('Contacts API response:', data); // Debug log
      // Backend returns {contacts: [...]}
      setContacts((data as any).contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const handleContactToggle = (contactId: string) => {
    setSelectedIds(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredContacts.map(contact => contact._id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleDone = () => {
    const selectedPhones = contacts
      .filter(contact => selectedIds.includes(contact._id))
      .map(contact => contact.phone);
    onContactsSelected(selectedPhones);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-black">Select Contacts</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 bg-white text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors text-sm"
            >
              Select All ({filteredContacts.length})
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Deselect All
            </button>
            <div className="ml-auto text-sm text-gray-600 flex items-center">
              {selectedIds.length} selected
            </div>
          </div>

          {/* Contacts List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No contacts found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <div key={contact._id} className="p-4 hover:bg-gray-50">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(contact._id)}
                        onChange={() => handleContactToggle(contact._id)}
                        className="mr-3 rounded border-gray-300 text-[#2A8B8A] focus:ring-[#2A8B8A]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-black">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.phone}</div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contact.tags.map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="flex-1 px-6 py-3 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors"
            >
              Add Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EditCampaignModal({ isOpen, onClose, campaign, onSuccess }: EditCampaignModalProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    template: '',
    recipients: [],
    tags: [],
    budget: '',
    variable_values: {}
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');

  // Load campaign data when modal opens
  useEffect(() => {
    if (isOpen && campaign) {
      // console.log('Loading campaign data:', campaign); // Debug log
      fetchCampaignDetails();
    }
  }, [isOpen, campaign]);

  const fetchCampaignDetails = async () => {
    if (!campaign?._id) return;
    
    setIsLoadingCampaign(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:8000/campaigns/${campaign._id}`, {
        headers
      });
      const data = await response.json();
      
      if (data.success && data.campaign) {
        const fullCampaign = data.campaign;
        // console.log('Full campaign data:', fullCampaign); // Debug log
        
        // Handle recipients - could be array or comma-separated string
        let recipients: string[] = [];
        if (Array.isArray(fullCampaign.contacts)) {
          recipients = fullCampaign.contacts;
        } else if (Array.isArray(fullCampaign.recipients)) {
          recipients = fullCampaign.recipients;
        } else if (typeof fullCampaign.contacts === 'string') {
          recipients = fullCampaign.contacts.split(',').map((r: string) => r.trim()).filter((r: string) => r);
        } else if (typeof fullCampaign.recipients === 'string') {
          recipients = fullCampaign.recipients.split(',').map((r: string) => r.trim()).filter((r: string) => r);
        }
        
        // Handle tags - could be array or comma-separated string
        let tags: string[] = [];
        if (Array.isArray(fullCampaign.tags)) {
          tags = fullCampaign.tags;
        } else if (typeof fullCampaign.tags === 'string') {
          tags = fullCampaign.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        }
        
        setFormData({
          name: fullCampaign.name || '',
          description: fullCampaign.description || '',
          template: fullCampaign.template || '',
          recipients: recipients,
          tags: tags,
          budget: fullCampaign.budget ? fullCampaign.budget.toString() : '',
          variable_values: fullCampaign.template_variables || fullCampaign.variable_values || {}
        });
        
        // console.log('Set form data:', { // Debug log
        //   name: fullCampaign.name,
        //   template: fullCampaign.template,
        //   recipients: recipients,
        //   tags: tags
        // });
      } else {
        setError('Failed to load campaign details');
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      setError('Failed to load campaign details');
    } finally {
      setIsLoadingCampaign(false);
    }
  };

  // Load templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const data = await apiService.getTemplates();
      // console.log('Templates API response:', data); // Debug log
      // Backend returns {templates: [...]}
      setTemplates((data as any).templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleTemplateChange = (templateName: string) => {
    setFormData(prev => ({
      ...prev,
      template: templateName,
      variable_values: {} // Reset variables when template changes
    }));
  };

  const handlePhoneKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phone.trim()) {
      e.preventDefault();
      if (!formData.recipients.includes(phone.trim())) {
        setFormData(prev => ({
          ...prev,
          recipients: [...prev.recipients, phone.trim()]
        }));
        setPhone('');
      }
    }
  };

  const removePhoneNumber = (phoneToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(p => p !== phoneToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
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

  const openContactModal = () => {
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  const handleContactsSelected = (selectedPhones: string[]) => {
    setFormData(prev => ({
      ...prev,
      recipients: [...new Set([...prev.recipients, ...selectedPhones])] // Avoid duplicates
    }));
  };

  const isMediaRequired = () => {
    const selectedTemplate = templates.find(t => t.name === formData.template);
    if (!selectedTemplate || !selectedTemplate.header_type) return false;
    
    const hasMedia = mediaFile || mediaUrl || selectedTemplate.header_media?.handle || campaign?.media_data?.url;
    return ['image', 'video', 'document'].includes(selectedTemplate.header_type.toLowerCase()) && !hasMedia;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.name.trim()) {
      setError('Campaign name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.template) {
      setError('Please select a template');
      setIsSubmitting(false);
      return;
    }

    if (formData.recipients.length === 0) {
      setError('Please add at least one recipient');
      setIsSubmitting(false);
      return;
    }

    if (isMediaRequired()) {
      setError('This template requires media. Please upload a file or provide a URL.');
      setIsSubmitting(false);
      return;
    }

    // Validate template variables
    const selectedTemplate = templates.find(t => t.name === formData.template);
    if (selectedTemplate?.variables) {
      for (const variable of selectedTemplate.variables) {
        if (!formData.variable_values[variable]?.trim()) {
          setError(`Please provide a value for {{${variable}}}`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('template', formData.template);
      formDataToSend.append('contacts', JSON.stringify(formData.recipients)); // Backend expects 'contacts', not 'recipients'
      formDataToSend.append('tags', formData.tags.join(', '));
      
      // Convert budget to number, default to 0 if empty
      const budgetValue = formData.budget ? parseFloat(formData.budget) : 0;
      formDataToSend.append('budget', budgetValue.toString());

      if (mediaFile) {
        formDataToSend.append('media', mediaFile);
      } else if (mediaUrl) {
        formDataToSend.append('media_url', mediaUrl);
      }

      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:8000/campaigns/${campaign?._id}`, {
        method: 'PUT',
        headers,
        body: formDataToSend,
      });

      if (response.ok) {
        onSuccess();
        resetForm();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      setError('Failed to update campaign');
    } finally {
      setIsSubmitting(false);
    }
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
  };  const handleClose = () => {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Edit Campaign</h2>
                <p className="text-gray-600">Update your WhatsApp marketing campaign</p>
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

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        {isLoadingCampaign ? (
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-[#2A8B8A] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading campaign details...</p>
            </div>
          </div>
        ) : (
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
                  

                  

                  
                  {/* Media Upload Options */}
                  <div className="space-y-4">
                    {/* Campaign Media Option (if exists) */}
                    {campaign?.media_data && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="radio"
                            id="use-campaign-media"
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
                          <label htmlFor="use-campaign-media" className="text-sm font-medium text-gray-700">
                            Use campaign's saved {selectedTemplate.header_type}
                          </label>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {campaign.media_data.filename ? `Campaign media: ${campaign.media_data.filename}` : 'Campaign has saved media'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* File Upload Option */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          id="upload-file"
                          name="media-option"
                          checked={mediaFile !== null}
                          onChange={() => {
                            setMediaUrl('');
                          }}
                          className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                        />
                        <label htmlFor="upload-file" className="text-sm font-medium text-gray-700">
                          Upload new {selectedTemplate.header_type} file
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
                          checked={mediaUrl.length > 0}
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
                    
                    {/* Default Template Media Option (if exists and no campaign media) */}
                    {selectedTemplate.header_media?.handle && !campaign?.media_data && (
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
                    {Array.isArray(formData.recipients) && formData.recipients.map((phoneNumber, index) => (
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
                      placeholder={Array.isArray(formData.recipients) && formData.recipients.length === 0 ? "Enter phone numbers (with country code)" : "Add another number..."}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyPress={handlePhoneKeyPress}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Total recipients: {Array.isArray(formData.recipients) ? formData.recipients.length : 0}
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Tags
                </label>
                <div className="border border-gray-300 bg-white p-3 focus-within:ring-2 focus-within:ring-[#2A8B8A] focus-within:border-transparent transition-all rounded-lg">
                  <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                    {Array.isArray(formData.tags) && formData.tags.map((tag, index) => (
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
                      className="flex-1 min-w-[200px] bg-transparent text-black outline-none placeholder-gray-500"
                      placeholder={Array.isArray(formData.tags) && formData.tags.length === 0 ? "Add tags..." : "Add another tag..."}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                    />
                  </div>
                </div>
              </div>

              {/* Cost and Budget Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Selected Recipients:</span>
                    <span className="font-semibold text-black">{Array.isArray(formData.recipients) ? formData.recipients.length : 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Cost per message:</span>
                    <span className="font-semibold text-black">₹1.70</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Campaign startup fee:</span>
                    <span className="font-semibold text-black">₹1.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Message cost:</span>
                    <span className="font-semibold text-black">₹{((Array.isArray(formData.recipients) ? formData.recipients.length : 0) * 1.70).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-300 pt-3">
                    <span className="text-sm font-medium text-gray-700">Total Estimated Cost:</span>
                    <span className="font-semibold text-[#2A8B8A]">₹{(1.00 + (Array.isArray(formData.recipients) ? formData.recipients.length : 0) * 1.70).toFixed(2)}</span>
                  </div>
                  {formData.budget && parseFloat(formData.budget) > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Budget:</span>
                        <span className="font-semibold text-black">₹{parseFloat(formData.budget).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Remaining:</span>
                        <span className={`font-semibold ${parseFloat(formData.budget) >= (1.00 + (Array.isArray(formData.recipients) ? formData.recipients.length : 0) * 1.70) ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{(parseFloat(formData.budget) - (1.00 + (Array.isArray(formData.recipients) ? formData.recipients.length : 0) * 1.70)).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.recipients.length === 0}
              className="flex-1 px-6 py-3 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Campaign...
                </>
              ) : (
                'Update Campaign'
              )}
            </button>
          </div>
        </form>
        )}
      </div>

      {/* Contact Selection Modal */}
      {isContactModalOpen && (
        <ContactSelectionModal
          isOpen={isContactModalOpen}
          onClose={closeContactModal}
          onContactsSelected={handleContactsSelected}
          selectedContacts={formData.recipients}
        />
      )}
    </div>
  );
}
