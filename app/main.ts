import * as net from "net";

console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server: net.Server = net.createServer((socket: net.Socket) => {
  socket.on('data', () => {
    socket.write('+PONG\r\n')
  })
});

server.listen(6379, "127.0.0.1");
