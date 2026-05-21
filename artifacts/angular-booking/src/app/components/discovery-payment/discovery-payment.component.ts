import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  ChangeDetectorRef, inject,
} from '@angular/core';
import { AppConfig } from '../../models/booking.models';
import { ApiService } from '../../services/api.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-discovery-payment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-title">Pay to Book</div>
      <p style="color:var(--muted);font-size:.84rem;margin-bottom:1rem">
        Discovery calls require a small WadeCoin testnet payment to confirm your spot.
        Use the faucet below if you need testnet WADE.
      </p>

      @if (txHash) {
        <div class="payment-status success">Payment confirmed. tx: {{ txHash.slice(0,16) }}...</div>
      } @else if (walletAddr) {
        <div class="wallet-row" style="margin-bottom:.75rem">
          <div class="wallet-address">{{ walletAddr }}</div>
        </div>
        <div class="wallet-row" style="gap:.5rem">
          <button class="btn btn-secondary btn-sm" [disabled]="busy" (click)="getFaucet()">
            {{ faucetStatus || 'Get Testnet WADE' }}
          </button>
          <button class="btn btn-primary btn-sm" [disabled]="busy" (click)="pay()">
            {{ busy ? 'Waiting...' : 'Pay ' + fmtAmt() + ' WADE' }}
          </button>
        </div>
        @if (status) { <div class="payment-status pending" style="margin-top:.5rem">{{ status }}</div> }
        @if (errMsg) { <div class="payment-status error"  style="margin-top:.5rem">{{ errMsg }}</div> }
      } @else {
        <button class="btn btn-secondary btn-full" [disabled]="busy" (click)="connect()">
          {{ busy ? 'Connecting...' : 'Connect Testnet Wallet' }}
        </button>
        @if (errMsg) { <div class="payment-status error" style="margin-top:.5rem">{{ errMsg }}</div> }
      }
    </div>
  `,
})
export class DiscoveryPaymentComponent {
  @Input() config!: AppConfig;
  @Input() txHash: string | null = null;
  @Output() paymentDone = new EventEmitter<string>();

  private api    = inject(ApiService);
  private wallet = inject(WalletService);
  private cdr    = inject(ChangeDetectorRef);

  walletAddr:   string | null = null;
  busy = false;
  status:       string | null = null;
  errMsg:       string | null = null;
  faucetStatus: string | null = null;

  fmtAmt(): string {
    return this.wallet.formatWade(this.config?.wadecoin_testnet?.payment_amount_wei).replace(' WADE', '');
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
      if (chain !== this.config.testnet_chain_id) await this.wallet.switchChain(this.config.testnet_chain_id);
      this.walletAddr = accounts[0];
    } catch (e) { this.errMsg = this.wallet.getErrorMessage(e); }
    finally { this.busy = false; this.cdr.markForCheck(); }
  }

  getFaucet() {
    if (!this.walletAddr) return;
    this.busy = true; this.faucetStatus = 'Requesting...'; this.cdr.markForCheck();
    this.api.requestFaucet(this.walletAddr).subscribe({
      next: r  => { this.faucetStatus = `Faucet tx: ${r.tx_hash.slice(0,10)}...`; this.busy = false; this.cdr.markForCheck(); },
      error: e => { this.errMsg = e?.error?.message ?? 'Faucet request failed.'; this.busy = false; this.cdr.markForCheck(); },
    });
  }

  async pay() {
    if (!this.walletAddr) return;
    this.busy = true; this.status = 'Awaiting wallet confirmation...'; this.errMsg = null; this.cdr.markForCheck();
    try {
      const txHash = await this.wallet.sendErc20Transfer(
        this.walletAddr,
        this.config.wadecoin_testnet.contract_address,
        this.config.wadecoin_testnet.owner_address,
        this.config.wadecoin_testnet.payment_amount_wei!,
      );
      this.status = 'Waiting for on-chain confirmation...'; this.cdr.markForCheck();
      try {
        const ok = await this.wallet.waitForReceipt(txHash, 30);
        if (ok) { this.status = 'Payment confirmed!'; this.paymentDone.emit(txHash); }
        else      this.errMsg = 'Transaction reverted on-chain.';
      } catch {
        this.status = `Tx submitted (${txHash.slice(0,10)}...). Confirmation pending.`;
        this.paymentDone.emit(txHash);
      }
    } catch (e) { this.errMsg = this.wallet.getErrorMessage(e); }
    finally { this.busy = false; this.cdr.markForCheck(); }
  }
}
