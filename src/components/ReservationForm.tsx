import React, { useState, useRef } from 'react';
import { Reservation, LabId, ShiftType, Reagent, Material, Equipment } from '../types';
import { X, Plus, Trash2, FileText, UploadCloud, Info } from 'lucide-react';
import { isReservationDateBlocked } from '../utils/dateUtils';

interface ReservationFormProps {
  initialDate: string;
  initialShift: ShiftType;
  initialLabId: LabId;
  reagents: Reagent[];
  materials: Material[];
  equipments: Equipment[];
  onClose: () => void;
  onSubmit: (reservationData: Partial<Reservation>) => void;
  prePopulateWith?: Reservation;
  allReservations: Reservation[];
}

export default function ReservationForm({
  initialDate,
  initialShift,
  initialLabId,
  reagents,
  materials,
  equipments,
  onClose,
  onSubmit,
  prePopulateWith,
  allReservations
}: ReservationFormProps) {
  // Practice General States
  const [practiceName, setPracticeName] = useState(prePopulateWith?.practiceName || '');
  const [course, setCourse] = useState(prePopulateWith?.course || '');
  const [studentCount, setStudentCount] = useState<number>(prePopulateWith?.studentCount || 20);
  const [labId, setLabId] = useState<LabId>(prePopulateWith?.labId || initialLabId);
  const [date, setDate] = useState(initialDate);
  const [shift, setShift] = useState<ShiftType>(initialShift);

  // New Booking Type ('aula' | 'projeto') & selected benches (1, 2, 3)
  const [reservationType, setReservationType] = useState<'aula' | 'projeto'>(() => {
    if (prePopulateWith?.reservationType) return prePopulateWith.reservationType;
    // Find active reservations on this slot (excluding ourselves)
    const shiftRes = allReservations.filter(r => 
      r.date === initialDate && r.shift === initialShift && r.labId === initialLabId && r.status !== 'reprovado'
    );
    // If a project is already booked, default to 'projeto'
    const hasProjectReservations = shiftRes.some(r => r.reservationType === 'projeto');
    if (hasProjectReservations) {
      return 'projeto';
    }
    return 'aula';
  });

  const [selectedBenches, setSelectedBenches] = useState<number[]>(() => {
    if (prePopulateWith?.selectedBenches) return prePopulateWith.selectedBenches;
    if (prePopulateWith?.reservationType === 'projeto') return prePopulateWith.selectedBenches || [1];

    const shiftRes = allReservations.filter(r => 
      r.date === initialDate && r.shift === initialShift && r.labId === initialLabId && r.status !== 'reprovado'
    );
    const bookedBenches = shiftRes.reduce<number[]>((acc, cur) => {
      if (cur.reservationType === 'projeto') {
        return [...acc, ...(cur.selectedBenches || [])];
      }
      return acc;
    }, []);

    const hasProjectReservations = shiftRes.some(r => r.reservationType === 'projeto');
    if (hasProjectReservations) {
      const freeBench = [1, 2, 3].find(b => !bookedBenches.includes(b)) || 1;
      return [freeBench];
    }

    return [1, 2, 3]; // default for 'aula' is all benches
  });

  // Auto-correct selected benches when date, shift, lab, or type changes
  React.useEffect(() => {
    if (reservationType === 'projeto') {
      const currentShiftReservations = allReservations.filter(r => {
        const isSelf = prePopulateWith?.id && r.id === prePopulateWith.id;
        return !isSelf && r.date === date && r.shift === shift && r.labId === labId && r.status !== 'reprovado';
      });
      const currentBookedBenches = currentShiftReservations.reduce<number[]>((acc, cur) => {
        if (cur.reservationType === 'projeto') {
          return [...acc, ...(cur.selectedBenches || [])];
        }
        return acc;
      }, []);

      setSelectedBenches(prev => {
        const hasConflict = prev.some(b => currentBookedBenches.includes(b));
        if (hasConflict) {
          const freeBench = [1, 2, 3].find(b => !currentBookedBenches.includes(b));
          return freeBench ? [freeBench] : [1];
        }
        return prev;
      });
    }
  }, [date, shift, labId, reservationType]);

  const benchesCount = selectedBenches.length;

  // PDF Upload Demo State
  const [pdfFile, setPdfFile] = useState<string | null>(prePopulateWith?.attachmentName || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reagents state chosen for this practice
  const [reagentsSelected, setReagentsSelected] = useState<Array<{
    reagentId: string;
    name: string;
    concentration: string;
    quantityPerGroup: number;
    quantityTotalRequired: number;
    classification: string;
    unit: string;
  }>>(() => {
    if (prePopulateWith?.reagentsNeeded) {
      return prePopulateWith.reagentsNeeded.map(req => {
        const dbReagent = reagents.find(r => r.id === req.reagentId);
        return {
          reagentId: req.reagentId,
          name: req.name,
          concentration: req.concentration,
          quantityPerGroup: req.quantityPerGroup,
          quantityTotalRequired: req.quantityTotalRequired,
          classification: dbReagent?.classification || 'comum',
          unit: dbReagent?.unit || 'g'
        };
      });
    }
    return [];
  });

  const [currentReagentId, setCurrentReagentId] = useState('');
  const [quantityPerGroup, setQuantityPerGroup] = useState<number>(0);
  const [customReagentName, setCustomReagentName] = useState('');
  const [customReagentClass, setCustomReagentClass] = useState<'comum' | 'controlado_pf' | 'controlado_exercito'>('comum');
  const [customReagentUnit, setCustomReagentUnit] = useState('mL');
  const [isAddingCustomReagent, setIsAddingCustomReagent] = useState(false);

  // Materials state chosen
  const [materialsSelected, setMaterialsSelected] = useState<Array<{
    materialId: string;
    name: string;
    type: string;
    quantityPerStudent: number;
    quantityRequired: number;
    unit: string;
  }>>(() => {
    if (prePopulateWith?.materialsNeeded) {
      return prePopulateWith.materialsNeeded.map(req => {
        const dbMaterial = materials.find(m => m.id === req.materialId);
        const parentStudentCount = prePopulateWith.studentCount || 1;
        const qtyPerStudent = Math.round((req.quantityRequired / parentStudentCount) * 10) / 10 || 1;
        return {
          materialId: req.materialId,
          name: req.name,
          type: req.type,
          quantityPerStudent: qtyPerStudent,
          quantityRequired: req.quantityRequired,
          unit: dbMaterial?.unit || 'unidades'
        };
      });
    }
    return [];
  });

  const [currentMaterialId, setCurrentMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState<number>(1);
  const [isAddingCustomMaterial, setIsAddingCustomMaterial] = useState(false);
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [customMaterialType, setCustomMaterialType] = useState('Vidraria');
  const [customMaterialUnit, setCustomMaterialUnit] = useState('unidades');

  // Equipment selection
  const [equipmentsSelected, setEquipmentsSelected] = useState<string[]>(prePopulateWith?.equipmentsNeeded || []);

  // Expected Waste (Professor inputs this)
  const [wasteSelected, setWasteSelected] = useState<Array<{
    type: 'organico' | 'inorganico' | 'inflamavel' | 'oxidante' | 'biologico';
    quantity: number;
    unit: string;
  }>>(() => {
    if (prePopulateWith?.expectedWaste) {
      return prePopulateWith.expectedWaste.map(w => ({
        type: w.type,
        quantity: w.quantity,
        unit: w.unit
      }));
    }
    return [];
  });

  const [wasteType, setWasteType] = useState<'organico' | 'inorganico' | 'inflamavel' | 'oxidante' | 'biologico'>('organico');
  const [wasteQty, setWasteQty] = useState<number>(0);
  const [wasteUnit, setWasteUnit] = useState('L');

  // Helpers for labels
  const LAB_OPTIONS = [
    { value: 'quimica', label: 'Laboratório 1' },
    { value: 'biologia', label: 'Laboratório 2' },
    { value: 'multiuso', label: 'Laboratório 3' }
  ];

  const SHIFT_OPTIONS = [
    { value: 'manha', label: 'Manhã (08:00 - 12:00)' },
    { value: 'tarde', label: 'Tarde (14:00 - 18:00)' },
    { value: 'noite', label: 'Noite (19:00 - 22:30)' }
  ];

  // Drag and drop PDF handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPdfFile(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0].name);
    }
  };

  // Adding Reagent Handlers
  const handleAddReagent = () => {
    let chosenReagent: Partial<Reagent> | undefined;

    if (isAddingCustomReagent) {
      if (!customReagentName.trim()) return alert('Informe o nome do reagente personalizado');
      chosenReagent = {
        id: `custom_r_${Date.now()}`,
        name: customReagentName,
        concentration: 'PA',
        classification: customReagentClass,
        unit: customReagentUnit
      };
    } else {
      chosenReagent = reagents.find(r => r.id === currentReagentId);
      if (!chosenReagent) return alert('Selecione um reagente válido');
    }

    if (reagentsSelected.some(r => r.reagentId === chosenReagent!.id)) {
      return alert('Este reagente já foi adicionado.');
    }

    const totalRequired = quantityPerGroup * studentCount;

    setReagentsSelected([
      ...reagentsSelected,
      {
        reagentId: chosenReagent.id!,
        name: chosenReagent.name!,
        concentration: chosenReagent.concentration || '99%',
        quantityPerGroup,
        quantityTotalRequired: totalRequired || quantityPerGroup,
        classification: chosenReagent.classification || 'comum',
        unit: chosenReagent.unit || 'g'
      }
    ]);

    // reset items
    setCurrentReagentId('');
    setQuantityPerGroup(0);
    setCustomReagentName('');
    setIsAddingCustomReagent(false);
  };

  const handleRemoveReagent = (idx: number) => {
    setReagentsSelected(reagentsSelected.filter((_, i) => i !== idx));
  };

  // Adding Materials Handlers
  const handleAddMaterial = () => {
    let chosenMaterial: Partial<Material> | undefined;

    if (isAddingCustomMaterial) {
      if (!customMaterialName.trim()) return alert('Informe o nome do material personalizado');
      chosenMaterial = {
        id: `custom_m_${Date.now()}`,
        name: customMaterialName,
        type: customMaterialType,
        unit: customMaterialUnit
      };
    } else {
      chosenMaterial = materials.find(m => m.id === currentMaterialId);
      if (!chosenMaterial) return alert('Selecione um material válido');
    }

    if (materialsSelected.some(m => m.materialId === chosenMaterial!.id)) {
      return alert('Este material já foi adicionado.');
    }

    setMaterialsSelected([
      ...materialsSelected,
      {
        materialId: chosenMaterial.id!,
        name: chosenMaterial.name!,
        type: chosenMaterial.type || 'Geral',
        quantityPerStudent: materialQty,
        quantityRequired: materialQty * studentCount,
        unit: chosenMaterial.unit || 'unidades'
      }
    ]);

    setCurrentMaterialId('');
    setMaterialQty(1);
    setIsAddingCustomMaterial(false);
    setCustomMaterialName('');
  };

  const handleRemoveMaterial = (idx: number) => {
    setMaterialsSelected(materialsSelected.filter((_, i) => i !== idx));
  };

  // Equipment Toggle
  const toggleEquipment = (eqId: string) => {
    if (equipmentsSelected.includes(eqId)) {
      setEquipmentsSelected(equipmentsSelected.filter(id => id !== eqId));
    } else {
      setEquipmentsSelected([...equipmentsSelected, eqId]);
    }
  };

  // Expected Waste Add
  const handleAddWaste = () => {
    if (wasteQty <= 0) return alert('Medida do resíduo precisa ser maior que zero');
    setWasteSelected([
      ...wasteSelected,
      {
        type: wasteType,
        quantity: wasteQty,
        unit: wasteUnit
      }
    ]);
    setWasteQty(0);
  };

  const handleRemoveWaste = (idx: number) => {
    setWasteSelected(wasteSelected.filter((_, i) => i !== idx));
  };

  // Save/Submit Practice Reservartion Request
  const handleSave = () => {
    if (!practiceName.trim()) return alert('O nome da prática é obrigatório.');
    if (!course.trim()) return alert('A disciplina é obrigatória.');
    if (isReservationDateBlocked(date, shift)) {
      return alert('Não é possível criar ou alterar para datas com menos de 48 horas de antecedência ou em dias anteriores.');
    }

    // Complete Conflict Validation
    const otherReservations = allReservations.filter(r => {
      const isSelf = prePopulateWith?.id && r.id === prePopulateWith.id;
      return !isSelf && r.date === date && r.shift === shift && r.labId === labId && r.status !== 'reprovado';
    });

    if (reservationType === 'aula') {
      // If there's already a project booking, explicitly block booking an Aula Integral
      const hasProjectBooking = otherReservations.some(r => r.reservationType === 'projeto');
      if (hasProjectBooking) {
        return alert(
          'Não é possível realizar a reserva do tipo Aula Integral pois este laboratório já possui agendamentos ativos do tipo Projeto para este mesmo horário.'
        );
      }

      // Aula blocks the entire lab. If there's literally ANY other reservation (whether project or class), we conflict.
      if (otherReservations.length > 0) {
        const firstConflict = otherReservations[0];
        const typeStr = firstConflict.reservationType === 'projeto' ? 'Projeto' : 'Aula integral';
        return alert(
          `Conflito de agendamento! Este laboratório já possui uma reserva ativa para "${firstConflict.practiceName}" (${typeStr}) no mesmo horário.`
        );
      }
    } else {
      // Projeto is booked per bench.
      // 1. If there's an active "Aula" reservation, the lab is blocked completely.
      const hasClassBooking = otherReservations.some(r => r.reservationType !== 'projeto');
      if (hasClassBooking) {
        const classBooking = otherReservations.find(r => r.reservationType !== 'projeto')!;
        return alert(
          `Conflito! O laboratório está reservado integralmente para a Aula "${classBooking.practiceName}" do professor ${classBooking.professorName} no mesmo horário.`
        );
      }

      // 2. Each bench can only have ONE active reservation in the shift.
      if (selectedBenches.length === 0) {
        return alert('Selecione pelo menos uma bancada de 1 a 3 para a reserva de Projeto.');
      }

      for (const bench of selectedBenches) {
        const isBenchOccupied = otherReservations.some(r => 
          r.reservationType === 'projeto' && (r.selectedBenches || []).includes(bench)
        );
        if (isBenchOccupied) {
          return alert(
            `Conflito! A bancada ${bench} já está reservada por outro projeto nesse mesmo horário.`
          );
        }
      }
    }

    const res: Partial<Reservation> = {
      ...prePopulateWith, // retain existing reservation fields like id, professorName, createdAt
      date,
      shift,
      labId,
      practiceName,
      course,
      studentCount,
      benchesCount,
      reservationType,
      selectedBenches,
      reagentsNeeded: reagentsSelected.map(r => ({
        id: r.reagentId.startsWith('req_') ? r.reagentId : `req_${Date.now()}_${r.reagentId}`,
        reagentId: r.reagentId,
        name: r.name,
        concentration: r.concentration,
        quantityPerGroup: r.quantityPerGroup,
        quantityTotalRequired: r.quantityTotalRequired
      })),
      materialsNeeded: materialsSelected.map(m => ({
        id: m.materialId.startsWith('req_') ? m.materialId : `req_${Date.now()}_${m.materialId}`,
        materialId: m.materialId,
        name: m.name,
        type: m.type,
        quantityRequired: m.quantityRequired
      })),
      equipmentsNeeded: equipmentsSelected,
      expectedWaste: wasteSelected,
      attachmentName: pdfFile || 'roteiro_pratica.pdf',
      status: 'pendente' // Alterations or updates always reset to pending for technician approval
    };

    onSubmit(res);
  };

  // Find all active reservations on this date, shift, and lab (excluding ourselves if editing)
  const shiftReservations = allReservations.filter(r => {
    const isSelf = prePopulateWith?.id && r.id === prePopulateWith.id;
    return !isSelf && r.date === date && r.shift === shift && r.labId === labId && r.status !== 'reprovado';
  });

  const isLabFullyBooked = shiftReservations.some(r => r.reservationType !== 'projeto');
  const bookedBenchesOnThisShift = shiftReservations.reduce<number[]>((acc, cur) => {
    if (cur.reservationType === 'projeto') {
      return [...acc, ...(cur.selectedBenches || [])];
    }
    return acc;
  }, []);

  return (
    <div id="reservation-form-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Title bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold">Solicitação de Reserva e Planejamento</h3>
            <p className="text-xs text-slate-400 mt-0.5">Preencha o cronograma, reagentes necessários e resíduos esperados.</p>
          </div>
          <button
            id="close-form-btn"
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 hover:bg-slate-705 text-slate-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* SECTION 1: GENERAL RESERVATION VALUES */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-1">1. Dados da Agenda e Turma</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Prática Laboratorial <span className="text-rose-500">*</span></label>
                <input
                  id="form-practice-name"
                  type="text"
                  placeholder="Ex: Titulação Ácido-Base com NaOH"
                  value={practiceName}
                  onChange={e => setPracticeName(e.target.value)}
                  className="w-full text-sm border border-slate-350 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Disciplina / Curso <span className="text-rose-500">*</span></label>
                <input
                  id="form-course-name"
                  type="text"
                  placeholder="Ex: Química Geral II"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  className="w-full text-sm border border-slate-350 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Laboratório</label>
                <select
                  id="form-lab-select"
                  value={labId}
                  onChange={e => setLabId(e.target.value as LabId)}
                  className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LAB_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1">Data</label>
                <input
                  id="form-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={`w-full text-sm border rounded-lg py-1.5 px-3 text-slate-800 focus:outline-none focus:ring-1 font-mono ${
                    isReservationDateBlocked(date, shift) ? 'border-rose-450 focus:ring-rose-400' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {isReservationDateBlocked(date, shift) && (
                  <span className="text-[10px] text-rose-600 font-bold block mt-1">
                    Bloqueado (Mínimo 48h de antecedência)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Turno</label>
                <select
                  id="form-shift"
                  value={shift}
                  onChange={e => setShift(e.target.value as ShiftType)}
                  className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SHIFT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1">Qtd Alunos <span className="text-slate-400 font-normal">(Capacidade: 45)</span></label>
                <input
                  id="form-student-count"
                  type="number"
                  min="1"
                  max="45"
                  value={studentCount}
                  onChange={e => setStudentCount(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className={reservationType === 'projeto' ? "md:col-span-2" : "md:col-span-4"}>
                <label className="block text-xs font-bold text-slate-705 mb-1">Tipo de Reserva</label>
                <select
                  id="form-reservation-type"
                  value={reservationType}
                  onChange={e => {
                    const val = e.target.value as 'aula' | 'projeto';
                    setReservationType(val);
                    if (val === 'aula') {
                      setSelectedBenches([1, 2, 3]);
                    } else {
                      const freeBench = [1, 2, 3].find(b => !bookedBenchesOnThisShift.includes(b)) || 1;
                      setSelectedBenches([freeBench]);
                    }
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-505 focus:ring-indigo-500 bg-white"
                >
                  <option value="aula">Aula Integral</option>
                  <option value="projeto">Projeto</option>
                </select>
              </div>

              {reservationType === 'projeto' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-705 mb-1">
                    Bancadas <span className="text-slate-400 font-normal">(Selecione de 1 a 3)</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(bench => {
                      const isOccupiedByAnother = isLabFullyBooked || bookedBenchesOnThisShift.includes(bench);
                      const isChecked = selectedBenches.includes(bench);

                      return (
                        <button
                          key={bench}
                          type="button"
                          disabled={isOccupiedByAnother}
                          onClick={() => {
                            if (selectedBenches.includes(bench)) {
                              if (selectedBenches.length > 1) {
                                setSelectedBenches(selectedBenches.filter(b => b !== bench));
                              }
                            } else {
                              setSelectedBenches([...selectedBenches, bench].sort());
                            }
                          }}
                          className={`flex-1 py-2 px-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                            isOccupiedByAnother
                              ? 'bg-rose-50 text-rose-500 border-rose-200 cursor-not-allowed text-[10px]'
                              : isChecked
                              ? 'bg-indigo-600 text-white border-indigo-750 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                          }`}
                          title={
                            isOccupiedByAnother 
                              ? "Já reservada por outra solicitação nesta data/turno" 
                              : `Bancada ${bench}`
                          }
                        >
                          <span className="text-[11px] font-bold text-inherit">Bancada {bench}</span>
                          {isOccupiedByAnother ? (
                            <span className="text-[8px] text-rose-600 font-extrabold block">Bloq.</span>
                          ) : (
                            <span className="text-[8px] opacity-75 font-medium block">
                              {isChecked ? 'Ativa' : 'Livre'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Simulated PDF Router/Attachment Drag and drop container */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Roteiro de Prática (PDF)</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                  dragActive ? 'border-blue-600 bg-blue-50' : pdfFile ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  id="pdf-file-picker"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                
                {pdfFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">{pdfFile} (Pronto para envio)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPdfFile(null);
                      }}
                      className="text-xs text-rose-500 hover:underline font-bold ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Arraste o roteiro PDF aqui ou clique para selecionar</span>
                    <span className="text-[10px] text-slate-400">Tamanho máximo: 10MB</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CHOOSE REAGENTS */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b pb-1">2. Reagentes Requeridos</h4>
            <p className="text-xs text-slate-400 mb-4">Escolha os reagentes existentes no inventário ou inclua um personalizado em tempo real.</p>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
              
              {/* Row: dropdown selector + configs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                
                {!isAddingCustomReagent ? (
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Reagente do Inventário</label>
                    <select
                      id="reagent-select"
                      value={currentReagentId}
                      onChange={e => setCurrentReagentId(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-800 bg-white"
                    >
                      <option value="">-- Selecionar Reagente --</option>
                      {reagents.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.concentration}) [{r.classification === 'comum' ? 'Comum' : 'Controlado'}]
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Reagente Novo</label>
                    <input
                      id="custom-reagent-name"
                      type="text"
                      placeholder="Ex: Nitrato de Prata"
                      value={customReagentName}
                      onChange={e => setCustomReagentName(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-800 bg-white"
                    />
                  </div>
                )}

                {isAddingCustomReagent && (
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Controle Legal</label>
                    <select
                      id="custom-reagent-class"
                      value={customReagentClass}
                      onChange={e => setCustomReagentClass(e.target.value as any)}
                      className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-800 bg-white"
                    >
                      <option value="comum">Comum</option>
                      <option value="controlado_pf">Polícia Federal</option>
                      <option value="controlado_exercito">Exército</option>
                    </select>
                  </div>
                )}

                {isAddingCustomReagent && (
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Unidade</label>
                    <select
                      id="custom-reagent-unit"
                      value={customReagentUnit}
                      onChange={e => setCustomReagentUnit(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg py-2 px-1 text-slate-800 bg-white"
                    >
                      <option value="g">g</option>
                      <option value="mL">mL</option>
                      <option value="L">L</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                )}

                <div className={isAddingCustomReagent ? "md:col-span-2" : "md:col-span-4"}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Qtd por Aluno</label>
                  <input
                    id="reagent-qty-group"
                    type="number"
                    min="1"
                    placeholder="Quantidade"
                    value={quantityPerGroup || ''}
                    onChange={e => setQuantityPerGroup(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-850 bg-white"
                  />
                  {currentReagentId && reagents.find(r => r.id === currentReagentId) && (() => {
                    const dbR = reagents.find(r => r.id === currentReagentId)!;
                    const totalReq = quantityPerGroup * studentCount;
                    const available = dbR.physicalStock - dbR.reservedStock;
                    if (totalReq > available) {
                      return (
                        <p className="text-[10px] text-red-600 mt-1 font-semibold">
                          Aviso: Necessário ({totalReq} {dbR.unit}) excede o estoque livre ({available} {dbR.unit}).
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="md:col-span-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddReagent}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Incluir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomReagent(!isAddingCustomReagent);
                      setCurrentReagentId('');
                      setCustomReagentName('');
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-2.5 rounded-lg transition-all cursor-pointer"
                    title="Alternar entre cadastrar novo reagente e selecionar existente"
                  >
                    {isAddingCustomReagent ? 'Fazer Busca' : 'Novo Reagente'}
                  </button>
                </div>
              </div>

              {/* Render Selected table list */}
              {reagentsSelected.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">Reagente</th>
                        <th className="p-2.5">Categoria</th>
                        <th className="p-2.5">Qtd / Aluno</th>
                        <th className="p-2.5">Qtd Total Estimada</th>
                        <th className="p-2.5 text-center">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {reagentsSelected.map((re, ind) => {
                        const dbR = reagents.find(item => item.id === re.reagentId);
                        const isInsufficient = dbR && (re.quantityTotalRequired > (dbR.physicalStock - dbR.reservedStock));
                        return (
                          <tr key={ind} className="hover:bg-slate-50 text-slate-800">
                            <td className="p-2.5 font-medium">
                              {re.name} <span className="text-slate-400">({re.concentration})</span>
                              {isInsufficient && (
                                <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                                  Sem Estoque Suficiente
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {re.classification === 'controlado_pf' && (
                                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1 rounded text-[10px] font-bold">Lançar no livro PF</span>
                              )}
                              {re.classification === 'controlado_exercito' && (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 rounded text-[10px] font-bold">Controlado Exército</span>
                              )}
                              {re.classification === 'comum' && (
                                <span className="text-slate-500 text-[10px]">Comum</span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono">{re.quantityPerGroup} {re.unit}</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700">{re.quantityTotalRequired} {re.unit}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveReagent(ind)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5 bg-white rounded-lg border border-slate-150 text-slate-400 text-xs italic">
                  Nenhum reagente adicionado para esta aula prática.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: CHOOSE MATERIALS (WITH DYNAMIC ADD RULE AND DELAYED DEDUCTION) */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b pb-1">3. Materiais e Equipamentos de Apoio</h4>
            <p className="text-xs text-slate-400 mb-4">
              📌 <strong>Regra do Estoque:</strong> Materiais e EPIs são livres para cadastro em tempo real. O estoque físico oficial só é diminuído quando o técnico confirmar o consumo em aula.
            </p>

            <div className="space-y-4">
              
              {/* Materials row add */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  
                  {!isAddingCustomMaterial ? (
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Selecionar Material</label>
                      <select
                        id="material-select"
                        value={currentMaterialId}
                        onChange={e => setCurrentMaterialId(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-800 bg-white"
                      >
                        <option value="">-- Selecionar Material --</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.type}) [{m.unit}]
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 md:col-span-6">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Item Novo</label>
                        <input
                          id="custom-material-name"
                          type="text"
                          placeholder="Ex: Proveta 50mL"
                          value={customMaterialName}
                          onChange={e => setCustomMaterialName(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-850 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo</label>
                        <select
                          id="custom-material-type"
                          value={customMaterialType}
                          onChange={e => setCustomMaterialType(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg py-2 px-1 text-slate-800 bg-white"
                        >
                          <option value="Vidraria">Vidraria</option>
                          <option value="EPIs">EPIs</option>
                          <option value="Equipamento">Equipamento</option>
                          <option value="Metálicos">Metálicos</option>
                          <option value="Consumíveis">Consumíveis</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className={isAddingCustomMaterial ? "md:col-span-3" : "md:col-span-5"}>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Qtd por Aluno</label>
                    <input
                      id="material-qty"
                      type="number"
                      min="1"
                      value={materialQty}
                      onChange={e => setMaterialQty(Number(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-800 bg-white"
                    />
                    {currentMaterialId && materials.find(m => m.id === currentMaterialId) && (() => {
                      const dbM = materials.find(m => m.id === currentMaterialId)!;
                      const available = dbM.physicalStock - dbM.reservedStock;
                      const totalReq = materialQty * studentCount;
                      if (totalReq > available) {
                        return (
                          <p className="text-[10px] text-red-600 mt-1 font-semibold">
                            Aviso: Necessário ({totalReq} {dbM.unit}) excede o estoque livre ({available} {dbM.unit}).
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="md:col-span-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomMaterial(!isAddingCustomMaterial);
                        setCurrentMaterialId('');
                        setCustomMaterialName('');
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-2.5 rounded-lg transition-all cursor-pointer"
                    >
                      {isAddingCustomMaterial ? 'Busca' : 'Novo Item'}
                    </button>
                  </div>
                </div>

                {/* Render Selected Materials */}
                {materialsSelected.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2.5">Nome do Item</th>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5">Qtd / Aluno</th>
                          <th className="p-2.5">Qtd Total Estimada</th>
                          <th className="p-2.5 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {materialsSelected.map((mat, inx) => {
                          const dbM = materials.find(item => item.id === mat.materialId);
                          const isInsufficient = dbM && (mat.quantityRequired > (dbM.physicalStock - dbM.reservedStock));
                          return (
                            <tr key={inx} className="hover:bg-slate-50 text-slate-800">
                              <td className="p-2.5 font-medium">
                                {mat.name}
                                {isInsufficient && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                                    Sem Estoque Suficiente
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                  {mat.type}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono">{mat.quantityPerStudent} {mat.unit}</td>
                              <td className="p-2.5 font-mono font-bold text-emerald-700">{mat.quantityRequired} {mat.unit}</td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterial(inx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5 bg-white rounded-lg border border-slate-150 text-slate-400 text-xs italic">
                    Nenhum material de vidraria ou insumo selecionado.
                  </div>
                )}
              </div>

              {/* Equipments Select (Chekboxes) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Equipamentos Gerais do Laboratório (Uso Coletivo)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {equipments.map(eq => (
                    <label
                      key={eq.id}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        equipmentsSelected.includes(eq.id) ? 'border-emerald-500 bg-white text-emerald-900 font-bold ring-1 ring-emerald-100' : 'border-slate-200 hover:bg-slate-105/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={equipmentsSelected.includes(eq.id)}
                        disabled={eq.condition === 'manutencao'}
                        onChange={() => toggleEquipment(eq.id)}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="text-xs">
                        <span className="block">{eq.name}</span>
                        {eq.condition === 'manutencao' ? (
                          <span className="text-[10px] text-rose-500 font-bold">⛔ Manutenção</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic capitalize">{eq.condition} estado</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 4: ESTIMATE WASTE (PROFESSOR CREATES PRE-ENTRY) */}
          <div>
            <h4 id="waste-section-label" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b pb-1">4. Planejamento de Descarte e Resíduos Esperados</h4>
            <p className="text-xs text-slate-400 mb-4">
              🧪 <strong>Regra de Responsabilidade:</strong> O professor deve informar quais os resíduos estimados gerados pela prática, com base na reação descrita no roteiro.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Classificação do Resíduo</label>
                  <select
                    id="waste-class-select"
                    value={wasteType}
                    onChange={e => setWasteType(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-800 bg-white"
                  >
                    <option value="organico">Orgânico</option>
                    <option value="inorganico">Inorgânico</option>
                    <option value="inflamavel">Inflamável / Solvente</option>
                    <option value="oxidante">Complexo Oxidante</option>
                    <option value="biologico">Biológico / Infectante</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Volume/Massa Estimado</label>
                  <input
                    id="waste-qty-input"
                    type="number"
                    min="0"
                    step="0.1"
                    value={wasteQty || ''}
                    placeholder="Ex: 1.5"
                    onChange={e => setWasteQty(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg py-1.5 px-2 text-slate-850 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unidade</label>
                  <select
                    id="waste-unit-select"
                    value={wasteUnit}
                    onChange={e => setWasteUnit(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg py-2 px-2 text-slate-800 bg-white"
                  >
                    <option value="L">Litros (L)</option>
                    <option value="mL">Mililitros (mL)</option>
                    <option value="kg">Quilos (kg)</option>
                    <option value="g">Gramas (g)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddWaste}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Resíduo
                  </button>
                </div>
              </div>

              {/* Display Wastes lists */}
              {wasteSelected.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  {wasteSelected.map((ws, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-205 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block capitalize">{ws.type}</span>
                        <span className="text-slate-500 font-mono font-bold mt-1 block bg-slate-200/50 px-1 py-0.5 rounded w-max text-[10px]">{ws.quantity} {ws.unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWaste(i)}
                        className="text-rose-500 hover:text-rose-700 p-1 self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-white rounded-lg border border-slate-150 text-slate-400 text-xs italic flex items-center justify-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  Informe os resíduos para que o técnico possa preparar as bombonas de coleta corretamente.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal actions footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-sm font-bold rounded-lg transition-all cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            id="submit-reservation-btn"
            type="button"
            disabled={isReservationDateBlocked(date, shift)}
            onClick={handleSave}
            className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              isReservationDateBlocked(date, shift)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow cursor-pointer'
            }`}
          >
            {isReservationDateBlocked(date, shift) ? 'Reserva Bloqueada (<48h)' : 'Criar Solicitação de Reserva'}
          </button>
        </div>

      </div>
    </div>
  );
}
