'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LuMail,
  LuFileText,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuCopy,
  LuArrowLeft,
  LuSave,
  LuX,
  LuCode,
  LuEye
} from 'react-icons/lu';
import { apiService } from '../../services/apiService';

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'html' | 'plain';
  created_at: string;
  updated_at: string;
}

export default function EmailTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'html' as 'html' | 'plain'
  });

  useEffect(() => {
    // Pre-built professional email templates
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
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '2',
        name: 'Order Confirmation',
        subject: 'Your Order #{{order_number}} Has Been Confirmed',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 3px solid #4CAF50;">
              <h1 style="color: #4CAF50; margin: 0; font-size: 28px;">✓ Order Confirmed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">Thank you for your order! We're preparing your items for shipment.</p>
              <table width="100%" cellpadding="10" style="background-color: #f8f9fa; border-radius: 5px; margin: 20px 0;">
                <tr>
                  <td style="color: #666666;"><strong>Order Number:</strong></td>
                  <td style="color: #333333; text-align: right;">#12345</td>
                </tr>
                <tr>
                  <td style="color: #666666;"><strong>Order Date:</strong></td>
                  <td style="color: #333333; text-align: right;">January 15, 2024</td>
                </tr>
                <tr>
                  <td style="color: #666666;"><strong>Total Amount:</strong></td>
                  <td style="color: #333333; text-align: right; font-weight: bold;">$99.99</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="#" style="background-color: #4CAF50; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Track Your Order</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '3',
        name: 'Password Reset',
        subject: 'Reset Your Password',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #ff6b6b; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 40px;">🔒</span>
              </div>
              <h1 style="color: #333333; margin: 0 0 10px; font-size: 28px;">Password Reset Request</h1>
              <p style="color: #999999; margin: 0;">We received a request to reset your password</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px;">
              <p style="color: #666666; line-height: 1.6; margin: 0 0 30px;">Click the button below to reset your password. This link will expire in 1 hour.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="background-color: #ff6b6b; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="color: #999999; font-size: 14px; margin: 30px 0 0; text-align: center;">If you didn't request this, please ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '4',
        name: 'Newsletter Monthly',
        subject: 'Your Monthly Newsletter - {{month}}',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
          <tr>
            <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Monthly Update</h1>
              <p style="color: #ecf0f1; margin: 10px 0 0;">January 2024</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #2c3e50; margin: 0 0 20px;">What's New This Month</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <h3 style="color: #34495e; margin: 0 0 10px;">Feature Update 🚀</h3>
                    <p style="color: #666666; line-height: 1.6; margin: 0;">We've launched an amazing new feature that will revolutionize your workflow.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <h3 style="color: #34495e; margin: 0 0 10px;">Blog Post 📝</h3>
                    <p style="color: #666666; line-height: 1.6; margin: 0;">Check out our latest article on industry best practices.</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h3 style="color: #34495e; margin: 0 0 10px;">Community Spotlight 🌟</h3>
                    <p style="color: #666666; line-height: 1.6; margin: 0;">Meet our featured community member of the month!</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="background-color: #3498db; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Read More</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ecf0f1; padding: 20px 30px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 12px; margin: 0;">© 2024 Your Company. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '5',
        name: 'Promotional Sale',
        subject: '🔥 Flash Sale: 50% OFF Everything!',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); border-radius: 8px;">
          <tr>
            <td style="padding: 60px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 48px; text-transform: uppercase;">FLASH SALE</h1>
              <p style="color: #ffffff; font-size: 24px; margin: 0 0 30px;">50% OFF EVERYTHING</p>
              <div style="background-color: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <p style="color: #ffffff; font-size: 18px; margin: 0;">Use Code: <strong style="font-size: 28px; letter-spacing: 2px;">FLASH50</strong></p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="background-color: #ffffff; color: #FF6B6B; text-decoration: none; padding: 20px 60px; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 18px; text-transform: uppercase;">Shop Now</a>
                  </td>
                </tr>
              </table>
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 30px 0 0;">⏰ Hurry! Sale ends in 24 hours</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '6',
        name: 'Account Verification',
        subject: 'Verify Your Email Address',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 4px solid #5865F2;">
              <h1 style="color: #5865F2; margin: 0; font-size: 28px;">📧 Verify Your Email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">Thanks for signing up! Please verify your email address to complete your registration.</p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #5865F2; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #5865F2; font-weight: bold; margin: 0 0 10px;">Verification Code:</p>
                <p style="color: #333333; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">123456</p>
              </div>
              <p style="color: #666666; line-height: 1.6; margin: 20px 0;">Or click the button below:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="background-color: #5865F2; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
                  </td>
                </tr>
              </table>
              <p style="color: #999999; font-size: 12px; margin: 30px 0 0; text-align: center;">This link expires in 24 hours</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '7',
        name: 'Invoice Receipt',
        subject: 'Invoice #{{invoice_number}} - Payment Received',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border: 2px solid #e0e0e0;">
          <tr>
            <td style="padding: 40px 30px; border-bottom: 3px solid #2196F3;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="color: #333333; margin: 0; font-size: 24px;">INVOICE</h1>
                    <p style="color: #999999; margin: 5px 0 0;">#INV-2024-001</p>
                  </td>
                  <td align="right">
                    <p style="color: #666666; margin: 0; font-size: 14px;">Date: Jan 15, 2024</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="10" style="margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                  <th style="text-align: left; color: #666666; font-size: 12px; text-transform: uppercase;">Item</th>
                  <th style="text-align: center; color: #666666; font-size: 12px; text-transform: uppercase;">Qty</th>
                  <th style="text-align: right; color: #666666; font-size: 12px; text-transform: uppercase;">Amount</th>
                </tr>
                <tr>
                  <td style="color: #333333; padding: 15px 10px; border-bottom: 1px solid #e0e0e0;">Premium Subscription</td>
                  <td style="color: #333333; text-align: center; border-bottom: 1px solid #e0e0e0;">1</td>
                  <td style="color: #333333; text-align: right; border-bottom: 1px solid #e0e0e0;">$99.00</td>
                </tr>
                <tr>
                  <td colspan="2" style="color: #666666; padding: 15px 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                  <td style="color: #333333; text-align: right;">$99.00</td>
                </tr>
                <tr>
                  <td colspan="2" style="color: #666666; padding: 15px 10px; text-align: right; font-weight: bold;">Tax (10%):</td>
                  <td style="color: #333333; text-align: right;">$9.90</td>
                </tr>
                <tr style="background-color: #2196F3;">
                  <td colspan="2" style="color: #ffffff; padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">TOTAL:</td>
                  <td style="color: #ffffff; text-align: right; font-weight: bold; font-size: 18px;">$108.90</td>
                </tr>
              </table>
              <p style="color: #4CAF50; font-weight: bold; text-align: center; margin: 20px 0;">✓ PAID</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '8',
        name: 'Event Invitation',
        subject: 'You\'re Invited! Join Us for {{event_name}}',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 15px; font-size: 36px;">🎉 You're Invited!</h1>
              <p style="color: #ffffff; font-size: 18px; margin: 0;">Join us for an exclusive event</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px; text-align: center;">Annual Summit 2024</h2>
              <table width="100%" cellpadding="15" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="color: #666666; border-bottom: 1px solid #e0e0e0;">
                    <strong>📅 Date:</strong> March 15, 2024
                  </td>
                </tr>
                <tr>
                  <td style="color: #666666; border-bottom: 1px solid #e0e0e0;">
                    <strong>🕐 Time:</strong> 10:00 AM - 5:00 PM
                  </td>
                </tr>
                <tr>
                  <td style="color: #666666;">
                    <strong>📍 Location:</strong> Grand Hotel, Main Hall
                  </td>
                </tr>
              </table>
              <p style="color: #666666; line-height: 1.6; margin: 20px 0;">We're excited to announce our biggest event of the year! Network with industry leaders, attend inspiring talks, and enjoy great food.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="#" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 15px 50px; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 16px;">RSVP Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '9',
        name: 'Shipping Notification',
        subject: 'Your Order Has Shipped! 📦',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 50px;">📦</span>
              </div>
              <h1 style="color: #333333; margin: 0 0 10px; font-size: 28px;">Your Order Is On Its Way!</h1>
              <p style="color: #999999; margin: 0;">Tracking Number: <strong>1Z999AA10123456784</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
                <table width="100%" cellpadding="10">
                  <tr>
                    <td style="color: #666666; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999999;">Estimated Delivery</p>
                      <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #667eea;">January 20, 2024</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #666666; padding-top: 15px;">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999999;">Shipping Carrier</p>
                      <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #333333;">UPS Express</p>
                    </td>
                  </tr>
                </table>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold;">Track Package</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '10',
        name: 'Subscription Renewal',
        subject: 'Your Subscription Will Renew Soon',
        content: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="background-color: #FFC107; padding: 30px; text-align: center;">
              <h1 style="color: #333333; margin: 0; font-size: 28px;">⏰ Renewal Reminder</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">Your subscription will automatically renew on <strong>February 1, 2024</strong>.</p>
              <div style="background-color: #fff3cd; border-left: 4px solid #FFC107; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <table width="100%" cellpadding="5">
                  <tr>
                    <td style="color: #666666;">Plan:</td>
                    <td style="color: #333333; font-weight: bold; text-align: right;">Premium Monthly</td>
                  </tr>
                  <tr>
                    <td style="color: #666666;">Amount:</td>
                    <td style="color: #333333; font-weight: bold; text-align: right;">$29.99/month</td>
                  </tr>
                  <tr>
                    <td style="color: #666666;">Next Billing Date:</td>
                    <td style="color: #333333; font-weight: bold; text-align: right;">Feb 1, 2024</td>
                  </tr>
                </table>
              </div>
              <p style="color: #666666; line-height: 1.6; margin: 20px 0;">No action is required. Your payment method on file will be charged automatically.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="#" style="background-color: #FFC107; color: #333333; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold; margin-right: 10px;">Update Payment Method</a>
                    <a href="#" style="background-color: #f8f9fa; color: #666666; text-decoration: none; padding: 15px 40px; border-radius: 5px; display: inline-block; font-weight: bold; border: 1px solid #e0e0e0;">Cancel Subscription</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '11',
        name: 'Feedback Request',
        subject: 'We\'d Love Your Feedback! ⭐',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="padding:40px 30px;text-align:center;"><h1 style="color:#FF9800;margin:0 0 10px;font-size:32px;">⭐⭐⭐⭐⭐</h1><h2 style="color:#333333;margin:0 0 10px;">How Did We Do?</h2><p style="color:#666666;margin:0;">Your opinion matters to us!</p></td></tr><tr><td style="padding:0 30px 40px;"><p style="color:#666666;line-height:1.6;margin:0 0 30px;text-align:center;">We'd love to hear about your experience. Your feedback helps us improve our service.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#FF9800;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;margin:0 5px;">⭐ Rate Us</a></td></tr></table></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '12',
        name: 'Product Launch',
        subject: '🚀 Introducing Our Latest Product!',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#000000;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px;"><tr><td style="padding:50px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:42px;">🚀 New Launch</h1><h2 style="color:#ffffff;margin:0 0 20px;font-size:28px;">Meet Our Game-Changer</h2><p style="color:rgba(255,255,255,0.9);font-size:16px;line-height:1.6;margin:0 0 30px;">The wait is over! We're thrilled to introduce our most innovative product yet.</p><a href="#" style="background-color:#ffffff;color:#667eea;text-decoration:none;padding:18px 50px;border-radius:50px;display:inline-block;font-weight:bold;font-size:18px;">Learn More</a></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '13',
        name: 'Abandoned Cart',
        subject: 'Don\'t Forget Your Items! 🛒',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="padding:40px 30px;text-align:center;border-bottom:3px solid #FF6B6B;"><h1 style="color:#FF6B6B;margin:0;font-size:28px;">🛒 You Left Items Behind</h1></td></tr><tr><td style="padding:40px 30px;"><p style="color:#666666;line-height:1.6;margin:0 0 20px;">Still thinking about your purchase? Your cart is waiting for you!</p><div style="background-color:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;"><p style="color:#333333;font-weight:bold;margin:0 0 10px;">Your Cart Total: $149.99</p><p style="color:#666666;font-size:14px;margin:0;">Free shipping on orders over $100</p></div><p style="color:#FF6B6B;font-weight:bold;text-align:center;margin:20px 0;">⏰ Items reserved for 24 hours</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#FF6B6B;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;">Complete Your Purchase</a></td></tr></table></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '14',
        name: 'Referral Program',
        subject: 'Give $10, Get $10 - Refer Friends! 🎁',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">🎁 Share the Love</h1><p style="color:#ffffff;font-size:18px;margin:0;">Give $10, Get $10</p></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#333333;margin:0 0 20px;text-align:center;">Earn Rewards for Referring Friends</h2><p style="color:#666666;line-height:1.6;margin:0 0 20px;text-align:center;">Share your unique referral link with friends. When they make their first purchase, you both get $10 credit!</p><div style="background-color:#f0fff4;border:2px dashed #38ef7d;border-radius:8px;padding:20px;margin:20px 0;text-align:center;"><p style="color:#666666;margin:0 0 10px;font-size:12px;">YOUR REFERRAL CODE</p><p style="color:#11998e;font-size:24px;font-weight:bold;letter-spacing:2px;margin:0;">FRIEND10</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;">Share Now</a></td></tr></table></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '15',
        name: 'Birthday Wishes',
        subject: 'Happy Birthday! 🎂 Here\'s a Gift',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#FFF5F5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF5F5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:3px solid #FF6B9D;"><tr><td style="padding:50px 30px;text-align:center;"><h1 style="color:#FF6B9D;margin:0 0 20px;font-size:48px;">🎂🎉🎈</h1><h2 style="color:#333333;margin:0 0 10px;font-size:32px;">Happy Birthday!</h2><p style="color:#666666;font-size:18px;margin:0;">We hope your day is as special as you are</p></td></tr><tr><td style="padding:0 30px 40px;"><div style="background:linear-gradient(135deg,#FF6B9D 0%,#FFC371 100%);border-radius:8px;padding:30px;margin:20px 0;text-align:center;"><p style="color:#ffffff;font-size:16px;margin:0 0 10px;">🎁 Birthday Gift Inside</p><p style="color:#ffffff;font-size:32px;font-weight:bold;margin:0;">25% OFF</p><p style="color:#ffffff;font-size:14px;margin:10px 0 0;">Use code: <strong style="background-color:rgba(255,255,255,0.2);padding:5px 15px;border-radius:20px;">BIRTHDAY25</strong></p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#FF6B9D;color:#ffffff;text-decoration:none;padding:15px 50px;border-radius:50px;display:inline-block;font-weight:bold;">Claim Your Gift</a></td></tr></table><p style="color:#999999;font-size:12px;margin:30px 0 0;text-align:center;">Valid for 7 days</p></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '16',
        name: 'Webinar Invitation',
        subject: 'Free Webinar: Master {{topic}} in 60 Minutes',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#1e3a8a;padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">🎓 Free Webinar</h1><p style="color:#93c5fd;font-size:18px;margin:0;">Learn From Industry Experts</p></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#1e3a8a;margin:0 0 20px;">Master Digital Marketing in 60 Minutes</h2><p style="color:#666666;line-height:1.6;margin:0 0 30px;">Join us for an exclusive live webinar where we'll share proven strategies to grow your online presence.</p><table width="100%" cellpadding="15" style="background-color:#eff6ff;border-radius:8px;margin:20px 0;"><tr><td style="color:#1e40af;border-bottom:1px solid #bfdbfe;"><strong>📅 Date:</strong> February 15, 2024</td></tr><tr><td style="color:#1e40af;border-bottom:1px solid #bfdbfe;"><strong>🕐 Time:</strong> 2:00 PM EST</td></tr><tr><td style="color:#1e40af;"><strong>⏱️ Duration:</strong> 60 minutes + Q&A</td></tr></table><ul style="color:#666666;line-height:1.8;margin:20px 0;padding-left:20px;"><li>SEO optimization techniques</li><li>Social media strategies</li><li>Email marketing best practices</li><li>Analytics and tracking</li></ul><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#1e3a8a;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;">Register Now (Free)</a></td></tr></table><p style="color:#ef4444;font-size:14px;margin:20px 0 0;text-align:center;">⚠️ Limited spots available!</p></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '17',
        name: 'Payment Failed',
        subject: 'Action Required: Payment Failed',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:2px solid #ef4444;"><tr><td style="padding:40px 30px;text-align:center;"><div style="width:80px;height:80px;background-color:#fee2e2;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;"><span style="color:#ef4444;font-size:40px;">⚠️</span></div><h1 style="color:#dc2626;margin:0 0 10px;font-size:28px;">Payment Failed</h1><p style="color:#666666;margin:0;">We couldn't process your payment</p></td></tr><tr><td style="padding:0 30px 40px;"><p style="color:#666666;line-height:1.6;margin:0 0 20px;">Your recent payment of <strong>$29.99</strong> was declined. Please update your payment method to continue your subscription.</p><div style="background-color:#fef2f2;border-left:4px solid#ef4444;padding:20px;margin:20px 0;border-radius:4px;"><p style="color:#991b1b;margin:0;font-size:14px;"><strong>Reason:</strong> Insufficient funds / Card expired</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#ef4444;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;">Update Payment Method</a></td></tr></table><p style="color:#999999;font-size:12px;margin:30px 0 0;text-align:center;">Your account will be suspended if not updated within 7 days</p></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '18',
        name: 'Re-engagement',
        subject: 'We Miss You! Come Back for 30% OFF',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="padding:50px 30px;text-align:center;"><h1 style="color:#8b5cf6;margin:0 0 20px;font-size:42px;">We Miss You! 💜</h1><p style="color:#666666;font-size:18px;line-height:1.6;margin:0 0 30px;">It's been a while since your last visit. We have something special to bring you back!</p><div style="background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);border-radius:8px;padding:40px;margin:20px 0;"><p style="color:#ffffff;font-size:18px;margin:0 0 10px;">Welcome Back Offer</p><p style="color:#ffffff;font-size:48px;font-weight:bold;margin:0;">30% OFF</p><p style="color:#ffffff;font-size:16px;margin:10px 0 0;">On your next purchase</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);color:#ffffff;text-decoration:none;padding:18px 50px;border-radius:50px;display:inline-block;font-weight:bold;font-size:16px;">Shop Now</a></td></tr></table><p style="color:#999999;font-size:12px;margin:30px 0 0;">Offer expires in 48 hours</p></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '19',
        name: 'Survey Request',
        subject: 'Quick Survey: Help Us Improve (2 Minutes)',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#10b981;padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">📊 Quick Survey</h1><p style="color:#d1fae5;font-size:16px;margin:0;">Your feedback shapes our future</p></td></tr><tr><td style="padding:40px 30px;"><p style="color:#666666;line-height:1.6;margin:0 0 20px;">We value your opinion! Take our 2-minute survey and help us serve you better.</p><div style="background-color:#f0fdf4;border-radius:8px;padding:30px;margin:20px 0;text-align:center;"><p style="color:#059669;font-size:18px;font-weight:bold;margin:0 0 10px;">Survey Incentive</p><p style="color:#666666;margin:0;font-size:14px;">Complete the survey and get entered to win a <strong style="color:#059669;">$100 gift card!</strong></p></div><ul style="color:#666666;line-height:1.8;margin:20px 0;padding-left:20px;"><li>Only 5 questions</li><li>Takes less than 2 minutes</li><li>100% anonymous</li><li>Win amazing prizes</li></ul><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#10b981;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;">Start Survey</a></td></tr></table></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '20',
        name: 'Holiday Greetings',
        subject: 'Season\'s Greetings from Our Team! 🎄',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0f172a;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#dc2626 0%,#16a34a 100%);padding:50px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:42px;">🎄 Happy Holidays! 🎁</h1><p style="color:#ffffff;font-size:18px;margin:0;">Warmest wishes for the season</p></td></tr><tr><td style="padding:40px 30px;text-align:center;"><p style="color:#666666;font-size:18px;line-height:1.6;margin:0 0 30px;">As the year comes to a close, we want to express our heartfelt gratitude for your continued support.</p><div style="background-color:#fef3c7;border-radius:8px;padding:30px;margin:20px 0;"><p style="color:#92400e;font-size:16px;margin:0 0 15px;">🎉 <strong>New Year Special Offer</strong> 🎉</p><p style="color:#78350f;font-size:32px;font-weight:bold;margin:0;">40% OFF</p><p style="color:#92400e;font-size:14px;margin:10px 0 0;">Celebrate the new year with huge savings!</p></div><p style="color:#666666;line-height:1.6;margin:20px 0;">May your holidays be filled with joy, peace, and prosperity. Here's to an amazing year ahead!</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background:linear-gradient(135deg,#dc2626 0%,#16a34a 100%);color:#ffffff;text-decoration:none;padding:15px 50px;border-radius:50px;display:inline-block;font-weight:bold;">Claim Your Offer</a></td></tr></table><p style="color:#999999;font-size:12px;margin:30px 0 0;">With love from our entire team ❤️</p></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '21',
        name: 'Trial Expiring',
        subject: 'Your Free Trial Expires in 3 Days',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#f59e0b;padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;">⏰ Trial Ending Soon</h1></td></tr><tr><td style="padding:40px 30px;"><p style="color:#666666;line-height:1.6;margin:0 0 20px;">Your free trial will expire in <strong style="color:#f59e0b;">3 days</strong>. Don't lose access to all the amazing features!</p><div style="background-color:#fffbeb;border:2px solid #f59e0b;border-radius:8px;padding:30px;margin:20px 0;text-align:center;"><p style="color:#92400e;font-size:16px;margin:0 0 15px;">Continue Your Journey</p><p style="color:#451a03;font-size:32px;font-weight:bold;margin:0 0 10px;">$19.99<span style="font-size:16px;color:#78350f;">/month</span></p><p style="color:#92400e;font-size:14px;margin:0;">⚡ Special launch price - 50% off</p></div><ul style="color:#666666;line-height:1.8;margin:20px 0;padding-left:20px;"><li>Unlimited access to all features</li><li>Priority customer support</li><li>Advanced analytics dashboard</li><li>Cancel anytime, no commitment</li></ul><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#f59e0b;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;">Upgrade Now</a></td></tr></table></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '22',
        name: 'Team Invitation',
        subject: 'You\'ve Been Invited to Join {{company_name}}',
        content: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;"><tr><td style="background-color:#6366f1;padding:40px 30px;text-align:center;"><h1 style="color:#ffffff;margin:0 0 10px;font-size:32px;">👥 Team Invitation</h1><p style="color:#e0e7ff;font-size:16px;margin:0;">You've been invited to collaborate</p></td></tr><tr><td style="padding:40px 30px;"><p style="color:#666666;line-height:1.6;margin:0 0 20px;"><strong style="color:#6366f1;">John Doe</strong> has invited you to join their team on <strong>Acme Corporation</strong> workspace.</p><div style="background-color:#eef2ff;border-radius:8px;padding:30px;margin:20px 0;"><table width="100%" cellpadding="10"><tr><td style="color:#4338ca;"><strong>Team:</strong></td><td style="color:#1e1b4b;text-align:right;">Marketing Department</td></tr><tr><td style="color:#4338ca;"><strong>Role:</strong></td><td style="color:#1e1b4b;text-align:right;">Team Member</td></tr><tr><td style="color:#4338ca;"><strong>Invited by:</strong></td><td style="color:#1e1b4b;text-align:right;">john@acme.com</td></tr></table></div><p style="color:#666666;line-height:1.6;margin:20px 0;">Accept the invitation to start collaborating with your team members and access shared resources.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="#" style="background-color:#6366f1;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;margin-right:10px;">Accept Invitation</a><a href="#" style="background-color:#f1f5f9;color:#64748b;text-decoration:none;padding:15px 40px;border-radius:5px;display:inline-block;font-weight:bold;">Decline</a></td></tr></table><p style="color:#999999;font-size:12px;margin:30px 0 0;text-align:center;">This invitation expires in 7 days</p></td></tr></table></td></tr></table></body></html>`,
        type: 'html',
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      }
    ]);
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', content: '', type: 'html' });
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsCreating(true);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type
    });
  };

  const handleSave = () => {
    // Implement save logic here
    console.log('Saving template:', formData);
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleDuplicate = (template: Template) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTemplates([...templates, newTemplate]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/email-sender/dashboard')}
                className="w-12 h-12 bg-white/80 hover:bg-white rounded-2xl flex items-center justify-center backdrop-blur-md transition-all border border-gray-200 shadow-lg hover:shadow-xl"
              >
                <LuArrowLeft size={24} className="text-gray-900" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Email Templates
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create and manage reusable email templates
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white hover:bg-gray-800 rounded-2xl transition-all duration-200 font-bold shadow-xl"
            >
              <LuPlus size={20} />
              New Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {!isCreating ? (
          /* Template List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <LuFileText size={24} className="text-gray-700" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <LuPencil size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <LuCopy size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <LuTrash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.subject}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="px-3 py-1 bg-gray-100 rounded-full font-semibold uppercase">
                    {template.type}
                  </span>
                  <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Create/Edit Template */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTemplate(null);
                  }}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all"
                >
                  <LuX size={20} className="text-gray-700" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Email"
                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Type Toggle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
                    Content Type
                  </label>
                  <div className="flex bg-gray-100 rounded-2xl p-1 w-fit">
                    <button
                      onClick={() => setFormData({ ...formData, type: 'html' })}
                      className={`px-6 py-3 rounded-xl transition-all font-semibold ${
                        formData.type === 'html'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LuCode size={18} />
                        HTML
                      </div>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, type: 'plain' })}
                      className={`px-6 py-3 rounded-xl transition-all font-semibold ${
                        formData.type === 'plain'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LuFileText size={18} />
                        Plain Text
                      </div>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
                    Email Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={formData.type === 'html' ? '<h1>Your content here...</h1>' : 'Your email content here...'}
                    rows={12}
                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm font-mono text-sm resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-bold transition-all"
                  >
                    <LuEye size={20} />
                    Preview
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-bold hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <LuSave size={20} />
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
