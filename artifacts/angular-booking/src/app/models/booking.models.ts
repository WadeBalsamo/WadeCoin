export interface WadeCoinNetworkConfig {
  contract_address: string;
  owner_address: string;
  hourly_rate_wei?: string;
  payment_amount_wei?: string;
  faucet_amount_wei?: string;
}

export interface PackageOption {
  hours: number;
  label: string;
  price_wei: string;
}

export interface AppConfig {
  mainnet_chain_id: number;
  testnet_chain_id: number;
  wadecoin_mainnet: WadeCoinNetworkConfig;
  wadecoin_testnet: WadeCoinNetworkConfig;
  package_options: PackageOption[];
  google_calendar_appointment_url: string | null;
}

export interface BookingRequest {
  user_name: string;
  user_email: string;
  notes?: string;
  payment_tx_hash?: string;
  mode: string;
  package_hours?: number;
  user_address?: string;
}

export interface BookingResponse {
  booking_id: string;
  message: string;
}

export type BookingMode = 'discovery' | 'consulting';

export interface FormData {
  name: string;
  email: string;
  notes: string;
  packageHours: number | null;
}
