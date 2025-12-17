import { Condominium, User, UserRole, RolePermissions, AppModule, CalendarEvent, Notification, Bill, SupportTicket, TourStep, CondoDocument } from './types';

// Centralized Module Definition
export const APP_MODULES: AppModule[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', iconName: 'LayoutDashboard' },
  { id: 'access-control', label: 'Portaria', shortLabel: 'Portaria', iconName: 'KeyRound' }, // New Access Control
  { id: 'support-desk', label: 'Mesa de Atendimento', shortLabel: 'Atend.', iconName: 'Headphones' }, // New Module for Support
  { id: 'agenda', label: 'Agenda & Reservas', shortLabel: 'Agenda', iconName: 'Calendar' },
  { id: 'resources', label: 'Recursos / Áreas', shortLabel: 'Áreas', iconName: 'Armchair' },
  { id: 'documents', label: 'Documentos', shortLabel: 'Docs', iconName: 'FolderOpen' }, // New Module
  { id: 'virtual-assembly', label: 'Assembleia Virtual', shortLabel: 'Votação', iconName: 'Gavel' }, // New Module
  { id: 'marketplace', label: 'Classificados', shortLabel: 'Vendas', iconName: 'ShoppingBag' }, // New Module
  { id: 'financial', label: 'Financeiro', shortLabel: 'Finan.', iconName: 'DollarSign' },
  { id: 'users', label: 'Usuários', shortLabel: 'Users', iconName: 'Users' },
  { id: 'condos', label: 'Condomínios', shortLabel: 'Condos', iconName: 'Building2' },
  { id: 'settings', label: 'Configurações', shortLabel: 'Config.', iconName: 'Settings' },
];

export const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'nav-dashboard',
    title: 'Visão Geral',
    content: 'Aqui no Dashboard você encontra os principais indicadores e avisos do seu condomínio.',
    position: 'right'
  },
  {
    targetId: 'nav-agenda',
    title: 'Agendamentos',
    content: 'Reserve áreas comuns como Salão de Festas e Churrasqueira, ou visualize eventos do condomínio.',
    position: 'right'
  },
  {
    targetId: 'nav-financial',
    title: 'Financeiro',
    content: 'Acesse seus boletos, verifique pendências e histórico de pagamentos.',
    position: 'right'
  },
  {
    targetId: 'nav-documents',
    title: 'Mural de Documentos',
    content: 'Acesse atas de assembleia, regimento interno e balancetes financeiros.',
    position: 'right'
  },
  {
    targetId: 'nav-settings',
    title: 'Configurações',
    content: 'Atualize seus dados, altere o condomínio selecionado ou reveja este tour quando quiser.',
    position: 'right'
  },
  {
    targetId: 'header-user-info',
    title: 'Perfil',
    content: 'Veja rapidamente qual perfil e condomínio você está acessando no momento.',
    position: 'right'
  },
  {
    targetId: 'floating-chat-btn',
    title: 'Suporte Online',
    content: 'Precisa de ajuda? Fale diretamente com nossa equipe de suporte através deste chat.',
    position: 'left'
  }
];

// Default Permissions
// Added 'chat' permission to control widget visibility per role
export const DEFAULT_PERMISSIONS: RolePermissions = {
  [UserRole.SUPER_ADMIN]: ['dashboard', 'agenda', 'resources', 'documents', 'marketplace', 'users', 'condos', 'financial', 'settings', 'chat', 'access-control', 'virtual-assembly'],
  [UserRole.SYNDIC]: ['dashboard', 'agenda', 'resources', 'documents', 'marketplace', 'users', 'financial', 'settings', 'chat', 'access-control', 'virtual-assembly'],
  [UserRole.RESIDENT]: ['dashboard', 'agenda', 'documents', 'marketplace', 'financial', 'settings', 'chat', 'access-control', 'virtual-assembly'],
  [UserRole.SUPPORT]: ['support-desk', 'users', 'settings', 'access-control', 'virtual-assembly', 'marketplace'] // Perfil focado em atendimento (não usa o widget de residente)
};

export const MOCK_CONDOS: Condominium[] = [
  {
    id: 'c1',
    name: 'Residencial Jardins da Serra',
    address: 'Av. das Flores, 123 - Centro',
    unitsCount: 45,
    resources: ['Churrasqueira', 'Salão de Festas', 'Piscina'],
    features: { isChatEnabled: true }
  },
  {
    id: 'c2',
    name: 'Edifício Blue Tower',
    address: 'Rua do Comércio, 500 - Empresarial',
    unitsCount: 120,
    resources: ['Salão de Festas', 'Academia', 'Sala de Reuniões', 'Auditório'],
    features: { isChatEnabled: true }
  },
  {
    id: 'c3',
    name: 'Condomínio Villas do Lago',
    address: 'Estrada do Lago, Km 4 - Zona Rural',
    unitsCount: 80,
    resources: ['Quiosque A', 'Quiosque B', 'Campo de Futebol', 'Quadra de Tênis'],
    features: { isChatEnabled: false } // Exemplo: Chat desativado
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Carlos Administrador',
    email: 'admin@gestor.com',
    role: UserRole.SUPER_ADMIN,
    active: true,
    createdAt: '2023-01-15T10:00:00Z',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    financialStatus: 'PAID',
    unitId: 'ADM',
    block: 'ADM'
  },
  {
    id: 'u2',
    name: 'Roberto Síndico',
    email: 'roberto@jardins.com',
    role: UserRole.SYNDIC,
    condominiumId: 'c1',
    managedCondoIds: ['c1', 'c3'],
    active: true,
    createdAt: '2023-02-20T14:30:00Z',
    condoJoinDate: '2023-02-20T14:30:00Z',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    financialStatus: 'PAID',
    unitId: '301',
    block: 'C'
  },
  {
    id: 'u3',
    name: 'Ana Moradora',
    email: 'ana@email.com',
    role: UserRole.RESIDENT,
    condominiumId: 'c1',
    unitId: '101',
    block: 'A',
    active: true,
    createdAt: '2023-03-05T09:15:00Z',
    condoJoinDate: new Date().toISOString(),
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    financialStatus: 'OVERDUE'
  },
  {
    id: 'u4',
    name: 'Marcos Souza',
    email: 'marcos@email.com',
    role: UserRole.RESIDENT,
    condominiumId: 'c1',
    unitId: '205',
    block: 'B',
    active: true,
    createdAt: '2023-04-10T09:15:00Z',
    condoJoinDate: '2023-04-10T09:15:00Z',
    avatarUrl: 'https://picsum.photos/200/200?random=4',
    financialStatus: 'PAID'
  },
  {
    id: 'u5',
    name: 'Julia Empresária',
    email: 'julia@bluetower.com',
    role: UserRole.RESIDENT,
    condominiumId: 'c2',
    unitId: 'Sala 404',
    block: 'Único',
    active: true,
    createdAt: '2023-06-15T09:15:00Z',
    condoJoinDate: '2023-06-15T09:15:00Z',
    avatarUrl: 'https://picsum.photos/200/200?random=5',
    financialStatus: 'PAID'
  },
  {
    id: 'u6',
    name: 'Sofia Atendimento',
    email: 'sofia@suporte.com',
    role: UserRole.SUPPORT,
    active: true,
    createdAt: '2023-08-01T08:00:00Z',
    avatarUrl: 'https://picsum.photos/200/200?random=6',
    financialStatus: 'PAID',
    condominiumId: '' // Atendimento global ou multi-condo
  }
];

export const MOCK_BILLS: Bill[] = [
  {
    id: 'b1',
    userId: 'u3', // Ana (Inadimplente)
    type: 'CONDO',
    description: 'Taxa Condominial - Abril/2023',
    value: 450.00,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString().split('T')[0], // 45 dias atrás
    status: 'LATE',
    barCode: '34191.79001 01043.510047 91020.150008 2 89900000045000'
  },
  {
    id: 'b2',
    userId: 'u3', // Ana (Inadimplente)
    type: 'CONDO',
    description: 'Taxa Extra - Reforma Fachada',
    value: 150.00,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], // 15 dias atrás
    status: 'LATE',
    barCode: '34191.79001 01043.510047 91020.150008 2 89900000015000'
  },
  {
    id: 'b3',
    userId: 'u4',
    type: 'FINANCING',
    description: 'Parcela Financiamento - Maio/2023',
    value: 1450.00,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
    status: 'OPEN',
    barCode: '34191.79001 01043.510047 91020.150008 2 89900000045000'
  }
];

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    condominiumId: 'c1',
    userId: 'u2',
    userName: 'Roberto Síndico',
    title: 'Assembléia Geral Extraordinária',
    description: 'Pauta: Reforma da fachada e aprovação de contas.',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:00',
    type: 'MEETING',
    status: 'CONFIRMED'
  },
  {
    id: 'e2',
    condominiumId: 'c1',
    userId: 'u4',
    userName: 'Marcos Souza',
    title: 'Reserva Churrasqueira',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '18:00',
    type: 'BOOKING',
    resource: 'Churrasqueira',
    status: 'CONFIRMED'
  },
  {
    id: 'e3',
    condominiumId: 'c1',
    userId: 'u3', // Ana
    userName: 'Ana Moradora',
    title: 'Salão de Festas - Aniversário',
    date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '22:00',
    type: 'BOOKING',
    resource: 'Salão de Festas',
    status: 'CONFIRMED'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    condominiumId: 'c1',
    title: 'Manutenção no Portão',
    message: 'O portão principal passará por manutenção amanhã às 09:00.',
    date: new Date().toISOString(),
    read: false,
    type: 'INFO'
  },
  {
    id: 'n2',
    condominiumId: 'c2',
    title: 'Boleto Disponível',
    message: 'Os boletos de Maio já estão disponíveis.',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    read: true,
    type: 'SUCCESS'
  },
  {
    id: 'n3',
    condominiumId: 'c1',
    title: 'Alerta de Barulho',
    message: 'Lembramos a todos sobre a lei do silêncio após às 22h.',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    read: false,
    type: 'ALERT'
  }
];

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'TK-1001',
    userId: 'u3',
    userName: 'Ana Moradora',
    userAvatar: 'https://picsum.photos/200/200?random=3',
    condoName: 'Residencial Jardins da Serra',
    unitInfo: 'Bl A - 101',
    subject: 'Boleto com valor incorreto',
    status: 'OPEN',
    priority: 'HIGH',
    lastUpdate: new Date().toISOString(),
    tags: ['financeiro', 'urgente'],
    messages: [
      { id: 'm1', sender: 'user', text: 'Olá, meu boleto veio com valor acima do normal. Poderiam verificar?', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ]
  },
  {
    id: 'TK-1002',
    userId: 'u4',
    userName: 'Marcos Souza',
    userAvatar: 'https://picsum.photos/200/200?random=4',
    condoName: 'Residencial Jardins da Serra',
    unitInfo: 'Bl B - 205',
    subject: 'Reserva do salão de festas',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    lastUpdate: new Date(Date.now() - 86400000).toISOString(),
    tags: ['agendamento', 'dúvida'],
    messages: [
      { id: 'm1', sender: 'user', text: 'Boa tarde, gostaria de saber se é permitido levar DJ.', timestamp: new Date(Date.now() - 90000000).toISOString() },
      { id: 'm2', sender: 'agent', text: 'Olá Marcos! Sim, é permitido até as 22h.', timestamp: new Date(Date.now() - 89000000).toISOString() },
      { id: 'm3', sender: 'user', text: 'Ótimo, obrigado!', timestamp: new Date(Date.now() - 88000000).toISOString() }
    ]
  },
  {
    id: 'TK-1003',
    userId: 'u5',
    userName: 'Julia Empresária',
    userAvatar: 'https://picsum.photos/200/200?random=5',
    condoName: 'Edifício Blue Tower',
    unitInfo: 'Sala 404',
    subject: 'Controle de Acesso Visitantes',
    status: 'WAITING',
    priority: 'LOW',
    lastUpdate: new Date(Date.now() - 172800000).toISOString(),
    tags: ['portaria', 'segurança'],
    messages: [
      { id: 'm1', sender: 'user', text: 'Preciso cadastrar 5 visitantes para amanhã.', timestamp: new Date(Date.now() - 172800000).toISOString() }
    ]
  }
];

export const MOCK_DOCUMENTS: CondoDocument[] = [
  {
    id: 'd1',
    condominiumId: 'c1',
    title: 'Regimento Interno 2023',
    category: 'RULES',
    url: '#',
    date: '2023-01-10',
    size: '2.5 MB'
  },
  {
    id: 'd2',
    condominiumId: 'c1',
    title: 'Ata Assembléia Maio/2023',
    category: 'MINUTES',
    url: '#',
    date: '2023-05-15',
    size: '1.2 MB'
  },
  {
    id: 'd3',
    condominiumId: 'c1',
    title: 'Balancete Financeiro Abr/2023',
    category: 'FINANCIAL',
    url: '#',
    date: '2023-05-05',
    size: '850 KB'
  },
  {
    id: 'd4',
    condominiumId: 'c2',
    title: 'Manual do Proprietário',
    category: 'OTHER',
    url: '#',
    date: '2022-11-20',
    size: '5.0 MB'
  }
];