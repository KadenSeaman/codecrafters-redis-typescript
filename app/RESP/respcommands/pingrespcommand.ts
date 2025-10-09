import { RESPCommandType, RESPCommand, type CommandContext } from "./commands";
import { RESPSimpleString } from "../objects";

export class pingRESPCommand extends RESPCommand {
  constructor() {
    super(RESPCommandType.PING);
  }

  public execute(context: CommandContext): void {
    const { connection } = context;
    connection.write(RESPSimpleString.encodeAsSimpleString('PONG'))
  }
}
