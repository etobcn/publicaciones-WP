import React from "react";
import { motion } from "framer-motion";

export default function FormCard({ title, description, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`rounded-xl border border-white/[0.06] bg-[#111113] p-6 ${className}`}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h3 className="text-[15px] font-semibold text-white/90">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-[13px] text-white/40">{description}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}