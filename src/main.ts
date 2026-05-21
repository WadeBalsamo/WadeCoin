import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

console.log('%c=== WadeCoin UI Startup ===', 'color: #6366f1; font-size: 14px; font-weight: bold;');
console.log('Bootstrapping Angular application...');
console.log('Environment:', {
  NODE_ENV: 'development',
  timestamp: new Date().toISOString(),
  port: 4200
});

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => {
    console.log('%c✓ Angular Application Started Successfully', 'color: #10b981; font-weight: bold;');
    console.log('App is ready. You can interact with the WadeCoin UI.');
    console.log('Open DevTools Console to see detailed logging.');
  })
  .catch((err) => {
    console.error('%c✗ Angular Bootstrap Failed', 'color: #ef4444; font-weight: bold;');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
  });

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('%c[UNHANDLED PROMISE REJECTION]', 'color: #ef4444; font-weight: bold;');
  console.error('Reason:', event.reason);
  console.error('Promise:', event.promise);
});

// Log page visibility changes
document.addEventListener('visibilitychange', () => {
  const state = document.hidden ? 'hidden' : 'visible';
  console.log('[Window] Page visibility changed to:', state);
});

// Log when page is about to unload
window.addEventListener('beforeunload', () => {
  console.log('[Window] Page is unloading');
});
