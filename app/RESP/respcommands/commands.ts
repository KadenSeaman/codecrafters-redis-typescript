import * as net from "net";
import type { store } from "../../main";

export interface CommandContext {
  connection: net.Socket;
  store: store;
}

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

export abstract class RESPCommand {
  public commandType: RESPCommandType;

  constructor(commandType: RESPCommandType) {
    this.commandType = commandType;
  }

  public abstract execute(context: CommandContext): void
}












