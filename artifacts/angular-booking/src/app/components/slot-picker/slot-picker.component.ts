import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  SimpleChanges, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Slot } from '../../models/booking.models';

interface SlotDay {
  date: string;
  label: string;
  slots: Slot[];
}

@Component({
  selector: 'app-slot-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-title">Pick a Time</div>

      @if (loading()) {
        <div style="color:var(--muted);font-size:.85rem;padding:.5rem 0">Loading available slots…</div>
      } @else if (error()) {
        <div class="error-banner">{{ error() }}</div>
      } @else if (days().length === 0) {
        <div style="color:var(--muted);font-size:.85rem;padding:.5rem 0">
          No available slots in the next two weeks. Please check back soon or include your preferred time in the notes below.
        </div>
      } @else {
        <div style="display:flex;gap:.5rem;overflow-x:auto;padding:.25rem 0 .5rem;flex-wrap:nowrap">
          @for (day of days(); track day.date) {
            <button
              class="day-tab"
              [class.active]="selectedDate() === day.date"
              (click)="selectedDate.set(day.date)">
              {{ day.label }}
            </button>
          }
        </div>

        @if (slotsForDay().length > 0) {
          <div class="slot-grid">
            @for (slot of slotsForDay(); track slot.id) {
              <button
                class="slot-btn"
                [class.selected]="selected()?.id === slot.id"
                (click)="selectSlot(slot)">
                {{ formatTime(slot.start_utc) }}
              </button>
            }
          </div>
        }

        @if (selected()) {
          <div style="margin-top:.75rem;font-size:.82rem;color:var(--muted)">
            Selected: <strong style="color:var(--fg)">{{ formatDateTime(selected()!.start_utc) }}</strong>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .day-tab {
      flex-shrink: 0;
      padding: .35rem .75rem;
      border-radius: 6px;
      border: 1px solid var(--border, #333);
      background: transparent;
      color: var(--muted, #888);
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s, color .15s;
    }
    .day-tab.active, .day-tab:hover {
      background: var(--accent, #7c4dff);
      color: #fff;
      border-color: var(--accent, #7c4dff);
    }
    .slot-grid {
      display: flex;
      flex-wrap: wrap;
      gap: .4rem;
      margin-top: .6rem;
    }
    .slot-btn {
      padding: .35rem .65rem;
      border-radius: 6px;
      border: 1.5px solid var(--accent, #7c4dff);
      background: transparent;
      color: var(--accent, #7c4dff);
      font-size: .82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s, border-color .15s, color .15s;
    }
    .slot-btn:hover {
      background: var(--accent, #7c4dff);
      border-color: var(--accent, #7c4dff);
      color: #fff;
    }
    .slot-btn.selected {
      background: var(--accent, #7c4dff);
      border-color: var(--accent, #7c4dff);
      color: #fff;
      font-weight: 700;
    }
  `],
})
export class SlotPickerComponent implements OnInit, OnChanges {
  @Input() durationMinutes = 30;
  @Input() allowedStartHours?: number[];
  @Output() slotSelected = new EventEmitter<Slot | null>();

  private api = inject(ApiService);

  loading  = signal(false);
  error    = signal<string | null>(null);
  allSlots = signal<Slot[]>([]);
  selected = signal<Slot | null>(null);
  selectedDate = signal<string | null>(null);

  days = computed((): SlotDay[] => {
    const today = new Date().toISOString().slice(0, 10);
    const byDate = new Map<string, Slot[]>();
    for (const s of this.allSlots()) {
      if (this.isWeekend(s.date) || s.date === today) continue;
      const arr = byDate.get(s.date) ?? [];
      arr.push(s);
      byDate.set(s.date, arr);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => ({
      date,
      label: new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
      slots,
    }));
  });

  slotsForDay = computed((): Slot[] => {
    const date = this.selectedDate();
    if (!date) return [];
    return this.allSlots().filter(s => s.date === date);
  });

  ngOnInit() { this.load(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['durationMinutes'] && !changes['durationMinutes'].firstChange) {
      this.reset();
      this.load();
    }
  }

  private reset() {
    this.selected.set(null);
    this.selectedDate.set(null);
    this.slotSelected.emit(null);
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);

    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 13);
    const end = endDate.toISOString().slice(0, 10);

    this.api.getAvailability(start, end, this.durationMinutes, this.allowedStartHours).subscribe({
      next: ({ slots }) => {
        this.allSlots.set(slots);
        if (slots.length > 0 && !this.selectedDate()) {
          this.selectedDate.set(slots[0].date);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Could not load availability');
        this.loading.set(false);
      },
    });
  }

  selectSlot(slot: Slot) {
    this.selected.set(slot);
    this.slotSelected.emit(slot);
  }

  private isWeekend(dateStr: string): boolean {
    const date = new Date(dateStr + 'T12:00:00Z');
    const dayOfWeek = date.getUTCDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  formatTime(utc: string): string {
    return new Date(utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC', hour12: true });
  }

  formatDateTime(utc: string): string {
    return new Date(utc).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'UTC', hour12: true,
    }) + ' UTC';
  }
}
