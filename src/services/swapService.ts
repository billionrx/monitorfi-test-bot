import { Connection, PublicKey, ParsedTransactionWithMeta, TokenBalance, ParsedInstruction } from '@solana/web3.js';
import { Swap, TradeType } from '../types';
import { RPC_ENDPOINT } from '../config.js';

const connection = new Connection(RPC_ENDPOINT!);

const RAYDIUM_AMM_PROGRAM_ID = new PublicKey('routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS'); 

export async function parseRaydiumSwapTransaction(signature: string): Promise<Swap | null> {
    const transaction = await connection.getParsedTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
      
    if (!transaction) {
        throw new Error('Transaction not found.');
    }

    if (!transaction.meta) {
        throw new Error('Transaction metadata not available.');
    }

    const isRaydiumSwap = transaction.transaction.message.instructions.some((instruction) => {
        const programId = new PublicKey(instruction.programId);
        return programId.equals(RAYDIUM_AMM_PROGRAM_ID);
    });

    if (!isRaydiumSwap) {
        return null;
    }

    const swapDetails = extractSwapDetails(transaction);
    if (!swapDetails) {
        throw new Error('Failed to extract swap details.');
    }

    const {
        amountIn,
        amountOut,
        tokenMintIn,
        tokenMintOut,
        tokenDecimalsIn,
        type,
        poolId,
        signer,
    } = swapDetails;

    const swap: Swap = {
        signature,
        timestamp: (transaction.blockTime || 0) * 1000,
        tokenMint: tokenMintIn,
        tokenDecimals: tokenDecimalsIn,
        type,
        amountIn,
        amountOut,
        poolId,
        signer,
    };

    return swap;
}

function extractSwapDetails(transaction: ParsedTransactionWithMeta) {
    const preTokenBalances = transaction.meta?.preTokenBalances || [];
    const postTokenBalances = transaction.meta?.postTokenBalances || [];

    const preBalancesMap = new Map<number, TokenBalance>();
    preTokenBalances.forEach((tb) => {
        preBalancesMap.set(tb.accountIndex, tb);
    });

    const postBalancesMap = new Map<number, TokenBalance>();
    postTokenBalances.forEach((tb) => {
        postBalancesMap.set(tb.accountIndex, tb);
    });

    const balanceChanges: Array<{
        mint: string;
        amountChange: number;
        decimals: number;
    }> = [];

    for (const [accountIndex, preBalance] of preBalancesMap.entries()) {
        const postBalance = postBalancesMap.get(accountIndex);
        if (postBalance) {
            const amountChange =
                Number(postBalance.uiTokenAmount.amount) - Number(preBalance.uiTokenAmount.amount);
            balanceChanges.push({
                mint: preBalance.mint,
                amountChange,
                decimals: preBalance.uiTokenAmount.decimals,
            });
        }
    }

    let amountIn = 0;
    let amountOut = 0;
    let tokenMintIn = '';
    let tokenMintOut = '';
    let tokenDecimalsIn = 0;
    let type: TradeType = 'SWAP';

    balanceChanges.forEach((change) => {
        if (change.amountChange < 0) {
            amountIn = -change.amountChange / Math.pow(10, change.decimals);
            tokenMintIn = change.mint;
            tokenDecimalsIn = change.decimals;
        } else if (change.amountChange > 0) {
            amountOut = change.amountChange / Math.pow(10, change.decimals);
            tokenMintOut = change.mint;
        }
    });

    const poolId = getPoolIdFromTransaction(transaction);
    if (!poolId) {
        return null;
    }

    const signerAccount = transaction.transaction.message.accountKeys.find(account => account.signer);
    const signer = signerAccount?.pubkey.toBase58() || '';

    return {
        amountIn,
        amountOut,
        tokenMintIn,
        tokenMintOut,
        tokenDecimalsIn,
        type,
        poolId,
        signer,
    };
}

function getPoolIdFromTransaction(transaction: ParsedTransactionWithMeta): string | null {
    const swapInstruction = transaction.transaction.message.instructions.find((instruction) => {
        const programId = new PublicKey(instruction.programId);
        return programId.equals(RAYDIUM_AMM_PROGRAM_ID);
    }) as ParsedInstruction | undefined;

    if (!swapInstruction) {
        return null;
    }

    if ('parsed' in swapInstruction && swapInstruction.parsed && 'info' in swapInstruction.parsed) {
        const parsedInfo = swapInstruction.parsed.info;
        const poolIdString = parsedInfo.ammId;
        return poolIdString || null;
    } else if ('accounts' in swapInstruction) {
        const accounts = swapInstruction.accounts as PublicKey[];
        const poolIdPublicKey = accounts[0];
        const poolId = poolIdPublicKey?.toBase58() || null;
        return poolId;
    }

    return null;
}
