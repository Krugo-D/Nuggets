// pages/index.tsx
import { EthereumProvider } from "../contexts/EthereumContext";
import NuggetsContract from "../components/NuggetsContract/NuggetsContract.tsx";

export default function Home() {
  return (
    <EthereumProvider>
      <NuggetsContract />
    </EthereumProvider>
  );
}
