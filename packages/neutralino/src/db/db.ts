import { Database } from 'bun:sqlite';
import { UTXO, UTXOType } from '../data-model/src';

export class LedgerDatabase {
    private db: Database;

    constructor() {
        this.db = new Database('ledger.db');
        // Initialize the database
        this.init()
            .then(() => console.log('Database initialized'))
            .catch(console.error);
    }
    // Fetch all UTXOs
    async getUTxOs(): Promise<UTXOType[]> {
        const utxos = this.db.query('SELECT * FROM utxos').all();
        return utxos.map((utxoData: any) => {
            // Deserialize from the stored JSON representation
            const utxoData_ = JSON.parse(utxoData.utxo);
            return utxoData_; // Assuming you'd have a fromJSON method, or you can rebuild the UTXOType from JSON manually
        });
    }
    // Fetch a UTXO using its oneTimeAddress
    async getUTxO(oneTimeAddress: string): Promise<UTXOType | null> {
        const utxoData = this.db.query('SELECT * FROM utxos WHERE oneTimeAddress = ?').get(oneTimeAddress) as string;
        if (!utxoData) return null;

        // Deserialize from the stored JSON representation
        const utxoJson = JSON.parse(utxoData);
        return UTXO.fromJSON(utxoJson.utxo); // Assuming you'd have a fromJSON method, or you can rebuild the UTXOType from JSON manually
    }

    // Add a UTXO to the ledger
    async addUTxO(utxo: string) {
        console.log(`Adding UTXO: ${utxo}`);
        const utxoObject = UTXO.fromJSON(JSON.parse(JSON.stringify(utxo)));
        console.log(`Adding UTXO to string: ${utxoObject}`);


        try {
        return this.db.query('INSERT INTO utxos (oneTimeAddress, utxo) VALUES (?, ?)')
            .run(utxoObject.oneTimeAddress.toBase58(), JSON.stringify(UTXO.toJSON(utxoObject)));
        }
        catch (e) {
            console.log(e);
        }
    }

    // Update a UTXO
    async updateUTxO(oneTimeAddress: string, utxo: UTXOType) {
        const serializedUTXO = JSON.stringify(UTXO.toJSON(utxo));
        return this.db.query(`UPDATE utxos SET utxo = ? WHERE oneTimeAddress = ?`).run(serializedUTXO, oneTimeAddress);
    }

    // Delete a UTXO
    async deleteUTxO(oneTimeAddress: string) {
        return this.db.query(`DELETE FROM utxos WHERE oneTimeAddress = ?`).run(oneTimeAddress);
    }

    // Initialize the database
    async init() {
        return this.db.run('CREATE TABLE IF NOT EXISTS utxos (oneTimeAddress TEXT PRIMARY KEY, utxo TEXT)');
    }
}
