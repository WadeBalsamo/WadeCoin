import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { HomeComponent }     from './components/home/home.component';
import { ExchangeComponent } from './components/exchange/exchange.component';
import { BookComponent }     from './components/book/book.component';

type Tab = 'home' | 'exchange' | 'book';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HomeComponent, ExchangeComponent, BookComponent],
  template: `
    <nav class="app-nav mat-elevation-2">
      <div class="nav-brand">
        <span class="material-icons nav-brand-icon">toll</span> WadeCoin
      </div>
      <div class="nav-tabs">
        <button class="nav-tab" [class.active]="tab() === 'home'"     (click)="tab.set('home')">Home</button>
        <button class="nav-tab" [class.active]="tab() === 'exchange'" (click)="tab.set('exchange')">Exchange</button>
        <button class="nav-tab" [class.active]="tab() === 'book'"     (click)="tab.set('book')">Book</button>
      </div>
    </nav>

    <main class="app-main">
      @if (tab() === 'home') {
        <app-home (goBook)="tab.set('book')" (goExchange)="tab.set('exchange')" />
      }
      @if (tab() === 'exchange') { <app-exchange /> }
      @if (tab() === 'book')     { <app-book /> }
    </main>
  `,
})
export class AppComponent {
  tab = signal<Tab>('home');
}
