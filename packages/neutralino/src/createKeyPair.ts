import { deriveKeyPairs } from "@dark-matter/data-model";
import { PrivateKey } from "o1js";

export const createKeyPair = () => {
    const keyPairs = deriveKeyPairs(PrivateKey.random().toBase58());
    return keyPairs
}