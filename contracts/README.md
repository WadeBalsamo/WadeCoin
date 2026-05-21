# WadeCoin Smart Contracts

This directory contains the two core Solidity contracts that power WadeCoin on-chain.

## Token.sol — WADECOIN ERC-20 Token

An ERC-20-style token contract for the WADE token.

| Property | Value |
|----------|-------|
| Name | WadeCoin |
| Symbol | WADE |
| Decimals | 18 |
| Total Supply | 10,000,000 WADE |

The deployer receives the full supply on construction. Standard ERC-20 methods are implemented:

- `transfer(to, value)` — send WADE from caller to another address
- `approve(spender, value)` — allow a third party to spend on caller's behalf
- `transferFrom(from, to, value)` — move tokens on behalf of an approved owner

## EthSwap.sol — WadeCoin Exchange

A simple on-chain exchange that lets users swap ETH for WADE and back.

| Property | Value |
|----------|-------|
| Contract Name | WadeCoinExchange |
| Redemption Rate | 1000 WADE per 1 ETH |

### Buy flow

1. User calls `buyTokens()` with ETH attached.
2. Contract multiplies `msg.value × 1000` to determine the WADE amount.
3. WADE tokens are transferred from the exchange's reserve to the buyer.
4. A `TokenPurchased` event is emitted.

### Sell flow

1. User calls `approve()` on `Token.sol`, authorising the exchange to pull their WADE.
2. User calls `sellTokens(amount)`.
3. Contract pulls the WADE from the seller via `transferFrom`.
4. ETH equivalent (`amount ÷ 1000`) is sent back to the seller.
5. A `TokenSold` event is emitted.

## Pragma

Both contracts use `pragma solidity >=0.4.22 <0.5.17`.
