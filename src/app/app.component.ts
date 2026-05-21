import { Component, OnInit } from '@angular/core';
import { InitializationService } from './services/initialization.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'WadeCoin';
  isReady$ = this.initService.ready$;
  error$ = this.initService.error$;

  constructor(private initService: InitializationService) {
    console.log('%c[AppComponent] Application starting...', 'color: #0f0; font-weight: bold;');
    console.log('[AppComponent] Environment:', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
  }

  ngOnInit(): void {
    console.log('[AppComponent] ngOnInit called');
    console.log('[AppComponent] Triggering initialization service...');

    this.initService.initialize().catch((error) => {
      console.error('[AppComponent] Fatal initialization error:', error);
      console.error('[AppComponent] App will show error screen');
    });
  }

  retryInitialization(): void {
    console.log('[AppComponent] User clicked retry button');
    console.log('[AppComponent] Attempting re-initialization...');

    this.initService.initialize().catch((error) => {
      console.error('[AppComponent] Re-initialization failed:', error);
    });
  }
}
