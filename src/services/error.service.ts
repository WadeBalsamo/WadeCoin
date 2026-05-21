import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AppError {
  code: string;
  message: string;
  userFriendly: boolean;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  error$ = new Subject<AppError>();

  constructor() {
    console.log('[ErrorService] Error service initialized');
  }

  handle(error: unknown): AppError {
    console.log('[ErrorService] Handling error:', error);
    console.log('[ErrorService] Error type:', typeof error);

    if (error instanceof Error) {
      console.log('[ErrorService] Error is Error instance');
      console.log('[ErrorService] Error message:', error.message);
      console.log('[ErrorService] Error stack:', error.stack?.split('\n').slice(0, 3));
    }

    const appError = this.parseError(error);

    console.log('[ErrorService] Parsed error:', {
      code: appError.code,
      message: appError.message,
      userFriendly: appError.userFriendly
    });

    this.error$.next(appError);
    return appError;
  }

  private parseError(error: unknown): AppError {
    console.log('[ErrorService] Parsing error...');

    if (error instanceof Error) {
      const message = error.message;
      console.log('[ErrorService] Checking error message for patterns...');

      if (
        message.includes('insufficient balance') ||
        message.includes('INSUFFICIENT_FUNDS')
      ) {
        console.log('[ErrorService] ✓ Matched: INSUFFICIENT_FUNDS');
        return {
          code: 'INSUFFICIENT_FUNDS',
          message: "You don't have enough ETH for this transaction",
          userFriendly: true,
          timestamp: Date.now()
        };
      }

      if (
        message.includes('user rejected') ||
        message.includes('USER_REJECTED')
      ) {
        console.log('[ErrorService] ✓ Matched: USER_REJECTED');
        return {
          code: 'USER_REJECTED',
          message: 'You rejected the transaction',
          userFriendly: true,
          timestamp: Date.now()
        };
      }

      if (message.includes('MetaMask')) {
        console.log('[ErrorService] ✓ Matched: METAMASK_ERROR');
        return {
          code: 'METAMASK_ERROR',
          message: 'MetaMask error: ' + message,
          userFriendly: true,
          timestamp: Date.now()
        };
      }

      if (message.includes('network')) {
        console.log('[ErrorService] ✓ Matched: NETWORK_ERROR');
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error. Check your connection.',
          userFriendly: true,
          timestamp: Date.now()
        };
      }

      console.log('[ErrorService] No pattern matched, using generic error');
      return {
        code: 'UNKNOWN_ERROR',
        message: message,
        userFriendly: false,
        timestamp: Date.now()
      };
    }

    console.log('[ErrorService] Error is not an Error instance');
    console.log('[ErrorService] Error value:', error);

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error) || 'Something went wrong',
      userFriendly: false,
      timestamp: Date.now()
    };
  }

  logError(error: AppError): void {
    console.group(`%c[ErrorService] Error Report - ${error.code}`, 'color: #f00; font-weight: bold;');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('User Friendly:', error.userFriendly);
    console.error('Timestamp:', new Date(error.timestamp || 0).toISOString());
    console.groupEnd();
  }
}
