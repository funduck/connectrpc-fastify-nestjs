import { Client, createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import { ConnectRPC } from '@funduck/connectrpc-fastify';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConnectRPCModule } from '../../src';
import { AppModule } from '../demo/app.module';
import { ElizaService } from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import {
  TestInterceptor1,
  TestInterceptor2,
  TestInterceptor3,
} from '../demo/interceptors';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from '../demo/middlewares';

export async function setupTestServer(port: number = 0): Promise<{
  client: Client<typeof ElizaService>;
  cleanup: () => Promise<void>;
}> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: false,
    },
  );

  await app.get(ConnectRPCModule).registerPlugin();

  const server = await app.listen(port);
  const actualPort = (server.address() as any).port;

  // Create client
  const transport = createConnectTransport({
    baseUrl: `http://127.0.0.1:${actualPort}`,
    httpVersion: '1.1',
  });

  const client = createClient(ElizaService, transport);

  const cleanup = async () => {
    await app.close();
    ConnectRPC.clear();
  };

  return {
    client,
    cleanup,
  };
}

export function resetMiddlewareCallbacks() {
  TestMiddleware1.callback = () => undefined;
  TestMiddleware2.callback = () => undefined;
  TestMiddleware3.callback = () => undefined;
}

export function resetInterceptorCallbacks() {
  TestInterceptor1.callback = () => undefined;
  TestInterceptor2.callback = () => undefined;
  TestInterceptor3.callback = () => undefined;
}
