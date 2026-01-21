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
      throw new Error('HTTP Adapter not found');
    }

    // For now, only Fastify is supported
    if (!(httpAdapter instanceof FastifyAdapter)) {
      throw new Error('Only FastifyAdapter is supported');
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
      throw new Error('Fastify server instance not found');
    }

    await ConnectRPC.registerFastifyPlugin(server);
  }

  /** This is called by NestJS after the module has been initialized */
  async onModuleInit() {
    if (!this.registerPluginCalled) {
      throw new Error(
        'ConnectRPCModule.onModuleInit: registerPlugin() has not been called. Please call registerPlugin() after app initialization and before server starts listening.',
      );
    }

    const server = this.getServer();

    // Initialize middlewares first
    await ConnectRPC.initMiddlewares(server, this.options.middlewares || []);

    // Initialize guards after middlewares
    await ConnectRPC.initGuards(server);
  }
}
