import { ConnectRPC, Middleware } from '@funduck/connectrpc-fastify';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class TestMiddleware1 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    null;

  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerMiddleware(this, {
      allowMultipleInstances: false, // If true, we allow multiple instances of this middleware, but usually we want only one
    });
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    this.logger.log(`TestMiddleware1 invoked`);
    TestMiddleware1.callback(req, res);
    next();
  }
}

@Injectable()
export class TestMiddleware2 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    null;

  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerMiddleware(this, {
      allowMultipleInstances: false, // If true, we allow multiple instances of this middleware, but usually we want only one
    });
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    this.logger.log(`TestMiddleware2 invoked`);
    TestMiddleware2.callback(req, res);
    next();
  }
}

@Injectable()
export class TestMiddleware3 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    null;

  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerMiddleware(this, {
      allowMultipleInstances: false, // If true, we allow multiple instances of this middleware, but usually we want only one
    });
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    this.logger.log(`TestMiddleware3 invoked`);
    TestMiddleware3.callback(req, res);
    next();
  }
}
