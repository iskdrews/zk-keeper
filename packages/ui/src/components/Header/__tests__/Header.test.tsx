/**
 * @jest-environment jsdom
 */

import { Paths } from "@cryptkeeper/constants";
import { getExtensionUrl, redirectToNewTab } from "@cryptkeeper/controllers";
import { act, render } from "@testing-library/react";
import { useNavigate } from "react-router-dom";

import { Header } from "..";
import { useWallet, defaultWalletHookData } from "../../../hooks/wallet";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../ui/hooks/wallet", (): unknown => ({
  useWallet: jest.fn(),
}));

jest.mock("@cryptkeeper/controllers", (): unknown => ({
  redirectToNewTab: jest.fn(),
  getExtensionUrl: jest.fn(),
}));

describe("ui/components/Header", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useWallet as jest.Mock).mockReturnValue(defaultWalletHookData);

    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    (getExtensionUrl as jest.Mock).mockReturnValue("options.html");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should render properly", async () => {
    (useWallet as jest.Mock).mockReturnValue({
      ...defaultWalletHookData,
      isActive: true,
    });

    const { findByText } = render(<Header />);

    const chain = await findByText(defaultWalletHookData.chain?.name as string);

    expect(chain).toBeInTheDocument();
  });

  test("should render properly without connected wallet", async () => {
    (useWallet as jest.Mock).mockReturnValue({
      ...defaultWalletHookData,
      address: undefined,
      chain: undefined,
      isActive: false,
      isActivating: false,
    });

    const { findByTestId } = render(<Header />);

    const icon = await findByTestId("inactive-wallet-icon");

    expect(icon).toBeInTheDocument();
  });

  test("should render properly activating state", async () => {
    (useWallet as jest.Mock).mockReturnValue({
      ...defaultWalletHookData,
      address: undefined,
      chain: undefined,
      isActive: false,
      isActivating: true,
    });

    const { findByTestId } = render(<Header />);

    const icon = await findByTestId("inactive-wallet-icon-activating");

    expect(icon).toBeInTheDocument();
  });

  test("should render without installed wallet", async () => {
    (useWallet as jest.Mock).mockReturnValue({
      ...defaultWalletHookData,
      isInjectedWallet: false,
    });

    const { findByTestId, findByText } = render(<Header />);

    const menu = await findByTestId("menu");
    await act(async () => Promise.resolve(menu.click()));

    const metamaskInstall = await findByText("Install metamask");
    await act(async () => Promise.resolve(metamaskInstall.click()));

    expect(redirectToNewTab).toBeCalledTimes(1);
    expect(redirectToNewTab).toBeCalledWith("https://metamask.io/");
  });

  test("should redirect to options page", async () => {
    const { findByTestId, findByText } = render(<Header />);

    const menu = await findByTestId("menu");
    await act(async () => Promise.resolve(menu.click()));

    const options = await findByText("Settings");
    await act(async () => Promise.resolve(options.click()));

    expect(mockNavigate).toBeCalledTimes(1);
    expect(mockNavigate).toBeCalledWith(Paths.SETTINGS);
  });

  test("should redirect to home page", async () => {
    const { findByTestId } = render(<Header />);

    const logo = await findByTestId("logo");
    await act(async () => Promise.resolve(logo.click()));

    expect(mockNavigate).toBeCalledTimes(1);
    expect(mockNavigate).toBeCalledWith(Paths.HOME);
  });
});