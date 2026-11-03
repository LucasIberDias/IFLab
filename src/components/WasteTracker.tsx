import { Reservation } from '../types';
import { AlertCircle, Truck, Trash2, Check, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface WasteTrackerProps {
  reservations: Reservation[];
  onMarkCollected?: (reservationId: string) => void;
  onClearAllWastes?: () => void;
}

export default function WasteTracker({ reservations, onClearAllWastes }: WasteTrackerProps) {
  // Aggregate all finished reservations containing real waste logged
  const finalizedPractices = reservations.filter(
    r => r.status === 'finalizado' && (r.actualWaste?.length || r.expectedWaste?.length)
  );

  // States for pickup requests
  const [pickupRequested, setPickupRequested] = useState(false);
  const [selectedWasteTypeForPickup, setSelectedWasteTypeForPickup] = useState('todos');

  // Categories translation and limits
  const CATEGORIES = {
    organico: { label: 'Orgânico', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', limit: 10 /* L */ },
    inorganico: { label: 'Inorgânico', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', limit: 8 },
    inflamavel: { label: 'Inflamável', color: 'bg-orange-100 text-orange-850 border-orange-300', limit: 5 },
    oxidante: { label: 'Oxidante', color: 'bg-purple-100 text-purple-800 border-purple-300', limit: 4 },
    biologico: { label: 'Biológico', color: 'bg-rose-100 text-rose-800 border-rose-300', limit: 3 }
  };

  // Compute accumulated waste volumes currently in lab
  const totals: Record<string, number> = {
    organico: 0,
    inorganico: 0,
    inflamavel: 0,
    oxidante: 0,
    biologico: 0
  };

  finalizedPractices.forEach(res => {
    const list = res.actualWaste || res.expectedWaste || [];
    list.forEach(item => {
      const type = item.type;
      const qty = item.realQuantity ?? item.quantity;
      if (totals[type] !== undefined) {
        totals[type] += qty;
      }
    });
  });

  const handleRequestPickup = () => {
    setPickupRequested(true);
    setTimeout(() => {
      alert(`Solicitação de Coleta Especial homologada com sucesso junto à Reitoria e Órgão de Gestão de Resíduos Campus!`);
      setPickupRequested(false);
    }, 1500);
  };

  return (
    <div id="waste-tracker-section" className="glass-card rounded-xl overflow-hidden shadow-xs">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-150 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Centro de Custódia e Gestão de Resíduos Químicos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Professores planejam os resíduos esperados e o técnico gerencia o descarte oficial, bombonas e coletas campus.
          </p>
        </div>

        <div className="flex gap-2">
          {onClearAllWastes && (
            <button
              id="btn-clear-all-wastes"
              onClick={onClearAllWastes}
              className="self-start sm:self-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Coleta Realizada
            </button>
          )}

          <button
            id="btn-trigger-pickup"
            onClick={handleRequestPickup}
            disabled={pickupRequested}
            className="self-start sm:self-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            {pickupRequested ? 'Processando Solicitação...' : 'Solicitar Coleta Campus'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* TOTALS OVERVIEW / LIMIT ALERTERS */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Custódia Acumulada no Almoxarifado</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(catKey => {
              const info = CATEGORIES[catKey];
              const value = totals[catKey] || 0;
              const isOverLimit = value >= info.limit;

              return (
                <div
                  key={catKey}
                  className={`p-4 rounded-xl border flex flex-col justify-between h-28 relative ${
                    isOverLimit ? 'bg-orange-50/70 border-orange-250 ring-1 ring-orange-200' : 'bg-slate-50/40 border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${info.color}`}>
                      {info.label}
                    </span>
                    <strong className="block text-xl font-mono text-slate-900 mt-2 font-bold select-all">
                      {value.toFixed(2)} <span className="text-xs font-semibold text-slate-500">L</span>
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Limite: {info.limit}L</span>
                    {isOverLimit && (
                      <span className="text-orange-600 font-bold flex items-center gap-0.5" title="Capacidade máxima de estocagem atingida!">
                        LIMITE ALCANÇADO
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOG OF DESCARTE ITEMS */}
        <div>
          <h3 className="text-xs font-bold text-slate-505 uppercase tracking-wider mb-2">Histórico de Resíduos Catalogados</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Data / Aula Prática</th>
                  <th className="p-3">Resíduo Gerado</th>
                  <th className="p-3">Destinação Realizada</th>
                  <th className="p-3">Professor Responsável</th>
                  <th className="p-3 text-center">Coleta Efetuada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {finalizedPractices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                      Nenhum resíduo foi catalogado de práticas finalizadas ainda.
                    </td>
                  </tr>
                ) : (
                  finalizedPractices.map(res => {
                    const wastes = res.actualWaste || res.expectedWaste || [];
                    return wastes.map((w, wIdx) => {
                      const catInfo = CATEGORIES[w.type as keyof typeof CATEGORIES] || { color: 'bg-slate-100 text-slate-705' };
                      
                      return (
                        <tr key={`${res.id}-${wIdx}`} className="hover:bg-slate-50 text-slate-850">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{res.practiceName}</span>
                            <span className="font-mono text-[10px] text-slate-500">{res.date}</span>
                          </td>
                          <td className="p-3">
                            <span className={`mr-2 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${catInfo.color}`}>
                              {w.type}
                            </span>
                            <strong className="font-mono text-emerald-700 text-xs">
                              {w.realQuantity ?? w.quantity} {w.unit}
                            </strong>
                          </td>
                          <td className="p-3 italic max-w-xs truncate text-[11px] text-slate-606" title={w.disposalMethod || 'Armazenado temporariamente.'}>
                            {w.disposalMethod || 'Armazenado em bombona e classificado de acordo com norma ABNT.'}
                          </td>
                          <td className="p-3">{res.professorName}</td>
                          <td className="p-3 text-center">
                            {w.collected !== false ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-sans">
                                Confirmado
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-805 border border-amber-205 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-sans">
                                Pendente
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informational Guidelines Alert */}
        <div id="waste-guidelines-box" className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 font-medium">
            <h4 className="font-bold text-slate-800">Diretrizes de Segurança de Laboratório e Descarte Campus</h4>
            <p className="mt-1 text-slate-500 leading-relaxed">
              Resíduos químicos e biológicos não podem ser descartados em rede de esgoto comum. O professor tem o papel central de programar os resíduos para que o técnico separe as bombonas identificadas no laboratório físicas (Vidro Âmbar, Bombonas PEAD, autoclave para risco biológico). O volume acumulado no almoxarifado é monitorado e emite alerta de lotado para descarte campus imediato.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
