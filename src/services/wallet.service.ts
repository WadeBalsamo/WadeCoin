import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private addressSubject = new BehaviorSubject<string | null>(null);
  address$ = this.addressSubject.asObservable();

  private signer: ethers.Signer | null = null;
  private provider: ethers.Provider | null = null;

  constructor() {
    console.log('[WalletService] Initializing wallet service');
  }

  async connect(): Promise<string> {
    console.log('[WalletService] Starting wallet connection...');

    // Check if metamask is available
    if (!window.ethereum) {
      console.error('[WalletService] MetaMask not found! window.ethereum is undefined');
      throw new Error('MetaMask not installed');
    }

    console.log('[WalletService] window.ethereum found, requesting accounts...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      console.log('[WalletService] Accounts retrieved:', accounts);
      console.log('[WalletService] First account:', accounts[0]);

      this.provider = provider;
      this.signer = await provider.getSigner();

      const address = accounts[0];
      this.addressSubject.next(address);

      console.log('[WalletService] ✓ Wallet connected successfully. Address:', address);
      return address;
    } catch (error) {
      console.error('[WalletService] Connection failed:', error);
      throw error;
    }
  }

  async getSigner(): Promise<ethers.Signer> {
    console.log('[WalletService] getSigner called, signer exists?', !!this.signer);

    if (!this.signer) {
      console.warn('[WalletService] Signer not initialized, attempting to connect...');
      await this.connect();
    }

    if (!this.signer) {
      throw new Error('Failed to get signer');
    }

    return this.signer;
  }

  async getAddress(): Promise<string> {
    console.log('[WalletService] getAddress called');

    const address = this.addressSubject.value;
    if (address) {
      console.log('[WalletService] Returning cached address:', address);
      return address;
    }

    console.log('[WalletService] No cached address, connecting...');
    return await this.connect();
  }

  async getBalance(): Promise<string> {
    const address = await this.getAddress();
    console.log('[WalletService] Fetching balance for address:', address);

    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const balance = await this.provider.getBalance(address);
    const formatted = ethers.formatEther(balance);

    console.log('[WalletService] Balance retrieved:', formatted, 'ETH');
    return formatted;
  }
}

// Declare ethereum on window object for typescript
declare global {
  interface Window {
    ethereum?: any;
  }
}
