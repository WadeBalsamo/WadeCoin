import { ethers } from "ethers";
import { logger } from "../lib/logger";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export async function sendFaucetTokens(toAddress: string): Promise<string> {
  const privateKey = process.env["FAUCET_PRIVATE_KEY"];
  const rpcUrl = process.env["RPC_URL_TESTNET"];
  const contractAddress = process.env["WADECOIN_TESTNET_CONTRACT"];
  const faucetAmountWei = process.env["WADECOIN_TESTNET_FAUCET_AMOUNT_WEI"];

  if (!privateKey || !rpcUrl || !contractAddress || !faucetAmountWei) {
    throw new Error("Faucet is not configured on this server");
  }

  if (!ethers.isAddress(toAddress)) {
    throw new Error("Invalid recipient address");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

  const tx = await contract.transfer(toAddress, BigInt(faucetAmountWei));
  logger.info({ txHash: tx.hash, toAddress }, "Faucet tx sent");

  return tx.hash as string;
}

export interface TransferVerifyOptions {
  /** If provided, the Transfer event's `from` address must match (case-insensitive). */
  expectedFrom?: string;
  /** If true, require exact amount rather than >=. Default: true. */
  exactAmount?: boolean;
}

export async function verifyErc20Transfer(
  txHash: string,
  expectedTo: string,
  contractAddress: string,
  expectedAmountWei: bigint,
  rpcUrl: string,
  options: TransferVerifyOptions = {},
): Promise<boolean> {
  const { expectedFrom, exactAmount = true } = options;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      logger.warn({ txHash }, "Transaction receipt not found");
      return false;
    }

    if (receipt.status !== 1) {
      logger.warn({ txHash }, "Transaction failed on-chain");
      return false;
    }

    const iface = new ethers.Interface(ERC20_ABI);

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
        continue;
      }
      try {
        const parsed = iface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
        if (parsed?.name !== "Transfer") continue;

        const logTo = (parsed.args["to"] as string).toLowerCase();
        const logFrom = (parsed.args["from"] as string).toLowerCase();
        const logValue = BigInt(parsed.args["value"] as bigint);

        const toMatch = logTo === expectedTo.toLowerCase();
        const fromMatch =
          !expectedFrom || logFrom === expectedFrom.toLowerCase();
        const amountMatch = exactAmount
          ? logValue === expectedAmountWei
          : logValue >= expectedAmountWei;

        if (toMatch && fromMatch && amountMatch) {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  } catch (err) {
    logger.error({ err, txHash }, "Error verifying ERC-20 transfer");
    return false;
  }
}
