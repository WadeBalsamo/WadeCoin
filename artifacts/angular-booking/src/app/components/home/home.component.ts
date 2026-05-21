import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";

@Component({
  selector: "app-home",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hero">
      <h1><span class="accent">Wade</span>Coin</h1>
      <p class="hero-sub">
        A token backed by engineering time. Buy WADE now, redeem it for hands-on
        work whenever you need it.
      </p>
      <div class="hero-actions">
        <button
          class="btn btn-primary btn-lg mat-ripple"
          (click)="goBook.emit()"
        >
          Book a Session
        </button>
        <button class="btn btn-outlined btn-lg" (click)="goExchange.emit()">
          View Exchange
        </button>
      </div>
    </div>

    <div class="section">
      <div class="thesis-note">
        <span class="thesis-icon material-icons">warning</span>
        <span>
          <strong>Not deployed.</strong> The smart contracts are still on
          testnet, which is genuinely the whole point. The thesis here is that
          the value of my time a year from now is uncertain enough to be
          worth pricing in. If I knew exactly how available I'd be, this would
          just be a calendar app.
        </span>
      </div>

      <div class="prose-grid">
        <div class="prose-card mat-elevation-1">
          <div class="card-icon-wrap">
            <span class="card-icon material-icons">token</span>
          </div>
          <div class="card-body">
            <h3>What is WadeCoin &amp; why futures?</h3>
            <p>
              WadeCoin (<em>$WADE</em>) is an ERC-20 token where each token
              equals one hour of consulting work. It trades like a futures
              contract. If you know you'll need Wade's help in Q3, you
              can lock in today's rate rather than negotiating later when
              availability is tighter. The token is on-chain, the commitment is
              real, and the pricing reflects actual supply.
            </p>
          </div>
        </div>

        <div class="prose-card mat-elevation-1">
          <div class="card-icon-wrap">
            <span class="card-icon material-icons">support_agent</span>
          </div>
          <div class="card-body">
            <h3>Discovery &amp; Consulting</h3>
            <p>
              Start with a 30-minute discovery call. A small testnet WADE
              deposit holds your slot while we figure out scope and fit. Once
              that's done, full consulting sessions run 60 minutes and are paid
              in WADE on mainnet. Both options use the same booking flow; the
              token requirement just reflects how far along we are.
            </p>
          </div>
        </div>

        <div class="prose-card prose-card--wide mat-elevation-1">
          <div class="card-icon-wrap">
            <span class="card-icon material-icons">developer_mode</span>
          </div>
          <div class="card-body">
            <h3>The Stack</h3>
            <div class="stack-row">
              <span class="badge angular">Angular 17</span>
              <span class="badge solidity">Solidity 0.4</span>
              <span class="badge ts">TypeScript</span>
              <span class="badge eth">Ethereum / EVM</span>
              <span class="badge pg">PostgreSQL</span>
              <span class="badge ts">Express</span>
              <span class="badge ts">Vite</span>
            </div>
            <p style="margin-top:.85rem">
              <strong>Frontend:</strong> Angular 17 uses <em>signals</em> for
              fine-grained reactivity alongside standalone components and
              <em>OnPush</em> change detection, so the framework only re-renders
              what actually changed. The classic Angular CLI webpack pipeline
              has been replaced by <em>Vite</em>, which serves ES modules
              natively and delivers near-instant HMR during development.
            </p>
            <p style="margin-top:.6rem">
              <strong>Backend &amp; data:</strong> A
              <em>TypeScript/Express</em> REST API validates session requests,
              manages availability, and persists bookings in
              <em>PostgreSQL</em>. It also integrates with Google Calendar so
              confirmed slots are automatically blocked on the calendar.
            </p>
            <p style="margin-top:.6rem">
              <strong>Contracts:</strong> The <em>Solidity 0.5</em> ERC-20
              contracts to implement the WADE token and a lightweight exchange
              mechanism with on-chain price discovery. Deployment deferred until
              tokenomics can be calculated. Burning 40 WadeCoin/week. Max
              Supply 75k ? This project got too existential; how many hours are there
              in my career? I should choose to spend them wisely, not just to
              the highest bidder. This exchange is a placeholder for now. 
            </p>
          </div>
        </div>
      </div>

      <div class="cta-row">
        <button
          class="btn btn-primary btn-lg mat-ripple"
          (click)="goBook.emit()"
        >
          Book 30 Minutes
        </button>
      </div>
    </div>
  `,
})
export class HomeComponent {
  @Output() goBook = new EventEmitter<void>();
  @Output() goExchange = new EventEmitter<void>();
}
