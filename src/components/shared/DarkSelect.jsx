import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DarkSelect({ label, placeholder, options, value, onValueChange }) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-[13px] font-medium text-white/50">{label}</Label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className="
            h-10 rounded-lg border-white/[0.08] bg-white/[0.03]
            text-[13px] text-white/90
            focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
            transition-all duration-200
            [&>span]:text-white/25 data-[state=open]:border-violet-500/50
          "
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-white/[0.08] bg-[#18181b]">
          {options.map((opt) => (
            <SelectItem
              key={typeof opt === "string" ? opt : opt.value}
              value={typeof opt === "string" ? opt : opt.value}
              className="text-[13px] text-white/80 focus:bg-violet-500/10 focus:text-white"
            >
              {typeof opt === "string" ? opt : opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}