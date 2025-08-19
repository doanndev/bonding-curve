import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

export const SOLANA_CONFIG = {
  network: WalletAdapterNetwork.Devnet,
  endpoint: clusterApiUrl(WalletAdapterNetwork.Devnet),
  commitment: 'confirmed' as const,
};

export const APP_CONFIG = {
  name: 'Solana Dapp',
  description: 'Ứng dụng phi tập trung kết nối với ví Phantom',
  version: '1.0.0',
};
