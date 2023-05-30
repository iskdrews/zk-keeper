import { isDebugMode } from "@cryptkeeper/config";
import { AnyAction, configureStore, ThunkDispatch, ThunkAction } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import thunk from "redux-thunk";

import { app } from "../ducks/app";
import { identities } from "../ducks/identities";
import { permissions } from "../ducks/permissions";
import { requests } from "../ducks/requests";

const rootReducer = {
  identities,
  requests,
  app,
  permissions,
};

const middlewares = isDebugMode() ? [thunk, createLogger({ collapsed: true })] : [thunk];

function configureAppStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...middlewares),
    devTools: isDebugMode(),
  });
}

export const store = configureAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type TypedDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
export type TypedThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;