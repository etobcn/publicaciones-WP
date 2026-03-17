import React from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { X, ExternalLink, Newspaper, Award, CheckCircle, AlertCircle, Calendar, FileText, Image, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function EnvioDetalle({ envio, onClose }) {
  if (!envio) return null;

  const isPub = envio.tipo === "publicacion";
  const navigate = useNavigate();

  const handleReenviar = () => {
    onClose();
    if (isPub) {
      navigate("/Publicaciones", { state: { reenvio: envio } });
    } else {
      navigate("/Premios", { state: { reenvio: envio } });
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    // Si es solo fecha (YYYY-MM-DD) parseamos sin timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return format(parseISO(fechaStr), "d MMM yyyy", { locale: es });
    }
    return format(new Date(fechaStr), "d MMM yyyy", { locale: es });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#111113] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isPub ? "bg-blue-500/10" : "bg-amber-500/10"}`}>
                {isPub ? <Newspaper className="h-4 w-4 text-blue-400" /> : <Award className="h-4 w-4 text-amber-400" />}
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-white/90">
                  {isPub ? (envio.nombre_empresa || "—") : (envio.nombre_premio || "—")}
                </h2>
                <span className={`inline-flex items-center gap-1 text-[11px] mt-0.5 ${envio.status === "enviado" ? "text-emerald-400" : "text-red-400"}`}>
                  {envio.status === "enviado"
                    ? <><CheckCircle className="h-3 w-3" />Enviado</>
                    : <><AlertCircle className="h-3 w-3" />Error</>
                  }
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <Row label="Fecha de envío" value={envio.fecha_envio ? format(new Date(envio.fecha_envio), "d MMM yyyy, HH:mm", { locale: es }) : "—"} />

            {isPub && (
              <>
                <Row label="Fecha de publicación" value={envio.fecha_publicacion ? format(new Date(envio.fecha_publicacion), "d MMM yyyy", { locale: es }) : "—"} highlight={!envio.fecha_publicacion} />
                <Row label="Medio" value={envio.medio || "—"} />
                <Row label="Formato" value={envio.formato || "—"} />
                <Row label="Enlaces" value={envio.enlaces ? "Sí" : "No"} />
                {envio.premio && <Row label="Premio" value={envio.premio} />}
              </>
            )}

            {!isPub && (
              <>
                {envio.youtube_url && (
                  <RowLink label="YouTube" href={envio.youtube_url} />
                )}
                {envio.drive_url && (
                  <RowLink label="Drive" href={envio.drive_url} />
                )}
              </>
            )}

            {(envio.documento_word_urls?.length > 0 || envio.imagenes_urls?.length > 0) && (
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                {envio.documento_word_urls?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-[12px] text-white/50">{envio.documento_word_urls.length} documento(s) Word</span>
                  </div>
                )}
                {envio.imagenes_urls?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Image className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-[12px] text-white/50">{envio.imagenes_urls.length} imagen(es) / PDF(s)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] text-white/35 shrink-0">{label}</span>
      <span className={`text-[13px] font-medium text-right ${highlight ? "text-white/25 italic" : "text-white/80"}`}>{value}</span>
    </div>
  );
}

function RowLink({ label, href }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] text-white/35 shrink-0">{label}</span>
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[13px] text-violet-400 hover:text-violet-300 transition-colors">
        Ver enlace <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}