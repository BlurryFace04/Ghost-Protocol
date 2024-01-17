'use client'

import * as React from 'react'
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi'

function Page() {
  const { address } = useAccount();

  const [NFTs, setNFTs] = useState<any>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(true);

  useEffect(() => {
    if (!address) return;
    console.log("Address: ", address);

    const fetchNFTs = async () => {
      try {
        const response = await fetch(`/api/nfts/fetch/${address}`);
        const data = await response.json();
        console.log("NFTs: ", data)
        setNFTs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingNFTs(false);
      }
    };

    fetchNFTs();
  }, []);

  return (
    <div>
      {!address ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <img
          src="gho.jpeg"
          alt="GHO"
          className="mt-[-20vh]"
        />
        <p className="font-bold text-center text-2xl mt-4">Please, connect your wallet</p>
        <p className="text-center text-xl mt-4">Please connect your wallet to see your NFT collaterals and borrowings</p>
      </div>
      ) : (
        <div></div>
      )}
    </div>
  )
}

export default Page;
