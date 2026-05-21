import { Injectable } from '@angular/core';

declare global {
  interface Window { ethereum?: any; }
}

@Injectable({ providedIn: 'root' })
export class WalletService {

  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  async requestAccounts(): Promise<string[]> {
    return window.ethereum!.request({ method: 'eth_requestAccounts' });
  }

  async getChainId(): Promise<number> {
    const hex: string = await window.ethereum!.request({ method: 'eth_chainId' });
    return parseInt(hex, 16);
  }

  async switchChain(chainId: number): Promise<void> {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + chainId.toString(16) }],
    });
  }

  private encodeErc20Transfer(toAddress: string, amountWei: string): string {
    const selector = 'a9059cbb';
    const addr = toAddress.replace('0x', '').toLowerCase().padStart(64, '0');
    const amount = BigInt(amountWei).toString(16).padStart(64, '0');
    return '0x' + selector + addr + amount;
  }

  async sendErc20Transfer(
    fromAddress: string,
    contractAddress: string,
    toAddress: string,
    amountWei: string
  ): Promise<string> {
    const data = this.encodeErc20Transfer(toAddress, amountWei);
    return window.ethereum!.request({
      method: 'eth_sendTransaction',
      params: [{ from: fromAddress, to: contractAddress, data }],
    });
  }

  async waitForReceipt(txHash: string, maxAttempts = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      const receipt = await window.ethereum!.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });
      if (receipt) return receipt.status === '0x1';
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Transaction not confirmed after waiting. Please check your wallet.');
  }

  getErrorMessage(err: unknown): string {
    const msg = (err as any)?.message ?? String(err);
    if (msg.includes('4001') || msg.toLowerCase().includes('user rejected'))
      return 'Transaction rejected by user.';
    if (msg.toLowerCase().includes('insufficient funds'))
      return 'Insufficient funds for this transaction.';
    if (msg.includes('4902') || msg.toLowerCase().includes('unrecognized chain'))
      return 'Network not found in your wallet. Please add it manually.';
    return `Wallet error: ${msg}`;
  }

  formatWade(wei: string | undefined): string {
    if (!wei) return '0 WADE';
    try {
      const n = BigInt(wei);
      const div = BigInt('1000000000000000000');
      const whole = n / div;
      const frac = n % div;
      if (frac === 0n) return `${whole} WADE`;
      const fracStr = frac.toString().padStart(18, '0').replace(/0+$/, '');
      return `${whole}.${fracStr} WADE`;
    } catch { return '? WADE'; }
  }
}
