/* eslint-disable no-param-reassign */
import { createSlice } from "@reduxjs/toolkit";
import deepEqual from "fast-deep-equal";

import { RPCAction } from "packages/extension/src/constants";
import postMessage from "packages/extension/src/util/postMessage";

import type { PayloadAction } from "@reduxjs/toolkit";
import type { TypedThunk } from "packages/extension/src/ui/store/configureAppStore";

import { useAppSelector } from "./hooks";

export interface AppState {
  isInitialized: boolean;
  isUnlocked: boolean;
  isMnemonicGenerated: boolean;
  isDisconnectedPermanently?: boolean;
}

const initialState: AppState = {
  isInitialized: false,
  isUnlocked: false,
  isMnemonicGenerated: false,
  isDisconnectedPermanently: undefined,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setStatus: (state: AppState, action: PayloadAction<Omit<AppState, "isDisconnectedPermanently">>) => {
      state.isInitialized = action.payload.isInitialized;
      state.isUnlocked = action.payload.isUnlocked;
      state.isMnemonicGenerated = action.payload.isMnemonicGenerated;
    },

    setDisconnectedPermanently: (state: AppState, action: PayloadAction<boolean>) => {
      state.isDisconnectedPermanently = action.payload;
    },
  },
});

export const { setStatus } = appSlice.actions;

export const lock = () => async (): Promise<void> => {
  await postMessage({ method: RPCAction.LOCK });
};

export const closePopup = () => async (): Promise<void> => {
  await postMessage({ method: RPCAction.CLOSE_POPUP });
};

export const unlock = (password: string) => async (): Promise<boolean> =>
  postMessage<boolean>({ method: RPCAction.UNLOCK, payload: password });

export const setupPassword = (password: string) => async (): Promise<boolean> =>
  postMessage<boolean>({ method: RPCAction.SETUP_PASSWORD, payload: password });

export const fetchStatus = (): TypedThunk => async (dispatch) => {
  const status = await postMessage<AppState>({ method: RPCAction.GET_STATUS });
  dispatch(setStatus(status));
};

export const setWalletConnection =
  (isDisconnectedPermanently: boolean): TypedThunk =>
  async (dispatch): Promise<void> => {
    await postMessage({ method: RPCAction.SET_CONNECT_WALLET, payload: { isDisconnectedPermanently } });
    dispatch(appSlice.actions.setDisconnectedPermanently(isDisconnectedPermanently));
  };

export const getWalletConnection =
  (): TypedThunk =>
  async (dispatch): Promise<void> => {
    const response = await postMessage<{ isDisconnectedPermanently: boolean }>({
      method: RPCAction.GET_CONNECT_WALLET,
    });
    dispatch(appSlice.actions.setDisconnectedPermanently(Boolean(response?.isDisconnectedPermanently)));
  };

export const saveMnemonic =
  (mnemonic: string): TypedThunk<Promise<void>> =>
  async (dispatch) => {
    await postMessage({ method: RPCAction.SAVE_MNEMONIC, payload: mnemonic });
    dispatch(setStatus({ isInitialized: true, isUnlocked: true, isMnemonicGenerated: true }));
  };

export const useAppStatus = (): AppState => useAppSelector((state) => state.app, deepEqual);

export default appSlice.reducer;