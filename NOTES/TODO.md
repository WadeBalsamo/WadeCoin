# TODO, Future Work, Ideas, and Things We'll Never Get To

## Must Do Soon

- [ ] fix the navbar dropdown menu (it's broken on mobile, overlaps content)
  - TODO: use @HostListener for click outside
  - NOTE: there's a z-index issue, navbar is under content

- [ ] transaction hash link needs to open etherscan
  - started this but forgot the chain ID logic
  - need to build etherscan URL properly for different networks

- [ ] error boundary component
  - add it to main app component
  - catch uncaught promise rejections
  - not all errors show up to the user currently

- [ ] wallet disconnect button
  - metamask doesn't always trigger disconnect event
  - need to handle state cleanup

- [ ] test the app on testnet (currently localhost only)
  - need contract deployment to sepolia
  - or goerli (is that still a thing?)
  - hardhat.config.js has the network config but not tested

## Nice to Have

- [ ] transaction history view
  - store completed transactions in localStorage? or in a db?
  - show timestamp, amount, status, hash
  - maybe a modal that opens when you click the transaction

- [ ] better loading animations
  - current spinner is boring
  - could use SVG animation
  - or animated gradient skeleton loaders

- [ ] wallet balances for other tokens
  - show ETH balance
  - show USDC balance
  - requires new contract queries

- [ ] swap confirmation modal
  - "you're about to send X ETH, get Y WADE"
  - show slippage
  - cancel before submitting

- [ ] undo/retry failed transactions
  - some transactions fail due to network issues
  - should let users retry easily
  - don't show completed failed transactions forever

- [ ] dark/light theme toggle
  - theme service exists but UI doesn't have toggle button
  - add button to navbar
  - maybe also detect system preference

- [ ] PWA support
  - add service worker
  - let people use offline (sort of)
  - actually, offline doesn't make sense for blockchain app

- [ ] multiple wallet support
  - currently only metamask
  - could add WalletConnect
  - or Ledger support

## Technical Debt

- [ ] improve test coverage
  - currently at 40%
  - need actual component tests
  - integration tests against real contract

- [ ] reduce bundle size
  - 550kb is acceptable but could be better
  - look at ethers.js usage, maybe use viem instead?
  - that's a lot of work to rewrite

- [ ] add storybook for components
  - document component API
  - make it easy to test UI in isolation
  - currently components are tightly coupled

- [ ] proper logging framework
  - using console.log everywhere
  - should use ngx-logger or similar
  - could send logs to server for debugging

- [ ] API layer
  - price feeds should come from API, not contract
  - maybe coingecko for token prices?
  - contract shouldn't be sole source of truth

- [ ] state hydration
  - if user reloads, state is lost
  - could persist to localStorage
  - or have server store it

- [ ] code organization
  - services folder is getting big
  - maybe split into feature folders?
  - currently pretty flat

## Ideas That Might Never Happen

- multichain support
  - deploy contracts to other chains
  - detect user's current network
  - maybe Polygon, Arbitrum
  - would require massive refactor

- liquidity pool interface
  - let people provide liquidity
  - earn fees
  - need new contract for this

- token staking
  - lock tokens for rewards
  - need staking contract
  - requires more complex UI

- governance
  - DAO voting
  - token holders vote on changes
  - would need separate gov contract

- NFT drops
  - mint NFTs to buyers
  - create separate NFT contract
  - generate fancy images

- advanced charts
  - price charts over time
  - trading volume
  - would need historical data stored somewhere
  - could use recharts library

- mobile app
  - react native version
  - electron desktop version
  - lots of work for diminishing returns

- websockets for real-time updates
  - currently polling
  - websocket would be more efficient
  - need backend server for this

- payment splits
  - send to multiple wallets
  - each transaction splits revenue
  - need new contract for this

- batch operations
  - buy multiple tokens in one transaction
  - save on gas
  - requires new contract functions

## Known Issues (Not Worth Fixing?)

- [ ] gas estimation sometimes fails silently
  - user sees "Unable to estimate"
  - should show why it failed
  - but revert reasons are cryptic anyway

- [ ] form submits twice if user clicks button twice quickly
  - added loading state to prevent this
  - but feels fragile
  - should use RxJS concatMap instead of switchMap

- [ ] navbar is fixed height but not accounted for in route calculations
  - if you have a link to a section, it goes under navbar
  - would need scroll offset adjustment
  - not critical, low priority

- [ ] mobile keyboard covers input field on small devices
  - iOS Safari specific issue
  - not really fixable without CSS hacks
  - acceptable for now

- [ ] contract calls sometimes revert with cryptic reasons
  - "VM Exception while processing transaction: revert"
  - no error message from contract
  - added require() messages to contracts but wallet might still show generic

- [ ] long decimal numbers overflow their input field
  - "12345678901234567890" looks weird
  - could add ellipsis or truncate
  - low priority, unlikely user enters that

## Questions to Investigate

- should we use viem instead of ethers.js?
  - ethers is 300kb, viem is smaller
  - ethers has better documentation
  - switching would take days but might be worth it

- should we add helmet for security headers?
  - this is a frontend app, headers don't help much
  - but good practice anyway
  - skip for now

- should we use tailwind instead of custom scss?
  - current approach works fine
  - tailwind would be faster for UI components
  - would require refactoring a lot of CSS
  - decision: stick with current for now

- should we add authentication/login?
  - wallet address is the "login"
  - different addresses have different balances
  - could add per-address user settings
  - but is it necessary?

- should we store data in IndexedDB?
  - localStorage works for now
  - IndexedDB for larger amounts of data
  - too much for current scope

## Notes to Self

- don't add more features without tests
- bundle size is important, measure before major adds
- communicate with users about loading states
- errors need good messages, not "something went wrong"
- mobile first would have saved time
- architecture matters, don't skip planning
- web3 is different from normal web dev, plan for it

## Things That Surprised Me

- metamask injects window.ethereum asynchronously
  - can't just check window.ethereum in constructor
  - need to wait for it to be available

- contract function names collide with reserved words
  - contract.transfer() exists
  - but "transfer" might be reserved
  - ethers handles this but easy to mess up

- gas estimation requires a lot of state setup
  - need signer, need balance, need contract
  - can't just estimate any transaction
  - makes sense but wasn't obvious

- RxJS operators have surprising behavior
  - switchMap cancels previous request
  - mergeMap processes all requests
  - concatMap queues them
  - easy to pick wrong one

- angular routing is surprisingly complex for simple app
  - we don't even use routing yet
  - added it "just in case"
  - added complexity we don't need

## Lessons for Next Project

- don't add features "just in case"
- routing, authentication, etc only if needed
- start simple, add as needed
- testing from day 1, not after
- performance from day 1, not optimization phase
- talk to users early about UX
- document architecture, not implementation
- code reviews even if solo dev (do it a day later with fresh eyes)

## Random Notes

- why does npm take so long to install?
  - dependency resolution is slow
  - pnpm is faster but less compatible
  - chose pnpm, no regrets

- why is typescript so strict?
  - saves bugs later
  - worth the pain upfront

- why doesn't angular have more defaults?
  - would be slower to learn
  - more flexible this way
  - trade-offs everywhere

- how much would this cost on AWS/Vercel?
  - probably $20/month if deployed
  - currently costs nothing (localhost)
  - should add to future cost considerations

- should we use docker for dev?
  - would ensure hardhat node and ng serve both run
  - docker-compose.yml with two services
  - probably worth it if adding team members
  - solo dev doesn't need it

## Final Notes

this project took way longer than expected because:
1. learning angular while building (not just using docs)
2. blockchain development is different (async, long confirmations, network issues)
3. built features twice (once wrong, then right)
4. didn't plan architecture upfront (paid for it later)
5. testing was an afterthought (should have been first)

but it's done, it works, and the architecture is solid now.

if i had to estimate: 15 actual development hours, 5 hours debugging, 5 hours frustrated, 5 hours refactoring.

worth it. learned a lot about angular, web3, rxjs, typescript, and software architecture.

next time: plan better, test earlier, don't skip architecture.

also: two terminals (hardhat node + ng serve) is essential. should be first line of setup docs.

ok that's enough notes. time to move on to the next feature.

actually wait, one more thing: users will definitely try to use this on mainnet with real funds. need a big warning "THIS IS NOT PRODUCTION READY". add to app somewhere very visible.

ok done now.

well actually...

no. done. stop writing. commit this and move on.

