import { describe, it, expect } from '@jest/globals';
import { Encoding, Field, Group, Poseidon, PrivateKey, PublicKey, Scalar, verify } from 'o1js';
import { KeyPairs, deriveKeyPairs } from '../src/utils/keyDerivation';
import { PRIVATE_KEY_0, PRIVATE_KEY_1 } from './test_vectors/testVectors';
import { LimitOrder, UTXO } from '../src/dataModel';
import { beforeEach } from 'bun:test';
import { PrivateTxArgs, Transaction, TransactionProof, TxArgs } from '../src/provable-programs';

describe('UTXO Tests', () => {
    let privSpendKeyBase58Seller: string;
    let privSpendKeyBase58Buyer: string;
    let keyPairsSeller: KeyPairs;
    let keyPairsBuyer: KeyPairs;
    let value: Field;
    let token: Field;
    let tokenUSD: Field;
    let quantityUSD: Field;

    beforeEach(() => {
        // Initialize the private spend key and value.
        privSpendKeyBase58Seller = PRIVATE_KEY_0;
        privSpendKeyBase58Buyer = PRIVATE_KEY_1;
        keyPairsSeller = deriveKeyPairs(privSpendKeyBase58Seller);
        keyPairsBuyer = deriveKeyPairs(privSpendKeyBase58Buyer);
        value = Field(1_000_000); // the quantity of MINA to sell
        token = Poseidon.hash(Encoding.stringToFields('MINA'));
        tokenUSD = Poseidon.hash(Encoding.stringToFields('USD'));
        quantityUSD = Field(400_000); // the quantity of USD to buy
    });
    it('should create a Buy Limit Order', () => {
        const price = Field(40); // e.g. $0.40 Mina per USD
        const buy = Poseidon.hash(Encoding.stringToFields('buy'));
        const limitOrder = new LimitOrder(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), value, token, price, quantityUSD, tokenUSD, buy);
        expect(limitOrder).toBeDefined();
    });
    it('should create a sell Limit Order and a Buy Limit order', () => {
        const price = Field(40); // e.g. $0.40 Mina per USD
        // Create a sell limit order
        const sell = Poseidon.hash(Encoding.stringToFields('sell'));
        const SellLimitOrder = new LimitOrder(PublicKey.fromBase58(keyPairsSeller.S), PublicKey.fromBase58(keyPairsSeller.V), value, token, price, quantityUSD, tokenUSD, sell);
        expect(SellLimitOrder).toBeDefined();

        // Create a buy limit order
        const buy = Poseidon.hash(Encoding.stringToFields('buy'));
        const BuyLimitOrder = new LimitOrder(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), value, tokenUSD, price, quantityUSD, token, buy);
        expect(BuyLimitOrder).toBeDefined();
    });
    it('should create a transaction that takes a buy limit order and a sell limit order as inputs and creates 2 outputs', () => {
        // Create a sell limit order
        const sell = Poseidon.hash(Encoding.stringToFields('sell'));
        const SellLimitOrder = new LimitOrder(PublicKey.fromBase58(keyPairsSeller.S), PublicKey.fromBase58(keyPairsSeller.V), value, token, Field(40), quantityUSD, tokenUSD, sell);
        expect(SellLimitOrder).toBeDefined();

        // Create a buy limit order
        const buy = Poseidon.hash(Encoding.stringToFields('buy'));
        const BuyLimitOrder = new LimitOrder(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), value, tokenUSD, Field(40), quantityUSD, token, buy);
        expect(BuyLimitOrder).toBeDefined();

        // Create 2 outputs -- one for the buyer and one for the seller
        // seller gets USD
        const output1 = new UTXO(PublicKey.fromBase58(keyPairsSeller.S), PublicKey.fromBase58(keyPairsSeller.V), quantityUSD, tokenUSD);
        // buyer gets MINA
        const output2 = new UTXO(PublicKey.fromBase58(keyPairsBuyer.S), PublicKey.fromBase58(keyPairsBuyer.V), value, token);
    });
});