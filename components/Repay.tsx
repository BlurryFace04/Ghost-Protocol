import React, { useState, useEffect } from 'react';
import { useAccount, useContractWrite, useSendTransaction, useWaitForTransaction } from 'wagmi';
import { ethers } from 'ethers';
import FacilitatorContractABI from '.././FacilitatorContractABI.json';
import { Button } from "@/components/ui/button";

const facilitatorContractAddress = '0x9EA2a6f7D0Ea4Af488aD6962578848e3880FA5d7';

function Repay({ amount }: { amount: string }) {
  const { address } = useAccount();
  const [transferTxHash, setTransferTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isRepayInitiated, setIsRepayInitiated] = useState(false);

  const { sendTransaction: transferGHO, isLoading: isTransferLoading } = useSendTransaction({
    // to: facilitatorContractAddress,
    // value: ethers.parseUnits(amount.toString(), 18),
    onSuccess(data) {
      setTransferTxHash(data.hash as `0x${string}`);
    },
  });

  const { data: transferTxData, isLoading: isTransferTxLoading } = useWaitForTransaction({ 
    hash: transferTxHash,
    enabled: !!transferTxHash,
  });

  const { write: repayGHO, isLoading: isRepayLoading } = useContractWrite({
    address: facilitatorContractAddress, 
    abi: FacilitatorContractABI,
    functionName: 'repayGHO',
  });

  useEffect(() => {
    console.log("AAH FUCKKK");
    if (transferTxData && !isRepayInitiated) {
      const amountInWei = ethers.parseUnits(amount, 18);
      repayGHO({ args: [amountInWei] });
      setIsRepayInitiated(true);
    }
  }, [transferTxData, isRepayInitiated, repayGHO, amount]);

  const handleRepayGHO = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      // Handle invalid amount here (e.g., show an error message)
      console.error("Invalid amount for repayment");
      return;
    }

    const amountInWei = ethers.parseUnits(amount, 18);

    if (!isTransferLoading && !isTransferTxLoading && !isRepayInitiated) {
      await transferGHO({
        to: facilitatorContractAddress,
        value: amountInWei
      });
    }
  };

  return (
    <Button onClick={handleRepayGHO} disabled={isTransferLoading || isTransferTxLoading || isRepayLoading}>Repay</Button>
  );
}

export default Repay;
