interface RoleSelectorProps {
  currentRole: 'professor' | 'tecnico';
  onChangeRole: (role: 'professor' | 'tecnico') => void;
}

export default function RoleSelector({ currentRole, onChangeRole }: RoleSelectorProps) {
  return (
    <div id="role-selector" className="bg-slate-900 text-white py-2 px-4 shadow-md flex flex-wrap gap-4 items-center justify-between border-b border-slate-800 font-sans">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-xs font-semibold tracking-wide text-slate-200">IFLab v1.0 — Ambiente de Demonstração</span>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-slate-400 font-medium font-mono">Simular Perfil:</span>
        <div className="inline-flex rounded p-1 bg-slate-800 border border-slate-700">
          <button
            id="role-btn-professor"
            onClick={() => onChangeRole('professor')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              currentRole === 'professor'
                ? 'bg-emerald-600 text-white shadow font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>Professor (Maria Silva)</span>
          </button>
          <button
            id="role-btn-tecnico"
            onClick={() => onChangeRole('tecnico')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              currentRole === 'tecnico'
                ? 'bg-emerald-600 text-white shadow font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>Técnico (João Souza)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
