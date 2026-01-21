# Connectrpc Fastify Wrapper For Nestjs

## Description

This package allows to add [Connectrpc](https://github.com/connectrpc/connect-es) into [Nestjs](https://github.com/nestjs/nest) project using the [Fastify](https://github.com/fastify/fastify) server.

If you are comfortable with HTTP/1 only and want a compact, ready-to-use setup, this repository is for you.

It simplifies the binding of controllers, middlewares, and guards.

It uses my another package [Connectrpc Fastify Wrapper](https://github.com/funduck/connectrpc-fastify).

## Features

This library allows you to:
* Use only HTTP/1 transport
* Perform RPC with simple request and response messages
* Perform RPC with streaming responses
* Perform RPC with streaming requests
* Use middlewares
* Use global guards

*Bidirectional streaming RPC is currently out of scope because it requires HTTP/2, which is unstable on public networks. In practice, HTTP/1 provides more consistent performance.*


## How To Use

You can check out the `test` directory for a complete example of server and client integration using NestJS and Fastify. Start reading from `test/app.module.ts`.

Except the bootstrap instructions are pretty much the same as in [Connectrpc Fastify Wrapper](https://github.com/funduck/connectrpc-fastify#how-to-use).

### Controllers
Controller must implement the service interface (not all methods) and register itself using `ConnectRPC.registerController`:
```TS
@Injectable()
export class ElizaController implements Service<typeof ElizaService> {
  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerController(this, ElizaService);
  }

  async say(
    request: SayRequest,
  ) {
    return {
      sentence: `You said: ${request.sentence}`,
    };
  }

  // ... Other methods are optional
}
```

### Middlewares
Middleware must implement `Middleware` interface and register itself using `ConnectRPC.registerMiddleware`:
```TS
@Injectable()
export class TestMiddleware1 implements Middleware {
  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerMiddleware(this);
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    next();
  }
}

```

### Guards
Guard must implement `Guard` interface and register itself using `ConnectRPC.registerGuard`:
```TS
@Injectable()
export class TestGuard1 implements Guard {
  @Inject(Logger)
  private logger: Logger;

  constructor() {
    ConnectRPC.registerGuard(this);
  }

  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

### Module Setup
Configure your NestJS module to use `ConnectRPCModule.forRoot` and register middlewares/guards as providers if necessary:

```typescript
@Module({
  imports: [
    // Configure ConnectRPCModule
    ConnectRPCModule.forRoot({
      logger: new Logger('ConnectRPC', { timestamp: true }),
      middlewares: [
        middlewareConfig(TestMiddleware1),
        middlewareConfig(TestMiddleware2, ElizaService),
        middlewareConfig(TestMiddleware3, ElizaService, ['say']),
      ],
    }),
  ],
  providers: [
    Logger,

    // Guard is provided the NestJS way
    { provide: APP_GUARD, useClass: TestGuard1 },

    // Controllers are provided here instead of `controllers` array
    ElizaController, 

    // Middlewares specific for ConnectRPC are provided here
    TestMiddleware1, 
    TestMiddleware2,

    // Middlewares that are applied via `consumer.apply()` should NOT be provided here
    // Do not instantiate TestMiddleware3 twice!
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TestMiddleware3).forRoutes('*'); // TestMiddleware3 is instantiated here!
  }
}
```

### Server Bootstrap
Just add the call to `ConnectRPCModule` after creating the app:

```typescript
export async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // After the app is created, register the ConnectRPCModule
  await app.get(ConnectRPCModule).registerPlugin();

  await app.listen(3000);
}
```

## Feedback
Please use [Discussions](https://github.com/funduck/connectrpc-fastify-nestjs/discussions) or email me.
