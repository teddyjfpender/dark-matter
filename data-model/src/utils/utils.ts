import { Encoding, Encryption, PrivateKey } from "o1js";
import { UTXO } from "../dataModel";

export function decryptUTXOValue(utxo: UTXO, viewingPrivateKey: PrivateKey): bigint {
    const encryptedValue = utxo.encryptedValue;
    const publicKey = utxo.encryptedValue.publicKey;
    const cipherText = encryptedValue.cipherText;
    const decryptedFields = Encryption.decrypt({publicKey, cipherText}, viewingPrivateKey);
    return BigInt(Encoding.stringFromFields(decryptedFields));
  }