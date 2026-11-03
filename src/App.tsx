import { useState, useEffect } from 'react';
import { 
  Reagent, Material, Equipment, Reservation, ControlledLog, 
  LabId, ShiftType 
} from './types';
import { 
  INITIAL_REAGENTS, INITIAL_MATERIALS, INITIAL_EQUIPMENTS, 
  INITIAL_RESERVATIONS, INITIAL_CONTROLLED_LOGS 
} from './data/initialData';

// Component Imports
import RoleSelector from './components/RoleSelector';
import CalendarView from './components/CalendarView';
import ReservationForm from './components/ReservationForm';
import TechnicalPanel from './components/TechnicalPanel';
import StockManager from './components/StockManager';
import WasteTracker from './components/WasteTracker';
import IFLabLogo from './components/IFLabLogo';
import MyReservationsView from './components/MyReservationsView';

// Icons for navigation sidebar
import { 
  Calendar, Box, CheckSquare, Trash2, ClipboardList
} from 'lucide-react';

export default function App() {
  // --- STATE DECLARATIONS ---
  const [currentRole, setCurrentRole] = useState<'professor' | 'tecnico'>('professor');
  const [activeTab, setActiveTab] = useState<string>('agenda');
  
  // Local databases persisted in state (mock and/or localStorage)
  const [reagents, setReagents] = useState<Reagent[]>(() => {
    const saved = localStorage.getItem('labflow_reagents');
    return saved ? JSON.parse(saved) : INITIAL_REAGENTS;
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('labflow_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    const saved = localStorage.getItem('labflow_equipments');
    return saved ? JSON.parse(saved) : INITIAL_EQUIPMENTS;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('labflow_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [controlledLogs, setControlledLogs] = useState<ControlledLog[]>(() => {
    const saved = localStorage.getItem('labflow_controlled_logs');
    return saved ? JSON.parse(saved) : INITIAL_CONTROLLED_LOGS;
  });

  // UI state controllers
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [prePopulateRes, setPrePopulateRes] = useState<Reservation | undefined>(undefined);
  const [selectedLabId, setSelectedLabId] = useState<LabId>('quimica');
  const [formPreFill, setFormPreFill] = useState<{ date: string; shift: ShiftType; labId: LabId }>(() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      shift: 'manha',
      labId: 'quimica'
    };
  });

  // --- LOCAL PERSISTENCE SYNC ---
  useEffect(() => {
    localStorage.setItem('labflow_reagents', JSON.stringify(reagents));
  }, [reagents]);

  useEffect(() => {
    localStorage.setItem('labflow_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('labflow_equipments', JSON.stringify(equipments));
  }, [equipments]);

  useEffect(() => {
    localStorage.setItem('labflow_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('labflow_controlled_logs', JSON.stringify(controlledLogs));
  }, [controlledLogs]);

  // Protect and fallback tabs if currentRole is professor
  useEffect(() => {
    if (currentRole === 'professor' && ['despache', 'estoque', 'residuos'].includes(activeTab)) {
      setActiveTab('agenda');
    }
  }, [currentRole, activeTab]);

  // --- DYNAMIC CALCULATOR: RESERVED STOCK BLOCKING ---
  // To avoid duplicate reservations, this helper dynamically calculates and syncs the reservedStock
  // by summing the required item counts of approved or current pre-prepararation reservations.
  useEffect(() => {
    const activeRes = reservations.filter(r => r.status === 'aprovado' || r.status === 'preparacao');

    // Reagents dynamic reserve
    const rResMap: Record<string, number> = {};
    activeRes.forEach(res => {
      res.reagentsNeeded.forEach(req => {
        rResMap[req.reagentId] = (rResMap[req.reagentId] || 0) + req.quantityTotalRequired;
      });
    });

    // Materials dynamic reserve
    const mResMap: Record<string, number> = {};
    activeRes.forEach(res => {
      res.materialsNeeded.forEach(req => {
        mResMap[req.materialId] = (mResMap[req.materialId] || 0) + req.quantityRequired;
      });
    });

    setReagents(prev => prev.map(r => ({
      ...r,
      reservedStock: rResMap[r.id] || 0
    })));

    setMaterials(prev => prev.map(m => ({
      ...m,
      reservedStock: mResMap[m.id] || 0
    })));

  }, [reservations]);

  // --- HANDLERS AND WORKFLOW CONTROLLERS ---

  // Handle a new student reservation created by Lecturer/Teacher
  const handleCreateReservation = (data: Partial<Reservation>) => {
    if (data.id) {
      // Editing Mode
      setReservations(prev => prev.map(res => res.id === data.id ? { ...res, ...data } as Reservation : res));
      setShowReservationForm(false);
      setActiveTab(currentRole === 'professor' ? 'minhas-reservas' : 'agenda');
      alert('Solicitação de reserva atualizada com sucesso para homologação do técnico!');
    } else {
      // Creation Mode
      const newRes: Reservation = {
        id: `res_${Date.now()}`,
        professorName: 'Profª. Maria Silva',
        createdAt: new Date().toISOString().split('T')[0],
        ...data
      } as Reservation;

      setReservations(prev => [newRes, ...prev]);
      setShowReservationForm(false);
      setActiveTab(currentRole === 'professor' ? 'minhas-reservas' : 'agenda');
      alert('Excelente! Solicitação de reserva cadastrada para verificação de estoque e homologação pelo técnico responsável.');
    }
  };

  // Quick Open form with preset values directly from clicking turn slots on calendar
  const handleOpenReservationWithPresets = (date: string, shift: ShiftType, labId: LabId) => {
    setPrePopulateRes(undefined);
    setFormPreFill({ date, shift, labId });
    setShowReservationForm(true);
  };

  // Duplicate an existing reservation to repeat the class
  const handleDuplicateReservation = (res: Reservation) => {
    const { id, ...resWithoutId } = res;
    setPrePopulateRes(resWithoutId as any);
    setFormPreFill({
      date: '2026-06-01', // Pre-fill with a future date
      shift: res.shift,
      labId: res.labId
    });
    setShowReservationForm(true);
  };

  // Update Status of Reservation (e.g., Approve, Request adjustments, Reject, In Preparation)
  const handleUpdateReservationStatus = (id: string, newStatus: Reservation['status'], extras?: Partial<Reservation>) => {
    setReservations(prev => prev.map(res => {
      if (res.id === id) {
        return {
          ...res,
          status: newStatus,
          ...extras
        };
      }
      return res;
    }));
  };

  // CORE FLOW: Technician finalizes Practice Class, recording actual amounts utilized and updates physical stock!
  const handleFinalizePractice = (
    reservationId: string, 
    usedReagents: Record<string, number>, 
    usedMaterials: Record<string, number>, 
    realWastes: Array<{ type: string; quantity: number; disposalMethod: string; collected: boolean }>
  ) => {
    const rawRes = reservations.find(r => r.id === reservationId);
    if (!rawRes) return;

    // 1. Physically deduct from the stock
    setReagents(prev => prev.map(re => {
      const consumption = usedReagents[re.id];
      if (consumption !== undefined) {
        return {
          ...re,
          // Deduct real consumption from physical stock
          physicalStock: Math.max(0, re.physicalStock - consumption)
        };
      }
      return re;
    }));

    setMaterials(prev => prev.map(mat => {
      const consumption = usedMaterials[mat.id];
      if (consumption !== undefined) {
        return {
          ...mat,
          physicalStock: Math.max(0, mat.physicalStock - consumption)
        };
      }
      return mat;
    }));

    // 2. Generate and store Federal Police logging logs for "Controlado PF" reagents
    const logsGenerated: ControlledLog[] = [];
    rawRes.reagentsNeeded.forEach(req => {
      const dbReagent = reagents.find(r => r.id === req.reagentId);
      const wasUsedAmount = usedReagents[req.reagentId] ?? req.quantityTotalRequired;

      if (dbReagent && dbReagent.classification === 'controlado_pf' && wasUsedAmount > 0) {
        // Track down if matching waste is logged
        const matchWasteQty = realWastes[0] ? realWastes[0].quantity : (wasUsedAmount * 0.9);
        const matchWasteUnit = dbReagent.unit;
        
        logsGenerated.push({
          id: `log_${Date.now()}_${req.reagentId}`,
          date: new Date().toISOString().split('T')[0],
          reagentName: dbReagent.name,
          quantity: wasUsedAmount,
          unit: dbReagent.unit,
          purpose: `Aula Prática Ensino: ${rawRes.practiceName} (${rawRes.course})`,
          wasteQuantity: Number(matchWasteQty.toFixed(1)),
          wasteUnit: matchWasteUnit,
          professor: rawRes.professorName,
          technician: 'Téc. João Souza'
        });
      }
    });

    if (logsGenerated.length > 0) {
      setControlledLogs(prev => [...logsGenerated, ...prev]);
    }

    // 3. Update the reservation object state to Finalized with real statistics logged
    setReservations(prev => prev.map(res => {
      if (res.id === reservationId) {
        return {
          ...res,
          status: 'finalizado',
          reagentsNeeded: res.reagentsNeeded.map(req => ({
            ...req,
            actualUsed: usedReagents[req.reagentId] ?? req.quantityTotalRequired
          })),
          materialsNeeded: res.materialsNeeded.map(req => ({
            ...req,
            actualUsed: usedMaterials[req.materialId] ?? req.quantityRequired
          })),
          actualWaste: realWastes.map(w => ({
            type: w.type as any,
            quantity: w.quantity,
            unit: 'L',
            realQuantity: w.quantity,
            disposalMethod: w.disposalMethod,
            collected: w.collected
          }))
        };
      }
      return res;
    }));
  };

  // --- Dynamic add of raw items ---
  const handleAddReagentToAlmoxarifado = (re: Reagent) => {
    setReagents(prev => [...prev, re]);
  };

  const handleAddMaterialToAlmoxarifado = (mat: Material) => {
    setMaterials(prev => [...prev, mat]);
  };

  const handleAddEquipmentToAlmoxarifado = (eq: Equipment) => {
    setEquipments(prev => [...prev, eq]);
  };

  const handleUpdateReagentStock = (id: string, newQty: number) => {
    setReagents(prev => prev.map(r => r.id === id ? { ...r, physicalStock: newQty } : r));
  };

  const handleUpdateMaterialStock = (id: string, newQty: number) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, physicalStock: newQty } : m));
  };

  // Reset demo state (clean localstorage to start fresh)
  const handleClearDemoState = () => {
    if (confirm("Deseja redefinir os dados para o estado inicial padrão?")) {
      localStorage.clear();
      setReagents(INITIAL_REAGENTS);
      setMaterials(INITIAL_MATERIALS);
      setEquipments(INITIAL_EQUIPMENTS);
      setReservations(INITIAL_RESERVATIONS);
      setControlledLogs(INITIAL_CONTROLLED_LOGS);
      setActiveTab('dashboard');
      alert("Ambiente de teste reiniciado com as tabelas originais.");
    }
  };

  const handleClearAllWastes = () => {
    const updated = reservations.map(res => {
      if (res.status === 'finalizado') {
        return {
          ...res,
          actualWaste: [],
          expectedWaste: []
        };
      }
      return res;
    });
    setReservations(updated);
    alert('Todos os resíduos acumulados foram esvaziados com sucesso.');
  };

  return (
    <div id="labflow-application-root" className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Simulation Header selector */}
      <RoleSelector 
        currentRole={currentRole} 
        onChangeRole={(role) => {
          setCurrentRole(role);
          // Auto route to context tabs logically to offer the best user experience
          if (role === 'tecnico' && activeTab === 'dashboard') {
            // Keep on dashboard or let view
          }
        }} 
      />

      {/* Primary Layout Wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* SIDE BAR NAVIGATION */}
        <aside id="sidebar-navigation" className="w-full lg:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 font-sans">
          
          {/* Menu items */}
          <div className="p-4 space-y-6">
            <div className="flex items-center px-2 pb-4 border-b border-slate-800">
              <IFLabLogo isLight={true} className="h-9" />
            </div>

            <nav className="space-y-1">
              
              <button
                id="nav-agenda"
                onClick={() => setActiveTab('agenda')}
                className={`w-full text-left py-2.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-between ${
                  activeTab === 'agenda' 
                    ? 'sidebar-link-active text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-450" />
                  Agenda e Turnos
                </span>
                <span className="bg-slate-800 text-slate-400 border border-slate-775 font-mono font-bold text-[9px] px-1 rounded">
                  Calendário
                </span>
              </button>

              {currentRole === 'professor' && (
                <button
                  id="nav-minhas-reservas"
                  onClick={() => setActiveTab('minhas-reservas')}
                  className={`w-full text-left py-2.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-between ${
                    activeTab === 'minhas-reservas' 
                      ? 'sidebar-link-active text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-450" />
                    Meus Agendamentos
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-mono font-bold text-[9.5px] px-1.5 rounded">
                    Fila Docente
                  </span>
                </button>
              )}

              {currentRole === 'tecnico' && (
                <>
                  <button
                    id="nav-despache"
                    onClick={() => setActiveTab('despache')}
                    className={`w-full text-left py-2.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-between ${
                      activeTab === 'despache' 
                        ? 'sidebar-link-active text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-slate-450" />
                      Despacho Técnico
                    </span>
                    {reservations.filter(r => r.status === 'pendente').length > 0 && (
                      <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                        {reservations.filter(r => r.status === 'pendente').length}
                      </span>
                    )}
                  </button>

                  <button
                    id="nav-estoque"
                    onClick={() => setActiveTab('estoque')}
                    className={`w-full text-left py-2.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-between ${
                      activeTab === 'estoque' 
                        ? 'sidebar-link-active text-white' 
                        : 'text-slate-405 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-slate-450" />
                      Almoxarifado & Estoque
                    </span>
                  </button>

                  <button
                    id="nav-residuos"
                    onClick={() => setActiveTab('residuos')}
                    className={`w-full text-left py-2.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-between ${
                      activeTab === 'residuos' 
                        ? 'sidebar-link-active text-white' 
                        : 'text-slate-405 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-slate-450" />
                      Gestão de Resíduos
                    </span>
                    {reagents.some(r => r.physicalStock < 400) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    )}
                  </button>
                </>
              )}

            </nav>
          </div>

          <div className="p-4 border-t border-slate-800">
            {/* Version footer removed cleanly */}
          </div>

        </aside>

        {/* PRIMARY MAIN LAYOUT CANVAS */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F8FAFC] space-y-6 overflow-y-auto max-h-[100vh]">
          
          {/* VIEW TAB DIRECTORS */}
          {activeTab === 'agenda' && (
            <CalendarView 
              reservations={reservations} 
              currentRole={currentRole} 
              selectedLab={selectedLabId} 
              setSelectedLab={setSelectedLabId} 
              onOpenNewReservation={handleOpenReservationWithPresets}
              onReviewReservation={(res) => {
                // Instantly open the Technician Dispatch Panel to review this details!
                setActiveTab('despache');
              }}
              onDuplicateReservation={handleDuplicateReservation}
            />
          )}

          {activeTab === 'despache' && (
            <TechnicalPanel 
              reservations={reservations} 
              reagents={reagents} 
              materials={materials} 
              equipments={equipments} 
              onUpdateStatus={handleUpdateReservationStatus} 
              onFinalizePractice={handleFinalizePractice}
            />
          )}

          {activeTab === 'estoque' && (
            <StockManager 
              reagents={reagents} 
              materials={materials} 
              equipments={equipments} 
              onAddReagent={handleAddReagentToAlmoxarifado} 
              onAddMaterial={handleAddMaterialToAlmoxarifado} 
              onAddEquipment={handleAddEquipmentToAlmoxarifado} 
              onUpdateReagentStock={handleUpdateReagentStock} 
              onUpdateMaterialStock={handleUpdateMaterialStock}
              onSetReagents={setReagents}
              onSetMaterials={setMaterials}
            />
          )}

          {activeTab === 'residuos' && (
            <WasteTracker reservations={reservations} onClearAllWastes={handleClearAllWastes} />
          )}

          {activeTab === 'minhas-reservas' && currentRole === 'professor' && (
            <MyReservationsView 
              reservations={reservations}
              onEditReservation={(res) => {
                setPrePopulateRes(res);
                setFormPreFill({
                  date: res.date,
                  shift: res.shift,
                  labId: res.labId
                });
                setShowReservationForm(true);
              }}
              onDuplicateReservation={handleDuplicateReservation}
            />
          )}

        </main>

      </div>

      {/* RENDER NEW RESERVATION FORM POPUP */}
      {showReservationForm && (
        <ReservationForm
          initialDate={formPreFill.date}
          initialShift={formPreFill.shift}
          initialLabId={formPreFill.labId}
          reagents={reagents}
          materials={materials}
          equipments={equipments}
          onClose={() => setShowReservationForm(false)}
          onSubmit={handleCreateReservation}
          prePopulateWith={prePopulateRes}
          allReservations={reservations}
        />
      )}

    </div>
  );
}
