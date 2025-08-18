# ShadowFlow - Privacy-Preserving Decentralized Funding Platform

ShadowFlow is a privacy-preserving decentralized funding platform built on Avalanche using encrypted ERC20 (eERC20) tokens to maintain donor privacy while enabling transparent campaign management.

## Features

- **Private Donations**: Use eERC20 tokens to make donations with encrypted amounts
- **Campaign Privacy**: Campaign goals and raised amounts remain encrypted on-chain
- **Zero-Knowledge Proofs**: Verify donations and withdrawals without revealing amounts
- **Avalanche Subnet-EVM**: Deployed on high-performance Avalanche infrastructure

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Avalanche CLI](https://docs.avax.network/tooling/cli-guides/install-avalanche-cli)
- [Node.js](https://nodejs.org/) (for package management)

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Build contracts**:

   ```bash
   forge build
   ```

3. **Start local Avalanche network**:

   ```bash
   npm run start:network
   ```

4. **Deploy blockchain**:

   ```bash
   npm run deploy:blockchain
   ```

5. **Run tests**:
   ```bash
   forge test
   ```

## Project Structure

```
shadowflow/
├── contracts/
│   ├── interfaces/     # Contract interfaces
│   ├── libraries/      # Shared libraries
│   └── privacy/        # eERC20 integration contracts
├── src/               # Main contract implementations
├── test/              # Test files
│   └── integration/   # Integration tests
├── script/            # Deployment scripts
└── scripts/
    └── deployment/    # Deployment utilities
```

## Configuration

The project is configured for Avalanche Subnet-EVM deployment with the following networks:

- **Local**: http://127.0.0.1:9650/ext/bc/C/rpc
- **Fuji Testnet**: https://api.avax-test.network/ext/bc/C/rpc
- **Mainnet**: https://api.avax.network/ext/bc/C/rpc

## eERC20 Integration

This project integrates with Avalanche's encrypted ERC20 standard to provide:

- Encrypted token balances
- Private donation amounts
- Zero-knowledge proof verification
- Homomorphic balance operations

## License

MIT License - see LICENSE file for details.
