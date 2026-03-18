import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, ExternalLink, Youtube, CheckCircle, AlertCircle, Link, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import FormCard from "@/components/shared/FormCard";
import DarkInput from "@/components/shared/DarkInput";
import FileDropZone from "@/components/shared/FileDropZone";

const EMPTY_NOTICIA = { titulo: "", texto: "", link: "" };
const MAX_NOTICIAS = 6;

export default function Premios() {
  const [form, setForm] = useState({
    nombre_premio: "",
    enlace_video: "",
    noticia_premio: "",
  });

  // Array de hasta 6 noticias estructuradas
  const [noticias, setNoticias] = useState(Array(MAX_NOTICIAS).fill(null).map(() => ({ ...EMPTY_NOTICIA })));

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Adjuntos
  const [imagenDestacada, setImagenDestacada] = useState([]);
  const [imagenCabecera, setImagenCabecera] = useState([]);
  const [noticiaPapel, setNoticiaPapel] = useState([]);
  const [autopublicidad, setAutopublicidad] = useState([]);

  const [publishStatus, setPublishStatus] = useState(null);
  const [publishError, setPublishError] = useState("");

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateNoticia = (index, field, value) => {
    setNoticias((prev) => prev.map((n, i) => i === index ? { ...n, [field]: value } : n));
  };

  const clearNoticia = (index) => {
    setNoticias((prev) => prev.map((n, i) => i === index ? { ...EMPTY_NOTICIA } : n));
  };

  const uploadFiles = async (files) => {
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    return urls;
  };

  const handleSearchNews = async () => {
    setIsSearching(true);
    setSearchError("");
    try {
      const response = await base44.functions.invoke("webhookPremiosNoticias", {
        premio: form.nombre_premio,
      }, { timeout: 90000 });
      if (response.data?.noticias) {
        const found = response.data.noticias.slice(0, MAX_NOTICIAS);
        setNoticias(
          Array(MAX_NOTICIAS).fill(null).map((_, i) => found[i] ? { ...found[i] } : { ...EMPTY_NOTICIA })
        );
      } else if (response.data?.error) {
        setSearchError(response.data.error);
      }
    } catch (err) {
      setSearchError(err.message || "Error al buscar noticias");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    setPublishStatus("loading");
    setPublishError("");
    try {
      const [imgDestacadaUrls, imgCabeceraUrls, noticiaPapelUrls, autopublicidadUrls] = await Promise.all([
        uploadFiles(imagenDestacada),
        uploadFiles(imagenCabecera),
        uploadFiles(noticiaPapel),
        uploadFiles(autopublicidad),
      ]);

      // Mapeo plano para WordPress/n8n
      const noticiasPlanas = {};
      noticias.forEach((n, i) => {
        const num = i + 1;
        noticiasPlanas[`premio_noticias_titulo_${num}`] = n.titulo || "";
        noticiasPlanas[`premio_noticias_texto_${num}`] = n.texto || "";
        noticiasPlanas[`premio_noticias_link_${num}`] = n.link || "";
      });

      const payload = {
        premio: form.nombre_premio,
        youtube_url: form.enlace_video,
        noticia_premio_url: form.noticia_premio,
        imagen_destacada_urls: imgDestacadaUrls,
        imagen_cabecera_urls: imgCabeceraUrls,
        noticia_papel_urls: noticiaPapelUrls,
        autopublicidad_urls: autopublicidadUrls,
        ...noticiasPlanas,
      };

      const response = await base44.functions.invoke("webhookPremiosPublicar", payload);

      await base44.entities.Envio.create({
        tipo: "premio",
        fecha_envio: new Date().toISOString(),
        nombre_premio: form.nombre_premio,
        youtube_url: form.enlace_video,
        status: response.data?.success ? "enviado" : "error",
      });

      if (response.data?.success) {
        setPublishStatus("success");
      } else {
        setPublishError(response.data?.error || "Error desconocido");
        setPublishStatus("error");
      }
    } catch (err) {
      setPublishError(err.message || "Error al conectar con el servidor");
      setPublishStatus("error");
    }
  };

  const hasNoticias = noticias.some((n) => n.titulo || n.texto || n.link);

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-[22px] font-bold text-white/95 tracking-tight">Gestión de Premios</h1>
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
                  <a href={form.enlace_video} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors">
                    <Youtube className="h-3 w-3" />Ver vídeo<ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <div className="space-y-2">
                <DarkInput
                  label="Noticia Premio"
                  placeholder="https://..."
                  type="url"
                  value={form.noticia_premio}
                  onChange={(e) => updateField("noticia_premio", e.target.value)}
                />
                {form.noticia_premio && (
                  <a href={form.noticia_premio} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors">
                    <Link className="h-3 w-3" />Ver noticia<ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </FormCard>

        {/* Adjuntos */}
        <FormCard title="Adjuntos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileDropZone label="Imagen Destacada" accept="image/*" files={imagenDestacada} onFilesChange={setImagenDestacada} />
            <FileDropZone label="Imagen Cabecera" accept="image/*" files={imagenCabecera} onFilesChange={setImagenCabecera} />
            <FileDropZone label="Noticia Papel" accept="image/*,.pdf" files={noticiaPapel} onFilesChange={setNoticiaPapel} />
            <FileDropZone label="Autopublicidad" accept="image/*,.pdf" files={autopublicidad} onFilesChange={setAutopublicidad} />
          </div>
        </FormCard>

        {/* Módulo de Noticias */}
        <FormCard title="Módulo de Noticias" description="Busca noticias relacionadas con el premio usando IA con acceso a internet.">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={handleSearchNews}
              disabled={isSearching || !form.nombre_premio}
              className="h-10 rounded-lg border-white/[0.08] bg-white/[0.03] text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-violet-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-400" />Buscando noticias...</>
              ) : (
                <><Bot className="mr-2 h-4 w-4 text-violet-400" />🤖 Buscar Noticias Relacionadas con IA</>
              )}
            </Button>

            {isSearching && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-500/[0.06] border border-violet-500/[0.12]">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-violet-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }} />
                  ))}
                </div>
                <span className="text-[12px] text-violet-300/70">Buscando en internet noticias relevantes...</span>
              </motion.div>
            )}

            {searchError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/[0.08] border border-red-500/[0.2]">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span className="text-[12px] text-red-300">{searchError}</span>
              </div>
            )}

            {/* Bloques de noticias */}
            <div className="space-y-3">
              {noticias.map((noticia, i) => (
                <NoticiaBlock
                  key={i}
                  index={i}
                  noticia={noticia}
                  onChange={(field, value) => updateNoticia(i, field, value)}
                  onClear={() => clearNoticia(i)}
                />
              ))}
            </div>
          </div>
        </FormCard>

        {publishStatus === "success" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/[0.2]">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-[13px] text-emerald-300">Evento publicado con éxito.</span>
          </motion.div>
        )}
        {publishStatus === "error" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/[0.08] border border-red-500/[0.2]">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-[13px] text-red-300">{publishError || "Ha ocurrido un error. Inténtalo de nuevo."}</span>
          </motion.div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={publishStatus === "loading"}
          className="w-full h-12 rounded-xl text-[14px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all duration-200 disabled:opacity-50 shadow-lg shadow-violet-600/20"
        >
          {publishStatus === "loading" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publicando...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" />Publicar Evento de Premio</>
          )}
        </Button>
      </div>
    </div>
  );
}

function NoticiaBlock({ index, noticia, onChange, onClear }) {
  const isEmpty = !noticia.titulo && !noticia.texto && !noticia.link;

  return (
    <div className={`rounded-lg border transition-all duration-200 ${isEmpty ? "border-white/[0.04] bg-white/[0.01]" : "border-white/[0.08] bg-white/[0.03]"}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
        <span className="text-[11px] font-medium text-white/30">Noticia {index + 1}</span>
        {!isEmpty && (
          <button onClick={onClear} className="p-1 rounded hover:bg-white/[0.06] transition-colors">
            <X className="h-3 w-3 text-white/25 hover:text-white/50" />
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">
        <input
          type="text"
          placeholder="Titular de la noticia..."
          value={noticia.titulo}
          onChange={(e) => onChange("titulo", e.target.value)}
          className="w-full bg-transparent border-0 outline-none text-[12px] font-medium text-white/70 placeholder:text-white/20"
        />
        <textarea
          placeholder="Resumen breve..."
          value={noticia.texto}
          onChange={(e) => onChange("texto", e.target.value)}
          rows={2}
          className="w-full bg-transparent border-0 outline-none text-[12px] text-white/50 placeholder:text-white/20 resize-none"
        />
        <div className="flex items-center gap-1.5">
          <Link className="h-3 w-3 text-white/20 shrink-0" />
          <input
            type="url"
            placeholder="https://..."
            value={noticia.link}
            onChange={(e) => onChange("link", e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-[11px] text-violet-400/60 placeholder:text-white/20"
          />
          {noticia.link && (
            <a href={noticia.link} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-violet-400/50 hover:text-violet-400 transition-colors">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}