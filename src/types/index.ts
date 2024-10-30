export type TradeType = 'BUY' | 'SELL';

export interface Swap {
    signature: string;
    timestamp: number;
    tokenMint: string;
    tokenDecimals: number;
    type: TradeType;
    amountIn: number;
    amountOut: number;
    poolId: string;
    signer: string;
}
