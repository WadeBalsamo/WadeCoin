export interface WadecoinMainnetConfig {
  contract_address: string;
  owner_address: string;
  decimals: number;
  hourly_rate_wei: string;
}

export interface WadecoinTestnetConfig {
  contract_address: string;
  owner_address: string;
  decimals: number;
  faucet_amount_wei: string;
  payment_amount_wei: string;
}

export interface PackageOption {
  hours: number;
  label: string;
  price_wei: string;
}

export interface AppConfig {
  wadecoin_mainnet: WadecoinMainnetConfig;
  wadecoin_testnet: WadecoinTestnetConfig;
  package_options: PackageOption[];
  mainnet_chain_id: number;
  testnet_chain_id: number;
  google_calendar_appointment_url: string | null;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    const err = new Error(`Missing required environment variable: ${key}`);
    (err as NodeJS.ErrnoException).code = "missing_config";
    throw err;
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function buildAppConfig(): AppConfig {
  const hourlyRateWei = requireEnv("WADECOIN_MAINNET_HOURLY_RATE_WEI");

  const rawPackageOptions = requireEnv("PACKAGE_OPTIONS_JSON");
  const rawPackages = JSON.parse(rawPackageOptions) as Array<{
    hours: number;
    label: string;
  }>;

  const packageOptions: PackageOption[] = rawPackages.map((pkg) => ({
    hours: pkg.hours,
    label: pkg.label,
    price_wei: (BigInt(pkg.hours) * BigInt(hourlyRateWei)).toString(),
  }));

  return {
    wadecoin_mainnet: {
      contract_address: requireEnv("WADECOIN_MAINNET_CONTRACT"),
      owner_address: requireEnv("WADECOIN_MAINNET_OWNER"),
      decimals: parseInt(optionalEnv("WADECOIN_MAINNET_DECIMALS", "18"), 10),
      hourly_rate_wei: hourlyRateWei,
    },
    wadecoin_testnet: {
      contract_address: requireEnv("WADECOIN_TESTNET_CONTRACT"),
      owner_address: requireEnv("WADECOIN_TESTNET_OWNER"),
      decimals: parseInt(optionalEnv("WADECOIN_TESTNET_DECIMALS", "18"), 10),
      faucet_amount_wei: requireEnv("WADECOIN_TESTNET_FAUCET_AMOUNT_WEI"),
      payment_amount_wei: requireEnv("WADECOIN_TESTNET_PAYMENT_AMOUNT_WEI"),
    },
    package_options: packageOptions,
    mainnet_chain_id: parseInt(optionalEnv("MAINNET_CHAIN_ID", "1"), 10),
    testnet_chain_id: parseInt(optionalEnv("TESTNET_CHAIN_ID", "11155111"), 10),
    google_calendar_appointment_url: process.env["GOOGLE_CALENDAR_APPOINTMENT_URL"] ?? null,
  };
}
