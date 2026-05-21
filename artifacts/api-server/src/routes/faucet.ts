import { Router, type IRouter, type Request, type Response } from "express";
import { sendFaucetTokens } from "../services/wallet";
import { ethers } from "ethers";

const router: IRouter = Router();

router.post(
  "/faucet",
  async (req: Request, res: Response): Promise<void> => {
    const { address } = req.body as { address?: string };

    if (!address) {
      res.status(400).json({
        code: "missing_address",
        message: "address is required",
      });
      return;
    }

    if (!ethers.isAddress(address)) {
      res.status(400).json({
        code: "invalid_address",
        message: "address is not a valid Ethereum address",
      });
      return;
    }

    if (!process.env["FAUCET_PRIVATE_KEY"]) {
      res.status(503).json({
        code: "faucet_unavailable",
        message: "Faucet is not configured on this server",
      });
      return;
    }

    try {
      const txHash = await sendFaucetTokens(address);
      res.json({ tx_hash: txHash });
    } catch (err) {
      res.status(500).json({
        code: "faucet_error",
        message: err instanceof Error ? err.message : "Faucet transaction failed",
      });
    }
  },
);

export default router;
