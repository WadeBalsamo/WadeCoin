import {
  Component, OnInit, signal, computed, inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { ApiService } from '../../services/api.service';
import { AppConfig, FormData, BookingMode, PackageOption, Slot } from '../../models/booking.models';
import { ModeSelectorComponent } from '../mode-selector/mode-selector.component';
import { UserFormComponent } from '../user-form/user-form.component';
import { DiscoveryPaymentComponent } from '../discovery-payment/discovery-payment.component';
import {
  ConsultingPaymentComponent,
  ConsultingPaymentResult,
} from '../consulting-payment/consulting-payment.component';
import { SlotPickerComponent } from '../slot-picker/slot-picker.component';

@Component({
  selector: 'app-book',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModeSelectorComponent,
    UserFormComponent,
    DiscoveryPaymentComponent,
    ConsultingPaymentComponent,
    SlotPickerComponent,
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

            <div class="step-label">Step 1 — Pick a Time</div>
            @if (calendarConfigured()) {
              <app-slot-picker [durationMinutes]="30" (slotSelected)="selectedSlot.set($event)" />
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
                  <div>
                    <button
                      class="btn"
                      [class.btn-primary]="consPackage()?.hours === p.hours"
                      [class.btn-secondary]="consPackage()?.hours !== p.hours"
                      style="text-align:left;width:100%"
                      (click)="consPackage.set(p)">
                      <strong>{{ p.label }}</strong>
                      <span style="float:right;color:var(--muted)">{{ fmtWade(p.price_wei) }}</span>
                    </button>
                    @if (p.allowed_start_hours && p.allowed_start_hours.length > 0) {
                      <div style="font-size:.75rem;color:var(--muted);margin-top:.2rem;padding:0 .5rem">
                        Available: {{ formatAvailableHours(p.allowed_start_hours) }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            @if (consPackage()) {

              <div class="step-label">Step 2 — Pick a Time</div>
              @if (calendarConfigured()) {
                <app-slot-picker
                  [durationMinutes]="consPackage()!.hours * 60"
                  [allowedStartHours]="consPackage()!.allowed_start_hours"
                  (slotSelected)="selectedSlot.set($event)" />
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
  selectedSlot = signal<Slot | null>(null);

  // True when the config loaded successfully — the slot picker will surface
  // its own error if GOOGLE_CALENDAR_ID / service account aren't configured.
  calendarConfigured = computed(() => !!this.config());

  canSubmitDiscovery = computed(() => {
    if (!this.discTxHash()) return false;
    const f = this.form();
    if (!f.name.trim() || !f.email.includes('@')) return false;
    if (this.calendarConfigured() && !this.selectedSlot()) return false;
    return true;
  });

  canSubmitConsulting = computed(() => {
    const f = this.form();
    if (!f.name.trim() || !f.email.includes('@')) return false;
    if (!this.consPayment()) return false;
    if (this.calendarConfigured() && !this.selectedSlot()) return false;
    return true;
  });

  ngOnInit() {
    this.configSvc.getConfig().subscribe({
      next:  cfg => { this.config.set(cfg); },
      error: err => { this.configError.set(err?.error?.message ?? err?.message ?? 'Network error'); },
    });
  }

  setMode(m: BookingMode) {
    this.mode.set(m);
    this.form.set({ name: '', email: '', notes: '', packageHours: null });
    this.consPackage.set(null);
    this.consPayment.set(null);
    this.discTxHash.set(null);
    this.selectedSlot.set(null);
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

  formatAvailableHours(hours: number[]): string {
    const sorted = [...hours].sort((a, b) => a - b);
    const formatted = sorted.map(h => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}${ampm}`;
    });
    return formatted.join(' or ');
  }

  submit() {
    const f = this.form(), m = this.mode();
    if (!m) return;
    this.submitting.set(true); this.submitError.set(null);

    const slot = this.selectedSlot();

    if (m === 'discovery') {
      this.apiSvc.createBooking({
        user_name:       f.name.trim(),
        user_email:      f.email.trim(),
        notes:           f.notes.trim() || undefined,
        mode:            m,
        payment_tx_hash: this.discTxHash() ?? undefined,
        slot_start_utc:  slot?.start_utc,
        slot_end_utc:    slot?.end_utc,
      }).subscribe({
        next:  r => { this.done.set({ id: r.booking_id, msg: r.message }); this.submitting.set(false); },
        error: e => { this.submitError.set(e?.error?.message ?? 'Booking failed. Please try again.'); this.submitting.set(false); },
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
        slot_start_utc:  slot?.start_utc,
        slot_end_utc:    slot?.end_utc,
      }).subscribe({
        next:  r => { this.done.set({ id: r.booking_id, msg: r.message }); this.submitting.set(false); },
        error: e => { this.submitError.set(e?.error?.message ?? 'Booking failed. Please try again.'); this.submitting.set(false); },
      });
    }
  }

  reset() {
    this.mode.set(null);
    this.form.set({ name: '', email: '', notes: '', packageHours: null });
    this.consPackage.set(null); this.consPayment.set(null);
    this.discTxHash.set(null);
    this.selectedSlot.set(null);
    this.submitError.set(null); this.done.set(null);
  }
}
