import axios from 'axios';

export async function convertSolToUsd(sol: number): Promise<string> {
    const response = await axios.get(process.env.EXCHANGE_RATE_API_URL!);
    const solToUsdRate = response.data.solana.usd; 
    return (sol * solToUsdRate).toFixed(2);
}
