import { crlf } from "./util";

export enum RESPObjectType {
  SIMPLE_STRING = 'simple_string',
  BULK_STRING = 'bulk_string',
  INTEGER = 'integer',
  ARRAY = 'array',
  SIMPLE_ERROR = 'simple_error',
  COMMAND = 'command',
}

export abstract class RESPObject<T> {
  constructor(public readonly type: RESPObjectType, public readonly data: T) { }
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
  public static encodeAsInteger(input: number) {
    return `:${input}${crlf}`
  }

  constructor(data: number) {
    super(RESPObjectType.INTEGER, data)
  }
}

export class RESPArray extends RESPObject<RESPObject<any>[] | null> {
  public static encodeAsArray(input: string[]) {
    return `*${input.length}${crlf}${input.map(val => RESPBulkString.encodeAsBulkString(val)).join('')}`;
  }

  constructor(data: RESPObject<any>[] | null) {
    super(RESPObjectType.ARRAY, data);
  }
}

