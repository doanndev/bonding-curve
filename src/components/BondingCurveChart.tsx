'use client';

import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import * as bondingCurveService from '@/services/bondingCurve';

interface BondingCurveChartProps {
  currentSupply: number;
  totalSupply: number;
  currentPrice: number;
}

export const BondingCurveChart: FC<BondingCurveChartProps> = ({
  currentSupply,
  totalSupply,
  currentPrice,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isChartReady, setIsChartReady] = useState<boolean>(false);
  
  // Initialize the chart once
  useLayoutEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;
    
    try {
      // Create chart instance
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 300,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#cccccc',
          visible: true,
          autoScale: true,
        },
        timeScale: {
          borderColor: '#cccccc',
          visible: true,
          timeVisible: false,
        },
      });

      // Create line series
      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // Store references
      chartRef.current = chart;
      lineSeriesRef.current = lineSeries;
      
      // Add resize handler
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };
      window.addEventListener('resize', handleResize);
      
      // Mark chart as ready
      setIsChartReady(true);
      
      // Clean up on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          lineSeriesRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, []);

  // Update chart data when props change
  useEffect(() => {
    if (!isChartReady || !lineSeriesRef.current) return;
    
    try {
      console.log('Updating bonding curve chart with:', { currentSupply, totalSupply, currentPrice });
      
      // Lấy dữ liệu từ localStorage để xem có thông tin pool không
      const poolAddr = localStorage.getItem('bondingPoolAddress');
      
      // Generate data points for the bonding curve
      const data: LineData[] = [];
      const steps = 100;
      
      // Giả định dữ liệu pool để tính toán đường cong (nếu không có dữ liệu thực)
      // Lưu ý: Đây là giá trị giả định, trong trường hợp thực tế nên lấy từ pool thực
      const simulatedPoolData = poolAddr ? {
        totalSupply: { toNumber: () => totalSupply },
        supplyRemaining: { toNumber: () => totalSupply - currentSupply },
        virtualSolReserve: { toNumber: () => 0.1 * 1e9 }, // 0.1 SOL
        virtualTokenReserve: { toNumber: () => 1000 }
      } : undefined;
      
      for (let i = 0; i <= steps; i++) {
        const supply = Math.floor((i / steps) * totalSupply);
        const price = bondingCurveService.calculatePrice(supply, simulatedPoolData);
        
        data.push({
          time: i as Time,
          value: price,
        });
      }
      
      console.log(`Generated ${data.length} price points for the bonding curve`);
      
      // Update series data
      lineSeriesRef.current.setData(data);
      
      // Add marker for current position
      const currentStep = Math.max(0, Math.min(steps, Math.floor((currentSupply / totalSupply) * steps)));
      lineSeriesRef.current.setMarkers([
        {
          time: currentStep as Time,
          position: 'inBar',
          color: '#ef4444',
          shape: 'circle',
          size: 3,
          text: `Current: ${currentPrice.toFixed(6)} SOL`,
        },
      ]);
      
      // Calculate price change
      if (currentPrice > 0) {
        const previousSupply = Math.max(0, currentSupply - 1);
        const previousPrice = bondingCurveService.calculatePrice(previousSupply);
        const change = previousPrice > 0 ? 
          ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
        setPriceChange(change);
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [isChartReady, currentSupply, totalSupply, currentPrice]);

  const getPriceChangeColor = () => {
    if (priceChange > 0) return 'text-green-600';
    if (priceChange < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = () => {
    if (priceChange > 0) return <TrendingUp className="w-4 h-4" />;
    if (priceChange < 0) return <TrendingDown className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  return (
    <Card className="bg-white border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bonding Curve Chart</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Current Price:</span>
            <span className="font-mono text-lg font-bold text-blue-600">
              {currentPrice} SOL
            </span>
            <div className={`flex items-center space-x-1 ${getPriceChangeColor()}`}>
              {getPriceChangeIcon()}
              <span className="text-sm">
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Giá token theo bonding curve - Càng mua nhiều, giá càng tăng
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div ref={chartContainerRef} className="w-full h-[300px]" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Circulation</p>
              <p className="text-lg font-bold text-blue-600">
                {currentSupply.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Supply</p>
              <p className="text-lg font-bold text-green-600">
                {totalSupply.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Circulation %</p>
              <p className="text-lg font-bold text-purple-600">
                {((currentSupply / totalSupply) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
