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

export abstract class RESPObject<T> {
  public type: RESPObjectType;
  public data: T;

  constructor(type: RESPObjectType, data: T) {
    this.type = type;
    this.data = data;
  }
}

export class RESPSimpleString extends RESPObject<string> {
  public static encodeAsSimpleString(input: string) {
    return '+' + input + crlf;
  }

  constructor(data: string) {
    super(RESPObjectType.SIMPLE_STRING, data)
  }
}

export class RESPBulkString extends RESPObject<string | null> {
  public static encodeAsBulkString(input: string) {
    if (input.length === 0) {
      return '$-1' + crlf;
    }

    return '$' + input.length.toString() + crlf + input + crlf;
  }

  constructor(data: string | null) {
    super(RESPObjectType.BULK_STRING, data)
  }
}

export class RESPInteger extends RESPObject<number> {

  constructor(data: number) {
    super(RESPObjectType.INTEGER, data)
  }
}

export class RESPArray extends RESPObject<RESPObject<any>[] | null> {

  constructor(data: RESPObject<any>[] | null) {
    super(RESPObjectType.ARRAY, data);
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

export interface CommandContext {
  connection: net.Socket;
  //                  value,      expiry
  store: Map<string, [string, number | undefined]>;
}

export abstract class RESPCommand {
  public commandType: RESPCommandType;

  constructor(commandType: RESPCommandType) {
    this.commandType = commandType;
  }

  public abstract execute(context: CommandContext): void
}

export class pingRESPCommand extends RESPCommand {
  constructor() {
    super(RESPCommandType.PING);
  }

  public execute(context: CommandContext): void {
    const { connection } = context;
    connection.write(RESPSimpleString.encodeAsSimpleString('PONG'))
  }
}

export class echoRESPCommand extends RESPCommand {
  private value: string;

  constructor(value: string) {
    super(RESPCommandType.ECHO);
    this.value = value;
  }

  public execute(context: CommandContext): void {

    const { connection } = context;
    connection.write(RESPBulkString.encodeAsBulkString(this.value));
  }
}

export type setRespCommandOptions = {
  expiry?: number
}

export enum setRespCommandOptionsEnum {
  PX = 'px',
}

export class setRESPCommand extends RESPCommand {
  private key: string;
  private value: string;
  private expiry: number | undefined = undefined;

  constructor(key: string, value: string, options: setRespCommandOptions = {}) {
    super(RESPCommandType.SET);
    this.key = key;
    this.value = value;
    if (options.expiry) {
      this.expiry = options.expiry;
    }
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;
    store.set(this.key, [this.value, this.expiry]);
    connection.write(RESPSimpleString.encodeAsSimpleString('OK'))
  }
}

export class getRESPCommand extends RESPCommand {
  private key: string;

  constructor(_key: string) {
    super(RESPCommandType.GET);
    this.key = _key;
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;

    const result = store.get(this.key);
    if (!result) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }

    const [value, expiry] = result

    if (value === undefined) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }

    if (expiry && Date.now() > expiry) {
      store.delete(this.key);
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }

    connection.write(RESPSimpleString.encodeAsSimpleString(value))
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

export abstract class RESPDecoderError extends RESPObject<string> {
  public errorType: RESPDecoderErrorType;

  constructor(errorType: RESPDecoderErrorType, errorMessage: string) {
    super(RESPObjectType.SIMPLE_ERROR, errorMessage)
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
