import {
  ConnectRPC,
  interceptorConfig,
  middlewareConfig,
} from '@funduck/connectrpc-fastify';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConnectRPCModule } from '../../src/connectrpc.module';
import { ElizaController } from '../demo/controller';
import { TestInterceptor1 } from '../demo/interceptors';
import { TestMiddleware1 } from '../demo/middlewares';

describe('ConnectRPCModule Integration Tests', () => {
  let app: NestFastifyApplication;
  let connectRPCModule: ConnectRPCModule;

  describe('Basic Module Creation', () => {
    it('should create module without options', () => {
      const module = ConnectRPCModule.forRoot();

      expect(module.module).toBe(ConnectRPCModule);
      expect(module.global).toBe(true);
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('should create module with logger option', () => {
      const customLogger = new Logger('TestLogger');
      const module = ConnectRPCModule.forRoot({ logger: customLogger });

      expect(module.module).toBe(ConnectRPCModule);
      expect(module.providers).toBeDefined();
    });

    it('should create module with all options', () => {
      const customLogger = new Logger('TestLogger');
      const module = ConnectRPCModule.forRoot({
        logger: customLogger,
        middlewares: [],
        interceptors: [],
      });

      expect(module.module).toBe(ConnectRPCModule);
      expect(module.providers).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    afterEach(async () => {
      if (app) {
        await app.close();
        ConnectRPC.clear();
      }
    });

    it('should start server and register plugin successfully', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      await connectRPCModule.registerPlugin();
      await app.init();

      expect(app).toBeDefined();
      expect(connectRPCModule).toBeDefined();
    });

    it('should throw error when registerPlugin is called twice', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      await connectRPCModule.registerPlugin();

      // Second call should log warning but not throw
      const warnSpy = jest.spyOn(ConnectRPCModule.logger, 'warn');
      await connectRPCModule.registerPlugin();

      expect(warnSpy).toHaveBeenCalledWith(
        'registerPlugin() has already been called',
      );
    });

    it('should throw error when onModuleInit is called before registerPlugin', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      ConnectRPC.setStrictMode(true);

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      await expect(connectRPCModule.onModuleInit()).rejects.toThrow(
        /registerPlugin\(\) has not been called/,
      );
    });

    it('should initialize with custom logger', async () => {
      const customLogger = new Logger('CustomConnectRPC');

      @Module({
        imports: [ConnectRPCModule.forRoot({ logger: customLogger })],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      await connectRPCModule.registerPlugin();
      await app.init();

      expect(connectRPCModule).toBeDefined();
    });

    it('should initialize with middlewares and interceptors', async () => {
      let middlewareCalled = false;
      let interceptorCalled = false;

      TestMiddleware1.callback = (req, res) => {
        middlewareCalled = true;
      };
      TestInterceptor1.callback = async (req) => {
        interceptorCalled = true;
      };

      @Module({
        imports: [
          ConnectRPCModule.forRoot({
            middlewares: [middlewareConfig(TestMiddleware1)],
            interceptors: [interceptorConfig(TestInterceptor1)],
          }),
        ],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      await connectRPCModule.registerPlugin();
      await app.init();

      expect(connectRPCModule).toBeDefined();
    });
  });

  describe('Logger', () => {
    it('should have a logger instance', () => {
      expect(ConnectRPCModule.logger).toBeDefined();
      expect(ConnectRPCModule.logger.constructor.name).toBe('Logger');
    });
  });

  describe('Error Handling in Strict Mode', () => {
    beforeEach(() => {
      ConnectRPC.setStrictMode(true);
    });

    afterEach(async () => {
      ConnectRPC.setStrictMode(false);
      if (app) {
        await app.close();
        ConnectRPC.clear();
      }
    });

    it('should throw error when HTTP adapter is not found', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // Mock the httpAdapterHost to return null httpAdapter
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: null },
        writable: true,
        configurable: true,
      });

      await expect(connectRPCModule.registerPlugin()).rejects.toThrow(
        'HTTP Adapter not found',
      );
    });

    it('should throw error when non-Fastify adapter is used', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // Mock the httpAdapterHost to return a non-Fastify adapter
      const mockAdapter = {
        getInstance: jest.fn(),
      };
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: mockAdapter },
        writable: true,
        configurable: true,
      });

      await expect(connectRPCModule.registerPlugin()).rejects.toThrow(
        'Only FastifyAdapter is supported',
      );
    });

    it('should throw error when Fastify server instance is not found in registerPlugin', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // Mock the FastifyAdapter to return null server instance
      const mockAdapter = new FastifyAdapter();
      jest.spyOn(mockAdapter, 'getInstance').mockReturnValue(null as any);
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: mockAdapter },
        writable: true,
        configurable: true,
      });

      await expect(connectRPCModule.registerPlugin()).rejects.toThrow(
        'Fastify server instance not found',
      );
    });

    it('should throw error when Fastify server instance is not found in onModuleInit', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // First call registerPlugin successfully
      await connectRPCModule.registerPlugin();

      // Then mock the FastifyAdapter to return null server instance for onModuleInit
      const mockAdapter = new FastifyAdapter();
      jest.spyOn(mockAdapter, 'getInstance').mockReturnValue(null as any);
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: mockAdapter },
        writable: true,
        configurable: true,
      });

      await expect(connectRPCModule.onModuleInit()).rejects.toThrow(
        'Fastify server instance not found',
      );
    });
  });

  describe('Error Logging in Non-Strict Mode', () => {
    beforeEach(() => {
      ConnectRPC.setStrictMode(false);
    });

    afterEach(async () => {
      if (app) {
        await app.close();
        ConnectRPC.clear();
      }
    });

    it('should log error but not throw when HTTP adapter is not found', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // Mock the httpAdapterHost to return null httpAdapter
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: null },
        writable: true,
        configurable: true,
      });

      const errorSpy = jest.spyOn(ConnectRPCModule.logger, 'error');

      await connectRPCModule.registerPlugin();

      expect(errorSpy).toHaveBeenCalledWith('HTTP Adapter not found');
    });

    it('should log error but not throw when non-Fastify adapter is used', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // Mock the httpAdapterHost to return a non-Fastify adapter
      const mockAdapter = {
        getInstance: jest.fn(),
      };
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: mockAdapter },
        writable: true,
        configurable: true,
      });

      const errorSpy = jest.spyOn(ConnectRPCModule.logger, 'error');

      await connectRPCModule.registerPlugin();

      expect(errorSpy).toHaveBeenCalledWith('Only FastifyAdapter is supported');
    });

    it('should log error but not throw when Fastify server instance is not found in registerPlugin', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // Mock the FastifyAdapter to return null server instance
      const mockAdapter = new FastifyAdapter();
      jest.spyOn(mockAdapter, 'getInstance').mockReturnValue(null as any);
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: mockAdapter },
        writable: true,
        configurable: true,
      });

      const errorSpy = jest.spyOn(ConnectRPCModule.logger, 'error');

      await connectRPCModule.registerPlugin();

      expect(errorSpy).toHaveBeenCalledWith('Fastify server instance not found');
    });

    it('should log error but not throw when onModuleInit is called before registerPlugin', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      const errorSpy = jest.spyOn(ConnectRPCModule.logger, 'error');

      await connectRPCModule.onModuleInit();

      expect(errorSpy).toHaveBeenCalledWith(
        'registerPlugin() has not been called. Please call registerPlugin() after app initialization and before server starts listening.',
      );
    });

    it('should log error but not throw when Fastify server instance is not found in onModuleInit', async () => {
      @Module({
        imports: [ConnectRPCModule.forRoot()],
        providers: [ElizaController, Logger],
      })
      class TestAppModule {}

      app = await NestFactory.create<NestFastifyApplication>(
        TestAppModule,
        new FastifyAdapter(),
        { logger: false },
      );

      connectRPCModule = app.get(ConnectRPCModule);

      // First call registerPlugin successfully
      await connectRPCModule.registerPlugin();

      // Then mock the FastifyAdapter to return null server instance for onModuleInit
      const mockAdapter = new FastifyAdapter();
      jest.spyOn(mockAdapter, 'getInstance').mockReturnValue(null as any);
      Object.defineProperty(connectRPCModule, 'httpAdapterHost', {
        value: { httpAdapter: mockAdapter },
        writable: true,
        configurable: true,
      });

      const errorSpy = jest.spyOn(ConnectRPCModule.logger, 'error');

      await connectRPCModule.onModuleInit();

      expect(errorSpy).toHaveBeenCalledWith('Fastify server instance not found');
    });
  });
});
