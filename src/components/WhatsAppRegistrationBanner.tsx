import { LuTriangleAlert, LuShieldAlert, LuRefreshCw, LuCheck } from 'react-icons/lu';
import type { WhatsAppRegistrationStatus } from '../app/hooks/useWhatsAppRegistration';

interface WhatsAppRegistrationBannerProps {
  status: WhatsAppRegistrationStatus;
  onVerifyClick: () => void;
  loading?: boolean;
}

export function WhatsAppRegistrationBanner({ status, onVerifyClick, loading }: WhatsAppRegistrationBannerProps) {
  // Don't show banner if already registered
  if (status.registered) {
    return null;
  }

  // Don't show banner if not even connected
  if (!status.connected) {
    return null;
  }

  // Determine banner style and message based on classification
  const getBannerConfig = () => {
    const classification = status.classification || status.auto_registration_result?.classification;
    const userMessage = status.auto_registration_result?.user_message;
    const action = status.auto_registration_result?.action;
    const hint = status.auto_registration_result?.hint;

    switch (classification) {
      case 'PIN_REQUIRED':
        return {
          type: 'warning' as const,
          icon: LuShieldAlert,
          title: 'Two-Step Verification Setup Required',
          message: userMessage || 'Your WhatsApp number requires two-step verification PIN setup to complete registration.',
          buttonText: status.requires_pin ? 'Enter PIN' : 'Complete Setup',
          showButton: true,
          hint: hint || (
            'If the "Enable" button is grayed out in WhatsApp Manager, your account may be too new. ' +
            'Meta typically enables two-step verification 24-48 hours after phone verification. ' +
            'You can also try: 1) Disconnect & reconnect WhatsApp, 2) Wait 24-48 hours, or 3) Contact Meta support.'
          ),
        };

      case 'TOKEN_INVALID':
        return {
          type: 'error' as const,
          icon: LuTriangleAlert,
          title: 'Connection Expired',
          message: userMessage || 'Your WhatsApp connection has expired. Please reconnect your account.',
          buttonText: 'Reconnect',
          showButton: false, // User should use main reconnect button
          hint: hint || 'You may need to disconnect and connect again.',
        };

      case 'INSUFFICIENT_PERMISSIONS':
        return {
          type: 'error' as const,
          icon: LuTriangleAlert,
          title: 'Permission Required',
          message: userMessage || 'Missing required permissions. Please reconnect and ensure all permissions are granted.',
          buttonText: 'Reconnect',
          showButton: false,
          hint: hint || 'Make sure to grant "whatsapp_business_messaging" permission.',
        };

      case 'PHONE_NOT_VERIFIED':
        return {
          type: 'error' as const,
          icon: LuTriangleAlert,
          title: 'Phone Not Verified',
          message: userMessage || 'Your phone number is not verified in Meta Business Manager.',
          buttonText: 'Verify Phone',
          showButton: false,
          hint: hint || 'Please verify your phone number in Meta Business Settings first.',
        };

      case 'ALREADY_REGISTERED_ELSEWHERE':
        return {
          type: 'error' as const,
          icon: LuTriangleAlert,
          title: 'Phone Already Registered',
          message: userMessage || 'This phone number is registered to another WhatsApp Business Account.',
          buttonText: 'Resolve',
          showButton: false,
          hint: hint || 'Please use a different phone number or unregister it from the other account.',
        };

      default:
        // Generic registration needed message
        return {
          type: 'warning' as const,
          icon: LuRefreshCw,
          title: 'Registration Required',
          message: userMessage || 'Your WhatsApp number needs to be registered to send messages.',
          buttonText: 'Verify & Register',
          showButton: true,
          hint: hint || 'Click the button below to complete registration.',
        };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  // Banner background colors
  const bgColors = {
    warning: 'bg-amber-50 border-amber-300',
    error: 'bg-red-50 border-red-300',
    info: 'bg-blue-50 border-blue-300',
  };

  const iconColors = {
    warning: 'text-amber-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  const textColors = {
    warning: 'text-amber-900',
    error: 'text-red-900',
    info: 'text-blue-900',
  };

  const buttonColors = {
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <div className={`border-2 rounded-xl p-5 ${bgColors[config.type]} mb-6`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconColors[config.type]}`}>
          <Icon size={28} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${textColors[config.type]} mb-1`}>
            {config.title}
          </h3>
          <p className={`text-sm ${textColors[config.type]} mb-2`}>
            {config.message}
          </p>
          {config.hint && (
            <p className="text-xs text-slate-600 mb-3">
              💡 {config.hint}
            </p>
          )}

          {/* Phone number if available */}
          {status.phone_number && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg text-xs font-medium text-slate-700 mb-3">
              <LuCheck size={14} className="text-green-600" />
              <span>Connected: {status.phone_number}</span>
              {status.verified_name && <span className="text-slate-500">• {status.verified_name}</span>}
            </div>
          )}

          {/* Action button */}
          {config.showButton && (
            <button
              onClick={onVerifyClick}
              disabled={loading}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 ${buttonColors[config.type]}`}
            >
              {loading ? (
                <>
                  <LuRefreshCw className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                config.buttonText
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
