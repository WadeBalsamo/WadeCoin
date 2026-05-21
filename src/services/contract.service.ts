import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { WalletService } from './wallet.service';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private contract: ethers.Contract | null = null;
  private contractAddress = '0x5FbDB2315678afccb333f8a9c21c1a25ee0eb8E1'; // local hardhat
  private contractABI = []; // would be loaded from artifacts

  constructor(private walletService: WalletService) {
    console.log('[ContractService] Initializing contract service');
    console.log('[ContractService] Contract address:', this.contractAddress);
  }

  async initialize(): Promise<void> {
    console.log('[ContractService] Initializing contract connection...');

    try {
      const signer = await this.walletService.getSigner();
      console.log('[ContractService] Got signer, creating contract instance...');

      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        signer
      );

      console.log('[ContractService] ✓ Contract initialized');
      console.log('[ContractService] Contract methods available:', Object.keys(this.contract));
    } catch (error) {
      console.error('[ContractService] Failed to initialize contract:', error);
      throw error;
    }
  }

  async buy(amount: string): Promise<ethers.ContractTransactionResponse | null> {
    console.log('[ContractService] Buy called with amount:', amount);

    if (!this.contract) {
      console.error('[ContractService] Contract not initialized!');
      await this.initialize();
    }

    try {
      const value = ethers.parseEther(amount);
      console.log('[ContractService] Parsed value:', value.toString(), 'wei');
      console.log('[ContractService] Calling contract.buy()...');

      const tx = await this.contract?.buy({ value });

      console.log('[ContractService] Transaction sent:', tx?.hash);
      console.log('[ContractService] Waiting for confirmation...');

      const receipt = await tx?.wait();
      console.log('[ContractService] ✓ Transaction confirmed in block:', receipt?.blockNumber);

      return tx;
    } catch (error: any) {
      console.error('[ContractService] Buy transaction failed:', error.message);
      console.error('[ContractService] Full error:', error);

      if (error.code === 'INSUFFICIENT_FUNDS') {
        console.warn('[ContractService] User has insufficient ETH');
      }

      throw error;
    }
  }

  async sell(amount: string): Promise<ethers.ContractTransactionResponse | null> {
    console.log('[ContractService] Sell called with amount:', amount);

    if (!this.contract) {
      console.error('[ContractService] Contract not initialized!');
      await this.initialize();
    }

    try {
      const amountParsed = ethers.parseEther(amount);
      console.log('[ContractService] Calling contract.sell() with:', amountParsed.toString());

      const tx = await this.contract?.sell(amountParsed);

      console.log('[ContractService] Sell transaction sent:', tx?.hash);
      const receipt = await tx?.wait();
      console.log('[ContractService] ✓ Sell confirmed in block:', receipt?.blockNumber);

      return tx;
    } catch (error) {
      console.error('[ContractService] Sell transaction failed:', error);
      throw error;
    }
  }

  async estimateGas(amount: string): Promise<string> {
    console.log('[ContractService] Estimating gas for amount:', amount);

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const value = ethers.parseEther(amount);
      const gasEstimate = await this.contract.buy.estimateGas({ value });

      console.log('[ContractService] Gas estimate:', gasEstimate.toString());

      // This would need the actual provider to get gas price
      return gasEstimate.toString();
    } catch (error) {
      console.warn('[ContractService] Gas estimation failed (transaction would revert?):', error);
      return '0';
    }
  }
}
