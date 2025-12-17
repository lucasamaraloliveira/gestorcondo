export interface BrandConfig {
    name: string;
    logo: string; // component name from lucide-react
    primaryHex: string;
    slogan: string;
    features: { icon: string; title: string; desc: string }[];
}

const DEFAULT_CONFIG: BrandConfig = {
    name: 'GestorCondo',
    logo: 'Building2',
    primaryHex: '#2563eb',
    slogan: 'Gestão Inteligente para seu Condomínio',
    features: [
        { icon: 'Shield', title: 'Segurança Total', desc: 'Controle de acesso e visitantes em tempo real.' },
        { icon: 'Building2', title: 'Gestão Completa', desc: 'Administre unidades, áreas comuns e reservas.' },
        { icon: 'Users', title: 'Comunidade Conectada', desc: 'Mural, votações e classificados para moradores.' },
    ],
};

export const loadBrandConfig = (): BrandConfig => {
    const saved = localStorage.getItem('brandConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
};

export const saveBrandConfig = (config: BrandConfig) => {
    localStorage.setItem('brandConfig', JSON.stringify(config));
};

export const getDefaultConfig = () => DEFAULT_CONFIG;
