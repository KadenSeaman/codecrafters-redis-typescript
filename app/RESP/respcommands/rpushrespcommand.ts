import { RESPCommand, RESPCommandType, type CommandContext } from "./commands";
import { RESPInteger } from "../objects";

export class rpushRESPCommand extends RESPCommand {
  constructor(private readonly key: string, private readonly values: string[]) {
    super(RESPCommandType.RPUSH);
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
    const newList = [...existingList, ...this.values];
    context.store.set(this.key, { value: newList })
    context.connection.write(RESPInteger.encodeAsInteger(newList.length));
  }
}
