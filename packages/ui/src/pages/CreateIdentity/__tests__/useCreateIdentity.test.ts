/**
 * @jest-environment jsdom
 */

import { ZERO_ADDRESS, IDENTITY_TYPES, Paths } from "@cryptkeeper/constants";
import { useAppDispatch, createIdentity } from "@cryptkeeper/redux";
import { act, renderHook } from "@testing-library/react";
import { useNavigate } from "react-router-dom";

import { useWallet, defaultWalletHookData } from "../../../hooks/wallet";
import { signIdentityMessage } from "../../../services/identity";
import { useCreateIdentity } from "../useCreateIdentity";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../ui/ducks/hooks", (): unknown => ({
  useAppDispatch: jest.fn(),
}));

jest.mock("../ui/services/identity", (): unknown => ({
  signIdentityMessage: jest.fn(),
}));

jest.mock("../ui/ducks/app", (): unknown => ({
  closePopup: jest.fn(),
}));

jest.mock("../ui/ducks/identities", (): unknown => ({
  createIdentity: jest.fn(),
}));

jest.mock("../ui/hooks/wallet", (): unknown => ({
  useWallet: jest.fn(),
}));

describe("ui/pages/CreateIdentity/useCreateIdentity", () => {
  const mockSignedMessage = "signed-message";

  const mockDispatch = jest.fn();

  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

    (signIdentityMessage as jest.Mock).mockReturnValue(mockSignedMessage);

    (createIdentity as jest.Mock).mockReturnValue(true);

    (useWallet as jest.Mock).mockReturnValue(defaultWalletHookData);

    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return initial data", () => {
    const { result } = renderHook(() => useCreateIdentity());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isProviderAvailable).toBe(true);
    expect(result.current.control).toBeDefined();
    expect(result.current.errors).toStrictEqual({
      root: undefined,
      web2Provider: undefined,
      identityStrategyType: undefined,
      nonce: undefined,
    });
  });

  test("should create identity properly", async () => {
    const { result } = renderHook(() => useCreateIdentity());

    await act(async () => Promise.resolve(result.current.onSubmit()));

    expect(result.current.isLoading).toBe(false);
    expect(signIdentityMessage).toBeCalledTimes(1);
    expect(mockDispatch).toBeCalledTimes(1);
    expect(createIdentity).toBeCalledTimes(1);
    expect(createIdentity).toBeCalledWith("interrep", mockSignedMessage, {
      account: ZERO_ADDRESS,
      nonce: 0,
      web2Provider: "twitter",
    });
    expect(mockNavigate).toBeCalledTimes(1);
    expect(mockNavigate).toBeCalledWith(Paths.HOME);
  });

  test("should close modal properly", () => {
    const { result } = renderHook(() => useCreateIdentity());

    act(() => result.current.closeModal());

    expect(mockDispatch).toBeCalledTimes(1);
  });

  test("should handle create identity error properly", async () => {
    const error = new Error("create-identity-error");

    (createIdentity as jest.Mock).mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useCreateIdentity());

    await act(async () =>
      Promise.resolve(
        result.current.register("identityStrategyType").onChange({ target: { value: IDENTITY_TYPES[0] } }),
      ),
    );

    await act(async () => Promise.resolve(result.current.onSubmit()));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.errors.root).toBe(error.message);
  });
});