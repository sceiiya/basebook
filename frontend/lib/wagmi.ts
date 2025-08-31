import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, metaMask } from "wagmi/connectors";

export function getWagmiConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      coinbaseWallet({
        appName: "BaseBook",
        appLogoUrl: "/logo.png",
      }),
      metaMask(),
    ],
    transports: {
      [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || baseSepolia.rpcUrls.default.http[0]),
    },
  });
}

export const wagmiConfig = getWagmiConfig();
