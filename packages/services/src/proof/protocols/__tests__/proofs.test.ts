import { ZERO_ADDRESS } from "@cryptkeeper/constants";
import { IdentityMetadata, RLNProofRequest } from "@cryptkeeper/types";
import { Identity } from "@semaphore-protocol/identity";
import { generateProof } from "@semaphore-protocol/proof";
import { MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { RLN } from "rlnjs";

import { SemaphoreIdentity } from "../../../identity";
import { getMerkleProof } from "../../utils";
import { RLNProofService } from "../RLNProof";
import { SemaphoreProofService } from "../SemaphoreProof";

jest.mock("rlnjs");

jest.mock("@semaphore-protocol/proof");

jest.mock("../../utils");

describe("services/proof/protocols", () => {
  const defaultIdentity = new Identity("1234");

  const defaultIdentityMetadata: IdentityMetadata = {
    account: ZERO_ADDRESS,
    name: "Identity #1",
    identityStrategy: "interrep",
    web2Provider: "twitter",
  };

  const proofRequest: RLNProofRequest = {
    externalNullifier: "externalNullifier",
    signal: "0x0",
    circuitFilePath: "circuitFilePath",
    verificationKey: "verificationKey",
    zkeyFilePath: "zkeyFilePath",
    rlnIdentifier: "rlnIdentifier",
  };

  const defaultMerkleProof: MerkleProof = {
    root: 0n,
    leaf: 1n,
    siblings: [],
    pathIndices: [],
  };

  const identityDecorater = new SemaphoreIdentity(defaultIdentity, defaultIdentityMetadata);

  beforeEach(() => {
    (getMerkleProof as jest.Mock).mockReturnValue(defaultMerkleProof);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("rln", () => {
    test("should generate rln proof properly with remote merkle proof", async () => {
      const rln = new RLNProofService();

      await rln.genProof(identityDecorater, { ...proofRequest, merkleStorageAddress: "http://localhost:3000/merkle" });
      const [rlnInstance] = (RLN as unknown as jest.Mock).mock.instances as [{ generateProof: jest.Mock }];

      expect(rlnInstance.generateProof).toBeCalledTimes(1);
      expect(rlnInstance.generateProof).toBeCalledWith(
        proofRequest.signal,
        defaultMerkleProof,
        proofRequest.externalNullifier,
      );
    });

    test("should handle error properly when generating rln proof", async () => {
      (getMerkleProof as jest.Mock).mockRejectedValue(new Error("error"));

      const rln = new RLNProofService();

      const promise = rln.genProof(identityDecorater, {
        ...proofRequest,
        merkleStorageAddress: "http://localhost:3000/merkle",
      });

      await expect(promise).rejects.toThrowError("error");
    });
  });

  describe("semaphore", () => {
    test("should generate semaphore proof properly with remote merkle proof", async () => {
      const semaphore = new SemaphoreProofService();

      await semaphore.genProof(identityDecorater, {
        ...proofRequest,
        merkleStorageAddress: "http://localhost:3000/merkle",
      });

      expect(generateProof).toBeCalledTimes(1);
      expect(generateProof).toBeCalledWith(
        identityDecorater.zkIdentity,
        defaultMerkleProof,
        proofRequest.externalNullifier,
        proofRequest.signal,
        { wasmFilePath: proofRequest.circuitFilePath, zkeyFilePath: proofRequest.zkeyFilePath },
      );
    });

    test("should handle error properly when generating semaphore proof", async () => {
      (getMerkleProof as jest.Mock).mockRejectedValue(new Error("error"));
      const semaphore = new SemaphoreProofService();

      const promise = semaphore.genProof(identityDecorater, {
        ...proofRequest,
        merkleStorageAddress: "http://localhost:3000/merkle",
      });

      await expect(promise).rejects.toThrowError("error");
    });
  });
});
