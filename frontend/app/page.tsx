"use client";

import { useState } from "react";
import { WalletConnection } from "./components/WalletConnection";
import { SendFunds } from "./components/SendFunds";
import { WithdrawFunds } from "./components/WithdrawFunds";
import { TransactionHistory } from "./components/TransactionHistory";
import { UserBalance } from "./components/UserBalance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/Tabs";
import { AlertProvider } from "./components/AlertProvider";

export default function App() {
  return (
    <AlertProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/logo.png" alt="BaseBook" className="h-12 w-12 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">BaseBook</h1>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Decentralized remittance platform for Filipino workers on Base
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Powered by Base Sepolia • Developed by MetaBase Team
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="mb-8">
            <WalletConnection />
          </div>

          {/* Balance Display */}
          <div className="mb-8">
            <UserBalance />
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <Tabs defaultValue="send" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="send">Send Money</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                <TabsTrigger value="history">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="send" className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Send USDC</h2>
                  <p className="text-gray-600">Send stablecoins to recipients in the Philippines</p>
                </div>
                <SendFunds />
              </TabsContent>
              
              <TabsContent value="withdraw" className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Withdraw Funds</h2>
                  <p className="text-gray-600">Withdraw funds sent to you from escrow</p>
                </div>
                <WithdrawFunds />
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Transaction History</h2>
                  <p className="text-gray-600">View all your sent and received transactions</p>
                </div>
                <TransactionHistory />
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-gray-500 text-sm">
            <p>Built on Base Sepolia Testnet • Open Source • MetaBase 2024</p>
            <p className="mt-2">
              <a 
                href="https://sepolia.basescan.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-600"
              >
                View on BaseScan
              </a>
            </p>
          </footer>
        </div>
      </div>
    </AlertProvider>
  );
}
