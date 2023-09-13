import { describe, it, expect } from '@jest/globals';
import { Encoding, Field, Group, Poseidon, PrivateKey, PublicKey, Scalar, verify } from 'o1js';
import { KeyPairs, deriveKeyPairs } from '../src/utils/keyDerivation';
import { PRIVATE_KEY_0, PRIVATE_KEY_1 } from './test_vectors/testVectors';
import { LimitOrder, UTXO } from '../src/dataModel';
import { beforeEach } from 'bun:test';

describe('UTXO Tests', () => {
    let privSpendKeyBase58Seller: string;
    let privSpendKeyBase58Buyer: string;
    let keyPairsSeller: KeyPairs;
    let keyPairsBuyer: KeyPairs;
    let quantityMINA: Field;
    let tokenMINA: Field;
    let tokenUSD: Field;
    let quantityUSD: Field;

    beforeEach(() => {
        privSpendKeyBase58Seller = PRIVATE_KEY_0;
        privSpendKeyBase58Buyer = PRIVATE_KEY_1;
        keyPairsSeller = deriveKeyPairs(privSpendKeyBase58Seller);
        keyPairsBuyer = deriveKeyPairs(privSpendKeyBase58Buyer);
        quantityMINA = Field(1_000_000); // the quantity of MINA to sell
        tokenMINA = Poseidon.hash(Encoding.stringToFields('MINA'));
        tokenUSD = Poseidon.hash(Encoding.stringToFields('USD'));
        quantityUSD = Field(400_000); // the quantity of USD to buy
    });
    it('should create a Buy Limit Order', () => {
        // create the UTxO
        const utxo = new UTXO(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), quantityUSD, tokenUSD);
        const buy = Poseidon.hash(Encoding.stringToFields('buy'));
        const limitOrder = new LimitOrder(utxo, quantityUSD, tokenUSD, buy);
        expect(limitOrder).toBeDefined();
    });
    it('should create a sell Limit Order and a Buy Limit order', () => {
        // create the UTxO
        const utxoMina = new UTXO(PublicKey.fromBase58(keyPairsSeller.S), PublicKey.fromBase58(keyPairsSeller.V), quantityMINA, tokenMINA);
        // Create a sell limit order
        const sell = Poseidon.hash(Encoding.stringToFields('sell'));
        const SellLimitOrder = new LimitOrder(utxoMina, quantityUSD, tokenUSD, sell);
        expect(SellLimitOrder).toBeDefined();

        // create the UTxO
        const utxoUsd = new UTXO(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), quantityUSD, tokenUSD);
        // Create a buy limit order
        const buy = Poseidon.hash(Encoding.stringToFields('buy'));
        const BuyLimitOrder = new LimitOrder(utxoUsd, quantityMINA, tokenMINA, buy);
        expect(BuyLimitOrder).toBeDefined();
    });
    it('should create a transaction that takes a buy limit order and a sell limit order as inputs and creates 2 outputs', () => {
        // create the UTxO
        const inputUtxoMina = new UTXO(PublicKey.fromBase58(keyPairsSeller.S), PublicKey.fromBase58(keyPairsSeller.V), quantityMINA, tokenMINA);
        // Create a sell limit order
        const sell = Poseidon.hash(Encoding.stringToFields('sell'));
        const SellLimitOrder = new LimitOrder(inputUtxoMina, quantityUSD, tokenUSD, sell);
        expect(SellLimitOrder).toBeDefined();

        // create the UTxO
        const inputUtxoUsd = new UTXO(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), quantityUSD, tokenUSD);
        // Create a buy limit order
        const buy = Poseidon.hash(Encoding.stringToFields('buy'));
        const BuyLimitOrder = new LimitOrder(inputUtxoUsd, quantityMINA, tokenMINA, buy);
        expect(BuyLimitOrder).toBeDefined();

        // Create 2 outputs -- one for the buyer and one for the seller
        // seller gets USD
        const outputUtxoUsd = new UTXO(PublicKey.fromBase58(keyPairsSeller.S), PublicKey.fromBase58(keyPairsSeller.V), quantityUSD, tokenUSD);
        // buyer gets MINA
        const outputUtxoMina = new UTXO(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), quantityMINA, tokenMINA);

        /**
         * 
         * TODO: Use a SwapTransaction Program to create a transaction that takes a buy limit order and a sell limit order as inputs and creates 2 outputs
         * 
         */
    });
});