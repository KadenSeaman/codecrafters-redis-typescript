"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var decoder_ts_1 = require("./RESP/decoder.ts");
var server = net.createServer(function (socket) {
    socket.on('data', function (data) {
        var respDecoder = new decoder_ts_1.RESPDecoder(data.toString());
        var commands = respDecoder.decode();
        for (var _i = 0, commands_1 = commands; _i < commands_1.length; _i++) {
            var command = commands_1[_i];
            command.execute(socket);
        }
        socket.write('received data');
    });
});
server.listen(6379, "127.0.0.1");
