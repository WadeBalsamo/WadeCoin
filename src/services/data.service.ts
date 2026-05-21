import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, shareReplay, catchError } from 'rxjs/operators';
import { WalletService } from './wallet.service';
import { of } from 'rxjs';

interface Transaction {
  hash: string;
  amount: string;
  type: 'buy' | 'sell';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private balanceSubject = new BehaviorSubject<string>('0');
  balance$ = this.balanceSubject.asObservable();

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private walletService: WalletService) {
    console.log('[DataService] Initializing data service');
    this.startPolling();
  }

  private startPolling(): void {
    console.log('[DataService] Starting balance polling...');
    console.log('[DataService] Poll interval: 5000ms');

    const pollInterval = 5000;
    let pollCount = 0;

    timer(0, pollInterval)
      .pipe(
        switchMap(() => {
          pollCount++;
          console.log('[DataService] Poll #' + pollCount + ' triggered');

          return this.fetchBalance();
        }),
        catchError((error) => {
          console.error('[DataService] Polling error:', error);
          return of('0');
        }),
        shareReplay(1)
      )
      .subscribe(
        (balance) => {
          console.log('[DataService] Poll #' + pollCount + ' received balance:', balance);
          this.balanceSubject.next(balance);
        },
        (error) => {
          console.error('[DataService] Subscription error:', error);
        }
      );
  }

  private fetchBalance(): Observable<string> {
    console.log('[DataService] Fetching balance from wallet service...');

    return new Observable((observer) => {
      this.walletService
        .getBalance()
        .then((balance) => {
          console.log('[DataService] Balance fetch successful:', balance);
          observer.next(balance);
          observer.complete();
        })
        .catch((error) => {
          console.error('[DataService] Balance fetch failed:', error);
          observer.error(error);
        });
    });
  }

  addTransaction(tx: Transaction): void {
    console.log('[DataService] Adding transaction:', tx.hash);
    console.log('[DataService] Type:', tx.type, 'Amount:', tx.amount);

    const current = this.transactionsSubject.value;
    const updated = [tx, ...current];

    console.log('[DataService] Transaction list now has', updated.length, 'items');
    this.transactionsSubject.next(updated);
  }

  updateTransactionStatus(hash: string, status: 'confirmed' | 'failed'): void {
    console.log('[DataService] Updating transaction', hash, 'to status:', status);

    const current = this.transactionsSubject.value;
    const updated = current.map((tx) => {
      if (tx.hash === hash) {
        console.log('[DataService] Found matching transaction, updating status');
        return { ...tx, status };
      }
      return tx;
    });

    this.transactionsSubject.next(updated);
  }

  setLoading(loading: boolean): void {
    console.log('[DataService] Setting loading state:', loading);
    this.loadingSubject.next(loading);
  }

  getBalance(): Observable<string> {
    console.log('[DataService] getBalance() called by component');
    return this.balance$;
  }
}
