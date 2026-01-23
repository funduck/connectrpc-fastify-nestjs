import { create } from '@bufbuild/protobuf';
import { Client, createContextKey } from '@connectrpc/connect';
import { ElizaController } from '../demo/controller';
import {
  ElizaService,
  SayRequestSchema,
} from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import {
  TestInterceptor1,
  TestInterceptor2,
  TestInterceptor3,
} from '../demo/interceptors';
import { resetInterceptorCallbacks, setupTestServer } from './test-helpers';

describe('Interceptors', () => {
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
    resetInterceptorCallbacks();
  });

  describe('TestInterceptor1 - Applied to all services and methods', () => {
    it('should be called for unary RPC (say)', async () => {
      let interceptor1Called = false;

      TestInterceptor1.callback = () => {
        interceptor1Called = true;
      };

      await client.say({ sentence: 'Test' });

      expect(interceptor1Called).toBe(true);
    });

    it('should be called for client streaming RPC (sayMany)', async () => {
      let interceptor1Called = false;

      TestInterceptor1.callback = () => {
        interceptor1Called = true;
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      expect(interceptor1Called).toBe(true);
    });

    it('should be called for server streaming RPC (listenMany)', async () => {
      let interceptor1Called = false;

      TestInterceptor1.callback = () => {
        interceptor1Called = true;
      };

      for await (const _ of client.listenMany({ sentence: 'Test' })) {
        // Just consume the stream
      }

      expect(interceptor1Called).toBe(true);
    });

    it('should have access to request object', async () => {
      let requestMethod: string | undefined;

      TestInterceptor1.callback = (req) => {
        requestMethod = req.method.name;
      };

      await client.say({ sentence: 'Test' });

      expect(requestMethod).toBe('Say');
    });
  });

  describe('TestInterceptor2 - Applied to ElizaService only', () => {
    it('should be called for unary RPC (say)', async () => {
      let interceptor2Called = false;

      TestInterceptor2.callback = () => {
        interceptor2Called = true;
      };

      await client.say({ sentence: 'Test' });

      expect(interceptor2Called).toBe(true);
    });

    it('should be called for client streaming RPC (sayMany)', async () => {
      let interceptor2Called = false;

      TestInterceptor2.callback = () => {
        interceptor2Called = true;
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      expect(interceptor2Called).toBe(true);
    });

    it('should be called for server streaming RPC (listenMany)', async () => {
      let interceptor2Called = false;

      TestInterceptor2.callback = () => {
        interceptor2Called = true;
      };

      for await (const _ of client.listenMany({ sentence: 'Test' })) {
        // Just consume the stream
      }

      expect(interceptor2Called).toBe(true);
    });
  });

  describe('TestInterceptor3 - Applied to ElizaService.say only', () => {
    it('should be called for unary RPC (say)', async () => {
      let interceptor3Called = false;

      TestInterceptor3.callback = () => {
        interceptor3Called = true;
      };

      await client.say({ sentence: 'Test' });

      expect(interceptor3Called).toBe(true);
    });

    it('should NOT be called for client streaming RPC (sayMany)', async () => {
      let interceptor3Called = false;

      TestInterceptor3.callback = () => {
        interceptor3Called = true;
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      expect(interceptor3Called).toBe(false);
    });

    it('should NOT be called for server streaming RPC (listenMany)', async () => {
      let interceptor3Called = false;

      TestInterceptor3.callback = () => {
        interceptor3Called = true;
      };

      for await (const _ of client.listenMany({ sentence: 'Test' })) {
        // Just consume the stream
      }

      expect(interceptor3Called).toBe(false);
    });
  });

  describe('Interceptor execution order', () => {
    it('should execute interceptors in order for unary RPC', async () => {
      const executionOrder: number[] = [];

      TestInterceptor1.callback = () => {
        executionOrder.push(1);
      };

      TestInterceptor2.callback = () => {
        executionOrder.push(2);
      };

      TestInterceptor3.callback = () => {
        executionOrder.push(3);
      };

      await client.say({ sentence: 'Test' });

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should execute only applicable interceptors for sayMany', async () => {
      const executionOrder: number[] = [];

      TestInterceptor1.callback = () => {
        executionOrder.push(1);
      };

      TestInterceptor2.callback = () => {
        executionOrder.push(2);
      };

      TestInterceptor3.callback = () => {
        executionOrder.push(3);
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      // Interceptor3 should not be called for sayMany
      expect(executionOrder).toEqual([1, 2]);
    });
  });

  describe('Interceptor can inspect request details', () => {
    it('should have access to request service', async () => {
      let serviceName: string | undefined;

      TestInterceptor1.callback = (req) => {
        serviceName = req.service.typeName;
      };

      await client.say({ sentence: 'Test' });

      expect(serviceName).toBe('connectrpc.eliza.v1.ElizaService');
    });

    it('should have access to request headers', async () => {
      let requestHeaders: any;

      TestInterceptor1.callback = (req) => {
        requestHeaders = req.header;
      };

      await client.say(
        { sentence: 'Test' },
        {
          headers: {
            'x-custom-header': 'custom-value',
          },
        },
      );

      expect(requestHeaders).toBeDefined();
      expect(requestHeaders.get('x-custom-header')).toBe('custom-value');
    });

    it('should have access to request method type', async () => {
      let methodKind: string | undefined;

      TestInterceptor1.callback = (req) => {
        methodKind = req.method.kind;
      };

      await client.say({ sentence: 'Test' });

      expect(methodKind).toBe('rpc');
    });

    it('should detect client streaming method kind', async () => {
      let methodKind: string | undefined;

      TestInterceptor1.callback = (req) => {
        methodKind = req.method.kind;
      };

      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Test' });
      }

      await client.sayMany(generateRequests());

      expect(methodKind).toBe('rpc');
    });

    it('should detect server streaming method kind', async () => {
      let methodKind: string | undefined;

      TestInterceptor1.callback = (req) => {
        methodKind = req.method.kind;
      };

      for await (const _ of client.listenMany({ sentence: 'Test' })) {
        // Just consume the stream
      }

      expect(methodKind).toBe('rpc');
    });
  });

  describe('Multiple interceptors interaction', () => {
    it('should allow all interceptors to inspect the same request', async () => {
      const requestMethods: string[] = [];

      TestInterceptor1.callback = (req) => {
        requestMethods.push(req.method.name);
      };

      TestInterceptor2.callback = (req) => {
        requestMethods.push(req.method.name);
      };

      TestInterceptor3.callback = (req) => {
        requestMethods.push(req.method.name);
      };

      await client.say({ sentence: 'Test' });

      expect(requestMethods).toEqual(['Say', 'Say', 'Say']);
    });

    it('should allow interceptors to modify request context', async () => {
      const customKey = createContextKey('');
      let interceptor2value = '';
      let interceptor3value = '';
      let controllerValue = '';

      TestInterceptor1.callback = (req) => {
        req.contextValues.set(customKey, 'interceptor1');
      };
      TestInterceptor2.callback = (req) => {
        interceptor2value = req.contextValues.get(customKey);
        req.contextValues.set(customKey, 'interceptor2');
      };
      TestInterceptor3.callback = (req) => {
        interceptor3value = req.contextValues.get(customKey);
        req.contextValues.set(customKey, 'interceptor3');
      };

      ElizaController.sayCallback = (_req, ctx) => {
        controllerValue = ctx.values.get(customKey);
      };

      await client.say({ sentence: 'Test' });

      expect(interceptor2value).toBe('interceptor1');
      expect(interceptor3value).toBe('interceptor2');
      expect(controllerValue).toBe('interceptor3');
    });
  });
});
