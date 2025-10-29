"use client";

import { useState, useRef } from 'react';
import { LuLink, LuQrCode, LuCopy, LuCheck, LuDownload, LuPhone, LuMessageSquare } from 'react-icons/lu';
import QRCode from 'qrcode';

export default function WhatsAppLinkGenerator() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const generateLink = () => {
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    // Remove all non-numeric characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Validate phone number (should have at least 10 digits)
    if (cleanNumber.length < 10) {
      alert('Please enter a valid phone number with at least 10 digits');
      return;
    }
    
    // Encode the message for URL
    const encodedMessage = message ? encodeURIComponent(message) : '';
    
    // Generate WhatsApp link
    const link = `https://wa.me/${cleanNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
    setGeneratedLink(link);

    // Generate QR Code
    generateQRCode(link);
  };

  const generateQRCode = async (link: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        color: {
          dark: '#156D6C',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `whatsapp-qr-${phoneNumber}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <LuLink className="text-white" size={24} />
            </div>
            WhatsApp Link Generator
          </h1>
          <p className="text-gray-600">Create shareable links & QR codes for your WhatsApp Business number</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <LuPhone size={20} className="text-teal-600" />
              Configure Your Link
            </h2>

            <div className="space-y-5">
              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Business Number *
                </label>
                <div className="relative">
                  <LuPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Include country code (e.g., +1 for USA, +91 for India)
                </p>
              </div>

              {/* Pre-filled Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pre-filled Message (Optional)
                </label>
                <div className="relative">
                  <LuMessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi, I'm interested in your services..."
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  This message will appear when users click your link
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateLink}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <LuQrCode size={20} />
                Generate Link & QR Code
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <LuQrCode size={20} className="text-teal-600" />
              Generated Assets
            </h2>

            {generatedLink ? (
              <div className="space-y-6">
                {/* Generated Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                    >
                      {copied ? <LuCheck size={18} /> : <LuCopy size={18} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                {qrCodeDataUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      QR Code
                    </label>
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="WhatsApp QR Code" 
                        className="w-64 h-64 border-4 border-white shadow-lg rounded-lg"
                      />
                      <button
                        onClick={downloadQRCode}
                        className="mt-4 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
                      >
                        <LuDownload size={18} />
                        Download QR Code
                      </button>
                    </div>
                  </div>
                )}

                {/* Usage Instructions */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="font-medium text-teal-900 mb-2 text-sm">How to Use:</h3>
                  <ul className="text-sm text-teal-800 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600 mt-0.5">•</span>
                      <span>Share the link on social media, email, or your website</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600 mt-0.5">•</span>
                      <span>Print the QR code on business cards, flyers, or packaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600 mt-0.5">•</span>
                      <span>Customers can scan to start WhatsApp conversation instantly</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <LuQrCode size={64} className="mb-4 opacity-20" />
                <p className="text-sm">Generate a link to see your QR code here</p>
              </div>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
              <LuLink className="text-teal-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Connection</h3>
            <p className="text-sm text-gray-600">
              Users click your link and start chatting immediately without saving your number
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
              <LuQrCode className="text-teal-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">QR Code Ready</h3>
            <p className="text-sm text-gray-600">
              Download high-quality QR codes for print materials and offline marketing
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
              <LuMessageSquare className="text-teal-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Pre-filled Messages</h3>
            <p className="text-sm text-gray-600">
              Set default messages to guide conversations and improve response rates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
