import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import {
  ElizaService,
  SayRequestSchema,
} from './gen/connectrpc/eliza/v1/eliza_pb';
import {
  TestInterceptor1,
  TestInterceptor2,
  TestInterceptor3,
} from './interceptors';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from './middlewares';
import { bootstrap } from './server';

const transport = createConnectTransport({
  baseUrl: 'http://localhost:3000',
  httpVersion: '1.1',
});

export const client = createClient(ElizaService, transport);

const mockAuthorizationToken = 'Bearer mock-token-123';

let testMiddlewareCalled = {
  1: false,
  2: false,
  3: false,
};
function prepareMiddlewares() {
  testMiddlewareCalled[1] = false;
  testMiddlewareCalled[2] = false;
  testMiddlewareCalled[3] = false;

  TestMiddleware1.callback = (req, res) => {
    console.log(`Middleware 1 called for request: ${req.url}`);
    testMiddlewareCalled[1] = true;
  };
  TestMiddleware2.callback = (req, res) => {
    console.log(`Middleware 2 called for request: ${req.url}`);
    testMiddlewareCalled[2] = true;
  };
  TestMiddleware3.callback = (req, res) => {
    console.log(`Middleware 3 called for request: ${req.url}`);
    testMiddlewareCalled[3] = true;
  };
}

let testInterceptorCalled = {
  1: false,
  2: false,
  3: false,
};
function prepareInterceptors() {
  testInterceptorCalled[1] = false;
  testInterceptorCalled[2] = false;
  testInterceptorCalled[3] = false;
  TestInterceptor1.callback = (req) => {
    console.log(`Interceptor 1 called for request`);
    testInterceptorCalled[1] = true;
  };
  TestInterceptor2.callback = (req) => {
    console.log(`Interceptor 2 called for request`);
    testInterceptorCalled[2] = true;
  };
  TestInterceptor3.callback = (req) => {
    console.log(`Interceptor 3 called for request`);
    testInterceptorCalled[3] = true;
  };
}

async function testUnary() {
  console.log('\n=== Testing Unary RPC: Say ===');
  const sentence = 'Hello ConnectRPC!';
  console.log(`Request: "${sentence}"`);

  try {
    prepareMiddlewares();
    prepareInterceptors();

    const response = await client.say(
      { sentence },
      {
        headers: {
          Authorization: mockAuthorizationToken,
          'x-request-id': 'unary-test-001',
        },
      },
    );
    console.log(`Response: "${response.sentence}"`);

    // Check that all middlewares were called
    if (
      !testMiddlewareCalled[1] ||
      !testMiddlewareCalled[2] ||
      !testMiddlewareCalled[3]
    ) {
      throw new Error(
        `Not all middlewares were called: ${JSON.stringify(
          testMiddlewareCalled,
        )}`,
      );
    }

    // Check that all interceptors were called
    if (
      !testInterceptorCalled[1] ||
      !testInterceptorCalled[2] ||
      !testInterceptorCalled[3]
    ) {
      throw new Error(
        `Not all interceptors were called: ${JSON.stringify(
          testInterceptorCalled,
        )}`,
      );
    }

    console.log('✅ Unary RPC test passed\n');
    return true;
  } catch (error) {
    console.error('❌ Error calling Say:', error);
    return false;
  }
}

async function testClientStreaming() {
  console.log('=== Testing Client Streaming RPC: SayMany ===');
  const sentences = ['First message', 'Second message', 'Third message'];
  console.log('Sending multiple requests:', sentences);

  try {
    prepareMiddlewares();
    prepareInterceptors();

    // Create an async generator to send multiple requests
    async function* generateRequests() {
      for (const sentence of sentences) {
        console.log(`  Sending: "${sentence}"`);
        yield create(SayRequestSchema, { sentence });
      }
    }

    const response = await client.sayMany(generateRequests(), {
      headers: {
        Authorization: mockAuthorizationToken,
        'x-request-id': 'client-streaming-test-001',
      },
    });
    console.log(`Received ${response.responses.length} responses:`);
    response.responses.forEach((resp, idx) => {
      console.log(`  [${idx + 1}] ${resp.sentence}`);
    });

    // Check that all middlewares were called
    if (!testMiddlewareCalled[1] || !testMiddlewareCalled[2]) {
      throw new Error(
        `Not all middlewares were called: ${JSON.stringify(
          testMiddlewareCalled,
        )}`,
      );
    }
    if (testMiddlewareCalled[3]) {
      throw new Error(
        `Middleware 3 should not have been called for SayMany: ${JSON.stringify(
          testMiddlewareCalled,
        )}`,
      );
    }
    // Check that all interceptors were called
    if (!testInterceptorCalled[1] || !testInterceptorCalled[2]) {
      throw new Error(
        `Not all interceptors were called: ${JSON.stringify(
          testInterceptorCalled,
        )}`,
      );
    }
    if (testInterceptorCalled[3]) {
      throw new Error(
        `Interceptor 3 should not have been called for SayMany: ${JSON.stringify(
          testInterceptorCalled,
        )}`,
      );
    }

    console.log('✅ Client Streaming RPC test passed\n');
    return true;
  } catch (error) {
    console.error('❌ Error calling SayMany:', error);
    return false;
  }
}

async function testServerStreaming() {
  console.log('=== Testing Server Streaming RPC: ListenMany ===');
  const sentence = 'Hello Streaming World';
  console.log(`Request: "${sentence}"`);
  console.log('Receiving streamed responses:');

  try {
    prepareMiddlewares();
    prepareInterceptors();

    let count = 0;
    for await (const response of client.listenMany(
      { sentence },
      {
        headers: {
          Authorization: mockAuthorizationToken,
          'x-request-id': 'server-streaming-test-001',
        },
      },
    )) {
      count++;
      console.log(`  [${count}] ${response.sentence}`);
    }

    // Check that all middlewares were called
    if (!testMiddlewareCalled[1] || !testMiddlewareCalled[2]) {
      throw new Error(
        `Not all middlewares were called: ${JSON.stringify(
          testMiddlewareCalled,
        )}`,
      );
    }
    if (testMiddlewareCalled[3]) {
      throw new Error(
        `Middleware 3 should not have been called for SayMany: ${JSON.stringify(
          testMiddlewareCalled,
        )}`,
      );
    }
    // Check that all interceptors were called
    if (!testInterceptorCalled[1] || !testInterceptorCalled[2]) {
      throw new Error(
        `Not all interceptors were called: ${JSON.stringify(
          testInterceptorCalled,
        )}`,
      );
    }
    if (testInterceptorCalled[3]) {
      throw new Error(
        `Interceptor 3 should not have been called for SayMany: ${JSON.stringify(
          testInterceptorCalled,
        )}`,
      );
    }

    console.log(
      `✅ Server Streaming RPC test passed (received ${count} responses)\n`,
    );
    return true;
  } catch (error) {
    console.error('❌ Error calling ListenMany:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting ConnectRPC Tests\n');

  // Bootstrap the server
  await bootstrap();

  // Give the server a moment to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Run all tests
  const results = [
    await testUnary(),
    await testClientStreaming(),
    await testServerStreaming(),
  ];

  // Check results
  const allPassed = results.every((result) => result === true);

  if (allPassed) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runAllTests();
