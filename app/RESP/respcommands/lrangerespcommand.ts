import { RESPCommand, RESPCommandType, type CommandContext } from "./commands";
import { RESPArray } from "../objects";

export class lrangeRESPCommand extends RESPCommand {

  constructor(private readonly key: string, private readonly startIndex: number, private readonly endIndex: number) {
    super(RESPCommandType.LRANGE);
  }

  public execute(context: CommandContext): void {
    const entry = context.store.get(this.key);

    if (entry === undefined) {
      context.connection.write(RESPArray.encodeAsArray([]));
      return;
    }

    const valueArray = entry.value;

    if (!valueArray) {
      context.connection.write(RESPArray.encodeAsArray([]));
      return;
    }

    const normalizedStartIndex = this.startIndex < 0 ? Math.max(valueArray.length + this.startIndex, 0) : this.startIndex;
    const normalizedEndIndex = this.endIndex < 0 ? valueArray.length + this.endIndex : this.endIndex;

    if (normalizedStartIndex > normalizedEndIndex) {
      context.connection.write(RESPArray.encodeAsArray([]));
      return;
    }

    if (normalizedStartIndex >= valueArray.length) {
      context.connection.write(RESPArray.encodeAsArray([]));
      return;
    }

    const actualStop = normalizedEndIndex >= valueArray.length ? valueArray.length - 1 : normalizedEndIndex;

    context.connection.write(RESPArray.encodeAsArray(valueArray.slice(normalizedStartIndex, actualStop + 1)))
  }
}
