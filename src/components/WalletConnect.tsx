'use client';

import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Coins, Network } from 'lucide-react';
import { useConnection } from '@solana/wallet-adapter-react';

export const WalletConnect: FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey && connected) {
      connection.getBalance(publicKey).then(setBalance);
    }
  }, [publicKey, connected, connection]);

  const formatBalance = (balance: number | null) => {
    if (balance === null) return '0 SOL';
    return `${(balance / 1e9).toFixed(4)} SOL`;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Solana Wallet
          </CardTitle>
          <CardDescription className="text-gray-600">
            Kết nối ví Phantom để tương tác với Solana Devnet
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!connected ? (
            <div className="text-center">
              <WalletMultiButton className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors" />
              <p className="text-sm text-gray-500 mt-3">
                Chưa có ví? <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Tải Phantom</a>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Network className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Network</span>
                </div>
                <p className="text-sm text-gray-600">Solana Devnet</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Địa chỉ ví</span>
                </div>
                <p className="text-sm text-gray-600 font-mono">
                  {publicKey ? shortenAddress(publicKey.toString()) : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Số dư</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatBalance(balance)}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => window.open('https://solfaucet.com/', '_blank')}
                >
                  Faucet
                </Button>
                <WalletMultiButton className="flex-1 bg-red-600 hover:bg-red-700 text-white" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
