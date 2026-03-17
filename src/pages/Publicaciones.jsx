import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Image, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import FormCard from "@/components/shared/FormCard";
import DarkInput from "@/components/shared/DarkInput";
import DarkSelect from "@/components/shared/DarkSelect";
import ToggleSwitch from "@/components/shared/ToggleSwitch";
import FileDropZone from "@/components/shared/FileDropZone";
import { useLocation } from "react-router-dom";

const MEDIOS = [
  "A Tu Salud", "ABC", "Actualidad Económica", "Economista",
  "Mundo", "Periódico", "Expansión", "Razón",
  "Vanguardia", "Europa", "Renfe", "Salud & Vida", "Tu economía"
];

const FORMATOS = ["Redaccional", "Entrevista", "2 Entrevistas"];

export default function Publicaciones() {
  const location = useLocation();
  const reenvio = location.state?.reenvio;

  // Normaliza la fecha a YYYY-MM-DD para el input type="date"
  const normalizarFecha = (f) => {
    if (!f) return "";
    return String(f).slice(0, 10);
  };

  const [form, setForm] = useState({
    nombre_empresa: reenvio?.nombre_empresa || "",
    fecha: normalizarFecha(reenvio?.fecha_publicacion),
    medio: reenvio?.medio || "",
    formato: reenvio?.formato || "",
    enlaces: reenvio?.enlaces || false,
    premio: reenvio?.premio || "",
  });
  const [wordFiles, setWordFiles] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const uploadFile = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleSubmit = async () => {
    setStatus("loading");
    setErrorMsg("");

    try {
      // Upload files and get URLs
      const wordUrls = await Promise.all(wordFiles.map(uploadFile));
      const mediaUrls = await Promise.all(mediaFiles.map(uploadFile));

      const payload = {
        nombre_empresa: form.nombre_empresa,
        fecha: form.fecha,
        medio: form.medio,
        formato: form.formato,
        enlaces: form.enlaces,
        premio: form.premio,
        documento_word_urls: wordUrls,
        imagenes_urls: mediaUrls,
      };

      let webhookSuccess = false;
      let webhookError = "";
      try {
        const response = await base44.functions.invoke("webhookPublicaciones", payload);
        webhookSuccess = response.data?.success ?? true;
        webhookError = response.data?.error || "Error desconocido";
      } catch (webhookErr) {
        webhookError = webhookErr.message || "Error al conectar con el webhook";
      }

      // Guardar registro del envío siempre, independientemente del resultado del webhook
      console.log("DEBUG fecha antes de crear:", form.fecha, typeof form.fecha);
      await base44.entities.Envio.create({
        tipo: "publicacion",
        fecha_envio: new Date().toISOString(),
        nombre_empresa: form.nombre_empresa,
        fecha_publicacion: form.fecha || null,
        medio: form.medio,
        formato: form.formato,
        enlaces: form.enlaces,
        premio: form.premio,
        documento_word_urls: wordUrls,
        imagenes_urls: mediaUrls,
        status: webhookSuccess ? "enviado" : "error",
      });

      if (webhookSuccess) {
        setStatus("success");
      } else {
        setErrorMsg(webhookError);
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg(err.message || "Error al conectar con el servidor");
      setStatus("error");
    }
  };

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-[22px] font-bold text-white/95 tracking-tight">
          {reenvio ? "Reenviar Publicación" : "Nueva Publicación"}
        </h1>
        <p className="mt-1 text-[13px] text-white/35">
          {reenvio
            ? "Los campos se han rellenado con los datos del envío anterior. Sube de nuevo los archivos y envía."
            : "Completa los datos y sube los archivos para procesar la publicación."}
        </p>
      </motion.div>

      <div className="space-y-5">
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

        {/* Feedback Messages */}
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/[0.2]"
          >
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-[13px] text-emerald-300">Publicación enviada con éxito.</span>
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/[0.08] border border-red-500/[0.2]"
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-[13px] text-red-300">{errorMsg || "Ha ocurrido un error. Inténtalo de nuevo."}</span>
          </motion.div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="w-full h-12 rounded-xl text-[14px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all duration-200 disabled:opacity-50 shadow-lg shadow-violet-600/20"
        >
          {status === "loading" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" />Procesar Publicación</>
          )}
        </Button>
      </div>
    </div>
  );
}