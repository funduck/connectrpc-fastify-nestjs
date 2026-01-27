import { createContextKey } from '@connectrpc/connect';
import {
  ConnectRPC,
  Middleware,
  getCustomContextValues,
} from '@funduck/connectrpc-fastify';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { randomUUID } from 'node:crypto';
import { AccessToken, AuthService, BaseError, RequestId } from './types';

export const accessTokenKey = createContextKey<AccessToken>(undefined);
export const requestIdKey = createContextKey<RequestId>(undefined);
export const errorKey = createContextKey<BaseError>(undefined);

@Injectable()
export class AuthMiddleware implements Middleware {
  @Inject(AuthService)
  private authService: AuthService;

  constructor() {
    ConnectRPC.registerMiddleware(this);
  }

  async use(
    req: FastifyRequest['raw'],
    res: FastifyReply['raw'],
    next: () => void,
  ): Promise<void> {
    const context = getCustomContextValues(req)!;

    try {
      // Generating or extracting request ID
      const reqId = req.headers['x-request-id'] || randomUUID();
      const requestId = new RequestId(reqId as string);
      context.set(requestIdKey, requestId);

      // Extracting access token
      const accessToken = await this.authService.extractAccessToken(
        req.headers['authorization'] as string,
      );
      if (!accessToken) {
        throw new BaseError('Access token is missing', HttpStatus.UNAUTHORIZED);
      }

      // Saving access token to context, so it can be used in handlers
      context.set(accessTokenKey, accessToken);
    } catch (err) {
      // Saving error to context, so it can be handled by ExceptionInterceptor
      context.set(errorKey, err);
    } finally {
      next();
    }
  }
}
