import { describe, it, expect } from '@jest/globals';
import { Group, Poseidon, PrivateKey, Provable, PublicKey, Scalar } from 'o1js';
import { KeyPairs, deriveKeyPairs } from '../src/utils/keyDerivation';
import { PRIVATE_KEY_0 } from './test_vectors/testVectors';
import { UTXO } from '../src/dataModel';
import { decryptUTXOValue } from '../src/utils/utils';
import { beforeEach } from 'bun:test';

describe('UTXO Tests', () => {
    let privSpendKeyBase58: string;
    let keyPairsSender: KeyPairs;
    let value: bigint;

    beforeEach(() => {
        // Initialize the private spend key and value.
        privSpendKeyBase58 = PRIVATE_KEY_0;
        keyPairsSender = deriveKeyPairs(privSpendKeyBase58);
        value = BigInt(1_000_000); // or any number you choose
    });
    it('should mask and unmask value', () => {
        // Generate a random private key for the transaction.
    const r = Provable.witness(Scalar, () => Scalar.random());

    // Compute the public key corresponding to r. This is R = r*G.
    const R = PublicKey.fromGroup(Group.generator.scale(r));

    // Compute the ephemeral key F. 
    const F = PublicKey.fromBase58(keyPairsSender.V).toGroup().scale(r);

    // Calculate the shared secret ss = H(r*V) = H(v*R).
    const ss = Scalar.from(Poseidon.hash(F.toFields()).toBigInt());

    // Derive the one-time destination address, K.
    const K = Group.generator.scale(ss.toBigInt()).add(PublicKey.fromBase58(keyPairsSender.S).toGroup());
    console.log("K: ", PublicKey.fromGroup(K).toBase58())

    // Mask the value using the hashed shared secret
    const valueScalar = Scalar.from(value);
    const maskedValue = valueScalar.add(ss);  // Naive "encryption" using addition
    // Compute shared secret using the ephemeral public key from this UTXO and viewingPrivateKey
    const F_ = R.toGroup().scale(PrivateKey.fromBase58(keyPairsSender.v).toBigInt());
    const ss_ = Scalar.from(Poseidon.hash(F_.toFields()).toBigInt());

    // Unmask the value
    const unmaskedValue = maskedValue.sub(ss_).toJSON();  // Naive "decryption" using subtraction
    expect(BigInt(unmaskedValue)).toEqual(value);
    })
    it('should encrypt and decrypt UTXO value correctly', () => {
        const utxo = new UTXO(PublicKey.fromBase58(keyPairsSender.S), PublicKey.fromBase58(keyPairsSender.V), value);

        // Now, let's decrypt it
        const decryptedValue = decryptUTXOValue(utxo, PrivateKey.fromBase58(keyPairsSender.v));
        expect(decryptedValue).toEqual(value);
    });
});