import { Experimental, Group, Poseidon, PrivateKey, Provable, Scalar, Struct } from 'o1js';
import { UTXO } from '../dataModel'

/*
export function createTxArgs(input_length: number, output_length: number) {
  return class TxArgs extends Struct({
    inputs: Provable.Array(UTXO, input_length),
    outputs: Provable.Array(UTXO, output_length)
  }) {
    constructor(inputs: UTXO[], outputs: UTXO[]) {
      super({ inputs, outputs });
    }
  };
}
*/

export class TxArgs extends Struct({
  // max 2 inputs and 2 outputs
  // Ideally these TxArgs would allow for dynamic array lengths, 
  // but this is not possible in o1js
  inputs: Provable.Array(UTXO, 2),
  outputs: Provable.Array(UTXO, 2),
}) {
    constructor(inputs: UTXO[], outputs: UTXO[]) {
      super({ inputs, outputs });
  }
  getInputs() {
    return this.inputs;
  }
  getOutputs() {
    return this.outputs;
  }
}

export class PrivateTxArgs extends Struct({
  // inputs args
  sharedSecretScalarInput: Provable.Array(Scalar, 2),
  // sender args
  publicViewKey: Group,
  publicSpendKey: Group,

}) {
  constructor(txArgs: TxArgs, privateSpendKey: PrivateKey) {
    const privateViewKey = PrivateKey.fromBigInt(Poseidon.hash(privateSpendKey.toFields()).toBigInt());
    // Function to compute shared secrets for an array of UTXOs
    const computeSharedSecrets = (utxos: UTXO[]) => {
      const ss: Scalar[] = [];
      
      for (const utxo of utxos) {
        const R = utxo.ephemeralPublicKey
        const scalarSs = Scalar.from(Poseidon.hash((R.toGroup().scale(privateViewKey.s)).toFields()).toBigInt())

        ss.push(scalarSs);
      }

      return { ss };
    }

    const { ss: ssInput } = computeSharedSecrets(txArgs.getInputs());

    super({ 
      sharedSecretScalarInput: ssInput,
      publicViewKey: privateViewKey.toPublicKey().toGroup(),
      publicSpendKey: privateSpendKey.toPublicKey().toGroup()
    });
  }
}


/**
 */
export const Transaction = Experimental.ZkProgram({
  publicInput: TxArgs,
  publicOutput: TxArgs,

  methods: {
    spend: {
      privateInputs: [PrivateTxArgs],

      method(publicInputs: TxArgs, privateInputs: PrivateTxArgs): TxArgs {
        
        for (let i = 0; i < publicInputs.getInputs().length; i++) {
          // Proving ownership of the input
          const derivedOneTimeAddress = Group.generator.scale(privateInputs.sharedSecretScalarInput[i]).add(privateInputs.publicSpendKey);
          derivedOneTimeAddress.assertEquals(publicInputs.getInputs()[i].oneTimeAddress.toGroup(), "Ownership proof failed for input " + i);
        }
        // Ensure value conservation
        const valueInputs = publicInputs.getInputs().map((utxo) => utxo.value).reduce((a, b) => a.add(b));
        const valueOutputs = publicInputs.getOutputs().map((utxo) => utxo.value).reduce((a, b) => a.add(b));

        valueInputs.assertEquals(valueOutputs, "Value conservation failed");

        return publicInputs;
      },
    },
  },
});



/**
 * @public
 */
export class TransactionProof extends Experimental.ZkProgram.Proof(Transaction){
  static publicInput = this.prototype.publicInput;
  static publicOutput = this.prototype.publicOutput;
};