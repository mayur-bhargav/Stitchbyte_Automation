"use client";
import React from "react";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={"relative rounded-2xl bg-white shadow-xl"}>
      <div className={`${className}`}>
        {children}
      </div>
    </div>
  );
}
