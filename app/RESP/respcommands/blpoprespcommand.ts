import { RESPCommand, RESPCommandType, type CommandContext } from "./commands";

export class blpopRESPCommand extends RESPCommand {
  constructor() {
    super(RESPCommandType.BLPOP);
  }

  public execute(context: CommandContext): void {

  }
}
