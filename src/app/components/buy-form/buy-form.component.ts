import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContractService } from '../../services/contract.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-buy-form',
  templateUrl: './buy-form.component.html',
  styleUrls: ['./buy-form.component.scss']
})
export class BuyFormComponent implements OnInit, OnDestroy {
  buyForm: FormGroup;
  loading$ = this.dataService.loading$;
  error: string | null = null;
  estimatedGas: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private contractService: ContractService,
    private dataService: DataService
  ) {
    console.log('[BuyFormComponent] Constructor called');

    this.buyForm = this.fb.group({
      amount: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,18})?$/),
          Validators.min(0)
        ]
      ]
    });

    console.log('[BuyFormComponent] Form group created');
  }

  ngOnInit(): void {
    console.log('[BuyFormComponent] ngOnInit - component initialized');

    this.buyForm.get('amount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        console.log('[BuyFormComponent] Amount changed to:', value);

        if (value && value > 0) {
          console.log('[BuyFormComponent] Estimating gas for amount:', value);
          this.estimateGas(value);
        } else {
          console.log('[BuyFormComponent] Amount is invalid, clearing gas estimate');
          this.estimatedGas = null;
        }
      });
  }

  private estimateGas(amount: string): void {
    this.contractService
      .estimateGas(amount)
      .then((gas) => {
        console.log('[BuyFormComponent] Gas estimate received:', gas);
        this.estimatedGas = gas;
      })
      .catch((error) => {
        console.warn('[BuyFormComponent] Gas estimation failed:', error);
        this.estimatedGas = null;
      });
  }

  async onBuy(): Promise<void> {
    console.log('[BuyFormComponent] Buy button clicked');

    if (this.buyForm.invalid) {
      console.warn('[BuyFormComponent] Form is invalid, cannot submit');
      console.log('[BuyFormComponent] Form errors:', this.buyForm.errors);
      return;
    }

    const amount = this.buyForm.get('amount')?.value;
    console.log('[BuyFormComponent] Submitting buy for amount:', amount);

    this.error = null;
    this.dataService.setLoading(true);

    try {
      console.log('[BuyFormComponent] Calling contract.buy()...');
      const tx = await this.contractService.buy(amount);

      console.log('[BuyFormComponent] Transaction received:', tx?.hash);

      if (tx) {
        console.log('[BuyFormComponent] Adding transaction to history');
        this.dataService.addTransaction({
          hash: tx.hash || 'unknown',
          amount: amount,
          type: 'buy',
          timestamp: Date.now(),
          status: 'pending'
        });

        console.log('[BuyFormComponent] Resetting form');
        this.buyForm.reset();

        console.log('[BuyFormComponent] ✓ Buy successful');
      } else {
        console.error('[BuyFormComponent] Transaction was null');
        this.error = 'Transaction failed';
      }
    } catch (error: any) {
      console.error('[BuyFormComponent] Buy failed:', error.message);
      console.error('[BuyFormComponent] Full error:', error);

      this.error = error.message || 'Transaction failed';

      if (error.code === 'INSUFFICIENT_FUNDS') {
        console.warn('[BuyFormComponent] User has insufficient ETH');
        this.error = 'Insufficient ETH balance';
      } else if (error.code === 'USER_REJECTED') {
        console.log('[BuyFormComponent] User rejected the transaction');
        this.error = 'Transaction rejected';
      }
    } finally {
      console.log('[BuyFormComponent] Setting loading to false');
      this.dataService.setLoading(false);
    }
  }

  ngOnDestroy(): void {
    console.log('[BuyFormComponent] Component destroyed, cleaning up subscriptions');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
