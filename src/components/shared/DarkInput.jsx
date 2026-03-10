import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DarkInput({ label, optional, ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-[13px] font-medium text-white/50">
          {label}
          {optional && <span className="ml-1.5 text-[11px] text-white/25">(Opcional)</span>}
        </Label>
      )}
      <Input
        {...props}
        className={`
          h-10 rounded-lg border-white/[0.08] bg-white/[0.03] 
          text-[13px] text-white/90 placeholder:text-white/25
          focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
          transition-all duration-200
          ${props.className || ""}
        `}
      />
    </div>
  );
}