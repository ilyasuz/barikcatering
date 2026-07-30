import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppRegion = 'all' | 'Türkiye' | 'Arabistan';

interface RegionContextType {
  region: AppRegion;
  setRegion: (region: AppRegion) => void;
}

const RegionContext = createContext<RegionContextType>({
  region: 'all',
  setRegion: () => {},
});

export const RegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [region, setRegionState] = useState<AppRegion>('all');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('barik_region');
    if (saved && (saved === 'all' || saved === 'Türkiye' || saved === 'Arabistan')) {
      setRegionState(saved as AppRegion);
    }
  }, []);

  const setRegion = (newRegion: AppRegion) => {
    setRegionState(newRegion);
    localStorage.setItem('barik_region', newRegion);
  };

  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => useContext(RegionContext);
