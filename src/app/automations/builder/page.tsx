"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from "../../contexts/UserContext";
import { apiService } from "../../services/apiService";
import { aiService } from "../../services/aiService";
import { WhatsAppPreview } from './WhatsAppPreview';
import { integrationWebhooks, getIntegrationByAccount, getWebhooksByIntegration } from '../integrationWebhooks';
import { integrationTemplates, IntegrationTemplate } from '../integrationTemplates';
import {
  MdClose,
  MdSave,
  MdAdd,
  MdDelete,
  MdEdit,
  MdArrowForward,
  MdSettings,
  MdVisibility,
  MdZoomIn,
  MdZoomOut,
  MdCenterFocusStrong,
  MdFlashOn,
  MdMessage,
  MdInput,
  MdBuild,
  MdPlayArrow,
  MdPause,
  MdRefresh,
  MdCode,
  MdArrowBack,
  MdStore,
  MdShoppingCart,
  MdPerson,
  MdPayment,
  MdSupport,
  MdEmail,
  MdExtension,
  MdInfo,
  MdSmartToy,
  MdBusinessCenter,
  MdChat,
  MdTrendingUp
} from "react-icons/md";

// Get API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Enhanced Types for Dynamic Flow Builder
type FlowStepType = 'trigger' | 'message' | 'condition' | 'data_input' | 'api_call' | 'webhook' | 'delay' | 'custom_action' | 'branch' | 'ai_response';

type FlowStep = {
  id: string;
  type: FlowStepType;
  title: string;
  config: any;
  position: { x: number; y: number };
  connections: string[]; // Array of step IDs this connects to
};

type Connection = {
  from: string;
  to: string;
  label?: string;
  fromButton?: number; // Index of the button if connection starts from a button
};

export default function AutomationBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    name: "New Automation",
    description: "",
    status: "draft"
  });
  
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingFromButton, setConnectingFromButton] = useState<number | null>(null);
  
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [isSaving, setIsSaving] = useState(false);
  
  // AI testing state
  const [testMessage, setTestMessage] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drag functionality at component level
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedStepId) {
        const newPosition = {
          x: Math.max(0, e.clientX - dragStart.x),
          y: Math.max(0, e.clientY - dragStart.y)
        };
        updateStep(draggedStepId, { position: newPosition });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedStepId(null);
    };
    
    if (isDragging && draggedStepId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggedStepId, dragStart]);
  
  // Step Templates
  const stepTemplates = [
    { type: 'trigger', title: 'Trigger', icon: MdFlashOn, color: 'bg-purple-500' },
    { type: 'message', title: 'Send Message', icon: MdMessage, color: 'bg-blue-500' },
    { type: 'ai_response', title: 'AI Response', icon: MdSmartToy, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { type: 'condition', title: 'Condition/Branch', icon: MdCode, color: 'bg-yellow-500' },
    { type: 'data_input', title: 'Collect Data', icon: MdInput, color: 'bg-green-500' },
    { type: 'api_call', title: 'API Call', icon: MdBuild, color: 'bg-red-500' },
    { type: 'webhook', title: 'Webhook', icon: MdRefresh, color: 'bg-indigo-500' },
    { type: 'delay', title: 'Delay/Wait', icon: MdPause, color: 'bg-gray-500' },
    { type: 'custom_action', title: 'Custom Action', icon: MdSettings, color: 'bg-pink-500' },
  ];
  
  // Initialize with a trigger step
  useEffect(() => {
    if (flowSteps.length === 0) {
      const triggerStep: FlowStep = {
        id: 'trigger_' + Date.now(),
        type: 'trigger',
        title: 'Start Trigger',
        config: {
          type: 'keyword',
          keywords: ['start', 'hello']
        },
        position: { x: 50, y: 100 }, // Start at grid position
        connections: []
      };
      setFlowSteps([triggerStep]);
    }
  }, [flowSteps]);

  // Debug connections changes
  useEffect(() => {
    // console.log('Connections state changed:', connections);
  }, [connections]);

  // Debug connection state changes
  useEffect(() => {
    // console.log('Connection state changed - isConnecting:', isConnecting, 'connectingFrom:', connectingFrom);
  }, [isConnecting, connectingFrom]);

  // Load existing automation if editing
  useEffect(() => {
    const automationId = searchParams.get('id');
    const templateId = searchParams.get('template');
    
    if (automationId) {
      // Load existing automation for editing
      loadAutomation(automationId);
    } else if (templateId) {
      // Load from template
      loadTemplate(templateId);
    }
  }, [searchParams]);
  
  const loadAutomation = async (id: string) => {
    try {
      // TODO: Load automation from backend
      // console.log('Loading automation:', id);
    } catch (error) {
      console.error('Error loading automation:', error);
    }
  };
  
  const loadTemplate = async (templateId: string) => {
    try {
      // console.log('Loading template:', templateId);
      
      // Check if it's an integration template
      const integrationTemplate = integrationTemplates.find(t => t.id === templateId);
      
      if (integrationTemplate) {
        // console.log('Loading integration template:', integrationTemplate);
        
        // Set automation name and description from template
        setFormData({
          name: integrationTemplate.name,
          description: integrationTemplate.description,
          status: 'draft'
        });
        
        // Create workflow steps from integration template
        const steps = createStepsFromIntegrationTemplate(integrationTemplate);
        setFlowSteps(steps);
        
        // Create connections between steps
        const connections = createConnectionsFromTemplate(steps);
        setConnections(connections);
        
        // Select the first step
        if (steps.length > 0) {
          setSelectedStepId(steps[0].id);
        }
      } else {
        // Handle regular templates here
        // console.log('Regular template handling not implemented yet');
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  // Create workflow steps from integration template
  const createStepsFromIntegrationTemplate = (template: IntegrationTemplate): FlowStep[] => {
    const steps: FlowStep[] = [];
    const stepWidth = 280;
    const stepHeight = 200;
    let currentX = 50;
    const baseY = 100;

    // 1. Create trigger step
    const triggerStep: FlowStep = {
      id: 'trigger_' + Date.now(),
      type: 'trigger',
      title: `${template.trigger.platform} Trigger`,
      config: {
        type: 'integration',
        integration: template.integration,
        webhook_event: template.trigger.event,
        webhook_url: generateWebhookUrl(template.integration, template.trigger.event),
        webhook_variables: template.workflow.find(w => w.variables)?.variables || []
      },
      position: { x: currentX, y: baseY },
      connections: []
    };
    steps.push(triggerStep);
    currentX += stepWidth;

    // 2. Create workflow steps based on template
    template.workflow.forEach((workflowStep, index) => {
      let stepType: FlowStepType = 'custom_action';
      let stepConfig: any = {};

      // Map workflow actions to step types
      switch (workflowStep.action) {
        case 'send_message':
          stepType = 'message';
          stepConfig = {
            message: workflowStep.template || workflowStep.description,
            buttons: [],
            attachments: []
          };
          break;
        case 'wait':
        case 'delay':
          stepType = 'delay';
          stepConfig = {
            duration: 5,
            unit: 'minutes'
          };
          break;
        case 'notify_admin':
        case 'notify_team':
        case 'notify_agent':
          stepType = 'message';
          stepConfig = {
            message: workflowStep.template || `Admin notification: ${workflowStep.description}`,
            buttons: [],
            attachments: []
          };
          break;
        case 'conditional_action':
          stepType = 'condition';
          stepConfig = {
            condition: 'status == "success"',
            true_path: [],
            false_path: []
          };
          break;
        case 'api_call':
          stepType = 'api_call';
          stepConfig = {
            url: '',
            method: 'POST',
            headers: {},
            body: {}
          };
          break;
        default:
          stepType = 'custom_action';
          stepConfig = {
            action: workflowStep.action,
            description: workflowStep.description
          };
      }

      const step: FlowStep = {
        id: `step_${index}_${Date.now()}`,
        type: stepType,
        title: workflowStep.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        config: stepConfig,
        position: { x: currentX, y: baseY },
        connections: []
      };

      steps.push(step);
      currentX += stepWidth;
    });

    return steps;
  };

  // Create connections between template steps
  const createConnectionsFromTemplate = (steps: FlowStep[]): Connection[] => {
    const connections: Connection[] = [];
    
    // Connect steps sequentially
    for (let i = 0; i < steps.length - 1; i++) {
      connections.push({
        from: steps[i].id,
        to: steps[i + 1].id
      });
      
      // Update step connections
      steps[i].connections.push(steps[i + 1].id);
    }
    
    return connections;
  };

  // Function to generate webhook URL (you might want to move this to a utility file)
  const generateWebhookUrl = (integrationId: string, webhookEvent: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    return `${baseUrl}/webhooks/${integrationId}/${webhookEvent}`;
  };

  // Function to get integration data from our simplified list
  const getIntegrationData = (integrationId: string) => {
    const integrationMap = {
      // E-commerce Platforms
      shopify: { 
        name: 'Shopify', 
        description: 'E-commerce platform for online stores',
        icon: MdShoppingCart,
        color: 'bg-green-500'
      },
      woocommerce: { 
        name: 'WooCommerce', 
        description: 'WordPress e-commerce plugin',
        icon: MdShoppingCart,
        color: 'bg-purple-500'
      },
      magento: { 
        name: 'Magento', 
        description: 'Adobe commerce platform',
        icon: MdShoppingCart,
        color: 'bg-orange-500'
      },
      bigcommerce: { 
        name: 'BigCommerce', 
        description: 'Enterprise e-commerce platform',
        icon: MdShoppingCart,
        color: 'bg-blue-500'
      },

      // Payment Platforms
      stripe: { 
        name: 'Stripe', 
        description: 'Online payment processing platform',
        icon: MdPayment,
        color: 'bg-purple-600'
      },
      paypal: { 
        name: 'PayPal', 
        description: 'Digital payments platform',
        icon: MdPayment,
        color: 'bg-blue-500'
      },
      razorpay: { 
        name: 'Razorpay', 
        description: 'Indian payments gateway',
        icon: MdPayment,
        color: 'bg-blue-700'
      },
      square: { 
        name: 'Square', 
        description: 'Point of sale & payments',
        icon: MdPayment,
        color: 'bg-black'
      },

      // CRM Platforms
      hubspot: { 
        name: 'HubSpot', 
        description: 'CRM and marketing automation',
        icon: MdBusinessCenter,
        color: 'bg-orange-500'
      },
      salesforce: { 
        name: 'Salesforce', 
        description: 'Cloud-based CRM platform',
        icon: MdBusinessCenter,
        color: 'bg-blue-600'
      },
      pipedrive: { 
        name: 'Pipedrive', 
        description: 'Sales pipeline CRM',
        icon: MdBusinessCenter,
        color: 'bg-green-600'
      },
      zoho: { 
        name: 'Zoho CRM', 
        description: 'Business software suite',
        icon: MdBusinessCenter,
        color: 'bg-red-500'
      },

      // Communication Platforms
      slack: { 
        name: 'Slack', 
        description: 'Team communication platform',
        icon: MdChat,
        color: 'bg-purple-500'
      },
      discord: { 
        name: 'Discord', 
        description: 'Voice & text chat platform',
        icon: MdChat,
        color: 'bg-indigo-600'
      },
      telegram: { 
        name: 'Telegram', 
        description: 'Messaging app platform',
        icon: MdChat,
        color: 'bg-blue-500'
      },
      microsoft_teams: { 
        name: 'Microsoft Teams', 
        description: 'Business chat platform',
        icon: MdChat,
        color: 'bg-blue-600'
      },

      // Automation Platforms
      zapier: { 
        name: 'Zapier', 
        description: 'Workflow automation platform',
        icon: MdExtension,
        color: 'bg-orange-500'
      },
      make: { 
        name: 'Make (Integromat)', 
        description: 'Visual platform automation',
        icon: MdExtension,
        color: 'bg-purple-600'
      },
      ifttt: { 
        name: 'IFTTT', 
        description: 'If This Then That automation',
        icon: MdExtension,
        color: 'bg-black'
      },

      // Analytics Platforms
      google_analytics: { 
        name: 'Google Analytics', 
        description: 'Web analytics and reporting',
        icon: MdTrendingUp,
        color: 'bg-blue-500'
      },
      mixpanel: { 
        name: 'Mixpanel', 
        description: 'Product analytics platform',
        icon: MdTrendingUp,
        color: 'bg-purple-600'
      },
      amplitude: { 
        name: 'Amplitude', 
        description: 'Digital analytics platform',
        icon: MdTrendingUp,
        color: 'bg-blue-600'
      },

      // Support Platforms
      zendesk: { 
        name: 'Zendesk', 
        description: 'Customer service platform',
        icon: MdSupport,
        color: 'bg-green-600'
      },
      freshdesk: { 
        name: 'Freshdesk', 
        description: 'Help desk software',
        icon: MdSupport,
        color: 'bg-green-500'
      },
      intercom: { 
        name: 'Intercom', 
        description: 'Customer messaging platform',
        icon: MdSupport,
        color: 'bg-blue-500'
      },

      // Email Marketing
      mailchimp: { 
        name: 'Mailchimp', 
        description: 'Email marketing platform',
        icon: MdEmail,
        color: 'bg-yellow-500'
      },
      constant_contact: { 
        name: 'Constant Contact', 
        description: 'Email marketing service',
        icon: MdEmail,
        color: 'bg-blue-500'
      },

      // Social Media
      twitter: { 
        name: 'Twitter (X)', 
        description: 'Social media platform',
        icon: MdChat,
        color: 'bg-black'
      },
      facebook: { 
        name: 'Facebook', 
        description: 'Social media platform',
        icon: MdChat,
        color: 'bg-blue-600'
      },
      instagram: { 
        name: 'Instagram', 
        description: 'Photo sharing platform',
        icon: MdChat,
        color: 'bg-pink-500'
      },

      // Project Management
      trello: { 
        name: 'Trello', 
        description: 'Project management boards',
        icon: MdBuild,
        color: 'bg-blue-500'
      },
      asana: { 
        name: 'Asana', 
        description: 'Team project management',
        icon: MdBuild,
        color: 'bg-orange-500'
      },
      monday: { 
        name: 'Monday.com', 
        description: 'Work operating system',
        icon: MdBuild,
        color: 'bg-purple-500'
      },

      // Cloud Storage
      dropbox: { 
        name: 'Dropbox', 
        description: 'Cloud storage platform',
        icon: MdStore,
        color: 'bg-blue-600'
      },
      google_drive: { 
        name: 'Google Drive', 
        description: 'Cloud storage & collaboration',
        icon: MdStore,
        color: 'bg-green-500'
      }
    };

    return integrationMap[integrationId as keyof typeof integrationMap] || null;
  };
  
  const addStep = (stepType: FlowStepType) => {
    // Calculate position to avoid overlaps
    const existingPositions = flowSteps.map(step => step.position);
    let newPosition = { x: 300, y: 150 };
    
    // Simple grid positioning to avoid overlaps
    const gridSize = 280; // Width + margin between steps
    const rowHeight = 200; // Height + margin between rows
    const stepsPerRow = 4;
    
    const stepIndex = flowSteps.length;
    const row = Math.floor(stepIndex / stepsPerRow);
    const col = stepIndex % stepsPerRow;
    
    newPosition = {
      x: 50 + (col * gridSize),
      y: 100 + (row * rowHeight)
    };
    
    const newStep: FlowStep = {
      id: stepType + '_' + Date.now(),
      type: stepType,
      title: stepTemplates.find(t => t.type === stepType)?.title || stepType,
      config: getDefaultConfig(stepType),
      position: newPosition,
      connections: []
    };
    
    setFlowSteps([...flowSteps, newStep]);
    setSelectedStepId(newStep.id);
  };
  
  const getDefaultConfig = (stepType: FlowStepType) => {
    switch (stepType) {
      case 'trigger':
        return { 
          type: 'keyword', 
          keywords: [],
          integration: '',
          webhook_event: '',
          webhook_url: ''
        };
      case 'message':
        return { message: '', buttons: [], attachments: [] };
      case 'ai_response':
        return { 
          enabled: true,
          system_prompt: 'You are a helpful customer service assistant for our company. Be professional, helpful, and stay focused on customer support topics.',
          tone: 'professional',
          temperature: 0.7,
          max_tokens: 150,
          scope_restrictions: {
            company_only: true,
            no_technical_details: true,
            no_personal_info: true
          },
          trigger_keywords: ['help', 'support', 'question', 'ask'],
          fallback_message: 'I can help you with general questions about our services. For specific support, please contact our team.',
          rate_limit: {
            max_requests_per_user: 5,
            time_window: '1hour'
          }
        };
      case 'condition':
        return { condition: '', true_path: [], false_path: [] };
      case 'data_input':
        return { fields: [], storage: { type: 'google_sheets' } };
      case 'api_call':
        return { url: '', method: 'GET', headers: {}, body: {} };
      case 'webhook':
        return { url: '', method: 'POST', payload: {} };
      case 'delay':
        return { duration: 5, unit: 'minutes' };
      default:
        return {};
    }
  };
  
  const deleteStep = (stepId: string) => {
    setFlowSteps(flowSteps.filter(step => step.id !== stepId));
    setConnections(connections.filter(conn => conn.from !== stepId && conn.to !== stepId));
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  // Helper function to render integration icons
  const renderIntegrationIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      MdStore,
      MdShoppingCart,
      MdPerson,
      MdPayment,
      MdSupport,
      MdEmail,
      MdExtension
    };
    const IconComponent = icons[iconName] || MdExtension;
    return <IconComponent className="w-5 h-5" />;
  };

  const updateStep = (stepId: string, updates: Partial<FlowStep>) => {
    setFlowSteps(flowSteps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };
  
  const startConnection = (fromStepId: string, fromButtonIndex?: number) => {
    // console.log('startConnection called with:', fromStepId, 'button:', fromButtonIndex);
    // console.log('Before setting state - isConnecting:', isConnecting, 'connectingFrom:', connectingFrom);
    setIsConnecting(true);
    setConnectingFrom(fromStepId);
    setConnectingFromButton(fromButtonIndex !== undefined ? fromButtonIndex : null);
    // console.log('After setting state - should be true and', fromStepId, 'button:', fromButtonIndex);
  };
  
  const completeConnection = (toStepId: string) => {
    // console.log('Completing connection to:', toStepId, 'from:', connectingFrom, 'button:', connectingFromButton);
    // console.log('Current connections:', connections);
    // console.log('Current flow steps:', flowSteps);
    
    if (connectingFrom && connectingFrom !== toStepId) {
      // Check if connection already exists
      const existingConnection = connections.find(conn => 
        conn.from === connectingFrom && 
        conn.to === toStepId && 
        conn.fromButton === connectingFromButton
      );
      
      if (!existingConnection) {
        const newConnection: Connection = {
          from: connectingFrom,
          to: toStepId,
          fromButton: connectingFromButton !== null ? connectingFromButton : undefined
        };
        // console.log('Creating new connection:', newConnection);
        const newConnections = [...connections, newConnection];
        // console.log('Setting connections to:', newConnections);
        setConnections(newConnections);
        
        // Update source step connections or button connections
        const sourceStep = flowSteps.find(s => s.id === connectingFrom);
        if (sourceStep) {
          if (connectingFromButton !== null) {
            // Update button connection
            const newButtons = [...(sourceStep.config.buttons || [])];
            if (newButtons[connectingFromButton]) {
              newButtons[connectingFromButton] = {
                ...newButtons[connectingFromButton],
                connected_to: toStepId
              };
              updateStep(connectingFrom, {
                config: { ...sourceStep.config, buttons: newButtons }
              });
            }
          } else {
            // Update step connection
            updateStep(connectingFrom, {
              connections: [...(sourceStep.connections || []), toStepId]
            });
          }
        }
        // console.log('Connection created successfully:', newConnection);
      } else {
        // console.log('Connection already exists');
      }
    }
    
    setIsConnecting(false);
    setConnectingFrom(null);
    setConnectingFromButton(null);
  };
  
  const removeConnection = (from: string, to: string, fromButton?: number) => {
    setConnections(connections.filter(conn => !(
      conn.from === from && 
      conn.to === to && 
      conn.fromButton === fromButton
    )));
    
    const sourceStep = flowSteps.find(s => s.id === from);
    if (sourceStep) {
      if (fromButton !== undefined) {
        // Remove button connection
        const newButtons = [...(sourceStep.config.buttons || [])];
        if (newButtons[fromButton]) {
          newButtons[fromButton] = {
            ...newButtons[fromButton],
            connected_to: undefined
          };
          updateStep(from, {
            config: { ...sourceStep.config, buttons: newButtons }
          });
        }
      } else {
        // Remove step connection
        updateStep(from, {
          connections: sourceStep.connections.filter(id => id !== to)
        });
      }
    }
  };
  
  const getStepIcon = (stepType: FlowStepType) => {
    const template = stepTemplates.find(t => t.type === stepType);
    return template?.icon || MdSettings;
  };
  
  const getStepColor = (stepType: FlowStepType) => {
    const template = stepTemplates.find(t => t.type === stepType);
    return template?.color || 'bg-gray-500';
  };
  
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'doc': return '📝';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      default: return '📎';
    }
  };

  const renderWhatsAppMessagePreview = (step: FlowStep) => {
    const message = step.config.message || 'No message set';
    const buttons = step.config.buttons || [];
    const attachments = step.config.attachments || [];
    
    // Separate buttons by type for WhatsApp API constraints
    const automationButtons = buttons.filter((b: any) => b.type === 'automation');
    const urlButtons = buttons.filter((b: any) => b.type === 'link');
    const phoneButtons = buttons.filter((b: any) => b.type === 'phone');
    
    // WhatsApp API constraint: Can't mix quick reply and CTA buttons
    const hasAutomationButtons = automationButtons.length > 0;
    const hasCTAButtons = urlButtons.length > 0 || phoneButtons.length > 0;
    const violatesConstraint = hasAutomationButtons && hasCTAButtons;
    
    // console.log('🔍 Rendering WhatsApp preview:', { 
    //   message, buttons, attachments, 
    //   hasAutomationButtons, hasCTAButtons, violatesConstraint 
    // });
    
    return (
      <div className="space-y-2">
        {/* Main Message */}
        <div className={`bg-white border rounded-lg p-3 max-w-xs ${violatesConstraint ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
          {/* Constraint Warning */}
          {violatesConstraint && (
            <div className="mb-2 p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
              ⚠️ WhatsApp: Can't mix automation + URL buttons in one template. Will send as separate messages.
            </div>
          )}

          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="mb-2 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{getAttachmentIcon(attachments[0].type || 'pdf')}</span>
                <span className="font-medium">Media:</span>
                <span className="truncate">[{attachments[0].type?.toUpperCase() || 'FILE'}] {attachments[0].name || 'Document'}</span>
              </div>
              {attachments[0].url && (
                <div className="text-xs text-gray-400 mt-1 truncate">
                  {attachments[0].url}
                </div>
              )}
            </div>
          )}
          
          {/* Message Text */}
          <div className="text-sm text-gray-900 mb-3 leading-relaxed">
            {message}
          </div>
          
          {/* Timestamp */}
          <div className="text-xs text-gray-400 text-right mb-3">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          {/* Automation Buttons (Quick Reply) */}
          {automationButtons.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-green-600 font-medium">Quick Reply Buttons:</div>
              {automationButtons.map((button: any, index: number) => (
                <div key={`auto-${index}`} className="relative group">
                  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // console.log('Connect button input:', button.text);
                    }}
                    title="Connect input to this button"
                  />
                  
                  <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // console.log('Starting connection from automation button', index, 'of step', step.id);
                      startConnection(step.id, index);
                    }}
                    title="Connect output from this button"
                  />
                  
                  <div className="border border-green-300 rounded-lg p-2 text-center text-sm bg-green-50 text-green-700">
                    <div className="flex items-center justify-center gap-2">
                      <span>⚡</span>
                      <span className="font-medium">{button.text || 'Automation'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Triggers workflow</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separate CTA Message (if mixed buttons) */}
        {violatesConstraint && (urlButtons.length > 0 || phoneButtons.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
            <div className="text-xs text-blue-600 font-medium mb-2">Call-to-Action Buttons (Separate Template):</div>
            <div className="space-y-2">
              {urlButtons.map((button: any, index: number) => (
                <div key={`url-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                  <div className="flex items-center justify-center gap-2">
                    <span>🔗</span>
                    <span className="font-medium">{button.text || 'Visit Link'}</span>
                  </div>
                  {button.url && (
                    <div className="text-xs text-gray-500 mt-1 truncate">{button.url}</div>
                  )}
                </div>
              ))}
              {phoneButtons.map((button: any, index: number) => (
                <div key={`phone-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                  <div className="flex items-center justify-center gap-2">
                    <span>📞</span>
                    <span className="font-medium">{button.text || 'Call'}</span>
                  </div>
                  {button.phone && (
                    <div className="text-xs text-gray-500 mt-1">{button.phone}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single type buttons (no constraint violation) */}
        {!violatesConstraint && (urlButtons.length > 0 || phoneButtons.length > 0) && (
          <div className="space-y-2">
            {urlButtons.map((button: any, index: number) => (
              <div key={`url-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                <div className="flex items-center justify-center gap-2">
                  <span>🔗</span>
                  <span className="font-medium">{button.text || 'Visit Link'}</span>
                </div>
                {button.url && (
                  <div className="text-xs text-gray-500 mt-1 truncate">{button.url}</div>
                )}
              </div>
            ))}
            {phoneButtons.map((button: any, index: number) => (
              <div key={`phone-${index}`} className="border border-blue-300 rounded-lg p-2 text-center text-sm bg-blue-50 text-blue-700">
                <div className="flex items-center justify-center gap-2">
                  <span>📞</span>
                  <span className="font-medium">{button.text || 'Call'}</span>
                </div>
                {button.phone && (
                  <div className="text-xs text-gray-500 mt-1">{button.phone}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStep = (step: FlowStep) => {
    const Icon = getStepIcon(step.type);
    const isSelected = selectedStepId === step.id;
    const isConnecting = connectingFrom === step.id;
    const isDraggedStep = draggedStepId === step.id;
    
    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.step-header')) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDraggedStepId(step.id);
        setDragStart({
          x: e.clientX - step.position.x,
          y: e.clientY - step.position.y
        });
      }
    };
    
    return (
      <div
        key={step.id}
        className={`absolute cursor-pointer transition-all duration-200 ${
          isSelected ? 'scale-105 z-30' : 'z-10'
        } ${isDraggedStep ? 'cursor-grabbing z-40' : 'cursor-grab'}`}
        style={{
          left: step.position.x,
          top: step.position.y,
          transform: `scale(${canvasZoom})`,
          transformOrigin: 'top left'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isConnecting && connectingFrom !== step.id) {
            completeConnection(step.id);
          } else {
            setSelectedStepId(step.id);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // Double click can also be used for connections
          if (isConnecting && connectingFrom !== step.id) {
            completeConnection(step.id);
          }
        }}
        onMouseDown={handleMouseDown}
      >
        <div className={`bg-white rounded-xl shadow-lg border-2 min-w-[200px] transition-all relative ${
          isSelected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
        } ${
          connectingFrom && connectingFrom !== step.id 
            ? 'ring-4 ring-green-400 ring-opacity-50 border-green-300 shadow-green-200' 
            : ''
        } ${
          connectingFrom === step.id 
            ? 'ring-4 ring-yellow-400 ring-opacity-50 border-yellow-300' 
            : ''
        } ${
          isDraggedStep ? 'shadow-2xl' : ''
        }`}>
          
          {/* Left Connection Dot (Input) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              // Use connectingFrom instead of isConnecting for more reliable check
              if (connectingFrom && connectingFrom !== step.id) {
                // console.log('Attempting to complete connection to:', step.id);
                completeConnection(step.id);
              } else {
                // console.log('Cannot connect - conditions not met');
              }
            }}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-pointer z-20 transition-all ${
              connectingFrom && connectingFrom !== step.id
                ? 'bg-green-500 border-green-600 shadow-lg scale-125'
                : 'bg-gray-300 border-gray-400 hover:bg-blue-400 hover:border-blue-500'
            }`}
            title={connectingFrom ? "Click to complete connection" : "Connection input"}
          />
          
          {/* Right Connection Dot (Output) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              //  console.log('Right dot clicked!', {
              //   stepId: step.id,
              //   isConnecting,
              //   connectingFrom,
              //   connectingFromButton
              // });
              if (!isConnecting) {
                // console.log('Starting connection from step:', step.id);
                startConnection(step.id);
              } else if (connectingFrom === step.id && connectingFromButton === null) {
                // Cancel connection if clicking on same step (and not from a button)
                // console.log('Cancelling connection');
                setIsConnecting(false);
                setConnectingFrom(null);
                setConnectingFromButton(null);
              }
            }}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-pointer z-20 transition-all ${
              connectingFrom === step.id && connectingFromButton === null
                ? 'bg-yellow-500 border-yellow-600 shadow-lg scale-125'
                : 'bg-blue-500 border-blue-600 hover:bg-purple-500 hover:border-purple-600'
            }`}
            title={
              connectingFrom === step.id && connectingFromButton === null
                ? "Click to cancel connection" 
                : "Click to start connection"
            }
          />
          {/* Step Header */}
          <div className={`step-header ${getStepColor(step.type)} text-white p-3 rounded-t-xl flex items-center justify-between cursor-grab`}>
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{step.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStep(step.id);
                }}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                title="Delete step"
              >
                <MdDelete className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Step Content Preview */}
          <div className="p-3">
            <div className={`text-xs ${step.type === 'message' ? '' : 'text-gray-600'}`}>
              {step.type === 'message' ? (
                <div className="text-center">
                  {renderStepPreview(step)}
                </div>
              ) : (
                renderStepPreview(step)
              )}
            </div>
            
            {/* Connection Points */}
            {step.connections.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Connected to: {step.connections.length} step(s)
                </div>
              </div>
            )}
          </div>
          
          {/* Connection Handles */}
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderStepPreview = (step: FlowStep) => {
    switch (step.type) {
      case 'trigger':
        if (step.config.type === 'integration' && step.config.integration && step.config.webhook_event) {
          const integration = getIntegrationData(step.config.integration);
          return `Trigger: ${integration?.name || step.config.integration} → ${step.config.webhook_event}`;
        }
        return `Trigger: ${step.config.type} - ${step.config.keywords?.join(', ') || 'Not configured'}`;
      case 'message':
        return renderWhatsAppMessagePreview(step);
      case 'condition':
        return `Condition: ${step.config.condition || 'No condition set'}`;
      case 'data_input':
        return `Collect: ${step.config.fields?.length || 0} fields`;
      case 'api_call':
        return `API: ${step.config.method || 'GET'} ${step.config.url || 'No URL'}`;
      case 'webhook':
        return `Webhook: ${step.config.url || 'No URL set'}`;
      case 'delay':
        return `Wait: ${step.config.duration || 0} ${step.config.unit || 'minutes'}`;
      default:
        return 'Custom configuration';
    }
  };
  
  const renderConnections = () => {
    if (!canvasRef.current || connections.length === 0) {
      return null;
    }

    return (
      <svg
        className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-20"
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="11"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 12 4, 0 8"
              fill="#6366f1"
            />
          </marker>
          
          <marker
            id="arrowhead-green"
            markerWidth="12"
            markerHeight="8"
            refX="11"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 12 4, 0 8"
              fill="#10b981"
            />
          </marker>
        </defs>
        
        {connections.map((connection, index) => {
          const fromStep = flowSteps.find(s => s.id === connection.from);
          const toStep = flowSteps.find(s => s.id === connection.to);
          
          if (!fromStep || !toStep) return null;
          
          // Calculate connection points with proper scaling
          const stepWidth = 280;
          const stepHeight = 140;
          
          const fromX = (fromStep.position.x + stepWidth) * canvasZoom + canvasPosition.x;
          const fromY = (fromStep.position.y + stepHeight / 2) * canvasZoom + canvasPosition.y;
          const toX = toStep.position.x * canvasZoom + canvasPosition.x;
          const toY = (toStep.position.y + stepHeight / 2) * canvasZoom + canvasPosition.y;
          
          // Create smooth curved path
          const dx = toX - fromX;
          const dy = toY - fromY;
          const controlOffset = Math.max(Math.abs(dx) * 0.5, 50);
          
          const pathD = `M ${fromX},${fromY} C ${fromX + controlOffset},${fromY} ${toX - controlOffset},${toY} ${toX},${toY}`;
          
          return (
            <g key={`connection-${index}`}>
              <path
                d={pathD}
                stroke={connection.fromButton !== undefined ? "#10b981" : "#6366f1"}
                strokeWidth="3"
                fill="none"
                markerEnd={connection.fromButton !== undefined ? "url(#arrowhead-green)" : "url(#arrowhead)"}
                opacity="0.9"
                style={{ 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            </g>
          );
        })}
      </svg>
    );
  };
  
  const renderStepConfigForm = (step: FlowStep) => {
    const updateConfig = (newConfig: any) => {
      // console.log('Updating config for step:', step.id, 'with:', newConfig);
      updateStep(step.id, { config: newConfig });
    };

    switch (step.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={step.config.type || 'keyword'}
                onChange={(e) => {
                  const newType = e.target.value;
                  updateConfig({ 
                    ...step.config, 
                    type: newType,
                    // Reset integration fields when changing type
                    integration: newType === 'integration' ? '' : step.config.integration,
                    webhook_event: newType === 'integration' ? '' : step.config.webhook_event
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="keyword">Keyword Trigger</option>
                <option value="schedule">Schedule Trigger</option>
                <option value="webhook">Webhook Trigger</option>
                <option value="integration">Integration Webhook</option>
              </select>
            </div>

            {/* Integration Selection */}
            {step.config.type === 'integration' && (
              <>
                {/* Change Integration Button (if integration already selected) */}
                {step.config.integration && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${getIntegrationData(step.config.integration)?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white`}>
                          {(() => {
                            const integration = getIntegrationData(step.config.integration);
                            if (integration?.icon) {
                              const Icon = integration.icon;
                              return <Icon className="w-4 h-4" />;
                            }
                            return <MdExtension className="w-4 h-4" />;
                          })()}
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">
                            {getIntegrationData(step.config.integration)?.name || step.config.integration}
                          </p>
                          <p className="text-sm text-blue-700">
                            {getIntegrationData(step.config.integration)?.description || ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateConfig({ 
                          ...step.config, 
                          integration: '',
                          webhook_event: '',
                          webhook_url: '',
                          webhook_variables: []
                        })}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Change Integration
                      </button>
                    </div>
                  </div>
                )}

                {/* Integration Platform Selection */}
                {!step.config.integration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Integration Platform
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {/* All Popular Integrations */}
                      {[
                        // E-commerce Platforms
                        { 
                          id: 'shopify', 
                          name: 'Shopify', 
                          description: 'E-commerce platform for online stores',
                          icon: MdShoppingCart,
                          color: 'bg-green-500',
                          webhooks: ['new_order', 'payment_received', 'product_update']
                        },
                        { 
                          id: 'woocommerce', 
                          name: 'WooCommerce', 
                          description: 'WordPress e-commerce plugin',
                          icon: MdShoppingCart,
                          color: 'bg-purple-500',
                          webhooks: ['order_created', 'payment_complete', 'product_updated']
                        },
                        { 
                          id: 'magento', 
                          name: 'Magento', 
                          description: 'Adobe commerce platform',
                          icon: MdShoppingCart,
                          color: 'bg-orange-500',
                          webhooks: ['order_placed', 'customer_created', 'product_saved']
                        },
                        { 
                          id: 'bigcommerce', 
                          name: 'BigCommerce', 
                          description: 'Enterprise e-commerce platform',
                          icon: MdShoppingCart,
                          color: 'bg-blue-500',
                          webhooks: ['order_created', 'customer_created', 'product_created']
                        },

                        // Payment Platforms
                        { 
                          id: 'stripe', 
                          name: 'Stripe', 
                          description: 'Online payment processing platform',
                          icon: MdPayment,
                          color: 'bg-purple-600',
                          webhooks: ['payment_success', 'payment_failed', 'subscription_created']
                        },
                        { 
                          id: 'paypal', 
                          name: 'PayPal', 
                          description: 'Digital payments platform',
                          icon: MdPayment,
                          color: 'bg-blue-500',
                          webhooks: ['payment_completed', 'subscription_activated', 'dispute_created']
                        },
                        { 
                          id: 'razorpay', 
                          name: 'Razorpay', 
                          description: 'Indian payments gateway',
                          icon: MdPayment,
                          color: 'bg-blue-700',
                          webhooks: ['payment_captured', 'payment_failed', 'subscription_charged']
                        },
                        { 
                          id: 'square', 
                          name: 'Square', 
                          description: 'Point of sale & payments',
                          icon: MdPayment,
                          color: 'bg-black',
                          webhooks: ['payment_updated', 'order_fulfillment', 'invoice_payment']
                        },

                        // CRM Platforms
                        { 
                          id: 'hubspot', 
                          name: 'HubSpot', 
                          description: 'CRM and marketing automation',
                          icon: MdBusinessCenter,
                          color: 'bg-orange-500',
                          webhooks: ['new_contact', 'deal_created', 'email_opened']
                        },
                        { 
                          id: 'salesforce', 
                          name: 'Salesforce', 
                          description: 'Cloud-based CRM platform',
                          icon: MdBusinessCenter,
                          color: 'bg-blue-600',
                          webhooks: ['lead_created', 'opportunity_updated', 'account_updated']
                        },
                        { 
                          id: 'pipedrive', 
                          name: 'Pipedrive', 
                          description: 'Sales pipeline CRM',
                          icon: MdBusinessCenter,
                          color: 'bg-green-600',
                          webhooks: ['deal_added', 'person_added', 'activity_added']
                        },
                        { 
                          id: 'zoho', 
                          name: 'Zoho CRM', 
                          description: 'Business software suite',
                          icon: MdBusinessCenter,
                          color: 'bg-red-500',
                          webhooks: ['lead_created', 'contact_created', 'deal_created']
                        },

                        // Communication Platforms
                        { 
                          id: 'slack', 
                          name: 'Slack', 
                          description: 'Team communication platform',
                          icon: MdChat,
                          color: 'bg-purple-500',
                          webhooks: ['message_received', 'channel_created', 'user_joined']
                        },
                        { 
                          id: 'discord', 
                          name: 'Discord', 
                          description: 'Voice & text chat platform',
                          icon: MdChat,
                          color: 'bg-indigo-600',
                          webhooks: ['message_create', 'guild_member_add', 'reaction_add']
                        },
                        { 
                          id: 'telegram', 
                          name: 'Telegram', 
                          description: 'Messaging app platform',
                          icon: MdChat,
                          color: 'bg-blue-500',
                          webhooks: ['message_received', 'callback_query', 'inline_query']
                        },
                        { 
                          id: 'microsoft_teams', 
                          name: 'Microsoft Teams', 
                          description: 'Business chat platform',
                          icon: MdChat,
                          color: 'bg-blue-600',
                          webhooks: ['message_received', 'meeting_started', 'channel_created']
                        },

                        // Automation Platforms
                        { 
                          id: 'zapier', 
                          name: 'Zapier', 
                          description: 'Workflow automation platform',
                          icon: MdExtension,
                          color: 'bg-orange-500',
                          webhooks: ['zap_triggered', 'automation_complete', 'error_occurred']
                        },
                        { 
                          id: 'make', 
                          name: 'Make (Integromat)', 
                          description: 'Visual platform automation',
                          icon: MdExtension,
                          color: 'bg-purple-600',
                          webhooks: ['scenario_executed', 'operation_complete', 'error_occurred']
                        },
                        { 
                          id: 'ifttt', 
                          name: 'IFTTT', 
                          description: 'If This Then That automation',
                          icon: MdExtension,
                          color: 'bg-black',
                          webhooks: ['applet_triggered', 'action_completed', 'service_connected']
                        },

                        // Analytics Platforms
                        { 
                          id: 'google_analytics', 
                          name: 'Google Analytics', 
                          description: 'Web analytics and reporting',
                          icon: MdTrendingUp,
                          color: 'bg-blue-500',
                          webhooks: ['goal_completed', 'traffic_spike', 'conversion_tracked']
                        },
                        { 
                          id: 'mixpanel', 
                          name: 'Mixpanel', 
                          description: 'Product analytics platform',
                          icon: MdTrendingUp,
                          color: 'bg-purple-600',
                          webhooks: ['event_tracked', 'funnel_completed', 'cohort_updated']
                        },
                        { 
                          id: 'amplitude', 
                          name: 'Amplitude', 
                          description: 'Digital analytics platform',
                          icon: MdTrendingUp,
                          color: 'bg-blue-600',
                          webhooks: ['event_ingested', 'user_property_updated', 'cohort_computed']
                        },

                        // Support Platforms
                        { 
                          id: 'zendesk', 
                          name: 'Zendesk', 
                          description: 'Customer service platform',
                          icon: MdSupport,
                          color: 'bg-green-600',
                          webhooks: ['ticket_created', 'ticket_updated', 'user_created']
                        },
                        { 
                          id: 'freshdesk', 
                          name: 'Freshdesk', 
                          description: 'Help desk software',
                          icon: MdSupport,
                          color: 'bg-green-500',
                          webhooks: ['ticket_created', 'ticket_resolved', 'contact_created']
                        },
                        { 
                          id: 'intercom', 
                          name: 'Intercom', 
                          description: 'Customer messaging platform',
                          icon: MdSupport,
                          color: 'bg-blue-500',
                          webhooks: ['conversation_created', 'user_created', 'message_created']
                        },

                        // Email Marketing
                        { 
                          id: 'mailchimp', 
                          name: 'Mailchimp', 
                          description: 'Email marketing platform',
                          icon: MdEmail,
                          color: 'bg-yellow-500',
                          webhooks: ['campaign_sent', 'subscribe', 'unsubscribe']
                        },
                        { 
                          id: 'constant_contact', 
                          name: 'Constant Contact', 
                          description: 'Email marketing service',
                          icon: MdEmail,
                          color: 'bg-blue-500',
                          webhooks: ['contact_added', 'campaign_sent', 'bounce_received']
                        },

                        // Social Media
                        { 
                          id: 'twitter', 
                          name: 'Twitter (X)', 
                          description: 'Social media platform',
                          icon: MdChat,
                          color: 'bg-black',
                          webhooks: ['tweet_created', 'mention_received', 'follow_received']
                        },
                        { 
                          id: 'facebook', 
                          name: 'Facebook', 
                          description: 'Social media platform',
                          icon: MdChat,
                          color: 'bg-blue-600',
                          webhooks: ['page_post', 'message_received', 'lead_generated']
                        },
                        { 
                          id: 'instagram', 
                          name: 'Instagram', 
                          description: 'Photo sharing platform',
                          icon: MdChat,
                          color: 'bg-pink-500',
                          webhooks: ['media_published', 'comment_received', 'mention_received']
                        },

                        // Project Management
                        { 
                          id: 'trello', 
                          name: 'Trello', 
                          description: 'Project management boards',
                          icon: MdBuild,
                          color: 'bg-blue-500',
                          webhooks: ['card_created', 'card_moved', 'list_created']
                        },
                        { 
                          id: 'asana', 
                          name: 'Asana', 
                          description: 'Team project management',
                          icon: MdBuild,
                          color: 'bg-orange-500',
                          webhooks: ['task_created', 'project_created', 'story_added']
                        },
                        { 
                          id: 'monday', 
                          name: 'Monday.com', 
                          description: 'Work operating system',
                          icon: MdBuild,
                          color: 'bg-purple-500',
                          webhooks: ['item_created', 'column_value_changed', 'board_created']
                        },

                        // Cloud Storage
                        { 
                          id: 'dropbox', 
                          name: 'Dropbox', 
                          description: 'Cloud storage platform',
                          icon: MdStore,
                          color: 'bg-blue-600',
                          webhooks: ['file_uploaded', 'folder_shared', 'file_deleted']
                        },
                        { 
                          id: 'google_drive', 
                          name: 'Google Drive', 
                          description: 'Cloud storage & collaboration',
                          icon: MdStore,
                          color: 'bg-green-500',
                          webhooks: ['file_created', 'file_shared', 'folder_created']
                        }
                      ].map((integration) => {
                        const Icon = integration.icon;
                        return (
                          <div
                            key={integration.id}
                            onClick={() => updateConfig({ 
                              ...step.config, 
                              integration: integration.id,
                              webhook_event: '',
                              webhook_url: '',
                              webhook_variables: []
                            })}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              step.config.integration === integration.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center text-white`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{integration.name}</h4>
                                <p className="text-sm text-gray-600">{integration.description}</p>
                                <div className="mt-1">
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    {integration.webhooks.length} webhook{integration.webhooks.length !== 1 ? 's' : ''} available
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Webhook Event Selection */}
                {step.config.integration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Webhook Event
                    </label>
                    {(() => {
                      // Define webhook events for all integrations
                      const integrationEvents = {
                        // E-commerce
                        shopify: [
                          { id: 'new_order', name: 'New Order', description: 'Triggered when a new order is placed' },
                          { id: 'payment_received', name: 'Payment Received', description: 'Triggered when payment is confirmed' },
                          { id: 'product_update', name: 'Product Update', description: 'Triggered when product is updated' }
                        ],
                        woocommerce: [
                          { id: 'order_created', name: 'Order Created', description: 'Triggered when new order is created' },
                          { id: 'payment_complete', name: 'Payment Complete', description: 'Triggered when payment is completed' },
                          { id: 'product_updated', name: 'Product Updated', description: 'Triggered when product is updated' }
                        ],
                        magento: [
                          { id: 'order_placed', name: 'Order Placed', description: 'Triggered when order is placed' },
                          { id: 'customer_created', name: 'Customer Created', description: 'Triggered when customer is created' },
                          { id: 'product_saved', name: 'Product Saved', description: 'Triggered when product is saved' }
                        ],
                        bigcommerce: [
                          { id: 'order_created', name: 'Order Created', description: 'Triggered when order is created' },
                          { id: 'customer_created', name: 'Customer Created', description: 'Triggered when customer is created' },
                          { id: 'product_created', name: 'Product Created', description: 'Triggered when product is created' }
                        ],

                        // Payments
                        stripe: [
                          { id: 'payment_success', name: 'Payment Success', description: 'Triggered when payment succeeds' },
                          { id: 'payment_failed', name: 'Payment Failed', description: 'Triggered when payment fails' },
                          { id: 'subscription_created', name: 'Subscription Created', description: 'Triggered when subscription is created' }
                        ],
                        paypal: [
                          { id: 'payment_completed', name: 'Payment Completed', description: 'Triggered when payment is completed' },
                          { id: 'subscription_activated', name: 'Subscription Activated', description: 'Triggered when subscription is activated' },
                          { id: 'dispute_created', name: 'Dispute Created', description: 'Triggered when dispute is created' }
                        ],
                        razorpay: [
                          { id: 'payment_captured', name: 'Payment Captured', description: 'Triggered when payment is captured' },
                          { id: 'payment_failed', name: 'Payment Failed', description: 'Triggered when payment fails' },
                          { id: 'subscription_charged', name: 'Subscription Charged', description: 'Triggered when subscription is charged' }
                        ],
                        square: [
                          { id: 'payment_updated', name: 'Payment Updated', description: 'Triggered when payment is updated' },
                          { id: 'order_fulfillment', name: 'Order Fulfillment', description: 'Triggered when order is fulfilled' },
                          { id: 'invoice_payment', name: 'Invoice Payment', description: 'Triggered when invoice is paid' }
                        ],

                        // CRM
                        hubspot: [
                          { id: 'new_contact', name: 'New Contact', description: 'Triggered when new contact is added' },
                          { id: 'deal_created', name: 'Deal Created', description: 'Triggered when new deal is created' },
                          { id: 'email_opened', name: 'Email Opened', description: 'Triggered when email is opened' }
                        ],
                        salesforce: [
                          { id: 'lead_created', name: 'Lead Created', description: 'Triggered when lead is created' },
                          { id: 'opportunity_updated', name: 'Opportunity Updated', description: 'Triggered when opportunity is updated' },
                          { id: 'account_updated', name: 'Account Updated', description: 'Triggered when account is updated' }
                        ],
                        pipedrive: [
                          { id: 'deal_added', name: 'Deal Added', description: 'Triggered when deal is added' },
                          { id: 'person_added', name: 'Person Added', description: 'Triggered when person is added' },
                          { id: 'activity_added', name: 'Activity Added', description: 'Triggered when activity is added' }
                        ],
                        zoho: [
                          { id: 'lead_created', name: 'Lead Created', description: 'Triggered when lead is created' },
                          { id: 'contact_created', name: 'Contact Created', description: 'Triggered when contact is created' },
                          { id: 'deal_created', name: 'Deal Created', description: 'Triggered when deal is created' }
                        ],

                        // Communication
                        slack: [
                          { id: 'message_received', name: 'Message Received', description: 'Triggered when message is received' },
                          { id: 'channel_created', name: 'Channel Created', description: 'Triggered when channel is created' },
                          { id: 'user_joined', name: 'User Joined', description: 'Triggered when user joins workspace' }
                        ],
                        discord: [
                          { id: 'message_create', name: 'Message Create', description: 'Triggered when message is created' },
                          { id: 'guild_member_add', name: 'Member Added', description: 'Triggered when member joins server' },
                          { id: 'reaction_add', name: 'Reaction Added', description: 'Triggered when reaction is added' }
                        ],
                        telegram: [
                          { id: 'message_received', name: 'Message Received', description: 'Triggered when message is received' },
                          { id: 'callback_query', name: 'Callback Query', description: 'Triggered when button is pressed' },
                          { id: 'inline_query', name: 'Inline Query', description: 'Triggered when inline query is made' }
                        ],
                        microsoft_teams: [
                          { id: 'message_received', name: 'Message Received', description: 'Triggered when message is received' },
                          { id: 'meeting_started', name: 'Meeting Started', description: 'Triggered when meeting starts' },
                          { id: 'channel_created', name: 'Channel Created', description: 'Triggered when channel is created' }
                        ],

                        // Automation
                        zapier: [
                          { id: 'zap_triggered', name: 'Zap Triggered', description: 'Triggered when Zap automation runs' },
                          { id: 'automation_complete', name: 'Automation Complete', description: 'Triggered when automation completes' },
                          { id: 'error_occurred', name: 'Error Occurred', description: 'Triggered when error occurs' }
                        ],
                        make: [
                          { id: 'scenario_executed', name: 'Scenario Executed', description: 'Triggered when scenario is executed' },
                          { id: 'operation_complete', name: 'Operation Complete', description: 'Triggered when operation completes' },
                          { id: 'error_occurred', name: 'Error Occurred', description: 'Triggered when error occurs' }
                        ],
                        ifttt: [
                          { id: 'applet_triggered', name: 'Applet Triggered', description: 'Triggered when applet runs' },
                          { id: 'action_completed', name: 'Action Completed', description: 'Triggered when action completes' },
                          { id: 'service_connected', name: 'Service Connected', description: 'Triggered when service is connected' }
                        ],

                        // Analytics
                        google_analytics: [
                          { id: 'goal_completed', name: 'Goal Completed', description: 'Triggered when goal is completed' },
                          { id: 'traffic_spike', name: 'Traffic Spike', description: 'Triggered when traffic increases significantly' },
                          { id: 'conversion_tracked', name: 'Conversion Tracked', description: 'Triggered when conversion is tracked' }
                        ],
                        mixpanel: [
                          { id: 'event_tracked', name: 'Event Tracked', description: 'Triggered when event is tracked' },
                          { id: 'funnel_completed', name: 'Funnel Completed', description: 'Triggered when funnel is completed' },
                          { id: 'cohort_updated', name: 'Cohort Updated', description: 'Triggered when cohort is updated' }
                        ],
                        amplitude: [
                          { id: 'event_ingested', name: 'Event Ingested', description: 'Triggered when event is ingested' },
                          { id: 'user_property_updated', name: 'User Property Updated', description: 'Triggered when user property is updated' },
                          { id: 'cohort_computed', name: 'Cohort Computed', description: 'Triggered when cohort is computed' }
                        ],

                        // Support
                        zendesk: [
                          { id: 'ticket_created', name: 'Ticket Created', description: 'Triggered when ticket is created' },
                          { id: 'ticket_updated', name: 'Ticket Updated', description: 'Triggered when ticket is updated' },
                          { id: 'user_created', name: 'User Created', description: 'Triggered when user is created' }
                        ],
                        freshdesk: [
                          { id: 'ticket_created', name: 'Ticket Created', description: 'Triggered when ticket is created' },
                          { id: 'ticket_resolved', name: 'Ticket Resolved', description: 'Triggered when ticket is resolved' },
                          { id: 'contact_created', name: 'Contact Created', description: 'Triggered when contact is created' }
                        ],
                        intercom: [
                          { id: 'conversation_created', name: 'Conversation Created', description: 'Triggered when conversation is created' },
                          { id: 'user_created', name: 'User Created', description: 'Triggered when user is created' },
                          { id: 'message_created', name: 'Message Created', description: 'Triggered when message is created' }
                        ],

                        // Email Marketing
                        mailchimp: [
                          { id: 'campaign_sent', name: 'Campaign Sent', description: 'Triggered when campaign is sent' },
                          { id: 'subscribe', name: 'Subscribe', description: 'Triggered when someone subscribes' },
                          { id: 'unsubscribe', name: 'Unsubscribe', description: 'Triggered when someone unsubscribes' }
                        ],
                        constant_contact: [
                          { id: 'contact_added', name: 'Contact Added', description: 'Triggered when contact is added' },
                          { id: 'campaign_sent', name: 'Campaign Sent', description: 'Triggered when campaign is sent' },
                          { id: 'bounce_received', name: 'Bounce Received', description: 'Triggered when email bounces' }
                        ],

                        // Social Media
                        twitter: [
                          { id: 'tweet_created', name: 'Tweet Created', description: 'Triggered when tweet is created' },
                          { id: 'mention_received', name: 'Mention Received', description: 'Triggered when mentioned' },
                          { id: 'follow_received', name: 'Follow Received', description: 'Triggered when followed' }
                        ],
                        facebook: [
                          { id: 'page_post', name: 'Page Post', description: 'Triggered when page posts' },
                          { id: 'message_received', name: 'Message Received', description: 'Triggered when message is received' },
                          { id: 'lead_generated', name: 'Lead Generated', description: 'Triggered when lead is generated' }
                        ],
                        instagram: [
                          { id: 'media_published', name: 'Media Published', description: 'Triggered when media is published' },
                          { id: 'comment_received', name: 'Comment Received', description: 'Triggered when comment is received' },
                          { id: 'mention_received', name: 'Mention Received', description: 'Triggered when mentioned' }
                        ],

                        // Project Management
                        trello: [
                          { id: 'card_created', name: 'Card Created', description: 'Triggered when card is created' },
                          { id: 'card_moved', name: 'Card Moved', description: 'Triggered when card is moved' },
                          { id: 'list_created', name: 'List Created', description: 'Triggered when list is created' }
                        ],
                        asana: [
                          { id: 'task_created', name: 'Task Created', description: 'Triggered when task is created' },
                          { id: 'project_created', name: 'Project Created', description: 'Triggered when project is created' },
                          { id: 'story_added', name: 'Story Added', description: 'Triggered when story is added' }
                        ],
                        monday: [
                          { id: 'item_created', name: 'Item Created', description: 'Triggered when item is created' },
                          { id: 'column_value_changed', name: 'Column Value Changed', description: 'Triggered when column value changes' },
                          { id: 'board_created', name: 'Board Created', description: 'Triggered when board is created' }
                        ],

                        // Cloud Storage
                        dropbox: [
                          { id: 'file_uploaded', name: 'File Uploaded', description: 'Triggered when file is uploaded' },
                          { id: 'folder_shared', name: 'Folder Shared', description: 'Triggered when folder is shared' },
                          { id: 'file_deleted', name: 'File Deleted', description: 'Triggered when file is deleted' }
                        ],
                        google_drive: [
                          { id: 'file_created', name: 'File Created', description: 'Triggered when file is created' },
                          { id: 'file_shared', name: 'File Shared', description: 'Triggered when file is shared' },
                          { id: 'folder_created', name: 'Folder Created', description: 'Triggered when folder is created' }
                        ]
                      };

                      const events = integrationEvents[step.config.integration as keyof typeof integrationEvents] || [];
                      
                      return (
                        <div className="space-y-3">
                          {events.map((webhook) => (
                            <div
                              key={webhook.id}
                              onClick={() => {
                                const webhookUrl = `https://api.stitchbyte.com/webhooks/${step.config.integration}/${webhook.id}`;
                                updateConfig({ 
                                  ...step.config, 
                                  webhook_event: webhook.id,
                                  webhook_url: webhookUrl,
                                  webhook_variables: []
                                });
                              }}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                step.config.webhook_event === webhook.id
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{webhook.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{webhook.description}</p>
                                  <div className="mt-2">
                                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                      {webhook.id}
                                    </span>
                                  </div>
                                </div>
                                {step.config.webhook_event === webhook.id && (
                                  <div className="flex-shrink-0 ml-3">
                                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Webhook URL Display */}
                {step.config.webhook_event && step.config.webhook_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <code className="text-sm text-gray-800 break-all">{step.config.webhook_url}</code>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Configure this URL in your {getIntegrationData(step.config.integration)?.name || step.config.integration} account to receive webhooks.
                    </p>
                  </div>
                )}
              </>
            )}

            {step.config.type === 'keyword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <textarea
                  rows={3}
                  defaultValue={Array.isArray(step.config.keywords) ? step.config.keywords.join(', ') : ''}
                  onBlur={(e) => {
                    const value = e.target.value;
                    // console.log('Keywords input changed on blur:', value);
                    
                    // Handle empty string
                    if (!value.trim()) {
                      updateConfig({ 
                        ...step.config, 
                        keywords: []
                      });
                      return;
                    }
                    
                    const keywords = value
                      .split(',')
                      .map((k: string) => k.trim())
                      .filter((k: string) => k.length > 0);
                    
                    // console.log('Parsed keywords on blur:', keywords);
                    
                    updateConfig({ 
                      ...step.config, 
                      keywords: keywords
                    });
                  }}
                  onKeyDown={(e) => {
                    // Also update on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.currentTarget.value;
                      const keywords = value
                        .split(',')
                        .map((k: string) => k.trim())
                        .filter((k: string) => k.length > 0);
                      
                      updateConfig({ 
                        ...step.config, 
                        keywords: keywords
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="hello, start, help, support"
                />
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Enter keywords separated by commas. Example: hello, start, help
                  </p>
                  {Array.isArray(step.config.keywords) && step.config.keywords.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Current keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {step.config.keywords.map((keyword: string, index: number) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            {/* Media Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Media Attachments (Images, Videos, Documents)
              </label>
              <div className="space-y-3">
                {step.config.attachments?.map((attachment: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{getAttachmentIcon(attachment.type || 'pdf')}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={attachment.name || ''}
                            onChange={(e) => {
                              const newAttachments = [...(step.config.attachments || [])];
                              newAttachments[index] = { ...attachment, name: e.target.value };
                              updateConfig({ ...step.config, attachments: newAttachments });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="File name (e.g., Product_Catalog.pdf)"
                          />
                          <select
                            value={attachment.type || 'image'}
                            onChange={(e) => {
                              const newAttachments = [...(step.config.attachments || [])];
                              newAttachments[index] = { ...attachment, type: e.target.value };
                              updateConfig({ ...step.config, attachments: newAttachments });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="audio">Audio</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept={
                              attachment.type === 'image' ? 'image/*' :
                              attachment.type === 'video' ? 'video/*' :
                              attachment.type === 'audio' ? 'audio/*' : '*'
                            }
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Upload to Cloudinary placeholder
                                // console.log('Uploading file:', file);
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('type', attachment.type);
                                
                                try {
                                  // TODO: Implement actual upload to backend
                                  const uploadUrl = `${API_BASE}/upload-media`;
                                  const response = await fetch(uploadUrl, {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  const result = await response.json();
                                  
                                  const newAttachments = [...(step.config.attachments || [])];
                                  newAttachments[index] = { 
                                    ...attachment, 
                                    url: result.url,
                                    cloudinary_id: result.public_id,
                                    file_size: result.bytes,
                                    name: attachment.name || file.name
                                  };
                                  updateConfig({ ...step.config, attachments: newAttachments });
                                } catch (error) {
                                  console.error('Upload failed:', error);
                                  alert('Upload failed. Please try again.');
                                }
                              }
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                          
                          <input
                            type="url"
                            value={attachment.url || ''}
                            onChange={(e) => {
                              const newAttachments = [...(step.config.attachments || [])];
                              newAttachments[index] = { ...attachment, url: e.target.value };
                              updateConfig({ ...step.config, attachments: newAttachments });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Or paste media URL"
                          />
                          
                          {attachment.url && (
                            <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                              ✅ <span>Media ready: {attachment.url}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newAttachments = step.config.attachments?.filter((_: any, i: number) => i !== index) || [];
                          updateConfig({ ...step.config, attachments: newAttachments });
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove media"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    const newAttachments = [...(step.config.attachments || []), { 
                      name: '', 
                      type: 'image', 
                      url: '' 
                    }];
                    updateConfig({ ...step.config, attachments: newAttachments });
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600"
                >
                  <MdAdd className="w-4 h-4" />
                  Add Media Attachment
                </button>
              </div>
            </div>

            {/* Message Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Text
              </label>
              <textarea
                value={step.config.message || ''}
                onChange={(e) => updateConfig({ ...step.config, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Hi {{name}}, Thank you for shopping with us. Would you like delivery updates?"
              />

              {/* Integration Variables Display */}
              {(() => {
                const triggerStep = flowSteps.find(s => s.type === 'trigger');
                if (triggerStep?.config.type === 'integration' && triggerStep.config.webhook_variables) {
                  return (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        🔗 Available Integration Variables
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {triggerStep.config.webhook_variables.map((variable: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => {
                              const currentMessage = step.config.message || '';
                              const variableTag = `{{${variable.name}}}`;
                              updateConfig({ 
                                ...step.config, 
                                message: currentMessage + variableTag 
                              });
                            }}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 text-left"
                            title={`${variable.description} (${variable.type})\nExample: ${variable.example}`}
                          >
                            {`{{${variable.name}}}`}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Click any variable to add it to your message. These come from your selected integration webhook.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => updateConfig({ 
                    ...step.config, 
                    message: "Hi {{name}}, Thank you for shopping with us.\nWould you like delivery updates?" 
                  })}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                >
                  📦 Delivery Template
                </button>
                <button
                  onClick={() => updateConfig({ 
                    ...step.config, 
                    message: "Hi {{name}}, Welcome to {{business}}!\nHow can we help you today?" 
                  })}
                  className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                >
                  👋 Welcome Template
                </button>
                <button
                  onClick={() => updateConfig({ 
                    ...step.config, 
                    message: "Thanks for your order #{{order_id}}!\nYour order is being processed." 
                  })}
                  className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100"
                >
                  🛍️ Order Template
                </button>
              </div>
            </div>
            
            {/* Interactive Buttons with WhatsApp Constraints */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    🔘 Interactive Buttons (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    WhatsApp constraint: Can't mix automation + URL buttons in one template
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newButtons = [
                        { text: 'Yes', type: 'automation', automation_id: '' },
                        { text: 'No', type: 'automation', automation_id: '' }
                      ];
                      updateConfig({ ...step.config, buttons: newButtons });
                    }}
                    className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                  >
                    ⚡ Yes/No
                  </button>
                  <button
                    onClick={() => {
                      const newButtons = [
                        { text: 'Visit Website', type: 'link', url: 'https://example.com' },
                        { text: 'Call Us', type: 'phone', phone: '+1234567890' }
                      ];
                      updateConfig({ ...step.config, buttons: newButtons });
                    }}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    🔗 CTA Buttons
                  </button>
                </div>
              </div>
              
              {/* Button Type Warning */}
              {(() => {
                const buttons = step.config.buttons || [];
                const automationButtons = buttons.filter((b: any) => b.type === 'automation');
                const ctaButtons = buttons.filter((b: any) => b.type === 'link' || b.type === 'phone');
                const violatesConstraint = automationButtons.length > 0 && ctaButtons.length > 0;
                
                return violatesConstraint && (
                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-orange-500">⚠️</span>
                      <div>
                        <p className="text-sm text-orange-800 font-medium">Mixed Button Types Detected</p>
                        <p className="text-xs text-orange-700 mt-1">
                          WhatsApp will send automation buttons in one message, URL/phone buttons in a separate template message.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {step.config.buttons?.map((button: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="space-y-3">
                    {/* Button Text & Type */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={button.text || ''}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { ...button, text: e.target.value };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Button text"
                      />
                      <select
                        value={button.type || 'link'}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          const newType = e.target.value;
                          newButtons[index] = { 
                            text: button.text,
                            type: newType,
                            ...(newType === 'link' ? { url: '' } : 
                                newType === 'phone' ? { phone: '' } : 
                                { automation_id: '' })
                          };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="automation">⚡ Automation</option>
                        <option value="link">🔗 URL Link</option>
                        <option value="phone">📞 Phone Call</option>
                      </select>
                      <button
                        onClick={() => {
                          const newButtons = step.config.buttons?.filter((_: any, i: number) => i !== index) || [];
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete button"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Button Configuration */}
                    {button.type === 'link' && (
                      <input
                        type="url"
                        value={button.url || ''}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { ...button, url: e.target.value };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="https://example.com"
                      />
                    )}
                    
                    {button.type === 'phone' && (
                      <input
                        type="tel"
                        value={button.phone || ''}
                        onChange={(e) => {
                          const newButtons = [...(step.config.buttons || [])];
                          newButtons[index] = { ...button, phone: e.target.value };
                          updateConfig({ ...step.config, buttons: newButtons });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="+1234567890"
                      />
                    )}

                    {button.type === 'automation' && (
                      <div className="text-xs text-gray-500 bg-green-50 p-2 rounded flex items-center gap-2">
                        ⚡ <span>Connect to next step using the blue connection dot →</span>
                      </div>
                    )}

                    {/* Button Preview */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Preview:</div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs border ${
                        button.type === 'link' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        button.type === 'phone' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {button.type === 'link' ? '🔗' : button.type === 'phone' ? '📞' : '⚡'} 
                        {button.text || 'Button'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newButtons = [...(step.config.buttons || []), { 
                    text: '', 
                    type: 'automation', 
                    automation_id: ''
                  }];
                  updateConfig({ ...step.config, buttons: newButtons });
                }}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600"
              >
                <MdAdd className="w-4 h-4" />
                Add Interactive Button
              </button>
            </div>
          </div>
        );

      case 'ai_response':
        return (
          <div className="space-y-6">
            {/* AI Model Configuration Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <MdSmartToy className="text-2xl text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">AI Response Configuration</h3>
              </div>
              <p className="text-sm text-gray-600">
                Configure your AI assistant to provide intelligent, context-aware responses using Gemini 2.0 Pro
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 System Prompt & Instructions
              </label>
              <textarea
                value={step.config.system_prompt || ''}
                onChange={(e) => updateConfig({ ...step.config, system_prompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-32 resize-none"
                placeholder="Define how the AI should behave. Example: You are a helpful customer service assistant for [Company Name]. Always be polite, professional, and helpful. Focus only on company-related queries and avoid technical discussions about backend systems."
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide clear instructions for the AI behavior and scope
              </p>
            </div>

            {/* Response Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎭 Response Tone
              </label>
              <select
                value={step.config.tone || 'professional'}
                onChange={(e) => updateConfig({ ...step.config, tone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="professional">Professional & Formal</option>
                <option value="friendly">Friendly & Approachable</option>
                <option value="casual">Casual & Relaxed</option>
                <option value="enthusiastic">Enthusiastic & Energetic</option>
                <option value="empathetic">Empathetic & Understanding</option>
                <option value="concise">Concise & Direct</option>
                <option value="detailed">Detailed & Thorough</option>
              </select>
            </div>

            {/* AI Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🌡️ Temperature ({step.config.temperature || 0.7})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={step.config.temperature || 0.7}
                  onChange={(e) => updateConfig({ ...step.config, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Max Response Length
                </label>
                <select
                  value={step.config.max_tokens || 150}
                  onChange={(e) => updateConfig({ ...step.config, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="50">Short (50 tokens)</option>
                  <option value="100">Medium (100 tokens)</option>
                  <option value="150">Standard (150 tokens)</option>
                  <option value="250">Long (250 tokens)</option>
                  <option value="400">Extended (400 tokens)</option>
                </select>
              </div>
            </div>

            {/* Trigger Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Trigger Keywords (Optional)
              </label>
              <input
                type="text"
                value={step.config.trigger_keywords || ''}
                onChange={(e) => updateConfig({ ...step.config, trigger_keywords: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="help, support, question, info (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                If specified, AI will only respond when message contains these keywords. Leave empty to respond to all messages.
              </p>
            </div>

            {/* Context Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Company Context & Knowledge Base
              </label>
              <textarea
                value={step.config.context_data || ''}
                onChange={(e) => updateConfig({ ...step.config, context_data: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
                placeholder="Add key company information: products, services, policies, FAQs, contact details, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide company-specific information to help AI give accurate responses
              </p>
            </div>

            {/* Security & Limitations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center gap-2">
                🔒 Security & Scope Restrictions
              </h4>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={step.config.scope_restrictions?.company_only !== false}
                    onChange={(e) => updateConfig({
                      ...step.config,
                      scope_restrictions: {
                        ...step.config.scope_restrictions,
                        company_only: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-yellow-800">
                    Only answer company-related questions
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={step.config.scope_restrictions?.no_technical_details !== false}
                    onChange={(e) => updateConfig({
                      ...step.config,
                      scope_restrictions: {
                        ...step.config.scope_restrictions,
                        no_technical_details: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-yellow-800">
                    Prevent sharing technical/backend details
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={step.config.scope_restrictions?.no_sensitive_info !== false}
                    onChange={(e) => updateConfig({
                      ...step.config,
                      scope_restrictions: {
                        ...step.config.scope_restrictions,
                        no_sensitive_info: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-yellow-800">
                    Block sensitive information sharing
                  </span>
                </label>
              </div>
            </div>

            {/* Fallback Response */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔄 Fallback Response
              </label>
              <textarea
                value={step.config.fallback_response || ''}
                onChange={(e) => updateConfig({ ...step.config, fallback_response: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                placeholder="I'm sorry, I can only help with questions related to our company and services. Please contact our support team for other inquiries."
              />
              <p className="text-xs text-gray-500 mt-1">
                Message sent when AI cannot or should not respond to the query
              </p>
            </div>

            {/* Rate Limiting */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏱️ Rate Limit (per hour)
                </label>
                <select
                  value={step.config.rate_limit?.per_hour || 10}
                  onChange={(e) => updateConfig({
                    ...step.config,
                    rate_limit: {
                      ...step.config.rate_limit,
                      per_hour: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="5">5 responses/hour</option>
                  <option value="10">10 responses/hour</option>
                  <option value="20">20 responses/hour</option>
                  <option value="50">50 responses/hour</option>
                  <option value="100">100 responses/hour</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Daily Limit
                </label>
                <select
                  value={step.config.rate_limit?.per_day || 50}
                  onChange={(e) => updateConfig({
                    ...step.config,
                    rate_limit: {
                      ...step.config.rate_limit,
                      per_day: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="25">25 responses/day</option>
                  <option value="50">50 responses/day</option>
                  <option value="100">100 responses/day</option>
                  <option value="200">200 responses/day</option>
                  <option value="500">500 responses/day</option>
                </select>
              </div>
            </div>

            {/* Rate Limit Exceeded Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚫 Rate Limit Exceeded Message
              </label>
              <input
                type="text"
                value={step.config.rate_limit_message || ''}
                onChange={(e) => updateConfig({
                  ...step.config,
                  rate_limit_message: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Our AI assistant has reached its daily limit. Please contact our human support team."
              />
            </div>

            {/* Test AI Response */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                🧪 Test AI Response
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-green-700 mb-1">Test Message:</label>
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm"
                    placeholder="Hello, I have a question about your services"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleTestAIResponse}
                    disabled={isTestingAI || !testMessage.trim()}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isTestingAI ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <MdPlayArrow />
                        Test Response
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isTestingConnection ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        🔗
                        Test Connection
                      </>
                    )}
                  </button>
                </div>
                
                {testResult && (
                  <div className={`p-3 rounded-lg text-sm ${
                    testResult.success 
                      ? 'bg-green-100 border border-green-300 text-green-800'
                      : 'bg-red-100 border border-red-300 text-red-800'
                  }`}>
                    <div className="font-medium mb-1">
                      {testResult.success ? '✅ Success' : '❌ Error'}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {testResult.response || testResult.error}
                    </div>
                    {testResult.usage && (
                      <div className="text-xs mt-2 opacity-75">
                        Tokens used: {testResult.usage.totalTokens} (prompt: {testResult.usage.promptTokens}, completion: {testResult.usage.completionTokens})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                👁️ Configuration Preview
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Model:</strong> Gemini 2.0 Flash</p>
                <p><strong>Tone:</strong> {step.config.tone || 'professional'}</p>
                <p><strong>Temperature:</strong> {step.config.temperature || 0.7} (0=precise, 1=creative)</p>
                <p><strong>Max Length:</strong> {step.config.max_tokens || 150} tokens</p>
                <p><strong>Security:</strong> {step.config.scope_restrictions?.company_only !== false ? '✓' : '✗'} Company-only responses</p>
                <p><strong>Rate Limit:</strong> {step.config.rate_limit?.per_hour || 10}/hr, {step.config.rate_limit?.per_day || 50}/day</p>
                {step.config.trigger_keywords && (
                  <p><strong>Triggers:</strong> {step.config.trigger_keywords}</p>
                )}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
                ℹ️ How AI Response Works
              </h4>
              <div className="text-xs text-gray-600 space-y-2">
                <p>1. <strong>Message Received:</strong> When a customer sends a message</p>
                <p>2. <strong>Keyword Check:</strong> If trigger keywords are set, message must contain them</p>
                <p>3. <strong>Rate Limit Check:</strong> Ensures user hasn't exceeded hourly/daily limits</p>
                <p>4. <strong>AI Generation:</strong> Gemini 2.0 Flash generates response using your configuration</p>
                <p>5. <strong>Security Filter:</strong> Response is filtered for sensitive content and scope compliance</p>
                <p>6. <strong>Response Sent:</strong> Filtered response is sent back to customer</p>
              </div>
            </div>
          </div>
        );

      // Add other step type configurations here...
      default:
        return (
          <div className="text-sm text-gray-500">
            Configuration for {step.type} step type coming soon...
          </div>
        );
    }
  };
  
  // AI testing handlers
  const handleTestAIResponse = async () => {
    if (!testMessage.trim()) return;
    
    setIsTestingAI(true);
    setTestResult(null);
    
    try {
      const selectedStep = flowSteps.find(step => step.id === selectedStepId);
      if (!selectedStep || selectedStep.type !== 'ai_response') {
        throw new Error('No AI response step selected');
      }
      
      const result = await aiService.previewAIResponse(testMessage, selectedStep.config);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsTestingAI(false);
    }
  };
  
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      const result = await aiService.testConnection();
      setTestResult({
        success: result.success,
        response: result.message
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Find the trigger step to extract trigger configuration
      const triggerStep = flowSteps.find(step => step.type === 'trigger');
      
      const automationData = {
        name: formData.name || 'New Automation',
        description: formData.description || '',
        trigger_type: triggerStep?.config.type || 'keyword',
        trigger_config: triggerStep?.config || {},
        workflow: flowSteps,
        connections: connections,
        status: formData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // console.log('Saving automation:', automationData);
      
      // Save to backend via apiService
      const result = await apiService.createAutomation(automationData);
      // console.log('Automation saved successfully:', result);
      
      // Show success message and redirect
      alert('Automation saved successfully!');
      router.push('/automations');
      
    } catch (error) {
      console.error('Error saving automation:', error);
      alert(`Error saving automation: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/automations')}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <MdArrowBack className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dynamic Automation Builder</h1>
                <p className="text-gray-600 mt-1">Create custom workflows with unlimited steps and connections</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('builder')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'builder' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Builder
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === 'preview' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MdVisibility className="w-4 h-4" />
                  Live Preview
                </button>
              </div>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <MdSave className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Automation'}
              </button>
            </div>
          </div>
          
          {/* Automation Details */}
          <div className="mt-4 flex items-center gap-4">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-lg font-semibold bg-transparent border-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
              placeholder="Automation name..."
            />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-gray-600 bg-transparent border-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 flex-1"
              placeholder="Add description..."
            />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Sidebar - Step Library */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Add Steps</h3>
          <div className="space-y-2">
            {stepTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => addStep(template.type as FlowStepType)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors text-left"
                >
                  <div className={`w-8 h-8 ${template.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{template.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden">
            {activeTab === 'builder' ? (
              <div
                ref={canvasRef}
                className="w-full h-full bg-gray-100 relative cursor-move"
                style={{
                  backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              >
                {/* Canvas Controls */}
                <div className="absolute top-4 right-4 z-30 flex gap-2">
                  <button
                    onClick={() => setCanvasZoom(Math.min(canvasZoom + 0.1, 2))}
                    className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50"
                  >
                    <MdZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCanvasZoom(Math.max(canvasZoom - 0.1, 0.5))}
                    className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50"
                  >
                    <MdZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCanvasZoom(1);
                      setCanvasPosition({ x: 0, y: 0 });
                    }}
                    className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50"
                  >
                    <MdCenterFocusStrong className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Connection Lines */}
                {renderConnections()}
                
                {/* Flow Steps */}
                {flowSteps.map(renderStep)}
                
                {/* Connection Helper */}
                {connectingFrom && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                    <MdArrowForward className="w-4 h-4" />
                    <span>
                      Click on the left dot of another step to connect from 
                      {connectingFromButton !== null 
                        ? ` button "${flowSteps.find(s => s.id === connectingFrom)?.config.buttons?.[connectingFromButton]?.text || 'Unnamed'}" of "${flowSteps.find(s => s.id === connectingFrom)?.title}"`
                        : ` "${flowSteps.find(s => s.id === connectingFrom)?.title}"`
                      }
                    </span>
                    <button
                      onClick={() => {
                        setIsConnecting(false);
                        setConnectingFrom(null);
                        setConnectingFromButton(null);
                      }}
                      className="ml-2 text-yellow-800 hover:text-yellow-900"
                    >
                      <MdClose className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center p-6">
                <div className="flex-shrink-0">
                  <WhatsAppPreview
                    flowSteps={flowSteps}
                    isTestMode={true}
                    companyName={formData.name || "Your Company"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Step Configuration */}
          {selectedStepId && (
            <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-auto relative z-[100] shadow-xl">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Configure Step</h3>
                  <button
                    onClick={() => setSelectedStepId(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                    title="Close configuration panel"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                </div>
                {(() => {
                  const selectedStep = flowSteps.find(s => s.id === selectedStepId);
                  if (!selectedStep) return null;
                  
                  return (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Step Title
                        </label>
                        <input
                          type="text"
                          value={selectedStep.title}
                          onChange={(e) => updateStep(selectedStepId, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter step title..."
                        />
                      </div>
                      
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        Step type: <span className="font-medium">{selectedStep.type}</span>
                      </div>
                      
                      {/* Step-specific configuration forms */}
                      {renderStepConfigForm(selectedStep)}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
