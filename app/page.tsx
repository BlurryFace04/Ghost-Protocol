'use client'

import * as React from 'react'
import { useState, useEffect } from 'react';
import { useAccount, useContractWrite, useContractRead, useWaitForTransaction } from 'wagmi'
import Image from 'next/image';
import FacilitatorContractABI from './FacilitatorContractABI.json';
import ERC721ABI from './ERC721ABI.json';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

const facilitatorContractAddress = '0xAdbe6d7AbD11cef2682Eb18Ff6A95fa7014463f3';

interface GroupedNFTs {
  [collectionName: string]: NFT[];
}

function NFTItem({ nft }: { nft: NFT}) {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);

  const { data: isApproved } = useContractRead({
    address: nft.contractAddress as `0x${string}`,
    abi: ERC721ABI,
    functionName: 'isApprovedForAll',
    args: [address, facilitatorContractAddress]
  });

  const { data: approveData, write: approveNFT, isLoading: isApproveLoading, error: approveError } = useContractWrite({
    address: nft.contractAddress as `0x${string}`,
    abi: ERC721ABI,
    functionName: 'setApprovalForAll',
    args: [facilitatorContractAddress, true],
  });

  const { write: depositNFT } = useContractWrite({
    address: facilitatorContractAddress, 
    abi: FacilitatorContractABI,
    functionName: 'depositNFT',
    args: [nft.contractAddress, nft.tokenId]
  });

  const handleSupply = async () => {
    if (!isApproved) {
      setIsApproving(true);
      await approveNFT();
    } else {
      depositNFT();
    }
  };

  useEffect(() => {
    if (!isApproveLoading && isApproving && !approveError) {
      setIsApproving(false);
      depositNFT();
    }
    if (approveError) {
      setIsApproving(false);
    }
  }, [isApproveLoading, isApproving, approveError, depositNFT]);

  return (
    <Button variant='outline' onClick={handleSupply}>Supply</Button>
  );
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
        <div style={{ padding: '200px', display: 'flex', justifyContent: 'space-between' }} className="overflow-y-auto max-h-[94vh] nft-scroll">
          {/* Left side */}
          <div style={{ width: '50%' }}> 
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your supplies</CardTitle>
              </CardHeader>
              <CardContent className='pl-16 pr-16'>
                {/* {Object.entries(groupedNFTs).map(([collectionName, nfts]) => (
                  <div className="pb-4">
                    <CardTitle className="text-lg mb-4">{collectionName}</CardTitle>
                    <Carousel>
                      <CarouselContent>
                        {nfts.map((nft, index) => (
                          <CarouselItem key={nft.tokenId} className="md:basis-1/2 lg:basis-1/3">
                            <Card>
                              <CardContent className='p-0 rounded-lg'>
                                <Image 
                                  src={nft.image} 
                                  alt={nft.name} 
                                  width={240}
                                  height={240}
                                  className='rounded-t-lg'
                                />
                              </CardContent>
                              <CardContent className="p-4">
                                <Label className="text-md pl-2">{nft.name}</Label>
                                <div className="flex items-center space-x-2 pl-2 pt-2">
                                  <Label htmlFor="collateral">collateral</Label>
                                  <Switch id="collateral" />
                                </div>
                              </CardContent>
                            </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                ))} */}
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-xl">Assets to supply</CardTitle>
              </CardHeader>
              <CardContent className='pl-16 pr-16'>
                {Object.entries(groupedNFTs).map(([collectionName, nfts]) => (
                  <div className="pb-4">
                    <CardTitle className="text-lg mb-4">{collectionName}</CardTitle>
                    <Carousel>
                      <CarouselContent>
                        {nfts.map((nft, index) => (
                          <CarouselItem key={nft.tokenId} className="xl:basis-1/2 2xl:basis-1/3">
                            <Card>
                              <CardContent className='p-0 rounded-lg'>
                                <Image 
                                  src={nft.image} 
                                  alt={nft.name} 
                                  width={400}
                                  height={400}
                                  className='rounded-t-lg'
                                />
                              </CardContent>
                              <CardContent className="p-4">
                                <Label className="text-md pl-2">{nft.name}</Label>
                                <div className="flex items-center space-x-2 pl-2 pt-2">
                                  {/* <Label htmlFor="collateral">collateral</Label> */}
                                  {/* <Switch id="collateral" /> */}
                                  {/* <Button variant="outline" className="">Supply</Button> */}
                                  <NFTItem key={nft.tokenId} nft={nft}/>
                                </div>
                                {/* <div className="flex items-center space-x-2 mt-2">
                                  <Button className="p-4" variant="outline">Supply</Button>
                                  <Button variant="outline" className="p-4">Withdraw</Button>
                                </div> */}
                              </CardContent>
                            </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {/* Right side */}
          <div style={{ width: '50%', paddingLeft: '15px' }}>
            {/* Content for the right side */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your borrows</CardTitle>
                  <CardDescription className="pt-2">
                    <Badge variant="outline" className="rounded-sm">Borrow power used 99%</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[175px]">Asset</TableHead>
                        <TableHead className="text-center w-[170px]">Debt</TableHead>
                        <TableHead className="text-center w-[170px]">APY</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3 mt-2">
                            <Avatar> 
                              <AvatarImage src="https://app.aave.com/icons/tokens/gho.svg" alt="GHO"/>
                              <AvatarFallback>GHO</AvatarFallback>
                            </Avatar>
                            <Label>GHO</Label>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">0.1134539</TableCell>
                        <TableCell className="text-center">2.02 %</TableCell>
                        <TableCell className="text-right">
                          <Button>Repay</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-xl">Assets to borrow</CardTitle>
                  {/* <CardDescription className="pt-2">
                    <Badge variant="outline" className="rounded-sm">Borrow power used 99%</Badge>
                  </CardDescription> */}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[175px]">Asset</TableHead>
                        <TableHead className="text-center w-[170px]">Available</TableHead>
                        <TableHead className="text-center w-[170px]">APY</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3 mt-2">
                            <Avatar> 
                              <AvatarImage src="https://app.aave.com/icons/tokens/gho.svg" alt="GHO"/>
                              <AvatarFallback>GHO</AvatarFallback>
                            </Avatar>
                            <Label>GHO</Label>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">633.60</TableCell>
                        <TableCell className="text-center">2.02 %</TableCell>
                        <TableCell className="text-right">
                          <Button>Borrow</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page;
