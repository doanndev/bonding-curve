import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@project-serum/anchor';
import { ENV_CONFIG } from '@/config/env';

/** === IDL Bonding Curve === */
const BONDING_CURVE_IDL: Idl = {
  version: "0.1.0",
  name: "bonding_curve",
  instructions: [
    {
      name: "initializePool",
      accounts: [
        { name: "pool", isMut: true, isSigner: true },
        { name: "owner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "totalSupply", type: "u64" },
        { name: "virtualSolReserve", type: "u64" },
        { name: "virtualTokenReserve", type: "u64" }
      ]
    },
    {
      name: "buyTokens",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "owner", isMut: false, isSigner: true }
      ],
      args: [{ name: "solIn", type: "u64" }]
    },
    {
      name: "sellTokens",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "owner", isMut: false, isSigner: true }
      ],
      args: [{ name: "tokensIn", type: "u64" }]
    },
    {
      name: "closePool",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "Pool",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "totalSupply", type: "u64" },
          { name: "supplyRemaining", type: "u64" },
          { name: "virtualSolReserve", type: "u64" },
          { name: "virtualTokenReserve", type: "u64" }
        ]
      }
    }
  ],
  errors: [
    { code: 6000, name: "InvalidAmount", msg: "Invalid amount" }
  ]
};

/** === Program ID (thay bằng của bạn) === */
const BONDING_CURVE_PROGRAM_ID = ENV_CONFIG.BONDING_CURVE_PROGRAM_ID || "AGjZLmcGfE3GSgowT8bKCkJ49ipG5qinKk59ahJ61bk9";

/** === Helper: Get Program Instance === */
function getProgram(connection: Connection, wallet: any): Program {
  if (!wallet?.publicKey || typeof wallet?.signTransaction !== 'function') {
    throw new Error('Wallet not connected or cannot sign transactions');
  }
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed', preflightCommitment: 'confirmed' });
  return new Program(BONDING_CURVE_IDL, new PublicKey(BONDING_CURVE_PROGRAM_ID), provider);
}

/** === Local Storage Helpers === */
function getPoolAddress(): PublicKey | null {
  const addr = localStorage.getItem('bondingPoolAddress');
  return addr ? new PublicKey(addr) : null;
}
function setPoolAddress(address: PublicKey) {
  localStorage.setItem('bondingPoolAddress', address.toString());
}

/** === Pool Actions === */
export async function initializePool(connection: Connection, wallet: any, totalSupply: number, virtualSolReserve: number, virtualTokenReserve: number): Promise<string> {
  const program = getProgram(connection, wallet);
  const poolKeypair = Keypair.generate();
  const tx = await program.methods
    .initializePool(new BN(totalSupply), new BN(virtualSolReserve), new BN(virtualTokenReserve))
    .accounts({ pool: poolKeypair.publicKey, owner: wallet.publicKey, systemProgram: SystemProgram.programId })
    .signers([poolKeypair])
    .rpc();
  setPoolAddress(poolKeypair.publicKey);
  return tx;
}

export async function buyTokens(connection: Connection, wallet: any, solAmount: number): Promise<string> {
  const program = getProgram(connection, wallet);
  const poolAddress = getPoolAddress();
  if (!poolAddress) throw new Error('Pool address not set');
  return program.methods.buyTokens(new BN(solAmount)).accounts({ pool: poolAddress, owner: wallet.publicKey }).rpc();
}

export async function sellTokens(connection: Connection, wallet: any, tokenAmount: number): Promise<string> {
  const program = getProgram(connection, wallet);
  const poolAddress = getPoolAddress();
  if (!poolAddress) throw new Error('Pool address not set');
  return program.methods.sellTokens(new BN(tokenAmount)).accounts({ pool: poolAddress, owner: wallet.publicKey }).rpc();
}

export async function closePool(connection: Connection, wallet: any): Promise<string> {
  const program = getProgram(connection, wallet);
  const poolAddress = getPoolAddress();
  if (!poolAddress) throw new Error('Pool address not set');
  const tx = await program.methods.closePool().accounts({ pool: poolAddress, owner: wallet.publicKey }).rpc();
  localStorage.removeItem('bondingPoolAddress');
  return tx;
}

export async function getPoolData(connection: Connection, wallet: any) {
  const program = getProgram(connection, wallet);
  const poolAddress = getPoolAddress();
  if (!poolAddress) return null;
  try { return await program.account.pool.fetch(poolAddress); } catch { return null; }
}

export async function isPoolOwner(connection: Connection, wallet: any): Promise<boolean> {
  const poolData = await getPoolData(connection, wallet);
  return poolData ? poolData.owner.equals(wallet.publicKey) : false;
}

export async function canClosePool(connection: Connection, wallet: any) {
  const owner = await isPoolOwner(connection, wallet);
  return owner ? { canClose: true } : { canClose: false, reason: 'Not pool owner' };
}

export async function debugPoolAccount(connection: Connection) {
  const poolAddress = getPoolAddress();
  if (!poolAddress) return null;
  const accountInfo = await connection.getAccountInfo(poolAddress);
  console.log('Pool account info:', accountInfo);
  return accountInfo;
}

/** === Bonding Curve Calculations === */

/** Calculates the current token price based on pool reserves */
export function calculatePrice(supply: number, poolData?: any): number {
  if (!poolData) return supply === 0 ? 0.000001 : 0.01 * supply;

  try {
    const virtualSolReserve = poolData.virtualSolReserve.toNumber() / 1e9; // lamports → SOL
    const virtualTokenReserve = poolData.virtualTokenReserve.toNumber();
    const totalSupply = poolData.totalSupply.toNumber();
    const supplyRemaining = poolData.supplyRemaining.toNumber();

    const circulatingSupply = totalSupply - supplyRemaining;

    // Price = Δsol / Δtoken with Δtoken = 1
    const deltaToken = 1;
    const price = (deltaToken * virtualSolReserve) / (virtualTokenReserve + deltaToken);

    return Math.max(0.000001, price);
  } catch {
    return supply === 0 ? 0.000001 : 0.01 * supply;
  }
}

/** Calculates number of tokens received for given SOL input */
export function calculateBuyReturn(solAmount: number, poolData?: any): number {
  if (solAmount <= 0) return 0;
  if (!poolData) return solAmount / 0.01;

  try {
    const virtualSolReserve = poolData.virtualSolReserve.toNumber() / 1e9;
    const virtualTokenReserve = poolData.virtualTokenReserve.toNumber();
    const supplyRemaining = poolData.supplyRemaining.toNumber();

    // Bonding curve formula: Δtoken = Δsol * virtualTokenReserve / (virtualSolReserve + Δsol)
    const tokensOut = (solAmount * virtualTokenReserve) / (virtualSolReserve + solAmount);

    return Math.min(tokensOut, supplyRemaining);
  } catch {
    return solAmount / 0.01;
  }
}

/** Calculates SOL received for selling given token amount */
export function calculateSellReturn(tokenAmount: number, poolData?: any): number {
  if (tokenAmount <= 0) return 0;
  if (!poolData) return tokenAmount * 0.01;

  try {
    const virtualSolReserve = poolData.virtualSolReserve.toNumber() / 1e9;
    const virtualTokenReserve = poolData.virtualTokenReserve.toNumber();

    // Bonding curve formula: Δsol = Δtoken * virtualSolReserve / (virtualTokenReserve + Δtoken)
    const solOut = (tokenAmount * virtualSolReserve) / (virtualTokenReserve + tokenAmount);

    return solOut;
  } catch {
    return tokenAmount * 0.01;
  }
}

/** Generates price points for bonding curve chart */
export function generateBondingCurveData(totalSupply: number, poolData?: any, points: number = 100): Array<{ supply: number; price: number }> {
  const data = [];
  for (let i = 0; i <= points; i++) {
    const supply = Math.floor((i / points) * totalSupply);
    const price = calculatePrice(supply, poolData);
    data.push({ supply, price });
  }
  return data;
}

/** Calculates market cap = price * circulating supply */
export function calculateMarketCap(supply: number, price: number): number {
  return supply * price;
}

/** Calculates slippage % for buy or sell */
export function calculateSlippage(amount: number, isBuying: boolean, poolData?: any): number {
  if (amount <= 0) return 0;
  try {
    if (isBuying) {
      const tokensBought = calculateBuyReturn(amount, poolData);
      const currentPrice = calculatePrice(0, poolData);
      const effectivePrice = amount / tokensBought;
      return ((effectivePrice - currentPrice) / currentPrice) * 100;
    } else {
      const solReceived = calculateSellReturn(amount, poolData);
      const currentPrice = calculatePrice(0, poolData);
      const effectivePrice = solReceived / amount;
      return ((currentPrice - effectivePrice) / currentPrice) * 100;
    }
  } catch {
    return 0;
  }
}
