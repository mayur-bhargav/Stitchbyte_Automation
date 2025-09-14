"use client";

import React, { useState, useEffect } from 'react';
import { LuX, LuUpload, LuImage, LuFileText, LuPlay, LuUsers, LuMessageSquare } from 'react-icons/lu';
import { apiService } from '../../services/apiService';

interface Template {
  id: string;
  name: string;
  content: string;
  body?: string;
  status?: string;
  language?: string;
  category?: string;
  placeholders?: string[];
  media_placeholders?: string[];
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  contacts?: Contact[];
}

interface Contact {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
}

interface PlaceholderData {
  [key: string]: string;
}

interface MediaFiles {
  [key: string]: File;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateCampaign: (campaignData: any) => Promise<void>;
  segments: Segment[];
  templates: Template[];
  onRefreshSegments?: () => void;
}

export default function EnhancedCreateCampaignModal({
  isOpen,
  onClose,
  onCreateCampaign,
  segments,
  templates,
  onRefreshSegments
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [placeholderData, setPlaceholderData] = useState<PlaceholderData>({});
  const [mediaFiles, setMediaFiles] = useState<MediaFiles>({});
  const [campaignType, setCampaignType] = useState('immediate');
  const [scheduledAt, setScheduledAt] = useState('');

  // A/B Testing
  const [enableABTest, setEnableABTest] = useState(false);
  const [abTestName, setABTestName] = useState('');
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [testDuration, setTestDuration] = useState(48);
  const [variantBTemplate, setVariantBTemplate] = useState<Template | null>(null);

  // Segment contacts
  const [segmentContacts, setSegmentContacts] = useState<{[key: string]: Contact[]}>({});
  const [loadingContacts, setLoadingContacts] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setCampaignName('');
    setCampaignDescription('');
    setSelectedTemplate(null);
    setSelectedSegments([]);
    setPlaceholderData({});
    setMediaFiles({});
    setCampaignType('immediate');
    setScheduledAt('');
    setEnableABTest(false);
    setABTestName('');
    setSplitPercentage(50);
    setTestDuration(48);
    setVariantBTemplate(null);
    setSegmentContacts({});
    setLoadingContacts({});
    setError(null);
  };

  // Parse placeholders from template content
  const parsePlaceholders = (content: string): string[] => {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;
    
    while ((match = placeholderRegex.exec(content)) !== null) {
      const placeholder = match[1].trim();
      if (!matches.includes(placeholder)) {
        matches.push(placeholder);
      }
    }
    
    return matches;
  };

  // Parse media placeholders (looking for image, video, document references)
  const parseMediaPlaceholders = (content: string): string[] => {
    const mediaRegex = /\{\{(image|video|document|media)[\w_]*\}\}/gi;
    const matches: string[] = [];
    let match;
    
    while ((match = mediaRegex.exec(content)) !== null) {
      const placeholder = match[0].replace(/[{}]/g, ''); // Get full placeholder without braces
      if (!matches.includes(placeholder)) {
        matches.push(placeholder);
      }
    }
    
    return matches;
  };

  // Load contacts for a segment
  const loadSegmentContacts = async (segmentId: string) => {
    if (segmentContacts[segmentId]) return; // Already loaded
    
    try {
      const response = await apiService.getSegmentContacts(segmentId, { limit: 10 }) as any;
      if (response && response.contacts) {
        setSegmentContacts(prev => ({ ...prev, [segmentId]: response.contacts }));
      } else {
        // Fallback mock data if API not ready
        setSegmentContacts(prev => ({ 
          ...prev, 
          [segmentId]: [
            { _id: '1', name: 'John Doe', phone: '+1234567890' },
            { _id: '2', name: 'Jane Smith', phone: '+0987654321' }
          ]
        }));
      }
    } catch (error) {
      console.error('Error loading segment contacts:', error);
      // Fallback mock data
      setSegmentContacts(prev => ({ 
        ...prev, 
        [segmentId]: [
          { _id: '1', name: 'John Doe', phone: '+1234567890' },
          { _id: '2', name: 'Jane Smith', phone: '+0987654321' }
        ]
      }));
    }
  };

  // Handle template selection
  const handleTemplateSelection = (template: Template) => {
    setSelectedTemplate(template);
    
    // Parse placeholders from template content
    const content = template.body || template.content || '';
    const placeholders = parsePlaceholders(content);
    const mediaPlaceholders = parseMediaPlaceholders(content);
    
    // Initialize placeholder data
    const initialData: PlaceholderData = {};
    placeholders.forEach(placeholder => {
      initialData[placeholder] = '';
    });
    setPlaceholderData(initialData);
    
    // Initialize media files
    const initialMedia: MediaFiles = {};
    mediaPlaceholders.forEach(placeholder => {
      // Don't set empty files, just prepare the structure
    });
    setMediaFiles(initialMedia);
  };

  // Handle placeholder data change
  const handlePlaceholderChange = (placeholder: string, value: string) => {
    setPlaceholderData(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  // Handle media file upload
  const handleMediaUpload = (placeholder: string, file: File) => {
    setMediaFiles(prev => ({
      ...prev,
      [placeholder]: file
    }));
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return campaignName.trim() !== '' && selectedTemplate !== null;
      case 2:
        if (!selectedTemplate) return false;
        const content = selectedTemplate.body || selectedTemplate.content || '';
        const placeholders = parsePlaceholders(content);
        const mediaPlaceholders = parseMediaPlaceholders(content);
        
        // Check all text placeholders are filled
        const allPlaceholdersFilled = placeholders.every(p => 
          placeholderData[p] && placeholderData[p].trim() !== ''
        );
        
        // Check all media placeholders have files
        const allMediaFilled = mediaPlaceholders.every(p => 
          mediaFiles[p] && mediaFiles[p] instanceof File
        );
        
        return allPlaceholdersFilled && allMediaFilled;
      case 3:
        return selectedSegments.length > 0;
      case 4:
        if (enableABTest) {
          return abTestName.trim() !== '' && variantBTemplate !== null;
        }
        return true;
      default:
        return true;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    } else {
      setError('Please fill all required fields before proceeding.');
    }
  };

  // Handle campaign creation
  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare campaign data
      const campaignData = {
        name: campaignName,
        description: campaignDescription,
        type: campaignType,
        template_id: selectedTemplate?.id,
        segment_ids: selectedSegments,
        placeholder_data: placeholderData,
        media_files: mediaFiles,
        scheduled_at: scheduledAt || null,
        ab_test: enableABTest ? {
          enabled: true,
          test_name: abTestName,
          split_percentage: splitPercentage,
          variant_b_template_id: variantBTemplate?.id,
          test_duration_hours: testDuration
        } : { enabled: false }
      };

      await onCreateCampaign(campaignData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create New Campaign</h2>
            <p className="text-sm text-slate-600 mt-1">Step {currentStep} of {totalSteps}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-[#2A8B8A] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Campaign Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={campaignDescription}
                      onChange={(e) => setCampaignDescription(e.target.value)}
                      placeholder="Brief description of your campaign"
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Campaign Type
                    </label>
                    <select
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    >
                      <option value="immediate">Send Immediately</option>
                      <option value="scheduled">Schedule for Later</option>
                    </select>
                  </div>

                  {campaignType === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Select Message Template *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {templates.filter(t => t.status === 'APPROVED').map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelection(template)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h5 className="font-medium text-slate-900">{template.name}</h5>
                      <p className="text-sm text-slate-600 mt-2 truncate">
                        {template.body || template.content}
                      </p>
                      {template.language && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                          {template.language}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Template Configuration */}
          {currentStep === 2 && selectedTemplate && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Configure Template: {selectedTemplate.name}</h3>
                
                {/* Show template preview */}
                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Template Preview:</h4>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                    {selectedTemplate.body || selectedTemplate.content}
                  </p>
                </div>

                {/* Text Placeholders */}
                {(() => {
                  const content = selectedTemplate.body || selectedTemplate.content || '';
                  const placeholders = parsePlaceholders(content);
                  
                  if (placeholders.length > 0) {
                    return (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-slate-900 mb-4">Fill Template Data</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {placeholders.map((placeholder) => (
                            <div key={placeholder}>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                {placeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} *
                              </label>
                              <input
                                type="text"
                                value={placeholderData[placeholder] || ''}
                                onChange={(e) => handlePlaceholderChange(placeholder, e.target.value)}
                                placeholder={`Enter ${placeholder}`}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Media Placeholders */}
                {(() => {
                  const content = selectedTemplate.body || selectedTemplate.content || '';
                  const mediaPlaceholders = parseMediaPlaceholders(content);
                  
                  if (mediaPlaceholders.length > 0) {
                    return (
                      <div>
                        <h4 className="text-md font-medium text-slate-900 mb-4">Upload Media Files</h4>
                        <div className="space-y-4">
                          {mediaPlaceholders.map((placeholder) => (
                            <div key={placeholder} className="border border-slate-200 rounded-lg p-4">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                {placeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} *
                              </label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="file"
                                  accept={placeholder.toLowerCase().includes('image') ? 'image/*' : 
                                         placeholder.toLowerCase().includes('video') ? 'video/*' : '*/*'}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleMediaUpload(placeholder, file);
                                  }}
                                  className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2A8B8A] file:text-white hover:file:bg-[#2A8B8A]/90"
                                />
                                {mediaFiles[placeholder] && (
                                  <span className="text-sm text-green-600">✓ {mediaFiles[placeholder].name}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* Step 3: Select Segments */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Select Target Segments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {segments.map((segment) => (
                    <div key={segment.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={segment.id}
                          checked={selectedSegments.includes(segment.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSegments(prev => [...prev, segment.id]);
                              loadSegmentContacts(segment.id);
                            } else {
                              setSelectedSegments(prev => prev.filter(id => id !== segment.id));
                            }
                          }}
                          className="mt-1 w-4 h-4 text-[#2A8B8A] focus:ring-[#2A8B8A] border-slate-300 rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor={segment.id} className="block text-sm font-medium text-slate-900 cursor-pointer">
                            {segment.name}
                          </label>
                          <p className="text-sm text-slate-600">{segment.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{segment.contactCount} contacts</p>
                          
                          {/* Show contacts when segment is selected */}
                          {selectedSegments.includes(segment.id) && (
                            <div className="mt-3 border-t border-slate-100 pt-3">
                              {loadingContacts[segment.id] ? (
                                <p className="text-xs text-slate-500">Loading contacts...</p>
                              ) : segmentContacts[segment.id] ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  <p className="text-xs font-medium text-slate-600">Contacts in this segment:</p>
                                  {segmentContacts[segment.id].slice(0, 5).map((contact) => (
                                    <div key={contact._id} className="flex items-center justify-between text-xs">
                                      <span className="font-medium">{contact.name}</span>
                                      <span className="text-slate-500">{contact.phone}</span>
                                    </div>
                                  ))}
                                  {segmentContacts[segment.id].length > 5 && (
                                    <p className="text-xs text-slate-500">+{segmentContacts[segment.id].length - 5} more contacts</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500">No contacts found</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: A/B Testing (Optional) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">A/B Testing (Optional)</h3>
                
                <div className="flex items-center gap-3 mb-6">
                  <input
                    type="checkbox"
                    id="enableABTest"
                    checked={enableABTest}
                    onChange={(e) => setEnableABTest(e.target.checked)}
                    className="w-4 h-4 text-[#2A8B8A] focus:ring-[#2A8B8A] border-slate-300 rounded"
                  />
                  <label htmlFor="enableABTest" className="text-sm font-medium text-slate-900">
                    Enable A/B Testing for this campaign
                  </label>
                </div>

                {enableABTest && (
                  <div className="space-y-4 border border-slate-200 rounded-lg p-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Test Name *
                      </label>
                      <input
                        type="text"
                        value={abTestName}
                        onChange={(e) => setABTestName(e.target.value)}
                        placeholder="Enter A/B test name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Split Percentage (Variant A)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="90"
                          value={splitPercentage}
                          onChange={(e) => setSplitPercentage(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                        />
                        <p className="text-xs text-slate-500 mt-1">Variant B will get {100 - splitPercentage}%</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Test Duration (Hours)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={testDuration}
                          onChange={(e) => setTestDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Variant B Template *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                        {templates.filter(t => t.status === 'APPROVED' && t.id !== selectedTemplate?.id).map((template) => (
                          <div
                            key={template.id}
                            onClick={() => setVariantBTemplate(template)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              variantBTemplate?.id === template.id
                                ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <h5 className="font-medium text-sm text-slate-900">{template.name}</h5>
                            <p className="text-xs text-slate-600 mt-1 truncate">
                              {template.body || template.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review & Create */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Review Campaign</h3>
                
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-medium text-slate-900">Campaign Details</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {campaignName}</p>
                      <p><span className="font-medium">Type:</span> {campaignType}</p>
                      <p><span className="font-medium">Template:</span> {selectedTemplate?.name}</p>
                      <p><span className="font-medium">Segments:</span> {selectedSegments.length} selected</p>
                      {enableABTest && (
                        <p><span className="font-medium">A/B Test:</span> {abTestName} ({splitPercentage}% / {100 - splitPercentage}%)</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-medium text-slate-900">Total Reach</h4>
                    <p className="text-2xl font-bold text-[#2A8B8A] mt-1">
                      {selectedSegments.reduce((total, segmentId) => {
                        const segment = segments.find(s => s.id === segmentId);
                        return total + (segment?.contactCount || 0);
                      }, 0)} contacts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : onClose()}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            {currentStep > 1 ? 'Previous' : 'Cancel'}
          </button>
          
          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="px-6 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateCampaign}
                disabled={loading || !validateStep(currentStep)}
                className="px-6 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LuPlay className="w-4 h-4" />
                    Create Campaign
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}