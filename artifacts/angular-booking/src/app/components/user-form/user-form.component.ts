import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PackageOption, FormData } from '../../models/booking.models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-title">Your Details</div>

      @if (showPackage && packages && packages.length > 0) {
        <div class="form-group">
          <label for="pkg">Package *</label>
          <select id="pkg" [ngModel]="data.packageHours" (ngModelChange)="patch('packageHours', $event)">
            <option [ngValue]="null">Select a package…</option>
            @for (p of packages; track p.hours) {
              <option [ngValue]="p.hours">{{ p.label }} · {{ fmtWade(p.price_wei) }}</option>
            }
          </select>
        </div>
      }

      <div class="form-group">
        <label for="uname">Name *</label>
        <input id="uname" type="text" placeholder="Your full name"
          [ngModel]="data.name" (ngModelChange)="patch('name', $event)" />
      </div>

      <div class="form-group">
        <label for="uemail">Email *</label>
        <input id="uemail" type="email" placeholder="you@example.com"
          [ngModel]="data.email" (ngModelChange)="patch('email', $event)" />
      </div>

      <div class="form-group">
        <label for="unotes">Notes</label>
        <textarea id="unotes" placeholder="Anything you'd like to share beforehand…"
          [ngModel]="data.notes" (ngModelChange)="patch('notes', $event)"></textarea>
      </div>
    </div>
  `,
})
export class UserFormComponent {
  @Input() data: FormData = { name: '', email: '', notes: '', packageHours: null };
  @Input() packages: PackageOption[] | null = null;
  @Input() showPackage = false;
  @Output() dataChange = new EventEmitter<FormData>();

  patch(field: keyof FormData, value: string | number | null) {
    this.dataChange.emit({ ...this.data, [field]: value });
  }

  fmtWade(wei: string): string {
    try {
      const n = BigInt(wei);
      const w = n / BigInt('1000000000000000000');
      const f = n % BigInt('1000000000000000000');
      if (f === 0n) return `${w} WADE`;
      return `${w}.${f.toString().padStart(18, '0').replace(/0+$/, '')} WADE`;
    } catch { return '? WADE'; }
  }
}
