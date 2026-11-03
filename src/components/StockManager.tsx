import React, { useState } from 'react';
import { Reagent, Material, Equipment } from '../types';
import { Plus, Search, AlertTriangle, ShieldCheck, Box, Settings, Sliders, RefreshCw, Edit, Trash2, Minus } from 'lucide-react';

interface StockManagerProps {
  reagents: Reagent[];
  materials: Material[];
  equipments: Equipment[];
  onAddReagent: (item: Reagent) => void;
  onAddMaterial: (item: Material) => void;
  onAddEquipment: (item: Equipment) => void;
  onUpdateReagentStock: (id: string, newQty: number) => void;
  onUpdateMaterialStock: (id: string, newQty: number) => void;
  onSetReagents?: React.Dispatch<React.SetStateAction<Reagent[]>>;
  onSetMaterials?: React.Dispatch<React.SetStateAction<Material[]>>;
}

export default function StockManager({
  reagents,
  materials,
  equipments,
  onAddReagent,
  onAddMaterial,
  onAddEquipment,
  onUpdateReagentStock,
  onUpdateMaterialStock,
  onSetReagents,
  onSetMaterials
}: StockManagerProps) {
  const [activeTab, setActiveTab] = useState<'reagentes' | 'materiais' | 'equipamentos'>('reagentes');
  const [searchQuery, setSearchQuery] = useState('');

  // Form toggles and states
  const [showReagentForm, setShowReagentForm] = useState(false);
  const [rName, setRName] = useState('');
  const [rConc, setRConc] = useState('PA');
  const [rQty, setRQty] = useState<number>(1000);
  const [rUnit, setRUnit] = useState('mL');
  const [rClass, setRClass] = useState<Reagent['classification']>('comum');

  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [mName, setMName] = useState('');
  const [mType, setMType] = useState('Vidraria');
  const [mQty, setMQty] = useState<number>(50);
  const [mUnit, setMUnit] = useState('unidades');

  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [eName, setEName] = useState('');
  const [eCond, setECond] = useState<'excelente' | 'regular' | 'manutencao'>('excelente');
  const [eObs, setEObs] = useState('');

  // Handle Quick Refill
  const [refillMode, setRefillMode] = useState<{ type: 'r' | 'm'; id: string } | null>(null);
  const [refillQty, setRefillQty] = useState<number>(0);

  // Filter lists based on query
  const filteredReagents = reagents.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEquipments = equipments.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Alert limits (e.g., reagents lower than 300 or materials lower than 10)
  const reagentAlertLimit = 500; // 500g or mL
  const materialAlertLimit = 15; // 15 units / boxes

  // Edit & Subtract Mode States
  const [editingItem, setEditingItem] = useState<{ type: 'r' | 'm'; id: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editDetail, setEditDetail] = useState(''); // concentration for reagents, type for materials
  const [editQty, setEditQty] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('');
  const [editClass, setEditClass] = useState<Reagent['classification']>('comum');

  const [subtractMode, setSubtractMode] = useState<{ type: 'r' | 'm'; id: string } | null>(null);
  const [subtractQty, setSubtractQty] = useState<number>(0);

  const handleOpenEdit = (type: 'r' | 'm', id: string) => {
    // reset other active modes to avoid overlap confusion
    setRefillMode(null);
    setSubtractMode(null);
    if (type === 'r') {
      const item = reagents.find(r => r.id === id);
      if (item) {
        setEditingItem({ type, id });
        setEditName(item.name);
        setEditDetail(item.concentration);
        setEditQty(item.physicalStock);
        setEditUnit(item.unit);
        setEditClass(item.classification);
      }
    } else {
      const item = materials.find(m => m.id === id);
      if (item) {
        setEditingItem({ type, id });
        setEditName(item.name);
        setEditDetail(item.type);
        setEditQty(item.physicalStock);
        setEditUnit(item.unit);
      }
    }
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const { type, id } = editingItem;
    if (!editName.trim()) return alert('O nome é obrigatório.');

    if (type === 'r') {
      if (onSetReagents) {
        onSetReagents(prev => prev.map(item => item.id === id ? {
          ...item,
          name: editName,
          concentration: editDetail,
          physicalStock: Number(editQty),
          unit: editUnit,
          classification: editClass
        } : item));
        alert('Reagente atualizado com sucesso!');
      }
    } else {
      if (onSetMaterials) {
        onSetMaterials(prev => prev.map(item => item.id === id ? {
          ...item,
          name: editName,
          type: editDetail,
          physicalStock: Number(editQty),
          unit: editUnit
        } : item));
        alert('Material atualizado com sucesso!');
      }
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (type: 'r' | 'm', id: string, name: string) => {
    setRefillMode(null);
    setSubtractMode(null);
    setEditingItem(null);
    if (confirm(`Tem certeza de que deseja remover completamente "${name}" do estoque?`)) {
      if (type === 'r') {
        if (onSetReagents) {
          onSetReagents(prev => prev.filter(item => item.id !== id));
          alert(`Reagente "${name}" removido do estoque.`);
        }
      } else {
        if (onSetMaterials) {
          onSetMaterials(prev => prev.filter(item => item.id !== id));
          alert(`Material "${name}" removido do estoque.`);
        }
      }
    }
  };

  const handleApplySubtraction = () => {
    if (!subtractMode) return;
    const { type, id } = subtractMode;
    if (subtractQty <= 0) return alert('Insira uma quantidade válida para remoção.');

    if (type === 'r') {
      const item = reagents.find(r => r.id === id);
      if (!item) return;
      if (item.physicalStock < subtractQty) {
        return alert(`Estoque físico insuficiente! Estoque atual é de apenas ${item.physicalStock} ${item.unit}.`);
      }
      if (onUpdateReagentStock) {
        onUpdateReagentStock(id, item.physicalStock - subtractQty);
        alert(`Removidas ${subtractQty} ${item.unit} do reagente "${item.name}".`);
      }
    } else {
      const item = materials.find(m => m.id === id);
      if (!item) return;
      if (item.physicalStock < subtractQty) {
        return alert(`Estoque físico insuficiente! Estoque atual é de apenas ${item.physicalStock} ${item.unit}.`);
      }
      if (onUpdateMaterialStock) {
        onUpdateMaterialStock(id, item.physicalStock - subtractQty);
        alert(`Removidas ${subtractQty} ${item.unit} do material "${item.name}".`);
      }
    }
    setSubtractMode(null);
    setSubtractQty(0);
  };

  // Reagents Add submit
  const handleCreateReagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim()) return alert('Informe o nome do reagente');

    onAddReagent({
      id: `reagent_${Date.now()}`,
      name: rName,
      concentration: rConc,
      physicalStock: rQty,
      reservedStock: 0,
      unit: rUnit,
      classification: rClass
    });

    setRName('');
    setShowReagentForm(false);
    alert(`Reagente "${rName}" cadastrado no almoxarifado.`);
  };

  // Materials Add submit
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return alert('Informe o nome do material');

    onAddMaterial({
      id: `material_${Date.now()}`,
      name: mName,
      type: mType,
      physicalStock: mQty,
      reservedStock: 0,
      unit: mUnit
    });

    setMName('');
    setShowMaterialForm(false);
    alert(`Material "${mName}" cadastrado com sucesso.`);
  };

  // Equipment Add submit
  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eName.trim()) return alert('Informe o nome do equipamento');

    onAddEquipment({
      id: `equipment_${Date.now()}`,
      name: eName,
      condition: eCond,
      observations: eObs
    });

    setEName('');
    setEObs('');
    setShowEquipmentForm(false);
    alert(`Equipamento "${eName}" ativado no sistema.`);
  };

  const handleApplyRefill = () => {
    if (!refillMode || refillQty <= 0) return;
    if (refillMode.type === 'r') {
      const current = reagents.find(r => r.id === refillMode.id);
      if (current) {
        onUpdateReagentStock(refillMode.id, current.physicalStock + refillQty);
      }
    } else {
      const current = materials.find(m => m.id === refillMode.id);
      if (current) {
        onUpdateMaterialStock(refillMode.id, current.physicalStock + refillQty);
      }
    }
    setRefillMode(null);
    setRefillQty(0);
    alert('Estoque físico reposto com sucesso!');
  };

  return (
    <div id="stock-manager-section" className="glass-card rounded-xl overflow-hidden shadow-xs">
      
      {/* Search & Tabs bar Header */}
      <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-600" />
            Almoxarifado e Estoque Inteligente
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro de novos itens em tempo real, controle de reserva diferido e alertas automáticos de reposição.
          </p>
        </div>

        {/* Dynamic add item CTAs depending on tabs */}
        <div className="flex gap-2">
          {activeTab === 'reagentes' && (
            <button
              id="btn-add-reagent"
              onClick={() => { setShowReagentForm(true); setShowMaterialForm(false); setShowEquipmentForm(false); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Reagente Novo
            </button>
          )}
          {activeTab === 'materiais' && (
            <button
              id="btn-add-material"
              onClick={() => { setShowMaterialForm(true); setShowReagentForm(false); setShowEquipmentForm(false); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Material Novo
            </button>
          )}
          {activeTab === 'equipamentos' && (
            <button
              id="btn-add-equipment"
              onClick={() => { setShowEquipmentForm(true); setShowReagentForm(false); setShowMaterialForm(false); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Equipamento Novo
            </button>
          )}
        </div>
      </div>

      {/* SEARCH AND TABS GRID NAVIGATION */}
      <div className="px-5 py-3 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex bg-slate-100 rounded p-1 border border-slate-200">
          <button
            id="tab-sub-reagentes"
            onClick={() => setActiveTab('reagentes')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
              activeTab === 'reagentes' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Reagentes ({reagents.length})
          </button>
          <button
            id="tab-sub-materiais"
            onClick={() => setActiveTab('materiais')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
              activeTab === 'materiais' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Materiais e EPIs ({materials.length})
          </button>
          <button
            id="tab-sub-equipamentos"
            onClick={() => setActiveTab('equipamentos')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
              activeTab === 'equipamentos' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Equipamentos ({equipments.length})
          </button>
        </div>

        {/* Universal filter input */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="stock-search-field"
            type="text"
            placeholder={`Buscar por ${activeTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* QUICK FORMS (ABSOLUTE FLOATING OR IN-LINE INSERTS) */}
      {showReagentForm && (
        <form onSubmit={handleCreateReagent} className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Completo</label>
            <input
              id="new-reagent-name"
              type="text"
              required
              placeholder="Ex: Iodeto de Potássio"
              value={rName}
              onChange={e => setRName(e.target.value)}
              className="w-full text-xs border bg-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Concentração/Teor</label>
            <input
              id="new-reagent-conc"
              type="text"
              placeholder="Ex: 95% ou PA"
              value={rConc}
              onChange={e => setRConc(e.target.value)}
              className="w-full text-xs border bg-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 font-sans">Estoque Inicial</label>
              <input
                id="new-reagent-qty"
                type="number"
                min="1"
                required
                value={rQty}
                onChange={e => setRQty(Number(e.target.value))}
                className="w-full text-xs border bg-white p-2 rounded focus:outline-none text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Unidade</label>
              <select
                id="new-reagent-unit"
                value={rUnit}
                onChange={e => setRUnit(e.target.value)}
                className="w-full text-xs border bg-white p-2 rounded focus:outline-none text-slate-800"
              >
                <option value="g">g</option>
                <option value="mL">mL</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Órgão Moderador / Classe</label>
            <select
              id="new-reagent-class"
              value={rClass}
              onChange={e => setRClass(e.target.value as Reagent['classification'])}
              className="w-full text-xs border bg-white p-2 text-slate-800 rounded focus:outline-none"
            >
              <option value="comum">Comum (Ilimitado)</option>
              <option value="controlado_pf">Polícia Federal (PF)</option>
              <option value="controlado_exercito">Exército Brasileiro</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded"
            >
              Salvar Reagente
            </button>
            <button
              type="button"
              onClick={() => setShowReagentForm(false)}
              className="bg-slate-250 border p-2 text-xs text-slate-600 hover:bg-slate-300 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {showMaterialForm && (
        <form onSubmit={handleCreateMaterial} className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Insumo</label>
            <input
              id="new-material-name"
              type="text"
              required
              placeholder="Ex: Proveta graduada 100mL"
              value={mName}
              onChange={e => setMName(e.target.value)}
              className="w-full text-xs border bg-white p-2 rounded text-slate-800 focus:outline"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Categoria</label>
            <select
              id="new-material-type"
              value={mType}
              onChange={e => setMType(e.target.value)}
              className="w-full text-xs border bg-white p-2 text-slate-800 rounded focus:outline"
            >
              <option value="Vidraria">Vidraria</option>
              <option value="EPIs">EPIs</option>
              <option value="Equipamento">Equipamento</option>
              <option value="Ferragens">Ferragens</option>
              <option value="Consumíveis">Consumíveis</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-15">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Qtd Física Fiel</label>
              <input
                id="new-material-qty"
                type="number"
                min="1"
                value={mQty}
                onChange={e => setMQty(Number(e.target.value))}
                className="w-full text-xs border bg-white p-2 text-slate-800 font-mono rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Unidade</label>
              <select
                id="new-material-unit"
                value={mUnit}
                onChange={e => setMUnit(e.target.value)}
                className="w-full text-xs border bg-white p-2 text-slate-800 rounded focus:outline"
              >
                <option value="unidades">Unidades</option>
                <option value="caixas">Caixas</option>
                <option value="pacotes">Pacotes</option>
                <option value="g">Gramas (g)</option>
                <option value="mL">Mililitros (mL)</option>
                <option value="L">Litros (L)</option>
                <option value="kg">Quilos (kg)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded"
            >
              Salvar Insumo
            </button>
            <button
              type="button"
              onClick={() => setShowMaterialForm(false)}
              className="bg-slate-200 border p-2 text-xs text-slate-600 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {showEquipmentForm && (
        <form onSubmit={handleCreateEquipment} className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Equipamento</label>
            <input
              id="new-eq-name"
              type="text"
              required
              placeholder="Ex: Espectrofotômetro UV-Vis"
              value={eName}
              onChange={e => setEName(e.target.value)}
              className="w-full text-xs border bg-white p-2 rounded text-slate-800 focus:outline"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Condição de Operação</label>
            <select
              id="new-eq-cond"
              value={eCond}
              onChange={e => setECond(e.target.value as any)}
              className="w-full text-xs border bg-white p-2 text-slate-800 rounded focus:outline"
            >
              <option value="excelente">Excelente Estado</option>
              <option value="regular">Regular / Usável</option>
              <option value="manutencao">Interrompida para Manutenção</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Observações Técnicas</label>
            <input
              id="new-eq-obs"
              type="text"
              placeholder="Ex: Calibrado com padrão de quartzo..."
              value={eObs}
              onChange={e => setEObs(e.target.value)}
              className="w-full text-xs border bg-white p-2 text-slate-800 rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded"
            >
              Gravar Equipamento
            </button>
            <button
              type="button"
              onClick={() => setShowEquipmentForm(false)}
              className="bg-slate-200 border p-2 text-xs text-slate-600 rounded"
            >
              Fechar
            </button>
          </div>
        </form>
      )}

      {/* QUICK FLOATING REFILL DRAWER POPUP */}
      {refillMode && (
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs">
            <span className="font-bold text-emerald-900">Repor Estoque Físico: </span>
            <span>
              {refillMode.type === 'r' 
                ? reagents.find(r => r.id === refillMode.id)?.name 
                : materials.find(m => m.id === refillMode.id)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="refill-qty-input"
              type="number"
              min="1"
              value={refillQty || ''}
              placeholder="Adicionar qtd"
              onChange={e => setRefillQty(Number(e.target.value))}
              className="w-24 border rounded p-1 text-xs font-mono bg-white font-bold"
            />
            <button
              id="refill-now-btn"
              onClick={handleApplyRefill}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 px-3 rounded"
            >
              Repor
            </button>
            <button
              onClick={() => setRefillMode(null)}
              className="text-xs text-slate-500 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {subtractMode && (
        <div className="bg-rose-50 border-b border-rose-200 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs">
            <span className="font-bold text-rose-950">Remover Quantidade do Estoque: </span>
            <span className="font-medium text-slate-700">
              {subtractMode.type === 'r' 
                ? reagents.find(r => r.id === subtractMode.id)?.name 
                : materials.find(m => m.id === subtractMode.id)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="subtract-qty-input"
              type="number"
              min="1"
              value={subtractQty || ''}
              placeholder="Qtd para remover"
              onChange={e => setSubtractQty(Number(e.target.value))}
              className="w-36 border border-rose-300 rounded p-1 text-xs font-mono bg-white font-bold"
            />
            <button
              id="subtract-now-btn"
              onClick={handleApplySubtraction}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1 px-3 rounded shadow-xs"
            >
              Confirmar Remoção
            </button>
            <button
              onClick={() => { setSubtractMode(null); setSubtractQty(0); }}
              className="text-xs text-slate-500 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-md p-5 text-slate-800">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              Editar Informações do Item ({editingItem.type === 'r' ? 'Reagente' : 'Material'})
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-705 font-bold mb-1">Nome do Item</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              {editingItem.type === 'r' ? (
                <>
                  <div>
                    <label className="block text-slate-705 font-bold mb-1">Concentração/Teor</label>
                    <input
                      type="text"
                      value={editDetail}
                      onChange={e => setEditDetail(e.target.value)}
                      className="w-full border rounded p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-750 font-bold mb-1">Classe de Controle</label>
                    <select
                      value={editClass}
                      onChange={e => setEditClass(e.target.value as Reagent['classification'])}
                      className="w-full border rounded p-2 bg-white"
                    >
                      <option value="comum">Comum (Irrestrito)</option>
                      <option value="controlado_pf">Rastreável pela Polícia Federal</option>
                      <option value="controlado_exercito">Controlado pelo Exército</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-slate-750 font-bold mb-1">Categoria (ex: Vidraria, Consumível)</label>
                  <input
                    type="text"
                    value={editDetail}
                    onChange={e => setEditDetail(e.target.value)}
                    className="w-full border rounded p-2 bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-705 font-bold mb-1">Estoque Físico</label>
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={e => setEditQty(Number(e.target.value))}
                    className="w-full border rounded p-2 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-705 font-bold mb-1">Unidade</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={e => setEditUnit(e.target.value)}
                    className="w-full border rounded p-2 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const currentName = editingItem.type === 'r'
                    ? reagents.find(re => re.id === editingItem.id)?.name || ''
                    : materials.find(m => m.id === editingItem.id)?.name || '';
                  handleDeleteItem(editingItem.type, editingItem.id, currentName);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Excluir item completamente"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border hover:bg-slate-50 text-slate-600 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER LIST CORRESPONDING TO ACTIVE TAB */}
      <div className="p-5">
        
        {/* TAB 1: REAGENTS RENDER */}
        {activeTab === 'reagentes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-55 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Nome / Concentração</th>
                  <th className="p-3">Físico</th>
                  <th className="p-3 text-amber-600">Reservado (Prometido)</th>
                  <th className="p-3 text-emerald-600">Disponível para Próximas Reservas</th>
                  <th className="p-3">Controle Legal / Alertas</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredReagents.map(re => {
                  const available = re.physicalStock - re.reservedStock;
                  const isLow = available < reagentAlertLimit;

                  return (
                    <tr key={re.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{re.name}</strong>
                        <span className="text-[10px] text-slate-400">Teor/Conc: {re.concentration}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-700 font-bold">{re.physicalStock} {re.unit}</td>
                      <td className="p-3 font-mono text-amber-700 font-semibold">{re.reservedStock} {re.unit}</td>
                      <td className="p-3">
                        <span className={`font-mono font-bold ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {available} {re.unit}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {re.classification === 'controlado_pf' && (
                            <span className="bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200 px-1.5 py-0.5 rounded tracking-wide uppercase">
                              Rastreável PF
                            </span>
                          )}
                          {re.classification === 'controlado_exercito' && (
                            <span className="bg-violet-50 text-indigo-700 text-[9px] font-bold border border-indigo-200 px-1.5 py-0.5 rounded tracking-wide uppercase">
                              Exército
                            </span>
                          )}
                          {isLow && (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Baixo Estoque
                            </span>
                          )}
                          {!isLow && re.classification === 'comum' && (
                            <span className="text-slate-400 text-[10px]">Perfeito</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          id={`edit-r-${re.id}`}
                          onClick={() => handleOpenEdit('r', re.id)}
                          className="mx-auto bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold py-1 px-3.5 rounded border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: MATERIALS RENDER */}
        {activeTab === 'materiais' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-55 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Material</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Físico</th>
                  <th className="p-3 text-amber-600">Alocado para Aulas</th>
                  <th className="p-3 text-blue-600">Livre</th>
                  <th className="p-3">Status de Abastecimento</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredMaterials.map(mat => {
                  const available = mat.physicalStock - mat.reservedStock;
                  const isLow = available < materialAlertLimit;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{mat.name}</strong>
                      </td>
                      <td className="p-3 capitalize">
                        <span className="bg-slate-100 text-slate-500 border rounded px-1.5 py-0.5 text-[10px]">
                          {mat.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700 font-semibold">{mat.physicalStock} {mat.unit}</td>
                      <td className="p-3 font-mono text-amber-700 font-semibold">{mat.reservedStock} {mat.unit}</td>
                      <td className="p-3 font-mono font-bold text-blue-700">{available} {mat.unit}</td>
                      <td className="p-3">
                        {isLow ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Reposicionar Próximo
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Abastecido
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          id={`edit-m-${mat.id}`}
                          onClick={() => handleOpenEdit('m', mat.id)}
                          className="mx-auto bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold py-1 px-3.5 rounded border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: EQUIPMENTS RENDER */}
        {activeTab === 'equipamentos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipments.map(eq => (
              <div key={eq.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{eq.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                    eq.condition === 'excelente' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : eq.condition === 'regular' 
                      ? 'bg-amber-50 text-amber-700 border-amber-205' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {eq.condition}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic font-medium">"{eq.observations || 'Nenhuma nota de calibração.'}"</p>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex justify-end gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">ID: {eq.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
