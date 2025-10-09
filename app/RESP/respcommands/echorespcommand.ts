import { RESPCommandType, RESPCommand, type CommandContext } from "./commands";
import { RESPBulkString } from "../objects";

export class echoRESPCommand extends RESPCommand {

  constructor(private readonly value: string) {
    super(RESPCommandType.ECHO);
  }

  public execute(context: CommandContext): void {

    const { connection } = context;
    connection.write(RESPBulkString.encodeAsBulkString(this.value));
  }
}
