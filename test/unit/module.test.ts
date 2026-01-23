import { ConnectRPC } from '@funduck/connectrpc-fastify';
import { HttpAdapterHost } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ConnectRPCModule } from '../../src/connectrpc.module';
import { ConnectRPCModuleOptions } from '../../src/interfaces';

// Mock ConnectRPC
jest.mock('@funduck/connectrpc-fastify');

describe('ConnectRPCModule', () => {
  let mockHttpAdapterHost: jest.Mocked<HttpAdapterHost>;
  let mockFastifyAdapter: any;
  let mockFastifyInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Fastify instance
    mockFastifyInstance = {
      register: jest.fn(),
    };

    // Create mock FastifyAdapter - needs to be an actual instance for instanceof check
    mockFastifyAdapter = Object.create(FastifyAdapter.prototype);
    mockFastifyAdapter.getInstance = jest
      .fn()
      .mockReturnValue(mockFastifyInstance);

    // Create mock HttpAdapterHost
    mockHttpAdapterHost = {
      httpAdapter: mockFastifyAdapter,
    } as any;

    // Mock ConnectRPC methods
    (ConnectRPC.setLogger as jest.Mock) = jest.fn();
    (ConnectRPC.initInterceptors as jest.Mock) = jest.fn();
    (ConnectRPC.registerFastifyPlugin as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);
    (ConnectRPC.initMiddlewares as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);
  });

  describe('forRoot', () => {
    it('should create module without options', () => {
      const module = ConnectRPCModule.forRoot();

      expect(module.module).toBe(ConnectRPCModule);
      expect(module.global).toBe(true);
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('should create module with logger option', () => {
      const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        verbose: jest.fn(),
      };

      const module = ConnectRPCModule.forRoot({ logger: mockLogger });

      expect(ConnectRPC.setLogger).toHaveBeenCalledWith(mockLogger);
      expect(module.module).toBe(ConnectRPCModule);
    });

    it('should create module with all options', () => {
      const options: ConnectRPCModuleOptions = {
        logger: {
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          log: jest.fn(),
          verbose: jest.fn(),
        },
        middlewares: [],
        interceptors: [],
      };

      const module = ConnectRPCModule.forRoot(options);

      expect(ConnectRPC.setLogger).toHaveBeenCalledWith(options.logger);
      expect(module.module).toBe(ConnectRPCModule);
    });
  });

  describe('getServer', () => {
    it('should throw error when HTTP adapter is not found', async () => {
      const options: ConnectRPCModuleOptions = {};
      const moduleOptions = ConnectRPCModule.forRoot(options);

      // Create module instance with no HTTP adapter
      const mockEmptyAdapterHost = {
        httpAdapter: null,
      } as any;

      const moduleInstance = new ConnectRPCModule(
        mockEmptyAdapterHost,
        options,
      );

      await expect(moduleInstance.registerPlugin()).rejects.toThrow(
        'HTTP Adapter not found',
      );
    });

    it('should throw error when adapter is not FastifyAdapter', async () => {
      const options: ConnectRPCModuleOptions = {};

      // Create a mock non-Fastify adapter
      const mockExpressAdapter = {
        getInstance: jest.fn(),
      };

      const mockAdapterHost = {
        httpAdapter: mockExpressAdapter,
      } as any;

      const moduleInstance = new ConnectRPCModule(mockAdapterHost, options);

      await expect(moduleInstance.registerPlugin()).rejects.toThrow(
        'Only FastifyAdapter is supported',
      );
    });
  });

  describe('registerPlugin', () => {
    it('should register plugin successfully', async () => {
      const options: ConnectRPCModuleOptions = {
        interceptors: [],
      };

      const moduleInstance = new ConnectRPCModule(mockHttpAdapterHost, options);

      await moduleInstance.registerPlugin();

      expect(ConnectRPC.initInterceptors).toHaveBeenCalledWith([]);
      expect(ConnectRPC.registerFastifyPlugin).toHaveBeenCalledWith(
        mockFastifyInstance,
      );
    });

    it('should warn when registerPlugin is called twice', async () => {
      const options: ConnectRPCModuleOptions = {};
      const moduleInstance = new ConnectRPCModule(mockHttpAdapterHost, options);

      const warnSpy = jest.spyOn(ConnectRPCModule.logger, 'warn');

      await moduleInstance.registerPlugin();
      await moduleInstance.registerPlugin();

      expect(warnSpy).toHaveBeenCalledWith(
        'registerPlugin() has already been called',
      );
    });

    it('should throw error when fastify server instance is null', async () => {
      const options: ConnectRPCModuleOptions = {};

      // Mock getInstance to return null
      mockFastifyAdapter.getInstance.mockReturnValue(null);

      const moduleInstance = new ConnectRPCModule(mockHttpAdapterHost, options);

      await expect(moduleInstance.registerPlugin()).rejects.toThrow(
        'Fastify server instance not found',
      );
    });
  });

  describe('onModuleInit', () => {
    it('should throw error when registerPlugin was not called', async () => {
      const options: ConnectRPCModuleOptions = {};
      const moduleInstance = new ConnectRPCModule(mockHttpAdapterHost, options);

      await expect(moduleInstance.onModuleInit()).rejects.toThrow(
        'ConnectRPCModule.onModuleInit: registerPlugin() has not been called',
      );
    });

    it('should initialize middlewares after registerPlugin', async () => {
      const options: ConnectRPCModuleOptions = {
        middlewares: [],
      };

      const moduleInstance = new ConnectRPCModule(mockHttpAdapterHost, options);

      await moduleInstance.registerPlugin();
      await moduleInstance.onModuleInit();

      expect(ConnectRPC.initMiddlewares).toHaveBeenCalledWith(
        mockFastifyInstance,
        [],
      );
    });
  });

  describe('Logger', () => {
    it('should have a logger instance', () => {
      expect(ConnectRPCModule.logger).toBeDefined();
      expect(ConnectRPCModule.logger.constructor.name).toBe('Logger');
    });
  });
});
