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
  }

export class UTXO extends Struct({
    oneTimeAddress: PublicKey,
    ephemeralPublicKey: PublicKey,
    commitment: Group,  // Use Group to represent the elliptic curve point
    encryptedValue: EncryptedValue
  }) {
    constructor(publicSpendKey: PublicKey, publicViewKey: PublicKey, value: bigint) {
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
  
      // Create the Pedersen Commitment for the value
      const valuePoint = Group.generator.scale(value);
      // look at blinding factor in o1js provable & nullifiers
      const blindingFactorPoint = Group.generator.scale(ss.toBigInt());  // Use ss as blinding factor for simplicity
      const commitment = valuePoint.add(blindingFactorPoint);
  
      // Encrypt the value
      let valueField = Encoding.stringToFields(value.toString());
      const encryptedValueObject = Encryption.encrypt(valueField, publicViewKey); // Assuming you're using the view public key for encryption
      const encryptedValueInstance = new EncryptedValue(encryptedValueObject.publicKey, encryptedValueObject.cipherText);
  
  
      super({
        oneTimeAddress: PublicKey.fromGroup(K),
        ephemeralPublicKey: R,
        commitment: commitment,
        encryptedValue: encryptedValueInstance
      });
    }
  }