/**
 * @jest-environment jsdom
 */

import EventEmitter from "@src/background/services/event";
import { ZERO_ADDRESS } from "@src/config/const";
import { initializeInjectedProvider } from "@src/providers";

import { cryptKeeper, cryptKeeperHooks, CryptKeeperConnector } from "..";

jest.mock("@src/providers", (): unknown => ({
  initializeInjectedProvider: jest.fn(),
}));

describe("connectors/cryptKeeper", () => {
  const cancelActivation = jest.fn();

  const mockAddresses = [ZERO_ADDRESS];

  const mockActions = {
    startActivation: jest.fn(() => cancelActivation),
    update: jest.fn(),
    resetState: jest.fn(),
  };

  type MockProvider = {
    isCryptKeeper: boolean;
    accounts: () => Promise<string[]>;
    connect: () => Promise<void>;
  };

  const mockProvider = new EventEmitter() as MockProvider & EventEmitter;

  beforeEach(() => {
    mockProvider.isCryptKeeper = true;
    mockProvider.accounts = jest.fn(() => Promise.resolve(mockAddresses));
    mockProvider.connect = jest.fn(() => Promise.resolve());

    (initializeInjectedProvider as jest.Mock).mockReturnValue(mockProvider);
  });

  afterEach(() => {
    mockProvider.cleanListeners();
    jest.clearAllMocks();
  });

  test("should return connector objects and hooks", () => {
    expect(cryptKeeper).toBeDefined();
    expect(cryptKeeperHooks).toBeDefined();
  });

  test("should activate connector properly", async () => {
    const connector = new CryptKeeperConnector(mockActions);

    await connector.activate();

    expect(mockActions.update).toBeCalledTimes(1);
    expect(mockActions.update).toBeCalledWith({ accounts: mockAddresses });
  });

  test("should activate connector twice properly", async () => {
    const connector = new CryptKeeperConnector(mockActions);

    await connector.activate();
    await connector.activate();

    expect(mockActions.update).toBeCalledTimes(2);
  });

  test("should start activation properly", async () => {
    mockProvider.isCryptKeeper = false;
    mockProvider.accounts = jest.fn(() => Promise.resolve(mockAddresses));
    mockProvider.connect = jest.fn(() => Promise.resolve());
    (initializeInjectedProvider as jest.Mock).mockReturnValue(mockProvider);

    const connector = new CryptKeeperConnector(mockActions);

    await connector.activate();

    expect(mockActions.startActivation).toBeCalledTimes(1);
  });

  test("should throw error if there is no provider", async () => {
    (initializeInjectedProvider as jest.Mock).mockReturnValue(undefined);

    const connector = new CryptKeeperConnector(mockActions);

    await expect(connector.activate()).rejects.toThrow("No cryptkeeper installed");
    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(cancelActivation).toBeCalledTimes(1);
  });

  test("should handle incomming events properly", async () => {
    const connector = new CryptKeeperConnector(mockActions);

    await connector.activate();

    await Promise.resolve(mockProvider.emit("login"));
    await Promise.resolve(mockProvider.emit("logout"));

    expect(mockActions.update).toBeCalledTimes(2);
    expect(mockActions.update).toHaveBeenNthCalledWith(1, { accounts: mockAddresses });
    expect(mockActions.update).toHaveBeenNthCalledWith(2, { accounts: mockAddresses });
    expect(mockActions.resetState).toBeCalledTimes(1);
  });

  test("should not connect eagerly if there is no provider", async () => {
    (initializeInjectedProvider as jest.Mock).mockReturnValue(undefined);
    const connector = new CryptKeeperConnector(mockActions);

    await connector.connectEagerly();

    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(cancelActivation).toBeCalledTimes(1);
  });

  test("should reset state when connecting eagerly throws an error", async () => {
    (initializeInjectedProvider as jest.Mock).mockImplementation(() => {
      throw new Error();
    });
    const connector = new CryptKeeperConnector(mockActions);

    await connector.connectEagerly();

    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(mockActions.resetState).toBeCalledTimes(1);
    expect(cancelActivation).toBeCalledTimes(1);
  });

  test("should connect eagerly and set accounts properly", async () => {
    const connector = new CryptKeeperConnector(mockActions);

    await connector.connectEagerly();

    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(mockActions.update).toBeCalledTimes(1);
    expect(mockActions.update).toBeCalledWith({ accounts: mockAddresses });
  });
});
