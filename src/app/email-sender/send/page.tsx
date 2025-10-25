'use client';

import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import EmailDashboard from '../../components/EmailDashboard';

export default function SendEmailPage() {
  const router = useRouter();

  const handleDisconnect = () => {
    router.push('/email-sender');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6">
          <button
            onClick={() => router.push('/email-sender/dashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white rounded-2xl backdrop-blur-md transition-all text-gray-900 font-semibold border border-gray-200 shadow-lg hover:shadow-xl"
          >
            <LuArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>
      </div>
      
      {/* Email Dashboard Component */}
      <EmailDashboard onDisconnect={handleDisconnect} hideHeader={true} />
    </div>
  );
}
