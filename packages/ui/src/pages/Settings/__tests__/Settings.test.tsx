/**
 * @jest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { useNavigate } from "react-router-dom";

import Settings from "..";
import { useWallet, defaultWalletHookData } from "../../../hooks/wallet";
import { IUseSettingsData, SettingsTabs, useSettings } from "../useSettings";

jest.mock("react-router-dom", (): unknown => ({
  useNavigate: jest.fn(),
}));

jest.mock("../ui/hooks/wallet", (): unknown => ({
  useWallet: jest.fn(),
}));

jest.mock("../useSettings", (): unknown => ({
  ...jest.requireActual("../useSettings"),
  useSettings: jest.fn(),
}));

describe("ui/pages/Settings", () => {
  const mockNavigate = jest.fn();

  const defaultHookData: IUseSettingsData = {
    isLoading: false,
    isConfirmModalOpen: false,
    tab: SettingsTabs.GENERAL,
    settings: { isEnabled: true },
    onConfirmModalShow: jest.fn(),
    onDeleteAllHistory: jest.fn(),
    onEnableHistory: jest.fn(),
    onTabChange: jest.fn(),
    onGoBack: jest.fn(),
    onGoToBackup: jest.fn(),
    onDeleteAllIdentities: jest.fn(),
  };

  beforeEach(() => {
    (useWallet as jest.Mock).mockReturnValue(defaultWalletHookData);

    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    (useSettings as jest.Mock).mockReturnValue(defaultHookData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should render general settings properly", async () => {
    const { container, findByTestId } = render(
      <Suspense>
        <Settings />
      </Suspense>,
    );

    await waitFor(() => container.firstChild !== null);

    const section = await findByTestId("general-settings");

    expect(section).toBeInTheDocument();
  });

  test("should render advanced settings properly", async () => {
    (useSettings as jest.Mock).mockReturnValue({ ...defaultHookData, tab: SettingsTabs.ADVANCED });

    const { container, findByTestId } = render(
      <Suspense>
        <Settings />
      </Suspense>,
    );

    await waitFor(() => container.firstChild !== null);

    const section = await findByTestId("advanced-settings");

    expect(section).toBeInTheDocument();
  });
});