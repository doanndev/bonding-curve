'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Coins, X } from 'lucide-react';
import * as bondingCurveService from '@/services/bondingCurve';
import { ENV_CONFIG } from '@/config/env';

export const InitializePool: FC = () => {
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  // Form states
  const [totalSupply, setTotalSupply] = useState<string>(ENV_CONFIG.DEFAULT_TOTAL_SUPPLY.toString());
  const [virtualSolReserve, setVirtualSolReserve] = useState<string>('100');
  const [virtualTokenReserve, setVirtualTokenReserve] = useState<string>(ENV_CONFIG.DEFAULT_VIRTUAL_TOKEN_RESERVE.toString());
  
  // Pool status
  const [poolExists, setPoolExists] = useState<boolean>(false);
  const [poolData, setPoolData] = useState<any>(null);
  const [isPoolOwner, setIsPoolOwner] = useState<boolean>(false);
  const [canClosePool, setCanClosePool] = useState<{ canClose: boolean; reason?: string }>({ canClose: false });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');

  useEffect(() => {
    if (connected && anchorWallet && connection) {
      checkPoolExists();
    }
  }, [connected, anchorWallet, connection]);

  const checkPoolExists = async () => {
    if (!connected || !anchorWallet || !connection) return;
    
    try {
      const data = await bondingCurveService.getPoolData(connection, anchorWallet);
      // Nếu data là null, có nghĩa là pool chưa tồn tại
      setPoolExists(!!data);
      setPoolData(data); // Lưu pool data vào state
      
      // Kiểm tra quyền sở hữu và khả năng đóng pool nếu pool tồn tại
      if (data) {
        const isOwner = await bondingCurveService.isPoolOwner(connection, anchorWallet);
        setIsPoolOwner(isOwner);
        
        const closePermission = await bondingCurveService.canClosePool(connection, anchorWallet);
        setCanClosePool(closePermission);
        
        console.log('Pool permissions:', {
          isOwner,
          canClose: closePermission.canClose,
          reason: closePermission.reason
        });
      } else {
        setIsPoolOwner(false);
        setCanClosePool({ canClose: false, reason: 'Pool chưa được khởi tạo' });
      }
    } catch (error) {
      // Nếu có lỗi, coi như pool chưa tồn tại
      console.log('Error checking pool existence:', error);
      setPoolExists(false);
      setPoolData(null);
      setIsPoolOwner(false);
      setCanClosePool({ canClose: false, reason: 'Lỗi khi kiểm tra pool' });
    }
  };

  const handleInitializePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !anchorWallet || !connection) return;

    setIsLoading(true);
    try {
      const totalSupplyNum = parseInt(totalSupply);
      const virtualSolReserveNum = parseFloat(virtualSolReserve) * 1e9; // Convert to lamports
      const virtualTokenReserveNum = parseInt(virtualTokenReserve);

      const hash = await bondingCurveService.initializePool(
        connection,
        anchorWallet,
        totalSupplyNum,
        virtualSolReserveNum,
        virtualTokenReserveNum
      );

      setTxHash(hash);
      setPoolExists(true);
      
      // Lưu transaction hash để theo dõi
      localStorage.setItem('bondingCurveTxHash', hash);
      
      // Reset form
      setTotalSupply(ENV_CONFIG.DEFAULT_TOTAL_SUPPLY.toString());
      setVirtualSolReserve('1');
      setVirtualTokenReserve(ENV_CONFIG.DEFAULT_VIRTUAL_TOKEN_RESERVE.toString());
      
      // Refresh pool data
      await checkPoolExists();
    } catch (error) {
      console.error('Error initializing pool:', error);
      alert('Error initializing pool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePool = async () => {
    if (!connected || !anchorWallet || !connection) return;

    if (!confirm('Bạn có chắc chắn muốn đóng pool? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsLoading(true);
    try {
      const hash = await bondingCurveService.closePool(connection, anchorWallet);
      setTxHash(hash);
      setPoolExists(false);
      
      // Xóa transaction hash cũ
      localStorage.removeItem('bondingCurveTxHash');
      
      // Reset form
      setTotalSupply(ENV_CONFIG.DEFAULT_TOTAL_SUPPLY.toString());
      setVirtualSolReserve('1');
      setVirtualTokenReserve(ENV_CONFIG.DEFAULT_VIRTUAL_TOKEN_RESERVE.toString());
      
      // Refresh pool data
      await checkPoolExists();
    } catch (error) {
      console.error('Error closing pool:', error);
      alert('Error closing pool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Khởi tạo Pool</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            Vui lòng kết nối ví Phantom để khởi tạo pool
          </p>
        </CardContent>
      </Card>
    );
  }

  if (poolExists) {
    return (
      <Card className="bg-white border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <Coins className="w-5 h-5" />
            <span>Pool đã được khởi tạo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-green-600 mb-4">Pool bonding curve đã sẵn sàng!</p>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có thể bắt đầu mua bán token ngay bây giờ.
            </p>
            <div className="bg-green-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-green-700">
                ✅ Pool đang hoạt động trên địa chỉ: <span className="font-mono text-xs">{ENV_CONFIG.BONDING_CURVE_PROGRAM_ID}</span>
              </p>
              {poolData && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Pool Owner: <span className="font-mono">{poolData.owner.toString()}</span></p>
                  <p>Current Wallet: <span className="font-mono">{publicKey?.toString()}</span></p>
                  <p>Is Owner: {isPoolOwner ? '✅ Yes' : '❌ No'}</p>
                  <p>Can Close: {canClosePool.canClose ? '✅ Yes' : '❌ No'}</p>
                  {!canClosePool.canClose && canClosePool.reason && (
                    <p>Reason: {canClosePool.reason}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Button đóng pool */}
            {canClosePool.canClose && (
              <Button
                onClick={handleClosePool}
                disabled={isLoading}
                variant="destructive"
                className="mt-4"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang đóng pool...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Đóng Pool</span>
                  </div>
                )}
              </Button>
            )}
            
            {/* Debug button */}
            <Button
              onClick={() => connection && bondingCurveService.debugPoolAccount(connection)}
              variant="outline"
              className="mt-2"
              size="sm"
            >
              🐛 Debug Account Data
            </Button>
            
            {!canClosePool.canClose && poolExists && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700 text-center">
                  ⚠️ {canClosePool.reason || 'Bạn không có quyền đóng pool này'}
                </p>
                {isPoolOwner && (
                  <p className="text-xs text-yellow-600 text-center mt-2">
                    💡 Bạn là owner nhưng có thể cần kết nối đúng ví đã tạo pool
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5 text-blue-600" />
          <span>Khởi tạo Pool Bonding Curve</span>
        </CardTitle>
        <CardDescription>
          Tạo pool mới để bắt đầu giao dịch token theo bonding curve
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInitializePool} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tổng cung token
              </label>
              <input
                type="number"
                step="1000"
                min="1000"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tổng số token có thể được mua
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Virtual SOL Reserve
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={virtualSolReserve}
                onChange={(e) => setVirtualSolReserve(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                SOL dự trữ ảo cho bonding curve
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Virtual Token Reserve
              </label>
              <input
                type="number"
                step="1000"
                min="1000"
                value={virtualTokenReserve}
                onChange={(e) => setVirtualTokenReserve(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Token dự trữ ảo cho bonding curve
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">Thông tin Pool</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tổng cung:</span>
                <span className="ml-2 font-mono">{parseInt(totalSupply).toLocaleString()} tokens</span>
              </div>
              <div>
                <span className="text-gray-600">SOL Reserve:</span>
                <span className="ml-2 font-mono">{parseFloat(virtualSolReserve)} SOL</span>
              </div>
              <div>
                <span className="text-gray-600">Token Reserve:</span>
                <span className="ml-2 font-mono">{parseInt(virtualTokenReserve).toLocaleString()} tokens</span>
              </div>
              <div>
                <span className="text-gray-600">Giá khởi điểm:</span>
                <span className="ml-2 font-mono">
                  {(parseFloat(virtualSolReserve) / parseInt(virtualTokenReserve)).toFixed(6)} SOL
                </span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang khởi tạo...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Khởi tạo Pool</span>
              </div>
            )}
          </Button>
        </form>

        {/* Transaction Hash */}
        {txHash && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {poolExists ? 'Pool khởi tạo thành công!' : 'Pool đã được đóng thành công!'}
            </p>
            <p className="text-xs text-green-600 font-mono break-all">
              Transaction Hash: {txHash}
            </p>
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                💡 <strong>Lưu ý:</strong> 
                {poolExists 
                  ? ' Pool đã được khởi tạo thành công. Bạn có thể chuyển đến tab "Giao dịch" để bắt đầu mua bán token.'
                  : ' Pool đã được đóng. Bạn có thể khởi tạo pool mới nếu cần.'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
