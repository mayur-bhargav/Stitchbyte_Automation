"use client";
import { useState, useEffect } from "react";
import { useBalance, MESSAGE_COST } from "../contexts/BalanceContext";
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AddBalanceModal from '../components/AddBalanceModal';
import { apiService } from '../services/apiService';

// Toast notification function
const showToastConsole = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
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
        console.log("Templates API response:", data);
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
        console.log("Processed templates:", tpls);
        console.log("Approved templates:", tpls.filter((t: Template) => t.status === 'APPROVED'));
        setTemplates(tpls);
        } else {
          console.log("Templates endpoint not available, showing empty templates");
          setTemplates([]);
        }
        setTemplatesLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
        setTemplatesLoading(false);
        showToastNotification('Failed to load templates', 'error');
      });

    // Load account limits
    setLimitsLoading(true);
    fetch("http://localhost:8000/phone-number-status")
      .then(res => res.json())
      .then(data => {
        setAccountLimits(data);
        setLimitsLoading(false);
      })
      .catch(() => setLimitsLoading(false));

    // Load message usage
    loadMessageUsage();

    // Load WhatsApp config
    setConfigLoading(true);
    fetch("http://localhost:8000/whatsapp/config")
      .then(res => res.json())
      .then(data => {
        setWhatsappConfig(data);
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
        setShowVariableDropdown(false);
        setActiveVariableField(null);
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
    
    // Get contact info for this phone number
    const contact = allContacts.find(c => c.phone === phoneNumber);
    
    // Replace dynamic variables
    processedText = processedText.replace(/\{\{name\}\}/g, contact?.name || phoneNumber);
    processedText = processedText.replace(/\{\{phone\}\}/g, phoneNumber);
    processedText = processedText.replace(/\{\{first_name\}\}/g, contact?.first_name || contact?.name?.split(' ')[0] || '');
    processedText = processedText.replace(/\{\{last_name\}\}/g, contact?.last_name || contact?.name?.split(' ').slice(1).join(' ') || '');
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

  const handlePhoneKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
    
    if (selectedTpl.variables) {
      selectedTpl.variables.forEach(variable => {
        let value = variableValues[variable] || `{{${variable}}}`;
        
        // Show preview of dynamic variables for first phone number or sample data
        const firstPhone = getAllPhoneNumbers()[0];
        if (firstPhone && value.includes('{{')) {
          // Replace dynamic variables for preview
          value = value.replace(/\{\{name\}\}/g, firstPhone || 'John Doe');
          value = value.replace(/\{\{phone\}\}/g, firstPhone || '+1234567890');
          value = value.replace(/\{\{first_name\}\}/g, 'John');
          value = value.replace(/\{\{last_name\}\}/g, 'Doe');
          value = value.replace(/\{\{company\}\}/g, 'Sample Company');
          value = value.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
          value = value.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
        }
        
        preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), value);
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

        console.log('📅 Creating scheduled message:', scheduledMessageData);
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
        
        console.log('📋 Starting immediate message sending...');
        console.log('📱 Phone numbers:', phoneNumbers);
        console.log('📨 Template:', template);
        console.log('👤 User company ID:', user?.companyId);
        
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
              
              comps = [
                {
                  type: "body",
                  parameters: selectedTpl.variables.map((v) => ({ 
                    type: "text", 
                    text: processedVariableValues[v] || "" 
                  }))
                }
              ];
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

      {/* Balance and Cost Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Balance */}
        <div className="border border-gray-200 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Current Balance</h3>
              <div className="text-2xl font-bold text-[#2A8B8A]">
                ₹{userBalance.toFixed(2)}
              </div>
            </div>
            <div className="w-12 h-12 border border-[#2A8B8A] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowAddBalanceModal(true)}
              className="w-full px-4 py-2 text-sm bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors"
            >
              Add ₹100
            </button>
          </div>
        </div>

        {/* Cost per Message */}
        <div className="border border-gray-200 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Cost per Message</h3>
              <div className="text-2xl font-bold text-black">₹{MESSAGE_COST.toFixed(2)}</div>
            </div>
            <div className="w-12 h-12 border border-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Charged only for successfully sent messages
          </p>
        </div>

        {/* Estimated Cost */}
        <div className="border border-gray-200 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Estimated Cost</h3>
              <div className="text-2xl font-bold text-orange-600">
                ₹{(getAllPhoneNumbers().length * MESSAGE_COST).toFixed(2)}
              </div>
            </div>
            <div className="w-12 h-12 border border-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            For {getAllPhoneNumbers().length || 0} recipient{getAllPhoneNumbers().length !== 1 ? 's' : ''}
          </p>
          {getAllPhoneNumbers().length > 0 && userBalance < (getAllPhoneNumbers().length * MESSAGE_COST) && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              ⚠️ Insufficient balance
            </div>
          )}
        </div>
      </div>

      {/* Message Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="border border-gray-200 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-black mb-6">Compose Message</h2>
          
          <form className="space-y-6">
            {/* Phone Numbers Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-black">
                  Recipients
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
              
              {/* Modern Phone Input with Chips */}
              <div className="border border-gray-300 bg-white p-3 focus-within:ring-2 focus-within:ring-[#2A8B8A] focus-within:border-transparent transition-all rounded-lg">
                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                  {/* Phone Number Chips */}
                  {phones.map((phoneNumber, index) => (
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
                  
                  {/* Input Field */}
                  <input
                    className="flex-1 min-w-[200px] bg-transparent text-black outline-none placeholder-gray-500"
                    placeholder={phones.length === 0 ? "Enter phone numbers (with country code)" : "Add another number..."}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyPress={handlePhoneKeyPress}
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-2">
                Total recipients: {getAllPhoneNumbers().length}
              </p>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
                Message Template
              </label>
              <select
                className="w-full border border-gray-300 bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                value={template}
                onChange={e => {
                  console.log("Selected template:", e.target.value);
                  setTemplate(e.target.value);
                  setVariableValues({});
                }}
                required
                disabled={templatesLoading}
              >
                <option value="">{templatesLoading ? "Loading templates..." : approvedTemplates.length === 0 ? "No approved templates available" : "Select Template"}</option>
                {approvedTemplates.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Variable Inputs */}
            {template && (() => {
              const selectedTpl = approvedTemplates.find(t => t.name === template);
              if (selectedTpl && selectedTpl.variables && selectedTpl.variables.length > 0) {
                return (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-black mb-2">Template Variables</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Use dynamic variables like {'{name}'} to automatically personalize messages for each recipient. 
                      Click the {'{}'} icon to see available options.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTpl.variables.map((v, idx) => (
                        <div key={v} className="relative">
                          <label className="block text-sm font-medium text-black mb-2">
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </label>
                          <div className="relative">
                            <input
                              className="w-full border border-gray-300 bg-white text-black p-4 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                              placeholder={`Enter value for {{${v}}} or use dynamic variables`}
                              value={variableValues[v] || ""}
                              onChange={e => setVariableValues(vals => ({ ...vals, [v]: e.target.value }))}
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#2A8B8A] transition-colors"
                              onClick={() => {
                                console.log('Variable dropdown button clicked for:', v);
                                setActiveVariableField(v);
                                setShowVariableDropdown(!showVariableDropdown || activeVariableField !== v);
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 4h8m-8-8h4" />
                              </svg>
                            </button>
                            
                            {/* Variable Dropdown */}
                            {showVariableDropdown && activeVariableField === v && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                                <div className="py-2">
                                  <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                                    Dynamic Variables
                                  </div>
                                  {DYNAMIC_VARIABLES.map((variable) => (
                                    <button
                                      key={variable.key}
                                      type="button"
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                      onClick={() => {
                                        console.log('Variable selected:', variable.label, 'for field:', v);
                                        const currentValue = variableValues[v] || "";
                                        console.log('Current value:', currentValue);
                                        const newValue = currentValue + variable.label;
                                        console.log('New value:', newValue);
                                        setVariableValues(vals => ({ 
                                          ...vals, 
                                          [v]: newValue 
                                        }));
                                        setShowVariableDropdown(false);
                                        setActiveVariableField(null);
                                      }}
                                    >
                                      <div className="font-medium text-[#2A8B8A]">{variable.label}</div>
                                      <div className="text-xs text-gray-500">{variable.description}</div>
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
                );
              }
              return null;
            })()}
            
            {/* Media Input - File Upload or URL */}
            {template && (() => {
              const selectedTpl = approvedTemplates.find(t => t.name === template);
              const hasMediaHeader = selectedTpl?.header_type && ['image', 'video', 'document'].includes(selectedTpl.header_type);
              const hasExistingMedia = selectedTpl?.header_media?.handle;
              
              // Debug info - remove this after testing
              console.log('Template media debug:', {
                template,
                selectedTpl: selectedTpl ? {
                  name: selectedTpl.name,
                  header_type: selectedTpl.header_type,
                  header_media: selectedTpl.header_media
                } : null,
                hasMediaHeader,
                hasExistingMedia
              });
              
              if (hasMediaHeader) {
                return (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-3">
                      {selectedTpl?.header_type?.toUpperCase()} Media for Header
                      {hasExistingMedia && (
                        <span className="text-xs text-gray-500 ml-2">(Override template media)</span>
                      )}
                    </label>
                    
                    {/* Show existing media info if available */}
                    {hasExistingMedia && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-blue-800">
                            Template has default {selectedTpl?.header_type} media. You can override it below.
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
                            checked={(!mediaUrl && !mediaFile) || !!mediaFile}
                            onChange={() => {
                              setMediaUrl('');
                            }}
                            className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                          />
                          <label htmlFor="upload-file" className="text-sm font-medium text-gray-700">
                            Upload {selectedTpl?.header_type} file
                          </label>
                        </div>
                        <input
                          type="file"
                          accept={
                            selectedTpl?.header_type === 'image' ? 'image/*' :
                            selectedTpl?.header_type === 'video' ? 'video/*' :
                            selectedTpl?.header_type === 'document' ? '*/*' : '*/*'
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
                            Use {selectedTpl?.header_type} URL
                          </label>
                        </div>
                        <input
                          type="url"
                          placeholder={`Enter ${selectedTpl?.header_type} URL (e.g., https://example.com/image.jpg)`}
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
                          className="w-full border border-gray-300 bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                          disabled={!!mediaFile}
                        />
                      </div>
                      
                      {/* Default Media Option (if exists) */}
                      {hasExistingMedia && (
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
                              Use template's default {selectedTpl?.header_type}
                            </label>
                          </div>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                            Template includes its own {selectedTpl?.header_type} media
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {selectedTpl?.header_type === 'image' && 'Supported: JPG, PNG, GIF (max 5MB)'}
                        {selectedTpl?.header_type === 'video' && 'Supported: MP4, 3GP (max 16MB)'}
                        {selectedTpl?.header_type === 'document' && 'Supported: PDF, DOC, XLS, PPT, etc. (max 100MB)'}
                      </div>
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}

            {/* Scheduling Option */}
            {isScheduling && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-3">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-gray-300 bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="md:col-span-2 flex gap-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                className="flex-1 bg-[#2A8B8A] text-white font-semibold p-4 rounded-xl hover:bg-[#238080] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  loading || 
                  getAllPhoneNumbers().length === 0 || 
                  !template || 
                  isMediaRequired() || 
                  userBalance < (getAllPhoneNumbers().length * MESSAGE_COST)
                }
              >
                {loading ? "Sending..." : 
                 userBalance < (getAllPhoneNumbers().length * MESSAGE_COST) ? "Insufficient Balance" :
                 `Send Now${getAllPhoneNumbers().length > 1 ? ` (${getAllPhoneNumbers().length} recipients)` : ""}`}
              </button>
              
              <button
                type="button"
                onClick={() => setIsScheduling(!isScheduling)}
                className="px-6 py-4 border-2 border-[#2A8B8A] text-[#2A8B8A] font-semibold rounded-xl hover:bg-[#2A8B8A] hover:text-white transition-all duration-200"
              >
                {isScheduling ? "Cancel Schedule" : "Schedule Message"}
              </button>
              
              {isScheduling && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    loading || 
                    getAllPhoneNumbers().length === 0 || 
                    !template || 
                    !scheduledTime || 
                    isMediaRequired() || 
                    userBalance < (getAllPhoneNumbers().length * MESSAGE_COST)
                  }
                >
                  {loading ? "Scheduling..." : 
                   userBalance < (getAllPhoneNumbers().length * MESSAGE_COST) ? "Insufficient Balance" :
                   "Schedule"}
                </button>
              )}
            </div>
            
            {/* Balance Warning */}
            {getAllPhoneNumbers().length > 0 && userBalance < (getAllPhoneNumbers().length * MESSAGE_COST) && (
              <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Insufficient Balance</p>
                    <p className="text-xs text-red-600">
                      You need ₹{(getAllPhoneNumbers().length * MESSAGE_COST).toFixed(2)} but only have ₹{userBalance.toFixed(2)}. 
                      Please add ₹{(getAllPhoneNumbers().length * MESSAGE_COST - userBalance).toFixed(2)} to continue.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddBalanceModal(true)}
                    className="ml-auto px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                  >
                    Add Balance
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* iPhone WhatsApp Preview */}
        <div className="border border-gray-200 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-black mb-6">Message Preview</h2>
          
          {/* iPhone Frame */}
          <div className="max-w-sm mx-auto">
            {/* iPhone Frame */}
            <div className="bg-black p-2 rounded-[2.5rem] shadow-2xl">
              <div className="bg-white rounded-[2rem] overflow-hidden">
                {/* iPhone Status Bar */}
                <div className="bg-gray-900 text-white px-6 py-2 text-xs flex justify-between items-center">
                  <span className="font-medium">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-2 border border-white rounded-sm">
                      <div className="w-3 h-1 bg-white rounded-sm m-0.5"></div>
                    </div>
                  </div>
                </div>
                
                {/* WhatsApp Header */}
                <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {getAllPhoneNumbers().length === 0 
                        ? (whatsappConfig?.selected_phone?.verified_name || "Business Name") 
                        : getAllPhoneNumbers().length === 1 
                          ? getAllPhoneNumbers()[0] 
                          : `${getAllPhoneNumbers().length} recipients`
                      }
                    </div>
                    <div className="text-xs text-green-200">online</div>
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
                <div className="bg-gray-100 p-2 flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-400">
                    Type a message
                  </div>
                  <div className="w-8 h-8 bg-[#075E54] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview Info */}
            {getAllPhoneNumbers().length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  This message will be sent to <span className="font-medium text-black">{getAllPhoneNumbers().length}</span> recipient{getAllPhoneNumbers().length !== 1 ? 's' : ''}
                </p>
                {isScheduling && scheduledTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Scheduled for: {new Date(scheduledTime).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Display - Only show errors */}
      {result && result.error && (
        <div className="border border-gray-200 p-6 rounded-lg">
          <div className="bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-red-600">{result.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`rounded-lg shadow-lg p-4 max-w-md ${
            toastType === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {toastType === 'success' ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  toastType === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {toastType === 'success' ? 'Success!' : 'Error'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
    <ProtectedRoute>
      <SendMessage />
    </ProtectedRoute>
  );
};

export default ProtectedSendMessagePage;
