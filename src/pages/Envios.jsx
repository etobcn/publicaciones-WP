import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, Newspaper, Award, ExternalLink, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import EnvioDetalle from "@/components/envios/EnvioDetalle";

export default function Envios() {
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);

  const { data: envios = [], isLoading } = useQuery({
    queryKey: ["envios"],
    queryFn: () => base44.entities.Envio.list("-fecha_envio", 100),
  });

  const filtrados = filtroTipo === "todos" ? envios : envios.filter((e) => e.tipo === filtroTipo);

  return (
    <>
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex items-start justify-between"
      >
        <div>
          <h1 className="text-[22px] font-bold text-white/95 tracking-tight">Registro de Envíos</h1>
          <p className="mt-1 text-[13px] text-white/35">
            Historial de todas las publicaciones y premios enviados.
          </p>
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-44 h-9 rounded-lg border-white/[0.08] bg-white/[0.03] text-[13px] text-white/80 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/[0.08] bg-[#18181b]">
            <SelectItem value="todos" className="text-[13px] text-white/80 focus:bg-violet-500/10 focus:text-white">Todos</SelectItem>
            <SelectItem value="publicacion" className="text-[13px] text-white/80 focus:bg-violet-500/10 focus:text-white">Publicaciones</SelectItem>
            <SelectItem value="premio" className="text-[13px] text-white/80 focus:bg-violet-500/10 focus:text-white">Premios</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/25">
          <Newspaper className="h-10 w-10 mb-3" />
          <p className="text-[14px]">No hay envíos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((envio, i) => (
            <motion.div
              key={envio.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              onClick={() => setEnvioSeleccionado(envio)}
              className="rounded-xl border border-white/[0.12] bg-white/[0.05] p-5 hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${envio.tipo === "publicacion" ? "bg-blue-500/10" : "bg-amber-500/10"}`}>
                    {envio.tipo === "publicacion"
                      ? <Newspaper className="h-4 w-4 text-blue-400" />
                      : <Award className="h-4 w-4 text-amber-400" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-white/90">
                        {envio.tipo === "publicacion" ? (envio.nombre_empresa || "—") : (envio.nombre_premio || "—")}
                      </span>
                      <Badge className={`text-[10px] px-2 py-0 ${envio.status === "enviado" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {envio.status === "enviado"
                          ? <><CheckCircle className="h-2.5 w-2.5 mr-1" />Enviado</>
                          : <><AlertCircle className="h-2.5 w-2.5 mr-1" />Error</>
                        }
                      </Badge>
                    </div>

                    {envio.tipo === "publicacion" && (
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        {envio.medio && <span className="text-[12px] text-white/40">{envio.medio}</span>}
                        {envio.formato && <span className="text-[12px] text-white/40">{envio.formato}</span>}
                        {envio.fecha_publicacion && (() => {
                          const soloFecha = String(envio.fecha_publicacion).slice(0, 10);
                          const [y, m, d] = soloFecha.split("-").map(Number);
                          return y && m && d ? (
                            <span className="text-[12px] text-white/40">
                              📅 {format(new Date(y, m - 1, d), "d MMM yyyy", { locale: es })}
                            </span>
                          ) : null;
                        })()}
                        {envio.premio && <span className="text-[12px] text-violet-400/60">🏆 {envio.premio}</span>}
                        {envio.enlaces && <span className="text-[12px] text-white/40">Con enlaces</span>}
                      </div>
                    )}

                    {envio.tipo === "premio" && (
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        {envio.youtube_url && (
                          <a href={envio.youtube_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] text-violet-400/60 hover:text-violet-400 transition-colors">
                            YouTube <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                        {envio.drive_url && (
                          <a href={envio.drive_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] text-violet-400/60 hover:text-violet-400 transition-colors">
                            Drive <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {(envio.documento_word_urls?.length > 0 || envio.imagenes_urls?.length > 0) && (
                      <div className="mt-1.5 flex gap-3">
                        {envio.documento_word_urls?.length > 0 && (
                          <span className="text-[11px] text-white/30">{envio.documento_word_urls.length} doc(s) Word</span>
                        )}
                        {envio.imagenes_urls?.length > 0 && (
                          <span className="text-[11px] text-white/30">{envio.imagenes_urls.length} imagen(es)/PDF(s)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-white/25">
                    {envio.fecha_envio ? format(new Date(envio.fecha_envio), "d MMM yyyy, HH:mm", { locale: es }) : "—"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
      <EnvioDetalle envio={envioSeleccionado} onClose={() => setEnvioSeleccionado(null)} />
    </>
  );
}