// components/NuggetsContract.tsx
import { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import EthereumContext from "../../contexts/EthereumContext";
import Nuggets from "../../public/contracts/Nuggets.sol/Nuggets.json"; // Adjust the path to your contract artifact
import { Button, Form } from "react-bootstrap";

const contractAddress = "0x..."; // Replace with your deployed contract address

export default function NuggetsContract() {
  const ethereumContext = useContext(EthereumContext);
  const [signer, setSigner] = useState(
    ethereumContext ? ethereumContext.signer : null
  );
  const [amount, setAmount] = useState("");
  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    if (ethereumContext) {
      setSigner(ethereumContext.signer);
      if (ethereumContext.signer) {
        setContract(
          new ethers.Contract(
            contractAddress,
            Nuggets.abi,
            ethereumContext.signer
          )
        );
      }
    }
  }, [ethereumContext]);

  const mint = async () => {
    if (contract) {
      const tx = await contract.mint(ethers.parseEther(amount));
      await tx.wait();
      setAmount("");
    }
  };

  const burn = async () => {
    if (contract) {
      const tx = await contract.burn(ethers.parseEther(amount));
      await tx.wait();
      setAmount("");
    }
  };

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Amount</Form.Label>
        <Form.Control
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" onClick={mint}>
        Mint
      </Button>
      <Button variant="secondary" onClick={burn}>
        Burn
      </Button>
    </Form>
  );
}
