'use client';

import { useState, useEffect } from 'react';
import { 
  LuMail, 
  LuSend, 
  LuUsers, 
  LuFileText, 
  LuEye, 
  LuTrash2,
  LuLoader,
  LuCircleAlert,
  LuCheck,
  LuX,
  LuCode,
  LuMonitor,
  LuSmartphone,
  LuBold,
  LuItalic,
  LuUnderline,
  LuHeading1,
  LuHeading2,
  LuList,
  LuLink,
  LuSettings,
  LuLogOut,
  LuPlus,
  LuMinus,
  LuCircleCheck,
  LuType,
  LuImage,
  LuAlignLeft
} from 'react-icons/lu';
import { apiService } from '../services/apiService';

interface EmailDashboardProps {
  onDisconnect: () => void;
  hideHeader?: boolean;
}

interface Contact {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'html' | 'plain';
}

export default function EmailDashboard({ onDisconnect, hideHeader = false }: EmailDashboardProps) {
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [manualEmails, setManualEmails] = useState('');
  
  // Email form state
  const [subject, setSubject] = useState('');
  const [fromName, setFromName] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'plain' | 'html'>('html');
  
  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [tempSelectedContacts, setTempSelectedContacts] = useState<string[]>([]);
  
  // Alert/Confirmation modals
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: 'error' | 'info' }>({ 
    show: false, 
    message: '', 
    type: 'info' 
  });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ 
    show: false, 
    message: '', 
    onConfirm: () => {} 
  });

  useEffect(() => {
    fetchEmailConfig();
    fetchContacts();
    fetchTemplates();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      const response = await apiService.get('/api/email/config');
      setEmailConfig(response);
    } catch (error) {
      console.error('Failed to fetch email config:', error);
    }
  };

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    // Using hardcoded templates - replace with API call when backend is ready
    setTimeout(() => {
      setTemplates([
        {
          id: '1',
          name: 'Welcome Email',
          subject: 'Welcome to Our Platform!',
          content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Welcome Aboard! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px;">Hi there,</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">We're thrilled to have you join our community! Your account has been successfully created, and you're all set to get started.</p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 30px;">Click the button below to explore your dashboard and discover all the amazing features we have for you.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Get Started</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 14px; margin: 0;">If you have any questions, feel free to reach out to our support team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
          type: 'html' as 'html' | 'plain'
        },
        {
          id: '2',
          name: 'Order Confirmation',
          subject: 'Your Order #{{order_number}} Has Been Confirmed',
          content: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;"><tr><td style="padding: 40px 30px; text-align: center; border-bottom: 3px solid #4CAF50;"><h1 style="color: #4CAF50; margin: 0; font-size: 28px;">✓ Order Confirmed</h1></td></tr><tr><td style="padding: 40px 30px;"><p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">Thank you for your order! We're preparing your items for shipment.</p><table width="100%" cellpadding="10" style="background-color: #f8f9fa; border-radius: 5px; margin: 20px 0;"><tr><td style="color: #666666;"><strong>Order Number:</strong></td><td style="color: #333333; text-align: right;">#12345</td></tr><tr><td style="color: #666666;"><strong>Order Date:</strong></td><td style="color: #333333; text-align: right;">January 15, 2024</td></tr><tr><td style="color: #666666;"><strong>Total Amount:</strong></td><td style="color: #333333; text-align: right; font-weight: bold;">$99.99</td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;"><tr><td align="center"><a href="#" style="background-color: #4CAF50; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Track Your Order</a></td></tr></table></td></tr></table></td></tr></table></body></html>`,
          type: 'html' as 'html' | 'plain'
        },
        {
          id: '3',
          name: 'Password Reset',
          subject: 'Reset Your Password',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;"><tr><td style="padding: 40px 30px; text-align: center;"><div style="width: 80px; height: 80px; background-color: #ff6b6b; border-radius: 50%; margin: 0 auto 20px;"><span style="color: #ffffff; font-size: 40px; line-height: 80px;">🔒</span></div><h1 style="color: #333333; margin: 0 0 10px; font-size: 28px;">Password Reset Request</h1><p style="color: #999999; margin: 0;">We received a request to reset your password</p></td></tr><tr><td style="padding: 0 30px 40px;"><p style="color: #666666; line-height: 1.6; margin: 0 0 30px;">Click the button below to reset your password. This link will expire in 1 hour.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color: #ff6b6b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a></td></tr></table><p style="color: #999999; font-size: 14px; margin: 30px 0 0; text-align: center;">If you didn't request this, please ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html' as 'html' | 'plain'
        },
        {
          id: '4',
          name: 'Newsletter Monthly',
          subject: 'Your Monthly Newsletter - {{month}}',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;"><tr><td style="background-color: #2c3e50; padding: 30px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 32px;">Monthly Update</h1><p style="color: #ecf0f1; margin: 10px 0 0;">January 2024</p></td></tr><tr><td style="padding: 40px 30px;"><h2 style="color: #2c3e50; margin: 0 0 20px;">What's New This Month</h2><p style="color: #666666; line-height: 1.6;">Check out our latest features, blog posts, and community highlights.</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html' as 'html' | 'plain'
        },
        {
          id: '5',
          name: 'Promotional Sale',
          subject: '🔥 Flash Sale: 50% OFF Everything!',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); border-radius: 8px;"><tr><td style="padding: 60px 30px; text-align: center;"><h1 style="color: #ffffff; margin: 0 0 10px; font-size: 48px; text-transform: uppercase;">FLASH SALE</h1><p style="color: #ffffff; font-size: 24px; margin: 0 0 30px;">50% OFF EVERYTHING</p><div style="background-color: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; margin: 0 0 30px;"><p style="color: #ffffff; font-size: 18px; margin: 0;">Use Code: <strong style="font-size: 28px; letter-spacing: 2px;">FLASH50</strong></p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color: #ffffff; color: #FF6B6B; text-decoration: none; padding: 20px 60px; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 18px; text-transform: uppercase;">Shop Now</a></td></tr></table><p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 30px 0 0;">⏰ Hurry! Sale ends in 24 hours</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html' as 'html' | 'plain'
        },
        {
          id: '6',
          name: 'Account Verification',
          subject: 'Verify Your Email Address',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;"><tr><td style="padding: 40px 30px; text-align: center; border-bottom: 4px solid #5865F2;"><h1 style="color: #5865F2; margin: 0; font-size: 28px;">📧 Verify Your Email</h1></td></tr><tr><td style="padding: 40px 30px;"><p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">Thanks for signing up! Please verify your email address to complete your registration.</p><div style="background-color: #f8f9fa; border-left: 4px solid #5865F2; padding: 20px; margin: 20px 0; border-radius: 4px;"><p style="color: #5865F2; font-weight: bold; margin: 0 0 10px;">Verification Code:</p><p style="color: #333333; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">123456</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color: #5865F2; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a></td></tr></table></td></tr></table></td></tr></table></body></html>`,
          type: 'html' as 'html' | 'plain'
        },
        {
          id: '7',
          name: 'Invoice Receipt',
          subject: 'Invoice #{{invoice_number}} - Payment Received',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border: 2px solid #e0e0e0;"><tr><td style="padding: 40px 30px; border-bottom: 3px solid #2196F3;"><h1 style="color: #333333; margin: 0; font-size: 24px;">INVOICE</h1><p style="color: #999999; margin: 5px 0 0;">#INV-2024-001</p></td></tr><tr><td style="padding: 30px;"><p style="color: #4CAF50; font-weight: bold; text-align: center; margin: 20px 0;">✓ PAID</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '8',
          name: 'Event Invitation',
          subject: 'You\'re Invited! Join Us for {{event_name}}',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;"><tr><td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px 30px; text-align: center;"><h1 style="color: #ffffff; margin: 0 0 15px; font-size: 36px;">🎉 You're Invited!</h1><p style="color: #ffffff; font-size: 18px; margin: 0;">Join us for an exclusive event</p></td></tr><tr><td style="padding: 40px 30px;"><h2 style="color: #333333; margin: 0 0 20px; text-align: center;">Annual Summit 2024</h2><p style="color: #666666; line-height: 1.6;">Network with industry leaders and enjoy great food.</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '9',
          name: 'Shipping Notification',
          subject: 'Your Order Has Shipped! 📦',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;"><tr><td style="padding: 40px 30px; text-align: center;"><h1 style="color: #333333; margin: 0 0 10px; font-size: 28px;">Your Order Is On Its Way!</h1><p style="color: #999999; margin: 0;">Tracking Number: <strong>1Z999AA10123456784</strong></p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '10',
          name: 'Subscription Renewal',
          subject: 'Your Subscription Will Renew Soon',
          content: `<!DOCTYPE html><html><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;"><tr><td style="background-color: #FFC107; padding: 30px; text-align: center;"><h1 style="color: #333333; margin: 0; font-size: 28px;">⏰ Renewal Reminder</h1></td></tr><tr><td style="padding: 40px 30px;"><p style="color: #666666; line-height: 1.6;">Your subscription will renew on February 1, 2024.</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '11',
          name: 'Feedback Request',
          subject: 'We\'d Love Your Feedback! ⭐',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="padding:40px 30px;text-align:center;"><h1 style="color:#FF9800;margin:0 0 10px;font-size:32px;">⭐⭐⭐⭐⭐</h1><h2 style="color:#333333;margin:0 0 10px;">How Did We Do?</h2><p style="color:#666666;margin:0;">Your opinion matters to us!</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '12',
          name: 'Product Launch',
          subject: '🚀 Introducing Our Latest Product!',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#000000;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px;"><tr><td style="padding:50px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:42px;">🚀 New Launch</h1><h2 style="color:#ffffff;margin:0 0 20px;font-size:28px;">Meet Our Game-Changer</h2></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '13',
          name: 'Abandoned Cart',
          subject: 'Don\'t Forget Your Items! 🛒',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="padding:40px 30px;text-align:center;border-bottom:3px solid #FF6B6B;"><h1 style="color:#FF6B6B;margin:0;font-size:28px;">🛒 You Left Items Behind</h1></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '14',
          name: 'Referral Program',
          subject: 'Give $10, Get $10 - Refer Friends! 🎁',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">🎁 Share the Love</h1><p style="color:#ffffff;font-size:18px;margin:0;">Give $10, Get $10</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '15',
          name: 'Birthday Wishes',
          subject: 'Happy Birthday! 🎂 Here\'s a Gift',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#FFF5F5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF5F5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:3px solid #FF6B9D;"><tr><td style="padding:50px 30px;text-align:center;"><h1 style="color:#FF6B9D;margin:0 0 20px;font-size:48px;">🎂🎉🎈</h1><h2 style="color:#333333;margin:0 0 10px;font-size:32px;">Happy Birthday!</h2></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '16',
          name: 'Webinar Invitation',
          subject: 'Free Webinar: Master {{topic}} in 60 Minutes',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#1e3a8a;padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">🎓 Free Webinar</h1><p style="color:#93c5fd;font-size:18px;margin:0;">Learn From Industry Experts</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '17',
          name: 'Payment Failed',
          subject: 'Action Required: Payment Failed',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:2px solid #ef4444;"><tr><td style="padding:40px 30px;text-align:center;"><h1 style="color:#dc2626;margin:0 0 10px;font-size:28px;">Payment Failed</h1></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '18',
          name: 'Re-engagement',
          subject: 'We Miss You! Come Back for 30% OFF',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="padding:50px 30px;text-align:center;"><h1 style="color:#8b5cf6;margin:0 0 20px;font-size:42px;">We Miss You! 💜</h1><p style="color:#666666;font-size:18px;">It's been a while since your last visit.</p></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '19',
          name: 'Survey Request',
          subject: 'Quick Survey: Help Us Improve (2 Minutes)',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#10b981;padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">📊 Quick Survey</h1></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '20',
          name: 'Holiday Greetings',
          subject: 'Season\'s Greetings from Our Team! 🎄',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0f172a;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background:linear-gradient(135deg,#dc2626 0%,#16a34a 100%);padding:50px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:42px;">🎄 Happy Holidays! 🎁</h1></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '21',
          name: 'Trial Expiring',
          subject: 'Your Free Trial Expires in 3 Days',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#f59e0b;padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;">⏰ Trial Ending Soon</h1></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        },
        {
          id: '22',
          name: 'Team Invitation',
          subject: 'You\'ve Been Invited to Join {{company_name}}',
          content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#6366f1;padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">👥 Team Invitation</h1></td></tr></table></td></tr></table></body></html>`,
          type: 'html'
        }
      ]);
      setIsLoadingTemplates(false);
    }, 500);
  };

  const fetchContacts = async () => {
    try {
      const response = await apiService.get('/contacts');
      setContacts(response.contacts || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleDisconnect = async () => {
    setConfirmModal({
      show: true,
      message: 'Are you sure you want to disconnect your email account?',
      onConfirm: async () => {
        try {
          await apiService.delete('/api/email/config');
          onDisconnect();
        } catch (error) {
          console.error('Failed to disconnect:', error);
        }
        setConfirmModal({ show: false, message: '', onConfirm: () => {} });
      }
    });
  };

  const handleSelectAll = () => {
    if (tempSelectedContacts.length === contacts.length) {
      setTempSelectedContacts([]);
    } else {
      setTempSelectedContacts(contacts.map(c => c._id));
    }
  };

  const handleContactToggleInModal = (contactId: string) => {
    setTempSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleAddContactsToEmails = () => {
    const selectedEmails = contacts
      .filter(c => tempSelectedContacts.includes(c._id))
      .map(c => c.email);
    
    const currentEmails = manualEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);
    
    const allEmails = [...new Set([...currentEmails, ...selectedEmails])];
    setManualEmails(allEmails.join(', '));
    setShowContactsModal(false);
    setTempSelectedContacts([]);
  };

  const handleOpenContactsModal = () => {
    setTempSelectedContacts([]);
    setShowContactsModal(true);
  };

  const handleApplyTemplate = (template: Template) => {
    setSubject(template.subject);
    setContent(template.content);
    setContentType(template.type);
    setShowTemplateModal(false);
    setPreviewTemplate(null);
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
  };

  const getTotalRecipients = () => {
    const manualEmailsList = manualEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);
    return manualEmailsList.length;
  };

  const handleSend = async () => {
    if (getTotalRecipients() === 0) {
      setAlertModal({ show: true, message: 'Please select at least one recipient', type: 'error' });
      return;
    }

    if (!subject || !content) {
      setAlertModal({ show: true, message: 'Please fill in both subject and content', type: 'error' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const recipients = manualEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);

      const response = await apiService.post('/api/email/send-bulk', {
        recipients,
        subject,
        from_name: fromName,
        content,
        content_type: contentType
      });

      setSendResult(response);
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.response?.data?.detail || 'Failed to send emails',
        total_sent: 0,
        total_failed: getTotalRecipients()
      });
    } finally {
      setIsSending(false);
    }
  };

  const insertHtml = (openTag: string, closeTag: string) => {
    const textarea = document.querySelector('textarea[placeholder*="HTML"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + openTag + selectedText + closeTag + content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        {!hideHeader && (
          <div className="bg-transparent rounded-3xl p-10 mb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <LuMail size={36} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Email Campaign Studio
                  </h1>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <p className="text-sm text-gray-600">
                      Connected as <span className="font-semibold text-gray-900">{emailConfig?.email}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => {/* Settings placeholder */}}
                  className="p-5 bg-white/80 hover:bg-white rounded-2xl transition-all duration-200 group backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl"
                >
                  <LuSettings size={22} className="text-gray-900 group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white hover:bg-gray-800 rounded-2xl transition-all duration-200 font-bold shadow-xl"
                >
                  <LuLogOut size={20} />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recipients Section - At Top */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-white p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <LuUsers size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">
                    Recipients
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Total: {getTotalRecipients()} recipients
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenContactsModal}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-semibold flex items-center gap-2 shadow-md"
              >
                <LuUsers size={18} />
                Select from Contacts
              </button>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
            {/* Manual Email Input */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <LuMail size={16} />
                Email Recipients
              </label>
              <textarea
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com, email3@example.com"
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none font-mono"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <LuCircleAlert size={12} />
                Separate emails with commas or use the "Select from Contacts" button above
              </p>
            </div>
          </div>
        </div>

        {/* Compose Email Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-white p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <LuFileText size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-xl">
                  Compose Email
                </h3>
              </div>
              <div className="flex items-center gap-4">
                {/* Content Type Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                  <button
                    onClick={() => setContentType('html')}
                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-semibold ${
                      contentType === 'html'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LuCode size={16} />
                      HTML
                    </div>
                  </button>
                  <button
                    onClick={() => setContentType('plain')}
                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-semibold ${
                      contentType === 'plain'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LuAlignLeft size={16} />
                      Plain
                    </div>
                  </button>
                </div>

                {/* Preview Toggle */}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold ${
                    showPreview
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <LuEye size={16} />
                  Preview
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-gray-50">
            {/* From Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <LuType size={16} />
                From Name <span className="text-gray-400 font-normal normal-case">(Optional)</span>
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="e.g., StitchByte Team"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-medium"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <LuMail size={16} />
                Email Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter your email subject..."
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-medium"
              />
            </div>

            {/* Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                  <LuFileText size={16} />
                  Email Content
                </label>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                >
                  <LuFileText size={16} />
                  Select from Template
                </button>
              </div>
              
              {contentType === 'html' ? (
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  {/* Simple HTML Toolbar */}
                  <div className="bg-gray-100 border-b border-gray-200 p-4 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => insertHtml('<h1>', '</h1>')}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-gray-300"
                      title="Heading 1"
                    >
                      <LuHeading1 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtml('<h2>', '</h2>')}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-gray-300"
                      title="Heading 2"
                    >
                      <LuHeading2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtml('<strong>', '</strong>')}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-gray-300"
                      title="Bold"
                    >
                      <LuBold size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtml('<em>', '</em>')}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-gray-300"
                      title="Italic"
                    >
                      <LuItalic size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtml('<u>', '</u>')}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-gray-300"
                      title="Underline"
                    >
                      <LuUnderline size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtml('<ul><li>', '</li></ul>')}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-gray-300"
                      title="Bullet List"
                    >
                      <LuList size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtml('<a href="">', '</a>')}
                      className="p-2 hover:bg-white rounded-xl transition-all duration-200 border border-transparent hover:border-gray-300"
                      title="Link"
                    >
                      <LuLink size={18} />
                    </button>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<h1>Hello!</h1><p>Write your HTML email content here...</p>"
                    rows={12}
                    className="w-full px-4 py-3 border-0 bg-white text-gray-900 focus:ring-0 resize-none font-mono text-sm"
                  />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your email content here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none text-sm"
                />
              )}
            </div>

            {/* Send Button */}
            <div className="pt-4">
              <button
                onClick={handleSend}
                disabled={isSending || getTotalRecipients() === 0}
                className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSending ? (
                  <>
                    <LuLoader size={24} className="animate-spin" />
                    Sending Emails...
                  </>
                ) : (
                  <>
                    <LuSend size={24} />
                    Send to {getTotalRecipients()} Recipient{getTotalRecipients() !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Send Result */}
        {sendResult && (
          <div className={`mt-8 rounded-2xl p-6 border shadow-lg ${
            sendResult.success
              ? 'bg-white border-gray-900'
              : 'bg-white border-gray-900'
          }`}>
            <div className="flex items-start gap-5">
              {sendResult.success ? (
                <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <LuCheck size={24} className="text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <LuCircleAlert size={24} className="text-white" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-2">
                  {sendResult.message}
                </h4>
                <div className="text-sm space-y-2 text-gray-700">
                  <p className="flex items-center gap-2">
                    <LuCircleCheck size={16} />
                    Successfully sent: <span className="font-bold text-gray-900">{sendResult.total_sent}</span>
                  </p>
                  {sendResult.total_failed > 0 && (
                    <p className="flex items-center gap-2">
                      <LuCircleAlert size={16} />
                      Failed: <span className="font-bold text-gray-900">{sendResult.total_failed}</span>
                    </p>
                  )}
                  {sendResult.failed_emails && sendResult.failed_emails.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer font-semibold hover:text-gray-900 flex items-center gap-2">
                        <LuCircleAlert size={14} />
                        View failed emails
                      </summary>
                      <ul className="mt-2 space-y-1 ml-6 text-xs font-mono">
                        {sendResult.failed_emails.map((email: string, idx: number) => (
                          <li key={idx} className="text-gray-600">• {email}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSendResult(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-900 hover:text-white rounded-xl transition-all duration-200"
              >
                <LuX size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Contacts Selection Modal */}
        {showContactsModal && (
          <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 p-5 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                    <LuUsers size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Select Contacts
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {tempSelectedContacts.length} selected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-semibold flex items-center gap-2"
                  >
                    {tempSelectedContacts.length === contacts.length ? (
                      <>
                        <LuMinus size={16} />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <LuPlus size={16} />
                        Select All
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowContactsModal(false)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-900 hover:text-white rounded-xl transition-all duration-200"
                  >
                    <LuX size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-gray-50">
                {isLoadingContacts ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <LuLoader size={32} className="animate-spin text-gray-900 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Loading contacts...</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LuUsers size={32} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">No contacts found</p>
                    <p className="text-xs text-gray-400 mt-1">Add contacts to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <label
                        key={contact._id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-900 cursor-pointer transition-all duration-200 group"
                      >
                        <input
                          type="checkbox"
                          checked={tempSelectedContacts.includes(contact._id)}
                          onChange={() => handleContactToggleInModal(contact._id)}
                          className="w-5 h-5 text-gray-900 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {contact.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {contact.email}
                          </p>
                        </div>
                        <LuCircleCheck 
                          size={20} 
                          className={`transition-all duration-200 ${
                            tempSelectedContacts.includes(contact._id) 
                              ? 'text-gray-900 opacity-100' 
                              : 'text-gray-300 opacity-0 group-hover:opacity-50'
                          }`} 
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 bg-white flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {tempSelectedContacts.length} contact{tempSelectedContacts.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowContactsModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddContactsToEmails}
                    disabled={tempSelectedContacts.length === 0}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <LuCheck size={18} />
                    Add {tempSelectedContacts.length} to Recipients
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 p-5 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
              {/* Preview Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                    <LuEye size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Email Preview
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  {/* Device Toggle */}
                  <div className="flex bg-gray-200 rounded-xl p-1">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 font-semibold ${
                        previewDevice === 'desktop'
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <LuMonitor size={18} />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 font-semibold ${
                        previewDevice === 'mobile'
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <LuSmartphone size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-900 hover:text-white rounded-xl transition-all duration-200"
                  >
                    <LuX size={20} />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)] bg-gray-100">
                <div
                  className={`mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all border border-gray-200 ${
                    previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-3xl'
                  }`}
                >
                  {/* Email Header */}
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <LuMail size={14} />
                      <strong className="text-gray-900">From:</strong> {fromName || 'Your Company'} &lt;{emailConfig?.email}&gt;
                    </div>
                    <div className="text-sm text-gray-700 mb-4 flex items-center gap-2">
                      <LuUsers size={14} />
                      <strong className="text-gray-900">To:</strong> {getTotalRecipients()} recipient{getTotalRecipients() !== 1 ? 's' : ''}
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">
                      {subject || '(No Subject)'}
                    </h2>
                  </div>

                  {/* Email Body */}
                  <div className="p-8 bg-white">
                    {contentType === 'html' ? (
                      <div
                        className="prose max-w-none text-gray-900"
                        dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">No content yet...</p>' }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-gray-900">
                        {content || 'No content yet...'}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {alertModal.show && (
          <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 p-5 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    alertModal.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <LuCircleAlert size={24} className={alertModal.type === 'error' ? 'text-red-600' : 'text-blue-600'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {alertModal.type === 'error' ? 'Error' : 'Information'}
                    </h3>
                    <p className="text-gray-700">
                      {alertModal.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setAlertModal({ show: false, message: '', type: 'info' })}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-semibold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.show && (
          <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 p-5 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <LuCircleAlert size={24} className="text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Confirm Action
                    </h3>
                    <p className="text-gray-700">
                      {confirmModal.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => {} })}
                  className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 p-5 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 flex">
              {/* Template List */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">Select Template</h3>
                  <p className="text-sm text-gray-600 mt-1">Choose from your saved templates</p>
                </div>
                
                <div className="p-4">
                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <LuLoader size={32} className="animate-spin text-gray-400" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12">
                      <LuFileText size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">No templates found</p>
                      <p className="text-gray-400 text-xs mt-2">Create templates in the Templates page</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            previewTemplate?.id === template.id
                              ? 'border-gray-900 bg-gray-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <h4 className="font-bold text-gray-900 mb-1">{template.name}</h4>
                          <p className="text-xs text-gray-500 mb-2">{template.subject}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                              template.type === 'html' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {template.type.toUpperCase()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewTemplate(template);
                              }}
                              className="ml-auto flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-semibold"
                            >
                              <LuEye size={14} />
                              Preview
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Panel */}
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Preview</h3>
                      {previewTemplate && (
                        <p className="text-sm text-gray-600 mt-1">{previewTemplate.name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowTemplateModal(false);
                        setPreviewTemplate(null);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all"
                    >
                      <LuX size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {!previewTemplate ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <LuFileText size={64} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Select a template to preview</p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-3xl mx-auto">
                      {/* Subject Preview */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Subject</label>
                        <p className="text-gray-900 font-semibold">{previewTemplate.subject}</p>
                      </div>

                      {/* Content Preview */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 mb-4 uppercase tracking-wide">Content</label>
                        {previewTemplate.type === 'html' ? (
                          <div
                            className="prose max-w-none text-gray-900"
                            dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans text-gray-900 text-sm">
                            {previewTemplate.content}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {previewTemplate && (
                  <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowTemplateModal(false);
                        setPreviewTemplate(null);
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleApplyTemplate(previewTemplate)}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-semibold flex items-center gap-2"
                    >
                      <LuCheck size={18} />
                      Use This Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
