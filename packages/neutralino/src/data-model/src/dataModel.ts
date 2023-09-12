import { Poseidon, Struct, PublicKey, Group, Scalar, Provable, Field, Encoding, Encryption} from 'o1js';

interface EncryptedValueType {
  publicKey: Group;
  cipherText: Field[]
}

export class EncryptedValue extends Struct({
    publicKey: Group,
    cipherText: Provable.Array(Field, 255) // 255 is hardcoded for now, but we should change this to be dynamic... somehow...
  }) implements EncryptedValueType {
    constructor(publicKey: Group, cipherText: Field[]) {
  
      super({ publicKey: publicKey, cipherText: cipherText });
    }
    toJSON(encryptedValue: EncryptedValueType) {
        return {
            publicKey: Group.toJSON(encryptedValue.publicKey),
            cipherText: encryptedValue.cipherText.map((field) => field.toBigInt().toString()),
        }
    }
  fromJSON(encryptedValue: any) {
    const encryptedValueObject = JSON.parse(encryptedValue);
    const publicKey = PublicKey.fromBase58(encryptedValueObject.publicKey).toGroup();
    const cipherText = encryptedValueObject.cipherText.map((field: string) => Field.from(field));
        return { publicKey, cipherText } as EncryptedValueType;
    }
  }

export interface UTXOType {
    oneTimeAddress: PublicKey;
    ephemeralPublicKey: PublicKey;
    value: Field;
}

export class UTXO extends Struct({
    oneTimeAddress: PublicKey,
    ephemeralPublicKey: PublicKey,
    value: Field,
  }) implements UTXOType {
    constructor(publicSpendKey: PublicKey, publicViewKey: PublicKey, value: Field) {

      // Generate a random private key for the transaction.
      const r = Provable.witness(Scalar, () => Scalar.random());
  
      // Compute the public key corresponding to r. This is R = r*G.
      const R = PublicKey.fromGroup(Group.generator.scale(r));
  
      // Compute the ephemeral key F. 
      const F = publicViewKey.toGroup().scale(r);
  
      // Calculate the shared secret ss = H(r*V) = H(v*R).
      const ss = Scalar.from(Poseidon.hash(F.toFields()).toBigInt());
  
      // Derive the one-time destination address, K.
      const K = Group.generator.scale(ss.toBigInt()).add(publicSpendKey.toGroup());
  
      super({
        oneTimeAddress: PublicKey.fromGroup(K),
        ephemeralPublicKey: R,
        value: value,
      });
    }
    toJSON(utxo: UTXOType) {
        return {
            oneTimeAddress: PublicKey.toBase58(utxo.oneTimeAddress),
            ephemeralPublicKey: PublicKey.toBase58(utxo.ephemeralPublicKey),
            value: utxo.value.toBigInt().toString(),
        }
    }
    fromJSON(utxo: string) {
      const utxoObject = JSON.parse(utxo);
      const oneTimeAddress = PublicKey.fromBase58(utxoObject.oneTimeAddress); 
      const ephemeralPublicKey = PublicKey.fromBase58(utxoObject.ephemeralPublicKey);
      const value = Field.from(utxoObject.value);
      return { oneTimeAddress, ephemeralPublicKey, value} as UTXOType;
    }
  }