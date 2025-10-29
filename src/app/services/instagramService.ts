/**
 * Instagram Service
 * Handles all Instagram-related API calls for StitchByte Automation
 */

import { apiService } from './apiService';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface InstagramConnection {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count: number;
  is_active: boolean;
  connected_at: string;
}

export interface DMRule {
  id: string;
  name: string;
  trigger: string;
  trigger_type: 'keyword' | 'intent' | 'pattern';
  response: string;
  response_type: 'text' | 'template' | 'ai';
  enabled: boolean;
  priority: number;
  stats: {
    triggered: number;
    success: number;
    failed: number;
  };
}

export interface CommentRule {
  id: string;
  name: string;
  keywords: string[];
  auto_reply_public: boolean;
  auto_dm: boolean;
  dm_message?: string;
  public_reply_message?: string;
  tag_as_lead: boolean;
  lead_tag: string;
  enabled: boolean;
  stats: {
    detected: number;
    replied: number;
    dms_sent: number;
  };
}

export interface StoryRule {
  id: string;
  name: string;
  trigger_type: string;
  auto_respond: boolean;
  response_message: string;
  enabled: boolean;
  stats: {
    triggered: number;
    responded: number;
  };
}

export interface ScheduledPost {
  id: string;
  media_url: string;
  media_type: 'image' | 'video' | 'carousel' | 'reel';
  caption: string;
  scheduled_time: string;
  status: 'scheduled' | 'published' | 'failed';
  instagram_media_id?: string;
}

export interface InstagramStats {
  total_dms: number;
  automated_replies: number;
  comment_engagements: number;
  story_replies: number;
  scheduled_posts: number;
  ai_interactions: number;
  response_time: string;
  engagement_rate: string;
  leads_generated: number;
  conversion_rate: number;
}

export interface InstagramLead {
  id: string;
  instagram_user_id: string;
  username: string;
  source: 'dm' | 'comment' | 'story_reply' | 'story_mention';
  tags: string[];
  created_at: string;
  engagement_score: number;
}

export interface AIIntentResponse {
  detected_intent: string | null;
  confidence: number;
  suggested_response: string;
  requires_human: boolean;
}

export interface AICaptionResponse {
  caption: string;
  suggested_hashtags: string[];
  best_posting_time: string;
}

// ============================================================================
// Instagram Service Class
// ============================================================================

class InstagramService {
  private baseUrl = '/instagram';

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  async connectAccount(data: {
    access_token: string;
    instagram_business_account_id: string;
    page_id?: string;
  }): Promise<InstagramConnection> {
    return await apiService.post(`${this.baseUrl}/connect`, data);
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    username?: string;
    last_synced?: string;
  }> {
    return await apiService.get(`${this.baseUrl}/connection/status`);
  }

  async disconnectAccount(): Promise<{ message: string }> {
    return await apiService.delete(`${this.baseUrl}/disconnect`);
  }

  // --------------------------------------------------------------------------
  // DM Automation
  // --------------------------------------------------------------------------

  async createDMRule(rule: Partial<DMRule>): Promise<DMRule> {
    return await apiService.post(`${this.baseUrl}/dm-rules`, rule);
  }

  async getDMRules(): Promise<DMRule[]> {
    return await apiService.get(`${this.baseUrl}/dm-rules`);
  }

  async updateDMRule(ruleId: string, rule: Partial<DMRule>): Promise<DMRule> {
    return await apiService.put(`${this.baseUrl}/dm-rules/${ruleId}`, rule);
  }

  async deleteDMRule(ruleId: string): Promise<{ message: string }> {
    return await apiService.delete(`${this.baseUrl}/dm-rules/${ruleId}`);
  }

  async toggleDMRule(ruleId: string): Promise<{ message: string }> {
    return await apiService.post(`${this.baseUrl}/dm-rules/${ruleId}/toggle`);
  }

  async getConversations(limit: number = 50): Promise<any[]> {
    return await apiService.get(`${this.baseUrl}/conversations?limit=${limit}`);
  }

  // --------------------------------------------------------------------------
  // Comment Automation
  // --------------------------------------------------------------------------

  async createCommentRule(rule: Partial<CommentRule>): Promise<CommentRule> {
    return await apiService.post(`${this.baseUrl}/comment-rules`, rule);
  }

  async getCommentRules(): Promise<CommentRule[]> {
    return await apiService.get(`${this.baseUrl}/comment-rules`);
  }

  async updateCommentRule(ruleId: string, rule: Partial<CommentRule>): Promise<CommentRule> {
    return await apiService.put(`${this.baseUrl}/comment-rules/${ruleId}`, rule);
  }

  async deleteCommentRule(ruleId: string): Promise<{ message: string }> {
    return await apiService.delete(`${this.baseUrl}/comment-rules/${ruleId}`);
  }

  async getRecentComments(limit: number = 25): Promise<any[]> {
    return await apiService.get(`${this.baseUrl}/comments/recent?limit=${limit}`);
  }

  // --------------------------------------------------------------------------
  // Story Automation
  // --------------------------------------------------------------------------

  async createStoryRule(rule: Partial<StoryRule>): Promise<StoryRule> {
    return await apiService.post(`${this.baseUrl}/story-rules`, rule);
  }

  async getStoryRules(): Promise<StoryRule[]> {
    return await apiService.get(`${this.baseUrl}/story-rules`);
  }

  async updateStoryRule(ruleId: string, rule: Partial<StoryRule>): Promise<StoryRule> {
    return await apiService.put(`${this.baseUrl}/story-rules/${ruleId}`, rule);
  }

  async deleteStoryRule(ruleId: string): Promise<{ message: string }> {
    return await apiService.delete(`${this.baseUrl}/story-rules/${ruleId}`);
  }

  async getStories(): Promise<any[]> {
    return await apiService.get(`${this.baseUrl}/stories`);
  }

  // --------------------------------------------------------------------------
  // Post Scheduler
  // --------------------------------------------------------------------------

  async schedulePost(post: {
    media_url: string;
    media_type: 'image' | 'video' | 'carousel' | 'reel';
    caption: string;
    scheduled_time: string;
    use_ai_caption?: boolean;
    hashtags?: string[];
  }): Promise<ScheduledPost> {
    return await apiService.post(`${this.baseUrl}/schedule-post`, post);
  }

  async getScheduledPosts(): Promise<ScheduledPost[]> {
    return await apiService.get(`${this.baseUrl}/scheduled-posts`);
  }

  async deleteScheduledPost(postId: string): Promise<{ message: string }> {
    return await apiService.delete(`${this.baseUrl}/scheduled-posts/${postId}`);
  }

  async generateAICaption(data: {
    media_url: string;
    brand_tone?: string;
    keywords?: string[];
    max_length?: number;
  }): Promise<AICaptionResponse> {
    return await apiService.post(`${this.baseUrl}/ai-caption`, data);
  }

  // --------------------------------------------------------------------------
  // AI Engine
  // --------------------------------------------------------------------------

  async detectIntent(message: string, context?: any): Promise<AIIntentResponse> {
    return await apiService.post(`${this.baseUrl}/ai/detect-intent`, {
      message,
      context,
    });
  }

  async generateResponse(
    intent: string,
    message: string,
    context?: any,
    brandTone: string = 'professional'
  ): Promise<{
    response: string;
    confidence: number;
    alternative_responses: string[];
  }> {
    return await apiService.post(`${this.baseUrl}/ai/generate-response`, {
      intent,
      message,
      user_context: context,
      brand_tone: brandTone,
    });
  }

  async trainAI(trainingData: Array<{
    category: string;
    question: string;
    answer: string;
    intent?: string;
  }>): Promise<{ message: string }> {
    return await apiService.post(`${this.baseUrl}/ai/train`, trainingData);
  }

  // --------------------------------------------------------------------------
  // Leads & CRM
  // --------------------------------------------------------------------------

  async createLead(lead: {
    instagram_user_id: string;
    username: string;
    source: 'dm' | 'comment' | 'story_reply' | 'story_mention';
    interaction_id: string;
    tags?: string[];
    notes?: string;
  }): Promise<InstagramLead> {
    return await apiService.post(`${this.baseUrl}/leads`, lead);
  }

  async getLeads(source?: string): Promise<InstagramLead[]> {
    const url = source
      ? `${this.baseUrl}/leads?source=${source}`
      : `${this.baseUrl}/leads`;
    return await apiService.get(url);
  }

  async updateLead(leadId: string, data: Partial<InstagramLead>): Promise<InstagramLead> {
    return await apiService.put(`${this.baseUrl}/leads/${leadId}`, data);
  }

  async syncLeadToWhatsApp(leadId: string, phoneNumber: string): Promise<{ message: string }> {
    return await apiService.post(`${this.baseUrl}/leads/${leadId}/sync-whatsapp`, {
      phone_number: phoneNumber,
    });
  }

  // --------------------------------------------------------------------------
  // Analytics
  // --------------------------------------------------------------------------

  async getStats(): Promise<InstagramStats> {
    return await apiService.get(`${this.baseUrl}/stats`);
  }

  async getDailyAnalytics(days: number = 30): Promise<any[]> {
    return await apiService.get(`${this.baseUrl}/analytics/daily?days=${days}`);
  }

  async getMediaPerformance(limit: number = 10): Promise<any[]> {
    return await apiService.get(`${this.baseUrl}/analytics/media-performance?limit=${limit}`);
  }

  // --------------------------------------------------------------------------
  // Settings
  // --------------------------------------------------------------------------

  async getSettings(): Promise<any> {
    return await apiService.get(`${this.baseUrl}/settings`);
  }

  async updateSettings(settings: any): Promise<any> {
    return await apiService.put(`${this.baseUrl}/settings`, settings);
  }
}

// Export singleton instance
export const instagramService = new InstagramService();

// Export for use in components
export default instagramService;
