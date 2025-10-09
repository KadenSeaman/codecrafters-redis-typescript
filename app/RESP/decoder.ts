import { crlf } from "./util.ts";
import { RESPArray, RESPBulkString, RESPInteger, RESPObject, RESPSimpleString } from "./objects.ts";
import { echoRESPCommand } from "./respcommands/echorespcommand.ts";
import { getRESPCommand } from "./respcommands/getrespcommand.ts";
import { lrangeRESPCommand } from "./respcommands/lrangerespcommand.ts";
import { lpushRESPCommand } from "./respcommands/lpushrespcommand.ts";
import { pingRESPCommand } from "./respcommands/pingrespcommand.ts";
import { rpushRESPCommand } from "./respcommands/rpushrespcommand.ts";
import { setRESPCommand, setRespCommandOptionsEnum, type setRespCommandOptions } from "./respcommands/setrespcommand.ts";
import { llenRESPCommand } from "./respcommands/llenrespcommand.ts";
import { lpopRESPCommand } from "./respcommands/lpoprespcommand.ts";
import { RESPCommand, RESPCommandType } from "./respcommands/commands.ts";
import { RESPDecoderError, RESPUnknownTypeError, RESPExpectingIntegerError } from "./errors.ts";

export class RESPDecoder {
  private pos = 0;
  private data: string

  constructor(data: string) {
    this.data = data;
  }

  private advance(offset: number): string {
    if (this.pos + offset > this.data.length) {
      throw new Error('Advanced out of bounds')
    }
    const str = this.data.slice(this.pos, this.pos + offset);
    this.pos += offset;
    return str;
  }

  private advanceCRLF(): string {
    const expectedCrlfString = this.advance(2);
    if (expectedCrlfString !== crlf) {
      throw new Error('Expected CRLF string to follow');
    }
    return expectedCrlfString;
  }

  private readUntilCRLF(): string {
    const crlfIndex = this.data.indexOf(crlf, this.pos);

    if (crlfIndex === -1) {
      throw new Error('Expected CRLF string to follow')
    }

    const readString = this.data.slice(this.pos, crlfIndex);
    this.advance(crlfIndex - this.pos);
    return readString;
  }

  public decode(): RESPCommand[] {

    const commands: RESPCommand[] = [];

    while (this.pos < this.data.length) {
      const object = this.parseNextRESPObject();

      if (object instanceof RESPDecoderError) {
        return commands;
      }
      if (object instanceof RESPArray) {
        const arrayData = object.data;

        if (arrayData === null) {
          return commands;
        }
        const commandType = arrayData[0].data.toLowerCase();

        switch (commandType) {
          case RESPCommandType.PING: {
            commands.push(new pingRESPCommand())
            break;
          }
          case RESPCommandType.ECHO: {
            const echoValue = arrayData[1].data;
            if (echoValue === null) {
              break;
            }
            commands.push(new echoRESPCommand(echoValue))
            break;
          }
          case RESPCommandType.SET: {
            const [_, rawKey, rawValue, rawOption, rawModifier] = arrayData;
            const key = rawKey?.data;
            const value = rawValue?.data;
            const option = rawOption?.data?.toLowerCase();

            if (key === null || value === null) {
              break;
            }

            const setOptions: setRespCommandOptions = {};

            switch (option) {
              case setRespCommandOptionsEnum.PX: {
                const msDelay = parseInt(rawModifier?.data);
                if (!isNaN(msDelay)) {
                  setOptions.expiry = Date.now() + msDelay;
                }
                break;
              }
              case setRespCommandOptionsEnum.EX: {
                const msDelay = parseInt(rawModifier?.data) * 1000;
                if (!isNaN(msDelay)) {
                  setOptions.expiry = Date.now() + msDelay;
                }
                break;
              }
            }

            commands.push(new setRESPCommand(key, value, setOptions))
            break;
          }
          case RESPCommandType.GET: {
            const key = arrayData[1].data;

            if (key === null) {
              break;
            }
            commands.push(new getRESPCommand(key))
            break
          }
          case RESPCommandType.RPUSH: {
            const [_, rawKey] = arrayData;
            const key = rawKey?.data;
            const values = arrayData.slice(2);

            if (key === null || values === null) {
              break;
            }

            commands.push(new rpushRESPCommand(key, values.map(value => value.data)));
            break;
          }
          case RESPCommandType.LRANGE: {
            const [_, rawKey, rawStartIndex, rawEndIndex] = arrayData;
            const key = rawKey?.data;
            const startIndex = parseInt(rawStartIndex?.data);
            const endIndex = parseInt(rawEndIndex?.data);

            if (key === null || isNaN(startIndex) || isNaN(endIndex)) {
              break;
            }

            commands.push(new lrangeRESPCommand(key, startIndex, endIndex));
            break;
          }
          case RESPCommandType.LPUSH: {
            const [_, rawKey] = arrayData;
            const key = rawKey?.data;
            const values = arrayData.slice(2);

            if (key === null || values === null) {
              break;
            }

            commands.push(new lpushRESPCommand(key, values.map(value => value.data)));
            break;
          }
          case RESPCommandType.LLEN: {
            const key = arrayData[1].data;

            if (key === null) {
              break;
            }
            commands.push(new llenRESPCommand(key))
            break;
          }
          case RESPCommandType.LPOP: {
            const [_, rawKey, rawNumElementsToRemove] = arrayData;

            const key = rawKey?.data;
            const numElementsToRemove = rawNumElementsToRemove?.data

            if (key === null) {
              break;
            }

            commands.push(new lpopRESPCommand(key, numElementsToRemove))
            break;
          }
          case RESPCommandType.BLPOP: {
            const [_, rawKey, rawTimeoutSeconds] = 
          }
        }
      }
    }

    return commands;
  }

  private parseNextRESPObject(): RESPObject<any> {
    const type = this.advance(1);


    if (type === '+') {
      return this.parseRESPSimpleString();
    }
    if (type === '$') {
      return this.parseRESPBulkString();
    }
    if (type === ':') {
      return this.parseRESPInteger();
    }
    if (type === '*') {
      return this.parseRESPArray();
    }
    return new RESPUnknownTypeError(type);
  }

  private parseRESPSimpleString(): RESPSimpleString {
    const simpleStringData = this.readUntilCRLF();
    this.advanceCRLF();
    return new RESPSimpleString(simpleStringData);
  }

  private parseRESPBulkString(): RESPBulkString | RESPDecoderError {
    const bulkStringLengthString = this.readUntilCRLF();
    const bulkStringLength = parseInt(bulkStringLengthString);

    if (isNaN(bulkStringLength)) {
      return new RESPExpectingIntegerError(bulkStringLengthString);
    }

    if (bulkStringLength === -1) {
      this.advanceCRLF()
      return new RESPBulkString(null);
    }

    this.advanceCRLF();


    const bulkString = this.advance(bulkStringLength);

    this.advanceCRLF();
    return new RESPBulkString(bulkString);
  }

  private parseRESPInteger(): RESPInteger | RESPDecoderError {
    const integerString = this.readUntilCRLF();
    const integer = parseInt(integerString);

    if (isNaN(integer)) {
      return new RESPExpectingIntegerError(integerString);
    }

    this.advanceCRLF();
    return new RESPInteger(integer);
  }

  private parseRESPArray(): RESPArray | RESPDecoderError {
    const arrayLengthString = this.readUntilCRLF();
    const arrayLength = parseInt(arrayLengthString);

    if (isNaN(arrayLength)) {
      return new RESPExpectingIntegerError(arrayLengthString);
    }
    if (arrayLength === 0) {
      return new RESPArray([]);
    }

    this.advanceCRLF();

    const respObjectArray: RESPObject<any>[] = []

    for (let i = 0; i < arrayLength; i++) {
      respObjectArray.push(this.parseNextRESPObject())
    }

    return new RESPArray(respObjectArray);
  }
}
