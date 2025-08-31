#!/bin/bash

# BaseBook Frontend Deployment Script
echo "🚀 Deploying BaseBook Frontend to Vercel..."

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_MOCK_USDC_ADDRESS" ] || [ -z "$NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS" ]; then
    echo "❌ Error: Contract addresses not set in environment variables"
    echo "Please set NEXT_PUBLIC_MOCK_USDC_ADDRESS and NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🏗️ Building application..."
pnpm build

# Check build success
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📋 Contract addresses configured:"
    echo "   MockUSDC: $NEXT_PUBLIC_MOCK_USDC_ADDRESS"
    echo "   Escrow: $NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS"
    echo ""
    echo "🌐 Ready for deployment to Vercel!"
    echo "Run: vercel --prod"
else
    echo "❌ Build failed!"
    exit 1
fi
