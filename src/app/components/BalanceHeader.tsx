// In your src/app/components/BalanceHeader.tsx file

"use client";

import { useState } from "react";
import { useBalance } from "../contexts/BalanceContext";
import { LuWallet, LuPlus } from "react-icons/lu";
import AddBalanceModal from "./AddBalanceModal";

export default function BalanceHeader() {
  const { balance } = useBalance();
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-transparent px-3 py-1.5 rounded-lg dark:text-slate-200">
          <LuWallet size={18} className="text-[#2A8B8A]" />
          <span>{`₹${balance.toFixed(2)}`}</span>
        </div>
        <button
          onClick={() => setShowAddBalanceModal(true)}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold bg-[#2A8B8A] text-white rounded-lg shadow-sm hover:bg-[#238080] transition-colors"
        >
          <LuPlus size={16} />
          Top Up
        </button>
      </div>
      <AddBalanceModal
        isOpen={showAddBalanceModal}
        onClose={() => setShowAddBalanceModal(false)}
      />
    </>
  );
}