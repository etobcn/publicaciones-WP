import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
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
                    
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-medium text-white/70">Nota Admin</p>
                                    <p className="text-sm text-white/40 leading-relaxed">
                                        Esta página aún no ha sido implementada. Solicítala en el chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
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