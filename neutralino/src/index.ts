import { Elysia } from "elysia";
import { PrivateKey } from "o1js";

const app = new Elysia().get("/", () => "Hello Elysia")
                        .get("/generateAddress", () => PrivateKey.random().toPublicKey().toBase58())
                        .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
