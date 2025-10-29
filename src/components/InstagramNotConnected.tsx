import Link from "next/link";
import { LuInstagram, LuSettings } from "react-icons/lu";

export default function InstagramNotConnected() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-xl p-12 border border-slate-200 max-w-2xl text-center">
        <div className="w-20 h-20 rounded-full bg-[#2A8B8A]/10 flex items-center justify-center mx-auto mb-6">
          <LuInstagram className="text-[#2A8B8A]" size={40} />
        </div>
        
        <h2 className="text-2xl font-bold text-black mb-3">
          Instagram Not Connected
        </h2>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          To use Instagram automation features, you need to connect your Instagram account first. 
          Head to Settings to connect your Instagram account and start automating your engagement.
        </p>
        
        <div className="bg-[#2A8B8A]/5 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-700 mb-2">
            <strong>What you can do after connecting:</strong>
          </p>
          <ul className="text-sm text-slate-600 space-y-1 text-left max-w-md mx-auto">
            <li>• Automate DM responses with AI-powered replies</li>
            <li>• Auto-engage with comments on your posts</li>
            <li>• Respond to story mentions and replies</li>
            <li>• Schedule posts with AI assistance</li>
            <li>• Track analytics and performance metrics</li>
          </ul>
        </div>
        
        <Link
          href="/instagram/settings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2A8B8A] text-white rounded-xl font-semibold hover:bg-[#238080] transition-all shadow-lg"
        >
          <LuSettings size={20} />
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
