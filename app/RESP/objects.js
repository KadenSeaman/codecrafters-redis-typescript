"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESPUnknownCommandError = exports.RESPEmptyInputError = exports.RESPUnknownTypeError = exports.RESPExpectingIntegerError = exports.RESPExpectingCRLFError = exports.RESPDecoderError = exports.RESPDecoderErrorType = exports.EchoRESPCommand = exports.PINGRESPCommand = exports.RESPCommand = exports.RESPCommandType = exports.RESPArray = exports.RESPInteger = exports.RESPBulkString = exports.RESPSimpleString = exports.RESPObject = exports.RESPObjectType = void 0;
var util_1 = require("./util");
//
//  RESP Object Types
//
var RESPObjectType;
(function (RESPObjectType) {
    RESPObjectType["SIMPLE_STRING"] = "simple_string";
    RESPObjectType["BULK_STRING"] = "bulk_string";
    RESPObjectType["INTEGER"] = "integer";
    RESPObjectType["ARRAY"] = "array";
    RESPObjectType["SIMPLE_ERROR"] = "simple_error";
    RESPObjectType["COMMAND"] = "command";
})(RESPObjectType || (exports.RESPObjectType = RESPObjectType = {}));
var RESPObject = /** @class */ (function () {
    function RESPObject(type) {
        this.type = type;
    }
    return RESPObject;
}());
exports.RESPObject = RESPObject;
var RESPSimpleString = /** @class */ (function (_super) {
    __extends(RESPSimpleString, _super);
    function RESPSimpleString(data) {
        var _this = _super.call(this, RESPObjectType.SIMPLE_STRING) || this;
        _this.data = data;
        return _this;
    }
    return RESPSimpleString;
}(RESPObject));
exports.RESPSimpleString = RESPSimpleString;
var RESPBulkString = /** @class */ (function (_super) {
    __extends(RESPBulkString, _super);
    function RESPBulkString(data) {
        var _this = _super.call(this, RESPObjectType.BULK_STRING) || this;
        _this.data = data;
        return _this;
    }
    RESPBulkString.encodeAsBulkString = function (input) {
        return input.length.toString() + util_1.crlf + input + util_1.crlf;
    };
    return RESPBulkString;
}(RESPObject));
exports.RESPBulkString = RESPBulkString;
var RESPInteger = /** @class */ (function (_super) {
    __extends(RESPInteger, _super);
    function RESPInteger(data) {
        var _this = _super.call(this, RESPObjectType.INTEGER) || this;
        _this.data = data;
        return _this;
    }
    return RESPInteger;
}(RESPObject));
exports.RESPInteger = RESPInteger;
var RESPArray = /** @class */ (function (_super) {
    __extends(RESPArray, _super);
    function RESPArray(data) {
        var _this = _super.call(this, RESPObjectType.ARRAY) || this;
        _this.data = data;
        return _this;
    }
    return RESPArray;
}(RESPObject));
exports.RESPArray = RESPArray;
//
//  RESP Command Types
//
var RESPCommandType;
(function (RESPCommandType) {
    RESPCommandType["PING"] = "ping";
    RESPCommandType["ECHO"] = "echo";
    RESPCommandType["SET"] = "set";
    RESPCommandType["GET"] = "get";
})(RESPCommandType || (exports.RESPCommandType = RESPCommandType = {}));
var RESPCommand = /** @class */ (function () {
    function RESPCommand(commandType) {
        this.commandType = commandType;
    }
    return RESPCommand;
}());
exports.RESPCommand = RESPCommand;
var PINGRESPCommand = /** @class */ (function (_super) {
    __extends(PINGRESPCommand, _super);
    function PINGRESPCommand() {
        return _super.call(this, RESPCommandType.PING) || this;
    }
    PINGRESPCommand.prototype.execute = function (connection) {
        connection.write(RESPBulkString.encodeAsBulkString("PING"));
    };
    return PINGRESPCommand;
}(RESPCommand));
exports.PINGRESPCommand = PINGRESPCommand;
var EchoRESPCommand = /** @class */ (function (_super) {
    __extends(EchoRESPCommand, _super);
    function EchoRESPCommand(value) {
        var _this = _super.call(this, RESPCommandType.ECHO) || this;
        _this.value = value;
        return _this;
    }
    EchoRESPCommand.prototype.execute = function (connection) {
        connection.write(RESPBulkString.encodeAsBulkString(this.value));
    };
    return EchoRESPCommand;
}(RESPCommand));
exports.EchoRESPCommand = EchoRESPCommand;
//
//  RESP Decoder Erros
//
var RESPDecoderErrorType;
(function (RESPDecoderErrorType) {
    RESPDecoderErrorType["EXPECTING_CRLF"] = "expecting_CRLF";
    RESPDecoderErrorType["EXPECTING_INTEGER"] = "expecting_integer";
    RESPDecoderErrorType["UNKNOWN_RESP_TYPE"] = "unknown_resp_type";
    RESPDecoderErrorType["EMPTY_INPUT"] = "empty_input";
    RESPDecoderErrorType["UNKNOWN_COMMAND"] = "unlknown_command";
})(RESPDecoderErrorType || (exports.RESPDecoderErrorType = RESPDecoderErrorType = {}));
var RESPDecoderError = /** @class */ (function (_super) {
    __extends(RESPDecoderError, _super);
    function RESPDecoderError(errorType, errorMessage) {
        var _this = _super.call(this, RESPObjectType.SIMPLE_ERROR) || this;
        _this.message = errorMessage;
        _this.errorType = errorType;
        return _this;
    }
    return RESPDecoderError;
}(RESPObject));
exports.RESPDecoderError = RESPDecoderError;
var RESPExpectingCRLFError = /** @class */ (function (_super) {
    __extends(RESPExpectingCRLFError, _super);
    function RESPExpectingCRLFError(input) {
        return _super.call(this, RESPDecoderErrorType.EXPECTING_CRLF, "Expecting CRLF, got ".concat(input)) || this;
    }
    return RESPExpectingCRLFError;
}(RESPDecoderError));
exports.RESPExpectingCRLFError = RESPExpectingCRLFError;
var RESPExpectingIntegerError = /** @class */ (function (_super) {
    __extends(RESPExpectingIntegerError, _super);
    function RESPExpectingIntegerError(input) {
        return _super.call(this, RESPDecoderErrorType.EXPECTING_INTEGER, "Expecting integer, got ".concat(input)) || this;
    }
    return RESPExpectingIntegerError;
}(RESPDecoderError));
exports.RESPExpectingIntegerError = RESPExpectingIntegerError;
var RESPUnknownTypeError = /** @class */ (function (_super) {
    __extends(RESPUnknownTypeError, _super);
    function RESPUnknownTypeError(input) {
        return _super.call(this, RESPDecoderErrorType.UNKNOWN_RESP_TYPE, "Expecting known RESP type, got ".concat(input)) || this;
    }
    return RESPUnknownTypeError;
}(RESPDecoderError));
exports.RESPUnknownTypeError = RESPUnknownTypeError;
var RESPEmptyInputError = /** @class */ (function (_super) {
    __extends(RESPEmptyInputError, _super);
    function RESPEmptyInputError() {
        return _super.call(this, RESPDecoderErrorType.EMPTY_INPUT, "Expected input, got empty string") || this;
    }
    return RESPEmptyInputError;
}(RESPDecoderError));
exports.RESPEmptyInputError = RESPEmptyInputError;
var RESPUnknownCommandError = /** @class */ (function (_super) {
    __extends(RESPUnknownCommandError, _super);
    function RESPUnknownCommandError(input) {
        return _super.call(this, RESPDecoderErrorType.UNKNOWN_COMMAND, "Unknown command, got ".concat(input)) || this;
    }
    return RESPUnknownCommandError;
}(RESPDecoderError));
exports.RESPUnknownCommandError = RESPUnknownCommandError;
