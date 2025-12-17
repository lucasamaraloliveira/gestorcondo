import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { BrandConfig, loadBrandConfig, saveBrandConfig } from './brandConfig';

interface BrandContextProps {
    config: BrandConfig;
    setConfig: (cfg: BrandConfig) => void;
}

export const BrandContext = createContext<BrandContextProps>({
    config: loadBrandConfig(),
    setConfig: () => { },
});

export const BrandProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<BrandConfig>(loadBrandConfig());

    useEffect(() => {
        saveBrandConfig(config);
        // Atualiza a variável CSS da cor primária
        document.documentElement.style.setProperty('--brand-primary', config.primaryHex);
    }, [config]);

    return (
        <BrandContext.Provider value={{ config, setConfig }}>
            {children}
        </BrandContext.Provider>
    );
};
