import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WalletService } from '../../services/wallet.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  balance$ = this.dataService.balance$;
  address$ = this.walletService.address$;
  menuOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private walletService: WalletService,
    private dataService: DataService
  ) {
    console.log('[NavbarComponent] Constructor called');
  }

  ngOnInit(): void {
    console.log('[NavbarComponent] ngOnInit');

    this.walletService.address$
      .pipe(takeUntil(this.destroy$))
      .subscribe((address) => {
        console.log('[NavbarComponent] Address updated:', address);
      });

    this.dataService.balance$
      .pipe(takeUntil(this.destroy$))
      .subscribe((balance) => {
        console.log('[NavbarComponent] Balance updated in navbar:', balance);
      });
  }

  toggleMenu(): void {
    console.log('[NavbarComponent] Menu toggle clicked');
    console.log('[NavbarComponent] Menu was open?', this.menuOpen);

    this.menuOpen = !this.menuOpen;

    console.log('[NavbarComponent] Menu now open?', this.menuOpen);
  }

  closeMenu(): void {
    console.log('[NavbarComponent] Closing menu');
    this.menuOpen = false;
  }

  formatAddress(address: string | null): string {
    if (!address) {
      console.warn('[NavbarComponent] Address is null');
      return 'Not Connected';
    }

    const short = address.substring(0, 6) + '...' + address.substring(address.length - 4);
    console.log('[NavbarComponent] Formatted address:', short);

    return short;
  }

  async disconnect(): Promise<void> {
    console.log('[NavbarComponent] Disconnect button clicked');
    console.log('[NavbarComponent] TODO: Implement disconnect logic');
    // TODO: implement wallet disconnect
  }

  ngOnDestroy(): void {
    console.log('[NavbarComponent] Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
