import { deriveKeyPairs } from "./data-model/src/utils/keyDerivation";
import { PrivateKey } from "o1js";

export const createKeyPair = () => {
    const keyPairs = deriveKeyPairs(PrivateKey.random().toBase58());
    return keyPairs
}