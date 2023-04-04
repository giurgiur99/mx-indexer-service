import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(message, status);
  }
}

export class BadRequestException extends ApiException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class NotFoundException extends ApiException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class InternalServerErrorException extends ApiException {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
