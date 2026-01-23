# Jest Test Suite for ConnectRPC NestJS Integration

This directory contains comprehensive Jest tests for the ConnectRPC Fastify/NestJS integration.

## Test Files

### 1. `controller.test.ts`
Tests the ElizaController implementation with real server and client connections.

**Test Coverage:**
- **Unary RPC (say method)**
  - Basic request/response functionality
  - Empty sentence handling
  - Special characters support
  - Large data handling (1000 character strings)

- **Client Streaming RPC (sayMany method)**
  - Multiple message collection
  - Single message handling
  - Empty stream handling
  - High-volume message processing (100 messages)

- **Server Streaming RPC (listenMany method)**
  - Word-by-word streaming
  - Single word handling
  - Empty input handling
  - Multi-word streaming

### 2. `middleware.test.ts`
Tests middleware registration and execution with different scoping configurations.

**Test Coverage:**
- **TestMiddleware1** - Applied to all services and methods
  - Validates execution for all RPC types (unary, client streaming, server streaming)
  - Verifies access to request objects

- **TestMiddleware2** - Applied to ElizaService only
  - Validates execution for all methods of the service
  
- **TestMiddleware3** - Applied to ElizaService.say only
  - Validates execution only for the `say` method
  - Ensures it's NOT called for other methods

- **Middleware Execution Order**
  - Verifies middlewares execute in correct order
  - Tests selective middleware application

- **Request Context Modification**
  - Tests middleware access to request headers and metadata

### 3. `interceptor.test.ts`
Tests interceptor registration and execution with different scoping configurations.

**Test Coverage:**
- **TestInterceptor1** - Applied to all services and methods
  - Validates execution for all RPC types
  - Verifies access to request method details

- **TestInterceptor2** - Applied to ElizaService only
  - Validates execution for all methods of the service

- **TestInterceptor3** - Applied to ElizaService.say only
  - Validates execution only for the `say` method
  - Ensures it's NOT called for other methods

- **Interceptor Execution Order**
  - Verifies interceptors execute in correct order
  - Tests selective interceptor application

- **Request Inspection**
  - Access to service information
  - Access to request headers
  - Access to method types and kinds
  - Multiple interceptor interactions

### 4. `test-helpers.ts`
Shared utilities for test setup and teardown.

**Utilities:**
- `setupTestServer(port?: number)` - Creates a test server with client
- `resetMiddlewareCallbacks()` - Resets middleware test callbacks
- `resetInterceptorCallbacks()` - Resets interceptor test callbacks

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test controller.test.ts
npm test middleware.test.ts
npm test interceptor.test.ts

# Run with watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Test Architecture

All tests use **real server and client instances**:
1. Each test suite creates a real NestJS application with Fastify adapter
2. A real ConnectRPC transport and client is created
3. Tests make actual RPC calls over HTTP
4. Server processes requests through actual middleware and interceptor chains
5. Full end-to-end testing of the ConnectRPC integration

## Key Features Tested

✅ **Unary RPCs** - Single request, single response  
✅ **Client Streaming RPCs** - Multiple requests, single response  
✅ **Server Streaming RPCs** - Single request, multiple responses  
✅ **Middleware Scoping** - Global, service-level, and method-level  
✅ **Interceptor Scoping** - Global, service-level, and method-level  
✅ **Execution Order** - Middleware and interceptor ordering  
✅ **Request Context** - Header access and metadata inspection  
✅ **Edge Cases** - Empty inputs, special characters, high volume  

## Test Statistics

- **Total Test Suites:** 3
- **Total Tests:** 43
- **All Passing:** ✓

## Notes

- Tests run in parallel with Jest's default settings
- Each test suite uses a separate server instance on a random port
- Cleanup is automatically performed after each test suite
- Middleware and interceptor callbacks are reset before each test to ensure isolation
