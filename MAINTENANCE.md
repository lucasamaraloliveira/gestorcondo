# 📘 Manual de Manutenção - GestorCondo

> **Versão:** 1.0.0  
> **Última Atualização:** 17/12/2024  
> **Desenvolvedor:** Lucas

---

## 📑 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura e Estrutura](#arquitetura-e-estrutura)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
6. [Adicionando Novos Recursos](#adicionando-novos-recursos)
7. [Padrões de Código](#padrões-de-código)
8. [Sistema de Permissões](#sistema-de-permissões)
9. [White-Label Branding](#white-label-branding)
10. [Persistência de Dados](#persistência-de-dados)
11. [Troubleshooting](#troubleshooting)
12. [Checklist de Deploy](#checklist-de-deploy)

---

## 🎯 Visão Geral do Sistema

**GestorCondo** é uma plataforma completa de gestão condominial que oferece:

- 📊 Dashboard com indicadores e métricas
- 🔐 Controle de acesso e portaria
- 📅 Agendamento de áreas comuns
- 💰 Gestão financeira e boletos
- 📄 Mural de documentos
- 🗳️ Assembleia virtual
- 🛒 Classificados entre moradores
- 👥 Gestão de usuários e condomínios
- 🎨 Personalização de marca (White-Label)

---

## 🏗️ Arquitetura e Estrutura

### Arquitetura Geral

```
┌─────────────────────────────────────────┐
│           React Frontend (SPA)          │
│  ┌──────────────────────────────────┐   │
│  │      App.tsx (Main Router)       │   │
│  └──────────────────────────────────┘   │
│              ↓                           │
│  ┌──────────────────────────────────┐   │
│  │   BrandProvider (Context API)    │   │
│  └──────────────────────────────────┘   │
│              ↓                           │
│  ┌──────────────────────────────────┐   │
│  │    Components & Modules          │   │
│  │  - DashboardModule               │   │
│  │  - AccessControlView             │   │
│  │  - AgendaModule                  │   │
│  │  - FinancialModule               │   │
│  │  - MarketplaceView               │   │
│  │  - AssemblyView                  │   │
│  │  - DocumentsModule               │   │
│  │  - BrandSettings                 │   │
│  └──────────────────────────────────┘   │
│              ↓                           │
│  ┌──────────────────────────────────┐   │
│  │    Services (API Mock)           │   │
│  │  - services/api.ts               │   │
│  └──────────────────────────────────┘   │
│              ↓                           │
│  ┌──────────────────────────────────┐   │
│  │    localStorage (Persistence)    │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Usuário interage** com componente
2. **Componente chama** serviço da API
3. **API processa** e retorna dados (mock ou real)
4. **Estado local atualiza** via `useState`
5. **UI re-renderiza** com novos dados
6. **Persistência** salva em `localStorage` (se aplicável)

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 19.2.3 | Framework UI |
| **TypeScript** | 5.8.2 | Tipagem estática |
| **Vite** | 6.2.0 | Build tool e dev server |
| **Lucide React** | 0.561.0 | Biblioteca de ícones |
| **Vite PWA Plugin** | 1.2.0 | Progressive Web App |

### Dependências

```json
{
  "dependencies": {
    "lucide-react": "^0.561.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "vite-plugin-pwa": "^1.2.0"
  }
}
```

---

## 📁 Estrutura de Arquivos

```
gestorcondo/
├── 📄 App.tsx                    # Componente principal e roteamento
├── 📄 index.tsx                  # Entry point com BrandProvider
├── 📄 index.html                 # HTML base
├── 📄 index.css                  # Estilos globais e variáveis CSS
│
├── 📄 types.ts                   # Definições de tipos TypeScript
├── 📄 constants.ts               # Constantes (módulos, permissões, tour)
│
├── 📄 brandConfig.ts             # Configuração de marca (White-Label)
├── 📄 BrandContext.tsx           # Context API para branding
│
├── 📁 components/                # Componentes React
│   ├── AccessControlView.tsx    # Controle de portaria
│   ├── AgendaModule.tsx         # Agendamentos e reservas
│   ├── AssemblyView.tsx         # Assembleia virtual
│   ├── BillModal.tsx            # Modal de boletos
│   ├── BrandSettings.tsx        # ⭐ Configurações de marca
│   ├── ChatWidget.tsx           # Widget de chat
│   ├── CondoModal.tsx           # Modal de condomínios
│   ├── CondoModule.tsx          # Gestão de condomínios
│   ├── ConfirmModal.tsx         # Modal de confirmação
│   ├── DashboardModule.tsx      # Dashboard principal
│   ├── DocumentModal.tsx        # Modal de documentos
│   ├── DocumentsModule.tsx      # Mural de documentos
│   ├── FinancialModule.tsx      # Gestão financeira
│   ├── GuidedTour.tsx           # Tour guiado
│   ├── MarketplaceView.tsx      # Classificados
│   ├── ResourcesModule.tsx      # Áreas comuns
│   ├── Sidebar.tsx              # Menu lateral
│   ├── SupportChatModal.tsx     # Chat de suporte
│   ├── SupportModule.tsx        # Mesa de atendimento
│   ├── Toast.tsx                # Notificações toast
│   └── UserModal.tsx            # Modal de usuários
│
├── 📁 services/                 # Serviços e APIs
│   └── api.ts                   # Mock API (simula backend)
│
├── 📁 public/                   # Arquivos estáticos
│   └── vite.svg                 # Logo Vite
│
├── 📄 package.json              # Dependências do projeto
├── 📄 tsconfig.json             # Configuração TypeScript
├── 📄 vite.config.ts            # Configuração Vite
└── 📄 README.md                 # Documentação básica
```

---

## 🚀 Guia de Desenvolvimento

### Comandos Básicos

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Ambiente de Desenvolvimento

1. **Porta padrão:** `http://localhost:3000`
2. **Hot Reload:** Ativado automaticamente
3. **TypeScript:** Verificação em tempo real
4. **Console:** Abra DevTools (F12) para debug

### Usuários de Teste

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| **SUPER_ADMIN** | admin@gestor.com | admin123 | Acesso total |
| **SYNDIC** | sindico@condo1.com | sindico123 | Gestão do condomínio |
| **RESIDENT** | morador@condo1.com | morador123 | Visualização limitada |
| **SUPPORT** | suporte@gestor.com | suporte123 | Mesa de atendimento |

---

## ➕ Adicionando Novos Recursos

### Checklist Completo

#### 1️⃣ Planejamento

- [ ] Definir objetivo do recurso
- [ ] Identificar perfis de usuário que terão acesso
- [ ] Desenhar fluxo de dados
- [ ] Listar componentes necessários

#### 2️⃣ Atualizar Types (`types.ts`)

```typescript
// Exemplo: Adicionar novo tipo
export interface NovoRecurso {
    id: string;
    condominiumId: string;
    titulo: string;
    descricao: string;
    createdAt: string;
    status: 'ativo' | 'inativo';
}
```

#### 3️⃣ Adicionar ao APP_MODULES (`constants.ts`)

```typescript
export const APP_MODULES: AppModule[] = [
  // ... módulos existentes
  { 
    id: 'novo-recurso', 
    label: 'Novo Recurso', 
    shortLabel: 'Novo', 
    iconName: 'Star' // Ícone do Lucide React
  },
];
```

#### 4️⃣ Configurar Permissões (`constants.ts`)

```typescript
export const DEFAULT_PERMISSIONS: RolePermissions = {
  [UserRole.SUPER_ADMIN]: [
    // ... permissões existentes
    'novo-recurso'
  ],
  [UserRole.SYNDIC]: [
    // ... permissões existentes
    'novo-recurso'
  ],
  [UserRole.RESIDENT]: [
    // ... permissões existentes
    // 'novo-recurso' // Comentar se não tiver acesso
  ],
  [UserRole.SUPPORT]: [
    // ... permissões existentes
  ],
};
```

#### 5️⃣ Criar Serviço na API (`services/api.ts`)

```typescript
// Adicionar storage
let currentNovoRecurso: NovoRecurso[] = [
  {
    id: '1',
    condominiumId: 'condo-1',
    titulo: 'Exemplo',
    descricao: 'Descrição exemplo',
    createdAt: new Date().toISOString(),
    status: 'ativo'
  }
];

// Adicionar métodos
export const api = {
  // ... métodos existentes
  
  getNovoRecurso: async (condominiumId: string): Promise<NovoRecurso[]> => {
    await delay(300);
    return currentNovoRecurso.filter(item => item.condominiumId === condominiumId);
  },

  createNovoRecurso: async (data: Omit<NovoRecurso, 'id' | 'createdAt'>): Promise<NovoRecurso> => {
    await delay(400);
    const novo: NovoRecurso = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    currentNovoRecurso.push(novo);
    return novo;
  },

  updateNovoRecurso: async (id: string, data: Partial<NovoRecurso>): Promise<NovoRecurso> => {
    await delay(400);
    const index = currentNovoRecurso.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item não encontrado');
    currentNovoRecurso[index] = { ...currentNovoRecurso[index], ...data };
    return currentNovoRecurso[index];
  },

  deleteNovoRecurso: async (id: string): Promise<void> => {
    await delay(300);
    currentNovoRecurso = currentNovoRecurso.filter(item => item.id !== id);
  }
};
```

#### 6️⃣ Criar Componente (`components/NovoRecursoModule.tsx`)

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { NovoRecurso, User, Condominium, UserRole } from '../types';
import { api } from '../services/api';
import ConfirmModal from './ConfirmModal';

interface NovoRecursoModuleProps {
    currentUser: User;
    currentCondo: Condominium | null;
    allCondos: Condominium[];
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const NovoRecursoModule: React.FC<NovoRecursoModuleProps> = ({
    currentUser,
    currentCondo,
    allCondos,
    addToast
}) => {
    const [items, setItems] = useState<NovoRecurso[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCondoId, setSelectedCondoId] = useState<string | null>(currentCondo?.id || null);

    // Condomínios acessíveis
    const accessibleCondos = useMemo(() => {
        if (currentUser.role === UserRole.SUPER_ADMIN) return allCondos;
        if (currentUser.role === UserRole.SYNDIC && currentUser.managedCondoIds) {
            return allCondos.filter(c => currentUser.managedCondoIds?.includes(c.id));
        }
        return currentCondo ? [currentCondo] : [];
    }, [currentUser, allCondos, currentCondo]);

    // Condomínio ativo
    const activeCondo = useMemo(() => {
        return accessibleCondos.find(c => c.id === selectedCondoId) || null;
    }, [selectedCondoId, accessibleCondos]);

    // Carregar dados
    useEffect(() => {
        const loadData = async () => {
            if (!activeCondo) return;
            setLoading(true);
            try {
                const data = await api.getNovoRecurso(activeCondo.id);
                setItems(data);
            } catch (error) {
                addToast('Erro ao carregar dados', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeCondo]);

    // Filtrar itens
    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.titulo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Novo Recurso
                </h2>
                
                {/* Seletor de Condomínio */}
                {accessibleCondos.length > 1 && (
                    <select
                        value={selectedCondoId || ''}
                        onChange={(e) => setSelectedCondoId(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                    >
                        {accessibleCondos.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Barra de Busca */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Adicionar
                </button>
            </div>

            {/* Lista de Itens */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Carregando...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Nenhum item encontrado</div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredItems.map(item => (
                            <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{item.titulo}</h3>
                                        <p className="text-sm text-slate-500">{item.descricao}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
```

#### 7️⃣ Importar e Renderizar no App.tsx

```typescript
// 1. Adicionar import
import { NovoRecursoModule } from './components/NovoRecursoModule';

// 2. Adicionar renderização condicional (dentro do return do App)
{activePage === 'novo-recurso' && (
    <NovoRecursoModule 
        currentUser={currentUser} 
        currentCondo={currentCondoData}
        allCondos={condos}
        addToast={addToast}
    />
)}
```

#### 8️⃣ Testar

- [ ] Verificar se o módulo aparece no menu lateral
- [ ] Testar permissões (SUPER_ADMIN, SYNDIC, RESIDENT)
- [ ] Testar seletor de condomínios (se multi-condo)
- [ ] Testar CRUD completo (Create, Read, Update, Delete)
- [ ] Verificar responsividade mobile
- [ ] Testar tema claro/escuro

#### 9️⃣ Documentar

- [ ] Atualizar este documento de manutenção
- [ ] Adicionar comentários no código
- [ ] Documentar API endpoints (se houver backend real)

---

## 📐 Padrões de Código

### Nomenclatura

```typescript
// ✅ BOM
const userName = 'Lucas';
const handleSubmit = () => {};
const isLoading = true;

// ❌ EVITAR
const user_name = 'Lucas';
const submit = () => {};
const loading = true;
```

### Componentes

```typescript
// ✅ Estrutura recomendada
export const MeuComponente: React.FC<Props> = ({ prop1, prop2 }) => {
    // 1. Hooks de estado
    const [state, setState] = useState();
    
    // 2. Hooks de contexto
    const { config } = useContext(BrandContext);
    
    // 3. Hooks de efeito
    useEffect(() => {}, []);
    
    // 4. Funções auxiliares
    const handleClick = () => {};
    
    // 5. Render
    return <div>...</div>;
};
```

### Imports

```typescript
// ✅ Ordem recomendada
import React, { useState, useEffect } from 'react';
import { Icon1, Icon2 } from 'lucide-react';
import { Type1, Type2 } from '../types';
import { api } from '../services/api';
import ComponenteFilho from './ComponenteFilho';
```

### TypeScript

```typescript
// ✅ Sempre tipar props
interface MeuComponenteProps {
    titulo: string;
    opcional?: number;
    callback: (id: string) => void;
}

// ✅ Tipar estados
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);
```

---

## 🔐 Sistema de Permissões

### Perfis de Usuário

| Perfil | Código | Descrição |
|--------|--------|-----------|
| **Super Admin** | `SUPER_ADMIN` | Acesso total ao sistema |
| **Síndico** | `SYNDIC` | Gestão de condomínios específicos |
| **Morador** | `RESIDENT` | Acesso limitado ao próprio condomínio |
| **Suporte** | `SUPPORT` | Mesa de atendimento |

### Verificação de Permissões

```typescript
// No componente
const isPageAllowed = rolePermissions[currentUser.role]?.includes(activePage);

// Renderização condicional
{isPageAllowed ? (
    <MeuComponente />
) : (
    <div>Acesso Negado</div>
)}
```

### Modificar Permissões

Edite `constants.ts`:

```typescript
export const DEFAULT_PERMISSIONS: RolePermissions = {
  [UserRole.SUPER_ADMIN]: ['dashboard', 'users', 'condos', 'settings', ...],
  [UserRole.SYNDIC]: ['dashboard', 'agenda', 'financial', ...],
  [UserRole.RESIDENT]: ['dashboard', 'agenda', 'documents'],
  [UserRole.SUPPORT]: ['support-desk'],
};
```

---

## 🎨 White-Label Branding

### Arquivos Principais

1. **`brandConfig.ts`** - Configuração e tipos
2. **`BrandContext.tsx`** - Context Provider
3. **`components/BrandSettings.tsx`** - Interface admin
4. **`index.css`** - Variáveis CSS

### Elementos Personalizáveis

```typescript
interface BrandConfig {
    name: string;           // Nome da marca
    logo: string;           // Ícone (nome do Lucide)
    primaryHex: string;     // Cor primária (#hexadecimal)
    slogan: string;         // Slogan
    features: Feature[];    // Features da tela de login
}
```

### Como Usar no Código

```typescript
// Em qualquer componente funcional
const { config } = useContext(BrandContext);

// Usar valores
<h1>{config.name}</h1>
<div style={{ color: config.primaryHex }}>...</div>

// Ícone dinâmico
const LogoIcon = Icons[config.logo as keyof typeof Icons] as any;
<LogoIcon className="w-6 h-6" />
```

### Variável CSS

```css
/* index.css */
:root {
    --brand-primary: #2563eb; /* Atualizado dinamicamente */
}

/* Usar em classes */
.bg-primary {
    background-color: var(--brand-primary);
}
```

---

## 💾 Persistência de Dados

### localStorage

```typescript
// Salvar
localStorage.setItem('chave', JSON.stringify(dados));

// Carregar
const dados = JSON.parse(localStorage.getItem('chave') || '{}');

// Remover
localStorage.removeItem('chave');
```

### Dados Persistidos Atualmente

| Chave | Conteúdo | Usado em |
|-------|----------|----------|
| `brandConfig` | Configuração de marca | BrandContext |

### Mock API (services/api.ts)

Simula backend com arrays em memória:

```typescript
let currentUsers: User[] = [...];
let currentCondos: Condominium[] = [...];
let currentVisitors: Visitor[] = [...];
// etc.
```

**⚠️ Importante:** Dados são perdidos ao recarregar a página (exceto `brandConfig`).

---

## 🐛 Troubleshooting

### Problema: Aplicação não carrega (tela branca)

**Solução:**
1. Abra o console (F12)
2. Verifique erros de TypeScript
3. Verifique se hooks estão dentro de componentes funcionais
4. Verifique imports

### Problema: "Invalid hook call"

**Causa:** Hook chamado fora de componente funcional

**Solução:**
```typescript
// ❌ ERRADO
const { config } = useContext(BrandContext);
const MeuComponente = () => { ... };

// ✅ CORRETO
const MeuComponente = () => {
    const { config } = useContext(BrandContext);
    ...
};
```

### Problema: Ícones não aparecem

**Solução:**
```typescript
// Certifique-se de importar todos os ícones
import * as Icons from 'lucide-react';

// Resolva dinamicamente
const IconComponent = Icons[iconName as keyof typeof Icons] as any;
<IconComponent className="w-5 h-5" />
```

### Problema: Permissões não funcionam

**Solução:**
1. Verifique `constants.ts` → `DEFAULT_PERMISSIONS`
2. Verifique `constants.ts` → `APP_MODULES`
3. Certifique-se que o `id` do módulo está correto

### Problema: Dados não persistem

**Causa:** Mock API usa memória volátil

**Solução:**
- Implementar backend real
- Ou usar `localStorage` para persistência local

---

## 🚀 Checklist de Deploy

### Pré-Deploy

- [ ] Todos os testes passando
- [ ] Sem erros no console
- [ ] Sem warnings do TypeScript
- [ ] Build de produção funciona (`npm run build`)
- [ ] Testar em diferentes navegadores
- [ ] Testar responsividade mobile

### Build

```bash
# Gerar build de produção
npm run build

# Testar build localmente
npm run preview
```

### Arquivos Gerados

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── vite.svg
```

### Deploy

1. **Netlify/Vercel:**
   - Conectar repositório Git
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Servidor próprio:**
   - Upload da pasta `dist/`
   - Configurar servidor web (Nginx, Apache)

---

## 📝 Histórico de Recursos

### ✅ Implementados

| Recurso | Data | Desenvolvedor | Notas |
|---------|------|---------------|-------|
| Dashboard | - | Lucas | Módulo inicial |
| Controle de Acesso | - | Lucas | Portaria e visitantes |
| Agenda & Reservas | - | Lucas | Áreas comuns |
| Financeiro | - | Lucas | Boletos e pagamentos |
| Documentos | - | Lucas | Mural de documentos |
| Assembleia Virtual | - | Lucas | Votações online |
| Classificados | - | Lucas | Marketplace entre moradores |
| **White-Label Branding** | 17/12/2024 | Lucas | Personalização de marca |
| **BrandSettings UI** | 17/12/2024 | Lucas | Interface admin para branding |

### 🔜 Planejados

- [ ] Backend real (Node.js + Express)
- [ ] Banco de dados (PostgreSQL/MongoDB)
- [ ] Autenticação JWT
- [ ] Upload de arquivos
- [ ] Notificações push
- [ ] Integração com gateway de pagamento
- [ ] Relatórios em PDF
- [ ] Multi-idioma (i18n)

---

## 📞 Suporte

**Desenvolvedor:** Lucas  
**Email:** [seu-email@exemplo.com]  
**Repositório:** [link-do-repositório]

---

## 📄 Licença

Projeto proprietário - Todos os direitos reservados.

---

**Última atualização:** 17/12/2024  
**Versão do documento:** 1.0.0
