import * as net from "net";
import { RESPDecoder } from "./RESP/decoder.ts";

const store = new Map<string, [any, number | undefined]>

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
