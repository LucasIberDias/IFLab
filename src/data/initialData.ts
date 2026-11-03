import { Reagent, Material, Equipment, Reservation, ControlledLog } from '../types';

export const INITIAL_REAGENTS: Reagent[] = [
  {
    id: 'r_1',
    name: 'Ácido Benzóico',
    concentration: '99%',
    physicalStock: 5000, // 5kg inside g
    reservedStock: 200,
    unit: 'g',
    classification: 'comum'
  },
  {
    id: 'r_2',
    name: 'Ácido Sulfúrico',
    concentration: '98%',
    physicalStock: 10000, // 10L inside mL
    reservedStock: 1500,
    unit: 'mL',
    classification: 'controlado_pf'
  },
  {
    id: 'r_3',
    name: 'Éter Etílico',
    concentration: '99.5%',
    physicalStock: 8000,
    reservedStock: 1000,
    unit: 'mL',
    classification: 'controlado_exercito'
  },
  {
    id: 'r_4',
    name: 'Acetona',
    concentration: 'PA',
    physicalStock: 15000,
    reservedStock: 0,
    unit: 'mL',
    classification: 'controlado_pf'
  },
  {
    id: 'r_5',
    name: 'Carbonato de Sódio Anidro',
    concentration: '99%',
    physicalStock: 2500,
    reservedStock: 100,
    unit: 'g',
    classification: 'comum'
  },
  {
    id: 'r_6',
    name: 'Etanol Absoluto',
    concentration: '99.8%',
    physicalStock: 20000,
    reservedStock: 500,
    unit: 'mL',
    classification: 'comum'
  },
  {
    id: 'r_7',
    name: 'Hidróxido de Sódio',
    concentration: '98%',
    physicalStock: 3000,
    reservedStock: 300,
    unit: 'g',
    classification: 'comum'
  }
];

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'm_1',
    name: 'Béquer',
    type: 'Vidraria',
    physicalStock: 45,
    reservedStock: 15,
    unit: 'unidades'
  },
  {
    id: 'm_2',
    name: 'Luvas de Látex',
    type: 'EPIs',
    physicalStock: 10, // 10 caixas
    reservedStock: 2,
    unit: 'caixas'
  },
  {
    id: 'm_3',
    name: 'Pipeta de Pasteur',
    type: 'Vidraria',
    physicalStock: 150,
    reservedStock: 30,
    unit: 'unidades'
  },
  {
    id: 'm_4',
    name: 'Tubo de Ensaio',
    type: 'Vidraria',
    physicalStock: 200,
    reservedStock: 20,
    unit: 'unidades'
  },
  {
    id: 'm_5',
    name: 'Máscara Descartável',
    type: 'EPIs',
    physicalStock: 4, // 4 caixas
    reservedStock: 0,
    unit: 'caixas'
  },
  {
    id: 'm_6',
    name: 'Balão Volumétrico 100mL',
    type: 'Vidraria',
    physicalStock: 30,
    reservedStock: 10,
    unit: 'unidades'
  }
];

export const INITIAL_EQUIPMENTS: Equipment[] = [
  {
    id: 'e_1',
    name: 'Estufa de Secagem 150L',
    condition: 'excelente',
    observations: 'Controlador de temperatura calibrado em março/2026.'
  },
  {
    id: 'e_2',
    name: 'Balança Analítica Digital',
    condition: 'excelente',
    observations: 'Sensibilidade de 0,1mg. Necessita nivelamento antes do uso.'
  },
  {
    id: 'e_3',
    name: 'Capela de Exaustão de Gases',
    condition: 'regular',
    observations: 'Exaustor operando com 85% de fluxo nominal. Usar seletividade alta.'
  },
  {
    id: 'e_4',
    name: 'Microscópio Ótico Binocular',
    condition: 'excelente',
    observations: 'Lentes limpas. Total de 4 unidades disponíveis.'
  },
  {
    id: 'e_5',
    name: 'Centrífuga de Bancada',
    condition: 'manutencao',
    observations: 'Aguardando troca do rotor de reposição solicitado.'
  }
];

// Helper to calculate past & future dates for demo realism
const getDateWithOffset = (offsetDays: number): string => {
  const date = new Date();
  date.setHours(12, 0, 0, 0); // stable noon parsing
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res_1',
    date: getDateWithOffset(0), // Today
    shift: 'tarde',
    labId: 'quimica',
    professorName: 'Profª. Maria Silva',
    practiceName: 'Síntese de Aspirina (Ácido Acetilsalicílico)',
    course: 'Química Farmacêutica I',
    studentCount: 24,
    benchesCount: 2,
    status: 'preparacao',
    createdAt: getDateWithOffset(-5),
    reagentsNeeded: [
      {
        id: 'req_r1_1',
        reagentId: 'r_2', // Ácido Sulfúrico
        name: 'Ácido Sulfúrico',
        concentration: '98%',
        quantityPerGroup: 5,
        quantityTotalRequired: 30, // 6 groups of 4 students = 6 * 5 = 30mL
      },
      {
        id: 'req_r1_2',
        reagentId: 'r_1', // Ácido Benzóico
        name: 'Ácido Benzóico',
        concentration: '99%',
        quantityPerGroup: 10,
        quantityTotalRequired: 60, // 6 * 10 = 60g
      }
    ],
    materialsNeeded: [
      {
        id: 'req_m1_1',
        materialId: 'm_1', // Béquer
        name: 'Béquer',
        type: 'Vidraria',
        quantityRequired: 6,
      },
      {
        id: 'req_m1_2',
        materialId: 'm_3', // Pipeta Pasteur
        name: 'Pipeta de Pasteur',
        type: 'Vidraria',
        quantityRequired: 12,
      }
    ],
    equipmentsNeeded: ['e_2', 'e_3'], // Balança & Capela
    expectedWaste: [
      {
        type: 'organico',
        quantity: 1.5,
        unit: 'L'
      },
      {
        type: 'inorganico',
        quantity: 0.5,
        unit: 'L'
      }
    ]
  },
  {
    id: 'res_2',
    date: getDateWithOffset(2), // 2 days from now
    shift: 'manha',
    labId: 'quimica',
    professorName: 'Profª. Maria Silva',
    practiceName: 'Extração por Solvente de óleos essenciais',
    course: 'Química Orgânica I',
    studentCount: 22,
    benchesCount: 3,
    status: 'pendente',
    createdAt: getDateWithOffset(-2),
    reagentsNeeded: [
      {
        id: 'req_r2_1',
        reagentId: 'r_3', // Éter Etílico (exercito!)
        name: 'Éter Etílico',
        concentration: '99.5%',
        quantityPerGroup: 150,
        quantityTotalRequired: 900, // 6 groups * 150ml = 900ml
      }
    ],
    materialsNeeded: [
      {
        id: 'req_m2_1',
        materialId: 'm_1',
        name: 'Béquer',
        type: 'Vidraria',
        quantityRequired: 9,
      },
      {
        id: 'req_m2_2',
        materialId: 'm_2',
        name: 'Luvas de Látex',
        type: 'EPIs',
        quantityRequired: 2, // 2 caixas
      }
    ],
    equipmentsNeeded: ['e_1', 'e_3'],
    expectedWaste: [
      {
        type: 'inflamavel',
        quantity: 1.0,
        unit: 'L'
      }
    ],
    attachmentName: 'roteiro_extracao_organica.pdf'
  },
  {
    id: 'res_3',
    date: getDateWithOffset(-3), // 3 days ago
    shift: 'noite',
    labId: 'biologia',
    professorName: 'Prof. Carlos Eduardo',
    practiceName: 'Observação de Células da Mucosa Bucal',
    course: 'Biologia Celular',
    studentCount: 26,
    benchesCount: 3,
    status: 'finalizado',
    createdAt: getDateWithOffset(-10),
    reagentsNeeded: [
      {
        id: 'req_r3_1',
        reagentId: 'r_6', // Etanol
        name: 'Etanol Absoluto',
        concentration: '99.8%',
        quantityPerGroup: 30,
        quantityTotalRequired: 180,
        actualUsed: 150 // Technician lowered the consumption real
      }
    ],
    materialsNeeded: [
      {
        id: 'req_m3_1',
        materialId: 'm_4', // Tubo de Ensaio
        name: 'Tubo de Ensaio',
        type: 'Vidraria',
        quantityRequired: 12,
        actualUsed: 11
      }
    ],
    equipmentsNeeded: ['e_4'],
    expectedWaste: [
      {
        type: 'biologico',
        quantity: 0.2,
        unit: 'L'
      }
    ],
    actualWaste: [
      {
        type: 'biologico',
        quantity: 0.2,
        unit: 'L',
        realQuantity: 0.15,
        disposalMethod: 'Autoclavagem seguido por descarte em lixo infectante classe A.',
        collected: true
      }
    ]
  },
  {
    id: 'res_4',
    date: getDateWithOffset(3), // 3 days from now
    shift: 'noite',
    labId: 'biologia',
    professorName: 'Profª. Patrícia Lima',
    practiceName: 'Microbiologia Geral e Meios de Cultura',
    course: 'Microbiologia I',
    studentCount: 15,
    benchesCount: 1,
    status: 'aprovado',
    createdAt: getDateWithOffset(-4),
    reagentsNeeded: [
      {
        id: 'req_r4_1',
        reagentId: 'r_7', // NaOH
        name: 'Hidróxido de Sódio',
        concentration: '98%',
        quantityPerGroup: 20,
        quantityTotalRequired: 100,
      }
    ],
    materialsNeeded: [
      {
        id: 'req_m4_1',
        materialId: 'm_6', // Balão Volumétrico 100mL
        name: 'Balão Volumétrico 100mL',
        type: 'Vidraria',
        quantityRequired: 5,
      }
    ],
    equipmentsNeeded: ['e_1'],
    expectedWaste: [
      {
        type: 'inorganico',
        quantity: 0.5,
        unit: 'L'
      }
    ]
  }
];

export const INITIAL_CONTROLLED_LOGS: ControlledLog[] = [
  {
    id: 'log_1',
    date: getDateWithOffset(-12),
    reagentName: 'Ácido Sulfúrico',
    quantity: 50,
    unit: 'mL',
    purpose: 'Aula Prática: Reações de Halogenação',
    wasteQuantity: 45,
    wasteUnit: 'mL',
    professor: 'Profª. Maria Silva',
    technician: 'Téc. João Souza'
  },
  {
    id: 'log_2',
    date: getDateWithOffset(-8),
    reagentName: 'Acetona',
    quantity: 120,
    unit: 'mL',
    purpose: 'Aula Prática: Destilação de Compostos Orgânicos',
    wasteQuantity: 110,
    wasteUnit: 'mL',
    professor: 'Profª. Maria Silva',
    technician: 'Téc. João Souza'
  },
  {
    id: 'log_3',
    date: getDateWithOffset(-3),
    reagentName: 'Ácido Sulfúrico',
    quantity: 100,
    unit: 'mL',
    purpose: 'Ensino: Titulação Ácido-Base Complexa',
    wasteQuantity: 95,
    wasteUnit: 'mL',
    professor: 'Prof. Carlos Eduardo',
    technician: 'Téc. João Souza'
  }
];
