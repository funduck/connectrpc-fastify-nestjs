import { middlewareConfig } from '@funduck/connectrpc-fastify';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConnectRPCModule } from '../src';
import { ElizaController } from './controller';
import { ElizaService } from './gen/connectrpc/eliza/v1/eliza_pb';
import { TestGuard1 } from './guards';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from './middlewares';

@Module({
  imports: [
    ConnectRPCModule.forRoot({
      logger: new Logger('ConnectRPC', { timestamp: true }),
      middlewares: [
        // Example 1: Apply to all services and all methods
        middlewareConfig(TestMiddleware1),
        // Example 2: Apply to specific service only
        middlewareConfig(TestMiddleware2, ElizaService),
        // Example 3: Apply to specific methods of a service
        middlewareConfig(TestMiddleware3, ElizaService, ['say']),
      ],
    }),
  ],
  providers: [
    Logger,
    // Registering a global guard the NestJS way
    {
      provide: APP_GUARD,
      useClass: TestGuard1,
    },

    // Connectrpc controller is not "http" controller, so we don't put it in "controllers" array
    ElizaController,

    // We have to provide middlewares here so that NestJS instantiates them before server is started
    // Otherwise we can't register them in ConnectRPC
    TestMiddleware1,
    TestMiddleware2,
    // But we have to avoid providing TestMiddleware3 here to prevent double instantiation!
    // TestMiddleware3, // If you uncomment this line, you'll see an error thrown at runtime - which is good, double instantiation is dangerous
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Applying middlewares to REST HTTP routes the NestJS way
    consumer.apply(TestMiddleware3).forRoutes('*');
  }
}
