# ShadowFund

**Privacy-Preserving Decentralized Crowdfunding Platform**

_Built for the [Avalanche Build Hackathon](https://build.avax.network/hackathons/a0e06824-4d70-4b60-98f7-4cf5d4c28b59)_

---

#### Pitch Deck: https://gamma.app/docs/ShadowFund-Privacy-Preserving-Funding-Evolving-to-PIaaS-gno62qbscovjd7x

#### Video Explanation: https://loom.com/share/folder/51ea8a14f98543d382a1d61014ce1b2d

## 🎯 Vision

ShadowFund is evolving from a privacy-preserving crowdfunding platform into a **comprehensive Privacy Infrastructure as a Service (PIaaS)** solution. Using Avalanche's cutting-edge **encrypted ERC20 (eERC20)** protocol, we enable:

**Consumer Platform:**

- **Private Donations**: Contribution amounts remain encrypted on-chain
- **Anonymous Supporters**: Donor identities can stay confidential
- **Transparent Campaigns**: Public campaign goals and progress without revealing individual contributions
- **AI-Powered Insights**: Intelligent campaign optimization and donor matching

**Enterprise & NGOs Infrastructure:**

- **Custom L1 Deployment**: Dedicated Avalanche subnets with pre-configured privacy features
- **Cross-Chain Privacy**: Multi-L1 encrypted transfers and unified key management
- **White-Label Solutions**: Branded privacy platforms for enterprises
- **Compliance-Ready**: Enterprise & NGOs-grade privacy with regulatory compliance tools

## 🚀 What We're Building

### Consumer Platform Features

**🔐 Privacy-First Architecture**

- Integration with Avalanche's native eERC20 protocol
- Encrypted donation amounts using homomorphic encryption
- Zero-knowledge proof verification for all transactions
- Private balance management for campaign creators

**📊 Campaign Management**

- Create campaigns with public metadata (title, description, deadline)
- Track donations through encrypted transaction hashes
- Withdrawal management with privacy preservation
- Real-time campaign analytics without exposing amounts

**🤖 AI-Powered Features**

- Intelligent campaign optimization recommendations
- Smart donor matching based on encrypted preferences
- Automated fraud detection and risk assessment
- Predictive analytics for campaign success

**🎨 Intuitive User Experience**

- Multi-step campaign creation wizard
- Seamless wallet integration with eERC20 registration
- Real-time form validation and error handling
- Responsive design built with React and Tailwind CSS

### Enterprise & NGOs Infrastructure Services

**🏢 Privacy Infrastructure as a Service (PIaaS)**

- Custom Avalanche L1 deployment with pre-configured eERC20
- Dedicated validator sets for enterprise security
- White-label privacy platform deployment
- Enterprise & NGOs-grade compliance and audit tools

**🌐 Multi-Chain Privacy Solutions**

- Cross-L1 encrypted transfer protocols
- Unified privacy key management across chains
- Enterprise & NGOs-grade key recovery and backup systems
- Seamless multi-chain campaign deployment

**🔧 Developer & Integration Tools**

- Universal eERC20 deployment toolkit
- Cross-chain privacy bridge infrastructure
- Enterprise & NGOs SDK for custom integrations
- Compliance framework for regulated industries

### Technical Innovation

**Smart Contract Architecture**

```
SimpleCampaignFactory.sol    → Campaign creation and management
SimpleCampaign.sol          → Individual campaign logic
eERC20 Integration          → Avalanche's encrypted token protocol
```

**Frontend Stack**

```
React + TypeScript          → Modern UI framework
@avalabs/eerc-sdk          → Official eERC20 SDK integration
Wagmi + Viem               → Ethereum wallet connectivity
Shadcn/ui + Tailwind       → Beautiful, accessible components
```

## 🏗️ Project Structure

```
shadowflow/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Application pages
│   │   └── config/        # Configuration files
│   └── package.json
├── contracts/             # Smart contracts
│   ├── contracts/         # Solidity contracts
│   ├── script/           # Deployment scripts
│   ├── test/             # Contract tests
│   └── foundry.toml      # Foundry configuration

```

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Web3**: Wagmi v2 + Viem for wallet connectivity
- **Privacy**: @avalabs/eerc-sdk for encrypted transactions
- **State**: React Query for server state management
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation

### Smart Contracts

- **Language**: Solidity ^0.8.20
- **Framework**: Foundry for development and testing
- **Network**: Avalanche C-Chain (Fuji Testnet)
- **Privacy**: Integration with deployed eERC20 protocol
- **Architecture**: Factory pattern for campaign deployment

### Infrastructure

- **Blockchain**: Avalanche Subnet-EVM
- **Privacy Protocol**: eERC20 (Encrypted ERC20)
- **Development**: Foundry + Avalanche CLI
- **Deployment**: Vercel (Frontend) + Avalanche (Contracts)

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Avalanche CLI](https://docs.avax.network/tooling/cli-guides/install-avalanche-cli)
- MetaMask or compatible Web3 wallet

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd shadowflow
   ```

2. **Setup Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Setup Contracts**

   ```bash
   cd contracts
   npm install
   forge build
   forge test
   ```

4. **Deploy Contracts** (requires AVAX for gas)
   ```bash
   forge script script/DeploySimpleCampaigns.s.sol \
     --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
     --broadcast
   ```

### Environment Configuration

**Frontend (.env)**

```env
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_CAMPAIGN_FACTORY_ADDRESS=deployed_factory_address
```

**Contracts (.env)**

```env
PRIVATE_KEY=your_private_key
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

## 🎯 Hackathon Progress & Roadmap

### ✅ Week 1 - Foundation Complete

**Smart Contract Foundation**

- [x] SimpleCampaign contract with metadata tracking
- [x] SimpleCampaignFactory for campaign deployment
- [x] eERC20 transaction hash registration system
- [x] Comprehensive test suite with 100% coverage
- [x] **Contracts deployed on Avalanche Fuji testnet**

**Frontend Application**

- [x] Multi-step campaign creation wizard
- [x] eERC20 SDK integration and wallet connectivity
- [x] Real-time form validation and error handling
- [x] Campaign listing and detail pages
- [x] Donation interface with privacy features
- [x] **Production-ready frontend deployed**

**Privacy Integration**

- [x] eERC20 registration flow for new users
- [x] Private donation functionality using encrypted transfers
- [x] Balance decryption for campaign creators
- [x] Transaction hash linking between eERC20 and campaigns
- [x] **End-to-end privacy flow validated**

## 🗺️ 4-Week Development Roadmap

### Week 2: AI Integration & Advanced Features

**🤖 AI-Powered Platform Enhancement**

- Intelligent campaign optimization engine
- Smart donor matching algorithms using encrypted preference analysis
- Automated fraud detection and risk assessment systems
- Predictive analytics for campaign success probability
- AI-driven campaign recommendation system

**📊 Advanced Analytics**

- Private metrics dashboard with zero-knowledge proofs
- Encrypted campaign performance insights
- Anonymous donor behavior analysis
- Real-time success prediction models

### Week 3: Enterprise & NGOs Infrastructure Development

**🏢 Privacy Infrastructure as a Service (PIaaS)**

- Universal eERC20 deployment toolkit for any Avalanche L1
- Custom L1 subnet deployment automation
- Enterprise & NGOs-grade validator set configuration
- White-label platform deployment system
- Compliance framework for regulated industries

**🌐 Multi-Chain Privacy Bridge**

- Cross-L1 encrypted transfer protocol development
- Unified privacy key management system
- Enterprise & NGOs-grade key recovery and backup solutions
- Cross-chain campaign deployment capabilities
- Multi-L1 state synchronization with privacy preservation

### Week 4: Enterprise & NGOs Launch & Market Validation

**🚀 Go-to-Market Execution**

- Enterprise & NGOs SDK and developer tools release
- Pilot deployment with 3-5 enterprise customers
- Partnership agreements with Avalanche ecosystem players

**🔧 Production Optimization**

- Performance optimization for enterprise-scale deployments
- Advanced security audits and penetration testing
- Scalability testing across multiple L1s
- Enterprise & NGOs support infrastructure setup
- Documentation and training materials for enterprise clients

**📈 Market Positioning**

- Transform from crowdfunding platform to Privacy Infrastructure provider
- Establish ShadowFund as the leading PIaaS solution on Avalanche
- Create competitive moat through first-mover advantage in privacy infrastructure
- Build foundation for post-hackathon enterprise growth

### Post-Hackathon Vision

**🌍 Global Privacy Infrastructure Leader**

- Become the standard for privacy-preserving financial applications
- Expand to multiple blockchain ecosystems beyond Avalanche
- Enterprise & NGOs adoption across Fortune 500 companies
- Regulatory partnerships for compliant privacy solutions

## 🔒 Privacy & Security

### Privacy Guarantees

- **Donation Amounts**: Encrypted using homomorphic encryption
- **Donor Identity**: Optional anonymity with zero-knowledge proofs
- **Campaign Balances**: Only creators can decrypt their total funds
- **Transaction History**: Public events without revealing amounts

### Security Measures

- **Smart Contract Audits**: Comprehensive testing and formal verification
- **Frontend Security**: Secure key management and encrypted storage
- **eERC20 Integration**: Leveraging Avalanche's battle-tested privacy protocol
- **Access Controls**: Role-based permissions and multi-signature support

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code style and standards
- Pull request process
- Issue reporting
- Development setup
- Testing requirements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

**Avalanche Build Hackathon - 4-Week Development Plan**

- **Team**: ShadowFund Development Team
- **Track**: Privacy & Infrastructure + Enterprise & NGOs Solutions
- **Demo**: [Live Demo](https://shadowflow-demo.vercel.app)
- **Contracts**: Deployed on Avalanche Fuji Testnet
- **Repository**: This repository contains all source code and documentation

### Key Innovations & Competitive Advantages

1. **Privacy Infrastructure as a Service (PIaaS)** - First-ever enterprise privacy infrastructure platform
2. **Multi-L1 eERC20 Deployment** - Universal toolkit for deploying privacy across any Avalanche L1
3. **AI-Powered Privacy Analytics** - Intelligent insights while preserving encryption
4. **Cross-Chain Privacy Bridge** - Seamless encrypted transfers across multiple L1s
5. **Enterprise & NGOs-Grade Compliance** - Regulatory-ready privacy solutions for Fortune 500 companies

### Market Transformation Strategy

**Week 1**: ✅ Privacy crowdfunding platform foundation
**Week 2**: 🤖 AI integration and advanced analytics
**Week 3**: 🏢 Enterprise & NGOs infrastructure development  
**Week 4**: 🚀 PIaaS launch and market validation

**Post-Hackathon**: Transform into $10M+ ARR Privacy Infrastructure company

---

**Built with ❤️ for the Avalanche ecosystem**

_From privacy-preserving crowdfunding to enterprise Privacy Infrastructure as a Service - powered by Avalanche's eERC20 protocol._
