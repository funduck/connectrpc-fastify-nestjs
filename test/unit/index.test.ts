import {
  ConnectRPCModule,
  ConnectRPCModuleOptions,
  printMsg,
} from '../../src/index';

describe('Index exports', () => {
  describe('printMsg', () => {
    it('should print warning message to console.error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      printMsg();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'connectrpc-fastify-nestjs is in development mode! not ready for production yet!',
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Module exports', () => {
    it('should export ConnectRPCModule', () => {
      expect(ConnectRPCModule).toBeDefined();
      expect(ConnectRPCModule.name).toBe('ConnectRPCModule');
    });

    it('should export ConnectRPCModuleOptions type', () => {
      // Type check - this will fail at compile time if the type is not exported
      const options: ConnectRPCModuleOptions = {
        logger: {
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          verbose: jest.fn(),
        },
        middlewares: [],
        interceptors: [],
      };

      expect(options).toBeDefined();
    });
  });
});
