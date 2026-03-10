import React, { useState, useRef } from "react";
import { Upload, FileText, Image, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FileDropZone({ label, hint, icon: Icon = Upload, accept, multiple = false, onFilesChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const addFiles = (newFiles) => {
    const updated = multiple ? [...files, ...newFiles] : newFiles.slice(0, 1);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed 
          transition-all duration-200 ease-out
          flex flex-col items-center justify-center py-8 px-4 text-center
          ${isDragging
            ? "border-violet-500/60 bg-violet-500/[0.06]"
            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => addFiles(Array.from(e.target.files))}
          className="hidden"
        />
        <div className={`mb-3 rounded-full p-3 transition-colors duration-200 ${isDragging ? "bg-violet-500/20" : "bg-white/[0.05]"}`}>
          <Icon className={`h-5 w-5 transition-colors duration-200 ${isDragging ? "text-violet-400" : "text-white/30"}`} />
        </div>
        <p className="text-[13px] font-medium text-white/60">{label}</p>
        {hint && <p className="mt-1.5 text-[11px] text-white/30 max-w-[260px]">{hint}</p>}
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400/80 shrink-0" />
                <span className="text-[12px] text-white/60 truncate flex-1">{file.name}</span>
                <span className="text-[11px] text-white/25 shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1 rounded hover:bg-white/[0.08] transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}