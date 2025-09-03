# BaseBook - Decentralized Remittance Platform

![BaseBook Logo](frontend/public/logo.png)

**Team:** MetaBase  
**Project:** BaseBook  
**Description:** A decentralized remittance platform for sending stablecoins with escrow functionality, wallet integration, and transaction tracking.

## Get to Know the Pillars behind Metabase 

- **zeuswae.base.eth**
- **riewagmization.base.eth**
- **cartss.base.eth**
- **sceiiya.base.eth**

BaseBook enables Overseas Filipino Workers (OFWs) to send stablecoins (mock USDC) to recipients in the Philippines using the Base Sepolia testnet.

## 🌟 Features

### Frontend Features

- **Wallet Connection:** Support for Base Smart Wallet and MetaMask
- **Send USDC:** Form to input recipient address and amount with escrow protection
- **Withdraw Funds:** Recipients can withdraw funds from escrow using transaction ID
- **Transaction History:** Complete transaction tracking with sent/received history
- **User Balance:** Real-time USDC balance display with test faucet functionality
- **Responsive UI:** Clean, modern interface built with Tailwind CSS

### Smart Contract Features

- **MockUSDC:** ERC20 token for testing with faucet functionality
- **BaseBookEscrow:** Secure escrow contract with the following features:
  - Escrow-based transfers with recipient withdrawal
  - Emergency withdrawal for senders (after 30 days)
  - Transaction tracking and history
  - Access control and security measures
  - Event emission for all major actions

## 🏗️ Architecture

### Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Smart Contracts:** Solidity, Hardhat
- **Blockchain:** Base Sepolia Testnet
- **Wallet Integration:** Wagmi, Viem, OnchainKit
- **Deployment:** Vercel (frontend), Hardhat (smart contracts)

### Project Structure

```
BaseBook/
├── contracts/                 # Smart contracts and deployment
│   ├── contracts/
│   │   ├── MockUSDC.sol      # ERC20 test token
│   │   └── BaseBookEscrow.sol # Main escrow contract
│   ├── scripts/
│   │   ├── deploy.ts         # Deployment script
│   │   └── verify.ts         # Contract verification
│   ├── test/
│   │   └── BaseBookEscrow.test.ts # Comprehensive tests
│   ├── hardhat.config.ts     # Hardhat configuration
│   └── package.json
├── frontend/                 # Next.js frontend application
│   ├── app/
│   │   ├── components/       # React components
│   │   ├── page.tsx         # Main application
│   │   ├── layout.tsx       # App layout
│   │   └── globals.css      # Global styles
│   ├── lib/
│   │   ├── contracts.ts     # Contract ABIs and addresses
│   │   ├── hooks.ts         # Custom React hooks
│   │   └── wagmi.ts         # Wagmi configuration
│   └── package.json
└── README.md                # This file
```

## � Deployed Contracts (Base Sepolia)

The contracts are already deployed and ready to use on Base Sepolia testnet:

| Contract | Address | Verified |
|----------|---------|----------|
| MockUSDC | [`0x1E024B4a268d2E4cf3BCe5a54357257134de8515`](https://sepolia.basescan.org/address/0x1E024B4a268d2E4cf3BCe5a54357257134de8515) | ✅ |
| BaseBookEscrow | [`0xB4ce2e92f30B2E11fd42AD18cB743B414C5523d9`](https://sepolia.basescan.org/address/0xB4ce2e92f30B2E11fd42AD18cB743B414C5523d9) | ✅ |

**Network Information:**

- **Chain ID:** 84532
- **Network Name:** Base Sepolia
- **RPC URL:** <https://sepolia.base.org>
- **Block Explorer:** <https://sepolia.basescan.org>

## �🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Git
- A Web3 wallet (MetaMask or Coinbase Wallet)
- Base Sepolia ETH for gas fees

### 1. Clone the Repository

```bash
git clone <repository-url>
cd basebook
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install contract dependencies
cd ../contracts
pnpm install
```

### 3. Environment Setup

#### Frontend Environment (.env.local)

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Next.js Configuration
NEXT_PUBLIC_APP_NAME=BaseBook
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized remittance platform for Filipino workers

# Base Sepolia Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# Smart Contract Addresses (already deployed on Base Sepolia)
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x1E024B4a268d2E4cf3BCe5a54357257134de8515
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xB4ce2e92f30B2E11fd42AD18cB743B414C5523d9

# Coinbase Developer Platform
NEXT_PUBLIC_CDP_API_KEY=your_cdp_api_key_here
```

#### Contracts Environment (.env)

```bash
cd contracts
cp .env.example .env
```

Edit `.env`:

```env
# Base Sepolia Network Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Your private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# BaseScan API key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here
```

### 4. Deploy Smart Contracts

```bash
cd contracts

# Compile contracts
pnpm run build

# Run tests
pnpm test

# Deploy to Base Sepolia
pnpm run deploy
```

After deployment, update your frontend `.env.local` with the deployed contract addresses.

### 5. Start the Frontend

```bash
cd frontend
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## 📜 Smart Contracts

### MockUSDC.sol

A test ERC20 token with the following features:

- **Symbol:** MUSDC
- **Decimals:** 6 (like real USDC)
- **Faucet Function:** Users can mint up to 1000 MUSDC per transaction
- **Standard ERC20:** Full compatibility with ERC20 standard

### BaseBookEscrow.sol

The main escrow contract with these key functions:

#### Core Functions

- `sendFunds(recipient, amount)` - Send USDC to escrow for a recipient
- `withdrawFunds(transactionId)` - Recipient withdraws funds from escrow
- `emergencyWithdrawal(transactionId)` - Sender emergency withdrawal (after 30 days)

#### View Functions

- `getTransaction(transactionId)` - Get transaction details
- `getSenderTransactions(address)` - Get all transactions sent by address
- `getRecipientTransactions(address)` - Get all transactions for recipient
- `isWithdrawable(transactionId, recipient)` - Check if transaction is withdrawable

#### Events

- `FundsDeposited` - Emitted when funds are sent to escrow
- `FundsWithdrawn` - Emitted when recipient withdraws funds
- `EmergencyWithdrawal` - Emitted when sender performs emergency withdrawal

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
pnpm test
```

The test suite covers:

- Contract deployment and initialization
- Sending funds to escrow
- Recipient withdrawals
- Emergency withdrawals
- Access control and security
- Edge cases and error handling

### Frontend Testing

The frontend can be tested manually by:

1. Connecting your wallet
2. Getting test USDC from the faucet
3. Sending funds to another address
4. Withdrawing funds as the recipient
5. Viewing transaction history

## 🚀 Deployment

### Smart Contract Deployment

1. **Deploy to Base Sepolia:**

```bash
cd contracts
pnpm run deploy
```

2. **Verify contracts (optional):**

```bash
# Set environment variables
export MOCK_USDC_ADDRESS=0x...
export ESCROW_CONTRACT_ADDRESS=0x...

# Verify contracts
pnpm run verify
```

### Frontend Deployment (Vercel)

1. **Deploy to Vercel:**

```bash
cd frontend
pnpm build
```

2. **Set environment variables in Vercel:**
   - Add all variables from `.env.local`
   - Update contract addresses with deployed addresses

3. **Deploy:**

```bash
vercel --prod
```

## 🔐 Security Features

### Smart Contract Security

- **Access Control:** Only recipients can withdraw their funds
- **Reentrancy Protection:** ReentrancyGuard prevents reentrancy attacks
- **Emergency Withdrawals:** Senders can reclaim funds after 30 days
- **Input Validation:** Comprehensive input validation and error handling
- **Safe Transfers:** Uses OpenZeppelin's SafeERC20 for secure token transfers

### Frontend Security

- **Address Validation:** Validates Ethereum addresses before transactions
- **Transaction Previews:** Users can review transactions before signing
- **Error Handling:** Comprehensive error handling and user feedback
- **Network Validation:** Ensures users are on the correct network

## 🌐 Network Information

### Base Sepolia Testnet

- **Chain ID:** 84532
- **RPC URL:** <https://sepolia.base.org>
- **Block Explorer:** <https://sepolia.basescan.org>
- **Faucet:** <https://faucet.quicknode.com/base/sepolia>

### Getting Test ETH

1. Visit the Base Sepolia faucet
2. Enter your wallet address
3. Receive test ETH for gas fees

## 📚 Usage Guide

### For Senders (OFWs)

1. **Connect Wallet:** Connect your MetaMask or Coinbase Wallet
2. **Get Test USDC:** Use the faucet to get MUSDC for testing
3. **Send Funds:**
   - Enter recipient's Ethereum address
   - Enter amount to send
   - Approve USDC spending (if needed)
   - Confirm the transaction
4. **Track Transactions:** View sent transactions in the history tab

### For Recipients

1. **Connect Wallet:** Connect your wallet
2. **Get Transaction ID:** Receive transaction ID from sender
3. **Withdraw Funds:**
   - Enter the transaction ID
   - Review transaction details
   - Confirm withdrawal
4. **Track Transactions:** View received transactions in the history tab

## 🛠️ Development

### Local Development

```bash
# Terminal 1: Start local blockchain (optional)
cd contracts
pnpm hardhat node

# Terminal 2: Deploy to local network (optional)
pnpm hardhat run scripts/deploy.ts --network localhost

# Terminal 3: Start frontend
cd frontend
pnpm dev
```

### Adding New Features

1. **Smart Contracts:** Add new functions to contracts and update ABIs
2. **Frontend:** Update contract ABIs in `lib/contracts.ts`
3. **Hooks:** Add new hooks in `lib/hooks.ts`
4. **Components:** Create new React components in `app/components/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🆘 Support

For support, please:

1. Check the troubleshooting section below
2. Review the documentation
3. Create an issue on GitHub

## 🐛 Troubleshooting

### Common Issues

**"Transaction failed" errors:**

- Ensure you have enough Base Sepolia ETH for gas
- Check that contract addresses are correctly set
- Verify you're on the Base Sepolia network

**"Insufficient allowance" errors:**

- Approve USDC spending before sending funds
- Check that you have enough USDC balance

**Wallet connection issues:**

- Ensure your wallet supports Base Sepolia
- Add Base Sepolia network to your wallet manually if needed

**Contract not found errors:**

- Verify contract addresses in environment variables
- Ensure contracts are deployed to Base Sepolia

### Network Configuration

If Base Sepolia is not in your wallet, add it manually:

- **Network Name:** Base Sepolia
- **RPC URL:** <https://sepolia.base.org>
- **Chain ID:** 84532
- **Currency Symbol:** ETH
- **Block Explorer:** <https://sepolia.basescan.org>

## 🎯 Roadmap

### Phase 1 (Current)

- ✅ Basic escrow functionality
- ✅ Wallet integration
- ✅ Transaction history
- ✅ Test token faucet

### Phase 2 (Future)

- [ ] Multi-token support
- [ ] Transaction fees
- [ ] Mobile app
- [ ] Integration with real USDC

### Phase 3 (Future)

- [ ] Cross-chain functionality
- [ ] Advanced escrow features
- [ ] Partnership integrations
- [ ] Mainnet deployment

---

**Built with ❤️ by the MetaBase Team**

For more information about Base and building on Base, visit [base.org](https://base.org)
