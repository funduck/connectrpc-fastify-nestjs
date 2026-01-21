import {
  ConnectRPC,
  ExecutionContext,
  Guard,
} from '@funduck/connectrpc-fastify';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TestGuard1 implements Guard {
  static callback = (context: ExecutionContext) => true;

  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerGuard(this);
  }

  canActivate(context: ExecutionContext): boolean {
    this.logger.log(`TestGuard1 invoked`);
    return TestGuard1.callback(context);
  }
}
