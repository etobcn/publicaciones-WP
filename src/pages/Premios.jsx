import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Loader2, ExternalLink, Youtube, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import FormCard from "@/components/shared/FormCard";
import DarkInput from "@/components/shared/DarkInput";

const MOCK_NEWS = `<h3>Noticias Relacionadas</h3>
<p><strong>1. El Economista</strong> — "La empresa recibe el galardón por su trayectoria innovadora en el sector sanitario, destacando su compromiso con la investigación y el desarrollo."</p>
<br/>
<p><strong>2. Expansión</strong> — "El jurado ha reconocido la labor de la compañía en materia de sostenibilidad y responsabilidad social corporativa durante la última década."</p>
<br/>
<p><strong>3. ABC Economía</strong> — "Tercera edición consecutiva en la que la firma se posiciona entre los finalistas del certamen, consolidando su liderazgo en el mercado ibérico."</p>`;

export default function Premios() {
  const [form, setForm] = useState({
    nombre_premio: "",
    enlace_video: "",
    enlace_drive: "",
  });
  const [noticias, setNoticias] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchNews = () => {
    setIsSearching(true);
    setTimeout(() => {
      setNoticias(MOCK_NEWS);
      setIsSearching(false);
    }, 2500);
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
          Gestión de Premios
        </h1>
        <p className="mt-1 text-[13px] text-white/35">
          Registra los datos del evento y genera noticias con asistencia de IA.
        </p>
      </motion.div>

      <div className="space-y-5">
        {/* Datos del Evento */}
        <FormCard title="Datos del Evento">
          <div className="space-y-4">
            <DarkInput
              label="Nombre exacto del Premio"
              placeholder="Ej: Premios Expansión 2024 — Categoría Innovación"
              value={form.nombre_premio}
              onChange={(e) => updateField("nombre_premio", e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DarkInput
                  label="Enlace del vídeo de YouTube"
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                  value={form.enlace_video}
                  onChange={(e) => updateField("enlace_video", e.target.value)}
                />
                {form.enlace_video && (
                  <a
                    href={form.enlace_video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors"
                  >
                    <Youtube className="h-3 w-3" />
                    Ver vídeo
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <div className="space-y-2">
                <DarkInput
                  label="Carpeta de Google Drive"
                  placeholder="https://drive.google.com/..."
                  type="url"
                  value={form.enlace_drive}
                  onChange={(e) => updateField("enlace_drive", e.target.value)}
                />
                {form.enlace_drive && (
                  <a
                    href={form.enlace_drive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors"
                  >
                    <FolderOpen className="h-3 w-3" />
                    Abrir carpeta
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </FormCard>

        {/* Módulo de Noticias */}
        <FormCard title="Módulo de Noticias" description="Genera noticias relacionadas con el premio usando IA.">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={handleSearchNews}
              disabled={isSearching}
              className="
                h-10 rounded-lg border-white/[0.08] bg-white/[0.03]
                text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06]
                hover:border-violet-500/30 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-400" />
                  Buscando noticias...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4 text-violet-400" />
                  🤖 Buscar Noticias Relacionadas con IA
                </>
              )}
            </Button>

            {/* Search animation */}
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-500/[0.06] border border-violet-500/[0.12]"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-violet-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-violet-300/70">
                  Analizando fuentes y generando noticias relevantes...
                </span>
              </motion.div>
            )}

            {/* Rich Text Editor */}
            <div className="rounded-lg overflow-hidden border border-white/[0.06]">
              <ReactQuill
                theme="snow"
                value={noticias}
                onChange={setNoticias}
                placeholder="Las noticias generadas aparecerán aquí..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link"],
                    ["clean"],
                  ],
                }}
              />
            </div>
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
                Publicando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Publicar Evento de Premio
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}