import { RESPCommand, RESPCommandType, type CommandContext } from "./commands";
import { RESPInteger } from "../objects";

export class llenRESPCommand extends RESPCommand {

  constructor(private readonly key: string) {
    super(RESPCommandType.LLEN);
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;

    const result = store.get(this.key);
    if (!result) {
      connection.write(RESPInteger.encodeAsInteger(0));
      return;
    }

    const { value } = result

    if (value === undefined) {
      connection.write(RESPInteger.encodeAsInteger(0));
      return;
    }

    connection.write(RESPInteger.encodeAsInteger(value.length))
  }
}
