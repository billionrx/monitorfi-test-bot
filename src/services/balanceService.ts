import { Connection, PublicKey } from '@solana/web3.js';
import { convertSolToUsd } from '../utils/index.js';
import { RPC_ENDPOINT } from '../config.js';


const connection = new Connection(RPC_ENDPOINT!);

export async function getWalletBalance(address: string): Promise<string> {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    const balanceInSol = balance / 1e9; 
    const balanceInUsd = await convertSolToUsd(balanceInSol);

    return `Wallet Balance: ${balanceInSol.toFixed(2)} SOL (~${balanceInUsd} USD)`;
}
