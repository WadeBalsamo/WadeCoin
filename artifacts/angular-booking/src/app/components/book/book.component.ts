import {
  Component, OnInit, signal, computed, inject,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConfigService } from '../../services/config.service';
import { ApiService } from '../../services/api.service';
import { AppConfig, FormData, BookingMode, PackageOption } from '../../models/booking.models';
import { ModeSelectorComponent } from '../mode-selector/mode-selector.component';
import { UserFormComponent } from '../user-form/user-form.component';
import { DiscoveryPaymentComponent } from '../discovery-payment/discovery-payment.component';
import {
  ConsultingPaymentComponent,
  ConsultingPaymentResult,
} from '../consulting-payment/consulting-payment.component';

@Component({
  selector: 'app-book',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModeSelectorComponent,
    UserFormComponent,
    DiscoveryPaymentComponent,
    ConsultingPaymentComponent,
  ],
  template: `
    <div class="section-sm">
      <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:.3rem;letter-spacing:-.02em">Book a Session</h2>
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:1.5rem">
        Discovery calls require a small testnet WADE payment.
        Consulting sessions require a WADE payment on mainnet.
      </p>

      @if (configError()) {
        <div class="error-banner">Configuration error: {{ configError() }}</div>
      } @else if (!config()) {
        <div class="loading">Loading configuration...</div>
      } @else if (done()) {
        <div class="success-banner">
          <strong>Booking confirmed!</strong>
          Reference: {{ done()!.id }}<br />
          <span style="font-size:.83rem;opacity:.8">{{ done()!.msg }}</span>
          <br /><span style="font-size:.78rem;color:var(--muted);margin-top:.3rem;display:block">
            Wade will be in touch to confirm the time.
          </span>
        </div>
        <button class="btn btn-secondary btn-full" style="margin-top:1rem" (click)="reset()">
          Book another session
        </button>
      } @else {

        <app-mode-selector [selected]="mode()" (modeSelected)="setMode($event)" />

        @if (mode()) {

          <!-- ══════════════ DISCOVERY ══════════════ -->
          @if (mode() === 'discovery') {

            <div class="step-label">Step 1 — Check Availability</div>
            @if (calendarEmbedUrl()) {
              <div class="card" style="padding:0;overflow:hidden">
                <iframe
                  [src]="calendarEmbedUrl()!"
                  style="width:100%;height:500px;border:none;display:block"
                  frameborder="0"
                  scrolling="no">
                </iframe>
              </div>
            } @else {
              <div class="card">
                <div class="card-title">Pick a Time</div>
                <p style="color:var(--muted);font-size:.85rem">
                  Include your preferred date and time in the notes below.
                  Wade will confirm availability and send a calendar invite.
                </p>
              </div>
            }

            <div class="step-label">Step 2 — Your Details &amp; Inquiry</div>
            <app-user-form [data]="form()" [showPackage]="false" (dataChange)="form.set($event)" />

            <div class="step-label">Step 3 — Pay to Confirm Your Spot</div>
            <app-discovery-payment
              [config]="config()!"
              [txHash]="discTxHash()"
              (paymentDone)="discTxHash.set($event)" />

            @if (submitError()) { <div class="error-banner">{{ submitError() }}</div> }
            <button class="btn btn-primary btn-full"
              [disabled]="!canSubmitDiscovery() || submitting()" (click)="submit()">
              {{ submitting() ? 'Booking...' : 'Confirm Discovery Call' }}
            </button>
          }

          <!-- ══════════════ CONSULTING ══════════════ -->
          @if (mode() === 'consulting') {

            <div class="step-label">Step 1 — Select a Package</div>
            <div class="card">
              <div class="card-title">Choose your package</div>
              <div style="display:flex;flex-direction:column;gap:.5rem;margin-top:.25rem">
                @for (p of config()!.package_options; track p.hours) {
                  <button
                    class="btn"
                    [class.btn-primary]="consPackage()?.hours === p.hours"
                    [class.btn-secondary]="consPackage()?.hours !== p.hours"
                    style="text-align:left"
                    (click)="consPackage.set(p)">
                    <strong>{{ p.label }}</strong>
                    <span style="float:right;color:var(--muted)">{{ fmtWade(p.price_wei) }}</span>
                  </button>
                }
              </div>
            </div>

            @if (consPackage()) {

              <div class="step-label">Step 2 — Check Availability</div>
              @if (calendarEmbedUrl()) {
                <div class="card" style="padding:0;overflow:hidden">
                  <iframe
                    [src]="calendarEmbedUrl()!"
                    style="width:100%;height:500px;border:none;display:block"
                    frameborder="0"
                    scrolling="no">
                  </iframe>
                </div>
              } @else {
                <div class="card">
                  <div class="card-title">Pick a Time</div>
                  <p style="color:var(--muted);font-size:.85rem">
                    Include your preferred date and time in the notes below.
                    Wade will confirm availability and send a calendar invite.
                  </p>
                </div>
              }

              <div class="step-label">Step 3 — Your Details &amp; Inquiry</div>
              <app-user-form [data]="form()" [showPackage]="false" (dataChange)="form.set($event)" />

              <div class="step-label">Step 4 — Connect Wallet &amp; Pay</div>
              <app-consulting-payment
                [config]="config()!"
                [forcedPkg]="consPackage()!"
                (paymentDone)="onConsPaid($event)" />

              @if (submitError()) { <div class="error-banner">{{ submitError() }}</div> }
              <button class="btn btn-primary btn-full"
                [disabled]="!canSubmitConsulting() || submitting()" (click)="submit()">
                {{ submitting() ? 'Booking...' : 'Confirm Booking' }}
              </button>
            }
          }

        }
      }
    </div>
  `,
  styles: [`
    .step-label {
      font-size: .78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--muted);
      margin: 1.25rem 0 .5rem;
    }
  `],
})
export class BookComponent implements OnInit {
  private configSvc = inject(ConfigService);
  private apiSvc    = inject(ApiService);
  private cdr       = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  config      = signal<AppConfig | null>(null);
  configError = signal<string | null>(null);
  mode        = signal<BookingMode | null>(null);
  consPackage = signal<PackageOption | null>(null);
  consPayment = signal<ConsultingPaymentResult | null>(null);
  form        = signal<FormData>({ name: '', email: '', notes: '', packageHours: null });
  discTxHash  = signal<string | null>(null);
  submitting  = signal(false);
  submitError = signal<string | null>(null);
  done        = signal<{ id: string; msg: string } | null>(null);

  calendarEmbedUrl = computed((): SafeResourceUrl | null => {
    const url = this.config()?.google_calendar_appointment_url;
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  canSubmitDiscovery = computed(() => {
    if (!this.discTxHash()) return false;
    const f = this.form();
    return !!(f.name.trim() && f.email.includes('@'));
  });

  canSubmitConsulting = computed(() => {
    const f = this.form();
    if (!f.name.trim() || !f.email.includes('@')) return false;
    return !!this.consPayment();
  });

  ngOnInit() {
    this.configSvc.getConfig().subscribe({
      next:  cfg => { this.config.set(cfg); this.cdr.markForCheck(); },
      error: err => { this.configError.set(err?.error?.message ?? err?.message ?? 'Network error'); this.cdr.markForCheck(); },
    });
  }

  setMode(m: BookingMode) {
    this.mode.set(m);
    this.form.set({ name: '', email: '', notes: '', packageHours: null });
    this.consPackage.set(null);
    this.consPayment.set(null);
    this.discTxHash.set(null);
    this.submitError.set(null);
  }

  onConsPaid(r: ConsultingPaymentResult) { this.consPayment.set(r); }

  fmtWade(wei: string): string {
    try {
      const n = BigInt(wei);
      const w = n / BigInt('1000000000000000000');
      const f = n % BigInt('1000000000000000000');
      if (f === 0n) return `${w} WADE`;
      return `${w}.${f.toString().padStart(18, '0').replace(/0+$/, '')} WADE`;
    } catch { return '? WADE'; }
  }

  submit() {
    const f = this.form(), m = this.mode();
    if (!m) return;
    this.submitting.set(true); this.submitError.set(null);

    if (m === 'discovery') {
      this.apiSvc.createBooking({
        user_name:       f.name.trim(),
        user_email:      f.email.trim(),
        notes:           f.notes.trim() || undefined,
        mode:            m,
        payment_tx_hash: this.discTxHash() ?? undefined,
      }).subscribe({
        next:  r => { this.done.set({ id: r.booking_id, msg: r.message }); this.submitting.set(false); this.cdr.markForCheck(); },
        error: e => { this.submitError.set(e?.error?.message ?? 'Booking failed. Please try again.'); this.submitting.set(false); this.cdr.markForCheck(); },
      });
    } else {
      this.apiSvc.createBooking({
        user_name:       f.name.trim(),
        user_email:      f.email.trim(),
        notes:           f.notes.trim() || undefined,
        mode:            m,
        payment_tx_hash: this.consPayment()?.txHash ?? undefined,
        package_hours:   this.consPayment()?.pkgHours ?? undefined,
        user_address:    this.consPayment()?.walletAddr ?? undefined,
      }).subscribe({
        next:  r => { this.done.set({ id: r.booking_id, msg: r.message }); this.submitting.set(false); this.cdr.markForCheck(); },
        error: e => { this.submitError.set(e?.error?.message ?? 'Booking failed. Please try again.'); this.submitting.set(false); this.cdr.markForCheck(); },
      });
    }
  }

  reset() {
    this.mode.set(null);
    this.form.set({ name: '', email: '', notes: '', packageHours: null });
    this.consPackage.set(null); this.consPayment.set(null);
    this.discTxHash.set(null);
    this.submitError.set(null); this.done.set(null);
  }
}
