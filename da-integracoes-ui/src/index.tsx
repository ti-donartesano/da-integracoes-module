import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Puzzle, ArrowRight, Settings, CheckCircle, XCircle } from 'lucide-react';
import './app.css';

// Using environment variable injected by Central or defaulting to absolute
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:4001' 
  : 'https://integracoes-api.solares.systems';

export function IntegracoesModule() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/integrations`)
      .then(r => r.json())
      .then(data => {
        setIntegrations(data);
        setLoading(false);
      })
      .catch(e => {
        console.error('Error loading integrations:', e);
        setLoading(false);
      });
  }, []);

  const handleConnect = (slug: string) => {
    // Redirect to OAuth route on API
    window.location.href = `${API_BASE}/auth/${slug}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Puzzle className="w-8 h-8 text-indigo-600" />
          Módulo de Integrações
        </h1>
        <p className="text-gray-500 mt-2">
          Gerencie as conexões OAuth centralizadas da Don Artesano com serviços externos (Tiny ERP, Kommo, etc).
        </p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl w-full max-w-md"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {integrations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-gray-900">Nenhuma integração configurada no BD.</h3>
              <p className="text-gray-500 text-sm mt-2">Você precisa criar os registros na tabela integrations do da-integracoes-api.</p>
            </div>
          ) : (
            integrations.map(integration => (
              <div key={integration.slug} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{integration.display_name}</h3>
                    {integration.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Desconectado
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6">
                    Provedor: <span className="font-medium text-gray-700">{integration.provider}</span>
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleConnect(integration.slug)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {integration.status === 'active' ? 'Reconectar (OAuth)' : 'Conectar Agora'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                      <Settings className="w-4 h-4" />
                      Configurar App
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

class DonArtesanoIntegracoes extends HTMLElement {
  root: any;
  connectedCallback() {
    const mountPoint = document.createElement('div');
    mountPoint.style.width = "100%";
    this.appendChild(mountPoint);
    this.root = createRoot(mountPoint);
    this.root.render(<IntegracoesModule />);
  }
  disconnectedCallback() {
    this.root?.unmount();
  }
}

if (!customElements.get('donartesano-integracoes')) {
  customElements.define('donartesano-integracoes', DonArtesanoIntegracoes);
}
