"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBalance, MESSAGE_COST } from "../contexts/BalanceContext";
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import PermissionGuard from '../components/PermissionGuard';
import AddBalanceModal from '../components/AddBalanceModal';
import { apiService } from '../services/apiService';

// Toast notification function
const showToastConsole = (message: string, type: 'success' | 'error' = 'success') => {
  // console.log(`${type.toUpperCase()}: ${message}`);
};

type Template = {
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  content: string;
  body?: string;
  variables?: string[];
  header_type?: string;
  header_media?: {
    type: string;
    handle: string;
  };
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
    [key: string]: unknown;
  }>;
};

type AccountLimits = {
  phone_number_id: string;
  display_phone_number: string;
  verification_status: string;
  quality_rating: string;
  throughput: {
    level: string;
  };
  messaging_limits: {
    conversations_24h: number;
    description: string;
  };
  business_verification_status: any;
};

type MessageUsage = {
  messages_sent_today: number;
  daily_limit: number;
  remaining: number;
  percentage_used: number;
  recent_logs: Array<{
    timestamp: string;
    phone: string;
    template: string;
    status: string;
    message_id?: string;
  }>;
  reset_time: string;
  verification_status: string;
  quality_rating: string;
  throughput_level: string;
};

function SendMessage() {
  const router = useRouter();
  const { user } = useUser();
  const [phone, setPhone] = useState("");
  const [phones, setPhones] = useState<string[]>([]);
  const [template, setTemplate] = useState("");
  const [components, setComponents] = useState("");
  const [variableValues, setVariableValues] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null); // New: for file uploads
  const [accountLimits, setAccountLimits] = useState<AccountLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [messageUsage, setMessageUsage] = useState<MessageUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  
  // State for WhatsApp business config
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  
  // State for enhanced messaging features
  const [scheduledTime, setScheduledTime] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  
  // State for dynamic variables
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const [activeVariableField, setActiveVariableField] = useState<string | null>(null);
  const [bodyText, setBodyText] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  
  // State for contact selection modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactTagFilter, setContactTagFilter] = useState('');
  
  // State for toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // State for AddBalanceModal
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  
  // Use global balance context
  const { balance: userBalance, refreshBalance, addBalance: addBalanceContext } = useBalance();

  // Available dynamic variables
  const DYNAMIC_VARIABLES = [
    { key: 'name', label: '{{name}}', description: 'Recipient\'s WhatsApp name' },
    { key: 'phone', label: '{{phone}}', description: 'Recipient\'s phone number' },
    { key: 'first_name', label: '{{first_name}}', description: 'First name from contact' },
    { key: 'last_name', label: '{{last_name}}', description: 'Last name from contact' },
    { key: 'company', label: '{{company}}', description: 'Company name' },
    { key: 'date', label: '{{date}}', description: 'Current date' },
    { key: 'time', label: '{{time}}', description: 'Current time' }
  ];

  useEffect(() => {
    if (!user) return;
    
    setTemplatesLoading(true);
    apiService.getOptional('/templates')
      .then(data => {
        if (data) {
        // console.log("Templates API response:", data);
        let tpls = (data.templates || data || [])
          .filter((t: any) => t.companyId === user.companyId || !t.companyId) // Filter by company
          .map((t: any) => {
            if (typeof t === 'string') {
              return { name: t, status: 'APPROVED', content: '', companyId: user.companyId };
            } else {
              return { 
                ...t, 
                status: (t.status || 'PENDING').toString().toUpperCase(),
                companyId: t.companyId || user.companyId
              };
            }
          });
        // console.log("Processed templates:", tpls);
        // console.log("Approved templates:", tpls.filter((t: Template) => t.status === 'APPROVED'));
        setTemplates(tpls);
        } else {
          // console.log("Templates endpoint not available, showing empty templates");
          setTemplates([]);
        }
        setTemplatesLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
        setTemplatesLoading(false);
        showToastNotification('Failed to load templates', 'error');
      });

    // Load account limits with authentication
    setLimitsLoading(true);
    apiService.getOptional('/phone-number-status')
      .then(data => {
        if (data) {
          setAccountLimits(data);
        }
        setLimitsLoading(false);
      })
      .catch(() => setLimitsLoading(false));

    // Load message usage
    loadMessageUsage();

    // Load WhatsApp config with authentication
    setConfigLoading(true);
    apiService.getOptional('/whatsapp/config')
      .then(data => {
        if (data) {
          setWhatsappConfig(data);
        }
        setConfigLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching WhatsApp config:", error);
        setConfigLoading(false);
      });
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVariableDropdown) {
        const target = event.target as HTMLElement;
        // Check if click is outside the dropdown and not on a variable button
        if (!target.closest('.variable-dropdown') && !target.closest('.variable-toggle-btn')) {
          setShowVariableDropdown(false);
          setActiveVariableField(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariableDropdown]);

  const loadMessageUsage = () => {
    if (!user) return;
    
    setUsageLoading(true);
    apiService.getOptional('/message-usage')
      .then(data => {
        if (data) {
        setMessageUsage(data);
        }
        setUsageLoading(false);
      })
      .catch((error) => {
        console.error('Error loading message usage:', error);
        setUsageLoading(false);
        showToastNotification('Failed to load message usage', 'error');
      });
  };

  // Fetch contacts from API with security
  const fetchContacts = async () => {
    if (!user) return;
    
    setContactsLoading(true);
    try {
      const data = await apiService.getContacts();
      const contactsData = (data as any).contacts || [];
      // Filter contacts by user's company for security
      const userContacts = contactsData.filter((contact: any) => 
        contact.companyId === user.companyId || !contact.companyId
      );
      setAllContacts(userContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setAllContacts([]);
      showToastNotification('Failed to load contacts', 'error');
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

  // Apply selected contacts to phone numbers
  const applySelectedContacts = () => {
    const selectedContactsData = allContacts.filter(c => selectedContacts.has(c._id));
    const phoneNumbers = selectedContactsData.map(c => c.phone);
    
    // Merge with existing phone numbers, removing duplicates
    const allPhones = [...new Set([...phones, ...phoneNumbers])];
    setPhones(allPhones);
    
    // Clear the main phone input if it was added to the list
    if (phone.trim() && phoneNumbers.includes(phone.trim())) {
      setPhone('');
    }
    
    // Close modal and reset selection
    setShowContactModal(false);
    setSelectedContacts(new Set());
    setContactSearchTerm('');
    setContactTagFilter('');
  };

  // Show toast notification
  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

  // Helper function to insert variable at cursor position
  const insertVariable = (variable: string, fieldType: 'body' | 'header' | 'footer') => {
    const field = fieldType === 'body' ? bodyText : 
                  fieldType === 'header' ? headerText : footerText;
    
    const setField = fieldType === 'body' ? setBodyText : 
                     fieldType === 'header' ? setHeaderText : setFooterText;
    
    setField(field + variable);
    setShowVariableDropdown(false);
    setActiveVariableField(null);
  };

  // Function to process dynamic variables for each recipient
  const processDynamicVariables = async (text: string, phoneNumber: string) => {
    let processedText = text;
    
    // Normalize phone number for matching (remove +, spaces, dashes)
    const normalizedPhone = phoneNumber.replace(/[\+\s\-\(\)]/g, '');
    
    // Get contact info for this phone number - try both original and normalized
    let contact = allContacts.find(c => c.phone === phoneNumber);
    if (!contact) {
      // Try normalized comparison
      contact = allContacts.find(c => c.phone?.replace(/[\+\s\-\(\)]/g, '') === normalizedPhone);
    }
    
    // Use WhatsApp profile name (from webhook/API) or contact name, fallback to phone
    const displayName = contact?.whatsapp_name || contact?.name || phoneNumber;
    const firstName = contact?.first_name || contact?.whatsapp_name?.split(' ')[0] || contact?.name?.split(' ')[0] || '';
    const lastName = contact?.last_name || contact?.whatsapp_name?.split(' ').slice(1).join(' ') || contact?.name?.split(' ').slice(1).join(' ') || '';
    
    // Replace dynamic variables
    processedText = processedText.replace(/\{\{name\}\}/g, displayName);
    processedText = processedText.replace(/\{\{phone\}\}/g, phoneNumber);
    processedText = processedText.replace(/\{\{first_name\}\}/g, firstName);
    processedText = processedText.replace(/\{\{last_name\}\}/g, lastName);
    processedText = processedText.replace(/\{\{company\}\}/g, contact?.company || '');
    processedText = processedText.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
    processedText = processedText.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
    
    return processedText;
  };

  // Helper functions for new features
  const addPhoneNumber = () => {
    if (phone.trim() && !phones.includes(phone.trim())) {
      setPhones([...phones, phone.trim()]);
      setPhone('');
    }
  };

  const removePhoneNumber = (phoneToRemove: string) => {
    setPhones(phones.filter(p => p !== phoneToRemove));
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      addPhoneNumber();
    }
  };

  // Helper function to check if media is required and provided
  const isMediaRequired = () => {
    const selectedTpl = approvedTemplates.find(t => t.name === template);
    const hasMediaHeader = selectedTpl?.header_type && ['image', 'video', 'document'].includes(selectedTpl.header_type);
    const hasExistingMedia = selectedTpl?.header_media?.handle;
    
    // If template has media header but no existing media, user must provide media
    if (hasMediaHeader && !hasExistingMedia) {
      return !(mediaFile || mediaUrl); // Returns true if media is required but not provided
    }
    
    // If template has existing media, additional media is optional
    return false; // Media is not required
  };

  const getAllPhoneNumbers = () => {
    const phoneNumbers = [];
    if (phone.trim()) phoneNumbers.push(phone.trim());
    phoneNumbers.push(...phones);
    return Array.from(new Set(phoneNumbers)); // Remove duplicates
  };

  const getPreviewMessage = () => {
    const selectedTpl = approvedTemplates.find(t => t.name === template);
    if (!selectedTpl) return 'Select a template to preview your message';
    
    // Use the body content instead of the full content which may include placeholders
    let preview = selectedTpl.body || selectedTpl.content || selectedTpl.name;
    
    // Remove placeholder headers like [IMAGE HEADER], [VIDEO HEADER], [DOCUMENT HEADER]
    preview = preview.replace(/\[(?:IMAGE|VIDEO|DOCUMENT)\s+HEADER\]\s*/g, '');
    
    if (selectedTpl.variables && selectedTpl.variables.length > 0) {
      selectedTpl.variables.forEach((variable, index) => {
        let value = variableValues[variable] || '';
        
        // Show preview of dynamic variables for first phone number or sample data
        const firstPhone = getAllPhoneNumbers()[0];
        if (value && value.includes('{{')) {
          // Replace dynamic variables for preview
          value = value.replace(/\{\{name\}\}/g, firstPhone || 'John Doe');
          value = value.replace(/\{\{phone\}\}/g, firstPhone || '+1234567890');
          value = value.replace(/\{\{first_name\}\}/g, 'John');
          value = value.replace(/\{\{last_name\}\}/g, 'Doe');
          value = value.replace(/\{\{company\}\}/g, 'Sample Company');
          value = value.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
          value = value.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
        }
        
        // If user has entered a value, use it; otherwise show placeholder
        const displayValue = value || `[${variable}]`;
        
        // Replace numbered placeholders {{1}}, {{2}}, etc. (index + 1)
        preview = preview.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), displayValue);
        
        // Also replace named placeholders {{variable_name}}
        preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), displayValue);
      });
    }
    
    return preview.trim();
  };

  const handleSubmit = async (e: React.FormEvent, isScheduled = false) => {
    e.preventDefault();
    
    // Get all phone numbers (main input + additional numbers)
    const phoneNumbers = getAllPhoneNumbers();
    
    if (phoneNumbers.length === 0) {
      alert('Please enter at least one phone number');
      return;
    }

    if (!template) {
      alert('Please select a template');
      return;
    }

    // Validate template variables are filled
    const selectedTemplate = approvedTemplates.find(t => t.name === template);
    if (selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0) {
      const emptyVariables = selectedTemplate.variables.filter(
        (v: string) => !variableValues[v] || variableValues[v].trim() === ''
      );
      if (emptyVariables.length > 0) {
        alert(`Please fill in all template variables: ${emptyVariables.join(', ')}`);
        return;
      }
    }

    // Check if scheduled and validate time
    if (isScheduled) {
      if (!scheduledTime) {
        alert('Please select a date and time for scheduling');
        return;
      }
      const scheduleTime = new Date(scheduledTime);
      if (scheduleTime <= new Date()) {
        alert('Scheduled time must be in the future');
        return;
      }
    }

    setLoading(true);
    setResult(null);
    
    const selectedTpl = approvedTemplates.find(t => t.name === template);

    try {
      if (isScheduled) {
        // Use the new scheduled messaging system
        const recipients = phoneNumbers.map(phone => {
          // Find contact info for this phone number
          const contact = allContacts.find(c => c.phone === phone);
          const contactId = contact?._id || null;
          return {
            phone: phone,
            name: contact?.name || phone,
            contact_id: contactId,
            id: contactId  // ✅ Add this to fix the TypeError
          };
        });

        const scheduledMessageData = {
          recipients: recipients,
          template_id: selectedTpl?.name || template,
          custom_message: selectedTpl?.content || '',
          message_type: selectedTpl?.header_type ? 'media' : 'text',
          schedule_datetime: scheduledTime,
          timezone: 'Asia/Kolkata',
          title: `Scheduled Message - ${new Date().toLocaleDateString()}`,
          variables: selectedTpl?.variables ? 
            selectedTpl.variables.reduce((acc, variable) => {
              acc[variable] = variableValues[variable] || '';
              return acc;
            }, {} as any) : {}
        };

        // console.log('📅 Creating scheduled message:', scheduledMessageData);
        const response = await apiService.createScheduledMessage(scheduledMessageData);
        const typedResponse = response as { success: boolean; data?: { id: string }; message?: string };
        
        if (typedResponse && typedResponse.success) {
          showToastNotification(
            `Message scheduled successfully for ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}! ID: ${typedResponse.data?.id}`,
            'success'
          );
          
          // Reset form on success
          setPhone('');
          setPhones([]);
          setTemplate('');
          setVariableValues({});
          setMediaUrl('');
          setMediaFile(null);
          setScheduledTime('');
          setIsScheduling(false);
          
          // Reset file input
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          
        } else {
          throw new Error(typedResponse?.message || 'Failed to schedule message');
        }
      } else {
        // For immediate sending, fall back to the original logic for now
        // TODO: Consider using scheduled messaging API with immediate delivery
        let successCount = 0;
        let errorCount = 0;
        const detailedErrors = [];
        
        // console.log('📋 Starting immediate message sending...');
        // console.log('📱 Phone numbers:', phoneNumbers);
        // console.log('📨 Template:', template);
        // console.log('👤 User company ID:', user?.companyId);
        
        for (const phoneNumber of phoneNumbers) {
          try {
            let comps = [];
            if (selectedTpl && selectedTpl.variables && selectedTpl.variables.length > 0) {
              // Process dynamic variables for this specific phone number
              let processedVariableValues = { ...variableValues };
              for (const variable of selectedTpl.variables) {
                if (variableValues[variable]) {
                  processedVariableValues[variable] = await processDynamicVariables(variableValues[variable], phoneNumber);
                }
              }
              
              // Extract body variables (from template body text)
              const bodyText = selectedTpl.body || selectedTpl.content || '';
              const bodyVarMatches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
              const bodyVarIndices = bodyVarMatches.map(m => parseInt(m.replace(/[{}]/g, '')));
              
              // Build body component if there are body variables
              if (bodyVarIndices.length > 0) {
                comps.push({
                  type: "body",
                  parameters: bodyVarIndices.map(index => {
                    // Map the numbered placeholder (1, 2, 3...) to the variable name from the variables array
                    const variableName = selectedTpl.variables ? selectedTpl.variables[index - 1] : undefined; // index is 1-based
                    // Use a placeholder if value is empty (WhatsApp API requires non-empty values)
                    const value = variableName ? (processedVariableValues[variableName]?.trim() || '-') : '-';
                    return {
                      type: "text",
                      text: value
                    };
                  })
                });
              }
              
              // Check if template has buttons with URL variables
              if (selectedTpl.buttons && selectedTpl.buttons.length > 0) {
                selectedTpl.buttons.forEach((button: any, buttonIndex: number) => {
                  if (button.type === 'url' && button.url) {
                    // Extract variables from button URL
                    const urlVarMatches = button.url.match(/\{\{(\d+)\}\}/g) || [];
                    if (urlVarMatches.length > 0) {
                      const buttonParams = urlVarMatches.map((match: string) => {
                        const varIndex = parseInt(match.replace(/[{}]/g, '')); // Extract number from {{1}}
                        // Map to variable name from variables array
                        const variableName = selectedTpl.variables ? selectedTpl.variables[varIndex - 1] : undefined; // index is 1-based
                        // Use a placeholder if value is empty (WhatsApp API requires non-empty values)
                        const value = variableName ? (processedVariableValues[variableName]?.trim() || '-') : '-';
                        return {
                          type: "text",
                          text: value
                        };
                      });
                      
                      comps.push({
                        type: "button",
                        sub_type: "url",
                        index: buttonIndex.toString(),
                        parameters: buttonParams
                      });
                    }
                  }
                });
              }
            } else {
              try {
                comps = components ? JSON.parse(components) : [];
              } catch (err) {
                console.error('Error parsing components:', err);
                comps = [];
              }
            }
            
            const hasMediaHeader = selectedTpl?.header_type && ['image', 'video', 'document'].includes(selectedTpl.header_type);
            let response;
            
            if (hasMediaHeader) {
              const formData = new FormData();
              formData.append('phone', phoneNumber);
              formData.append('template', template);
              formData.append('components', JSON.stringify(comps));
              formData.append('companyId', user?.companyId || '');
              
              if (mediaFile) {
                formData.append('media_file', mediaFile);
              } else if (mediaUrl) {
                formData.append('media_url', mediaUrl);
              }
              
              response = await apiService.post('/messages/send-message-with-file', formData);
            } else {
              const messageData = {
                phone: phoneNumber,
                template,
                components: comps,
                companyId: user?.companyId,
              };
              
              response = await apiService.post('/messages/send-message', messageData);
            }
            
            if (response && response.success && !response.error) {
              successCount++;
              await refreshBalance();
            } else {
              errorCount++;
              const errorDetail = response?.error || response?.message || 'Unknown error';
              detailedErrors.push(`${phoneNumber}: ${errorDetail}`);
              
              if (response && response.error && response.error.includes('balance')) {
                setResult({ 
                  error: response.error || "Insufficient balance. Please add funds to continue sending messages." 
                });
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error('💥 Exception occurred while sending to', phoneNumber, ':', error);
            errorCount++;
            const errorMessage = error instanceof Error ? error.message : 'Network or API error';
            detailedErrors.push(`${phoneNumber}: ${errorMessage}`);
          }
        }
        
        if (successCount > 0) {
          const totalCost = successCount * MESSAGE_COST;
          const successMessage = `Successfully sent ${successCount} message${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}. Cost: ₹${totalCost.toFixed(2)}. Remaining balance: ₹${userBalance.toFixed(2)}`;
          
          showToastNotification(successMessage, 'success');
          setResult(null);
          
          if (errorCount > 0) {
            console.warn('⚠️ Some messages failed:', detailedErrors);
          }
          
          loadMessageUsage();
          await refreshBalance();
          
          // Reset form on success
          setPhone('');
          setPhones([]);
          setTemplate('');
          setVariableValues({});
          setMediaUrl('');
          setMediaFile(null);
          
          // Reset file input
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          const detailedErrorMessage = detailedErrors.length > 0 
            ? `Failed to send all ${phoneNumbers.length} message${phoneNumbers.length > 1 ? 's' : ''}. Errors: ${detailedErrors.join('; ')}`
            : `Failed to send all ${phoneNumbers.length} message${phoneNumbers.length > 1 ? 's' : ''}`;
          
          setResult({ error: detailedErrorMessage });
        }
      }
      
    } catch (error) {
      console.error('Send Message Error:', error);
      let errorMessage = `Failed to ${isScheduled ? 'schedule' : 'send'} message`;
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message || errorMessage;
      }
      
      if (selectedTpl?.header_type === 'image') {
        console.error('Image template send error:', error);
      }
      
      if (
        errorMessage.includes('Account does not exist in Cloud API') ||
        errorMessage.includes('waba_registration_required') ||
        errorMessage.includes('not registered') ||
        errorMessage.includes('133010')
      ) {
        const shouldValidate = window.confirm(
          'Your WhatsApp Business Account needs to be validated. ' +
          'Would you like to go to settings to validate it now?'
        );
        if (shouldValidate) {
          window.location.href = '/settings';
        }
      } else {
        setResult({ error: errorMessage });
      }
    }
    
    setLoading(false);
  };

  // Check if WABA is connected
  // Note: API returns {success: true, data: {...}} structure, so we need to access whatsappConfig.data
  // Also, selected_option has 'id' field which is the waba_id
  const configData = whatsappConfig?.data || whatsappConfig; // Handle both API response formats
  
  // Status can be either "connected_to_waba" or "connected" (when WABA is connected)
  const isWABAConnected = (configData?.status === 'connected_to_waba' || configData?.status === 'connected') && 
                          (configData?.selected_option?.id || configData?.selected_option?.waba_id);
  
  // Debug logging
  console.log('🔍 WhatsApp Config:', whatsappConfig);
  console.log('📦 Config Data:', configData);
  console.log('📊 Status:', configData?.status);
  console.log('🆔 Selected Option ID:', configData?.selected_option?.id);
  console.log('🆔 Selected Option waba_id:', configData?.selected_option?.waba_id);
  console.log('✅ WABA Connected:', isWABAConnected);
  
  // Check if there are active (APPROVED) templates (using existing approvedTemplates variable)
  const hasActiveTemplates = approvedTemplates.length > 0;
  
  // Check if there are pending templates
  const pendingTemplates = templates.filter((t: Template) => t.status === 'PENDING');
  const hasPendingTemplates = pendingTemplates.length > 0;

  // Show skeleton loader while loading config or templates
  if (configLoading || templatesLoading) {
    return (
      <ProtectedRoute>
        <PermissionGuard requiredPermission="send_messages">
          <div className="flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-6 text-center">
              {/* Skeleton Icon */}
              <div className="mb-4 flex justify-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              
              {/* Skeleton Title */}
              <div className="mb-3 flex justify-center">
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
              
              {/* Skeleton Description */}
              <div className="mb-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto animate-pulse"></div>
              </div>
              
              {/* Skeleton Features Box */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                </div>
              </div>
              
              {/* Skeleton Button */}
              <div className="h-10 bg-gray-200 rounded-xl w-48 mx-auto animate-pulse"></div>
            </div>
          </div>
        </PermissionGuard>
      </ProtectedRoute>
    );
  }

  // If not loading and WABA is not connected, show connection required page
  if (!configLoading && !isWABAConnected) {
    return (
      <ProtectedRoute>
        <PermissionGuard requiredPermission="send_messages">
          <div className="flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-6 text-center">
              {/* AI Generated Illustration */}
              <div className="mb-4">
                <svg className="w-20 h-20 mx-auto text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Connect Your WhatsApp Business Account
              </h1>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                To start sending messages, you need to connect your WhatsApp Business Account first. 
                It only takes a few minutes to get started!
              </p>
              
              {/* Features List */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2 text-xs">What you'll get:</h3>
                <ul className="space-y-1.5">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-xs">Official WhatsApp Business API access</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-xs">Send messages to unlimited customers</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-xs">Use message templates and automation</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-xs">Track message delivery and engagement</span>
                  </li>
                </ul>
              </div>
              
              {/* CTA Button */}
              <button
                onClick={() => router.push('/settings')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Connect WhatsApp in Settings
              </button>
            </div>
          </div>
        </PermissionGuard>
      </ProtectedRoute>
    );
  }

  // If WABA is connected but no active templates, show template required page
  if (!templatesLoading && isWABAConnected && !hasActiveTemplates) {
    return (
      <ProtectedRoute>
        <PermissionGuard requiredPermission="send_messages">
          <div className="flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-6 text-center">
              {/* Template Icon */}
              <div className="mb-4">
                <svg className="w-20 h-20 mx-auto text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {hasPendingTemplates ? 'Templates Under Review' : 'Create Your First Template'}
              </h1>
              
              {/* Description */}
              {hasPendingTemplates ? (
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-600">
                    Your templates are currently being reviewed by WhatsApp. This usually takes 24-48 hours.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center justify-center mb-1.5">
                      <svg className="w-4 h-4 text-yellow-600 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-yellow-800 text-xs">Review in Progress</span>
                    </div>
                    <p className="text-yellow-700 text-xs">
                      You have {pendingTemplates.length} template{pendingTemplates.length > 1 ? 's' : ''} pending approval.
                      You'll be able to send messages once they're approved.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-4">
                  Before you can send messages, you need to create and get approval for at least one message template.
                  Templates ensure your messages comply with WhatsApp's policies.
                </p>
              )}
              
              {/* Info Box */}
              <div className="bg-purple-50 rounded-lg p-3 mb-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2 text-xs">About Message Templates:</h3>
                <ul className="space-y-1.5">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 text-xs">Templates must be approved by WhatsApp (24-48 hours)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 text-xs">You can create templates for greetings, notifications, and promotions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 text-xs">Templates can include variables for personalization</span>
                  </li>
                </ul>
              </div>
              
              {/* CTA Button */}
              <button
                onClick={() => router.push('/templates')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {hasPendingTemplates ? 'View Template Status' : 'Create Your First Template'}
              </button>
              
              {!hasPendingTemplates && (
                <p className="text-xs text-gray-500 mt-2.5">
                  💡 Tip: Start with a simple greeting template to get approved quickly
                </p>
              )}
            </div>
          </div>
        </PermissionGuard>
      </ProtectedRoute>
    );
  }

  return (
    <>
      {/* Toast Animation Styles */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      
      <div className="space-y-8">

      {/* Page Header */}

      {/* Balance and Cost Information - Modern Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Current Balance */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A8B8A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2A8B8A] to-[#238080] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2A8B8A]/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] text-xs font-semibold rounded-full">
                Wallet
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">Current Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">₹{userBalance.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowAddBalanceModal(true)}
              className="mt-4 w-full py-3 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#2A8B8A]/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Balance
            </button>
          </div>
        </div>

        {/* Cost per Message */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                Fixed Rate
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">Cost per Message</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">₹{MESSAGE_COST.toFixed(2)}</span>
              <span className="text-sm text-gray-400">/msg</span>
            </div>
            <p className="mt-4 text-xs text-gray-400 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Only charged for delivered messages
            </p>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                getAllPhoneNumbers().length > 0 && userBalance < (getAllPhoneNumbers().length * MESSAGE_COST)
                  ? 'bg-red-50 text-red-600'
                  : 'bg-orange-50 text-orange-600'
              }`}>
                {getAllPhoneNumbers().length} Recipients
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">Estimated Total</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${
                getAllPhoneNumbers().length > 0 && userBalance < (getAllPhoneNumbers().length * MESSAGE_COST)
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}>
                ₹{(getAllPhoneNumbers().length * MESSAGE_COST).toFixed(2)}
              </span>
            </div>
            {getAllPhoneNumbers().length > 0 && userBalance < (getAllPhoneNumbers().length * MESSAGE_COST) ? (
              <button
                onClick={() => setShowAddBalanceModal(true)}
                className="mt-4 w-full py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Insufficient Balance
              </button>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((getAllPhoneNumbers().length * MESSAGE_COST / userBalance) * 100, 100)}%` }}
                  ></div>
                </div>
                <span>{userBalance > 0 ? Math.round((getAllPhoneNumbers().length * MESSAGE_COST / userBalance) * 100) : 0}% of balance</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Section - Takes 3 columns */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2A8B8A]/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Compose Message</h2>
                <p className="text-sm text-gray-500">Fill in the details below to send your message</p>
              </div>
            </div>
          </div>
          
          <form className="p-8 space-y-8">
            {/* Phone Numbers Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#2A8B8A]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-gray-900">
                    Recipients
                  </label>
                  {getAllPhoneNumbers().length > 0 && (
                    <span className="px-2.5 py-1 bg-[#2A8B8A] text-white text-xs font-semibold rounded-full">
                      {getAllPhoneNumbers().length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openContactModal}
                  className="group flex items-center gap-2 px-4 py-2 bg-[#2A8B8A]/5 hover:bg-[#2A8B8A]/10 text-[#2A8B8A] text-sm font-medium rounded-xl transition-all duration-200"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Import Contacts
                </button>
              </div>
              
              {/* Modern Phone Input with Chips */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                <div className="relative bg-white border-2 border-gray-200 focus-within:border-[#2A8B8A] p-4 rounded-xl transition-all">
                  <div className="flex flex-wrap gap-2 min-h-[48px] items-center">
                    {/* Phone Number Chips */}
                    {phones.map((phoneNumber, index) => (
                      <span
                        key={index}
                        className="group/chip inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white pl-4 pr-2 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                      >
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {phoneNumber}
                        <button
                          type="button"
                          onClick={() => removePhoneNumber(phoneNumber)}
                          className="w-6 h-6 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    
                    {/* Input Field */}
                    <input
                      className="flex-1 min-w-[200px] bg-transparent text-gray-900 outline-none placeholder-gray-400 text-base py-2"
                      placeholder={phones.length === 0 ? "Enter phone number with country code (e.g., 919876543210)" : "Add another number..."}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={handlePhoneKeyDown}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Press Enter to add multiple numbers
                </p>
                {phone.trim() && (
                  <button
                    type="button"
                    onClick={addPhoneNumber}
                    className="text-sm text-[#2A8B8A] font-medium hover:underline"
                  >
                    + Add this number
                  </button>
                )}
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2A8B8A]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <label className="text-sm font-semibold text-gray-900">
                  Message Template
                </label>
                {template && (
                  <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Selected
                  </span>
                )}
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white border-2 border-gray-200 text-gray-900 p-4 pr-12 rounded-xl focus:border-[#2A8B8A] focus:outline-none transition-all cursor-pointer font-medium"
                    value={template}
                    onChange={e => {
                      setTemplate(e.target.value);
                      setVariableValues({});
                    }}
                    required
                    disabled={templatesLoading}
                  >
                    <option value="" className="text-gray-500">
                      {templatesLoading ? "Loading templates..." : approvedTemplates.length === 0 ? "No approved templates available" : "Choose a template..."}
                    </option>
                    {approvedTemplates.map((t) => (
                      <option key={t.name} value={t.name} className="py-2">{t.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {templatesLoading && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching your templates...
                </div>
              )}
              
              {!templatesLoading && approvedTemplates.length === 0 && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm text-amber-700">No approved templates. Create one first!</span>
                </div>
              )}
            </div>

            {/* Variable Inputs */}
            {template && (() => {
              const selectedTpl = approvedTemplates.find(t => t.name === template);
              if (selectedTpl && selectedTpl.variables && selectedTpl.variables.length > 0) {
                return (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Template Variables</h3>
                        <p className="text-xs text-gray-500">
                          Personalize with dynamic data like {'{name}'}
                        </p>
                      </div>
                      <span className="ml-auto px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        {selectedTpl.variables.length} variable{selectedTpl.variables.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50/50 to-transparent p-5 rounded-xl border border-purple-100/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {selectedTpl.variables.map((v, idx) => (
                          <div key={v} className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-md flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              {v.charAt(0).toUpperCase() + v.slice(1)}
                            </label>
                            <div className="relative group">
                              <input
                                className="w-full bg-white border-2 border-gray-200 text-gray-900 p-3.5 pr-12 rounded-xl focus:border-[#2A8B8A] focus:outline-none transition-all placeholder-gray-400"
                                placeholder={`Enter {{${v}}} or use dynamic...`}
                                value={variableValues[v] || ""}
                                onChange={e => setVariableValues(vals => ({ ...vals, [v]: e.target.value }))}
                                required
                              />
                              <button
                                type="button"
                                className="variable-toggle-btn absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-100 hover:bg-[#2A8B8A] rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                onClick={() => {
                                  setActiveVariableField(v);
                                  setShowVariableDropdown(!showVariableDropdown || activeVariableField !== v);
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </button>
                              
                              {/* Variable Dropdown */}
                              {showVariableDropdown && activeVariableField === v && (
                                <div className="variable-dropdown absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                  <div className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] px-4 py-3">
                                    <p className="text-sm font-semibold text-white">Dynamic Variables</p>
                                    <p className="text-xs text-white/70">Click to insert</p>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {DYNAMIC_VARIABLES.map((variable) => (
                                      <button
                                        key={variable.key}
                                        type="button"
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-0 transition-colors"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const currentValue = variableValues[v] || "";
                                          const newValue = currentValue + variable.label;
                                          setVariableValues(vals => ({ 
                                            ...vals, 
                                            [v]: newValue 
                                          }));
                                          setShowVariableDropdown(false);
                                          setActiveVariableField(null);
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 bg-[#2A8B8A]/10 text-[#2A8B8A] rounded text-sm font-mono">{variable.label}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{variable.description}</div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Media Input - File Upload or URL */}
            {template && (() => {
              const selectedTpl = approvedTemplates.find(t => t.name === template);
              const hasMediaHeader = selectedTpl?.header_type && ['image', 'video', 'document'].includes(selectedTpl.header_type);
              const hasExistingMedia = selectedTpl?.header_media?.handle;
              
              if (hasMediaHeader) {
                return (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{selectedTpl?.header_type?.toUpperCase()} Media</h3>
                        {hasExistingMedia && (
                          <p className="text-xs text-gray-500">Override template's default media</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Show existing media info if available */}
                    {hasExistingMedia && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm text-blue-800 font-medium">
                          Template includes default {selectedTpl?.header_type}. You can override it below.
                        </span>
                      </div>
                    )}
                    
                    {/* Media Upload Options */}
                    <div className="bg-gradient-to-br from-blue-50/30 to-transparent p-5 rounded-xl border border-blue-100/50 space-y-5">
                      {/* File Upload Option */}
                      <div className="group">
                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                          <div className="relative">
                            <input
                              type="radio"
                              id="upload-file"
                              name="media-option"
                              checked={(!mediaUrl && !mediaFile) || !!mediaFile}
                              onChange={() => setMediaUrl('')}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-[#2A8B8A] peer-checked:bg-[#2A8B8A] transition-all flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Upload {selectedTpl?.header_type} file</span>
                        </label>
                        
                        <div className={`relative ${mediaUrl.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 hover:border-[#2A8B8A] transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm text-gray-500"><span className="font-medium text-[#2A8B8A]">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {selectedTpl?.header_type === 'image' && 'JPG, PNG, GIF (max 5MB)'}
                                {selectedTpl?.header_type === 'video' && 'MP4, 3GP (max 16MB)'}
                                {selectedTpl?.header_type === 'document' && 'PDF, DOC, XLS, PPT (max 100MB)'}
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept={
                                selectedTpl?.header_type === 'image' ? 'image/*' :
                                selectedTpl?.header_type === 'video' ? 'video/*' :
                                selectedTpl?.header_type === 'document' ? '*/*' : '*/*'
                              }
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                setMediaFile(file || null);
                                if (file) setMediaUrl('');
                              }}
                              disabled={mediaUrl.length > 0}
                            />
                          </label>
                        </div>
                        
                        {mediaFile && (
                          <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-800 truncate">{mediaFile.name}</p>
                              <p className="text-xs text-green-600">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setMediaFile(null);
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Divider */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-medium">OR</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                      
                      {/* URL Option */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                          <div className="relative">
                            <input
                              type="radio"
                              id="use-url"
                              name="media-option"
                              checked={mediaUrl.length > 0 && !mediaFile}
                              onChange={() => {
                                setMediaFile(null);
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-[#2A8B8A] peer-checked:bg-[#2A8B8A] transition-all flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Use {selectedTpl?.header_type} URL</span>
                        </label>
                        
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <input
                            type="url"
                            placeholder={`https://example.com/${selectedTpl?.header_type}.jpg`}
                            value={mediaUrl}
                            onChange={e => {
                              setMediaUrl(e.target.value);
                              if (e.target.value) {
                                setMediaFile(null);
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }
                            }}
                            className="w-full bg-white border-2 border-gray-200 text-gray-900 p-3.5 pl-12 rounded-xl focus:border-[#2A8B8A] focus:outline-none transition-all placeholder-gray-400"
                            disabled={!!mediaFile}
                          />
                        </div>
                      </div>
                      
                      {/* Default Media Option (if exists) */}
                      {hasExistingMedia && (
                        <>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-xs text-gray-400 font-medium">OR</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                          
                          <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#2A8B8A] transition-all">
                            <input
                              type="radio"
                              id="use-default"
                              name="media-option"
                              checked={!mediaFile && !mediaUrl}
                              onChange={() => {
                                setMediaFile(null);
                                setMediaUrl('');
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="w-5 h-5 text-[#2A8B8A] focus:ring-[#2A8B8A]"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">Use template's default {selectedTpl?.header_type}</span>
                              <p className="text-xs text-gray-500 mt-0.5">Template includes its own media</p>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}

            {/* Scheduling Option */}
            {isScheduling && (
              <div className="md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-gray-900">Schedule Date & Time</label>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50/50 to-transparent p-5 rounded-xl border border-orange-100/50">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-white border-2 border-gray-200 text-gray-900 p-4 rounded-xl focus:border-[#2A8B8A] focus:outline-none transition-all cursor-pointer"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Message will be sent at the scheduled time in your local timezone
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  className="flex-1 min-w-[200px] group relative bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white font-semibold px-6 py-4 rounded-xl hover:shadow-lg hover:shadow-[#2A8B8A]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none overflow-hidden"
                  disabled={
                    loading || 
                    getAllPhoneNumbers().length === 0 || 
                    !template || 
                    isMediaRequired() || 
                    userBalance < (getAllPhoneNumbers().length * MESSAGE_COST)
                  }
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : userBalance < (getAllPhoneNumbers().length * MESSAGE_COST) ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Insufficient Balance
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Now{getAllPhoneNumbers().length > 1 ? ` (${getAllPhoneNumbers().length})` : ""}
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsScheduling(!isScheduling)}
                  className={`px-6 py-4 border-2 font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    isScheduling 
                      ? 'border-red-300 text-red-600 hover:bg-red-50' 
                      : 'border-[#2A8B8A] text-[#2A8B8A] hover:bg-[#2A8B8A] hover:text-white'
                  }`}
                >
                  {isScheduling ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Schedule
                    </>
                  )}
                </button>
                
                {isScheduling && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={
                      loading || 
                      getAllPhoneNumbers().length === 0 || 
                      !template || 
                      !scheduledTime || 
                      isMediaRequired() || 
                      userBalance < (getAllPhoneNumbers().length * MESSAGE_COST)
                    }
                  >
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Confirm Schedule
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Balance Warning */}
            {getAllPhoneNumbers().length > 0 && userBalance < (getAllPhoneNumbers().length * MESSAGE_COST) && (
              <div className="md:col-span-2 p-5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">Insufficient Balance</p>
                    <p className="text-sm text-red-600 mt-1">
                      Required: <span className="font-semibold">₹{(getAllPhoneNumbers().length * MESSAGE_COST).toFixed(2)}</span> • 
                      Available: <span className="font-semibold">₹{userBalance.toFixed(2)}</span> • 
                      Shortfall: <span className="font-semibold">₹{(getAllPhoneNumbers().length * MESSAGE_COST - userBalance).toFixed(2)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddBalanceModal(true)}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Balance
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* iPhone WhatsApp Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Preview Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Live Preview</h2>
                <p className="text-sm text-gray-500">See how your message will appear</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* iPhone Frame */}
            <div className="max-w-[320px] mx-auto">
              {/* iPhone Outer Frame */}
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 p-3 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl"></div>
                
                {/* Screen Container */}
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* iPhone Status Bar */}
                  <div className="bg-[#075E54] text-white px-6 py-3 flex justify-between items-center pt-8">
                    <span className="font-semibold text-sm">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21c-1.5 0-2.8-.5-4-1.3-.5.2-1 .3-1.5.3-2.2 0-4-1.8-4-4 0-.7.2-1.4.5-2C2.4 12.8 2 11.5 2 10c0-3.3 2.7-6 6-6 .8 0 1.5.1 2.2.4C11.2 3.5 12.5 3 14 3c2.5 0 4.6 1.5 5.5 3.6.3 0 .6-.1.9-.1 2.5 0 4.5 2 4.5 4.5 0 2.2-1.6 4-3.6 4.4-.3 1.8-1.5 3.3-3.1 4.1-.5 2-2.3 3.5-4.4 3.5z"/>
                      </svg>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3C6.95 3 3 6.95 3 12c0 .7.1 1.4.2 2H1v3h3.3c1.5 2.9 4.4 5 8 5s6.5-2.1 8-5H23v-3h-2.2c.1-.6.2-1.3.2-2 0-5.05-3.95-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
                      </svg>
                      <div className="w-6 h-3 border border-white rounded-sm ml-1">
                        <div className="w-4 h-2 bg-white rounded-sm m-0.5"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* WhatsApp Header */}
                  <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3 pb-4">
                    <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center ring-2 ring-white/20">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {getAllPhoneNumbers().length === 0 
                          ? (whatsappConfig?.selected_phone?.verified_name || "Business Name") 
                          : getAllPhoneNumbers().length === 1 
                            ? getAllPhoneNumbers()[0] 
                            : `${getAllPhoneNumbers().length} recipients`
                        }
                      </div>
                      <div className="text-xs text-green-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        online
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                
                {/* Chat Area */}
                <div className="bg-[#ECE5DD] h-[500px] p-4 overflow-y-auto" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
                }}>
                  {template ? (
                    <div className="flex justify-end mb-4">
                      <div className="bg-[#DCF8C6] p-3 rounded-lg max-w-xs shadow-sm">
                        {/* Media Header Preview */}
                        {(() => {
                          const selectedTpl = approvedTemplates.find(t => t.name === template);
                          const hasMediaHeader = selectedTpl?.header_type && ['image', 'video', 'document'].includes(selectedTpl.header_type);
                          
                          if (hasMediaHeader) {
                            if (selectedTpl.header_type === 'image') {
                              return (
                                <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                                  {/* Show uploaded file preview first, then URL, then template default */}
                                  {mediaFile ? (
                                    <img 
                                      src={URL.createObjectURL(mediaFile)} 
                                      alt="Uploaded image" 
                                      className="w-full h-32 object-cover"
                                    />
                                  ) : mediaUrl ? (
                                    <img 
                                      src={mediaUrl} 
                                      alt="Image from URL" 
                                      className="w-full h-32 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (nextElement) {
                                          nextElement.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : selectedTpl.header_media?.handle ? (
                                    <img 
                                      src={selectedTpl.header_media.handle} 
                                      alt="Template image" 
                                      className="w-full h-32 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (nextElement) {
                                          nextElement.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center" style={{display: (mediaFile || mediaUrl || selectedTpl.header_media?.handle) ? 'none' : 'flex'}}>
                                    <div className="text-center text-gray-600">
                                      <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24" className="mx-auto mb-1">
                                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                      </svg>
                                      <div className="text-xs">Upload Image</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            } else if (selectedTpl.header_type === 'video') {
                              return (
                                <div className="mb-3 rounded-lg overflow-hidden bg-gray-900">
                                  {mediaFile ? (
                                    <video 
                                      src={URL.createObjectURL(mediaFile)} 
                                      className="w-full h-32 object-cover"
                                      controls
                                    />
                                  ) : mediaUrl ? (
                                    <video 
                                      src={mediaUrl} 
                                      className="w-full h-32 object-cover"
                                      controls
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (nextElement) {
                                          nextElement.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : selectedTpl.header_media?.handle ? (
                                    <video 
                                      src={selectedTpl.header_media.handle} 
                                      className="w-full h-32 object-cover"
                                      controls
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (nextElement) {
                                          nextElement.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-full h-32 bg-gray-900 flex items-center justify-center relative" style={{display: (mediaFile || mediaUrl || selectedTpl.header_media?.handle) ? 'none' : 'flex'}}>
                                    <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                      Upload Video
                                    </div>
                                  </div>
                                </div>
                              );
                            } else if (selectedTpl.header_type === 'document') {
                              const docUrl = mediaUrl || selectedTpl.header_media?.handle;
                              const fileName = mediaFile ? mediaFile.name : (docUrl ? (
                                docUrl.includes('://') ? 
                                  new URL(docUrl).pathname.split('/').pop() || 'Document' : 
                                  docUrl
                              ) : 'Upload Document');
                              
                              return (
                                <div className="mb-3 bg-gray-50 border rounded-lg p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {fileName}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {mediaFile ? `${(mediaFile.size / 1024 / 1024).toFixed(2)} MB` : 
                                         selectedTpl.header_media?.handle ? 'Template Media' : 
                                         'Document'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                        
                        {/* Message Text */}
                        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {getPreviewMessage()}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 text-right">
                          {isScheduling && scheduledTime 
                            ? `Scheduled for ${new Date(scheduledTime).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit'
                              })}`
                            : new Date().toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit'
                              })
                          }
                          <svg className="inline ml-1 w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm">Select a template to preview your message</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* WhatsApp Input Bar */}
                <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <div className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-gray-400 flex items-center gap-2">
                    <span>Type a message</span>
                  </div>
                  <button className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
                
                {/* Home Indicator */}
                <div className="h-6 bg-white flex items-center justify-center">
                  <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>
            </div>
            
            {/* Preview Info Badge */}
            {getAllPhoneNumbers().length > 0 && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#2A8B8A]/5 to-green-50 border border-[#2A8B8A]/20 px-5 py-3 rounded-full">
                  <div className="w-8 h-8 bg-[#2A8B8A] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Sending to</span>
                    <span className="font-bold text-[#2A8B8A] mx-1">{getAllPhoneNumbers().length}</span>
                    <span className="text-gray-600">recipient{getAllPhoneNumbers().length !== 1 ? 's' : ''}</span>
                  </div>
                  {isScheduling && scheduledTime && (
                    <>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Display - Only show errors */}
      {result && result.error && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Something went wrong</h3>
              <p className="text-sm text-red-600 mt-1">{result.error}</p>
            </div>
            <button 
              onClick={() => setResult(null)}
              className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className={`rounded-2xl shadow-2xl p-5 max-w-md backdrop-blur-xl ${
            toastType === 'success' 
              ? 'bg-white/95 border border-green-200' 
              : 'bg-white/95 border border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${
                toastType === 'success' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'
              }`}>
                {toastType === 'success' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  toastType === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {toastType === 'success' ? 'Message Sent Successfully!' : 'Failed to Send'}
                </p>
                <p className={`text-sm mt-1 ${
                  toastType === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {toastMessage}
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className={`flex-shrink-0 ${
                  toastType === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'
                } transition-colors`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Selection Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-black">Select Contacts</h2>
                <p className="text-gray-600 text-sm">Choose contacts to send messages to</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        {/* Checkbox Skeleton */}
                        <div className="w-5 h-5 bg-gray-200 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5"></div>
                        
                        {/* Content Skeleton */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Name */}
                          <div className="h-5 bg-gray-200 rounded w-32"></div>
                          
                          {/* Phone */}
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                          </div>
                          
                          {/* Info Row */}
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 bg-gray-200 rounded"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 bg-gray-200 rounded"></div>
                              <div className="h-3 bg-gray-200 rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                            {contact.status === 'blocked' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Blocked</span>
                            )}
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
                              {contact.tags.slice(0, 3).map((tag: string, index: number) => (
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
                      (Cost: ₹{(selectedContacts.size * MESSAGE_COST).toFixed(2)})
                    </span>
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
                    disabled={selectedContacts.size === 0}
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
      
      {/* AddBalanceModal */}
      <AddBalanceModal 
        isOpen={showAddBalanceModal} 
        onClose={() => setShowAddBalanceModal(false)} 
      />
    </div>
    </>
  );
}

// Wrap the component with ProtectedRoute for security
const ProtectedSendMessagePage = () => {
  return (
    <PermissionGuard requiredPermission="send_message">
      <ProtectedRoute>
        <SendMessage />
      </ProtectedRoute>
    </PermissionGuard>
  );
};

export default ProtectedSendMessagePage;
