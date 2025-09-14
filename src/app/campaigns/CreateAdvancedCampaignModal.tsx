"use client";

import React, { useState, useEffect } from 'react';
import { 
  LuX, 
  LuCalendar, 
  LuUsers, 
  LuMessageSquare,
  LuSettings,
  LuSend,
  LuClock,
  LuImage,
  LuUpload
} from 'react-icons/lu';

interface Segment {
  id: string;
  name: string;
  contactCount?: number;
  contact_count?: number; // API returns this format
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

interface CreateAdvancedCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCampaign: (campaignData: any) => Promise<void>;
  segments: Segment[];
  templates: Template[];
  rawTemplates?: any[]; // Add raw templates as backup
  onRefreshSegments?: () => Promise<void>;
}

const CreateAdvancedCampaignModal: React.FC<CreateAdvancedCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreateCampaign,
  segments,
  templates,
  rawTemplates,
  onRefreshSegments
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    mediaFiles: {} as Record<string, File>, // For image headers
    abTest: {
      enabled: false,
      testName: '',
      splitPercentage: 50,
      variantBTemplateId: '',
      variantBTemplateData: {} as Record<string, string>,
      variantBMediaFiles: {} as Record<string, File>,
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
  
  // Debug logging
  useEffect(() => {
    // console.log('Modal received templates:', templates);
    // console.log('Modal received rawTemplates:', rawTemplates);
    // console.log('Enriched templates:', enrichedTemplates);
    // console.log('Template count:', templates.length);
    if (enrichedTemplates.length > 0) {
      // console.log('First enriched template in modal:', enrichedTemplates[0]);
    }
  }, [templates, rawTemplates]);

  useEffect(() => {
    if (selectedTemplate) {
      // console.log('Selected template data:', selectedTemplate);
      // console.log('Has image header:', hasImageHeader(selectedTemplate));
      // console.log('Header type:', selectedTemplate.header_type);
      // console.log('Header media:', selectedTemplate.header_media);
    }
  }, [selectedTemplate]);
  
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

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setCampaignData({
        name: '',
        description: '',
        type: 'immediate',
        templateId: '',
        segmentIds: [],
        scheduledAt: '',
        timezone: 'Asia/Kolkata',
        sendRateLimit: 20,
        templateData: {},
        mediaFiles: {},
        abTest: {
          enabled: false,
          testName: '',
          splitPercentage: 50,
          variantBTemplateId: '',
          variantBTemplateData: {},
          variantBMediaFiles: {},
          testDurationHours: 48
        }
      });
      setCurrentStep(1);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      
      // Build the campaign payload
      const payload = {
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        template_id: campaignData.templateId,
        segment_ids: campaignData.segmentIds,
        send_rate_limit: campaignData.sendRateLimit,
        template_data: campaignData.templateData,
        media_files: campaignData.mediaFiles,
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
            variant_b_media_files: campaignData.abTest.variantBMediaFiles,
            test_duration_hours: campaignData.abTest.testDurationHours
          }
        })
      };

      await onCreateCampaign(payload);
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create New Campaign</h2>
            <p className="text-sm text-slate-700 mt-1">Step {currentStep} of 6</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 bg-slate-50">
          <div className="relative">
            {/* Step indicators and labels in single grid */}
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((step, index) => (
                <div key={step} className="flex flex-col items-center relative">
                  {/* Step circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 relative z-10 ${
                    step <= currentStep 
                      ? 'bg-[#2A8B8A] text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step}
                  </div>
                  {/* Step label */}
                  <span className="text-xs text-slate-900 font-medium text-center">
                    {step === 1 && 'Basic Info'}
                    {step === 2 && 'Template'}
                    {step === 3 && 'Fill Data'}
                    {step === 4 && 'Audience'}
                    {step === 5 && 'A/B Test'}
                    {step === 6 && 'Schedule'}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Connecting line - positioned to connect step circles */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200" style={{ 
              transform: 'translateY(-50%)', 
              marginLeft: 'calc(8.33% + 16px)', 
              marginRight: 'calc(8.33% + 16px)' 
            }}>
              <div 
                className="h-full bg-[#2A8B8A] transition-all duration-300" 
                style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Campaign Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  placeholder="Enter campaign name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
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
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Campaign Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCampaignData({ ...campaignData, type: 'immediate' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      campaignData.type === 'immediate'
                        ? 'border-[#2A8B8A] bg-[#2A8B8A]/5 text-[#2A8B8A]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    <LuSend className={`w-5 h-5 mb-2 ${
                      campaignData.type === 'immediate' ? 'text-[#2A8B8A]' : 'text-slate-600'
                    }`} />
                    <div className="font-medium text-slate-900">Send Now</div>
                    <div className="text-sm text-slate-700">Start immediately</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignData({ ...campaignData, type: 'scheduled' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      campaignData.type === 'scheduled'
                        ? 'border-[#2A8B8A] bg-[#2A8B8A]/5 text-[#2A8B8A]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    <LuClock className={`w-5 h-5 mb-2 ${
                      campaignData.type === 'scheduled' ? 'text-[#2A8B8A]' : 'text-slate-600'
                    }`} />
                    <div className="font-medium text-slate-900">Schedule</div>
                    <div className="text-sm text-slate-700">Send later</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Message Template */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Select Message Template</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Choose Template *
                </label>
                <select
                  value={campaignData.templateId}
                  onChange={(e) => setCampaignData({ ...campaignData, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
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
                  <p className="text-xs text-slate-500 mt-1">
                    No templates available. Please create templates first.
                  </p>
                )}
                {enrichedTemplates.filter(t => !t.status || t.status === 'APPROVED').length === 0 && enrichedTemplates.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No approved templates available. Please get your templates approved.
                  </p>
                )}
              </div>

              {/* Template Preview */}
              {campaignData.templateId && selectedTemplate && (
                <div className="mt-4">
                  <h4 className="font-medium text-slate-900 mb-3">Template Preview</h4>
                  
                  {/* WhatsApp Style Preview */}
                  <div className="max-w-md mx-auto bg-[#0a0e1a] rounded-lg p-4">
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
                    <div className="bg-[#005c4b] rounded-lg p-3 ml-8 relative">
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Fill Template Data</h3>
              
              {selectedTemplate ? (
                <div className="space-y-4">
                  {/* Image Header Upload */}
                  {hasImageHeader(selectedTemplate) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Upload Header Image
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        <LuImage className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <div className="text-sm text-slate-600 mb-2">
                          Drag and drop your image here, or click to browse
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCampaignData({
                                ...campaignData,
                                mediaFiles: { ...campaignData.mediaFiles, header: file }
                              });
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
                          <div className="mt-2 text-sm text-green-600">
                            Selected: {campaignData.mediaFiles.header.name}
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                        required
                      />
                    </div>
                  ))}

                  {/* Preview with filled data */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">Message Preview</h4>
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
                <div className="text-center py-8">
                  <p className="text-slate-500">Please select a template first</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Target Audience */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Select Target Audience</h3>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-900">
                    Choose Segments *
                  </label>
                  {segments.length === 0 && onRefreshSegments && (
                    <button
                      type="button"
                      onClick={onRefreshSegments}
                      className="text-xs text-[#2A8B8A] hover:text-[#2A8B8A]/80 font-medium"
                    >
                      Create segments from tags
                    </button>
                  )}
                </div>
                {segments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {segments.map((segment) => (
                      <label key={segment.id} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
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
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-slate-900">{segment.name}</div>
                          <div className="text-sm text-slate-700">
                            {(segment.contactCount || segment.contact_count || 0).toLocaleString()} contacts
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                    <LuUsers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-3">No segments available</p>
                    {onRefreshSegments && (
                      <button
                        type="button"
                        onClick={onRefreshSegments}
                        className="text-sm text-[#2A8B8A] hover:text-[#2A8B8A]/80 font-medium"
                      >
                        Create segments from contact tags
                      </button>
                    )}
                  </div>
                )}
                
                {selectedSegments.length > 0 && (
                  <div className="mt-4 p-3 bg-[#2A8B8A]/5 border border-[#2A8B8A]/20 rounded-lg">
                    <div className="flex items-center text-[#2A8B8A]">
                      <LuUsers className="w-4 h-4 mr-2" />
                      <span className="font-medium">
                        Total: {totalContacts.toLocaleString()} contacts
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: A/B Testing (Optional) */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 mb-4">A/B Testing (Optional)</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
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
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                        />
                        <p className="text-xs text-slate-600 mt-1">Variant A will get {campaignData.abTest.splitPercentage}%</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                        />
                        <p className="text-xs text-slate-600 mt-1">Variant B will get {100 - campaignData.abTest.splitPercentage}%</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Variant B Template *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {enrichedTemplates
                          .filter(template => (!template.status || template.status === 'APPROVED') && template.id !== campaignData.templateId)
                          .map((template) => (
                            <label key={template.id} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
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
                    </div>

                    {/* Variant B Template Data Filling */}
                    {campaignData.abTest.variantBTemplateId && (() => {
                      const variantBTemplate = enrichedTemplates.find(t => t.id === campaignData.abTest.variantBTemplateId);
                      if (!variantBTemplate) return null;
                      
                      const variantBPlaceholders = extractPlaceholders(getTemplateContent(variantBTemplate));
                      const variantBHasImage = hasImageHeader(variantBTemplate);
                      
                      return (
                        <div className="border-t border-slate-300 pt-4">
                          <h4 className="font-medium text-slate-900 mb-3">Fill Variant B Template Data</h4>
                          
                          {/* Image header for Variant B */}
                          {variantBHasImage && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-slate-900 mb-2">
                                <LuImage className="w-4 h-4 inline mr-1" />
                                Upload Image Header for Variant B
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setCampaignData({
                                      ...campaignData,
                                      abTest: {
                                        ...campaignData.abTest,
                                        variantBMediaFiles: {
                                          ...campaignData.abTest.variantBMediaFiles,
                                          image_header: e.target.files[0]
                                        }
                                      }
                                    });
                                  }
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                              />
                              {campaignData.abTest.variantBMediaFiles.image_header && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ {campaignData.abTest.variantBMediaFiles.image_header.name}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Placeholders for Variant B */}
                          {variantBPlaceholders.length > 0 && (
                            <div className="space-y-3">
                              {variantBPlaceholders.map((placeholder) => (
                                <div key={placeholder}>
                                  <label className="block text-sm font-medium text-slate-900 mb-1">
                                    Template Variable {placeholder} *
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
                                    placeholder={`Enter value for {{${placeholder}}}`}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                                    required
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Schedule & Settings */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Schedule & Settings</h3>
              
              {campaignData.type === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Schedule Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignData.scheduledAt}
                    onChange={(e) => setCampaignData({ ...campaignData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Send Rate Limit (messages per minute)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={campaignData.sendRateLimit}
                  onChange={(e) => setCampaignData({ ...campaignData, sendRateLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-slate-900"
                />
                <p className="text-xs text-slate-700 mt-1">
                  Recommended: 20 messages per minute to avoid rate limiting
                </p>
              </div>

              {/* Campaign Summary */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-medium text-slate-900 mb-3">Campaign Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Campaign Name:</span>
                    <span className="font-medium text-slate-900">{campaignData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Type:</span>
                    <span className="font-medium text-slate-900 capitalize">{campaignData.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Template:</span>
                    <span className="font-medium text-slate-900">{selectedTemplate?.name || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Audience:</span>
                    <span className="font-medium text-slate-900">{totalContacts.toLocaleString()} contacts</span>
                  </div>
                  {campaignData.abTest.enabled && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">A/B Testing:</span>
                      <span className="font-medium text-slate-900">Enabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            onClick={currentStep === 1 ? onClose : handlePrev}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>
          
          <div className="flex gap-3">
            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !campaignData.name) ||
                  (currentStep === 2 && !campaignData.templateId) ||
                  (currentStep === 3 && selectedTemplate && extractPlaceholders(getTemplateContent(selectedTemplate)).some(p => !campaignData.templateData[p])) ||
                  (currentStep === 4 && campaignData.segmentIds.length === 0) ||
                  (currentStep === 5 && campaignData.abTest.enabled && (
                    !campaignData.abTest.testName || 
                    !campaignData.abTest.variantBTemplateId ||
                    (() => {
                      const variantBTemplate = templates.find(t => t.id === campaignData.abTest.variantBTemplateId);
                      return variantBTemplate && extractPlaceholders(getTemplateContent(variantBTemplate)).some(p => !campaignData.abTest.variantBTemplateData[p]);
                    })()
                  ))
                }
                className="px-6 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateCampaign}
                disabled={
                  loading ||
                  !campaignData.name ||
                  !campaignData.templateId ||
                  campaignData.segmentIds.length === 0 ||
                  (campaignData.type === 'scheduled' && !campaignData.scheduledAt) ||
                  (selectedTemplate && extractPlaceholders(getTemplateContent(selectedTemplate)).some(p => !campaignData.templateData[p])) ||
                  (campaignData.abTest.enabled && (
                    !campaignData.abTest.testName || 
                    !campaignData.abTest.variantBTemplateId ||
                    (() => {
                      const variantBTemplate = templates.find(t => t.id === campaignData.abTest.variantBTemplateId);
                      return variantBTemplate && extractPlaceholders(getTemplateContent(variantBTemplate)).some(p => !campaignData.abTest.variantBTemplateData[p]);
                    })()
                  ))
                }
                className="px-6 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LuSend className="w-4 h-4" />
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
};

export default CreateAdvancedCampaignModal;