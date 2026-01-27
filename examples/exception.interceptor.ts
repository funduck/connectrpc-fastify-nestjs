import { Code, ConnectError } from '@connectrpc/connect';
import { AnyFn, ConnectRPC, Interceptor } from '@funduck/connectrpc-fastify';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { errorKey, requestIdKey } from './auth.middleware';
import { BaseError } from './types';

@Injectable()
export class ExceptionInterceptor implements Interceptor {
  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      try {
        // Check if we already have an error in context (set by middleware)
        const err = req.contextValues.get(errorKey);
        if (err) {
          throw err;
        }

        // Process the request
        const result = await next(req);

        return result;
      } catch (err) {
        // Map NestJS/HTTP errors to ConnectRPC codes
        let code: Code;
        switch (
          err instanceof BaseError
            ? err.httpCode
            : HttpStatus.INTERNAL_SERVER_ERROR
        ) {
          case HttpStatus.BAD_REQUEST:
            code = Code.InvalidArgument;
            break;
          case HttpStatus.UNAUTHORIZED:
            code = Code.Unauthenticated;
            break;
          case HttpStatus.FORBIDDEN:
            code = Code.PermissionDenied;
            break;
          case HttpStatus.NOT_FOUND:
            code = Code.NotFound;
            break;
          case HttpStatus.CONFLICT:
            code = Code.AlreadyExists;
            break;
          case HttpStatus.TOO_MANY_REQUESTS:
            code = Code.ResourceExhausted;
            break;
          case HttpStatus.INTERNAL_SERVER_ERROR:
          default:
            code = Code.Internal;
            break;
        }

        this.logger.error(err, {
          requestId: req.contextValues.get(requestIdKey)?.value,
        });

        throw new ConnectError(err.message, code);
      }
    };
  }
}
