"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESPDecoder = void 0;
var util_ts_1 = require("./util.ts");
var objects_ts_1 = require("./objects.ts");
var RESPDecoder = /** @class */ (function () {
    function RESPDecoder(data) {
        this.pos = 0;
        this.data = data;
    }
    RESPDecoder.prototype.advance = function (offset) {
        if (this.pos + offset >= this.data.length) {
            throw new Error('Advanced out of bounds');
        }
        var str = this.data.slice(this.pos, this.pos + offset);
        this.pos += offset;
        return str;
    };
    RESPDecoder.prototype.advanceCRLF = function () {
        var expectedCrlfString = this.advance(2);
        if (expectedCrlfString !== util_ts_1.crlf) {
            throw new Error('Expected CRLF string to follow');
        }
        return expectedCrlfString;
    };
    RESPDecoder.prototype.readUntilCRLF = function () {
        var crlfIndex = this.data.indexOf(util_ts_1.crlf, this.pos);
        if (crlfIndex === -1) {
            throw new Error('Expected CRLF string to follow');
        }
        var readString = this.data.slice(this.pos, crlfIndex);
        this.advance(crlfIndex - this.pos);
        return readString;
    };
    RESPDecoder.prototype.decode = function () {
        var commands = [];
        while (this.pos < this.data.length) {
            var object = this.parseNextRESPObject();
            if (object instanceof objects_ts_1.RESPDecoderError) {
                // TODO improve this
                throw new Error('Encounteered RESP Decoder Error');
            }
            if (object instanceof objects_ts_1.RESPArray) {
                var data = object.data;
                if (data === null) {
                    return commands;
                }
                if (data.length === 1) {
                    if (data[0] instanceof objects_ts_1.RESPBulkString) {
                        if (data[0].data === objects_ts_1.RESPCommandType.PING) {
                            commands.push(new objects_ts_1.PINGRESPCommand());
                        }
                    }
                }
                if (data.length === 2) {
                    if (data[0] instanceof objects_ts_1.RESPBulkString) {
                        if (data[0].data === objects_ts_1.RESPCommandType.ECHO) {
                            var response = data[1];
                            if (response instanceof objects_ts_1.RESPBulkString) {
                                if (response.data !== null) {
                                    commands.push(new objects_ts_1.EchoRESPCommand(response.data));
                                }
                            }
                        }
                    }
                }
            }
        }
        return commands;
    };
    RESPDecoder.prototype.parseNextRESPObject = function () {
        var type = this.advance(1);
        if (type === '+') {
            return this.parseRESPSimpleString();
        }
        if (type === '$') {
            return this.parseRESPBulkString();
        }
        if (type === ':') {
            return this.parseRESPInteger();
        }
        if (type === '*') {
            return this.parseRESPArray();
        }
        return new objects_ts_1.RESPUnknownTypeError(type);
    };
    RESPDecoder.prototype.parseRESPSimpleString = function () {
        var simpleStringData = this.readUntilCRLF();
        this.advanceCRLF();
        return new objects_ts_1.RESPSimpleString(simpleStringData);
    };
    RESPDecoder.prototype.parseRESPBulkString = function () {
        var bulkStringLengthString = this.readUntilCRLF();
        var bulkStringLength = parseInt(bulkStringLengthString);
        if (isNaN(bulkStringLength)) {
            return new objects_ts_1.RESPExpectingIntegerError(bulkStringLengthString);
        }
        if (bulkStringLength === -1) {
            this.advanceCRLF();
            return new objects_ts_1.RESPBulkString(null);
        }
        var bulkString = this.advance(bulkStringLength);
        this.advanceCRLF();
        return new objects_ts_1.RESPBulkString(bulkString);
    };
    RESPDecoder.prototype.parseRESPInteger = function () {
        var integerString = this.readUntilCRLF();
        var integer = parseInt(integerString);
        if (isNaN(integer)) {
            return new objects_ts_1.RESPExpectingIntegerError(integerString);
        }
        this.advanceCRLF();
        return new objects_ts_1.RESPInteger(integer);
    };
    RESPDecoder.prototype.parseRESPArray = function () {
        var arrayLengthString = this.readUntilCRLF();
        var arrayLength = parseInt(arrayLengthString);
        if (isNaN(arrayLength)) {
            return new objects_ts_1.RESPExpectingIntegerError(arrayLengthString);
        }
        if (arrayLength === 0) {
            return new objects_ts_1.RESPArray([]);
        }
        this.advanceCRLF();
        var respObjectArray = [];
        for (var i = 0; i < arrayLength; i++) {
            respObjectArray.push(this.parseNextRESPObject());
        }
        return new objects_ts_1.RESPArray(respObjectArray);
    };
    return RESPDecoder;
}());
exports.RESPDecoder = RESPDecoder;
