
import * as net from "net";
import { RESPSimpleString, RESPBulkString, RESPArray, RESPInteger } from "./objects";


//
//  RESP Command Types
//
export enum RESPCommandType {
  PING = 'ping',
  ECHO = 'echo',
  SET = 'set',
  GET = 'get',
  RPUSH = 'rpush',
  LRANGE = 'lrange',
  LPUSH = 'lpush',
  LLEN = 'llen',
  LPOP = 'lpop',
}

export interface CommandContext {
  connection: net.Socket;
  //                  value,    expiry
  store: Map<string, [any, number | undefined]>;
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

export class rpushRESPCommand extends RESPCommand {
  private key: string;
  private values: string[];

  constructor(_key: string, _value: string[]) {
    super(RESPCommandType.RPUSH);
    this.key = _key;
    this.values = _value;
  }

  public execute(context: CommandContext): void {
    const entry = context.store.get(this.key);
    if (entry === undefined) {
      context.store.set(this.key, [this.values, undefined])
      context.connection.write(RESPInteger.encodeAsInteger(this.values.length));
      return;
    }

    const existingList = entry[0];
    if (Array.isArray(!existingList)) {
      return;
    }
    const newList = [...existingList, ...this.values];
    context.store.set(this.key, [newList, undefined])
    context.connection.write(RESPInteger.encodeAsInteger(newList.length));
  }
}

export class lrangeRESPCommand extends RESPCommand {
  private key: string;
  private startIndex: number;
  private endIndex: number;

  constructor(_key: string, _startIndex: number, _endIndex: number) {
    super(RESPCommandType.LRANGE);
    this.key = _key;
    this.startIndex = _startIndex;
    this.endIndex = _endIndex
  }

  public execute(context: CommandContext): void {
    const writeEmptyArray = () => {
      context.connection.write(RESPArray.encodeAsArray([]));
    }

    const entry = context.store.get(this.key);

    if (entry === undefined) {
      writeEmptyArray()
      return;
    }

    const valueArray = entry[0];

    if (!valueArray) {
      writeEmptyArray()
      return;
    }

    const normalizedStartIndex = this.startIndex < 0 ? Math.max(valueArray.length + this.startIndex, 0) : this.startIndex;
    const normalizedEndIndex = this.endIndex < 0 ? valueArray.length + this.endIndex : this.endIndex;

    if (normalizedStartIndex > normalizedEndIndex) {
      writeEmptyArray()
      return;
    }

    if (normalizedStartIndex >= valueArray.length) {
      writeEmptyArray()
      return;
    }

    const actualStop = normalizedEndIndex >= valueArray.length ? valueArray.length - 1 : normalizedEndIndex;

    context.connection.write(RESPArray.encodeAsArray(valueArray.slice(normalizedStartIndex, actualStop + 1)))
  }
}

export class lpushRESPCommand extends RESPCommand {
  private key: string;
  private values: string[];

  constructor(_key: string, _value: string[]) {
    super(RESPCommandType.LPUSH);
    this.key = _key;
    this.values = _value.reverse();
  }

  public execute(context: CommandContext): void {
    const entry = context.store.get(this.key);
    if (entry === undefined) {
      context.store.set(this.key, [this.values, undefined])
      context.connection.write(RESPInteger.encodeAsInteger(this.values.length));
      return;
    }

    const existingList = entry[0];
    if (Array.isArray(!existingList)) {
      return;
    }
    const newList = [...this.values, ...existingList];
    console.log(newList)
    context.store.set(this.key, [newList, undefined])
    context.connection.write(RESPInteger.encodeAsInteger(newList.length));
  }
}


export class llenRESPCommand extends RESPCommand {
  private key: string;

  constructor(_key: string) {
    super(RESPCommandType.LLEN);
    this.key = _key;
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;

    const result = store.get(this.key);
    if (!result) {
      connection.write(RESPInteger.encodeAsInteger(0));
      return;
    }

    const [value, _] = result

    if (value === undefined) {
      connection.write(RESPInteger.encodeAsInteger(0));
      return;
    }

    connection.write(RESPInteger.encodeAsInteger(value.length))
  }
}

export class lpopRESPCommand extends RESPCommand {
  private key: string;

  constructor(_key: string) {
    super(RESPCommandType.LPOP);
    this.key = _key;
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;

    const result = store.get(this.key);
    if (!result) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }

    if (result[0].length === 0) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }


    const firstValue = result[0][0];

    connection.write(RESPBulkString.encodeAsBulkString(firstValue));
    store.set(this.key, [result[0].slice(1), result[1]])
  }
}
