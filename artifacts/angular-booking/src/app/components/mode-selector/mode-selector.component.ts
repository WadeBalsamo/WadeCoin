import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { BookingMode } from '../../models/booking.models';

@Component({
  selector: 'app-mode-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mode-selector">
      <button class="mode-btn" [class.active]="selected === 'discovery'" (click)="select('discovery')">
        <div class="mode-icon"><span class="material-icons">phone_in_talk</span></div>
        <div class="mode-title">Discovery Call</div>
        <div class="mode-sub">30 min · testnet WADE</div>
      </button>
      <button class="mode-btn" [class.active]="selected === 'consulting'" (click)="select('consulting')">
        <div class="mode-icon"><span class="material-icons">business_center</span></div>
        <div class="mode-title">Consulting Project</div>
        <div class="mode-sub">60 min · mainnet WADE</div>
      </button>
    </div>
  `,
})
export class ModeSelectorComponent {
  @Input() selected: BookingMode | null = null;
  @Output() modeSelected = new EventEmitter<BookingMode>();

  select(mode: BookingMode) { this.modeSelected.emit(mode); }
}
