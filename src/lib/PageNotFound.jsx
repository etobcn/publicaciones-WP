import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#09090b]">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-white/10">404</h1>
                        <div className="h-0.5 w-16 bg-white/10 mx-auto"></div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-white/80">
                            Página no encontrada
                        </h2>
                        <p className="text-white/40 leading-relaxed">
                            La página <span className="font-medium text-white/60">"{pageName}"</span> no existe en esta aplicación.
                        </p>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white/70 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:border-white/[0.12] transition-colors duration-200"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
