import { type CommandContext, RESPCommand, RESPCommandType } from "./commands";
import { RESPBulkString } from "../objects";
import { RESPSimpleString } from "../objects";

export class getRESPCommand extends RESPCommand {

  constructor(private readonly key: string) {
    super(RESPCommandType.GET);
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;

    const result = store.get(this.key);
    if (!result) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }

    const { value, expiry } = result

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
