import React, { useState, useContext } from 'react';
import { BrandContext } from '../BrandContext';
import { Palette, Type, Image, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';

const AVAILABLE_ICONS = [
    'Building2', 'Shield', 'Users', 'Home', 'Building', 'Landmark',
    'Castle', 'Church', 'Factory', 'Hotel', 'School', 'Store'
];

export const BrandSettings: React.FC = () => {
    const { config, setConfig } = useContext(BrandContext);
    const [tempConfig, setTempConfig] = useState(config);

    const handleSave = () => {
        setConfig(tempConfig);
        alert('Configurações de marca salvas com sucesso!');
    };

    const handleReset = () => {
        if (window.confirm('Deseja restaurar as configurações padrão?')) {
            const defaultConfig = {
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
            setTempConfig(defaultConfig);
            setConfig(defaultConfig);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Personalização da Marca
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Configure a identidade visual da sua plataforma</p>
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Restaurar Padrão
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Nome da Marca */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Type className="w-4 h-4" />
                            Nome da Marca
                        </label>
                        <input
                            type="text"
                            value={tempConfig.name}
                            onChange={(e) => setTempConfig({ ...tempConfig, name: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: GestorCondo"
                        />
                    </div>

                    {/* Slogan */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Type className="w-4 h-4" />
                            Slogan
                        </label>
                        <input
                            type="text"
                            value={tempConfig.slogan}
                            onChange={(e) => setTempConfig({ ...tempConfig, slogan: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Gestão Inteligente para seu Condomínio"
                        />
                    </div>

                    {/* Cor Primária */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Palette className="w-4 h-4" />
                            Cor Primária
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={tempConfig.primaryHex}
                                onChange={(e) => setTempConfig({ ...tempConfig, primaryHex: e.target.value })}
                                className="w-16 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600"
                            />
                            <input
                                type="text"
                                value={tempConfig.primaryHex}
                                onChange={(e) => setTempConfig({ ...tempConfig, primaryHex: e.target.value })}
                                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="#2563eb"
                            />
                        </div>
                    </div>

                    {/* Logo (Ícone) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Image className="w-4 h-4" />
                            Ícone do Logo
                        </label>
                        <div className="grid grid-cols-6 gap-3">
                            {AVAILABLE_ICONS.map((iconName) => {
                                const IconComponent = Icons[iconName as keyof typeof Icons] as any;
                                const isSelected = tempConfig.logo === iconName;
                                return (
                                    <button
                                        key={iconName}
                                        onClick={() => setTempConfig({ ...tempConfig, logo: iconName })}
                                        className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                        title={iconName}
                                    >
                                        <IconComponent className={`w-6 h-6 mx-auto ${isSelected ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Botão Salvar */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={handleSave}
                            className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
