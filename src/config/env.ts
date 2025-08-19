export const ENV_CONFIG = {
  // Solana Program ID - Thay thế bằng program ID thực tế của bạn
  BONDING_CURVE_PROGRAM_ID: process.env.NEXT_PUBLIC_BONDING_CURVE_PROGRAM_ID || 
    "AGjZLmcGfE3GSgowT8bKCkJ49ipG5qinKk59ahJ61bk9", // Placeholder
  
  // Network Configuration
  SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
  SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  
  // App Configuration
  APP_NAME: "Solana Bonding Curve Dapp",
  APP_DESCRIPTION: "Ứng dụng bonding curve với giao diện đẹp mắt",
  
  // Bonding Curve Parameters
  DEFAULT_TOTAL_SUPPLY: 1000000, // 1M tokens
  DEFAULT_VIRTUAL_SOL_RESERVE: 1000000000, // 1 SOL in lamports
  DEFAULT_VIRTUAL_TOKEN_RESERVE: 100000, // 100K tokens
};
