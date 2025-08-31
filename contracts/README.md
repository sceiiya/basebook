# BaseBook Smart Contracts

This directory contains the smart contracts for the BaseBook remittance platform.

## Contracts

### MockUSDC.sol
A test ERC20 token contract that mimics USDC for testing purposes.

**Key Features:**
- 6 decimals (like real USDC)
- Faucet function for testing
- Standard ERC20 functionality
- Owner can mint tokens

### BaseBookEscrow.sol
The main escrow contract that handles remittance transactions.

**Key Features:**
- Escrow-based transfers
- Recipient-only withdrawals
- Emergency withdrawal for senders (after 30 days)
- Transaction tracking and history
- Comprehensive event logging

## Deployment

### Prerequisites
1. Node.js 18+ and pnpm
2. Base Sepolia ETH for deployment
3. Environment variables configured

### Environment Setup
Create a `.env` file with:
```env
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

### Deploy Commands
```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm run build

# Run tests
pnpm test

# Deploy to Base Sepolia
pnpm run deploy

# Verify contracts (optional)
MOCK_USDC_ADDRESS=0x... ESCROW_CONTRACT_ADDRESS=0x... pnpm run verify
```

## Testing

Run the comprehensive test suite:
```bash
pnpm test
```

Tests cover:
- Contract deployment
- Token functionality
- Escrow operations
- Access control
- Edge cases
- Security scenarios

## Contract Addresses

After deployment, the addresses will be displayed. Update your frontend environment variables:
- `NEXT_PUBLIC_MOCK_USDC_ADDRESS`
- `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS`

## Security

The contracts implement several security measures:
- ReentrancyGuard protection
- Access control for withdrawals
- Safe token transfers
- Input validation
- Emergency withdrawal mechanisms

## Gas Optimization

The contracts are optimized for gas efficiency:
- Efficient storage usage
- Minimal external calls
- Optimized loops and operations
