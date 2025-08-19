'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Coins, Wallet } from 'lucide-react';
import * as bondingCurveService from '@/services/bondingCurve';
import { ENV_CONFIG } from '@/config/env';
import { PublicKey } from '@solana/web3.js';

export const TradingPanel: FC = () => {
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  // Form states
  const [solAmount, setSolAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [isBuying, setIsBuying] = useState<boolean>(true);
  
  // Pool data
  const [poolData, setPoolData] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [estimatedReturn, setEstimatedReturn] = useState<number>(0);
  
  // Transaction states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');

  useEffect(() => {
    if (connected && anchorWallet && connection) {
      loadPoolData();
    }
  }, [connected, anchorWallet, connection]);

  useEffect(() => {
    if (connected && anchorWallet && connection && solAmount) {
      calculateReturn();
    }
  }, [solAmount, tokenAmount, isBuying, connected, anchorWallet, connection]);

  const loadPoolData = async () => {
    if (!connected || !anchorWallet || !connection) return;
    
    try {
      const data = await bondingCurveService.getPoolData(connection, anchorWallet);
      console.log("data:",data);
      
      if (data) {
        setPoolData(data);
        
        // Tính toán số token đã bán (đang lưu thông)
        const totalSupply = data.totalSupply.toNumber();
        const supplyRemaining = data.supplyRemaining.toNumber();
        const circulatingSupply = totalSupply - supplyRemaining;
        console.log('Circulating supply from pool:', circulatingSupply);
        
        // Tính giá dựa trên supply thực và dữ liệu pool
        const price = bondingCurveService.calculatePrice(circulatingSupply, data);
        setCurrentPrice(price);
        
        console.log('Pool data loaded successfully:', {
          owner: data.owner.toString(),
          totalSupply: data.totalSupply.toString(),
          supplyRemaining: data.supplyRemaining.toString(),
          circulatingSupply: circulatingSupply,
          virtualSolReserve: data.virtualSolReserve.toString(),
          virtualTokenReserve: data.virtualTokenReserve.toString(),
          calculatedPrice: price,
          marketCap: bondingCurveService.calculateMarketCap(circulatingSupply, price)
        });
      } else {
        // Pool chưa tồn tại, sử dụng giá mặc định
        setPoolData(null);
        const defaultPrice = bondingCurveService.calculatePrice(0);
        setCurrentPrice(defaultPrice);
        console.log('Pool not found, using default price:', defaultPrice);
      }
    } catch (error) {
      console.error('Error loading pool data:', error);
      // Sử dụng giá mặc định khi có lỗi
      setPoolData(null);
      const defaultPrice = bondingCurveService.calculatePrice(0);
      setCurrentPrice(defaultPrice);
    }
  };

  const calculateReturn = () => {
    if (!connected || !anchorWallet || !connection) return;

    try {
      if (isBuying && solAmount) {
        const sol = parseFloat(solAmount);
        // Use poolData for more accurate calculation
        const returnAmount = bondingCurveService.calculateBuyReturn(sol, poolData);
        setEstimatedReturn(returnAmount);
      } else if (!isBuying && tokenAmount) {
        const tokens = parseFloat(tokenAmount);
        // Use poolData for more accurate calculation
        const returnAmount = bondingCurveService.calculateSellReturn(tokens, poolData);
        setEstimatedReturn(returnAmount);
      }
    } catch (error) {
      console.error('Error calculating return:', error);
    }
  };

  const handleBuyTokens = async () => {
    if (!connected || !anchorWallet || !connection || !solAmount) return;

    setIsLoading(true);
    try {
      const sol = parseFloat(solAmount);
      const hash = await bondingCurveService.buyTokens(connection, anchorWallet, sol * 1e9); // Convert to lamports
      setTxHash(hash);
      
      // Refresh pool data
      await loadPoolData();
      
      // Reset form
      setSolAmount('');
      setEstimatedReturn(0);
      
      // Dispatch custom event to notify other components (like chart)
      window.dispatchEvent(new CustomEvent('token:buy', { detail: { amount: sol } }));
    } catch (error) {
      console.error('Error buying tokens:', error);
      alert('Error buying tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellTokens = async () => {
    if (!connected || !anchorWallet || !connection || !tokenAmount) return;

    setIsLoading(true);
    try {
      const tokens = parseFloat(tokenAmount);
      
      // Lưu lại số SOL ước tính nhận được trước khi bán
      const estimatedSolReturn = bondingCurveService.calculateSellReturn(tokens, poolData);
      console.log('Estimated SOL return:', estimatedSolReturn);
      
      const hash = await bondingCurveService.sellTokens(connection, anchorWallet, tokens);
      setTxHash(hash);
      
      // Thông báo cho người dùng biết số SOL nhận được
      console.log(`Successfully sold ${tokens} tokens for approximately ${estimatedSolReturn.toFixed(6)} SOL`);
      
      // Refresh pool data
      setTimeout(async () => {
        await loadPoolData();
        
        // Reset form
        setTokenAmount('');
        setEstimatedReturn(0);
        
        // Dispatch custom event to notify other components (like chart)
        window.dispatchEvent(new CustomEvent('token:sell', { 
          detail: { 
            amount: tokens,
            solReceived: estimatedSolReturn 
          } 
        }));
      }, 2000); // Đợi 2s để blockchain update
      
    } catch (error) {
      console.error('Error selling tokens:', error);
      alert('Error selling tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBuying) {
      handleBuyTokens();
    } else {
      handleSellTokens();
    }
  };

  if (!connected) {
    return (
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span>Kết nối ví để giao dịch</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            Vui lòng kết nối ví Phantom để bắt đầu giao dịch token
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Price Display */}
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Giá hiện tại</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {currentPrice} SOL
              </p>
              <p className="text-sm text-gray-600">per token</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Pool Status</p>
              <p className="text-lg font-bold text-blue-600">
                {poolData ? 'Active' : 'Not Initialized'}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Supply Remaining</p>
              <p className="text-lg font-bold text-green-600">
                {poolData ? poolData.supplyRemaining.toNumber().toLocaleString() : '0'}
              </p>
            </div>
          </div>
          
          {poolData && (
            <div className="grid grid-cols-3 gap-4 text-center mt-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Supply</p>
                <p className="text-lg font-bold text-purple-600">
                  {poolData.totalSupply.toNumber().toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Virtual SOL</p>
                <p className="text-lg font-bold text-orange-600">
                  {(poolData.virtualSolReserve.toNumber() / 1e9).toFixed(4)} SOL
                </p>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-gray-600">Virtual Tokens</p>
                <p className="text-lg font-bold text-teal-600">
                  {poolData.virtualTokenReserve.toNumber()}
                </p>
              </div>
            </div>
          )}
          
          {!poolData && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700 text-center">
                💡 Pool chưa được khởi tạo. Vui lòng chuyển đến tab "Quản lý Pool" để khởi tạo pool trước khi giao dịch.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Form */}
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isBuying ? (
              <>
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Mua Token</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span>Bán Token</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isBuying 
              ? 'Mua token bằng SOL theo bonding curve'
              : 'Bán token để nhận SOL theo bonding curve'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Toggle Buy/Sell */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={isBuying ? "default" : "outline"}
                onClick={() => setIsBuying(true)}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Mua
              </Button>
              <Button
                type="button"
                variant={!isBuying ? "default" : "outline"}
                onClick={() => setIsBuying(false)}
                className="flex-1"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Bán
              </Button>
            </div>

            {/* Input Fields */}
            {isBuying ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng SOL
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={solAmount}
                    onChange={(e) => setSolAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.1"
                    required
                  />
                </div>
                {estimatedReturn > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Bạn sẽ nhận được:</p>
                    <p className="text-lg font-bold text-green-600">
                      {estimatedReturn} tokens
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng Token
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    required
                  />
                </div>
                {estimatedReturn > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Bạn sẽ nhận được:</p>
                    <p className="text-lg font-bold text-blue-600">
                      {estimatedReturn.toFixed(6)} SOL
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || (!solAmount && !tokenAmount)}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {isBuying ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{isBuying ? 'Mua Token' : 'Bán Token'}</span>
                </div>
              )}
            </Button>
          </form>

          {/* Transaction Hash */}
          {txHash && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Giao dịch thành công!</p>
              <p className="text-xs text-green-600 font-mono break-all">
                Hash: {txHash}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
