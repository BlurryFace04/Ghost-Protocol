'use client'

import * as React from 'react'
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


interface NFT {
  collectionName: string,
  name: string,
  description: string,
  symbol: string,
  image: string,
  contractAddress: string,
  tokenId: string,
  tokenType: string
}

interface GroupedNFTs {
  [collectionName: string]: NFT[];
}

function Page() {
  const { address } = useAccount();

  const [NFTs, setNFTs] = useState<NFT[]>([]);
  const [groupedNFTs, setGroupedNFTs] = useState<GroupedNFTs>({});
  const [loadingNFTs, setLoadingNFTs] = useState(true);

  useEffect(() => {
    if (!address) return;
    console.log("Address: ", address);

    const fetchNFTs = async () => {
      try {
        const response = await fetch(`/api/nfts/fetch/${address}`);
        const data: NFT[] = await response.json();
        console.log("NFTs: ", data);
        setNFTs(data);

        // Group NFTs by their collection names
        const grouped = data.reduce<GroupedNFTs>((acc, nft) => {
          const collection = nft.collectionName || 'Unknown';
          acc[collection] = acc[collection] || [];
          acc[collection].push(nft);
          return acc;
        }, {});
        console.log("Grouped NFTs: ", grouped);
        setGroupedNFTs(grouped);

      } catch (error) {
        console.error(error);
      } finally {
        setLoadingNFTs(false);
      }
    };

    fetchNFTs();
  }, [address]);

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
        <div>

          {/* {Object.entries(groupedNFTs).map(([collectionName, nfts]) => (
            <div key={collectionName}>
              <h2>{collectionName}</h2>
            </div>
          ))} */}
        </div>
      )}
    </div>
  )
}

export default Page;
