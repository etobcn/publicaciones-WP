import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Image, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormCard from "@/components/shared/FormCard";
import DarkInput from "@/components/shared/DarkInput";
import DarkSelect from "@/components/shared/DarkSelect";
import ToggleSwitch from "@/components/shared/ToggleSwitch";
import FileDropZone from "@/components/shared/FileDropZone";

const MEDIOS = [
  "A Tu Salud", "ABC", "Actualidad Económica", "Economista",
  "Mundo", "Periódico", "Expansión", "Razón",
  "Vanguardia", "Europa", "Renfe", "Salud & Vida", "Tu economía"
];

const FORMATOS = ["Redaccional", "Entrevista", "2 Entrevistas"];

export default function Publicaciones() {
  const [form, setForm] = useState({
    nombre_empresa: "",
    fecha: "",
    medio: "",
    formato: "",
    enlaces: false,
    premio: "",
  });
  const [wordFiles, setWordFiles] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-[22px] font-bold text-white/95 tracking-tight">
          Nueva Publicación
        </h1>
        <p className="mt-1 text-[13px] text-white/35">
          Completa los datos y sube los archivos para procesar la publicación.
        </p>
      </motion.div>

      <div className="space-y-5">
        {/* Datos Generales */}
        <FormCard title="Datos Generales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DarkInput
              label="Nombre empresa"
              placeholder="Ej: Grupo Nova"
              value={form.nombre_empresa}
              onChange={(e) => updateField("nombre_empresa", e.target.value)}
            />
            <DarkInput
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => updateField("fecha", e.target.value)}
            />
            <DarkSelect
              label="Medio"
              placeholder="Selecciona un medio"
              options={MEDIOS}
              value={form.medio}
              onValueChange={(v) => updateField("medio", v)}
            />
            <DarkSelect
              label="Formato"
              placeholder="Selecciona formato"
              options={FORMATOS}
              value={form.formato}
              onValueChange={(v) => updateField("formato", v)}
            />
            <ToggleSwitch
              label="Enlaces"
              checked={form.enlaces}
              onChange={(v) => updateField("enlaces", v)}
            />
            <DarkInput
              label="Premio"
              optional
              placeholder="Ej: Premio Expansión 2024"
              value={form.premio}
              onChange={(e) => updateField("premio", e.target.value)}
            />
          </div>
        </FormCard>

        {/* Archivos Adjuntos */}
        <FormCard title="Archivos Adjuntos" description="Sube el documento Word y las imágenes o PDFs asociados.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileDropZone
              label="Subir documento Word"
              hint="Acepta archivos .doc y .docx"
              icon={FileText}
              accept=".doc,.docx"
              onFilesChange={setWordFiles}
            />
            <FileDropZone
              label="Subir Imágenes y PDFs"
              hint='Nombra las fotos como 1_, 2_... y el logo como 4_'
              icon={Image}
              accept="image/*,.pdf"
              multiple
              onFilesChange={setMediaFiles}
            />
          </div>
        </FormCard>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="
              w-full h-12 rounded-xl text-[14px] font-semibold
              bg-violet-600 hover:bg-violet-500 text-white
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-violet-600/20
            "
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Procesar Publicación
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}