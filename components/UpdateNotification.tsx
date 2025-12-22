
import React, { useState, useEffect } from 'react';
import { APP_VERSION, STORAGE_KEY_APP_VERSION } from '../constants';
import { RefreshCw, Info } from 'lucide-react';

export const UpdateNotification = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const storedVersion = localStorage.getItem(STORAGE_KEY_APP_VERSION);
        // Se a versão armazenada existir e for diferente da versão do código, mostra o aviso
        if (storedVersion && storedVersion !== APP_VERSION) {
            setShow(true);
        } else if (!storedVersion) {
            // Inicializa a versão para novos usuários ou primeira execução deste recurso
            localStorage.setItem(STORAGE_KEY_APP_VERSION, APP_VERSION);
        }
    }, []);

    const handleUpdate = () => {
        // Atualiza a versão no storage e recarrega a página
        localStorage.setItem(STORAGE_KEY_APP_VERSION, APP_VERSION);
        window.location.reload();
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full bg-white dark:bg-gray-800 border-l-4 border-brand-red rounded-lg shadow-2xl p-4 animate-fade-in flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-brand-red">
                    <Info size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase">Atualização Disponível</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        Uma nova versão do sistema foi detectada ({APP_VERSION}). Atualize para garantir a melhor performance.
                    </p>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={() => setShow(false)}
                    className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                >
                    Depois
                </button>
                <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-md flex items-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-900/20"
                >
                    <RefreshCw size={12} /> Atualizar Agora
                </button>
            </div>
        </div>
    );
}
