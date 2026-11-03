import React, { useState } from 'react';
import { Reservation, LabId, ShiftType, ReservationStatus } from '../types';
import { 
  Calendar, Clock, Edit3, Filter, Search, FileText, Info, HelpCircle, AlertCircle, CheckCircle, Flame, Eye 
} from 'lucide-react';

interface MyReservationsViewProps {
  reservations: Reservation[];
  onEditReservation: (res: Reservation) => void;
  onDuplicateReservation: (res: Reservation) => void;
}

export default function MyReservationsView({
  reservations,
  onEditReservation,
  onDuplicateReservation
}: MyReservationsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'todos'>('todos');
  const [labFilter, setLabFilter] = useState<LabId | 'todos'>('todos');

  // Filter reservations. Standard practice is Profª. Maria Silva, we can assume all displayed are hers
  // or we can just filter by professorName directly or show all with clear filter. Let's make it show all
  // but prioritize their presentation cleanly.
  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      res.practiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.professorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || res.status === statusFilter;
    const matchesLab = labFilter === 'todos' || res.labId === labFilter;

    return matchesSearch && matchesStatus && matchesLab;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pendente
          </span>
        );
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Aprovado
          </span>
        );
      case 'preparacao':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            Em Preparação
          </span>
        );
      case 'finalizado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
            Finalizado
          </span>
        );
      case 'ajuste':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-bounce">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Ajuste Solicitado
          </span>
        );
      case 'reprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            Recusado
          </span>
        );
      default:
        return null;
    }
  };

  const getLabLabel = (labId: LabId) => {
    switch (labId) {
      case 'quimica': return 'Laboratório 1';
      case 'biologia': return 'Laboratório 2';
      case 'multiuso': return 'Laboratório 3';
      default: return labId;
    }
  };

  const getShiftLabel = (shift: ShiftType) => {
    switch (shift) {
      case 'manha': return 'Manhã (08h - 12h)';
      case 'tarde': return 'Tarde (14h - 18h)';
      case 'noite': return 'Noite (19h - 22h30)';
      default: return shift;
    }
  };

  // Check if a reservation status allows modification
  const canModify = (status: ReservationStatus) => {
    return status === 'pendente' || status === 'ajuste' || status === 'aprovado';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Meus Agendamentos de Práticas
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Gerencie e acompanhe o fluxo de homologação das suas reservas em tempo real, enviando correções caso solicitado.
          </p>
        </div>
      </div>

      {/* Modern Filter Bento Board */}
      <div className="glass-card rounded-xl p-4 bg-white border border-slate-150 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome da prática, disciplina ou docente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs font-medium border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full text-xs font-bold border border-slate-205 rounded-lg py-2.5 px-3 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="todos">Filtro: Todos Status</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="preparacao">Em Preparação</option>
            <option value="ajuste">Ajuste Solicitado</option>
            <option value="finalizado">Finalizado</option>
            <option value="reprovado">Recusado</option>
          </select>
        </div>

        {/* Lab Filter */}
        <div className="w-full md:w-48">
          <select
            value={labFilter}
            onChange={e => setLabFilter(e.target.value as any)}
            className="w-full text-xs font-bold border border-slate-205 rounded-lg py-2.5 px-3 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="todos">Filtro: Todos Labs</option>
            <option value="quimica">Laboratório 1</option>
            <option value="biologia">Laboratório 2</option>
            <option value="multiuso">Laboratório 3</option>
          </select>
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length > 0 ? (
        <div className="space-y-4">
          {filteredReservations.map(res => {
            const isEditable = canModify(res.status);
            return (
              <div 
                key={res.id} 
                className={`glass-card rounded-xl p-5 bg-white border transition-all hover:shadow-xs relative overflow-hidden flex flex-col justify-between ${
                  res.status === 'ajuste' ? 'border-l-4 border-l-rose-500 border-slate-200' : 'border-slate-200'
                }`}
              >
                {/* Visual indicator for corrections */}
                {res.status === 'ajuste' && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white font-mono font-bold text-[9px] uppercase px-3 py-1 rounded-bl-lg">
                    Revisão Necessária
                  </div>
                )}

                <div>
                  {/* Top line metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {getLabLabel(res.labId)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Criado em {res.createdAt}
                      </span>
                    </div>
                    <div>
                      {getStatusBadge(res.status)}
                    </div>
                  </div>

                  {/* Core details */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8 space-y-2">
                      <h3 className="text-md font-bold text-slate-900 tracking-tight leading-tight">
                        {res.practiceName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {res.course} — <span className="text-slate-400">{res.professorName}</span>
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-505 font-medium/60">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <strong>Data:</strong> {res.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <strong>Turno:</strong> {getShiftLabel(res.shift)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            res.reservationType === 'projeto' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {res.reservationType === 'projeto' 
                              ? `Projeto: Bancada(s) ${(res.selectedBenches || [1]).join(', ')}` 
                              : 'Aula Integral'
                            }
                          </span>
                          <span className="text-slate-500 font-medium">({res.studentCount} Alunos)</span>
                        </span>
                      </div>

                      {/* Display items requested capsules */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mr-1.5">Insumos:</span>
                        {res.reagentsNeeded.length > 0 ? (
                          res.reagentsNeeded.map(req => (
                            <span key={req.id} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100/70 font-medium">
                              {req.name} ({req.quantityTotalRequired})
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sem reagentes</span>
                        )}

                        {res.materialsNeeded.length > 0 && (
                          res.materialsNeeded.map(req => (
                            <span key={req.id} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100/70 font-medium">
                              {req.name} (x{req.quantityRequired})
                            </span>
                          ))
                        )}

                        {res.equipmentsNeeded.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100/70 font-medium">
                            {res.equipmentsNeeded.length} Equipamento(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right / tech feedback notes if adjusting or rejected */}
                    <div className="md:col-span-4 bg-slate-50/70 rounded-xl p-3.5 border border-slate-100/70 space-y-2 flex flex-col justify-center">
                      {res.status === 'ajuste' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                            <Info className="w-4 h-4" /> Observações do Técnico:
                          </div>
                          <div className="text-[11px] text-slate-705 italic bg-white p-2.5 rounded-lg border border-rose-100 font-medium leading-relaxed">
                            "{res.adjustNotes || 'Insuficiência de insumos ou conflitos de horário. Por favor, reavalie os reagentes solicitados para aula.'}"
                          </div>
                          <p className="text-[10px] text-rose-500 font-bold mt-1">
                            Clique em "Editar Solicitação" abaixo para corrigir e reenviar.
                          </p>
                        </>
                      ) : res.status === 'reprovado' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-red-700 font-condensed font-bold text-xs">
                            <AlertCircle className="w-4 h-4" /> Motivo da Recusa:
                          </div>
                          <div className="text-[11px] text-slate-650 bg-white p-2.5 rounded-lg border border-slate-200">
                            "{res.rejectionReason || 'Capacidade do laboratório excedida ou reagentes indisponíveis.'}"
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-xs text-slate-505 font-medium">Status do Fluxo:</p>
                          <div className="text-xs mt-1 font-bold text-slate-700 font-mono uppercase bg-slate-200/50 inline-block px-2.5 py-1 rounded">
                            {res.status === 'pendente' ? 'Aguardando Técnico' :
                             res.status === 'aprovado' ? 'Estoque Reservado' :
                             res.status === 'preparacao' ? 'Bancadas em Preparo' : 'Finalizada e Arquivada'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-2">
                            {res.attachmentName && (
                              <span className="inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {res.attachmentName}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM COMPONENT ACTIONS */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 font-sans">
                  <div className="text-[11px] text-slate-400 italic">
                    ID único: <span className="font-mono">{res.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDuplicateReservation(res)}
                      className="text-xs bg-slate-100 hover:bg-slate-205 text-slate-700 hover:text-slate-900 border border-slate-205 font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Reaproveitar dados para simular novo agendamento rápido"
                    >
                      Reagendar / Repetir
                    </button>

                    {isEditable ? (
                      <button
                        type="button"
                        onClick={() => onEditReservation(res)}
                        className={`text-xs font-bold py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          res.status === 'ajuste'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar Solicitação
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="text-xs bg-slate-100 text-slate-405 border border-slate-200 font-bold py-1.5 px-3.5 rounded-lg opacity-40 cursor-not-allowed flex items-center gap-1"
                        title="Aula em andamento ou já finalizada não pode ser alterada diretamente"
                      >
                        Não Editável
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 bg-white border border-slate-150 text-center text-slate-500 italic space-y-2">
          <p className="text-xs font-semibold">Nenhum agendamento encontrado.</p>
          <p className="text-[11px] text-slate-400 font-normal">Tente redefinir os filtros de status ou digitar um termo diferente na busca.</p>
        </div>
      )}
    </div>
  );
}
