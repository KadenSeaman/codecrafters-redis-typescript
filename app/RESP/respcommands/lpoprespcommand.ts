import { RESPCommand, RESPCommandType, type CommandContext } from "./commands";
import { RESPBulkString, RESPArray } from "../objects";

export class lpopRESPCommand extends RESPCommand {

  constructor(private readonly key: string, private readonly amountOfElementsToRemove: number = 1) {
    super(RESPCommandType.LPOP);
  }

  public execute(context: CommandContext): void {
    const { connection, store } = context;

    const result = store.get(this.key);
    if (!result) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }
    if (!Array.isArray(result.value)) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }
    if (result.value.length === 0) {
      connection.write(RESPBulkString.encodeAsBulkString(''));
      return;
    }

    if (this.amountOfElementsToRemove >= result.value.length) {
      connection.write(RESPArray.encodeAsArray(result.value));
      store.delete(this.key);
      return;
    }

    const values = result.value.slice(0, this.amountOfElementsToRemove);
    connection.write(RESPArray.encodeAsArray(values));
    store.set(this.key, { value: result.value.slice(this.amountOfElementsToRemove), expiry: result.expiry })
  }
}
