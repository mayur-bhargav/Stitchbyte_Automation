'use client';

import { LuSearch, LuArrowLeft, LuLayoutDashboard, LuFileText, LuSend, LuSettings } from 'react-icons/lu';
import { HiHome } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import { useUser } from './contexts/UserContext';

export default function NotFound() {
  const router = useRouter();
  const { user } = useUser();

  const handleHomeClick = () => {
    // If user is logged in, go to dashboard, otherwise go to landing page
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* 404 Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 border border-gray-200 text-center">
          {/* Large 404 */}
          <div className="mb-8">
            <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 tracking-tighter">
              404
            </h1>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-xl">
              <LuSearch size={40} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <LuArrowLeft size={20} />
              Go Back
            </button>
            
            <button
              onClick={handleHomeClick}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-bold hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <HiHome size={20} />
              Go Home
            </button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-8">
            Need help? Visit our{' '}
            <a href="mailto:info@stitchbyte.in" className="text-gray-900 font-semibold hover:underline">
              support page
            </a>
          </p>
        </div>

        {/* Popular Links - Only show if user is logged in */}
        {user && (
          <div className="mt-8">
            <p className="text-center text-sm text-gray-600 mb-4 font-medium">Popular Pages:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl text-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              >
                <LuLayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={() => router.push('/templates')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl text-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              >
                <LuFileText size={16} />
                Templates
              </button>
              <button
                onClick={() => router.push('/campaigns')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl text-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              >
                <LuSend size={16} />
                Campaigns
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-xl text-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              >
                <LuSettings size={16} />
                Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
