import React, { useState } from 'react';
import { Reservation, LabId, ShiftType } from '../types';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2, AlertCircle, PlayCircle, Eye, RefreshCw } from 'lucide-react';
import { isReservationDateBlocked } from '../utils/dateUtils';

interface CalendarViewProps {
  reservations: Reservation[];
  currentRole: 'professor' | 'tecnico';
  selectedLab: LabId;
  setSelectedLab: (lab: LabId) => void;
  onOpenNewReservation: (date: string, shift: ShiftType, labId: LabId) => void;
  onReviewReservation: (reservation: Reservation) => void;
  onDuplicateReservation?: (reservation: Reservation) => void;
}

export default function CalendarView({
  reservations,
  currentRole,
  selectedLab,
  setSelectedLab,
  onOpenNewReservation,
  onReviewReservation,
  onDuplicateReservation
}: CalendarViewProps) {
  // Dynamic Year and Month state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());

  // Portuguese helper arrays
  const LAB_NAMES: Record<LabId, string> = {
    quimica: 'Laboratório 1',
    biologia: 'Laboratório 2',
    multiuso: 'Laboratório 3'
  };

  const SHIFT_LABELS: Record<ShiftType, { name: string; hours: string; color: string }> = {
    manha: { name: 'Manhã', hours: '08:00 - 12:00', color: 'border-amber-200 bg-amber-50/70 text-amber-900 group-hover:bg-amber-100/50' },
    tarde: { name: 'Tarde', hours: '14:00 - 18:00', color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 group-hover:bg-emerald-100/50' },
    noite: { name: 'Noite', hours: '19:00 - 22:30', color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900 group-hover:bg-indigo-100/50' }
  };

  // Status Labels and Color themes
  const STATUS_THEMES: Record<Reservation['status'], { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    pendente: {
      label: 'Pendente',
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      text: 'text-amber-800',
      icon: <AlertCircle className="w-4 h-4 text-amber-600" />
    },
    aprovado: {
      label: 'Aprovado',
      bg: 'bg-green-100 text-green-800 border-green-300',
      text: 'text-green-800',
      icon: <CheckCircle2 className="w-4 h-4 text-green-600" />
    },
    reprovado: {
      label: 'Reprovado',
      bg: 'bg-red-100 text-red-800 border-red-300',
      text: 'text-red-800',
      icon: <AlertCircle className="w-4 h-4 text-red-600" />
    },
    ajuste: {
      label: 'Solicitado Ajuste',
      bg: 'bg-orange-100 text-orange-800 border-orange-300',
      text: 'text-orange-800',
      icon: <RefreshCw className="w-4 h-4 text-orange-600" />
    },
    preparacao: {
      label: 'Em Preparação',
      bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      text: 'text-indigo-800',
      icon: <PlayCircle className="w-4 h-4 text-indigo-600" />
    },
    finalizado: {
      label: 'Finalizado',
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      text: 'text-slate-800',
      icon: <CheckCircle2 className="w-4 h-4 text-slate-600" />
    }
  };

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Dynamic Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  // Get date string (YYYY-MM-DD) for a specific day number
  const getDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Check if a day has any reservations for the currently selected lab
  const getDayReservations = (day: number) => {
    const dateStr = getDateString(day);
    return reservations.filter(r => r.date === dateStr && r.labId === selectedLab);
  };

  const selectedDateStr = getDateString(selectedDay) || '';
  const selectedDayReservations = reservations.filter(
    r => r.date === selectedDateStr && r.labId === selectedLab
  );

  // Check 48 hour restriction rule
  const isDateRestricted = (day: number) => {
    const dateStr = getDateString(day);
    return isReservationDateBlocked(dateStr);
  };

  // Filter past or already conducted classes
  const historicReservations = reservations.filter(
    r => r.status === 'finalizado' || new Date(`${r.date}T12:00:00`) < new Date()
  );

  return (
    <div className="space-y-6">
      <div id="calendar-section" className="glass-card rounded-xl overflow-hidden shadow-xs">
        {/* Header with Lab selector */}
      <div className="p-5 border-b border-slate-150 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            Agenda Inteligente
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Selecione o laboratório para visualizar ocupações e solicitar ou gerenciar reservas.
          </p>
        </div>
        
        {/* Lab selector pills */}
        <div className="flex bg-slate-100 rounded p-1 border border-slate-200 self-start md:self-auto">
          {(['quimica', 'biologia', 'multiuso'] as LabId[]).map(lab => (
            <button
              key={lab}
              id={`tab-lab-${lab}`}
              onClick={() => setSelectedLab(lab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded transition-all duration-200 cursor-pointer ${
                selectedLab === lab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lab === 'quimica' ? 'Laboratório 1' : lab === 'biologia' ? 'Laboratório 2' : 'Laboratório 3'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-slate-50/20">
        
        {/* MONTH VIEW CALENDAR GRID */}
        <div className="p-5 lg:col-span-8 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(y => y - 1);
                  } else {
                    setCurrentMonth(m => m - 1);
                  }
                  setSelectedDay(1);
                }}
                className="p-1 rounded hover:bg-slate-105 border border-slate-200 text-slate-700 transition-all cursor-pointer font-bold w-7 h-7 flex items-center justify-center animate-fade-in"
                title="Mês Anterior"
              >
                &lsaquo;
              </button>
              <h3 className="text-md font-bold text-slate-800">
                {MONTH_NAMES[currentMonth]} de {currentYear}
              </h3>
              <button
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(y => y + 1);
                  } else {
                    setCurrentMonth(m => m + 1);
                  }
                  setSelectedDay(1);
                }}
                className="p-1 rounded hover:bg-slate-105 border border-slate-200 text-slate-700 transition-all cursor-pointer font-bold w-7 h-7 flex items-center justify-center animate-fade-in"
                title="Próximo Mês"
              >
                &rsaquo;
              </button>
            </div>
            <span className="text-xs font-medium text-slate-400 font-mono">
              Obs: 48h de antecedência mínima obrigatória
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-500 mb-2">
            <div>D</div>
            <div>S</div>
            <div>T</div>
            <div>Q</div>
            <div>Q</div>
            <div>S</div>
            <div>S</div>
          </div>

          {/* Calendar Day Tiles */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-16 rounded-lg bg-slate-100/40"></div>;
              }

              const dateStr = getDateString(day);
              const todayObj = new Date();
              const isToday = currentYear === todayObj.getFullYear() && currentMonth === todayObj.getMonth() && day === todayObj.getDate();
              const isSelected = selectedDay === day;
              const hasBookings = getDayReservations(day).length > 0;
              const restricted = isDateRestricted(day);

              return (
                <button
                  key={`day-${day}`}
                  id={`calendar-day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`h-16 rounded-lg border text-left p-1.5 relative flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/50 shadow-sm'
                      : isToday
                      ? 'border-emerald-400 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-slate-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold font-mono ${
                      isSelected 
                        ? 'text-emerald-800 font-extrabold' 
                        : isToday 
                        ? 'text-emerald-700 font-extrabold' 
                        : 'text-slate-705'
                    }`}>
                      {day}
                      {isToday && (
                        <span className="ml-1 text-[9px] bg-emerald-100/80 text-emerald-800 px-1 py-0.2 rounded font-sans uppercase font-normal">
                          Hoje
                        </span>
                      )}
                    </span>
                    {restricted && !isToday && (
                      <span className="text-[10px] text-orange-500 font-bold bg-orange-100 px-1 py-0.2 rounded" title="Restrito (passado ou inferior a 48h)">!</span>
                    )}
                  </div>

                  {/* Booking indicator dots */}
                  {hasBookings && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {getDayReservations(day).map(r => {
                        let color = 'bg-amber-400';
                        if (r.status === 'aprovado') color = 'bg-green-500';
                        if (r.status === 'preparacao') color = 'bg-indigo-600';
                        if (r.status === 'finalizado') color = 'bg-slate-400';
                        if (r.status === 'ajuste') color = 'bg-orange-400';
                        if (r.status === 'reprovado') color = 'bg-red-500';

                        return (
                          <span
                            key={r.id}
                            className={`w-2 h-2 rounded-full ${color}`}
                            title={`${SHIFT_LABELS[r.shift].name}: ${r.practiceName}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Color legend */}
          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block w-full mb-1">Fluxo do Agendamento:</span>
            <div className="flex items-center gap-1.5 bg-slate-100/70 py-1 px-2.5 rounded-full border border-slate-200/60 transition-transform">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>1. Pendente</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100/70 py-1 px-2.5 rounded-full border border-slate-200/60 transition-transform">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span>2. Ajuste Solicitado</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100/70 py-1 px-2.5 rounded-full border border-slate-200/60 transition-transform">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span>3. Aprovado</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100/70 py-1 px-2.5 rounded-full border border-slate-200/60 transition-transform">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>4. Em Preparação</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100/70 py-1 px-2.5 rounded-full border border-slate-200/60 transition-transform">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span>5. Finalizado</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100/70 py-1 px-2.5 rounded-full border border-slate-200/60 transition-transform">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>6. Reprovado</span>
            </div>
          </div>
        </div>

        {/* CLICK ACTION DETAIL LIST: THE 3 SHIFTS LIST */}
        <div className="p-5 lg:col-span-4 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-md font-bold text-slate-900 inline-flex items-center gap-1.5">
                {selectedDay} de {MONTH_NAMES[currentMonth]} de {currentYear}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1 font-sans">
                {LAB_NAMES[selectedLab]}
              </p>
            </div>

            {/* Turnos List */}
            <div className="space-y-4 mt-4">
              {(['manha', 'tarde', 'noite'] as ShiftType[]).map(shift => {
                const shiftDetail = SHIFT_LABELS[shift];
                const shiftResList = selectedDayReservations.filter(r => r.shift === shift);
                const hasReservations = shiftResList.length > 0;
                const isRestricted = isReservationDateBlocked(selectedDateStr, shift);

                // Check if any reservation blocks the entire shift (either an 'aula' exists, or we reached max 3 benches for projects)
                const isBlockedByClass = shiftResList.some(r => r.reservationType === 'aula' || !r.reservationType);
                const totalBenchesBooked = shiftResList.reduce((acc, cur) => acc + (cur.selectedBenches?.length || cur.benchesCount || 1), 0);
                const isShiftFullyLoaded = isBlockedByClass || totalBenchesBooked >= 3;

                return (
                  <div
                    key={shift}
                    id={`shift-card-${shift}`}
                    className="group border border-slate-200 rounded-xl bg-white p-4 shadow-sm hover:shadow transition-all duration-150"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${shiftDetail.color}`}>
                          {shiftDetail.name}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {shiftDetail.hours}
                        </div>
                      </div>

                      {/* Right top status/action indicator */}
                      {!hasReservations && isRestricted && currentRole === 'professor' ? (
                        <span className="text-[10px] bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                          Bloqueado
                        </span>
                      ) : null}
                    </div>

                    {/* Main content of shift card */}
                    {hasReservations ? (
                      <div className="space-y-3.5">
                        {shiftResList.map(res => {
                          const isProject = res.reservationType === 'projeto';
                          const labelType = isProject ? 'Projeto' : 'Aula Integral';
                          const benchesStr = isProject 
                            ? `Bancadas: ${(res.selectedBenches || []).join(', ')}` 
                            : 'Lab Completo';

                          return (
                            <div key={res.id} className="border-l-2 border-indigo-505 pl-3 py-1 bg-slate-50/50 rounded-r-lg p-2 border-l-indigo-500">
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  isProject 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                  {labelType} • {benchesStr}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {res.id.substring(0, 8)}</span>
                              </div>

                              <h4 className="font-bold text-slate-900 text-xs mt-1.5 line-clamp-1">
                                {res.practiceName}
                              </h4>
                              
                              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-1">
                                <span className="italic truncate max-w-[150px]" title={res.professorName}>
                                  Prof. {res.professorName}
                                </span>
                                <span className="font-mono">
                                  {res.studentCount} alunos
                                </span>
                              </div>

                              {/* Status + CTA Review Button */}
                              <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200/40">
                                <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider rounded border flex items-center gap-0.5 ${
                                  STATUS_THEMES[res.status].bg
                                }`}>
                                  {STATUS_THEMES[res.status].icon}
                                  {STATUS_THEMES[res.status].label}
                                </span>

                                <button
                                  id={`rev-btn-${res.id}`}
                                  onClick={() => onReviewReservation(res)}
                                  className="text-[10.5px] bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded flex items-center gap-0.5 transition-all cursor-pointer border"
                                >
                                  <Eye className="w-3 h-3" />
                                  Visualizar
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* If it's projects but still has benches left, professors can still book other benches */}
                        {currentRole === 'professor' && !isShiftFullyLoaded && (
                          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex justify-end">
                            <button
                              id={`book-btn-${shift}`}
                              disabled={isRestricted}
                              onClick={() => onOpenNewReservation(selectedDateStr, shift, selectedLab)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-0.5 transition-all cursor-pointer ${
                                isRestricted
                                  ? 'bg-slate-50 text-slate-400 cursor-not-allowed border'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xs'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              Adicionar Projeto no Turno (+ Bancada)
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Unscheduled Slot
                      <div>
                        <p className="text-xs text-slate-400 italic">Disponível para agendamento.</p>
                        
                        {currentRole === 'professor' ? (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              id={`book-btn-${shift}`}
                              disabled={isRestricted}
                              onClick={() => onOpenNewReservation(selectedDateStr, shift, selectedLab)}
                              className={`text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                                isRestricted
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-sm'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Solicitar Reserva
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-slate-400 font-medium">
                            Nenhum professor agendou este turno.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* HISTÓRICO DE PRÁTICAS E REPETIÇÃO DE AULAS */}
      <div id="historic-practices-section" className="glass-card rounded-xl p-5 bg-white border border-slate-200 shadow-xs">
        <div className="border-b border-slate-150 pb-4 mb-4">
          <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
            Histórico de Aulas Práticas Realizadas
          </h3>
          <p className="text-xs text-slate-505 mt-1">
            Consulte as práticas laboratoriais cadastradas ou finalizadas e repita a aula em novos agendamentos rapidamente com dados preenchidos.
          </p>
        </div>

        {historicReservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historicReservations.map(res => (
              <div 
                key={res.id} 
                className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                      {res.labId === 'quimica' ? 'Laboratório 1' : res.labId === 'biologia' ? 'Laboratório 2' : 'Laboratório 3'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Original: {res.date} ({res.shift === 'manha' ? 'Manhã' : res.shift === 'tarde' ? 'Tarde' : 'Noite'})
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{res.practiceName}</h4>
                  <p className="text-xs text-slate-500 font-medium">{res.course} — {res.professorName}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {res.reagentsNeeded?.length > 0 && res.reagentsNeeded.map(req => (
                      <span key={req.id} className="text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-1.5 py-0.5">
                        {req.name} {req.quantityTotalRequired}
                      </span>
                    ))}
                    {res.materialsNeeded?.length > 0 && res.materialsNeeded.map(req => (
                      <span key={req.id} className="text-[9.5px] bg-blue-50 text-blue-800 border border-blue-100 rounded px-1.5 py-0.5">
                        {req.name} ({req.quantityRequired})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-150 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onDuplicateReservation) {
                        onDuplicateReservation(res);
                      }
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    Repetir esta Prática
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Nenhuma aula concluída ou histórico registrado encontrado.</p>
        )}
      </div>
    </div>
  );
}
