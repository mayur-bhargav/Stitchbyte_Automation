import { useState } from 'react';
import { LuX, LuLoader, LuTriangleAlert } from 'react-icons/lu';

interface WhatsAppPINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<{ success: boolean; message: string }>;
  phoneNumber?: string;
}

export function WhatsAppPINModal({ isOpen, onClose, onSubmit, phoneNumber }: WhatsAppPINModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onSubmit(pin);
      
      if (result.success) {
        // Success - close modal
        setPin('');
        onClose();
      } else {
        // Show error
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setPin(value);
      setError(''); // Clear error on input
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPin('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white relative">
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <LuX size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-2">Two-Step Verification Required</h2>
          <p className="text-green-50 text-sm">
            Enter your WhatsApp PIN to complete registration
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {phoneNumber && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-medium">Phone:</span> {phoneNumber}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              6-Digit PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={handlePinChange}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500">
              This is the 6-digit PIN you set up in your WhatsApp app for two-step verification.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <LuTriangleAlert className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-800">
              <strong>Don't have your PIN?</strong> You can reset it in the WhatsApp app:
              Settings → Account → Two-step verification → Change PIN
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LuLoader className="animate-spin" size={18} />
                  Verifying...
                </>
              ) : (
                'Verify & Register'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
