// contexts/EthereumContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { ethers, JsonRpcSigner } from "ethers";

declare global {
  interface Window {
    ethereum: any;
  }
}

interface EthereumContextProps {
  provider: ethers.JsonRpcProvider | null;
  signer: JsonRpcSigner | null;
}

const EthereumContext = createContext<EthereumContextProps | undefined>(
  undefined
);

export function EthereumProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const newProvider = new ethers.JsonRpcProvider(window.ethereum);
      setProvider(newProvider);
      (async () => {
        const signer = await newProvider.getSigner();
        setSigner(signer);
      })();
    }
  }, []);

  return (
    <EthereumContext.Provider value={{ provider, signer }}>
      {children}
    </EthereumContext.Provider>
  );
}

export default EthereumContext;
