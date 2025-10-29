"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import apiService from '../../services/apiService';
import {
  MdArrowBack,
  MdBolt,
  MdCloudQueue,
  MdCheckCircle,
  MdAccessTime,
  MdRefresh,
  MdSave,
  MdInsights,
  MdHistory,
  MdAutoFixHigh,
  MdSwapCalls,
  MdFeedback
} from 'react-icons/md';

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface AiFollowUpSettings {
  is_enabled: boolean;
  max_followups: number;
  delay_strategy: 'static' | 'adaptive';
  ai_confidence_threshold: number;
  reactivation_interval: number;
  preferred_channel_order: string[];
  require_human_review: boolean;
  quiet_hours: QuietHours;
  persona?: string;
}

interface AiFollowUpStats {
  pending: number;
  sent: number;
  last_sent_at?: string | null;
}

interface AnalysisResult {
  intent?: string;
  confidence?: number;
  engagement_score?: number;
  sentiment?: string;
  urgency?: string;
  key_points?: string[];
  recommended_channels?: string[];
  model?: string;
}

interface PreviewResult {
  model: string;
  message: string;
  response_probability?: number | null;
  tone_detected?: string | null;
}

interface AiFollowUpQueueItemMetadata extends Record<string, unknown> {
  analysis?: AnalysisResult;
  channel_preferences?: string[];
  preview_model?: string;
  tone_detected?: string | null;
}

interface AiFollowUpQueueItem {
  _id: string;
  channel: string;
  message: string;
  status: string;
  followup_type?: string;
  ai_confidence?: number;
  scheduled_time?: string;
  contact_name?: string;
  contact_id?: string;
  updated_at?: string;
  intent?: string;
  channel_history?: string[];
  metadata?: AiFollowUpQueueItemMetadata;
  thread_id?: string;
  last_interaction_at?: string;
  analysis?: AnalysisResult;
}

interface PreviewFormState {
  channel: string;
  goal: string;
  brandVoice: string;
  conversationHistory: string;
  contactName: string;
  engagementScore: number;
  persona: string;
}

interface ScheduleFormState {
  contactId: string;
  contactName: string;
  channel: string;
  scheduledTime: string;
  threadId: string;
  timezone: string;
  lastInteractionAt: string;
}

interface ContextMessage {
  role: string;
  text: string;
  timestamp?: string;
  source?: string;
}

interface FlowBlueprintMetadata extends Record<string, unknown> {
  notes?: string;
}

interface FlowBlueprint {
  _id?: string;
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
  metadata?: FlowBlueprintMetadata;
  created_at?: string;
  updated_at?: string;
}

interface AiFollowUpStatusResponse {
  settings?: (Partial<AiFollowUpSettings> & {
    quiet_hours?: Partial<QuietHours>;
    preferred_channel_order?: unknown;
  }) | null;
  stats?: AiFollowUpStats | null;
  queue?: AiFollowUpQueueItem[] | null;
}

interface AiFollowUpScheduleResponse {
  followup: AiFollowUpQueueItem;
}

interface AiFollowUpSmartScheduleResponse extends AiFollowUpScheduleResponse {
  preview?: PreviewResult;
  analysis?: AnalysisResult;
}

interface AiFollowUpContextResponse {
  messages?: ContextMessage[];
}

type FlowBlueprintSaveResponse = FlowBlueprint | { blueprint?: FlowBlueprint | null };

type ConversationTurn = {
  role: 'user' | 'assistant';
  text: string;
};

const DEFAULT_SETTINGS: AiFollowUpSettings = {
  is_enabled: false,
  max_followups: 5,
  delay_strategy: 'adaptive',
  ai_confidence_threshold: 0.75,
  reactivation_interval: 7,
  preferred_channel_order: ['whatsapp', 'email', 'instagram'],
  require_human_review: false,
  quiet_hours: {
    enabled: true,
    start: '21:00',
    end: '08:00'
  },
  persona: 'sales_agent'
};

const DEFAULT_STATS: AiFollowUpStats = {
  pending: 0,
  sent: 0,
  last_sent_at: null
};

const toTitleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const sanitizeChannelOrder = (input: string) =>
  input
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const resolveFlowBlueprint = (payload: FlowBlueprintSaveResponse | null | undefined): FlowBlueprint | null => {
  if (!payload) {
    return null;
  }
  if ('blueprint' in payload) {
    return payload.blueprint ?? null;
  }
  return payload as FlowBlueprint;
};

const AiFollowUpAutomationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [settings, setSettings] = useState<AiFollowUpSettings>(DEFAULT_SETTINGS);
  const [channelInput, setChannelInput] = useState('WhatsApp, Email, Instagram');
  const [stats, setStats] = useState<AiFollowUpStats>(DEFAULT_STATS);
  const [queue, setQueue] = useState<AiFollowUpQueueItem[]>([]);
  const [previewForm, setPreviewForm] = useState<PreviewFormState>({
    channel: 'whatsapp',
    goal: 'Get a reply',
    brandVoice: 'Friendly Stitchbyte tone with helpful intent',
    conversationHistory: '',
    contactName: '',
    engagementScore: 60,
    persona: 'sales_agent'
  });
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>({
    contactId: '',
    contactName: '',
    channel: 'whatsapp',
    scheduledTime: '',
    threadId: '',
    timezone: '',
    lastInteractionAt: ''
  });
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextMessages, setContextMessages] = useState<ContextMessage[]>([]);
  const [flowBlueprint, setFlowBlueprint] = useState<FlowBlueprint | null>(null);
  const [flowNotes, setFlowNotes] = useState('');
  const [flowLoading, setFlowLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearAlerts = useCallback(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  const buildConversationHistory = useCallback((): ConversationTurn[] => {
    return previewForm.conversationHistory
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [rolePart, ...messageParts] = line.split(':');
        if (messageParts.length === 0) {
          return { role: 'user', text: line } satisfies ConversationTurn;
        }
        const roleCandidate = rolePart.toLowerCase();
        const role = roleCandidate.includes('agent') || roleCandidate.includes('assistant') ? 'assistant' : 'user';
        return {
          role,
          text: messageParts.join(':').trim()
        } satisfies ConversationTurn;
      });
  }, [previewForm.conversationHistory]);

  const hydrateState = useCallback((data?: AiFollowUpStatusResponse | null) => {
    if (!data || typeof data !== 'object') {
      return;
    }

    const { settings: settingsData, stats: statsData, queue: queueData } = data;
    if (!settingsData) {
      return;
    }

    const preferredCandidate = Array.isArray(settingsData.preferred_channel_order)
      ? settingsData.preferred_channel_order.filter((channel): channel is string => typeof channel === 'string')
      : [];
    const preferredChannels = preferredCandidate.length ? preferredCandidate : DEFAULT_SETTINGS.preferred_channel_order;
    const quiet = settingsData.quiet_hours;

    const incoming: AiFollowUpSettings = {
      is_enabled: Boolean(settingsData.is_enabled),
      max_followups: Number(settingsData.max_followups ?? DEFAULT_SETTINGS.max_followups),
      delay_strategy: settingsData.delay_strategy === 'static' ? 'static' : 'adaptive',
      ai_confidence_threshold: Number(
        settingsData.ai_confidence_threshold ?? DEFAULT_SETTINGS.ai_confidence_threshold
      ),
      reactivation_interval: Number(
        settingsData.reactivation_interval ?? DEFAULT_SETTINGS.reactivation_interval
      ),
      preferred_channel_order: preferredChannels,
      require_human_review: Boolean(settingsData.require_human_review),
      quiet_hours: {
        enabled: Boolean(quiet?.enabled ?? DEFAULT_SETTINGS.quiet_hours.enabled),
        start: String(quiet?.start ?? DEFAULT_SETTINGS.quiet_hours.start).slice(0, 5),
        end: String(quiet?.end ?? DEFAULT_SETTINGS.quiet_hours.end).slice(0, 5)
      },
      persona: (settingsData.persona as string | undefined) || DEFAULT_SETTINGS.persona
    };

    setSettings(incoming);
    setChannelInput(incoming.preferred_channel_order.map(toTitleCase).join(', '));
    setStats(statsData ?? DEFAULT_STATS);
    setQueue(Array.isArray(queueData) ? queueData : []);
    setScheduleForm((prev) => ({ ...prev, channel: incoming.preferred_channel_order[0] ?? 'whatsapp' }));
  }, []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    clearAlerts();
    try {
      const data = await apiService.getAiFollowUpStatus<AiFollowUpStatusResponse>();
      hydrateState(data);
    } catch (error) {
      console.error('Failed to load AI follow-up status:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load AI follow-up data');
    } finally {
      setLoading(false);
    }
  }, [clearAlerts, hydrateState]);

  const loadFlowBlueprint = useCallback(async () => {
    setFlowLoading(true);
    try {
      const blueprint = await apiService.getAiFollowUpFlow<FlowBlueprint>();
      setFlowBlueprint(blueprint);
      const notes = blueprint?.metadata?.notes;
      setFlowNotes(typeof notes === 'string' ? notes : '');
    } catch (error) {
      console.error('Failed to load AI follow-up blueprint:', error);
      setErrorMessage((prev) => prev ?? (error instanceof Error ? error.message : 'Unable to load AI blueprint'));
    } finally {
      setFlowLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadFlowBlueprint();
  }, [loadStatus, loadFlowBlueprint]);

  const handleSettingChange = <K extends keyof AiFollowUpSettings>(key: K, value: AiFollowUpSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuietHoursChange = <K extends keyof QuietHours>(key: K, value: QuietHours[K]) => {
    setSettings((prev) => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [key]: value
      }
    }));
  };

  const saveSettings = async (partial: Partial<AiFollowUpSettings> = {}) => {
    clearAlerts();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        ...partial,
        preferred_channel_order: sanitizeChannelOrder(channelInput),
        quiet_hours: settings.quiet_hours,
        persona: settings.persona
      };

  const response = await apiService.updateAiFollowUpSettings<AiFollowUpStatusResponse>(payload);
      hydrateState(response);
      setSuccessMessage('AI follow-up settings updated');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleAutomation = async () => {
    await saveSettings({ is_enabled: !settings.is_enabled });
  };

  const refreshQueue = async () => {
    setQueueLoading(true);
    try {
  const data = await apiService.getAiFollowUpStatus<AiFollowUpStatusResponse>();
      hydrateState(data);
    } catch (error) {
      console.error('Failed to refresh queue:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to refresh queue');
    } finally {
      setQueueLoading(false);
    }
  };

  const handlePreview = async () => {
    clearAlerts();
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const conversationHistory = buildConversationHistory();

      const response = await apiService.previewAiFollowUp<PreviewResult>({
        channel: previewForm.channel.toLowerCase(),
        goal: previewForm.goal,
        brand_voice: previewForm.brandVoice,
        conversation_history: conversationHistory,
        contact_name: previewForm.contactName,
        engagement_score: previewForm.engagementScore,
        persona: previewForm.persona,
        contact_id: scheduleForm.contactId || undefined,
        thread_id: scheduleForm.threadId || undefined,
        analysis: analysisResult || undefined
      });

  setPreviewResult(response);
      setScheduleForm((prev) => ({
        ...prev,
        channel: previewForm.channel,
        contactName: previewForm.contactName
      }));
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!previewResult) {
      setErrorMessage('Generate an AI message before scheduling.');
      return;
    }
    if (!scheduleForm.contactId) {
      setErrorMessage('Contact ID is required to queue a follow-up.');
      return;
    }

    clearAlerts();
    setQueueLoading(true);
    try {
      const response = await apiService.scheduleAiFollowUp<AiFollowUpScheduleResponse>({
        contact_id: scheduleForm.contactId,
        contact_name: scheduleForm.contactName || undefined,
        channel: scheduleForm.channel.toLowerCase(),
        message: previewResult.message,
        goal: previewForm.goal,
        followup_type: 'ai_followup',
        ai_confidence: previewResult.response_probability,
        engagement_score: previewForm.engagementScore,
        scheduled_time: scheduleForm.scheduledTime || undefined,
        metadata: {
          preview_model: previewResult.model,
          tone_detected: previewResult.tone_detected,
          analysis: analysisResult || undefined,
          channel_preferences: sanitizeChannelOrder(channelInput)
        },
        thread_id: scheduleForm.threadId || undefined,
        channel_history: analysisResult?.recommended_channels
          ? Array.from(new Set([scheduleForm.channel.toLowerCase(), ...analysisResult.recommended_channels]))
          : undefined,
        intent: analysisResult?.intent,
        last_interaction_at: scheduleForm.lastInteractionAt || undefined,
        timezone: scheduleForm.timezone || undefined
      });

      setSuccessMessage('Follow-up queued successfully.');
      setQueue((prev) => [response.followup, ...prev]);
      setScheduleForm((prev) => ({
        contactId: '',
        contactName: '',
        channel: previewForm.channel,
        scheduledTime: '',
        threadId: prev.threadId,
        timezone: prev.timezone,
        lastInteractionAt: prev.lastInteractionAt
      }));
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to schedule follow-up');
    } finally {
      setQueueLoading(false);
    }
  };

  const handleAnalyze = async () => {
    clearAlerts();
    setAnalysisLoading(true);
    try {
      const conversationHistory = buildConversationHistory();
      const payload = {
        channel: previewForm.channel.toLowerCase(),
        channel_preferences: sanitizeChannelOrder(channelInput),
        conversation_history: conversationHistory,
        contact_id: scheduleForm.contactId || undefined,
        thread_id: scheduleForm.threadId || undefined,
        engagement_score: previewForm.engagementScore || undefined
      };
      const result = await apiService.analyzeAiFollowUp<AnalysisResult>(payload);
      setAnalysisResult(result);
      const recommendedChannel = result.recommended_channels?.[0];
      if (typeof result.engagement_score === 'number') {
        const roundedScore = Math.round(result.engagement_score);
        setPreviewForm((prev) => ({
          ...prev,
          engagementScore: roundedScore,
          channel: recommendedChannel || prev.channel
        }));
        setScheduleForm((prev) => ({
          ...prev,
          channel: recommendedChannel || prev.channel
        }));
      } else if (recommendedChannel) {
        setPreviewForm((prev) => ({ ...prev, channel: recommendedChannel }));
        setScheduleForm((prev) => ({ ...prev, channel: recommendedChannel }));
      }
      setSuccessMessage('Conversation analyzed successfully.');
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to analyze conversation');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleLoadContext = async () => {
    if (!scheduleForm.contactId || !scheduleForm.threadId) {
      setErrorMessage('Contact ID and thread ID are required to load context.');
      return;
    }
    clearAlerts();
    setContextLoading(true);
    try {
      const response = await apiService.getAiFollowUpContext<AiFollowUpContextResponse>(
        scheduleForm.contactId,
        scheduleForm.threadId,
        40
      );
      const messages: ContextMessage[] = Array.isArray(response?.messages) ? response.messages : [];
      setContextMessages(messages);
      if (messages.length) {
        const historyText = messages
          .map((message) => `${toTitleCase(message.role || 'agent')}: ${message.text}`)
          .join('\n');
        setPreviewForm((prev) => ({ ...prev, conversationHistory: historyText }));
      }
      setSuccessMessage('Conversation context loaded.');
    } catch (error) {
      console.error('Failed to load context:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load conversation context');
    } finally {
      setContextLoading(false);
    }
  };

  const handleSaveContext = async () => {
    if (!scheduleForm.contactId || !scheduleForm.threadId) {
      setErrorMessage('Contact ID and thread ID are required to store context.');
      return;
    }
    clearAlerts();
    setContextLoading(true);
    try {
      const conversationHistory = buildConversationHistory();
      const messages = conversationHistory.map((turn) => ({
        role: turn.role,
        text: turn.text,
        timestamp: new Date().toISOString(),
        source: 'dashboard'
      }));
      await apiService.upsertAiFollowUpContext<void>({
        contact_id: scheduleForm.contactId,
        thread_id: scheduleForm.threadId,
        messages
      });
      setSuccessMessage('Conversation memory updated.');
    } catch (error) {
      console.error('Failed to save context:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to store context');
    } finally {
      setContextLoading(false);
    }
  };

  const handleSmartSchedule = async () => {
    if (!scheduleForm.contactId) {
      setErrorMessage('Contact ID is required to queue a smart follow-up.');
      return;
    }
    clearAlerts();
    setQueueLoading(true);
    try {
      const conversationHistory = buildConversationHistory();
      const payload = {
        contact_id: scheduleForm.contactId,
        contact_name: scheduleForm.contactName || undefined,
        channel_preferences: sanitizeChannelOrder(channelInput),
        conversation_history: conversationHistory,
        goal: previewForm.goal,
        persona: previewForm.persona,
        brand_voice: previewForm.brandVoice,
        thread_id: scheduleForm.threadId || undefined,
        last_interaction_at: scheduleForm.lastInteractionAt || undefined,
        timezone: scheduleForm.timezone || undefined,
        followup_type: 'ai_followup',
        metadata: previewResult
          ? {
              preview_model: previewResult.model,
              tone_detected: previewResult.tone_detected
            }
          : {}
      };

      const response = await apiService.smartScheduleAiFollowUp<AiFollowUpSmartScheduleResponse>(payload);
      if (response.analysis) {
        setAnalysisResult(response.analysis);
      }
      if (response.preview) {
        setPreviewResult(response.preview);
      }
      setQueue((prev) => [response.followup, ...prev]);
      setSuccessMessage('Smart follow-up queued with adaptive timing.');
    } catch (error) {
      console.error('Failed to smart schedule follow-up:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to smart schedule follow-up');
    } finally {
      setQueueLoading(false);
    }
  };

  const handleFailover = async (item: AiFollowUpQueueItem) => {
    const fallbackInput = window.prompt(
      'Enter fallback channels (comma separated priority order).',
      sanitizeChannelOrder(channelInput).join(', ')
    );
    if (!fallbackInput) {
      return;
    }
    const reason = window.prompt('Why trigger failover?', 'no_whatsapp_delivery');
    if (!reason) {
      return;
    }
    clearAlerts();
    setQueueLoading(true);
    try {
      const fallback_channels = fallbackInput
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
      const response = await apiService.triggerAiFollowUpFailover<AiFollowUpScheduleResponse>({
        queue_id: item._id,
        fallback_channels,
        reason
      });
      setQueue((prev) => prev.map((queueItem) => (queueItem._id === item._id ? response.followup : queueItem)));
      setSuccessMessage('Channel failover triggered.');
    } catch (error) {
      console.error('Failed to trigger failover:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to execute channel failover');
    } finally {
      setQueueLoading(false);
    }
  };

  const handleFeedback = async (item: AiFollowUpQueueItem) => {
    const outcome = window.prompt('Outcome (e.g. won, lost, no_response):', 'won');
    if (!outcome) {
      return;
    }
    const ratingInput = window.prompt('Rating 1-5 (optional):', '5');
    const rating = ratingInput ? Number(ratingInput) : undefined;
    const notes = window.prompt('Notes for this follow-up (optional):') || undefined;
    clearAlerts();
    setQueueLoading(true);
    try {
      await apiService.recordAiFollowUpFeedback<void>({
        queue_id: item._id,
        outcome,
        rating: Number.isFinite(rating) ? rating : undefined,
        notes
      });
      setSuccessMessage('Feedback captured.');
    } catch (error) {
      console.error('Failed to record feedback:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to capture feedback');
    } finally {
      setQueueLoading(false);
    }
  };

  const handleSaveFlowNotes = async () => {
    if (!flowBlueprint) {
      return;
    }
    clearAlerts();
    setFlowLoading(true);
    try {
      const payload = {
        nodes: flowBlueprint.nodes || [],
        edges: flowBlueprint.edges || [],
        metadata: {
          ...(flowBlueprint.metadata || {}),
          notes: flowNotes
        }
      };
  const result = await apiService.saveAiFollowUpFlow<FlowBlueprintSaveResponse>(payload);
  const blueprintCandidate = resolveFlowBlueprint(result);
      if (blueprintCandidate) {
        setFlowBlueprint(blueprintCandidate);
        setFlowNotes((prev) =>
          typeof blueprintCandidate.metadata?.notes === 'string' ? blueprintCandidate.metadata.notes : prev
        );
      }
      setSuccessMessage('Flow blueprint notes saved.');
    } catch (error) {
      console.error('Failed to save blueprint notes:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save flow blueprint notes');
    } finally {
      setFlowLoading(false);
    }
  };

  const statusBadge = useMemo(() => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    return settings.is_enabled
      ? `${baseClasses} bg-emerald-100 text-emerald-700`
      : `${baseClasses} bg-gray-200 text-gray-700`;
  }, [settings.is_enabled]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <p className="inline-flex items-center text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                <MdBolt className="mr-2" /> AI Follow-Up Engine
              </p>
              <h1 className="text-3xl font-bold text-gray-900">AI Follow-Up Automation</h1>
              <p className="text-gray-600 max-w-2xl">
                Activate adaptive follow-ups across WhatsApp, Email, and Instagram. Configure strategy, preview Gemini-generated outreach, and manage the unified queue from one dashboard.
              </p>
              <span className={statusBadge}>
                {settings.is_enabled ? 'Automation active' : 'Automation paused'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadStatus}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                disabled={loading}
              >
                <MdRefresh />
                Refresh
              </button>
              <Link
                href="/automations"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <MdArrowBack className="mr-2" /> Back to Automations
              </Link>
            </div>
          </header>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              {successMessage}
            </div>
          )}

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Activation</h2>
                <p className="text-gray-600">Toggle the AI follow-up engine for your workspace.</p>
              </div>
              <button
                onClick={toggleAutomation}
                disabled={saving}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white ${
                  settings.is_enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {settings.is_enabled ? 'Pause Automation' : 'Activate Automation'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Pending Follow-Ups</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Sent Follow-Ups</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.sent}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Last Sent</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(stats.last_sent_at)}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Intelligence Settings</h2>
              <button
                onClick={() => saveSettings()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <MdSave /> Save Settings
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Max follow-ups per contact</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.max_followups}
                    onChange={(event) => handleSettingChange('max_followups', Number(event.target.value))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Delay strategy</span>
                  <select
                    value={settings.delay_strategy}
                    onChange={(event) => handleSettingChange('delay_strategy', event.target.value as 'static' | 'adaptive')}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="adaptive">Adaptive (engagement-aware)</option>
                    <option value="static">Static cadence</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">AI confidence threshold</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.ai_confidence_threshold}
                    onChange={(event) => handleSettingChange('ai_confidence_threshold', Number(event.target.value))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Reactivation interval (days)</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.reactivation_interval}
                    onChange={(event) => handleSettingChange('reactivation_interval', Number(event.target.value))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Preferred channel order</span>
                  <input
                    type="text"
                    value={channelInput}
                    onChange={(event) => setChannelInput(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="WhatsApp, Email, Instagram"
                  />
                  <p className="mt-1 text-xs text-gray-500">Comma separated list, highest priority first.</p>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.require_human_review}
                    onChange={(event) => handleSettingChange('require_human_review', event.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">Require human review before sending</span>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Persona</span>
                  <select
                    value={settings.persona || 'sales_agent'}
                    onChange={(event) => handleSettingChange('persona', event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="sales_agent">Sales agent</option>
                    <option value="support_agent">Support agent</option>
                    <option value="founder_tone">Founder tone</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.quiet_hours.enabled}
                  onChange={(event) => handleQuietHoursChange('enabled', event.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">Smart quiet hours</span>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Quiet hours start</span>
                <input
                  type="time"
                  value={settings.quiet_hours.start}
                  onChange={(event) => handleQuietHoursChange('start', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Quiet hours end</span>
                <input
                  type="time"
                  value={settings.quiet_hours.end}
                  onChange={(event) => handleQuietHoursChange('end', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-gray-900">AI Message Preview</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={analysisLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <MdInsights />
                  {analysisLoading ? 'Analyzing...' : 'Analyze Conversation'}
                </button>
                <button
                  onClick={handleLoadContext}
                  disabled={contextLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  <MdHistory />
                  {contextLoading ? 'Loading context...' : 'Load Context'}
                </button>
                <button
                  onClick={handleSaveContext}
                  disabled={contextLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <MdSave />
                  Save to Memory
                </button>
                <button
                  onClick={handlePreview}
                  disabled={previewLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                  <MdBolt />
                  {previewLoading ? 'Generating...' : 'Generate with Gemini'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Channel</span>
                  <select
                    value={previewForm.channel}
                    onChange={(event) => setPreviewForm((prev) => ({ ...prev, channel: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    {sanitizeChannelOrder(channelInput).map((channel) => (
                      <option key={channel} value={channel}>
                        {toTitleCase(channel)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Goal</span>
                  <input
                    type="text"
                    value={previewForm.goal}
                    onChange={(event) => setPreviewForm((prev) => ({ ...prev, goal: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Brand voice</span>
                  <input
                    type="text"
                    value={previewForm.brandVoice}
                    onChange={(event) => setPreviewForm((prev) => ({ ...prev, brandVoice: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Persona</span>
                  <select
                    value={previewForm.persona}
                    onChange={(event) => setPreviewForm((prev) => ({ ...prev, persona: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="sales_agent">Sales agent</option>
                    <option value="support_agent">Support agent</option>
                    <option value="founder_tone">Founder tone</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Engagement score (0-100)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={previewForm.engagementScore}
                    onChange={(event) => setPreviewForm((prev) => ({ ...prev, engagementScore: Number(event.target.value) }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Contact name (optional)</span>
                  <input
                    type="text"
                    value={previewForm.contactName}
                    onChange={(event) => setPreviewForm((prev) => ({ ...prev, contactName: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Conversation history</span>
                  <textarea
                    value={previewForm.conversationHistory}
                    onChange={(event) => setPreviewForm((prev) => ({ ...prev, conversationHistory: event.target.value }))}
                    rows={10}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder={"Customer: Hi, I watched the demo but need more info\nAgent: Happy to help, what did you think?"}
                  />
                </label>
                {contextMessages.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Loaded {contextMessages.length} messages from conversation memory.
                  </p>
                )}
                  {analysisResult && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <MdInsights /> Conversation insights
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                        <div>
                          <span className="font-semibold">Intent:</span>{' '}
                          {analysisResult.intent ? toTitleCase(analysisResult.intent) : '—'}
                        </div>
                        <div>
                          <span className="font-semibold">Confidence:</span>{' '}
                          {typeof analysisResult.confidence === 'number'
                            ? `${Math.round(analysisResult.confidence * 100)}%`
                            : '—'}
                        </div>
                        <div>
                          <span className="font-semibold">Engagement:</span>{' '}
                          {typeof analysisResult.engagement_score === 'number'
                            ? `${Math.round(analysisResult.engagement_score)} / 100`
                            : '—'}
                        </div>
                        <div>
                          <span className="font-semibold">Urgency:</span>{' '}
                          {analysisResult.urgency ? toTitleCase(analysisResult.urgency) : '—'}
                        </div>
                        <div>
                          <span className="font-semibold">Sentiment:</span>{' '}
                          {analysisResult.sentiment ? toTitleCase(analysisResult.sentiment) : '—'}
                        </div>
                        <div>
                          <span className="font-semibold">Recommended channel:</span>{' '}
                          {analysisResult.recommended_channels?.length
                            ? analysisResult.recommended_channels.map(toTitleCase).join(' → ')
                            : '—'}
                        </div>
                      </div>
                      {analysisResult.key_points?.length ? (
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold text-gray-800">Key points</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {analysisResult.key_points.slice(0, 4).map((point, index) => (
                              <li key={`${point}-${index}`}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}
                {previewResult && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                      <MdCheckCircle /> Gemini response
                    </div>
                    <p className="text-gray-900 whitespace-pre-line">{previewResult.message}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>Model: {previewResult.model}</span>
                      {previewResult.response_probability && (
                        <span>Reply likelihood: {(previewResult.response_probability * 100).toFixed(0)}%</span>
                      )}
                      {previewResult.tone_detected && <span>Tone: {toTitleCase(previewResult.tone_detected)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Queue Follow-Up</h2>
              <button
                onClick={refreshQueue}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                disabled={queueLoading}
              >
                <MdRefresh /> Refresh Queue
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Contact ID</span>
                <input
                  type="text"
                  value={scheduleForm.contactId}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, contactId: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="crm-contact-id"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Contact name</span>
                <input
                  type="text"
                  value={scheduleForm.contactName}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, contactName: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Channel</span>
                <select
                  value={scheduleForm.channel}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, channel: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {sanitizeChannelOrder(channelInput).map((channel) => (
                    <option key={channel} value={channel}>
                      {toTitleCase(channel)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Scheduled time (optional)</span>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledTime}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, scheduledTime: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Thread ID</span>
                <input
                  type="text"
                  value={scheduleForm.threadId}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, threadId: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="conversation-thread-id"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Timezone (e.g. Asia/Kolkata)</span>
                <input
                  type="text"
                  value={scheduleForm.timezone}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, timezone: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="UTC"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Last interaction (ISO)</span>
                <input
                  type="datetime-local"
                  value={scheduleForm.lastInteractionAt}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, lastInteractionAt: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={handleSmartSchedule}
                disabled={queueLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <MdAutoFixHigh /> Smart Schedule
              </button>
              <button
                onClick={handleSchedule}
                disabled={queueLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <MdCloudQueue /> Add to Queue
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Channel</th>
                    <th className="px-4 py-3 text-left">Scheduled</th>
                    <th className="px-4 py-3 text-left">Confidence</th>
                    <th className="px-4 py-3 text-left">Intent</th>
                    <th className="px-4 py-3 text-left">Channels</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                        No follow-ups queued yet. Generate a message and add it to the queue.
                      </td>
                    </tr>
                  ) : (
                    queue.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3 text-gray-900">
                          {item.contact_name || item.contact_id || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{toTitleCase(item.channel)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <MdAccessTime /> {formatDate(item.scheduled_time || item.updated_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.ai_confidence !== undefined && item.ai_confidence !== null
                            ? `${Math.round(item.ai_confidence * 100)}%`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {toTitleCase(
                            item.intent || item.metadata?.analysis?.intent || item.analysis?.intent || '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(item.channel_history && item.channel_history.length
                            ? item.channel_history
                            : [item.channel]
                          )
                            .map(toTitleCase)
                            .join(' → ')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{toTitleCase(item.status)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleFailover(item)}
                              disabled={queueLoading}
                              className="inline-flex items-center gap-1 rounded-md border border-orange-200 px-3 py-1 text-orange-700 hover:bg-orange-50"
                            >
                              <MdSwapCalls /> Failover
                            </button>
                            <button
                              onClick={() => handleFeedback(item)}
                              disabled={queueLoading}
                              className="inline-flex items-center gap-1 rounded-md border border-sky-200 px-3 py-1 text-sky-700 hover:bg-sky-50"
                            >
                              <MdFeedback /> Feedback
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Flow Blueprint</h2>
                <p className="text-gray-600 text-sm">
                  Inspect the current automation graph powering AI follow-ups and leave tactical notes for your team.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={loadFlowBlueprint}
                  disabled={flowLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  <MdRefresh /> {flowLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleSaveFlowNotes}
                  disabled={flowLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  <MdSave /> Save Notes
                </button>
              </div>
            </div>
            {flowBlueprint ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">Nodes:</span> {flowBlueprint.nodes?.length ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">Edges:</span> {flowBlueprint.edges?.length ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">Updated:</span>{' '}
                    {flowBlueprint.updated_at ? formatDate(flowBlueprint.updated_at) : '—'}
                  </div>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Team notes</span>
                  <textarea
                    value={flowNotes}
                    onChange={(event) => setFlowNotes(event.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Capture playbook updates, intent routing tweaks, or approval rules"
                  />
                </label>
                <details className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <summary className="cursor-pointer font-semibold text-gray-800">Blueprint JSON preview</summary>
                  <pre className="mt-3 max-h-64 overflow-auto rounded bg-white p-3 text-xs text-gray-800">
{JSON.stringify(flowBlueprint, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Loading blueprint details...</p>
            )}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AiFollowUpAutomationPage;

