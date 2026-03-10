import React from "react";
import { Label } from "@/components/ui/label";

export default function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-[13px] font-medium text-white/50">{label}</Label>
      )}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-7 w-[52px] items-center rounded-full 
          transition-colors duration-200 ease-out
          ${checked ? "bg-violet-600" : "bg-white/[0.08]"}
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 rounded-full bg-white shadow-sm
            transition-transform duration-200 ease-out
            ${checked ? "translate-x-[27px]" : "translate-x-1"}
          `}
        />
        <span className={`
          absolute text-[10px] font-semibold tracking-wide
          ${checked ? "left-2 text-white/90" : "right-2 text-white/40"}
        `}>
          {checked ? "Sí" : "No"}
        </span>
      </button>
    </div>
  );
}