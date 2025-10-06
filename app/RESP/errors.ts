import { RESPObject, RESPObjectType } from "./objects";


//
//  RESP Decoder Erros
//

export enum RESPDecoderErrorType {
  EXPECTING_CRLF = 'expecting_CRLF',
  EXPECTING_INTEGER = 'expecting_integer',
  UNKNOWN_RESP_TYPE = 'unknown_resp_type',
  EMPTY_INPUT = 'empty_input',
  UNKNOWN_COMMAND = 'unknown_command',
}

export abstract class RESPDecoderError extends RESPObject<string> {
  public errorType: RESPDecoderErrorType;

  constructor(errorType: RESPDecoderErrorType, errorMessage: string) {
    super(RESPObjectType.SIMPLE_ERROR, errorMessage)
    this.errorType = errorType
  }
}

export class RESPExpectingCRLFError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.EXPECTING_CRLF, `Expecting CRLF, got ${input}`)
  }
}

export class RESPExpectingIntegerError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.EXPECTING_INTEGER, `Expecting integer, got ${input}`)
  }
}

export class RESPUnknownTypeError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.UNKNOWN_RESP_TYPE, `Expecting known RESP type, got ${input}`)
  }
}

export class RESPEmptyInputError extends RESPDecoderError {
  constructor() {
    super(RESPDecoderErrorType.EMPTY_INPUT, `Expected input, got empty string`)
  }
}

export class RESPUnknownCommandError extends RESPDecoderError {
  constructor(input: string) {
    super(RESPDecoderErrorType.UNKNOWN_COMMAND, `Unknown command, got ${input}`)
  }
}
