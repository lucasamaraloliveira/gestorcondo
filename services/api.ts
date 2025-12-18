import { MOCK_USERS, MOCK_CONDOS, DEFAULT_PERMISSIONS, MOCK_EVENTS, MOCK_NOTIFICATIONS, MOCK_BILLS, MOCK_TICKETS, MOCK_DOCUMENTS } from '../constants';
import { User, Condominium, UserRole, RolePermissions, CalendarEvent, Notification, Bill, SupportTicket, TicketStatus, CondoDocument, PaginatedResponse, Visitor, MarketplaceItem, Poll } from '../types';

// Simulando delay de rede para parecer uma aplicação real conectada ao banco
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for LocalStorage persistence
const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(`gc_${key}`, JSON.stringify(data));
};

const getFromStorage = (key: string, defaultValue: any) => {
  const stored = localStorage.getItem(`gc_${key}`);
  return stored ? JSON.parse(stored) : defaultValue;
};

// Simple in-memory storage (initialized from LocalStorage)
let currentPermissions = getFromStorage('permissions', { ...DEFAULT_PERMISSIONS });
let currentEvents = getFromStorage('events', [...MOCK_EVENTS]);
let currentNotifications = getFromStorage('notifications', [...MOCK_NOTIFICATIONS]);
let currentCondos: Condominium[] = getFromStorage('condos', MOCK_CONDOS.map(c => ({
  ...c,
  features: c.features || { isChatEnabled: true }
})));
let currentUsers: User[] = getFromStorage('users', MOCK_USERS.map(u => ({ ...u, hasSeenTour: true })));
let currentBills = getFromStorage('bills', [...MOCK_BILLS]);
let currentTickets = getFromStorage('tickets', [...MOCK_TICKETS]);
let currentDocuments = getFromStorage('documents', [...MOCK_DOCUMENTS]);
let currentVisitors: Visitor[] = getFromStorage('visitors', [
  { id: '1', condominiumId: '1', name: 'Roberto Silva', cpf: '123.456.789-00', type: 'VISITOR', hostUnit: 'Bl A - 302', entryDate: '2023-12-20T14:00:00', status: 'SCHEDULED', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VISIT-1' },
  { id: '2', condominiumId: '1', name: 'Tech Internet', cpf: '987.654.321-99', type: 'SERVICE', hostUnit: 'Bl B - 101', entryDate: '2023-12-18T09:30:00', status: 'INSIDE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SERVICE-2' },
  { id: '3', condominiumId: '1', name: 'iFood Entregador', cpf: '000.000.000-00', type: 'DELIVERY', hostUnit: 'Bl C - 505', entryDate: '2023-12-18T20:15:00', status: 'EXITED' },
]);
let currentMarketplaceItems: MarketplaceItem[] = getFromStorage('marketplace', [
  {
    id: '1',
    condominiumId: '1',
    userId: 'u3',
    userName: 'Ana - 101 A',
    userContact: '(11) 98765-4321',
    title: 'Sofá 3 Lugares Retrátil',
    description: 'Sofá cinza em ótimo estado, usado por 1 ano. Motivo: mudança.',
    price: 1200,
    category: 'FURNITURE',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    condominiumId: '1',
    userId: 'u4',
    userName: 'Marcos - 205 B',
    userContact: '(11) 99999-8888',
    title: 'PlayStation 5',
    description: 'PS5 com 1 controle e 2 jogos. Pouco uso.',
    price: 3500,
    category: 'ELECTRONICS',
    images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=400'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
]);
let currentPolls: Poll[] = getFromStorage('polls', [
  {
    id: '1',
    condominiumId: '1',
    title: 'Reforma do Salão de Festas',
    description: 'Aprovação do orçamento para pintura e troca de piso do salão de festas principal.',
    options: [
      { id: 'opt1', text: 'Aprovar Orçamento A (R$ 15.000)', votes: 12 },
      { id: 'opt2', text: 'Aprovar Orçamento B (R$ 12.000)', votes: 8 },
      { id: 'opt3', text: 'Rejeitar ambos', votes: 3 }
    ],
    startDate: '2023-12-01T00:00:00',
    endDate: '2023-12-30T23:59:59',
    status: 'OPEN',
    createdBy: 'u1',
    anonymous: false
  }
]);

// Helper for pagination
const paginate = <T>(items: T[], page: number = 1, limit: number = 10): PaginatedResponse<T> => {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const data = items.slice(offset, offset + limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages
  };
};

export const api = {
  getUsers: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> => {
    await delay(600);
    return paginate([...currentUsers], page, limit);
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt' | 'avatarUrl'>): Promise<User> => {
    await delay(800);
    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      condoJoinDate: new Date().toISOString(), // Seta a data de entrada no condomínio
      avatarUrl: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
      hasSeenTour: false // Novo usuário deve ver o tour
    };
    currentUsers = [newUser, ...currentUsers];
    return newUser;
  },

  // Novo método para registro público (Self-Service)
  register: async (data: { name: string; email: string; password: string; condominiumId: string; block: string; unitId: string }): Promise<User> => {
    await delay(1500);

    // Verifica se já existe email
    if (currentUsers.some(u => u.email === data.email)) {
      throw new Error("Este email já está cadastrado.");
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      role: UserRole.RESIDENT, // Cadastro público sempre entra como morador
      active: true, // Em um app real, poderia ser false aguardando aprovação
      condominiumId: data.condominiumId,
      block: data.block,
      unitId: data.unitId,
      createdAt: new Date().toISOString(),
      condoJoinDate: new Date().toISOString(),
      avatarUrl: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
      financialStatus: 'PAID', // Default
      hasSeenTour: false // Obrigatório ver o tour
    };

    // Nota: Em um backend real, a senha seria hashada e salva no banco.
    // Aqui apenas simulamos a criação do usuário.

    currentUsers = [newUser, ...currentUsers];
    return newUser;
  },

  completeTour: async (userId: string): Promise<void> => {
    await delay(300);
    const index = currentUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      currentUsers[index].hasSeenTour = true;
    }
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    await delay(600);
    const index = currentUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");

    currentUsers[index] = { ...currentUsers[index], ...userData };
    return currentUsers[index];
  },

  deleteUser: async (id: string): Promise<void> => {
    await delay(500);
    currentUsers = currentUsers.filter(u => u.id !== id);
  },

  // Mock restore for Undo functionality
  restoreUser: async (user: User): Promise<void> => {
    await delay(500);
    currentUsers = [user, ...currentUsers];
  },

  updateUserCondo: async (userId: string, newCondoId: string): Promise<void> => {
    await delay(1000);
    console.log(`Usuário ${userId} trocou para o condomínio ${newCondoId}`);
    // Update local state
    const index = currentUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      currentUsers[index].condominiumId = newCondoId;
    }
  },

  changePassword: async (userId: string, oldPass: string, newPass: string): Promise<void> => {
    await delay(1000);
    // In a real app, validation would happen here
    if (oldPass === newPass) {
      throw new Error("A nova senha deve ser diferente da atual.");
    }
    console.log(`Senha alterada para o usuário ${userId}`);
  },

  sendSupportMessage: async (userId: string, message: string, type: string): Promise<void> => {
    await delay(1000);
    console.log(`Mensagem de suporte enviada por ${userId} [${type}]: ${message}`);
  },

  // Condos API
  getCondos: async (): Promise<Condominium[]> => {
    await delay(500);
    return [...currentCondos];
  },

  createCondo: async (condo: Omit<Condominium, 'id'>): Promise<Condominium> => {
    await delay(700);
    const newCondo: Condominium = {
      ...condo,
      id: `c${currentCondos.length + 1 + Math.floor(Math.random() * 100)}`,
      features: condo.features || { isChatEnabled: true }
    };
    currentCondos = [...currentCondos, newCondo];
    return newCondo;
  },

  updateCondo: async (id: string, condoData: Partial<Condominium>): Promise<Condominium> => {
    await delay(600);
    const index = currentCondos.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Condo not found");

    currentCondos[index] = { ...currentCondos[index], ...condoData };
    return currentCondos[index];
  },

  deleteCondo: async (id: string): Promise<void> => {
    await delay(500);
    currentCondos = currentCondos.filter(c => c.id !== id);
  },

  restoreCondo: async (condo: Condominium): Promise<void> => {
    await delay(500);
    currentCondos = [...currentCondos, condo];
  },

  updateCondoResources: async (condoId: string, resources: string[]): Promise<Condominium> => {
    await delay(600);
    const condoIndex = currentCondos.findIndex(c => c.id === condoId);
    if (condoIndex === -1) throw new Error('Condo not found');

    const updatedCondo = { ...currentCondos[condoIndex], resources };
    currentCondos = [
      ...currentCondos.slice(0, condoIndex),
      updatedCondo,
      ...currentCondos.slice(condoIndex + 1)
    ];
    return updatedCondo;
  },

  // Permissions API
  getPermissions: async (): Promise<RolePermissions> => {
    await delay(300);
    return { ...currentPermissions };
  },

  updatePermissions: async (newPermissions: RolePermissions): Promise<void> => {
    await delay(500);
    currentPermissions = newPermissions;
  },

  // Events API
  getEvents: async (condominiumId: string): Promise<CalendarEvent[]> => {
    await delay(400);
    return currentEvents.filter(e => e.condominiumId === condominiumId);
  },

  createEvent: async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    await delay(600);

    // Validação de Conflito de Horário para Recursos (BOOKING)
    if (event.type === 'BOOKING' && event.resource) {
      const hasConflict = currentEvents.some(e =>
        e.condominiumId === event.condominiumId &&
        e.type === 'BOOKING' &&
        e.resource === event.resource &&
        e.date === event.date &&
        e.status !== 'CANCELLED' &&
        // Lógica de sobreposição de horário: (StartA < EndB) e (EndA > StartB)
        (event.startTime < e.endTime && event.endTime > e.startTime)
      );

      if (hasConflict) {
        throw new Error(`O recurso "${event.resource}" já está reservado neste horário.`);
      }
    }

    const newEvent: CalendarEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9)
    };
    currentEvents = [newEvent, ...currentEvents];
    return newEvent;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await delay(500);
    currentEvents = currentEvents.filter(e => e.id !== id);
  },

  // Notifications API
  getNotifications: async (condoIds: string[], userId?: string): Promise<Notification[]> => {
    await delay(300);
    // Retorna notificações de todos os condomínios que o usuário tem acesso
    // E também notificações específicas do usuário (userId)
    return currentNotifications.filter(n => {
      const condoMatch = condoIds.includes(n.condominiumId);
      if (n.userId) {
        return condoMatch && n.userId === userId;
      }
      return condoMatch;
    });
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'date' | 'read'>): Promise<Notification> => {
    await delay(300);
    const newNotif: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      read: false
    };
    currentNotifications = [newNotif, ...currentNotifications];
    return newNotif;
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    currentNotifications = currentNotifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
  },

  // Financial API
  getAllBills: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Bill>> => {
    await delay(500);
    return paginate([...currentBills], page, limit);
  },

  getUserBills: async (userId: string): Promise<Bill[]> => {
    await delay(500);
    return currentBills.filter(b => b.userId === userId && b.status !== 'PAID');
  },

  createBill: async (billData: Omit<Bill, 'id' | 'status'>): Promise<Bill> => {
    await delay(1000);
    const newBill: Bill = {
      ...billData,
      id: `b${Date.now()}`,
      status: 'OPEN'
    };
    currentBills = [newBill, ...currentBills];

    // Update User Financial Status to PENDING/OVERDUE if needed (simplified logic)
    // In a real app, this would check if they have overdue bills
    return newBill;
  },

  // Documents API
  getDocuments: async (condominiumId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<CondoDocument>> => {
    await delay(400);
    const filtered = currentDocuments.filter(d => d.condominiumId === condominiumId);
    return paginate(filtered, page, limit);
  },

  createDocument: async (docData: Omit<CondoDocument, 'id'>): Promise<CondoDocument> => {
    await delay(800);
    const newDoc: CondoDocument = {
      ...docData,
      id: `d${Date.now()}`
    };
    currentDocuments = [newDoc, ...currentDocuments];
    return newDoc;
  },

  updateDocument: async (id: string, docData: Partial<CondoDocument>): Promise<CondoDocument> => {
    await delay(600);
    const index = currentDocuments.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Document not found");

    currentDocuments[index] = { ...currentDocuments[index], ...docData };
    return currentDocuments[index];
  },

  deleteDocument: async (id: string): Promise<void> => {
    await delay(500);
    currentDocuments = currentDocuments.filter(d => d.id !== id);
  },

  // Support / Tickets API
  getSupportTickets: async (): Promise<SupportTicket[]> => {
    await delay(400);
    return [...currentTickets];
  },

  updateTicketStatus: async (ticketId: string, status: TicketStatus): Promise<void> => {
    await delay(300);
    currentTickets = currentTickets.map(t =>
      t.id === ticketId ? { ...t, status } : t
    );
  },

  sendTicketMessage: async (ticketId: string, text: string, sender: 'agent' | 'user'): Promise<void> => {
    await delay(200);
    const ticketIndex = currentTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
      const newMessage = {
        id: Date.now().toString(),
        sender,
        text,
        timestamp: new Date().toISOString()
      };
      // Create a new object to ensure immutability
      currentTickets[ticketIndex] = {
        ...currentTickets[ticketIndex],
        lastUpdate: new Date().toISOString(),
        messages: [...currentTickets[ticketIndex].messages, newMessage]
      };
    }
  },

  checkSupportOnline: async (): Promise<boolean> => {
    await delay(200);
    // Simula que se existe um usuário com role SUPPORT na lista, há alguém online.
    return currentUsers.some(u => u.role === UserRole.SUPPORT && u.active);
  },

  // Simula login retornando um Super Admin por padrão para demonstração
  login: async (email: string): Promise<User> => {
    await delay(1000);

    // Suporte Login
    if (email.includes('sofia') || email.includes('suporte')) {
      return currentUsers.find(u => u.role === UserRole.SUPPORT) || MOCK_USERS[5];
    }
    // Síndico Login
    if (email.includes('sindico')) {
      return currentUsers.find(u => u.role === UserRole.SYNDIC) || MOCK_USERS[1];
    }
    // Morador Login
    if (email.includes('ana')) {
      return currentUsers.find(u => u.role === UserRole.RESIDENT) || MOCK_USERS[2];
    }
    // Return from currentUsers to ensure updates are reflected
    const foundUser = currentUsers.find(u => u.email === email);
    return foundUser || currentUsers[0];
  },

  // --- NEW PERSISTENCE METHODS ---

  // Access Control (Visitors)
  getVisitors: async (condominiumId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Visitor>> => {
    await delay(300);
    const filtered = currentVisitors.filter(v => v.condominiumId === condominiumId);
    return paginate(filtered, page, limit);
  },

  createVisitor: async (visitor: Omit<Visitor, 'id'>): Promise<Visitor> => {
    await delay(500);
    const newVisitor: Visitor = {
      ...visitor,
      id: `v${Date.now()}`
    };
    currentVisitors = [newVisitor, ...currentVisitors];
    return newVisitor;
  },

  updateVisitor: async (id: string, data: Partial<Visitor>): Promise<Visitor> => {
    await delay(400);
    const index = currentVisitors.findIndex(v => v.id === id);
    if (index === -1) throw new Error("Visitor not found");
    currentVisitors[index] = { ...currentVisitors[index], ...data };
    return currentVisitors[index];
  },

  deleteVisitor: async (id: string): Promise<void> => {
    await delay(400);
    currentVisitors = currentVisitors.filter(v => v.id !== id);
  },

  // Marketplace
  getMarketplaceItems: async (condominiumId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<MarketplaceItem>> => {
    await delay(400);
    const filtered = currentMarketplaceItems.filter(i => i.condominiumId === condominiumId);
    return paginate(filtered, page, limit);
  },

  createMarketplaceItem: async (item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'status'>): Promise<MarketplaceItem> => {
    await delay(800);
    const newItem: MarketplaceItem = {
      ...item,
      id: `m${Date.now()}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    currentMarketplaceItems = [newItem, ...currentMarketplaceItems];
    return newItem;
  },

  deleteMarketplaceItem: async (id: string): Promise<void> => {
    await delay(400);
    currentMarketplaceItems = currentMarketplaceItems.filter(i => i.id !== id);
  },

  // Virtual Assembly (Polls)
  getPolls: async (condominiumId: string): Promise<Poll[]> => {
    await delay(400);
    // In a real app we would filter by condoId
    return [...currentPolls];
  },

  votePoll: async (pollId: string, optionId: string, userId: string): Promise<void> => {
    await delay(500);
    const pollIndex = currentPolls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) throw new Error("Poll not found");

    const poll = currentPolls[pollIndex];
    // Check if user already voted (mock logic, ideally check a Votes table)
    // For now simplistic update:
    const optionIndex = poll.options.findIndex(o => o.id === optionId);
    if (optionIndex === -1) throw new Error("Option not found");

    // Increment vote count (in-memory mutation)
    const newOptions = [...poll.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], votes: newOptions[optionIndex].votes + 1 };

    currentPolls[pollIndex] = { ...poll, options: newOptions };
  },

  payBill: async (billId: string, userId: string): Promise<void> => {
    await delay(1500);
    // Update bill
    const billIdx = currentBills.findIndex(b => b.id === billId);
    if (billIdx !== -1) {
      currentBills[billIdx] = { ...currentBills[billIdx], status: 'PAID' };
    }

    // Check if user still has overdue bills (LATE)
    const userOverdue = currentBills.some(b => b.userId === userId && b.status === 'LATE' && b.id !== billId);

    // Update user status if no more overdue bills
    if (!userOverdue) {
      const userIdx = currentUsers.findIndex(u => u.id === userId);
      if (userIdx !== -1) {
        currentUsers[userIdx].financialStatus = 'PAID';
      }
    }
  }
};