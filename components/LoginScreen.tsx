import React, { useState, useEffect, useContext } from 'react';
import * as Icons from 'lucide-react';
import { Mail, Lock, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { BrandContext } from '../BrandContext';
import { Condominium, User } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const LoginScreen = ({ onRegister }: { onRegister: (user: User) => void }) => {
    const { config } = useContext(BrandContext);
    const { login } = useAuthStore();
    const LogoIcon = (Icons as any)[config.logo] || Icons.Building2;

    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('admin@gestor.com');
    const [loading, setLoading] = useState(false);
    // Registration State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regCondo, setRegCondo] = useState('');
    const [regBlock, setRegBlock] = useState('');
    const [regUnit, setRegUnit] = useState('');
    const [availableCondos, setAvailableCondos] = useState<Condominium[]>([]);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (isRegistering) {
            setLoading(true);
            api.getCondos().then(data => { setAvailableCondos(data); setLoading(false); });
        }
    }, [isRegistering]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email);
        } catch (error) {
            console.error('Login failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newUser = await api.register({
                name: regName, email: regEmail, password: regPassword, condominiumId: regCondo, block: regBlock, unitId: regUnit
            });
            setLoading(false);
            setRegistrationStatus('success');
            onRegister(newUser);
        } catch (error) {
            setLoading(false);
            setRegistrationStatus('error');
        }
    };

    const handleSuccessRedirect = () => {
        setEmail(regEmail);
        setRegName(''); setRegEmail(''); setRegPassword(''); setRegCondo(''); setRegBlock(''); setRegUnit('');
        setRegistrationStatus('idle'); setIsRegistering(false);
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-900 flex flex-col relative overflow-x-hidden transition-all">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl"></div>
            </div>

            <div className="flex-grow flex items-center justify-center p-4 md:p-6 w-full z-10">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* Left Side - Login Card */}
                    <div className="w-full max-w-[400px] mx-auto">
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-6 md:p-8 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-left duration-500">

                            {/* Header */}
                            <div className="mb-8 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                                        <LogoIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">{config.name}</span>
                                </div>

                                {!isRegistering ? (
                                    <>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo(a)</h1>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Acesse sua conta para continuar.</p>
                                    </>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Criar Conta</h1>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Comece a gerenciar seu condomínio.</p>
                                    </>
                                )}
                            </div>

                            {/* Success/Error Modal Overlay for Registration */}
                            {registrationStatus !== 'idle' && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-[2rem] p-8 animate-in fade-in">
                                    <div className="text-center w-full">
                                        {registrationStatus === 'success' ? (
                                            <>
                                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sucesso!</h3>
                                                <button onClick={handleSuccessRedirect} className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold text-sm">Ir para Login</button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro</h3>
                                                <button onClick={() => setRegistrationStatus('idle')} className="w-full mt-4 bg-slate-200 text-slate-800 py-3 rounded-xl font-bold text-sm">Tentar Novamente</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!isRegistering ? (
                                <form onSubmit={handleLoginSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">E-mail</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Senha</label>
                                            <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Esqueci a senha</a>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                                                placeholder="••••••"
                                                defaultValue="123456"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 hover:translate-y-[-1px] active:translate-y-[1px]"
                                    >
                                        {loading ? 'Entrando...' : 'Entrar'}
                                        {!loading && <ArrowLeft className="w-4 h-4 rotate-180" />}
                                    </button>

                                    <div className="pt-4 text-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Não tem conta?{' '}
                                            <button type="button" onClick={() => setIsRegistering(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                                Crie agora
                                            </button>
                                        </p>
                                    </div>

                                    {/* Demo Users Quick Access */}
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-center text-slate-400 mb-2 uppercase tracking-wider font-semibold">Acesso Demo</p>
                                        <div className="flex gap-2 justify-center flex-wrap">
                                            <button onClick={() => setEmail('ana@email.com')} type="button" className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">Morador</button>
                                            <button onClick={() => setEmail('roberto@jardins.com')} type="button" className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">Síndico</button>
                                            <button onClick={() => setEmail('admin@gestor.com')} type="button" className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">Admin</button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                // Registration Form
                                <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-in slide-in-from-right duration-300">
                                    <button type="button" onClick={() => setIsRegistering(false)} className="flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors">
                                        <ArrowLeft className="w-3 h-3 mr-1" />
                                        Voltar
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Nome</label>
                                            <input required type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regName} onChange={e => setRegName(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Email</label>
                                            <input required type="email" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Senha</label>
                                        <input required type="password" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Condomínio</label>
                                        <select required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={regCondo} onChange={e => setRegCondo(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {availableCondos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {regCondo && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Bloco</label>
                                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" placeholder="Ex: A" value={regBlock} onChange={e => setRegBlock(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Unidade</label>
                                                <input required type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" placeholder="Ex: 101" value={regUnit} onChange={e => setRegUnit(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg text-sm">
                                        {loading ? 'Cadastrando...' : 'Confirmar Cadastro'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Features / Branding */}
                    <div className="hidden lg:flex flex-col justify-center animate-in slide-in-from-right duration-700 relative pl-8">
                        <div className="relative z-10">
                            <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                                Simplifique a <br />
                                <span className="text-blue-600">Gestão do seu Condomínio</span>
                            </h2>
                            <p className="text-base text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                                Uma plataforma completa para síndicos e moradores.
                                Transparência financeira, reservas, assembleias online e muito mais.
                            </p>

                            <div className="space-y-4">
                                {config.features.map((feature, index) => {
                                    const FeatureIcon = (Icons as any)[feature.icon] || Icons.CheckCircle2;
                                    return (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                                                <FeatureIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-base">{feature.title}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full text-center py-6 mt-auto z-10">
                <p className="text-[10px] text-slate-400 font-medium opacity-70">© 2024 {config.name}  •  Termos de Uso  •  Privacidade</p>
            </div>
        </div>
    );
};

export default LoginScreen;
