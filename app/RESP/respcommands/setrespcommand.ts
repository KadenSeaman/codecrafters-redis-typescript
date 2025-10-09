import { RESPCommand, RESPCommandType, type CommandContext } from "./commands";
import { RESPSimpleString } from "../objects";

export type setRespCommandOptions = {
  expiry?: number
}

export enum setRespCommandOptionsEnum {
  PX = 'px',
}

export class setRESPCommand extends RESPCommand {
  private expiry: number | undefined = undefined;

  constructor(private readonly key: string, private readonly value: string, options: setRespCommandOptions = {}) {
    super(RESPCommandType.SET);
    this.expiry = options.expiry;
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;
    store.set(this.key, { value: this.value, expiry: this.expiry, blocks: [] });
    connection.write(RESPSimpleString.encodeAsSimpleString('OK'))
  }
}
