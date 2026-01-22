export function printMsg() {
  console.error(
    'connectrpc-fastify-nestjs is in development mode! not ready for production yet!',
  );
}

export { ConnectRPCModule } from './connectrpc.module';

export type { ConnectRPCModuleOptions } from './interfaces';
