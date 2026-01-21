import { Logger, MiddlewareConfigUnion } from '@funduck/connectrpc-fastify';

/**
 * Options for configuring ConnectRPC module
 */
export interface ConnectRPCModuleOptions {
  logger?: Logger;

  /**
   * Middleware configurations to apply to ConnectRPC routes
   */
  middlewares?: MiddlewareConfigUnion[];

  // For now we enable only Connect protocol by default and disable others.
  // /**
  //  * Whether to enable gRPC protocol (default: false)
  //  */
  // grpc?: boolean;

  // /**
  //  * Whether to enable gRPC-Web protocol (default: false)
  //  */
  // grpcWeb?: boolean;

  // /**
  //  * Whether to enable Connect protocol (default: true)
  //  */
  // connect?: boolean;

  // And we disable compression.
  // /**
  //  * Compression formats to accept (default: [])
  //  */
  // acceptCompression?: Compression[];
}
