'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, BarChart3, Settings, CheckCircle, AlertCircle } from 'lucide-react';

export const DemoFeatures: FC = () => {
  const { publicKey, connected } = useWallet();
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(feature);
    // Simulate feature activation
    setTimeout(() => setActiveFeature(null), 2000);
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-blue-600" />
            <span>Thao tác nhanh</span>
          </CardTitle>
          <CardDescription>
            Các chức năng cơ bản của Dapp (Demo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleFeatureClick('send')}
              disabled={activeFeature === 'send'}
            >
              {activeFeature === 'send' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {activeFeature === 'send' ? 'Đã kích hoạt!' : 'Gửi SOL'}
            </Button>
            
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleFeatureClick('swap')}
              disabled={activeFeature === 'swap'}
            >
              {activeFeature === 'swap' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {activeFeature === 'swap' ? 'Đã kích hoạt!' : 'Swap Token'}
            </Button>
            
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => handleFeatureClick('chart')}
              disabled={activeFeature === 'chart'}
            >
              {activeFeature === 'chart' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
              {activeFeature === 'chart' ? 'Đã kích hoạt!' : 'Xem Chart'}
            </Button>
            
            <Button 
              className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              onClick={() => handleFeatureClick('settings')}
              disabled={activeFeature === 'settings'}
            >
              {activeFeature === 'settings' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              {activeFeature === 'settings' ? 'Đã kích hoạt!' : 'Cài đặt'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Info */}
      <Card className="bg-white border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>Thông tin ví</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
              <span className="text-sm text-green-600 font-semibold">Đã kết nối</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Địa chỉ ví:</span>
              <span className="text-sm text-blue-600 font-mono">
                {publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Mạng:</span>
              <span className="text-sm text-purple-600 font-semibold">Solana Devnet</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-700">
            <AlertCircle className="w-5 h-5" />
            <span>Lưu ý Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-yellow-700">
            <p>• Đây là phiên bản demo, các chức năng chỉ để minh họa</p>
            <p>• Để sử dụng thực tế, cần tích hợp thêm smart contracts</p>
            <p>• Ví đang kết nối với mạng Solana Devnet (testnet)</p>
            <p>• SOL trên Devnet không có giá trị thực</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
