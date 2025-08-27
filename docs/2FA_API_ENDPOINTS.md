# Two-Factor Authentication API Endpoints

This document outlines the API endpoints needed for the 2FA implementation in the profile page.

## Setup Endpoints

### POST /profile/auth/me/2fa/setup-authenticator
Sets up authenticator app 2FA for the user.

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", // QR code image data URL
  "secret": "JBSWY3DPEHPK3PXP", // Secret key for manual entry
  "backupCodes": [
    "12345-67890",
    "09876-54321",
    "13579-24680",
    "97531-86420",
    "11111-22222",
    "33333-44444",
    "55555-66666",
    "77777-88888"
  ]
}
```

### POST /profile/auth/me/2fa/setup-email
Sets up email OTP 2FA for the user.

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

### POST /profile/auth/me/2fa/send-email-otp
Sends a new email OTP code to the user's registered email address.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email address",
  "expiresIn": 300
}
```

### POST /profile/auth/me/2fa/verify-email-otp
Verifies the email OTP code during setup or login.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email OTP verified successfully"
}
```

## Verification Endpoints

### POST /profile/auth/me/2fa/verify-setup
Verifies the 2FA setup with the provided code.

**Request:**
```json
{
  "type": "authenticator", // or "email"
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

## Management Endpoints

### DELETE /profile/auth/me/2fa
Disables 2FA for the user.

**Response:**
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

### GET /profile/auth/me/2fa/backup-codes
Retrieves current backup codes for the user.

**Response:**
```json
{
  "success": true,
  "backupCodes": [
    "12345-67890",
    "09876-54321",
    "13579-24680",
    "97531-86420",
    "11111-22222",
    "33333-44444",
    "55555-66666",
    "77777-88888"
  ]
}
```

### POST /profile/auth/me/2fa/regenerate-codes
Regenerates backup codes for the user.

**Response:**
```json
{
  "success": true,
  "backupCodes": [
    "98765-43210",
    "12345-67890",
    "24680-13579",
    "86420-97531",
    "22222-11111",
    "44444-33333",
    "66666-55555",
    "88888-77777"
  ]
}
```

### POST /profile/auth/me/2fa/use-backup-code
Validates and consumes a backup code during login.

**Request:**
```json
{
  "email": "user@example.com",
  "backupCode": "12345-67890"
}
```

**Response:**
```json
{
  "success": true,
  "remainingCodes": 6, // number of unused backup codes left
  "message": "Backup code verified successfully"
}
```

### POST /profile/auth/me/2fa/setup-dual
Sets up both authenticator and email 2FA for maximum security.

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": [
    "12345-67890",
    "09876-54321",
    "13579-24680",
    "97531-86420",
    "11111-22222",
    "33333-44444",
    "55555-66666",
    "77777-88888"
  ],
  "message": "Dual 2FA setup initiated. Please verify both methods."
}
```

### GET /profile/auth/me/2fa/status
Gets current 2FA configuration status for the user.

**Response:**
```json
{
  "success": true,
  "twoFactorEnabled": true,
  "twoFactorType": "both", // "authenticator", "email", or "both"
  "backupCodesCount": 6,
  "lastBackupCodeUsed": "2024-01-15T10:30:00Z",
  "setupDate": "2024-01-10T14:20:00Z"
}
```

## Authentication Endpoints (for login process)

### POST /auth/signin
Signs in a user with email/password and optionally 2FA code.

**Request (Initial login):**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (2FA required - Email OTP):**
```json
{
  "success": false,
  "requires2FA": true,
  "twoFactorType": "email",
  "message": "Two-factor authentication required. OTP sent to your email."
}
```

**Response (2FA required - Authenticator):**
```json
{
  "success": false,
  "requires2FA": true,
  "twoFactorType": "authenticator",
  "message": "Two-factor authentication required"
}
```

**Response (2FA required - Both methods):**
```json
{
  "success": false,
  "requires2FA": true,
  "twoFactorType": "both",
  "message": "Two-factor authentication required"
}
```

**Important Backend Behavior:**
- **For email 2FA users**: When `twoFactorType: "email"` is returned, the backend MUST automatically send an email OTP during this initial login response. The frontend should not need to make a separate resend request.
- **For authenticator users**: No automatic action needed, user enters their authenticator code.
- **For dual 2FA users**: Backend should not auto-send email OTP unless user specifically requests it.

**Frontend Behavior by 2FA Type:**
- **"authenticator"**: Show authenticator code input only, with backup code option
- **"email"**: Show email OTP input only, with resend OTP option (OTP already auto-sent by backend)
- **"both"**: Show method selection tabs, default to authenticator with backup option

**Request (With 2FA code):**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "twoFactorCode": "123456",
  "codeType": "authenticator" // "authenticator", "email", or "backup"
}
```

**Request (With backup code):**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "twoFactorCode": "12345-67890",
  "codeType": "backup"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    // ... other user fields
  }
}
```

### POST /auth/resend-2fa-code
Resends 2FA code for email-based authentication.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "New verification code sent to your email"
}
```

## Security Settings Update

The security settings endpoint should also accept the 2FA type:

### PUT /profile/auth/me/security

**Request:**
```json
{
  "twoFactorEnabled": true,
  "twoFactorType": "authenticator", // or "email"
  "loginAlerts": true,
  "sessionTimeout": 30,
  "allowMultipleSessions": false
}
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

Common error scenarios:
- Invalid verification code
- 2FA already enabled/disabled
- Rate limiting for OTP requests
- Server errors
- Backup code already used
- No backup codes remaining
- Email OTP expired
- Too many OTP verification attempts
- Email delivery failure
- Invalid email address

## Backend Implementation Requirements

### Database Schema Updates
The backend needs to store backup codes securely:
```sql
-- Add to users table or create separate table
backup_codes TABLE (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  code_hash VARCHAR(255), -- Hashed backup code
  used_at TIMESTAMP NULL, -- NULL if unused, timestamp if used
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update users table to support dual 2FA
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_type VARCHAR(20); -- 'authenticator', 'email', 'both'
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255); -- For authenticator
ALTER TABLE users ADD COLUMN backup_code_used BOOLEAN DEFAULT FALSE; -- Track backup usage

-- Email OTP storage table
email_otps TABLE (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  otp_hash VARCHAR(255), -- Hashed OTP code
  expires_at TIMESTAMP, -- OTP expiration time
  attempts INT DEFAULT 0, -- Failed verification attempts
  used_at TIMESTAMP NULL, -- NULL if unused
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rate limiting table
email_otp_rate_limits TABLE (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  email VARCHAR(255),
  requests_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  last_request TIMESTAMP DEFAULT NOW()
);

-- Audit log for security events
two_factor_audit_log TABLE (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(50), -- 'login_success', 'login_failed', 'backup_used', 'setup', 'disabled'
  method VARCHAR(20), -- 'authenticator', 'email', 'backup'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Security Considerations
1. **Backup codes must be hashed** before storing in database (use bcrypt or Argon2)
2. **Single-use only** - mark as used after successful verification
3. **Time-limited** - consider expiring codes after 30-90 days
4. **Rate limiting** - prevent brute force attacks on backup codes (max 3 attempts per hour)
5. **Audit logging** - log all backup code usage attempts with IP and user agent
6. **Session invalidation** - invalidate all sessions when 2FA is disabled
7. **Email OTP rate limiting** - max 5 requests per hour per user
8. **Backup code usage detection** - set flag when backup code is used for frontend reset flow
9. **Dual 2FA validation** - ensure both methods can't be the same type
10. **QR code security** - generate new secrets when resetting authenticator
11. **Professional confirmations** - backend should not rely on frontend confirm() dialogs
12. **CSRF protection** - ensure all 2FA endpoints are CSRF protected
13. **Input validation** - validate all 2FA codes, email formats, and parameters
14. **Lockout mechanisms** - temporary account lockout after multiple failed attempts

### Required Backend Changes
1. **Update `/auth/signin` endpoint** to handle `codeType` parameter and return appropriate `twoFactorType`
2. **Implement backup code validation** in authentication flow with single-use enforcement
3. **Add backup code generation** during 2FA setup (8 codes, hashed storage)
4. **Implement backup code regeneration** endpoint with old code invalidation
5. **Update 2FA verification logic** to support multiple code types (`authenticator`, `email`, `backup`)
6. **Add database migrations** for backup code storage and user 2FA settings
7. **Add backup code usage tracking** to detect when users need authenticator reset
8. **Implement authenticator reset flow** for users who lose their devices
9. **Email OTP system** with rate limiting and 5-minute expiration
10. **Email template management** for OTP delivery with professional styling
11. **Dual 2FA support** - allow users to enable both authenticator AND email
12. **Smart login detection** - return correct `twoFactorType` based on user's configuration
13. **Professional modal confirmations** - remove dependency on browser alerts
14. **Security audit logging** - track all 2FA events for compliance
15. **Rate limiting middleware** - prevent brute force attacks on 2FA codes

### Email OTP Implementation Requirements

#### Database Schema for Email OTP
```sql
-- Email OTP storage table
email_otps TABLE (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  otp_hash VARCHAR(255), -- Hashed OTP code
  expires_at TIMESTAMP, -- OTP expiration time
  attempts INT DEFAULT 0, -- Failed verification attempts
  used_at TIMESTAMP NULL, -- NULL if unused
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rate limiting table
email_otp_rate_limits TABLE (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  email VARCHAR(255),
  requests_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  last_request TIMESTAMP DEFAULT NOW()
);
```

#### Email OTP Security Features
1. **OTP Generation**: 6-digit numeric codes with cryptographic randomness
2. **Expiration**: OTP codes expire after 5 minutes
3. **Rate Limiting**: 
   - Maximum 5 OTP requests per hour per user
   - Maximum 3 verification attempts per OTP
4. **Hash Storage**: OTP codes must be hashed before database storage
5. **Single Use**: OTP codes are invalidated after successful verification
6. **Brute Force Protection**: Account lockout after 10 failed attempts

#### Email Template Requirements
```html
<!-- OTP Email Template -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Security Code - Stitchbyte</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Security Code</h2>
        <p>Your one-time password (OTP) for Stitchbyte is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            {{OTP_CODE}}
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email or contact support.</p>
        <hr>
        <small>Stitchbyte Security Team</small>
    </div>
</body>
</html>
```

### Authenticator Reset Flow
When a user successfully logs in with a backup code, the frontend will:
1. **Detect backup code usage** during login
2. **Show reset authenticator modal** on profile page
3. **Offer to setup new authenticator** with fresh QR code
4. **Generate new backup codes** for the reset authenticator
5. **Clear old backup codes** to prevent reuse

This helps users who lose their phones or uninstall authenticator apps to securely regain access and maintain account security.

### Email OTP Specific Error Responses

**Rate Limit Exceeded:**
```json
{
  "success": false,
  "message": "Too many OTP requests. Please wait before requesting a new code.",
  "retryAfter": 3600
}
```

**OTP Expired:**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new code.",
  "code": "OTP_EXPIRED"
}
```

**Too Many Attempts:**
```json
{
  "success": false,
  "message": "Too many verification attempts. Please request a new OTP.",
  "code": "TOO_MANY_ATTEMPTS"
}
```

**Email Delivery Failure:**
```json
{
  "success": false,
  "message": "Failed to send OTP email. Please check your email address.",
  "code": "EMAIL_DELIVERY_FAILED"
}
```

## Frontend Implementation Guide

### Email OTP Setup Flow
1. User selects "Email OTP" in 2FA setup
2. System sends OTP to user's registered email
3. User enters 6-digit code from email
4. System verifies OTP and enables 2FA
5. User receives backup codes for recovery

### Dual 2FA Support (Both Authenticator AND Email)
When users have both authenticator app and email OTP enabled:
1. **Login Response**: `twoFactorType: "both"`
2. **Frontend Behavior**: 
   - Shows method selection buttons (Authenticator App / Email OTP)
   - Defaults to authenticator app
   - Auto-sends email OTP when user selects email method
3. **Backend Validation**: Accepts codes from either method based on `codeType` parameter

### Email OTP Login Flow
1. User enters email/password
2. System detects 2FA requirement and type
3. If email OTP: automatically sends code to user's email
4. User enters 6-digit code from email
5. System verifies and grants access

### Backup Code Restrictions
- **Backup codes only available for authenticator app users**
- **Email OTP users cannot generate backup codes**
- **Users with both methods get backup codes (for authenticator recovery)**

### Backup Code Management
- **Single-view policy**: Backup codes shown only once after generation
- **Download functionality**: Users can download codes as `.txt` file
- **Auto-hide regenerate**: Regenerate button hidden after codes are viewed
- **Conditional display**: Backup codes button only appears for authenticator users

### Rate Limiting Handling
```javascript
// Example frontend rate limit handling
const sendEmailOTP = async () => {
  try {
    const response = await apiService.post('/profile/auth/me/2fa/send-email-otp');
    // Success - show "OTP sent" message
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      const waitTime = Math.ceil(error.retryAfter / 60);
      setError(`Too many requests. Please wait ${waitTime} minutes.`);
    }
  }
};
```

### Email OTP Verification
```javascript
// Example email OTP verification
const verifyEmailOTP = async (otp) => {
  try {
    const response = await apiService.post('/profile/auth/me/2fa/verify-email-otp', {
      email: user.email,
      otp: otp
    });
    
    if (response.success) {
      // OTP verified successfully
      setIs2FASetupComplete(true);
    }
  } catch (error) {
    if (error.code === 'OTP_EXPIRED') {
      setError('OTP has expired. Please request a new code.');
    } else if (error.code === 'TOO_MANY_ATTEMPTS') {
      setError('Too many attempts. Please request a new OTP.');
    }
  }
};
```
