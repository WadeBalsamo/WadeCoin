/*module.exports = {
  compilers: {
    solc: {
      version: <"^0.5.16">, // A version or constraint - Ex. "^0.5.0"
                         // Can also be set to "native" to use a native solc
      docker: <boolean>, // Use a version obtained through docker
      parser: "solcjs",  // Leverages solc-js purely for speedy parsing
      settings: {
        optimizer: {
          enabled: <boolean>,
          runs: <number>   // Optimize for how many times you intend to run the code
        },
        evmVersion: <string> // Default: "istanbul"
      },
      modelCheckerSettings: {
        // contains options for SMTChecker
      }
    }
  }
}
*/


require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
