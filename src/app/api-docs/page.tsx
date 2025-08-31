"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";

// Icon Components
const RocketIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.5-3 3-3 3s1.5-1.5 3-3 3-3 3-3-1.5 1.5-3 3z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const ZapIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
);

const ShieldIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const BarChartIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const GlobeIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const LockIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const BuildingIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2"/>
    <path d="M10 6h4"/>
    <path d="M10 10h4"/>
    <path d="M10 14h4"/>
    <path d="M10 18h4"/>
  </svg>
);

const UsersIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MessageCircleIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const FileTextIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const MegaphoneIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11l18-5v12L3 14v-3z"/>
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
);

const FolderIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const LinkIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
    <path d="M15 7h2a5 5 0 1 1 0 10h-2"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg className="inline-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

// ============================================================================
// Page Content Components
// ============================================================================

const Introduction = () => (
  <>
    <div className="page-hero">
      <div className="breadcrumb">API Reference / Getting Started</div>
      <h1 className="page-title">Stitchbyte WhatsApp Business API</h1>
      <p className="page-subtitle">
        Enterprise-grade WhatsApp Business API platform designed for developers. Build powerful messaging applications, automate customer communications, and scale your business with our comprehensive API suite.
      </p>
      <div className="hero-badges">
        <span className="badge">REST API</span>
        <span className="badge">Real-time Webhooks</span>
        <span className="badge">JWT Authentication</span>
        <span className="badge">99.9% Uptime SLA</span>
      </div>
    </div>
    <div className="section">
      <h2 className="section-title"><RocketIcon /> Core Features</h2>
      <div className="features-grid">
        <div className="feature-card">
          <h3><ZapIcon /> High Performance</h3>
          <p>99.9% uptime SLA with sub-100ms response times. Built on cloud-native infrastructure for maximum reliability.</p>
        </div>
        <div className="feature-card">
          <h3><ShieldIcon /> Enterprise Security</h3>
          <p>JWT authentication, webhook signature verification, and SOC2 Type II compliance for enterprise peace of mind.</p>
        </div>
        <div className="feature-card">
          <h3><BarChartIcon /> Real-time Analytics</h3>
          <p>Comprehensive message tracking, delivery reports, and business insights with real-time dashboards.</p>
        </div>
        <div className="feature-card">
          <h3><GlobeIcon /> Global Scale</h3>
          <p>Multi-region deployment with automatic failover and global CDN for worldwide message delivery.</p>
        </div>
      </div>
    </div>
  </>
);

const AuthenticationAPI = () => (
  <>
    <div className="breadcrumb">API Reference / Authentication API</div>
    <h1 className="page-title"><LockIcon /> Authentication & Security</h1>
    <p>Secure authentication endpoints for login, token refresh, and session management.</p>
    <EndpointDisplay method="POST" path="/auth/login" description="Authenticate user and receive JWT token." />
    <CodeBlock title="Login Request (cURL)" code={`curl -X POST https://api.stitchbyte.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@company.com",
    "password": "secure_password"
  }'`} />
    <EndpointDisplay method="POST" path="/auth/refresh" description="Refresh an expired JWT access token." />
    <CodeBlock title="Token Refresh (cURL)" code={`curl -X POST https://api.stitchbyte.com/auth/refresh \\
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"`} />
  </>
);

const BusinessProfileAPI = () => (
  <>
    <div className="breadcrumb">API Reference / Business Profile API</div>
    <h1 className="page-title"><BuildingIcon /> Business Profile Management</h1>
    <p>Manage your WhatsApp Business Profile information and verification status.</p>
    <EndpointDisplay method="GET" path="/business-profile" description="Retrieve complete business profile information." />
    <CodeBlock title="Get Business Profile (cURL)" code={`curl -X GET https://api.stitchbyte.com/business-profile \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    <EndpointDisplay method="PUT" path="/business-profile" description="Update business profile settings and information." />
    <CodeBlock title="Update Business Profile (cURL)" code={`curl -X PUT https://api.stitchbyte.com/business-profile \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "business_name": "Acme Corporation",
    "description": "Leading provider of enterprise solutions",
    "website": "https://acme.com"
  }'`} />
  </>
);

const ContactsAPI = () => (
  <>
    <div className="breadcrumb">API Reference / Contacts API</div>
    <h1 className="page-title"><UsersIcon /> Contact Management</h1>
    <p>Comprehensive contact management with advanced filtering, bulk operations, and custom fields.</p>
    <EndpointDisplay method="GET" path="/contacts" description="List all contacts with advanced filtering and pagination." />
    <CodeBlock title="List Contacts with Filters (cURL)" code={`curl -X GET "https://api.stitchbyte.com/contacts?limit=50&tags=vip" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    <EndpointDisplay method="POST" path="/contacts" description="Create a new contact with detailed information." />
    <CodeBlock title="Create Contact (cURL)" code={`curl -X POST https://api.stitchbyte.com/contacts \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+1234567890",
    "name": "John Doe",
    "tags": ["customer", "vip"]
  }'`} />
    <EndpointDisplay method="DELETE" path="/contacts/{id}" description="Permanently delete a contact." />
    <CodeBlock title="Delete Contact (cURL)" code={`curl -X DELETE https://api.stitchbyte.com/contacts/contact_abc123 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
  </>
);

const MessagesAPI = () => (
  <>
    <div className="breadcrumb">API Reference / Messages API</div>
    <h1 className="page-title"><MessageCircleIcon /> Message Operations</h1>
    <p>Send various types of WhatsApp messages including text, media, documents, and track delivery status.</p>
    <EndpointDisplay method="POST" path="/messages/send" description="Send text, media, location, or template messages." />
    <CodeBlock title="Send Text Message (cURL)" code={`curl -X POST https://api.stitchbyte.com/messages/send \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "type": "text",
    "text": { "body": "Your order #12345 has been confirmed." }
  }'`} />
    <EndpointDisplay method="GET" path="/messages/{id}/status" description="Get real-time delivery status of sent messages." />
    <CodeBlock title="Check Message Status (cURL)" code={`curl -X GET https://api.stitchbyte.com/messages/msg_abc123/status \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
  </>
);

const TemplatesAPI = () => (
  <>
    <div className="breadcrumb">API Reference / Templates API</div>
    <h1 className="page-title"><FileTextIcon /> Template Management</h1>
    <p>Create, manage, and use WhatsApp Business message templates for marketing and transactional messages.</p>
    <EndpointDisplay method="GET" path="/templates" description="List all approved message templates." />
    <CodeBlock title="List Templates (cURL)" code={`curl -X GET "https://api.stitchbyte.com/templates?status=approved" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    <EndpointDisplay method="POST" path="/templates" description="Create and submit new message template for approval." />
    <CodeBlock title="Create Template (cURL)" code={`curl -X POST https://api.stitchbyte.com/templates \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "order_confirmation",
    "category": "TRANSACTIONAL",
    "language": "en",
    "components": [{
        "type": "BODY",
        "text": "Hi {{1}}, your order #{{2}} has been confirmed."
    }]
  }'`} />
    </>
);

const CampaignsAPI = () => (
    <>
    <div className="breadcrumb">API Reference / Campaigns API</div>
    <h1 className="page-title"><MegaphoneIcon /> Campaign Management</h1>
    <p>Create, schedule, and manage marketing campaigns with detailed analytics and targeting options.</p>
    <EndpointDisplay method="GET" path="/campaigns" description="List all marketing campaigns with analytics." />
    <CodeBlock title="List Campaigns (cURL)" code={`curl -X GET "https://api.stitchbyte.com/campaigns?status=active" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    <EndpointDisplay method="POST" path="/campaigns" description="Create and schedule new marketing campaign." />
    <CodeBlock title="Create Campaign (cURL)" code={`curl -X POST https://api.stitchbyte.com/campaigns \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Black Friday Sale 2025",
    "template_id": "template_abc123",
    "target_audience": { "tags": ["customer", "vip"] },
    "schedule": { "send_time": "2025-11-29T09:00:00Z" }
  }'`} />
    </>
);

const AnalyticsAPI = () => (
    <>
    <div className="breadcrumb">API Reference / Analytics API</div>
    <h1 className="page-title"><BarChartIcon /> Analytics & Reporting</h1>
    <p>Comprehensive analytics for messages, campaigns, and contact engagement with detailed metrics.</p>
    <EndpointDisplay method="GET" path="/analytics/messages" description="Get comprehensive message analytics and statistics." />
    <CodeBlock title="Message Analytics (cURL)" code={`curl -X GET "https://api.stitchbyte.com/analytics/messages?start_date=2025-09-01&end_date=2025-09-30" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    <EndpointDisplay method="GET" path="/analytics/campaigns/{id}" description="Get detailed campaign performance and ROI metrics." />
    <CodeBlock title="Campaign Analytics (cURL)" code={`curl -X GET https://api.stitchbyte.com/analytics/campaigns/campaign_abc123 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
  </>
);

const MediaAPI = () => (
    <>
    <div className="breadcrumb">API Reference / Media API</div>
    <h1 className="page-title"><FolderIcon /> Media Management</h1>
    <p>Upload, manage, and organize media files for use in WhatsApp messages with metadata support.</p>
    <EndpointDisplay method="POST" path="/media/upload" description="Upload media files for use in messages." />
    <CodeBlock title="Upload Media File (cURL)" code={`curl -X POST https://api.stitchbyte.com/media/upload \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "file=@product-image.jpg"`} />
    <EndpointDisplay method="GET" path="/media/{id}" description="Get specific media file information and download URL." />
    <CodeBlock title="Get Media Details (cURL)" code={`curl -X GET https://api.stitchbyte.com/media/media_abc123 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    </>
);

const WebhooksAPI = () => (
    <>
    <div className="breadcrumb">API Reference / Webhooks API</div>
    <h1 className="page-title"><LinkIcon /> Webhook Configuration</h1>
    <p>Configure and manage webhook endpoints for real-time event notifications and message status updates.</p>
    <EndpointDisplay method="POST" path="/webhooks/configure" description="Configure webhook endpoints for real-time event notifications." />
    <CodeBlock title="Configure Webhook (cURL)" code={`curl -X POST https://api.stitchbyte.com/webhooks/configure \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhook/whatsapp",
    "events": ["message.received", "message.delivered"],
    "secret": "your_webhook_secret_key"
  }'`} />
    <EndpointDisplay method="GET" path="/webhooks" description="List all configured webhook endpoints." />
    <CodeBlock title="List Webhooks (cURL)" code={`curl -X GET https://api.stitchbyte.com/webhooks \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    </>
);

const AccountAPI = () => (
    <>
    <div className="breadcrumb">API Reference / Account API</div>
    <h1 className="page-title"><CreditCardIcon /> Account & Billing</h1>
    <p>Monitor account usage, billing information, and API rate limits for your Stitchbyte account.</p>
    <EndpointDisplay method="GET" path="/account/usage" description="Get current account usage, limits, and quotas." />
    <CodeBlock title="Account Usage (cURL)" code={`curl -X GET https://api.stitchbyte.com/account/usage \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
    <EndpointDisplay method="GET" path="/account/billing" description="Get billing information, invoices, and payment history." />
    <CodeBlock title="Billing Information (cURL)" code={`curl -X GET https://api.stitchbyte.com/account/billing \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
  </>
);


// Helper component for displaying code blocks
const CodeBlock = ({ title, code }: { title: string, code: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="code-example">
            <div className="code-header">
                <span className="code-title">{title}</span>
                <button onClick={handleCopy} className="copy-button">
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre><code>{code}</code></pre>
        </div>
    );
};
// Helper component for displaying API endpoints
const EndpointDisplay = ({ method, path, description }: { method: string, path: string, description: string }) => {
    const methodClass = `method-badge ${method.toLowerCase()}`;
    return (
        <div className="endpoint-item">
            <div className="endpoint-header">
                <span className={methodClass}>{method}</span>
                <code className="endpoint-path">{path}</code>
            </div>
            <p className="endpoint-description">{description}</p>
        </div>
    );
};

const pages = [
    { id: 'page-introduction', title: 'Getting Started', component: <Introduction />, prev: null, next: 'Authentication API' },
    { id: 'page-authentication', title: 'Authentication API', component: <AuthenticationAPI />, prev: 'Getting Started', next: 'Business Profile API' },
    { id: 'page-business', title: 'Business Profile API', component: <BusinessProfileAPI />, prev: 'Authentication API', next: 'Contacts API' },
    { id: 'page-contacts', title: 'Contacts API', component: <ContactsAPI />, prev: 'Business Profile API', next: 'Messages API' },
    { id: 'page-messages', title: 'Messages API', component: <MessagesAPI />, prev: 'Contacts API', next: 'Templates API' },
    { id: 'page-templates', title: 'Templates API', component: <TemplatesAPI />, prev: 'Messages API', next: 'Campaigns API' },
    { id: 'page-campaigns', title: 'Campaigns API', component: <CampaignsAPI />, prev: 'Templates API', next: 'Analytics API' },
    { id: 'page-analytics', title: 'Analytics API', component: <AnalyticsAPI />, prev: 'Campaigns API', next: 'Media API' },
    { id: 'page-media', title: 'Media API', component: <MediaAPI />, prev: 'Analytics API', next: 'Webhooks API' },
    { id: 'page-webhooks', title: 'Webhooks API', component: <WebhooksAPI />, prev: 'Media API', next: 'Account API' },
    { id: 'page-account', title: 'Account API', component: <AccountAPI />, prev: 'Webhooks API', next: null },
];

// ============================================================================
// Main API Docs Page Component
// ============================================================================

export default function ApiDocsPage() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const goToPage = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    setCurrentPageIndex(pageIndex);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPage = pages[currentPageIndex];

  if (!currentPage) {
    return <div>Loading...</div>; // Fallback for safety
  }

  return (
    <div className="docs-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">S</div>
          <div>
            <h1 className="brand-title">Stitchbyte</h1>
            <p className="brand-subtitle">API Reference</p>
          </div>
        </div>
        
        <div className="search-container">
          <input type="text" placeholder="Search..." />
        </div>
        
        <nav className="sidebar-nav">
          <h3 className="nav-group-title">Getting Started</h3>
          <ul>
            {pages.slice(0, 1).map((page, index) => (
              <li key={page.id}>
                <a href="#" className={index === currentPageIndex ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); goToPage(index); }}>
                  {page.title}
                </a>
              </li>
            ))}
          </ul>
          <h3 className="nav-group-title">API Endpoints</h3>
          <ul>
            {pages.slice(1).map((page, index) => (
              <li key={page.id}>
                <a href="#" className={(index + 1) === currentPageIndex ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); goToPage(index + 1); }}>
                  {page.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
            <p className="footer-text">© {new Date().getFullYear()} Stitchbyte</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-wrapper">
        <main className="main-content" ref={mainContentRef}>
            <div className="page-container">
                {currentPage.component}
            </div>

            {/* Pagination Navigation */}
            <div className="pagination-wrapper">
              <div className="pagination-nav">
                <button onClick={() => goToPage(currentPageIndex - 1)} disabled={!currentPage.prev}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  <div>
                    <span>Previous</span>
                    {currentPage.prev}
                  </div>
                </button>
                <button onClick={() => goToPage(currentPageIndex + 1)} disabled={!currentPage.next}>
                  <div>
                    <span>Next</span>
                    {currentPage.next}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
        </main>
      </div>

      <style jsx global>{`
        /* Import Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        /* CSS Variables for Theming */
        :root {
            --font-sans: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            --bg-sidebar: #FFFFFF;
            --bg-main: #F8FAFC;
            --bg-code: #0F172A;
            --border-color: #E2E8F0;
            --text-primary: #0F172A;
            --text-secondary: #475569;
            --text-muted: #94A3B8;
            --text-on-code: #E2E8F0;
            --accent-primary: #4F46E5;
            --accent-primary-hover: #4338CA;
            --shadow-color: 220 3% 15%;
        }
        
        /* Base Styles */
        body { margin: 0; font-family: var(--font-sans); background-color: var(--bg-main); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
        .docs-container { display: flex; }
        
        /* Icon Styles */
        .inline-icon { 
            display: inline-block; 
            vertical-align: middle; 
            margin-right: 0.75rem; 
            color: var(--accent-primary); 
            stroke-width: 2.5; 
        }
        
        /* Sidebar */
        .sidebar { width: 280px; height: 100vh; background-color: var(--bg-sidebar); border-right: 1px solid var(--border-color); position: fixed; display: flex; flex-direction: column; }
        .sidebar-brand { display: flex; align-items: center; gap: 12px; padding: 2rem 1.5rem; border-bottom: 1px solid var(--border-color); }
        .brand-logo { width: 32px; height: 32px; background-color: var(--text-primary); color: var(--bg-main); font-weight: 700; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
        .brand-title { margin: 0; font-size: 1.125rem; font-weight: 600; color: var(--text-primary); }
        .brand-subtitle { margin: 0; font-size: 0.8rem; color: var(--text-secondary); }
        .search-container { padding: 1.5rem; }
        .search-container input { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background-color: #FFFFFF; color: var(--text-primary); font-size: 0.875rem; }
        .sidebar-nav { flex-grow: 1; overflow-y: auto; padding: 1.5rem; }
        .sidebar-nav ul { list-style: none; margin: 0; padding: 0; }
        .sidebar-nav .nav-group-title { padding: 1.5rem 0.75rem 0.75rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .sidebar-nav a { display: block; padding: 0.875rem 1rem; color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; font-weight: 500; border-radius: 8px; transition: all 0.2s; border-left: 3px solid transparent; }
        .sidebar-nav a:hover { color: var(--text-primary); background-color: var(--border-color); }
        .sidebar-nav a.active { color: var(--accent-primary); border-left-color: var(--accent-primary); font-weight: 600; }
        .sidebar-footer { padding: 2rem 1.5rem; border-top: 1px solid var(--border-color); }
        .footer-text { font-size: 0.8rem; color: var(--text-muted); text-align: center; }

        /* Main Content */
        .content-wrapper { margin-left: 280px; width: calc(100% - 280px); }
        .main-content { width: 100%; overflow-y: auto; height: 100vh; display: flex; flex-direction: column; }
        .page-container { width: 100%; padding: 2rem; animation: fadeIn 0.5s ease-out; flex-grow: 1; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: translateY(0); } }

        /* Content Styling */
        .breadcrumb { font-size: 0.875rem; font-weight: 500; color: var(--text-muted); margin-bottom: 0.75rem; }
        .page-title { font-size: 2.75rem; font-weight: 700; color: var(--text-primary); letter-spacing: -1.5px; margin: 0 0 1.5rem; display: flex; align-items: center; }
        .page-subtitle, p { font-size: 1.125rem; color: var(--text-secondary); line-height: 1.7; margin: 0 0 2rem; }
        .page-hero { padding-bottom: 3rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; }
        .badge { background-color: var(--bg-sidebar); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 500; border-radius: 99px; }
        .hero-badges { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 2rem; }
        .section-title { font-size: 1.75rem; font-weight: 600; color: var(--text-primary); margin: 4rem 0 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 3rem; }
        .feature-card { background-color: #FFFFFF; padding: 2rem; border: 1px solid var(--border-color); border-radius: 12px; }
        .feature-card h3 { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; }
        .feature-card p { font-size: 0.95rem; line-height: 1.6; margin: 0; color: var(--text-secondary); }
        .info-box { background-color: var(--bg-sidebar); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-primary); padding: 2rem; border-radius: 8px; margin: 3rem 0; }
        .info-box ol { padding-left: 2rem; margin: 1rem 0 0; }
        .info-box li { margin-bottom: 0.75rem; font-size: 0.95rem; }
        
        /* Code & Endpoints */
        .code-example { border: 1px solid var(--border-color); border-radius: 12px; margin: 3rem 0; box-shadow: 0 4px 16px hsla(var(--shadow-color), .1); }
        .code-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background-color: var(--bg-sidebar); border-bottom: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono); border-top-left-radius: 11px; border-top-right-radius: 11px; }
        .copy-button { background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
        pre { margin: 0; background-color: var(--bg-code); padding: 2rem; overflow-x: auto; font-size: 0.875rem; border-bottom-left-radius: 11px; border-bottom-right-radius: 11px; }
        code { font-family: var(--font-mono); color: var(--text-on-code); }
        .endpoint-item { border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 8px hsla(var(--shadow-color), .05); }
        .endpoint-header { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; background-color: var(--bg-sidebar); border-bottom: 1px solid var(--border-color); }
        .endpoint-path { font-family: var(--font-mono); font-size: 1rem; font-weight: 500; color: var(--text-primary); }
        .endpoint-description { padding: 1.5rem; font-size: 0.95rem; color: var(--text-secondary); margin:0; }
        .method-badge { padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: white; font-family: var(--font-mono); }
        .get { background-color: #059669; } .post { background-color: #2563EB; } .put { background-color: #D97706; }

        /* Tables & Lists */
        .error-table { border: 1px solid var(--border-color); border-radius: 8px; margin: 2rem 0; }
        .error-row { display: grid; grid-template-columns: 80px 180px 1fr; align-items: center; padding: 1.25rem; border-bottom: 1px solid var(--border-color); font-size: 0.875rem; }
        .error-row:last-child { border-bottom: none; }
        .error-code { font-family: var(--font-mono); color: var(--accent-primary); font-weight: 500; }
        .event-row { display: grid; grid-template-columns: 200px 1fr; align-items: center; padding: 1.25rem; border-bottom: 1px solid var(--border-color); font-size: 0.875rem; }
        .event-row:last-child { border-bottom: none; }
        .event-name { font-family: var(--font-mono); color: var(--accent-primary); font-weight: 600; font-size: 0.9rem; }

        /* Pagination */
        .pagination-wrapper { max-width: 800px; width: 100%; margin: 0 auto; padding: 0 2rem; }
        .pagination-nav { display: flex; justify-content: space-between; align-items: stretch; padding: 2rem 0; margin-top: 1rem; border-top: 1px solid var(--border-color); gap: 1rem; }
        .pagination-nav button { flex: 1; display: flex; align-items: center; gap: 0.75rem; background-color: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; cursor: pointer; transition: all 0.2s; }
        .pagination-nav button:not(:disabled):hover { border-color: var(--accent-primary); background-color: var(--accent-primary); color: white; }
        .pagination-nav button:not(:disabled):hover span { color: white; }
        .pagination-nav button:disabled { opacity: 0.4; cursor: not-allowed; }
        .pagination-nav button div { display: flex; flex-direction: column; }
        .pagination-nav button span:first-child { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
        .pagination-nav button span:last-child { font-weight: 600; color: var(--text-primary); }
        .pagination-nav button:last-child { text-align: right; flex-direction: row-reverse; }

        /* Responsive */
        @media (max-width: 1024px) {
            .content-wrapper { grid-template-columns: 1fr; margin-left: 0; width: 100%; }
            .toc-sidebar, .sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}