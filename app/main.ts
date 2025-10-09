import * as net from "net";
import { RESPDecoder } from "./RESP/decoder.ts";

export type storeKey = string;
export type storeValue = { value: any, expiry?: number, blocks?: number[] };
export type store = Map<storeKey, storeValue>;

const store: store = new Map();

const server: net.Server = net.createServer((socket: net.Socket) => {
  socket.on('data', (data) => {
    const respDecoder = new RESPDecoder(data.toString());

    const commands = respDecoder.decode();

    for (const command of commands) {
      command.execute({ connection: socket, store })
    }
  })
});

server.listen(6379, "127.0.0.1");
