import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Erro inesperado na ligação à base de dados.',
    };
  }

  override render() {
    if (this.state.hasError) {
      let friendlyDetail = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage) as {
          error?: string;
          operationType?: string;
          path?: string;
        };
        if (parsed.error) {
          friendlyDetail = `${parsed.error} (${parsed.operationType ?? 'operação'} em ${parsed.path ?? 'Firestore'})`;
        }
      } catch {
        // Keep raw message if not JSON
      }

      return (
        <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#0C1320] text-[#141E2E] dark:text-[#F2EFE9] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#9A3412] dark:text-[#FCA5A5]">
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-xl font-semibold">
                Aviso da Base de Dados
              </h1>
            </div>
            <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] leading-relaxed">
              Ocorreu uma restrição de segurança ou de ligação ao sincronizar os dados:
            </p>
            <pre className="text-xs font-mono bg-[#F4F0E8] dark:bg-[#0C1320] p-3 rounded-xl overflow-x-auto text-[#556173] dark:text-[#A3B0C2]">
              {friendlyDetail}
            </pre>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Recarregar Aplicação</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
