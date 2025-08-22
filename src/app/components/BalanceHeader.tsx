"use client";
import { useBalance, MESSAGE_COST } from "../contexts/BalanceContext";
import { useTheme } from "../contexts/ThemeContext";
import { MdAccountBalanceWallet, MdAdd } from "react-icons/md";

export default function BalanceHeader() {
  const { balance, loading, addBalance } = useBalance();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleTopUp = async () => {
    const amount = 500; // Default top-up amount
    const success = await addBalance(amount, "Wallet top-up from header");
    if (success) {
      // Optional: Show success message
      console.log(`Successfully added ₹${amount}`);
    } else {
      // Optional: Show error message
      console.error("Failed to add balance");
    }
  };

  return (
    <div className={`flex items-center gap-4 px-6 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-xl ${isDarkMode ? 'hover:border-gray-600' : 'hover:border-gray-300'} transition-all duration-200 shadow-sm hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <MdAccountBalanceWallet className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <div>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>Wallet Balance</span>
          <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? "Loading..." : `₹${balance.toFixed(2)}`}
          </div>
          {/* <div className="text-xs text-gray-500 dark:text-gray-400">
            ~{Math.floor(balance / MESSAGE_COST)} messages
          </div> */}
        </div>
      </div>
      <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
      <button 
        onClick={handleTopUp}
        className={`${isDarkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'} text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2`}
      >
        <MdAdd className="w-4 h-4" />
        Top Up
      </button>
    </div>
  );
}
