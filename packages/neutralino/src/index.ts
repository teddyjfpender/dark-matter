import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { PrivateKey, PublicKey } from "o1js";
import { createKeyPair } from "./createKeyPair";
import { compileProgram } from "./compileProgram";
import { LedgerDatabase } from "./db/db";
import { UTXO, UTXOType } from "./data-model/src";
/*
Can query the database using the following commands:
 -- Add to UTxO to the ledger
 curl -X POST -H "Content-Type: application/json" \
-d '{"oneTimeAddress":"B62qn9iQTjYg4hR78mmenFJ2GVW5xhwzSeK6LfM5nYPXqxffpnpjBx6","ephemeralPublicKey":"B62qqx2VcYRH5edeJkbUP2RBXJEcU2GcqeoHmCA1zwWRYkqL9dsdpL4","commitment":{"x":"99587528700117342553657768151346921242014553096535801584791725535172428927","y":"28624866743977107607778710355206715619110676813883473550279656574169114857791"},"encryptedValue":{"publicKey":"B62qrwHZiSHyERXHoi1EFt1yeL2CmjMkGjJFQesChhMK31rpCo3yPxK","cipherText":["5466964931218400116315849117155020874302392418945785016464051696766223933172","2566864109691498639232775632761066856984955656722526627978752314186098679474"]}}' \
http://localhost:3000/AddUTxO

-- Create a UTxO
curl -X GET http://localhost:3000/createUTxO

returns {"commitment":{"x":"18372144952686040358312756990184853036447632186162058998147887044698758611767","y":"1312791503876295726849940129873128228221414219604732902086107835738743120216"},"encryptedValue":{"cipherText":["28749515140701969652674805047731167129891864597595498376428517988594675566001","26723672447751246499761284540227270787039900698755568624059571326993021320071"],"publicKey":{"x":"788975702161681077715791357323174922557661729033939579392299547511143209895","y":"22636426707608378745136374184859141515273475007402262888580427480984859163811"}},"ephemeralPublicKey":"B62qr5WYMjPjWKgs91CNZ1UQTS3kB5WtnAAFoNK7XHjmxSPPWpLSExp","oneTimeAddress":"B62qjBxcDxhHWoHkmRhaDpGJjqmYcVQZUrR5FCNYVFm8Fw9CARR9F5y"}


curl -X POST -H "Content-Type: application/json" \
-d '{"commitment":{"x":"18372144952686040358312756990184853036447632186162058998147887044698758611767","y":"1312791503876295726849940129873128228221414219604732902086107835738743120216"},"encryptedValue":{"cipherText":["28749515140701969652674805047731167129891864597595498376428517988594675566001","26723672447751246499761284540227270787039900698755568624059571326993021320071"],"publicKey":{"x":"788975702161681077715791357323174922557661729033939579392299547511143209895","y":"22636426707608378745136374184859141515273475007402262888580427480984859163811"}},"ephemeralPublicKey":"B62qr5WYMjPjWKgs91CNZ1UQTS3kB5WtnAAFoNK7XHjmxSPPWpLSExp","oneTimeAddress":"B62qjBxcDxhHWoHkmRhaDpGJjqmYcVQZUrR5FCNYVFm8Fw9CARR9F5y"}' \
http://localhost:3000/AddUTxO


*/
const app = new Elysia().use(html())
                        .decorate('db', new LedgerDatabase())
                        .get("/UTxOs", ({ db }) => db.getUTxOs())
                        .post("/AddUTxO", async ({ db, body }) => {
                          const utxo = await db.addUTxO(body as string);
                          return utxo;
                        })
                        .get("/createUTxO", () => {
                          const keyPairOwner = createKeyPair();
                          const value = BigInt(1_000_000);
                          const utxo = new UTXO(PublicKey.fromBase58(keyPairOwner.S), PublicKey.fromBase58(keyPairOwner.V), value);
                          return UTXO.toJSON(utxo);
                        })
                        .get("/", () => "Hello Elysia")
                        .get("/generateAddress", () => PrivateKey.random().toPublicKey().toBase58())
                        .get("/generateKeyPair", () => createKeyPair())
                        .get("/compile", async () => await compileProgram())
                        .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
