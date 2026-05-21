import {
  Component, OnInit, signal, inject,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { ApiService, TransactionLog, RecentBooking } from '../../services/api.service';

@Component({
  selector: 'app-activity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section">
      <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:.3rem;letter-spacing:-.02em">Activity Log</h2>
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:1.5rem">
        All form submissions, bookings, and simulated exchange attempts. Every interaction recorded.
      </p>

      @if (loading()) {
        <div class="loading">Loading activity…</div>
      } @else if (error()) {
        <div class="error-banner">{{ error() }}</div>
      } @else {

        <!-- Recent bookings -->
        <div class="card">
          <div class="card-title">Recent Bookings ({{ bookings().length }})</div>
          @if (bookings().length === 0) {
            <div style="color:var(--muted);font-size:.85rem">No bookings yet. Be the first.</div>
          } @else {
            <table class="activity-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mode</th>
                  <th>Payment</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                @for (b of bookings(); track b.id) {
                  <tr>
                    <td>{{ b.user_name }}</td>
                    <td>
                      <span class="event-badge" [class.booking]="true">
                        {{ b.mode === 'discovery' ? 'Discovery' : 'Consulting' }}
                      </span>
                    </td>
                    <td style="color:var(--muted)">{{ b.has_payment ? 'WADE paid' : 'No payment' }}</td>
                    <td class="mono">{{ fmtTime(b.created_at) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <!-- Transaction log -->
        <div class="card">
          <div class="card-title">Transaction Log ({{ logs().length }})</div>
          @if (logs().length === 0) {
            <div style="color:var(--muted);font-size:.85rem">No transactions recorded yet.</div>
          } @else {
            <table class="activity-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Who</th>
                  <th>Tx / Notes</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logs(); track log.id) {
                  <tr>
                    <td>
                      <span class="event-badge" [class]="badgeClass(log.event_type)">
                        {{ eventLabel(log.event_type) }}
                      </span>
                    </td>
                    <td>{{ log.user_name || truncate(log.wallet_address) || '-' }}</td>
                    <td class="mono">{{ truncate(log.tx_hash) || briefNotes(log.notes) || '-' }}</td>
                    <td class="mono">{{ fmtTime(log.created_at) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

      }

      <div style="text-align:center;margin-top:1rem">
        <button class="btn btn-secondary btn-sm" [disabled]="loading()" (click)="load()">
          Refresh
        </button>
      </div>
    </div>
  `,
})
export class ActivityComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  loading  = signal(true);
  error    = signal<string | null>(null);
  logs     = signal<TransactionLog[]>([]);
  bookings = signal<RecentBooking[]>([]);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true); this.error.set(null); this.cdr.markForCheck();
    this.api.getLogs().subscribe({
      next: r => {
        this.logs.set(r.logs);
        this.bookings.set(r.bookings);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: e => {
        this.error.set(e?.error?.message ?? 'Failed to load activity log.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  fmtTime(iso: string): string {
    try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }

  truncate(s: string | null): string {
    if (!s) return '';
    return s.length > 16 ? s.slice(0, 10) + '…' : s;
  }

  briefNotes(notes: string | null): string {
    if (!notes) return '';
    try {
      const parsed = JSON.parse(notes);
      return parsed.status || parsed.wade_requested ? `${parsed.wade_requested} WADE` : '';
    } catch { return notes.slice(0, 20); }
  }

  badgeClass(type: string): string {
    if (type === 'booking_created') return 'booking';
    if (type === 'exchange_attempt') return 'exchange';
    if (type === 'faucet_drip') return 'faucet';
    return 'booking';
  }

  eventLabel(type: string): string {
    const labels: Record<string, string> = {
      booking_created: 'Booking',
      exchange_attempt: 'Exchange',
      faucet_drip: 'Faucet',
    };
    return labels[type] ?? type;
  }
}
