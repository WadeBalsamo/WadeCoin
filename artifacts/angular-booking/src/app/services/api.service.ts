import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingRequest, BookingResponse } from '../models/booking.models';

export interface ExchangeRate {
  eth_per_wade: string;
  wade_per_eth: string;
  network: string;
  deployed: boolean;
  note: string;
}

export interface ExchangeSimulateResult {
  simulated: boolean;
  wade_amount: string;
  eth_amount_wei: string;
  message: string;
}

export interface TransactionLog {
  id: string;
  event_type: string;
  user_name: string | null;
  user_email: string | null;
  wallet_address: string | null;
  tx_hash: string | null;
  amount_wei: string | null;
  token_symbol: string | null;
  mode: string | null;
  notes: string | null;
  created_at: string;
}

export interface RecentBooking {
  id: string;
  user_name: string;
  mode: string;
  created_at: string;
  has_payment: boolean;
}

export interface LogsResponse {
  logs: TransactionLog[];
  bookings: RecentBooking[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  requestFaucet(address: string): Observable<{ tx_hash: string }> {
    return this.http.post<{ tx_hash: string }>(`${this.base}/faucet`, { address });
  }

  createBooking(req: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.base}/bookings`, req);
  }

  getExchangeRate(): Observable<ExchangeRate> {
    return this.http.get<ExchangeRate>(`${this.base}/exchange/rate`);
  }

  simulateExchange(walletAddress: string, wadeAmount: string, ethAmountWei: string): Observable<ExchangeSimulateResult> {
    return this.http.post<ExchangeSimulateResult>(`${this.base}/exchange/simulate`, {
      wallet_address: walletAddress,
      wade_amount: wadeAmount,
      eth_amount_wei: ethAmountWei,
    });
  }

  getLogs(): Observable<LogsResponse> {
    return this.http.get<LogsResponse>(`${this.base}/logs`);
  }
}
