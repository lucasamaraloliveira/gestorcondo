
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Dono do software/Administradora
  SYNDIC = 'SYNDIC',           // Síndico (Gerencia 1 condominio)
  RESIDENT = 'RESIDENT',       // Morador (Filho do condomínio)
  SUPPORT = 'SUPPORT'          // Novo Perfil: Agente de Atendimento
}

export type FinancialStatus = 'PAID' | 'OVERDUE' | 'PENDING';

// Mapeamento: Chave do Role -> Array de IDs dos módulos permitidos
export type RolePermissions = Record<UserRole, string[]>;

export interface AppModule {
  id: string;
  label: string;
  shortLabel?: string; // Label curto para menu colapsado/mobile
  iconName: string; // Nome do ícone para ser resolvido dinamicamente ou fixo
}

export interface TourStep {
  targetId: string; // ID do elemento HTML a ser destacado
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Ação opcional ao chegar no passo (ex: mudar de página)
}

export interface CondoFeatures {
  isChatEnabled: boolean;
  // Futuras flags: isReservationsEnabled, isFinancialEnabled, etc.
}

export interface Condominium {
  id: string;
  name: string;
  address: string;
  unitsCount: number;
  resources: string[]; // Ex: ['Churrasqueira', 'Salão de Festas', 'Quadra']
  features?: CondoFeatures; // Configurações de funcionalidades ativas
}

export interface Unit {
  id: string;
  condominiumId: string;
  block: string;
  number: string;
}

export interface Bill {
  id: string;
  userId: string;
  type: 'CONDO' | 'FINANCING' | 'RESERVATION'; // Added RESERVATION type
  description: string; // Ex: Taxa Condominial Maio/2023
  value: number;
  dueDate: string; // ISO Date
  status: 'OPEN' | 'PAID' | 'LATE';
  barCode: string;
  fileName?: string; // Nome do arquivo enviado
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  condominiumId?: string; // Null se for Super Admin (ou condomínio ativo atual)
  managedCondoIds?: string[]; // IDs dos condomínios que o síndico gerencia (para suporte multi-condo)
  unitId?: string;        // Null se for Admin ou Síndico (opcional para síndico morador)
  block?: string;         // Adicionado para identificação no chat
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
  condoJoinDate?: string; // Data de entrada no condomínio atual para validação de troca
  financialStatus?: FinancialStatus; // Novo campo financeiro
  hasSeenTour?: boolean; // Controle se o usuário já realizou o tour inicial
  marketplaceNotifications?: boolean; // Notificações de Classificados
}

export interface DashboardStats {
  totalCondos: number;
  totalUsers: number;
  pendingRequests: number;
  revenue: number;
}

export type EventType = 'BOOKING' | 'MEETING' | 'MAINTENANCE' | 'OTHER';

export interface CalendarEvent {
  id: string;
  condominiumId: string;
  userId: string;
  userName: string;
  title: string;
  description?: string;
  date: string; // ISO Date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: EventType;
  resource?: string; // Se for BOOKING, qual recurso (ex: Churrasqueira)
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}

export interface Notification {
  id: string;
  condominiumId: string;
  userId?: string; // Added for individual notifications
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'ALERT' | 'INFO' | 'SUCCESS';
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'CLOSED';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  condoName: string;
  unitInfo: string; // "Bl A - 102"
  subject: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdate: string;
  messages: ChatMessage[];
  tags: string[]; // ex: #financeiro, #portaria
}

export interface CondoDocument {
  id: string;
  condominiumId: string;
  title: string;
  category: 'MINUTES' | 'FINANCIAL' | 'RULES' | 'OTHER'; // Atas, Financeiro, Regimento, Outros
  url: string; // Mock url
  date: string;
  size: string;
}

export interface Visitor {
  id: string;
  condominiumId: string; // Added for isolation
  name: string;
  cpf: string;
  type: 'VISITOR' | 'DELIVERY' | 'SERVICE';
  hostUnit: string; // "Bl A - 102"
  entryDate: string; // ISO Date of entry/scheduled alignment
  status: 'SCHEDULED' | 'INSIDE' | 'EXITED';
  qrCodeUrl?: string; // Mock URL for QR Code
}

export interface AccessLog {
  id: string;
  visitorId: string;
  timestamp: string;
  type: 'ENTRY' | 'EXIT';
  gate: string; // "Portaria Principal", "Garagem"
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  condominiumId: string;
  title: string;
  description: string;
  options: PollOption[];
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
  createdBy: string; // User ID
  anonymous: boolean;
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  optionId: string;
  timestamp: string;
}

export interface MarketplaceItem {
  id: string;
  condominiumId: string;
  userId: string;
  userName: string; // "Ana - 102"
  userContact?: string; // (11) 99999-9999 - Optional
  title: string;
  description: string;
  price: number;
  category: 'FURNITURE' | 'ELECTRONICS' | 'SERVICES' | 'DONATION' | 'OTHER';
  images: string[];
  status: 'ACTIVE' | 'SOLD' | 'REMOVED';
  createdAt: string;
}
