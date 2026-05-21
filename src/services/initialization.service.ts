import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WalletService } from './wallet.service';
import { ContractService } from './contract.service';

@Injectable({
  providedIn: 'root'
})
export class InitializationService {
  private readySubject = new BehaviorSubject<boolean>(false);
  ready$ = this.readySubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor(
    private walletService: WalletService,
    private contractService: ContractService
  ) {
    console.log('[InitializationService] Service created');
  }

  async initialize(): Promise<void> {
    console.log('[InitializationService] ========================================');
    console.log('[InitializationService] Starting application initialization...');
    console.log('[InitializationService] ========================================');

    try {
      console.log('[InitializationService] Step 1: Connecting wallet...');
      const address = await this.walletService.connect();
      console.log('[InitializationService] ✓ Wallet connected:', address);

      console.log('[InitializationService] Step 2: Initializing contract service...');
      await this.contractService.initialize();
      console.log('[InitializationService] ✓ Contract service initialized');

      console.log('[InitializationService] Step 3: Checking wallet balance...');
      const balance = await this.walletService.getBalance();
      console.log('[InitializationService] ✓ Balance retrieved:', balance, 'ETH');

      console.log('[InitializationService] ========================================');
      console.log('[InitializationService] ✓ ALL INITIALIZATION STEPS COMPLETED');
      console.log('[InitializationService] ========================================');

      this.readySubject.next(true);
      this.errorSubject.next(null);
    } catch (error: any) {
      console.error('[InitializationService] ========================================');
      console.error('[InitializationService] ✗ INITIALIZATION FAILED');
      console.error('[InitializationService] Error:', error.message);
      console.error('[InitializationService] ========================================');

      this.errorSubject.next(error.message || 'Initialization failed');
      this.readySubject.next(false);

      throw error;
    }
  }

  isReady(): boolean {
    const ready = this.readySubject.value;
    console.log('[InitializationService] isReady() called, result:', ready);
    return ready;
  }

  getError(): string | null {
    return this.errorSubject.value;
  }
}
