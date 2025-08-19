'use client';

import { FC, useState, useEffect } from 'react';
import { WalletConnect } from './WalletConnect';
import { DemoFeatures } from './DemoFeatures';
import { BondingCurveChart } from './BondingCurveChart';
import { TradingPanel } from './TradingPanel';
import { InitializePool } from './InitializePool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Send, BarChart3, Coins, TrendingUp } from 'lucide-react';
import * as bondingCurveService from '@/services/bondingCurve';
import { ENV_CONFIG } from '@/config/env';

export const Dapp: FC = () => {
  const { connected } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'chart' | 'pool'>('overview');
  
  // Pool data for chart
  const [currentSupply, setCurrentSupply] = useState<number>(0);
  const [totalSupply, setTotalSupply] = useState<number>(ENV_CONFIG.DEFAULT_TOTAL_SUPPLY);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [poolError, setPoolError] = useState<string | null>(null);

  // Load data on connection change
  useEffect(() => {
    if (connected && connection) {
      loadPoolData();
    }
  }, [connected, anchorWallet, connection]);
  
  // Set up refresh interval to update chart data
  useEffect(() => {
    if (connected && connection && anchorWallet) {
      // Initial load
      loadPoolData();
      
      // Set up refresh interval - refresh every 5 seconds
      const intervalId = setInterval(() => {
        if (activeTab === 'chart' || activeTab === 'trading') {
          console.log('Auto-refreshing pool data');
          loadPoolData();
        }
      }, 5000);
      
      // Add event listener for custom events from trading actions
      const handleTradeEvent = (event: any) => {
        console.log('Trade event detected', event.type, event.detail);
        
        // Đợi blockchain update - dùng setTimeout
        setTimeout(() => {
          console.log('Refreshing pool data after trade');
          loadPoolData();
        }, 2000); // Tăng độ trễ lên 2s để blockchain có thời gian update
      };
      
      window.addEventListener('token:buy', handleTradeEvent);
      window.addEventListener('token:sell', handleTradeEvent);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('token:buy', handleTradeEvent);
        window.removeEventListener('token:sell', handleTradeEvent);
      };
    }
  }, [connected, connection, anchorWallet, activeTab]);

  const loadPoolData = async () => {
    try {
      // Sử dụng anchorWallet nếu có
      if (anchorWallet && connection) {
        console.log('Loading pool data...');
        const poolData = await bondingCurveService.getPoolData(connection, anchorWallet);
        console.log('Pool data loaded:', poolData);
        
        if (poolData) {
          const totalSup = poolData.totalSupply.toNumber();
          const remainingSup = poolData.supplyRemaining.toNumber();
          // Tính toán số token đang lưu thông (đã bán ra)
          const circulatingSupply = totalSup - remainingSup;
          // Tính giá dựa trên supply thực và dữ liệu pool
          const price = bondingCurveService.calculatePrice(circulatingSupply, poolData);
          
          // Tạo một số điểm dữ liệu để kiểm tra đường cong
          const curveData = bondingCurveService.generateBondingCurveData(totalSup, poolData, 5);
          
          console.log('Updating chart data:', { 
            circulatingSupply,
            totalSupply: totalSup,
            remainingSupply: remainingSup,
            price,
            marketCap: bondingCurveService.calculateMarketCap(circulatingSupply, price),
            // Hiển thị một số điểm trên đường cong để kiểm tra
            bondingCurveData: curveData
          });
          
          // Update state with values for chart
          setTotalSupply(totalSup);
          setCurrentSupply(circulatingSupply);
          setCurrentPrice(price);
          setPoolError(null);
        } else {
          // Pool chưa được khởi tạo, sử dụng giá mặc định
          const defaultPrice = bondingCurveService.calculatePrice(0);
          console.log('No pool data, using defaults:', { supply: 0, price: defaultPrice });
          
          setTotalSupply(ENV_CONFIG.DEFAULT_TOTAL_SUPPLY);
          setCurrentSupply(0);
          setCurrentPrice(defaultPrice);
          setPoolError(null);
        }
      } else {
        // Không có wallet, sử dụng giá mặc định
        const defaultPrice = 0.000001; // 0.000001 SOL per token
        console.log('No wallet, using defaults');
        
        setTotalSupply(ENV_CONFIG.DEFAULT_TOTAL_SUPPLY);
        setCurrentSupply(0);
        setCurrentPrice(defaultPrice);
      }
    } catch (error) {
      console.error('Error loading pool data:', error);
      setPoolError('Không thể kết nối với smart contract. Vui lòng kiểm tra Program ID.');
      
      // Sử dụng giá mặc định khi có lỗi
      const defaultPrice = 0.000001; // 0.000001 SOL per token
      setTotalSupply(ENV_CONFIG.DEFAULT_TOTAL_SUPPLY);
      setCurrentSupply(0);
      setCurrentPrice(defaultPrice);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: Send },
    { id: 'trading', label: 'Giao dịch', icon: TrendingUp },
    { id: 'chart', label: 'Biểu đồ', icon: BarChart3 },
    { id: 'pool', label: 'Quản lý Pool', icon: Coins },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {connected ? (
              <DemoFeatures />
            ) : (
              <Card className="bg-white border-blue-200">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Chào mừng đến với Solana Bonding Curve Dapp</CardTitle>
                  <CardDescription>
                    Ứng dụng DeFi với bonding curve, kết nối ví Phantom để bắt đầu
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-700 mb-2">🔐 Bảo mật</h4>
                        <p className="text-gray-600">Smart contract trên Solana</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-700 mb-2">📈 Bonding Curve</h4>
                        <p className="text-gray-600">Giá token tự động điều chỉnh</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-700 mb-2">⚡ Nhanh chóng</h4>
                        <p className="text-gray-600">Giao dịch nhanh với Solana</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'trading':
        return <TradingPanel />;
      
      case 'chart':
        return (
          <div className="space-y-4">
            {poolError && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-red-700">
                    <span className="text-sm font-medium">⚠️ Lưu ý:</span>
                    <span className="text-sm">{poolError}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            <BondingCurveChart
              currentSupply={currentSupply}
              totalSupply={totalSupply}
              currentPrice={currentPrice}
            />
          </div>
        );
      
      case 'pool':
        return <InitializePool />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Solana Bonding Curve Dapp
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ứng dụng DeFi với bonding curve, cho phép mua bán token theo cơ chế giá tự động điều chỉnh
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Wallet Connection */}
          <div className="lg:col-span-1">
            <WalletConnect />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg border border-blue-200 p-2">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Được xây dựng với Next.js, Solana Web3.js, Anchor và shadcn/ui</p>
          <p className="text-sm mt-2">
            Mạng: Solana Devnet | Ví: Phantom | Bonding Curve DeFi
          </p>
        </div>
      </div>
    </div>
  );
};
