import { RESPCommand, RESPCommandType, type CommandContext } from "./commands";
import { RESPInteger } from "../objects";

export class lpushRESPCommand extends RESPCommand {

  constructor(private readonly key: string, private readonly values: string[]) {
    super(RESPCommandType.LPUSH);
  }

  public execute(context: CommandContext): void {
    const entry = context.store.get(this.key);
    if (entry === undefined) {
      context.store.set(this.key, { value: this.values })
      context.connection.write(RESPInteger.encodeAsInteger(this.values.length));
      return;
    }

    const existingList = entry.value;
    if (Array.isArray(!existingList)) {
      return;
    }
    const newList = [...this.values, ...existingList];
    context.store.set(this.key, { value: newList })
    context.connection.write(RESPInteger.encodeAsInteger(newList.length));
  }
}
