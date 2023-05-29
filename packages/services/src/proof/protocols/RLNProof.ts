import { RLNProofRequest } from "@cryptkeeper/types";
import { RLN, RLNFullProof } from "rlnjs";

import { SemaphoreIdentity } from "../../identity";
import { getMerkleProof, getRlnVerficationKeyJson } from "../utils";

import { IProof } from "./types";

export class RLNProofService implements IProof<RLNProofRequest, RLNFullProof> {
  async genProof(
    identity: SemaphoreIdentity,
    {
      circuitFilePath,
      zkeyFilePath,
      verificationKey,
      merkleStorageAddress,
      externalNullifier,
      signal,
      merkleProofArtifacts,
      merkleProof: providerMerkleProof,
    }: RLNProofRequest,
  ): Promise<RLNFullProof> {
    const rlnVerificationKeyJson = await getRlnVerficationKeyJson(verificationKey);

    const rln = new RLN(circuitFilePath, zkeyFilePath, rlnVerificationKeyJson);

    const identityCommitment = identity.genIdentityCommitment();

    const merkleProof = await getMerkleProof({
      identityCommitment,
      merkleProofArtifacts,
      merkleStorageAddress,
      providerMerkleProof,
    });

    return rln.generateProof(signal, merkleProof, externalNullifier);
  }
}
