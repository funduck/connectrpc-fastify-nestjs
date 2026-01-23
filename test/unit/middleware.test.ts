import { create } from '@bufbuild/protobuf';
import { Client, createContextKey } from '@connectrpc/connect';
import { getCustomContextValues } from '@funduck/connectrpc-fastify';
import { ElizaController } from '../demo/controller';
import {
  ElizaService,
  SayRequestSchema,
} from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from '../demo/middlewares';
import { resetMiddlewareCallbacks, setupTestServer } from './test-helpers';

describe('Middlewares', () => {
  let client: Client<typeof ElizaService>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const setup = await setupTestServer();
    client = setup.client;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    resetMiddlewareCallbacks();
  });

  describe('TestMiddleware1 - Applied to all services and methods', () => {
    it('should be called for unary RPC (say)', async () => {
      let middleware1Called = false;

      TestMiddleware1.callback = () => {
        middleware1Called = true;
      };

      await client.say({ sentence: 'Test' });

      expect(middleware1Called).toBe(true);
    });

    it('should be called for client streaming RPC (sayMany)', async () => {
      let middleware1Called = false;

      TestMiddleware1.callback = () => {
        middleware1Called = true;
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      expect(middleware1Called).toBe(true);
    });

    it('should be called for server streaming RPC (listenMany)', async () => {
      let middleware1Called = false;

      TestMiddleware1.callback = () => {
        middleware1Called = true;
      };

      for await (const _ of client.listenMany({ sentence: 'Test' })) {
        // Just consume the stream
      }

      expect(middleware1Called).toBe(true);
    });

    it('should have access to request object', async () => {
      let requestUrl: string | undefined;

      TestMiddleware1.callback = (req) => {
        requestUrl = req.url;
      };

      await client.say({ sentence: 'Test' });

      expect(requestUrl).toBeDefined();
      expect(requestUrl).toContain('connectrpc.eliza.v1.ElizaService/Say');
    });
  });

  describe('TestMiddleware2 - Applied to ElizaService only', () => {
    it('should be called for unary RPC (say)', async () => {
      let middleware2Called = false;

      TestMiddleware2.callback = () => {
        middleware2Called = true;
      };

      await client.say({ sentence: 'Test' });

      expect(middleware2Called).toBe(true);
    });

    it('should be called for client streaming RPC (sayMany)', async () => {
      let middleware2Called = false;

      TestMiddleware2.callback = () => {
        middleware2Called = true;
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      expect(middleware2Called).toBe(true);
    });

    it('should be called for server streaming RPC (listenMany)', async () => {
      let middleware2Called = false;

      TestMiddleware2.callback = () => {
        middleware2Called = true;
      };

      for await (const _ of client.listenMany({ sentence: 'Test' })) {
        // Just consume the stream
      }

      expect(middleware2Called).toBe(true);
    });
  });

  describe('TestMiddleware3 - Applied to ElizaService.say only', () => {
    it('should be called for unary RPC (say)', async () => {
      let middleware3Called = false;

      TestMiddleware3.callback = () => {
        middleware3Called = true;
      };

      await client.say({ sentence: 'Test' });

      expect(middleware3Called).toBe(true);
    });

    it('should NOT be called for client streaming RPC (sayMany)', async () => {
      let middleware3Called = false;

      TestMiddleware3.callback = () => {
        middleware3Called = true;
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      expect(middleware3Called).toBe(false);
    });

    it('should NOT be called for server streaming RPC (listenMany)', async () => {
      let middleware3Called = false;

      TestMiddleware3.callback = () => {
        middleware3Called = true;
      };

      for await (const _ of client.listenMany({ sentence: 'Test' })) {
        // Just consume the stream
      }

      expect(middleware3Called).toBe(false);
    });
  });

  describe('Middleware execution order', () => {
    it('should execute middlewares in order for unary RPC', async () => {
      const executionOrder: number[] = [];

      TestMiddleware1.callback = () => {
        executionOrder.push(1);
      };

      TestMiddleware2.callback = () => {
        executionOrder.push(2);
      };

      TestMiddleware3.callback = () => {
        executionOrder.push(3);
      };

      await client.say({ sentence: 'Test' });

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should execute only applicable middlewares for sayMany', async () => {
      const executionOrder: number[] = [];

      TestMiddleware1.callback = () => {
        executionOrder.push(1);
      };

      TestMiddleware2.callback = () => {
        executionOrder.push(2);
      };

      TestMiddleware3.callback = () => {
        executionOrder.push(3);
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      // Middleware3 should not be called for sayMany
      expect(executionOrder).toEqual([1, 2]);
    });
  });

  describe('Middleware can modify request context', () => {
    it('should allow middleware to add custom data to request', async () => {
      const customKey = createContextKey('');
      let receivedCustomData = '';

      TestMiddleware1.callback = (req) => {
        getCustomContextValues(req)!.set(
          customKey,
          'custom-data-from-middleware',
        );
      };

      ElizaController.sayCallback = (request, _context) => {
        receivedCustomData = _context.values.get(customKey);
      };

      await client.say(
        { sentence: 'Test' },
        {
          headers: {
            'x-custom-header': 'custom-value',
          },
        },
      );

      expect(receivedCustomData).toBe('custom-data-from-middleware');
    });
  });
});
