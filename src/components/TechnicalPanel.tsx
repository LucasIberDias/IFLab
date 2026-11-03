import { useState } from 'react';
import { Reservation, Reagent, Material, Equipment } from '../types';
import { 
  CheckCircle2, XCircle, AlertCircle, Clock, 
  ArrowRight, ShieldAlert, Award, FileSpreadsheet, FileText, CheckSquare 
} from 'lucide-react';

interface TechnicalPanelProps {
  reservations: Reservation[];
  reagents: Reagent[];
  materials: Material[];
  equipments: Equipment[];
  onUpdateStatus: (id: string, newStatus: Reservation['status'], extra?: Partial<Reservation>) => void;
  onFinalizePractice: (
    reservationId: string, 
    usedReagents: Record<string, number>, // ID -> quantity
    usedMaterials: Record<string, number>, // ID -> quantity
    realWaste: Array<{ type: string; quantity: number; disposalMethod: string; collected: boolean }>
  ) => void;
}

export default function TechnicalPanel({
  reservations,
  reagents,
  materials,
  equipments,
  onUpdateStatus,
  onFinalizePractice
}: TechnicalPanelProps) {
  // Select which reservation to manage or view details
  const [selectedResId, setSelectedResId] = useState<string | null>(
    reservations.find(r => r.status === 'pendente' || r.status === 'preparacao' || r.status === 'aprovado')?.id || null
  );

  // States for Adjustment & Rejection forms
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adjustMode, setAdjustMode] = useState(false);
  const [adjustNotes, setAdjustNotes] = useState('');

  // States for Finalization UI
  const [finalizeMode, setFinalizeMode] = useState(false);
  
  // Maps item requirements to real consumption inputs
  const [actualReagentsUsed, setActualReagentsUsed] = useState<Record<string, number>>({});
  const [actualMaterialsUsed, setActualMaterialsUsed] = useState<Record<string, number>>({});
  const [actualWasteRecorded, setActualWasteRecorded] = useState<Array<{
    type: 'organico' | 'inorganico' | 'inflamavel' | 'oxidante' | 'biologico';
    quantity: number;
    unit: string;
    disposalMethod: string;
    collected: boolean;
  }>>([]);

  const selectedRes = reservations.find(r => r.id === selectedResId);

  // Triggering Finalization Mode
  const handleOpenFinalize = () => {
    if (!selectedRes) return;
    
    // Prefill inputs with predicted quantities
    const rMap: Record<string, number> = {};
    selectedRes.reagentsNeeded.forEach(req => {
      rMap[req.reagentId] = req.quantityTotalRequired;
    });

    const mMap: Record<string, number> = {};
    selectedRes.materialsNeeded.forEach(req => {
      mMap[req.materialId] = req.quantityRequired;
    });

    const wList = selectedRes.expectedWaste.map(w => ({
      type: w.type,
      quantity: w.quantity,
      unit: w.unit,
      disposalMethod: w.type === 'biologico' 
        ? 'Autoclavagem seguido por descarte classe A' 
        : w.type === 'inflamavel' 
        ? 'Saturação de vapores e segregação em bombona de solventes' 
        : 'Neutralização de pH e armazenamento sob contenção',
      collected: true
    }));

    setActualReagentsUsed(rMap);
    setActualMaterialsUsed(mMap);
    setActualWasteRecorded(wList);
    setFinalizeMode(true);
  };

  const handleConfirmFinalization = () => {
    if (!selectedRes) return;

    onFinalizePractice(
      selectedRes.id,
      actualReagentsUsed,
      actualMaterialsUsed,
      actualWasteRecorded
    );

    setFinalizeMode(false);
    setSelectedResId(null);
    alert('Prática finalizada com sucesso! O estoque foi atualizado e os resíduos foram catalogados.');
  };

  // Status badge style helper
  const getBadgeClass = (status: Reservation['status']) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'aprovado': return 'bg-green-100 text-green-800 border-green-200';
      case 'preparacao': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'finalizado': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'ajuste': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'reprovado': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div id="tech-panel-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: LIST OF RESERVATIONS (WORKFLOWS) */}
      <div className="lg:col-span-4 glass-card rounded-xl p-4 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            Workspace de Despacho Técnico
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Veja solicitações enviadas de práticas e mude os estágios da preparação.</p>
        </div>

        <div className="divide-y divide-slate-150 max-h-[600px] overflow-y-auto pr-1">
          {reservations.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-5">Nenhuma reserva agendada.</p>
          ) : (
            reservations.map(res => (
              <button
                key={res.id}
                id={`tech-res-item-${res.id}`}
                onClick={() => {
                  setSelectedResId(res.id);
                  setRejectMode(false);
                  setAdjustMode(false);
                  setFinalizeMode(false);
                }}
                className={`w-full text-left p-3 flex flex-col gap-1 rounded transition-all border cursor-pointer ${
                  selectedResId === res.id 
                    ? 'bg-slate-100 border-slate-300 text-slate-950 font-semibold shadow-xs' 
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{res.date} • {res.shift.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-wider ${getBadgeClass(res.status)}`}>
                    {res.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{res.practiceName}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>{res.professorName}</span>
                  <span className="bg-slate-100 px-1 py-0.2 rounded border text-slate-500 scale-95 uppercase font-bold">
                    {res.labId === 'quimica' ? 'Laboratório 1' : res.labId === 'biologia' ? 'Laboratório 2' : 'Laboratório 3'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTION AND DETAIL PANEL */}
      <div id="tech-action-panel" className="lg:col-span-8 space-y-4">
        {selectedRes ? (
          <div className="glass-card rounded-xl overflow-hidden shadow-sm">
            
            {/* Practice Hero Banner Info */}
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-mono tracking-wider font-extrabold bg-emerald-550/20 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase">
                  {selectedRes.course}
                </span>
                <span className="text-xs text-slate-400 font-mono">Reserva ID: {selectedRes.id}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1.5">{selectedRes.practiceName}</h2>
              
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-300">
                <div>
                  <span className="block text-[10px] text-slate-450 uppercase font-bold">Docente Solicitante</span>
                  <strong className="text-slate-100">{selectedRes.professorName}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-450 uppercase font-bold">Laboratório Físico</span>
                  <strong className="text-slate-100 text-sm">
                    {selectedRes.labId === 'quimica' ? 'Laboratório 1' : selectedRes.labId === 'biologia' ? 'Laboratório 2' : 'Laboratório 3'}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-450 uppercase font-bold">Data & Turno</span>
                  <strong className="text-white font-mono">{selectedRes.date} ({selectedRes.shift.toUpperCase()})</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-450 uppercase font-bold">Tipo & Bancadas</span>
                  <strong className="text-lime-400">
                    {selectedRes.reservationType === 'projeto' 
                      ? `Projeto: Bancada(s) ${(selectedRes.selectedBenches || [1]).join(', ')}` 
                      : `Aula Integral (Todas)`
                    }
                    <span className="text-slate-300 font-normal block text-[10px] mt-0.5">~{selectedRes.studentCount} Alunos</span>
                  </strong>
                </div>
              </div>
            </div>

            {/* MAIN CARD BODY: INTERACTIVE WORKFLOW PREPARATION GRID */}
            {!finalizeMode ? (
              <div className="p-6 space-y-6">
                
                {/* Status-specific Alerts or Actions details */}
                {selectedRes.status === 'pendente' && (
                  <div className="bg-amber-50 text-amber-805 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs font-medium">
                      <p className="font-bold text-amber-900">Ação Necessária: Análise de Estoque e Aprovação</p>
                      <p className="mt-1">
                        Verifique a lista de reagentes e materiais abaixo antes de aprovar. O estoque exibe a quantidade <strong>Física</strong>, <strong>Reservada</strong> e <strong>Disponível</strong> para evitar duplo agendamento.
                      </p>
                    </div>
                  </div>
                )}

                {selectedRes.status === 'ajuste' && (
                  <div className="bg-orange-50 text-orange-800 border border-orange-200 p-4 rounded-xl">
                    <p className="text-xs font-bold font-sans">Ajuste Solicitado ao Professor:</p>
                    <p className="text-xs italic text-slate-600 mt-1">"{selectedRes.adjustNotes || 'Nenhuma nota de ajuste informada.'}"</p>
                  </div>
                )}

                {selectedRes.status === 'preparacao' && (
                  <div className="bg-indigo-50 text-indigo-850 border border-indigo-250 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 text-xs">
                      <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-indigo-950">Laboratório em Preparação Operacional</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Separe e organize as quantidades físicas listadas abaixo nas bancadas. Após a execução da aula, clique em Finalizar para informar o consumo real.</p>
                      </div>
                    </div>
                    <button
                      id="tech-finalize-btn"
                      onClick={handleOpenFinalize}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm whitespace-nowrap"
                    >
                      Finalizar Prática
                    </button>
                  </div>
                )}

                {/* Visual Layout of Benches to Prepare */}
                <div id="tech-benches-layout" className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Mapa de Preparação de Bancadas
                      </h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        {selectedRes.reservationType === 'projeto' 
                          ? 'Tipo: Projeto. Prepare APENAS as bancadas indicadas para esta reserva.' 
                          : 'Tipo: Aula Integral. Prepare TODAS as bancadas do laboratório.'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border tracking-wider bg-indigo-50 text-indigo-700 border-indigo-200`}>
                      {selectedRes.reservationType === 'projeto' ? 'Projeto' : 'Aula Integral'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(benchNum => {
                      const isReserved = selectedRes.reservationType === 'projeto' 
                        ? (selectedRes.selectedBenches || [1]).includes(benchNum)
                        : true;

                      return (
                        <div 
                          key={benchNum}
                          className={`p-3 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                            isReserved 
                              ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 shadow-xs' 
                              : 'bg-slate-100/60 border-slate-200 text-slate-400'
                          }`}
                        >
                          <span className="text-xs font-bold block">Bancada {benchNum}</span>
                          {isReserved ? (
                            <span className="text-[9px] font-extrabold text-indigo-750 bg-indigo-100 px-1.5 py-0.5 rounded mt-1.5 uppercase">
                              PREPARAR / ORGANIZAR
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded mt-1.5 uppercase">
                              LIVRE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-section: 1. Reactants lists */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Reagentes Solicitados e Alocação de Estoque
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-55 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-2.5">Reagente</th>
                          <th className="p-2.5">Total Previsto</th>
                          <th className="p-2.5">Físico / Reservado</th>
                          <th className="p-2.5">Disponível no Inventário</th>
                          <th className="p-2.5">Classificação Legal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {selectedRes.reagentsNeeded.map(req => {
                          const stockItem = reagents.find(r => r.id === req.reagentId);
                          const isShort = stockItem ? (stockItem.physicalStock - stockItem.reservedStock) < req.quantityTotalRequired : false;
                          
                          return (
                            <tr key={req.id} className="text-slate-800 hover:bg-slate-50/50">
                              <td className="p-2.5">
                                <span className="font-bold block text-slate-900">{req.name}</span>
                                <span className="text-[10px] text-slate-400">Concentração: {req.concentration}</span>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-blue-700">{req.quantityTotalRequired} {stockItem?.unit || 'g'}</td>
                              <td className="p-2.5 font-mono text-slate-500">
                                {stockItem ? `${stockItem.physicalStock} / ${stockItem.reservedStock}` : 'N/D'}
                              </td>
                              <td className="p-2.5">
                                {stockItem ? (
                                  <span className={`font-mono font-bold ${isShort ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {stockItem.physicalStock - stockItem.reservedStock} {stockItem.unit}
                                    {isShort && ' Estoque Insuficiente'}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-semibold italic text-[10.5px]">Item Dinâmico Pendente</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                {stockItem?.classification === 'controlado_pf' ? (
                                  <span className="bg-red-50 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-rose-200">Polícia Federal</span>
                                ) : stockItem?.classification === 'controlado_exercito' ? (
                                  <span className="bg-violet-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-indigo-200">Exército</span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Livre</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-section: 2. Materials selection */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Materiais Requeridos (Separação Diferida)
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-55 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5">Categoria</th>
                          <th className="p-2.5">Qtd Solicitada</th>
                          <th className="p-2.5">Estoque Físico</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {selectedRes.materialsNeeded.map(req => {
                          const stockItem = materials.find(m => m.id === req.materialId);
                          return (
                            <tr key={req.id} className="text-slate-800 hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-950">{req.name}</td>
                              <td className="p-2.5 capitalize">{req.type}</td>
                              <td className="p-2.5 font-mono font-bold text-emerald-800">{req.quantityRequired} {stockItem?.unit || 'unidades'}</td>
                              <td className="p-2.5 font-mono text-slate-500">{stockItem?.physicalStock || 'Dinâmico'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-section: 3. Equipment used */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Equipamentos Fixos Vinculados
                  </h3>
                  {selectedRes.equipmentsNeeded.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedRes.equipmentsNeeded.map(eqId => {
                        const eq = equipments.find(e => e.id === eqId);
                        return (
                          <div key={eqId} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <span className="font-bold block text-slate-800">{eq?.name || 'Equipamento'}</span>
                            <span className="text-[10.5px] text-slate-400 mt-1 block">Condição: {eq?.condition}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum equipamento coletivo fixo foi atrelado a essa prática.</p>
                  )}
                </div>

                {/* Sub-section: 4. Anticipated Waste Logs */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Resíduos Esperados (Declarados pelo Professor)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedRes.expectedWaste.map((w, index) => (
                      <div key={index} className="px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-xs flex flex-col justify-between">
                        <span className="font-bold text-slate-800 uppercase block tracking-wider">{w.type}</span>
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="text-[11px] text-slate-400 font-medium">Capacidade Coleta</span>
                          <span className="bg-slate-200/50 px-2 py-0.5 rounded font-mono font-bold text-slate-800 text-[11px]">{w.quantity} {w.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PDF Attachment View */}
                {selectedRes.attachmentName && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-bold text-slate-850 block">{selectedRes.attachmentName}</span>
                        <span className="text-slate-405 block">Roteiro técnico e metodologia experimental anexados pelo docente.</span>
                      </div>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert("Simulando download do PDF de roteiro prático da aula."); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      Abrir Roteiro PDF
                    </a>
                  </div>
                )}

                {/* WORKFLOW BOTTOM CTAs FOR STATE UPDATES */}
                <div className="pt-5 border-t border-slate-150 flex flex-wrap gap-2 items-center justify-between">
                  
                  {/* Solicit Adjust Mode OR Reject Mode Form Trigger tabs */}
                  {!rejectMode && !adjustMode ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      {selectedRes.status === 'pendente' && (
                        <>
                          <button
                            id="tech-approve-btn"
                            onClick={() => {
                              onUpdateStatus(selectedRes.id, 'aprovado');
                              alert('A reserva foi Aprovada com sucesso! O estoque foi reservado de forma temporária.');
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                          >
                            Aprovar Reserva
                          </button>
                          
                          <button
                            id="tech-adjust-trigger"
                            onClick={() => setAdjustMode(true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-all"
                          >
                            Solicitar Ajuste
                          </button>

                          <button
                            id="tech-reject-trigger"
                            onClick={() => setRejectMode(true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-all"
                          >
                            Indeferir
                          </button>
                        </>
                      )}

                      {selectedRes.status === 'aprovado' && (
                        <button
                          id="tech-prep-btn"
                          onClick={() => {
                            onUpdateStatus(selectedRes.id, 'preparacao');
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          Iniciar Preparação do Lab <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Reject Mode Form */}
                  {rejectMode && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl w-full">
                      <label className="block text-xs font-bold text-rose-900 mb-1">Motivo do Indeferimento</label>
                      <textarea
                        id="rejection-reason-input"
                        placeholder="Informe as razões para indeferir o agendamento..."
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="w-full text-xs border border-rose-300 rounded-lg p-2 bg-white text-slate-800 focus:outline"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setRejectMode(false)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border text-slate-700 text-xs font-bold rounded"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={() => {
                            if (!rejectionReason.trim()) return alert('Informe o motivo');
                            onUpdateStatus(selectedRes.id, 'reprovado', { rejectionReason });
                            setRejectMode(false);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded"
                        >
                          Confirmar Indeferimento
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Adjust Mode Form */}
                  {adjustMode && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl w-full">
                      <label className="block text-xs font-bold text-orange-900 mb-1">Quais ajustes o docente precisa fazer?</label>
                      <textarea
                        id="adjust-notes-input"
                        placeholder="Ex: Não há balões de volumetria suficientes neste turno. Por favor diminuir a quantidade ou alterar para o turno da noite..."
                        value={adjustNotes}
                        onChange={e => setAdjustNotes(e.target.value)}
                        className="w-full text-xs border border-orange-300 rounded-lg p-2 bg-white text-slate-800 focus:outline"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setAdjustMode(false)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border text-slate-700 text-xs font-bold rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (!adjustNotes.trim()) return alert('Escreva as notas de ajuste');
                            onUpdateStatus(selectedRes.id, 'ajuste', { adjustNotes });
                            setAdjustMode(false);
                          }}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded"
                        >
                          Solicitar Ajuste Oficial
                        </button>
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 italic font-medium">IFLab: Segurança e Conformidade Técnica</span>
                </div>

              </div>
            ) : (
              // ============================================
              // CORE MVP OPTIMIZATION: REAL FINALIZATION PANEL
              // ============================================
              <div id="finalize-practice-mode" className="p-6 space-y-6">
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-300">Conclusão Real de Consumo e Inventário</p>
                    <p className="mt-0.5 text-slate-300">
                      O estoque físico oficial **NÃO** foi diminuído anteriormente. Informe as quantidades realmente consumidas abaixo. Sobras voltarão ao estoque livre.
                    </p>
                  </div>
                </div>

                {/* Actual Reagent Consumption Table Form */}
                <div>
                  <h3 className="text-xs font-bold text-slate-705 uppercase mb-2 flex items-center gap-1.5 border-b pb-1">
                    Consumo Real de Reagentes
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Reagente</th>
                          <th className="p-2.5">Previsto por Docente</th>
                          <th className="p-2.5">Quantidade Realmente Consumida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {selectedRes.reagentsNeeded.map(req => {
                          const item = reagents.find(r => r.id === req.reagentId);
                          return (
                            <tr key={req.id} className="align-middle bg-white hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-850">
                                {req.name} <span className="text-[10px] text-slate-400 font-normal">({req.concentration})</span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-605">{req.quantityTotalRequired} {item?.unit || 'g'}</td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    id={`input-real-reagent-${req.id}`}
                                    type="number"
                                    min="0"
                                    value={actualReagentsUsed[req.reagentId] ?? req.quantityTotalRequired}
                                    onChange={e => setActualReagentsUsed({
                                      ...actualReagentsUsed,
                                      [req.reagentId]: Number(e.target.value)
                                    })}
                                    className="w-24 border border-slate-300 rounded p-1 text-xs font-mono font-bold font-slate-850 text-blue-700 focus:outline-none"
                                  />
                                  <span className="font-mono text-slate-400 font-bold">{item?.unit}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actual Material Consumption Table Form */}
                <div>
                  <h3 className="text-xs font-bold text-slate-705 uppercase mb-2 flex items-center gap-1.5 border-b pb-1">
                    Perdas e Consumo Real de Vidrarias & Materiais
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5">Previsto</th>
                          <th className="p-2.5">Realmente Utilizado (ou Perdas)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {selectedRes.materialsNeeded.map(req => {
                          const item = materials.find(m => m.id === req.materialId);
                          return (
                            <tr key={req.id} className="align-middle bg-white hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-850">{req.name}</td>
                              <td className="p-2.5 font-mono text-slate-605">{req.quantityRequired} {item?.unit || 'un'}</td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    id={`input-real-material-${req.id}`}
                                    type="number"
                                    min="0"
                                    value={actualMaterialsUsed[req.materialId] ?? req.quantityRequired}
                                    onChange={e => setActualMaterialsUsed({
                                      ...actualMaterialsUsed,
                                      [req.materialId]: Number(e.target.value)
                                    })}
                                    className="w-24 border border-slate-300 rounded p-1 text-xs font-mono font-bold font-slate-850 text-blue-700 focus:outline-none"
                                  />
                                  <span className="font-mono text-slate-400 font-bold">{item?.unit}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actual Real Wastes Confirm details */}
                <div>
                  <h3 className="text-xs font-bold text-slate-705 uppercase mb-2 flex items-center gap-1.5 border-b pb-1">
                    Cadastro Oficial de Descarte de Resíduos
                  </h3>
                  <div className="space-y-3">
                    {actualWasteRecorded.map((w, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            Resíduo {w.type}
                          </span>
                          <span className="text-xs text-slate-400">Declarado: {w.quantity} {w.unit}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-3 flex items-center gap-2">
                            <label className="text-[11px] font-bold text-slate-600">Volume Total:</label>
                            <input
                              id={`input-real-waste-val-${idx}`}
                              type="number"
                              step="0.1"
                              value={w.quantity}
                              onChange={e => {
                                const list = [...actualWasteRecorded];
                                list[idx].quantity = Number(e.target.value);
                                setActualWasteRecorded(list);
                              }}
                              className="w-16 border rounded p-1 font-mono text-xs text-center font-bold bg-white"
                            />
                            <span className="text-xs font-mono font-bold text-slate-400">{w.unit}</span>
                          </div>

                          <div className="md:col-span-6">
                            <input
                              id={`input-real-waste-method-${idx}`}
                              type="text"
                              value={w.disposalMethod}
                              placeholder="Forma ou bombona de destinação..."
                              onChange={e => {
                                const list = [...actualWasteRecorded];
                                list[idx].disposalMethod = e.target.value;
                                setActualWasteRecorded(list);
                              }}
                              className="w-full border rounded p-1 text-xs bg-white text-slate-800"
                            />
                          </div>

                          <div className="md:col-span-3 flex items-center gap-2">
                            <input
                              id={`check-real-waste-collected-${idx}`}
                              type="checkbox"
                              checked={w.collected}
                              onChange={e => {
                                const list = [...actualWasteRecorded];
                                list[idx].collected = e.target.checked;
                                setActualWasteRecorded(list);
                              }}
                              className="rounded border border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-500"
                            />
                            <label className="text-[11px] font-bold text-slate-600 cursor-pointer">Coleta Bombona concluída</label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => setFinalizeMode(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold transition-all"
                  >
                    Voltar para Visualização
                  </button>
                  
                  <button
                    id="tech-confirm-finalize-btn"
                    onClick={handleConfirmFinalization}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <Award className="w-4 h-4" /> Registrar Consumo Real & Atualizar Estoque
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-8 text-center text-slate-400 italic text-sm">
            Selecione uma prática na barra lateral para aprovar, iniciar preparação ou finalizar consumo.
          </div>
        )}
      </div>

    </div>
  );
}
