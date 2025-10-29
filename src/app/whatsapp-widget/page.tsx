"use client";

import { useState } from 'react';
import { LuMonitor, LuCopy, LuCheck, LuCode, LuEye, LuPalette, LuSettings, LuDownload, LuCircleAlert } from 'react-icons/lu';

interface WidgetConfig {
  phoneNumber: string;
  brandName: string;
  brandSubtitle: string;
  brandColor: string;
  brandImageUrl: string;
  welcomeMessage: string;
  ctaText: string;
  position: 'bottom-right' | 'bottom-left';
  marginBottom: string;
  marginLeft: string;
  marginRight: string;
  borderRadius: string;
  openByDefault: boolean;
  reopenAfter: string;
  openOnMobile: boolean;
}

export default function WhatsAppWidget() {
  const [config, setConfig] = useState<WidgetConfig>({
    phoneNumber: '',
    brandName: 'Stitchbyte',
    brandSubtitle: 'online',
    brandColor: '#156D6C',
    brandImageUrl: 'https://res.cloudinary.com/dzpusvj9o/image/upload/v1761477388/download_bpvqer.png',
    welcomeMessage: 'Hi,\nHow can I help you?',
    ctaText: 'Start chat',
    position: 'bottom-right',
    marginBottom: '30',
    marginLeft: '30',
    marginRight: '30',
    borderRadius: '24',
    openByDefault: false,
    reopenAfter: 'Always',
    openOnMobile: true
  });

  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateConfig = (key: keyof WidgetConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateSnippet = () => {
    const cleanNumber = config.phoneNumber.replace(/\D/g, '');
    
    if (!cleanNumber) {
      return '<!-- Please enter a WhatsApp phone number to generate the widget code -->';
    }
    
    const encodedMessage = encodeURIComponent(config.welcomeMessage);
    
    return `<!-- WhatsApp Widget by Stitchbyte -->
<script>
(function() {
  const widgetConfig = {
    phoneNumber: "${cleanNumber}",
    brandName: "${config.brandName}",
    brandSubtitle: "${config.brandSubtitle}",
    brandColor: "${config.brandColor}",
    brandImageUrl: "${config.brandImageUrl}",
    welcomeMessage: "${config.welcomeMessage.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",
    ctaText: "${config.ctaText}",
    position: "${config.position}",
    marginBottom: "${config.marginBottom}px",
    marginLeft: "${config.marginLeft}px",
    marginRight: "${config.marginRight}px",
    borderRadius: "${config.borderRadius}px",
    openByDefault: ${config.openByDefault},
    reopenAfter: "${config.reopenAfter}",
    openOnMobile: ${config.openOnMobile}
  };
  
  // Validate phone number
  if (!widgetConfig.phoneNumber || widgetConfig.phoneNumber.length < 10) {
    console.error('Stitchbyte WhatsApp Widget: Invalid phone number');
    return;
  }
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(widgetConfig.welcomeMessage);
  
  const createWidget = () => {
    // Check if widget already exists
    if (document.getElementById('stitchbyte-wa-widget')) {
      return;
    }
    
    const widget = document.createElement('div');
    widget.id = 'stitchbyte-wa-widget';
    widget.innerHTML = \`
      <style>
        #stitchbyte-wa-widget { position: fixed; z-index: 99999; \${widgetConfig.position === 'bottom-right' ? 'right' : 'left'}: \${widgetConfig.position === 'bottom-right' ? widgetConfig.marginRight : widgetConfig.marginLeft}; bottom: \${widgetConfig.marginBottom}; }
        .wa-widget-btn { width: 60px; height: 60px; background: #25D366; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .wa-widget-btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        .wa-widget-chat { display: none; position: absolute; bottom: 80px; \${widgetConfig.position === 'bottom-right' ? 'right' : 'left'}: 0; width: 350px; background: white; border-radius: \${widgetConfig.borderRadius}; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; }
        .wa-widget-chat.active { display: block; animation: slideUp 0.3s; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .wa-widget-header { background: \${widgetConfig.brandColor}; color: white; padding: 16px; display: flex; align-items: center; gap: 12px; position: relative; }
        .wa-widget-header img { width: 48px; height: 48px; border-radius: 50%; border: 2px solid white; object-fit: cover; }
        .wa-widget-body { padding: 20px; background: #E5DDD5; }
        .wa-widget-message { background: white; color: #333333; padding: 12px; border-radius: 8px; margin-bottom: 16px; white-space: pre-line; box-shadow: 0 1px 2px rgba(0,0,0,0.1); font-size: 14px; line-height: 1.5; }
        .wa-widget-cta { width: 100%; padding: 12px; background: \${widgetConfig.brandColor}; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .wa-widget-cta:hover { opacity: 0.9; }
        .wa-widget-close { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; }
      </style>
      <div class="wa-widget-chat" id="wa-chat-box">
        <div class="wa-widget-header">
          <button class="wa-widget-close" onclick="document.getElementById('wa-chat-box').classList.remove('active')">×</button>
          <img src="\${widgetConfig.brandImageUrl || 'https://res.cloudinary.com/dzpusvj9o/image/upload/v1761477388/download_bpvqer.png'}" alt="\${widgetConfig.brandName}">
          <div>
            <div style="font-weight: 600; font-size: 16px;">\${widgetConfig.brandName}</div>
            <div style="font-size: 12px; opacity: 0.9;">\${widgetConfig.brandSubtitle}</div>
          </div>
        </div>
        <div class="wa-widget-body">
          <div class="wa-widget-message">\${widgetConfig.welcomeMessage}</div>
          <button class="wa-widget-cta" onclick="window.open('https://wa.me/\${widgetConfig.phoneNumber}?text=\${encodedMessage}', '_blank')">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            \${widgetConfig.ctaText}
          </button>
        </div>
      </div>
      <div class="wa-widget-btn" onclick="document.getElementById('wa-chat-box').classList.toggle('active')">
        <svg width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </div>
    \`;
    document.body.appendChild(widget);
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
</script>`;
  };

  const copySnippet = () => {
    if (!config.phoneNumber || config.phoneNumber.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid WhatsApp phone number before copying the code');
      return;
    }
    
    navigator.clipboard.writeText(generateSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <LuMonitor className="text-white" size={24} />
            </div>
            WhatsApp Website Widget
          </h1>
          <p className="text-gray-600">Drive WhatsApp sales with personalized CTAs on your website</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Section */}
          <div className="space-y-6">
            {/* WhatsApp Configuration */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LuSettings size={20} className="text-teal-600" />
                WhatsApp Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Phone Number * 
                    <span className="text-xs text-gray-500 ml-2">(Required)</span>
                  </label>
                  <input
                    type="text"
                    value={config.phoneNumber}
                    onChange={(e) => updateConfig('phoneNumber', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none ${
                      !config.phoneNumber || config.phoneNumber.replace(/\D/g, '').length < 10
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  />
                  {!config.phoneNumber && (
                    <p className="text-xs text-red-600 mt-1.5">Phone number is required to generate widget code</p>
                  )}
                  {config.phoneNumber && config.phoneNumber.replace(/\D/g, '').length < 10 && (
                    <p className="text-xs text-red-600 mt-1.5">Phone number must have at least 10 digits</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Pre-filled Message</label>
                  <textarea
                    value={config.welcomeMessage}
                    onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Chat Widget Customization */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LuPalette size={20} className="text-teal-600" />
                Chat Widget
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                    <input
                      type="text"
                      value={config.brandName}
                      onChange={(e) => updateConfig('brandName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Subtitle</label>
                    <input
                      type="text"
                      value={config.brandSubtitle}
                      onChange={(e) => updateConfig('brandSubtitle', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand Image URL</label>
                  <input
                    type="text"
                    value={config.brandImageUrl}
                    onChange={(e) => updateConfig('brandImageUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={config.brandColor}
                      onChange={(e) => updateConfig('brandColor', e.target.value)}
                      className="h-11 w-20 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.brandColor}
                      onChange={(e) => updateConfig('brandColor', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Widget CTA Text</label>
                  <input
                    type="text"
                    value={config.ctaText}
                    onChange={(e) => updateConfig('ctaText', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <div className="flex gap-3">
                    <label className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        checked={config.position === 'bottom-right'}
                        onChange={() => updateConfig('position', 'bottom-right')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-800">Bottom-Right</span>
                    </label>
                    <label className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        checked={config.position === 'bottom-left'}
                        onChange={() => updateConfig('position', 'bottom-left')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-800">Bottom-Left</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Margin Bottom (px)</label>
                    <input
                      type="number"
                      value={config.marginBottom}
                      onChange={(e) => updateConfig('marginBottom', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {config.position === 'bottom-right' ? 'Margin Right (px)' : 'Margin Left (px)'}
                    </label>
                    <input
                      type="number"
                      value={config.position === 'bottom-right' ? config.marginRight : config.marginLeft}
                      onChange={(e) => updateConfig(config.position === 'bottom-right' ? 'marginRight' : 'marginLeft', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius (px)</label>
                    <input
                      type="number"
                      value={config.borderRadius}
                      onChange={(e) => updateConfig('borderRadius', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="openByDefault"
                    checked={config.openByDefault}
                    onChange={(e) => updateConfig('openByDefault', e.target.checked)}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded"
                  />
                  <label htmlFor="openByDefault" className="text-sm text-gray-700">Open widget by default</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="openOnMobile"
                    checked={config.openOnMobile}
                    onChange={(e) => updateConfig('openOnMobile', e.target.checked)}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded"
                  />
                  <label htmlFor="openOnMobile" className="text-sm text-gray-700">Open widget on mobile screen</label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Code Section */}
          <div className="space-y-6">
            {/* Live Preview Toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <LuEye size={20} className="text-teal-600" />
                  Live Preview
                </h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showPreview 
                      ? 'bg-teal-600 text-white hover:bg-teal-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              {showPreview && (
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 min-h-[400px]">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    <span>Your website content here</span>
                  </div>
                  
                  {/* Widget Preview */}
                  <div 
                    className="absolute" 
                    style={{
                      [config.position === 'bottom-right' ? 'right' : 'left']: `${config.position === 'bottom-right' ? config.marginRight : config.marginLeft}px`,
                      bottom: `${config.marginBottom}px`
                    }}
                  >
                    <div className="relative">
                      {/* Chat Box */}
                      <div 
                        className="w-80 bg-white rounded-xl shadow-2xl overflow-hidden mb-4"
                        style={{ borderRadius: `${config.borderRadius}px` }}
                      >
                        <div 
                       className="p-4 text-white relative"
                          style={{ backgroundColor: config.brandColor }}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={config.brandImageUrl || 'https://res.cloudinary.com/dzpusvj9o/image/upload/v1761477388/download_bpvqer.png'} 
                              alt={config.brandName}
                              className="w-12 h-12 rounded-full border-2 border-white object-cover"
                            />
                            <div>
                              <div className="font-semibold">{config.brandName}</div>
                              <div className="text-xs opacity-90">{config.brandSubtitle}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-5 bg-[#E5DDD5]">
                          <div className="bg-white p-3 rounded-lg mb-4 text-sm whitespace-pre-line shadow-sm text-gray-800">
                            {config.welcomeMessage}
                          </div>
                          <button 
                            className="w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
                            style={{ backgroundColor: config.brandColor }}
                          >
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            {config.ctaText}
                          </button>
                        </div>
                      </div>

                      {/* WhatsApp Button */}
                      <div className="w-16 h-16 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Code */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <LuCode size={20} className="text-teal-600" />
                  Generated Snippet
                </h2>
                <button
                  onClick={copySnippet}
                  disabled={!config.phoneNumber || config.phoneNumber.replace(/\D/g, '').length < 10}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                    !config.phoneNumber || config.phoneNumber.replace(/\D/g, '').length < 10
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              {!config.phoneNumber || config.phoneNumber.replace(/\D/g, '').length < 10 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <LuCircleAlert className="mx-auto mb-3 text-yellow-600" size={48} />
                  <h3 className="font-medium text-yellow-900 mb-2">Phone Number Required</h3>
                  <p className="text-sm text-yellow-800">
                    Please enter a valid WhatsApp phone number above to generate the widget code
                  </p>
                </div>
              ) : (
                <>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-96">
                    <code>{generateSnippet()}</code>
                  </pre>

                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2 text-sm">Installation Instructions:</h3>
                    <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                      <li>Copy the generated snippet above</li>
                      <li>Paste it before the closing &lt;/body&gt; tag in your HTML</li>
                      <li>Save and refresh your website to see the widget</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
