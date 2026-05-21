import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, OnChanges, SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfig, PackageOption } from '../../models/booking.models';
import { WalletService } from '../../services/wallet.service';

export interface ConsultingPaymentResult {
  txHash:     string;
  walletAddr: string;
  pkgHours:   number;
}

@Component({
  selector: 'app-consulting-payment',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-title">Connect Wallet &amp; Pay</div>

      <div class="info-row" style="margin-bottom:.75rem">
        <span class="label">Package</span>
        <span class="value">{{ forcedPkg.label }}</span>
      </div>
      <div class="info-row" style="margin-bottom:.75rem">
        <span class="label">Amount</span>
        <span class="value" style="color:var(--accent)">{{ fmtWade(forcedPkg.price_wei) }}</span>
      </div>

      @if (result) {
        <div class="payment-status success">Payment confirmed. tx: {{ result.txHash.slice(0,16) }}...</div>
      } @else if (walletAddr) {
        <div class="wallet-row" style="margin-bottom:.75rem">
          <div class="wallet-address">{{ walletAddr }}</div>
        </div>
        <button class="btn btn-primary btn-full" [disabled]="busy" (click)="pay()">
          {{ busy ? status || 'Processing…' : 'Pay ' + fmtWade(forcedPkg.price_wei) }}
        </button>
        @if (status && !busy) { <div class="payment-status pending" style="margin-top:.5rem">{{ status }}</div> }
        @if (errMsg)           { <div class="payment-status error"  style="margin-top:.5rem">{{ errMsg }}</div> }
      } @else {
        <button class="btn btn-secondary btn-full" [disabled]="busy" (click)="connect()">
          {{ busy ? 'Connecting…' : 'Connect Mainnet Wallet' }}
        </button>
        @if (errMsg) { <div class="payment-status error" style="margin-top:.5rem">{{ errMsg }}</div> }
      }
    </div>
  `,
})
export class ConsultingPaymentComponent implements OnChanges {
  @Input() config!: AppConfig;
  @Input() forcedPkg!: PackageOption;
  @Output() paymentDone = new EventEmitter<ConsultingPaymentResult>();

  private wallet = inject(WalletService);
  private cdr    = inject(ChangeDetectorRef);

  walletAddr:  string | null = null;
  busy   = false;
  status: string | null = null;
  errMsg: string | null = null;
  result: ConsultingPaymentResult | null = null;

  ngOnChanges(c: SimpleChanges) {
    if (c['config'] || c['forcedPkg']) { this.walletAddr = null; this.result = null; this.errMsg = null; }
  }

  async connect() {
    if (!this.wallet.isAvailable()) {
      this.errMsg = 'MetaMask not detected. Please install the MetaMask extension.';
      this.cdr.markForCheck(); return;
    }
    this.busy = true; this.errMsg = null; this.cdr.markForCheck();
    try {
      const accounts = await this.wallet.requestAccounts();
      const chain    = await this.wallet.getChainId();
      if (chain !== this.config.mainnet_chain_id) await this.wallet.switchChain(this.config.mainnet_chain_id);
      this.walletAddr = accounts[0];
    } catch (e) { this.errMsg = this.wallet.getErrorMessage(e); }
    finally { this.busy = false; this.cdr.markForCheck(); }
  }

  async pay() {
    if (!this.walletAddr || !this.forcedPkg) return;
    this.busy = true; this.status = 'Awaiting wallet confirmation…'; this.errMsg = null; this.cdr.markForCheck();
    try {
      const txHash = await this.wallet.sendErc20Transfer(
        this.walletAddr,
        this.config.wadecoin_mainnet.contract_address,
        this.config.wadecoin_mainnet.owner_address,
        this.forcedPkg.price_wei,
      );
      this.status = 'Waiting for on-chain confirmation…'; this.cdr.markForCheck();
      try {
        const ok = await this.wallet.waitForReceipt(txHash, 30);
        if (ok) {
          this.result = { txHash, walletAddr: this.walletAddr, pkgHours: this.forcedPkg.hours };
          this.paymentDone.emit(this.result);
        } else {
          this.errMsg = 'Transaction reverted on-chain.';
        }
      } catch {
        this.result = { txHash, walletAddr: this.walletAddr, pkgHours: this.forcedPkg.hours };
        this.paymentDone.emit(this.result);
        this.status = `Tx submitted (${txHash.slice(0,10)}…). Confirmation pending.`;
      }
    } catch (e) { this.errMsg = this.wallet.getErrorMessage(e); }
    finally { this.busy = false; this.cdr.markForCheck(); }
  }

  fmtWade(wei: string): string { return this.wallet.formatWade(wei); }
}
