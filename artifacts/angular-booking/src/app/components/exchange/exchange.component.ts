import {
  Component, OnInit, signal, inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, ExchangeRate } from '../../services/api.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-exchange',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section-sm">
      <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:.35rem;letter-spacing:-.02em">
        WadeCoin Exchange
      </h2>
      <p style="color:var(--muted);font-size:.88rem;margin-bottom:1.5rem">
        Acquire WADE tokens at a fixed rate. Each WADE entitles the holder to one hour of consulting.
        Redeem any time, supply permitting.
      </p>

      <!-- Rate card -->
      <div class="exchange-card">
        <div class="exchange-rate">
          <div class="rate-big">1 WADE</div>
          <div style="color:var(--muted);font-size:1.3rem;margin:.2rem 0">=</div>
          <div class="rate-big" style="color:var(--text)">0.1 ETH</div>
          <div class="rate-label" style="margin-top:.5rem">
            Rate set at contract deployment ·
            @if (rate()) {
              <span style="color:var(--accent)">{{ rate()!.network.toUpperCase() }}</span>
            } @else {
              <span>loading…</span>
            }
          </div>
        </div>

        <!-- Exchange form -->
        <div class="exchange-form">
          <div class="amount-row">
            <div>
              <div class="amount-label">You send (ETH)</div>
              <div class="amount-input">
                <input type="number" min="0.1" step="0.1"
                  [ngModel]="ethAmount()" (ngModelChange)="setEth($event)"
                  placeholder="0.1" />
              </div>
            </div>
            <div class="amount-divider"><span class="material-icons">arrow_forward</span></div>
            <div>
              <div class="amount-label">You receive (WADE)</div>
              <div class="amount-input">
                <input type="number" min="1" step="1"
                  [ngModel]="wadeAmount()" (ngModelChange)="setWade($event)"
                  placeholder="1" />
              </div>
            </div>
          </div>

          <div style="color:var(--muted);font-size:.78rem;text-align:center">
            ≈ {{ ethAmount() || 0 }} ETH → {{ wadeAmount() || 0 }} WADE
            · Min purchase: 1 WADE (0.1 ETH)
          </div>

          @if (!walletAddr()) {
            <button class="btn btn-secondary btn-full" [disabled]="connecting()" (click)="connect()">
              {{ connecting() ? 'Connecting…' : 'Connect Wallet to Simulate' }}
            </button>
          } @else {
            <div class="wallet-address" style="margin-bottom:.5rem">{{ walletAddr() }}</div>
            <button class="btn btn-primary btn-full" [disabled]="simulating() || !wadeAmount()" (click)="simulate()">
              {{ simulating() ? 'Recording…' : 'Simulate Purchase (Demo)' }}
            </button>
          }

          @if (errMsg()) { <div class="payment-status error">{{ errMsg() }}</div> }
          @if (successMsg()) { <div class="payment-status success">{{ successMsg() }}</div> }
        </div>
      </div>

      <!-- How it will work -->
      <div class="prose-card" style="margin-top:1rem">
        <div class="card-icon-wrap"><span class="card-icon material-icons">info</span></div>
        <div class="card-body">
        <h3>How it'll work (when deployed)</h3>
        <p>
          The WadeCoin smart contract will accept ETH at a fixed rate and mint WADE tokens directly to your wallet.
          On-chain. Trustless. Wade gets the ETH, you get the WADE, and the blockchain gets bragging rights.
        </p>
        <p style="margin-top:.65rem">
          Consulting bookings will require a WADE payment on mainnet, verified on-chain before the calendar slot unlocks.
          If you're a stickler for non-custodial time management, <em>this one's for you.</em>
        </p>
        </div>
      </div>
    </div>
  `,
})
export class ExchangeComponent implements OnInit {
  private api    = inject(ApiService);
  private wallet = inject(WalletService);

  rate       = signal<ExchangeRate | null>(null);
  walletAddr = signal<string | null>(null);
  connecting = signal(false);
  simulating = signal(false);
  errMsg     = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  ethAmount  = signal<number>(0.1);
  wadeAmount = signal<number>(1);

  setEth(v: number) {
    this.ethAmount.set(v ?? 0);
    this.wadeAmount.set(Math.round((v ?? 0) / 0.1));
  }
  setWade(v: number) {
    this.wadeAmount.set(v ?? 0);
    this.ethAmount.set(parseFloat(((v ?? 0) * 0.1).toFixed(4)));
  }

  ngOnInit() {
    this.api.getExchangeRate().subscribe({
      next: r  => { this.rate.set(r); },
      error: () => {},
    });
  }

  async connect() {
    if (!this.wallet.isAvailable()) {
      this.errMsg.set('MetaMask not detected. Install the extension to continue.');
      return;
    }
    this.connecting.set(true); this.errMsg.set(null);
    try {
      const accounts = await this.wallet.requestAccounts();
      this.walletAddr.set(accounts[0]);
    } catch (e) { this.errMsg.set(this.wallet.getErrorMessage(e)); }
    finally { this.connecting.set(false); }
  }

  simulate() {
    const addr = this.walletAddr();
    const wade = this.wadeAmount();
    if (!addr || !wade) return;

    const ethWei = BigInt(Math.round(wade * 0.1 * 1e18)).toString();
    this.simulating.set(true); this.errMsg.set(null); this.successMsg.set(null);

    this.api.simulateExchange(addr, String(wade), ethWei).subscribe({
      next: r => {
        this.successMsg.set(`Recorded: ${wade} WADE for ${this.ethAmount()} ETH. ${r.message}`);
        this.simulating.set(false);
      },
      error: e => {
        this.errMsg.set(e?.error?.message ?? 'Simulation failed.');
        this.simulating.set(false);
      },
    });
  }
}
