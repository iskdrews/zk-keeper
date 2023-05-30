/**
 * @jest-environment jsdom
 */
import { initializeInjectedProvider, setGlobalInjectedPrivider } from "../initializeInjectedProvider";
import { CryptKeeperInjectedProvider } from "../sdk";

jest.mock("@cryptkeeper/services", (): unknown => ({
  EventEmitter: jest.fn().mockImplementation(),
  ProofService: {
    getInstance: jest.fn(),
  } 
}));

describe("InitialzieInjectedProvider", () => {
  test("Should be window.cryptkeeper undefined yet", () => {
    expect(window.cryptkeeper).not.toBeDefined();
  });

  test("Should be able to initialize CK injected provider", () => {
    initializeInjectedProvider();
    expect(window.cryptkeeper).toBeDefined();
    expect(window.cryptkeeper.isCryptKeeper).toBe(true);
    const dispatchEventSpy = jest.spyOn(window, "addEventListener");
    expect(dispatchEventSpy).toHaveBeenCalledWith("message", window.cryptkeeper.eventResponser);
  });

  test("Should be able to set global injected provider", () => {
    const injectedProvider = new CryptKeeperInjectedProvider();
    setGlobalInjectedPrivider(injectedProvider);
    expect(window.cryptkeeper).toBeDefined();
    expect(window.cryptkeeper).toBe(injectedProvider);
    expect(window.cryptkeeper.isCryptKeeper).toBe(true);
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    expect(dispatchEventSpy).toHaveBeenCalledWith(new Event(`cryptkeeper#initialized`));
  });
});