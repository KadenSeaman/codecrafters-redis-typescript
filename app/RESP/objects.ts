import * as net from "net";
import { crlf } from "./util";

//
//  RESP Object Types
//

export enum RESPObjectType {
  SIMPLE_STRING = 'simple_string',
  BULK_STRING = 'bulk_string',
  INTEGER = 'integer',
  ARRAY = 'array',
  SIMPLE_ERROR = 'simple_error',
  COMMAND = 'command',
}

export abstract class RESPObject {
  public type: RESPObjectType;

  constructor(type: RESPObjectType) {
    this.type = type;
  }
}

export class RESPSimpleString extends RESPObject {
  public static encodeAsSimpleString(input: string) {
    return '+' + input + crlf;
  }

  public data: string;

  constructor(data: string) {
    super(RESPObjectType.SIMPLE_STRING)
    this.data = data;
  }
}

export class RESPBulkString extends RESPObject {
  public static encodeAsBulkString(input: string) {
    return '$' + input.length.toString() + crlf + input + crlf;
  }

  public data: string | null;

  constructor(data: string | null) {
    super(RESPObjectType.BULK_STRING)
    this.data = data;
  }
}

export class RESPInteger extends RESPObject {
  public data: number;

  constructor(data: number) {
    super(RESPObjectType.INTEGER)
    this.data = data
  }
}

export class RESPArray extends RESPObject {
  public data: RESPObject[] | null;

  constructor(data: RESPObject[] | null) {
    super(RESPObjectType.ARRAY);
    this.data = data;
  }
}

//
//  RESP Command Types
//
export enum RESPCommandType {
  PING = 'ping',
  ECHO = 'echo',
  SET = 'set',
  GET = 'get',
}

export abstract class RESPCommand {
  public commandType: RESPCommandType;

  constructor(commandType: RESPCommandType) {
    this.commandType = commandType;
  }

  public abstract execute(connection: net.Socket): void
}

export class PINGRESPCommand extends RESPCommand {
  constructor() {
    super(RESPCommandType.PING);
  }

  public execute(connection: net.Socket): void {
    connection.write(RESPSimpleString.encodeAsSimpleString('PONG'))
  }
}

export class EchoRESPCommand extends RESPCommand {
  private value: string;

  constructor(value: string) {
    super(RESPCommandType.ECHO);
    this.value = value;
  }

  public execute(connection: net.Socket): void {
    connection.write(RESPBulkString.encodeAsBulkString(this.value));
  }
}

//
//  RESP Decoder Erros
//

export enum RESPDecoderErrorType {
  EXPECTING_CRLF = 'expecting_CRLF',
  EXPECTING_INTEGER = 'expecting_integer',
  UNKNOWN_RESP_TYPE = 'unknown_resp_type',
  EMPTY_INPUT = 'empty_input',
  UNKNOWN_COMMAND = 'unlknown_command',
}

export abstract class RESPDecoderError extends RESPObject {
  public message: string;
  public errorType: RESPDecoderErrorType;

  constructor(errorType: RESPDecoderErrorType, errorMessage: string) {
    super(RESPObjectType.SIMPLE_ERROR)
    this.message = errorMessage;
    this.errorType = errorType
  }
}

export class RESPExpectingCRLFError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.EXPECTING_CRLF, `Expecting CRLF, got ${input}`)
  }
}

export class RESPExpectingIntegerError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.EXPECTING_INTEGER, `Expecting integer, got ${input}`)
  }
}

export class RESPUnknownTypeError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.UNKNOWN_RESP_TYPE, `Expecting known RESP type, got ${input}`)
  }
}

export class RESPEmptyInputError extends RESPDecoderError {
  constructor() {
    super(RESPDecoderErrorType.EMPTY_INPUT, `Expected input, got empty string`)
  }
}

export class RESPUnknownCommandError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.UNKNOWN_COMMAND, `Unknown command, got ${input}`)
  }
}
