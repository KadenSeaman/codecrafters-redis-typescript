import { crlf } from "./util.ts";
import { EchoRESPCommand, PINGRESPCommand, RESPArray, RESPBulkString, RESPCommandType, RESPDecoderError, RESPEmptyInputError, RESPExpectingIntegerError, RESPInteger, RESPObject, RESPSimpleString, RESPUnknownTypeError } from "./objects.ts";
import { RESPCommand } from "./objects.ts";

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

  private peek(): string {
    return this.data[this.pos];
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


        const data = object.data;

        if (data === null) {
          return commands;
        }

        if (data.length === 1) {
          if (data[0] instanceof RESPBulkString) {
            if (data[0].data?.toLowerCase() === RESPCommandType.PING) {
              commands.push(new PINGRESPCommand())
            }
          }
        }
        if (data.length === 2) {
          if (data[0] instanceof RESPBulkString) {
            if (data[0].data?.toLowerCase() === RESPCommandType.ECHO) {


              const response = data[1];
              if (response instanceof RESPBulkString) {
                if (response.data !== null) {
                  commands.push(new EchoRESPCommand(response.data))
                }
              }
            }
          }
        }
      }
    }

    return commands;
  }

  private parseNextRESPObject(): RESPObject {

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

    const respObjectArray: RESPObject[] = []

    for (let i = 0; i < arrayLength; i++) {
      respObjectArray.push(this.parseNextRESPObject())
    }

    return new RESPArray(respObjectArray);
  }
}
