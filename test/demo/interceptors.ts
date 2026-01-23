import { StreamRequest, UnaryRequest } from '@connectrpc/connect';
import { AnyFn, ConnectRPC, Interceptor } from '@funduck/connectrpc-fastify';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TestInterceptor1 implements Interceptor {
  static callback: (req: UnaryRequest | StreamRequest) => void;

  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      this.logger.log(`TestInterceptor1 invoked`);

      TestInterceptor1.callback?.(req);

      return await next(req);
    };
  }
}

export class TestInterceptor2 implements Interceptor {
  static callback: (req: UnaryRequest | StreamRequest) => void;

  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      this.logger.log(`TestInterceptor2 invoked`);

      TestInterceptor2.callback?.(req);

      return await next(req);
    };
  }
}

export class TestInterceptor3 implements Interceptor {
  static callback: (req: UnaryRequest | StreamRequest) => void;

  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      this.logger.log(`TestInterceptor3 invoked`);

      TestInterceptor3.callback?.(req);

      return await next(req);
    };
  }
}
