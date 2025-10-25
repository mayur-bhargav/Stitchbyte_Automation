import { LuLoader } from 'react-icons/lu';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-xl">
            <LuLoader size={40} className="text-white animate-spin" />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Loading...
        </h2>
        <p className="text-gray-600">
          Please wait while we prepare your content
        </p>

        {/* Loading Bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-900 to-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
