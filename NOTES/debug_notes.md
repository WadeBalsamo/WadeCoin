# Debug Logs, Random Notes, 


ng new wadecoin-ui --routing --style=scss
npm install

npm ERR code ERESOLVE... 
    forcing it works
npm install --force

created InitializationService that waits for everything to be ready before showing the UI.

    
key insights:
- read src/services first
- understand DataService as source of truth
- component → DataService → ContractService is the flow
- don't try to be clever with rxjs, keep it simple
- test manually with hardhat node running

this was a learning experience in blockchain dev. lots of "oh that's why web3.js exists" moments.

angular is solid once its up. the blockchain part was the hard part, not the framework.

## Notes for later

- need to add loading animation for transaction confirmations (showing block number)
- should add transaction history view
- could use web3 modal library for better wallet connection UX
- need to handle network switching (currently hardcoded to localhost)
- should add unit tests for more services
- could optimize contract calls with batching
- error messages could be better for specific revert reasons
- bundle analysis shows room for optimization still
- should preload contract ABIs instead of importing them 


# Dependencies & Build Errors

## ethers.js Integration Attempt 1

tried to add ethers.js right after getting angular working

```bash
npm install ethers
```

worked fine. then imported in service:

```typescript
import { ethers } from 'ethers';

// in service constructor
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
```

ERROR: `ethers is not defined` in build

to configure webpack for web3 stuff ethers has browser polyfills 


ERROR: polyfills.ts imports a bunch of stuff that doesn't exist

  deleted polyfills.ts and recreated it. works.
  
  
  looked at the angular.json file. needs custom webpack config...


## webpack.config.js attempt

created custom webpack for angular... this is getting complicated. 

```javascript
module: {
  rules: [
    {
      test: /\.js$/,
      include: /node_modules\/ethers/,
      use: {
        loader: 'babel-loader',
      },
    },
  ],
},
resolve: {
  fallback: {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
  }
}
```

 angular cli doesn't really use webpack directly like that anymore. need to use @angular-builders/custom-webpack instead

## @angular-builders attempt

```bash
npm install --save-dev @angular-builders/custom-webpack
npm install --save crypto-browserify stream-browserify buffer
```


## pnpm vs npm

switched repo using pnpm NOT npm
uninstalled everything:
```bash
rm -rf node_modules package-lock.json
npm uninstall -g npm  (this was silly but i was frustrated)
```

installed pnpm:
```bash
npm install -g pnpm
pnpm install
```

this... actually works better? pnpm is stricter about dependencies which immediately caught some issues with the ethers installation. 

## Current problems (ongoing):

1. ethers.js types not being found properly
2. buffer polyfill size is huge
3. Build time is now like 8-10 seconds. need it faster
4. haven't even tested if the contracts compile yet

next: figure out the hardhat/truffle setup situation...
