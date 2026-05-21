import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { AppConfig } from '../models/booking.models';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);
  private config$ = this.http.get<AppConfig>('/api/config').pipe(shareReplay(1));

  getConfig(): Observable<AppConfig> {
    return this.config$;
  }
}
