"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LuArrowLeft,
  LuUsers, 
  LuSend,
  LuClock,
  LuImage,
  LuUpload,
  LuCheck
} from 'react-icons/lu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../contexts/PermissionContext';
import { ApprovalWrapper } from '../../components/ApprovalWrapper';
import { apiService } from '../../services/apiService';

interface Segment {
  id: string;
  name: string;
  contactCount?: number;
  contact_count?: number; // API returns this format
}

interface UploadResponse {
  success: boolean;
  uploads: {
    [key: string]: {
      success: boolean;
      file_url: string;
    };
  };
}

interface Template {
  id: string;
  name: string;
  content?: string;
  body?: string;
  header?: string;
  footer?: string;
  status?: string;
  language?: string;
  category?: string;
  header_type?: string;
  header_media?: {
    type: string;
    handle: string;
  };
  variables?: string[];
}

const CreateCampaignPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const { hasPermission } = usePermissions();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rawTemplates, setRawTemplates] = useState<any[]>([]);
  
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    type: 'immediate',
    templateId: '',
    segmentIds: [] as string[],
    scheduledAt: '',
    timezone: 'Asia/Kolkata',
    sendRateLimit: 20,
    templateData: {} as Record<string, string>, // For template placeholders like {{1}}, {{2}}
    mediaFiles: {} as Record<string, File | string>, // For image headers - can be File (before upload) or string (after upload)
    budget: {
      enabled: true,
      totalBudget: 1000,
      costPerMessage: 2.50,
      maxDays: 30,
      dailyBudgetLimit: 0,
      autoStop: true
    },
    abTest: {
      enabled: false,
      testName: '',
      splitPercentage: 50,
      variantBTemplateId: '',
      variantBTemplateData: {} as Record<string, string>,
      variantBMediaFiles: {} as Record<string, File | string>, // Can be File (before upload) or string (after upload)
      testDurationHours: 48
    }
  });

  // Merge processed templates with raw template data to ensure we have all fields
  const enrichedTemplates = templates.map(template => {
    const rawTemplate = rawTemplates?.find(raw => raw.id === template.id);
    if (rawTemplate) {
      // Merge processed template with raw data, preferring raw data for missing fields
      return {
        ...template,
        body: template.body || rawTemplate.body,
        header: template.header || rawTemplate.header,
        footer: template.footer || rawTemplate.footer,
        header_type: template.header_type || rawTemplate.header_type,
        header_media: template.header_media || rawTemplate.header_media,
        variables: template.variables || rawTemplate.variables
      };
    }
    return template;
  });

  // Get selected template for placeholder detection
  const selectedTemplate = enrichedTemplates.find(t => t.id === campaignData.templateId);
  
  // Extract placeholders from template content
  const extractPlaceholders = (content: string | undefined): string[] => {
    if (!content) return [];
    const placeholderRegex = /\{\{(\d+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(content)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }
    return placeholders.sort((a, b) => parseInt(a) - parseInt(b));
  };

  // Check if template has image header
  const hasImageHeader = (template: Template | undefined) => {
    if (!template) return false;
    return template.header_type && ['image', 'video', 'document'].includes(template.header_type.toLowerCase());
  };

  // Get template content (supports both content and body fields)
  const getTemplateContent = (template: Template | undefined): string => {
    if (!template) return '';
    return template.body || template.content || '';
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        loadSegments(),
        loadTemplates()
      ]);
    } finally {
      setDataLoading(false);
    }
  };

  const loadSegments = async () => {
    try {
      // console.log('Loading segments...');
      // Use the correct getSegments method instead of getOptional
      const response: any = await apiService.getSegments({ page: 1, limit: 50 });
      // console.log('Segments API response:', response);
      
      if (response && response.segments) {
        // console.log('Processed segments data:', response.segments);
        setSegments(response.segments);
      } else {
        // console.log('No segments found in response');
        setSegments([]);
      }
    } catch (error) {
      console.error('Error loading segments:', error);
      setSegments([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const response: any = await apiService.getOptional('/templates');
      
      if (response) {
        // Store raw templates for the modal
        const rawTemplateData = response.templates || response || [];
        setRawTemplates(rawTemplateData);
        
        let tpls = rawTemplateData
          .filter((template: any) => template && template.name)
          .map((template: any) => ({
            id: template.id,
            name: template.name,
            content: template.body || template.content || '',
            body: template.body,
            header: template.header,
            footer: template.footer,
            status: template.status,
            language: template.language,
            category: template.category,
            header_type: template.header_type,
            header_media: template.header_media,
            variables: template.variables
          }));
        
        setTemplates(tpls);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setTemplates([]);
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMediaUpload = async (file: File, mediaType = 'header') => {
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await apiService.postFormData<UploadResponse>('/campaigns/upload-media', formData);
      
      if (response.success && response.uploads) {
        const uploadKey = Object.keys(response.uploads)[0];
        const uploadResult = response.uploads[uploadKey];
        
        if (uploadResult.success) {
          // ✅ CRITICAL: Update your state with the Cloudinary URL
          setCampaignData(prev => ({
            ...prev,
            mediaFiles: {
              ...prev.mediaFiles,
              [mediaType]: uploadResult.file_url  // Use the Cloudinary URL
            }
          }));
          
          return uploadResult.file_url;
        }
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Media upload error:', error);
      throw error;
    }
  };

  const handleVariantBMediaUpload = async (file: File, mediaType = 'header') => {
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await apiService.postFormData<UploadResponse>('/campaigns/upload-media', formData);
      
      if (response.success && response.uploads) {
        const uploadKey = Object.keys(response.uploads)[0];
        const uploadResult = response.uploads[uploadKey];
        
        if (uploadResult.success) {
          // ✅ CRITICAL: Update your state with the Cloudinary URL for Variant B
          setCampaignData(prev => ({
            ...prev,
            abTest: {
              ...prev.abTest,
              variantBMediaFiles: {
                ...prev.abTest.variantBMediaFiles,
                [mediaType]: uploadResult.file_url  // Use the Cloudinary URL
              }
            }
          }));
          
          return uploadResult.file_url;
        }
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Variant B media upload error:', error);
      throw error;
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      
      // ✅ Make sure mediaFiles contains actual URLs, not empty objects
      const campaignPayload = {
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        template_id: campaignData.templateId,
        segment_ids: campaignData.segmentIds,
        send_rate_limit: campaignData.sendRateLimit,
        template_data: campaignData.templateData || {},
        media_files: campaignData.mediaFiles || {}, // Should contain URLs like {"header": "https://cloudinary.com/..."}
        budget: {
          total_budget: campaignData.budget.totalBudget,
          cost_per_message: campaignData.budget.costPerMessage,
          max_days: campaignData.budget.maxDays,
          daily_budget_limit: campaignData.budget.dailyBudgetLimit,
          auto_stop: campaignData.budget.autoStop
        },
        ...(campaignData.type === 'scheduled' && {
          schedule_datetime: campaignData.scheduledAt,
          timezone: campaignData.timezone
        }),
        ...(campaignData.abTest.enabled && {
          ab_test: {
            enabled: true,
            test_name: campaignData.abTest.testName,
            split_percentage: campaignData.abTest.splitPercentage,
            variant_b_template_id: campaignData.abTest.variantBTemplateId,
            variant_b_template_data: campaignData.abTest.variantBTemplateData,
            variant_b_media_files: campaignData.abTest.variantBMediaFiles || {}, // Also should contain URLs
            test_duration_hours: campaignData.abTest.testDurationHours
          }
        })
      };

      // console.log('Sending campaign data:', campaignPayload); // Debug this!
      
      // Call the API to create the campaign
      await apiService.createCampaign(campaignPayload);
      
      // Redirect back to campaigns page
      router.push('/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedSegments = segments.filter(segment => 
    campaignData.segmentIds.includes(segment.id)
  );
  const totalContacts = selectedSegments.reduce((sum, segment) => 
    sum + (segment.contactCount || segment.contact_count || 0), 0
  );

  // Check permission
  if (!hasPermission('manage_campaigns')) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to create campaigns.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (dataLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-[#2A8B8A] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-600">Loading campaign data...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/campaigns"
                  className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <LuArrowLeft className="w-5 h-5 mr-2" />
                </Link>
                <div className="w-px h-6 bg-slate-300"></div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Create New Campaign</h1>
                  <p className="text-sm text-slate-600">Step {currentStep} of 7</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="my-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              {/* Step indicators and labels in single grid */}
              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((step, index) => (
                  <div key={step} className="flex flex-col items-center relative">
                    {/* Step circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 relative z-10 ${
                      step <= currentStep 
                        ? 'bg-[#2A8B8A] text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {step < currentStep ? <LuCheck className="w-4 h-4" /> : step}
                    </div>
                    {/* Step label */}
                    <span className="text-xs text-slate-900 font-medium text-center">
                      {step === 1 && 'Basic Info'}
                      {step === 2 && 'Template'}
                      {step === 3 && 'Fill Data'}
                      {step === 4 && 'Audience'}
                      {step === 5 && 'A/B Test'}
                      {step === 6 && 'Budget'}
                      {step === 7 && 'Schedule'}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Connecting line - positioned to connect step circles */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200" style={{ 
                transform: 'translateY(-50%)', 
                marginLeft: 'calc(7.14% + 16px)', 
                marginRight: 'calc(7.14% + 16px)' 
              }}>
                <div 
                  className="h-full bg-[#2A8B8A] transition-all duration-300" 
                  style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl sm:px-2 lg:px-2">
          <div className="bg-white"> 
            <div className="p-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">Campaign Details</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                      placeholder="Enter campaign name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={campaignData.description}
                      onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                      placeholder="Brief description of your campaign"
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      Campaign Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setCampaignData({ ...campaignData, type: 'immediate' })}
                        className={`p-6 border-2 rounded-xl text-left transition-colors ${
                          campaignData.type === 'immediate'
                            ? 'border-[#2A8B8A] bg-[#2A8B8A]/5 text-[#2A8B8A]'
                            : 'border-slate-200 hover:border-slate-300 text-slate-900'
                        }`}
                      >
                        <LuSend className={`w-6 h-6 mb-3 ${
                          campaignData.type === 'immediate' ? 'text-[#2A8B8A]' : 'text-slate-600'
                        }`} />
                        <div className="font-semibold text-slate-900 mb-1">Send Now</div>
                        <div className="text-sm text-slate-600">Start campaign immediately</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampaignData({ ...campaignData, type: 'scheduled' })}
                        className={`p-6 border-2 rounded-xl text-left transition-colors ${
                          campaignData.type === 'scheduled'
                            ? 'border-[#2A8B8A] bg-[#2A8B8A]/5 text-[#2A8B8A]'
                            : 'border-slate-200 hover:border-slate-300 text-slate-900'
                        }`}
                      >
                        <LuClock className={`w-6 h-6 mb-3 ${
                          campaignData.type === 'scheduled' ? 'text-[#2A8B8A]' : 'text-slate-600'
                        }`} />
                        <div className="font-semibold text-slate-900 mb-1">Schedule</div>
                        <div className="text-sm text-slate-600">Send at a later time</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Select Message Template */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">Select Message Template</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      Choose Template *
                    </label>
                    <select
                      value={campaignData.templateId}
                      onChange={(e) => setCampaignData({ ...campaignData, templateId: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                    >
                      <option value="">Choose a template</option>
                      {enrichedTemplates
                        .filter(template => !template.status || template.status === 'APPROVED')
                        .map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                            {template.language && ` (${template.language})`}
                            {template.category && ` - ${template.category}`}
                          </option>
                        ))}
                    </select>
                    {enrichedTemplates.length === 0 && (
                      <p className="text-sm text-slate-500 mt-2">
                        No templates available. Please create templates first.
                      </p>
                    )}
                    {enrichedTemplates.filter(t => !t.status || t.status === 'APPROVED').length === 0 && enrichedTemplates.length > 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        No approved templates available. Please get your templates approved.
                      </p>
                    )}
                  </div>

                  {/* Template Preview */}
                  {campaignData.templateId && selectedTemplate && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-slate-900 mb-4">Template Preview</h3>
                      
                      {/* WhatsApp Style Preview */}
                      <div className="max-w-md mx-auto bg-[#0a0e1a] rounded-xl p-6">
                        {/* Header */}
                        <div className="flex items-center mb-4 text-white">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium">B</span>
                          </div>
                          <div>
                            <div className="font-medium">Business Account</div>
                            <div className="text-xs text-gray-400">WhatsApp Business</div>
                          </div>
                        </div>
                        
                        {/* Message Bubble */}
                        <div className="bg-[#005c4b] rounded-lg p-4 ml-8 relative">
                          {/* Template Header */}
                          {selectedTemplate?.header && selectedTemplate.header_type === 'text' && (
                            <div className="mb-3 font-semibold text-white text-base">
                              {selectedTemplate.header}
                            </div>
                          )}

                          {/* Media Header */}
                          {hasImageHeader(selectedTemplate) && (
                            <div className="mb-3 rounded-lg overflow-hidden">
                              {selectedTemplate?.header_media?.handle ? (
                                <div className="relative">
                                  {selectedTemplate.header_type === 'image' && (
                                    <img 
                                      src={selectedTemplate.header_media.handle} 
                                      alt="Template media"
                                      className="w-full h-48 object-cover rounded-lg"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                                      }}
                                    />
                                  )}
                                  <div className="hidden bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                                    <div className="text-gray-500 text-center">
                                      <div className="text-2xl mb-2">🖼️</div>
                                      <div className="text-sm">Template Media</div>
                                    </div>
                                  </div>
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                    Template Default
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center">
                                  <LuImage className="w-8 h-8 text-gray-400" />
                                  <span className="ml-2 text-sm text-gray-500">
                                    {selectedTemplate?.header_type?.toUpperCase()} Header
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Message Content */}
                          <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                            {getTemplateContent(selectedTemplate)}
                          </div>

                          {/* Footer */}
                          {selectedTemplate?.footer && (
                            <div className="mt-3 pt-2 border-t border-white/20 text-white/70 text-xs">
                              {selectedTemplate.footer}
                            </div>
                          )}
                          
                          {/* Message time */}
                          <div className="flex items-center justify-end mt-2 text-xs text-gray-300">
                            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <div className="ml-1 flex">
                              <div className="w-1 h-1 bg-gray-300 rounded-full mr-0.5"></div>
                              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            </div>
                          </div>
                          
                          {/* Message tail */}
                          <div className="absolute bottom-0 right-[-6px] w-0 h-0 border-l-[6px] border-l-[#005c4b] border-b-[6px] border-b-transparent"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Fill Template Data */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">Fill Template Data</h2>
                  
                  {selectedTemplate ? (
                    <div className="space-y-6">
                      {/* Image Header Upload */}
                      {hasImageHeader(selectedTemplate) && (
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-3">
                            Upload Header Image
                          </label>
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                            <LuImage className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <div className="text-sm text-slate-600 mb-4">
                              Drag and drop your image here, or click to browse
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleMediaUpload(file, 'header');
                                }
                              }}
                              className="hidden"
                              id="header-image"
                            />
                            <label
                              htmlFor="header-image"
                              className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <LuUpload className="w-4 h-4 mr-2" />
                              Choose File
                            </label>
                            {campaignData.mediaFiles.header && (
                              <div className="mt-3 text-sm text-green-600">
                                ✓ Image uploaded successfully: {String(campaignData.mediaFiles.header)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Template Placeholders */}
                      {extractPlaceholders(getTemplateContent(selectedTemplate)).map((placeholder) => (
                        <div key={placeholder}>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            Fill {`{{${placeholder}}}`} *
                          </label>
                          <input
                            type="text"
                            value={campaignData.templateData[placeholder] || ''}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              templateData: {
                                ...campaignData.templateData,
                                [placeholder]: e.target.value
                              }
                            })}
                            placeholder={`Enter value for {{${placeholder}}}`}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                            required
                          />
                        </div>
                      ))}

                      {/* Preview with filled data */}
                      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-900 mb-3">Message Preview</h4>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                          {(() => {
                            let preview = getTemplateContent(selectedTemplate);
                            if (preview) {
                              Object.entries(campaignData.templateData).forEach(([key, value]) => {
                                if (value) {
                                  preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
                                }
                              });
                            }
                            return preview;
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-500">Please select a template first</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Target Audience */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">Select Target Audience</h2>
                  
                  {/* Debug info */}
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Debug: Found {segments.length} segments. Loading: {dataLoading ? 'Yes' : 'No'}
                    </p>
                    {segments.length > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Segments: {segments.map(s => s.name).join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      Choose Segments *
                    </label>
                    {segments.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {segments.map((segment) => (
                          <label key={segment.id} className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={campaignData.segmentIds.includes(segment.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCampaignData({
                                    ...campaignData,
                                    segmentIds: [...campaignData.segmentIds, segment.id]
                                  });
                                } else {
                                  setCampaignData({
                                    ...campaignData,
                                    segmentIds: campaignData.segmentIds.filter(id => id !== segment.id)
                                  });
                                }
                              }}
                              className="w-4 h-4 text-[#2A8B8A] focus:ring-[#2A8B8A] border-slate-300 rounded"
                            />
                            <div className="ml-4 flex-1">
                              <div className="font-medium text-slate-900">{segment.name}</div>
                              <div className="text-sm text-slate-600">
                                {(segment.contactCount || segment.contact_count || 0).toLocaleString()} contacts
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                        <LuUsers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-sm text-slate-600 mb-4">No segments available</p>
                        <button
                          type="button"
                          onClick={() => router.push('/contacts')}
                          className="text-sm text-[#2A8B8A] hover:text-[#2A8B8A]/80 font-medium"
                        >
                          Create segments from contact tags
                        </button>
                      </div>
                    )}
                    
                    {selectedSegments.length > 0 && (
                      <div className="mt-6 p-4 bg-[#2A8B8A]/5 border border-[#2A8B8A]/20 rounded-lg">
                        <div className="flex items-center text-[#2A8B8A]">
                          <LuUsers className="w-5 h-5 mr-2" />
                          <span className="font-medium">
                            Total: {totalContacts.toLocaleString()} contacts selected
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: A/B Testing (Optional) */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">A/B Testing (Optional)</h2>
                  
                  <div className="space-y-6">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={campaignData.abTest.enabled}
                        onChange={(e) => setCampaignData({
                          ...campaignData,
                          abTest: { ...campaignData.abTest, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 text-[#2A8B8A] focus:ring-[#2A8B8A] border-slate-300 rounded"
                      />
                      <span className="text-sm font-medium text-slate-900">Enable A/B Testing for this campaign</span>
                    </label>
                    
                    {campaignData.abTest.enabled && (
                      <div className="space-y-6 p-6 bg-slate-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            Test Name *
                          </label>
                          <input
                            type="text"
                            value={campaignData.abTest.testName}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              abTest: { ...campaignData.abTest, testName: e.target.value }
                            })}
                            placeholder="Enter A/B test name"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-2">
                              Split Percentage (Variant A)
                            </label>
                            <input
                              type="number"
                              min="10"
                              max="90"
                              value={campaignData.abTest.splitPercentage}
                              onChange={(e) => setCampaignData({
                                ...campaignData,
                                abTest: { ...campaignData.abTest, splitPercentage: parseInt(e.target.value) }
                              })}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                            />
                            <p className="text-xs text-slate-600 mt-1">Variant A will get {campaignData.abTest.splitPercentage}%</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-2">
                              Test Duration (Hours)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="168"
                              value={campaignData.abTest.testDurationHours}
                              onChange={(e) => setCampaignData({
                                ...campaignData,
                                abTest: { ...campaignData.abTest, testDurationHours: parseInt(e.target.value) }
                              })}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                            />
                            <p className="text-xs text-slate-600 mt-1">Variant B will get {100 - campaignData.abTest.splitPercentage}%</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-3">
                            Variant B Template *
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enrichedTemplates
                              .filter(template => (!template.status || template.status === 'APPROVED') && template.id !== campaignData.templateId)
                              .map((template) => (
                                <label key={template.id} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  campaignData.abTest.variantBTemplateId === template.id
                                    ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}>
                                  <input
                                    type="radio"
                                    name="variantBTemplate"
                                    value={template.id}
                                    checked={campaignData.abTest.variantBTemplateId === template.id}
                                    onChange={(e) => setCampaignData({
                                      ...campaignData,
                                      abTest: { ...campaignData.abTest, variantBTemplateId: e.target.value }
                                    })}
                                    className="sr-only"
                                  />
                                  <div className="font-medium text-slate-900">{template.name}</div>
                                  <div className="text-sm text-slate-600 mt-1 line-clamp-2">
                                    {getTemplateContent(template).substring(0, 100)}...
                                  </div>
                                </label>
                              ))}
                          </div>
                          
                          {/* Show message if no templates available */}
                          {enrichedTemplates.filter(template => (!template.status || template.status === 'APPROVED') && template.id !== campaignData.templateId).length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                              <p>No other approved templates available for Variant B.</p>
                              <p className="text-sm mt-1">You need at least 2 approved templates to run A/B tests.</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Variant B Template Data Collection */}
                        {campaignData.abTest.variantBTemplateId && (() => {
                          const variantBTemplate = enrichedTemplates.find(t => t.id === campaignData.abTest.variantBTemplateId);
                          return variantBTemplate && (
                            <div className="space-y-6 pt-6 border-t border-slate-300">
                              <h4 className="text-lg font-medium text-slate-900">Variant B Template Configuration</h4>
                              
                              {/* Image Header Upload for Variant B */}
                              {hasImageHeader(variantBTemplate) && (
                                <div>
                                  <label className="block text-sm font-medium text-slate-900 mb-3">
                                    Upload Header Image for Variant B
                                  </label>
                                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                                    <LuImage className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <div className="text-sm text-slate-600 mb-4">
                                      Drag and drop your image here, or click to browse
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleVariantBMediaUpload(file, 'header');
                                        }
                                      }}
                                      className="hidden"
                                      id="variant-b-header-image"
                                    />
                                    <label
                                      htmlFor="variant-b-header-image"
                                      className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                      <LuUpload className="w-4 h-4 mr-2" />
                                      Choose File
                                    </label>
                                    {campaignData.abTest.variantBMediaFiles.header && (
                                      <div className="mt-3 text-sm text-green-600">
                                        ✓ Variant B Image uploaded successfully: {String(campaignData.abTest.variantBMediaFiles.header)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Template Placeholders for Variant B */}
                              {extractPlaceholders(getTemplateContent(variantBTemplate)).map((placeholder) => (
                                <div key={`variant-b-${placeholder}`}>
                                  <label className="block text-sm font-medium text-slate-900 mb-2">
                                    Fill {`{{${placeholder}}}`} for Variant B *
                                  </label>
                                  <input
                                    type="text"
                                    value={campaignData.abTest.variantBTemplateData[placeholder] || ''}
                                    onChange={(e) => setCampaignData({
                                      ...campaignData,
                                      abTest: {
                                        ...campaignData.abTest,
                                        variantBTemplateData: {
                                          ...campaignData.abTest.variantBTemplateData,
                                          [placeholder]: e.target.value
                                        }
                                      }
                                    })}
                                    placeholder={`Enter value for {{${placeholder}}} in Variant B`}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                                    required
                                  />
                                </div>
                              ))}

                              {/* Preview for Variant B */}
                              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-slate-900 mb-3">Variant B Preview</h4>
                                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {(() => {
                                    let preview = getTemplateContent(variantBTemplate);
                                    if (preview) {
                                      Object.entries(campaignData.abTest.variantBTemplateData).forEach(([key, value]) => {
                                        if (value) {
                                          preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
                                        }
                                      });
                                    }
                                    return preview;
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 6: Budget & Duration */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">Budget & Campaign Duration</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Budget Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-900">Budget Settings</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Total Campaign Budget (₹) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={campaignData.budget.totalBudget}
                          onChange={(e) => setCampaignData({
                            ...campaignData,
                            budget: { 
                              ...campaignData.budget, 
                              totalBudget: parseFloat(e.target.value) || 0,
                              dailyBudgetLimit: Math.round((parseFloat(e.target.value) || 0) / campaignData.budget.maxDays * 100) / 100
                            }
                          })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                          placeholder="1000.00"
                          required
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          This amount will be deducted from your account balance
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Cost per Message (₹)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={campaignData.budget.costPerMessage}
                          onChange={(e) => setCampaignData({
                            ...campaignData,
                            budget: { ...campaignData.budget, costPerMessage: parseFloat(e.target.value) || 2.50 }
                          })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                          placeholder="2.50"
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Amount deducted per message sent
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Daily Budget Limit (₹)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={campaignData.budget.dailyBudgetLimit}
                          onChange={(e) => setCampaignData({
                            ...campaignData,
                            budget: { ...campaignData.budget, dailyBudgetLimit: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                          placeholder="Auto-calculated"
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Maximum amount to spend per day
                        </p>
                      </div>
                    </div>

                    {/* Duration Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-900">Campaign Duration</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Maximum Campaign Duration (Days) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={campaignData.budget.maxDays}
                          onChange={(e) => setCampaignData({
                            ...campaignData,
                            budget: { 
                              ...campaignData.budget, 
                              maxDays: parseInt(e.target.value) || 30,
                              dailyBudgetLimit: Math.round(campaignData.budget.totalBudget / (parseInt(e.target.value) || 30) * 100) / 100
                            }
                          })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                          placeholder="30"
                          required
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Campaign will automatically stop after this many days
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={campaignData.budget.autoStop}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              budget: { ...campaignData.budget, autoStop: e.target.checked }
                            })}
                            className="w-4 h-4 text-[#2A8B8A] focus:ring-[#2A8B8A] border-slate-300 rounded"
                          />
                          <span className="text-sm font-medium text-slate-900">Auto-stop when budget exhausted</span>
                        </label>
                        <p className="text-xs text-slate-600 ml-7">
                          Automatically pause campaign when budget limit is reached
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Budget Summary */}
                  <div className="border-t border-slate-200 pt-6 mt-8">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Budget Summary</h3>
                    <div className="bg-slate-50 rounded-lg p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-slate-600">Total Budget</div>
                          <div className="text-xl font-semibold text-slate-900">₹{campaignData.budget.totalBudget.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Daily Limit</div>
                          <div className="text-xl font-semibold text-slate-900">₹{campaignData.budget.dailyBudgetLimit.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Max Messages</div>
                          <div className="text-xl font-semibold text-slate-900">
                            {Math.floor(campaignData.budget.totalBudget / campaignData.budget.costPerMessage).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Duration</div>
                          <div className="text-xl font-semibold text-slate-900">{campaignData.budget.maxDays} days</div>
                        </div>
                      </div>
                      
                      {totalContacts > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm">
                            <span className="font-medium text-blue-900">Estimated Cost:</span>
                            <span className="text-blue-700 ml-2">
                              ₹{(totalContacts * campaignData.budget.costPerMessage).toFixed(2)} for {totalContacts.toLocaleString()} contacts
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Schedule & Settings */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">Schedule & Settings</h2>
                  
                  {campaignData.type === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-3">
                        Schedule Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={campaignData.scheduledAt}
                        onChange={(e) => setCampaignData({ ...campaignData, scheduledAt: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      Send Rate Limit (messages per minute)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={campaignData.sendRateLimit}
                      onChange={(e) => setCampaignData({ ...campaignData, sendRateLimit: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                    />
                    <p className="text-sm text-slate-600 mt-2">
                      Recommended: 20 messages per minute to avoid rate limiting
                    </p>
                  </div>

                  {/* Campaign Summary */}
                  <div className="border-t border-slate-200 pt-6 mt-8">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Campaign Summary</h3>
                    <div className="bg-slate-50 rounded-lg p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Campaign Name:</span>
                          <span className="font-medium text-slate-900">{campaignData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Type:</span>
                          <span className="font-medium text-slate-900 capitalize">{campaignData.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Template:</span>
                          <span className="font-medium text-slate-900">{selectedTemplate?.name || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Audience:</span>
                          <span className="font-medium text-slate-900">{totalContacts.toLocaleString()} contacts</span>
                        </div>
                        {campaignData.abTest.enabled && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">A/B Testing:</span>
                            <span className="font-medium text-slate-900">Enabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-8 border-t border-slate-200">
              <button
                onClick={currentStep === 1 ? () => router.push('/campaigns') : handlePrev}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors font-medium"
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </button>
              
              <div className="flex gap-4">
                {currentStep < 7 ? (
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 1 && !campaignData.name) ||
                      (currentStep === 2 && !campaignData.templateId) ||
                      (currentStep === 3 && selectedTemplate && extractPlaceholders(getTemplateContent(selectedTemplate)).some(p => !campaignData.templateData[p])) ||
                      (currentStep === 4 && campaignData.segmentIds.length === 0) ||
                      (currentStep === 5 && campaignData.abTest.enabled && (
                        !campaignData.abTest.testName || 
                        !campaignData.abTest.variantBTemplateId
                      )) ||
                      (currentStep === 6 && (
                        !campaignData.budget.totalBudget || 
                        campaignData.budget.totalBudget <= 0 ||
                        !campaignData.budget.maxDays ||
                        campaignData.budget.maxDays <= 0
                      ))
                    }
                    className="px-8 py-3 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                ) : (
                  <ApprovalWrapper
                    action="create_campaign"
                    requestType="campaign"
                    requestData={{
                      name: campaignData.name,
                      description: campaignData.description,
                      type: campaignData.type,
                      template_id: campaignData.templateId,
                      segment_ids: campaignData.segmentIds,
                      scheduled_at: campaignData.scheduledAt,
                      template_data: campaignData.templateData,
                      total_contacts: totalContacts
                    }}
                    onExecute={handleCreateCampaign}
                    onApprovalSubmitted={() => {
                      // Optionally redirect or show success message
                    }}
                    disabled={
                      loading ||
                      !campaignData.name ||
                      !campaignData.templateId ||
                      campaignData.segmentIds.length === 0 ||
                      (campaignData.type === 'scheduled' && !campaignData.scheduledAt) ||
                      (selectedTemplate && extractPlaceholders(getTemplateContent(selectedTemplate)).some(p => !campaignData.templateData[p])) ||
                      (campaignData.abTest.enabled && (
                        !campaignData.abTest.testName || 
                        !campaignData.abTest.variantBTemplateId
                      )) ||
                      !campaignData.budget.totalBudget ||
                      campaignData.budget.totalBudget <= 0 ||
                      !campaignData.budget.maxDays ||
                      campaignData.budget.maxDays <= 0
                    }
                  >
                    <button
                      className="px-8 py-3 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating Campaign...
                        </>
                      ) : (
                        <>
                          <LuSend className="w-4 h-4" />
                          Create Campaign
                        </>
                      )}
                    </button>
                  </ApprovalWrapper>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreateCampaignPage;