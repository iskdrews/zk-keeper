import { Chain, getChains } from "@cryptkeeper/config";
import { ConnectorNames, getConnectorName } from "@cryptkeeper/connectors";
import { useAppDispatch, useAppStatus, getWalletConnection, setWalletConnection, lock } from "@cryptkeeper/redux";
import { useWeb3React } from "@web3-react/core";
import BigNumber from "bignumber.js";
import { formatUnits } from "ethers";
import { useCallback, useEffect, useState } from "react";

import type { Connector } from "@web3-react/types";
import type { BrowserProvider } from "ethers/types/providers";

export { defaultWalletHookData } from "./mock";

export interface IUseWalletData {
  isActive: boolean;
  isActivating: boolean;
  isInjectedWallet: boolean;
  address?: string;
  balance?: BigNumber;
  chain?: Chain;
  connectorName?: ConnectorNames;
  connector?: Connector;
  provider?: BrowserProvider;
  onConnect: () => Promise<void>;
  onConnectEagerly: () => Promise<void>;
  onLock: () => void;
  onDisconnect: () => Promise<void>;
}

export const useWallet = (): IUseWalletData => {
  const [balance, setBalance] = useState<BigNumber>();
  const { connector, isActive, isActivating, provider, hooks } = useWeb3React();
  const { isDisconnectedPermanently } = useAppStatus();
  const dispatch = useAppDispatch();
  const connectorName = getConnectorName(connector);

  const chains = getChains();

  const chainId = hooks?.usePriorityChainId();
  const address = hooks?.usePriorityAccount();
  const chain = chainId ? chains[chainId] : undefined;
  const decimals = chain?.nativeCurrency.decimals;

  useEffect(() => {
    dispatch(getWalletConnection());
  }, [dispatch]);

  useEffect(() => {
    if (!address || !provider) {
      return;
    }

    provider
      .getBalance(address)
      .then((wei) => new BigNumber(formatUnits(wei.toString(), decimals)))
      .then((value) => setBalance(value));
  }, [address, chainId, provider, decimals, setBalance]);

  const onConnect = useCallback(async () => {
    dispatch(setWalletConnection(false));
    await connector.activate();
  }, [connector, dispatch]);

  const onConnectEagerly = useCallback(async () => {
    if (isDisconnectedPermanently === false) {
      await connector.connectEagerly?.();
    }
  }, [connector, isDisconnectedPermanently]);

  const onDisconnect = useCallback(async () => {
    dispatch(setWalletConnection(true));
    await connector.deactivate?.();
    await connector.resetState();
  }, [connector, dispatch]);

  const onLock = useCallback(() => {
    dispatch(lock());
  }, [dispatch]);

  return {
    isActive,
    isActivating,
    isInjectedWallet: Boolean(window.ethereum),
    address,
    balance,
    chain,
    connectorName,
    connector,
    provider: provider as unknown as BrowserProvider,
    onConnect,
    onConnectEagerly,
    onDisconnect,
    onLock,
  };
};
