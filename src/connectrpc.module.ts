import { ConnectRPC } from '@funduck/connectrpc-fastify';
import {
  DynamicModule,
  Inject,
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { ConnectRPCModuleOptions } from './interfaces';

const CONNECTRPC_MODULE_OPTIONS = Symbol('CONNECTRPC_MODULE_OPTIONS');

/**
 * NestJS module for ConnectRPC integration
 *
 * Call registerPlugin() after app initialization and before server starts listening
 *
 */
@Module({})
export class ConnectRPCModule implements OnModuleInit {
  static readonly logger = new Logger(ConnectRPCModule.name, {
    timestamp: true,
  });
  private readonly logger = ConnectRPCModule.logger;

  /**
   * Configure the ConnectRPC module with options
   */
  static forRoot(options: ConnectRPCModuleOptions = {}): DynamicModule {
    if (options.logger) {
      ConnectRPC.setLogger(options.logger);
    }
    return {
      module: ConnectRPCModule,
      global: true,
      providers: [
        {
          provide: CONNECTRPC_MODULE_OPTIONS,
          useValue: options,
        },
      ],
      exports: [CONNECTRPC_MODULE_OPTIONS],
    };
  }

  // For injections
  constructor(
    @Inject(HttpAdapterHost)
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(CONNECTRPC_MODULE_OPTIONS)
    private readonly options: ConnectRPCModuleOptions,
  ) {}

  private getServer() {
    const httpAdapter = this.httpAdapterHost.httpAdapter;

    if (!httpAdapter) {
      this.logger.error('HTTP Adapter not found');
      if (ConnectRPC.isStrictMode) {
        throw new Error('HTTP Adapter not found');
      }
      return;
    }

    // For now, only Fastify is supported
    if (!(httpAdapter instanceof FastifyAdapter)) {
      this.logger.error('Only FastifyAdapter is supported');
      if (ConnectRPC.isStrictMode) {
        throw new Error('Only FastifyAdapter is supported');
      }
      return;
    }
    const fastifyAdapter = httpAdapter as FastifyAdapter;

    const server = fastifyAdapter.getInstance();
    return server;
  }

  private registerPluginCalled = false;

  /** This must be called after app is initialized and before server starts listening */
  async registerPlugin() {
    if (this.registerPluginCalled) {
      this.logger.warn('registerPlugin() has already been called');
      return;
    }
    this.registerPluginCalled = true;

    const server = this.getServer();
    if (!server) {
      this.logger.error('Fastify server instance not found');
      if (ConnectRPC.isStrictMode) {
        throw new Error('Fastify server instance not found');
      }
      return;
    }

    ConnectRPC.initControllers();

    ConnectRPC.initInterceptors(this.options.interceptors || []);

    await ConnectRPC.registerFastifyPlugin(server);
  }

  /** This is called by NestJS after the module has been initialized */
  async onModuleInit() {
    if (!this.registerPluginCalled) {
      this.logger.error(
        'registerPlugin() has not been called. Please call registerPlugin() after app initialization and before server starts listening.',
      );
      if (ConnectRPC.isStrictMode) {
        throw new Error(
          'registerPlugin() has not been called. Please call registerPlugin() after app initialization and before server starts listening.',
        );
      }
      return;
    }

    const server = this.getServer();
    if (!server) {
      this.logger.error('Fastify server instance not found');
      if (ConnectRPC.isStrictMode) {
        throw new Error('Fastify server instance not found');
      }
      return;
    }

    // Initialize middlewares first
    await ConnectRPC.initMiddlewares(server, this.options.middlewares || []);
  }
}
