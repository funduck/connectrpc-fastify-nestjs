import { create } from '@bufbuild/protobuf';
import { Client } from '@connectrpc/connect';
import {
  ElizaService,
  SayRequestSchema,
} from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import { setupTestServer } from './test-helpers';

describe('ElizaController', () => {
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

  describe('say - Unary RPC', () => {
    it('should return response with echoed sentence', async () => {
      const sentence = 'Hello ConnectRPC!';

      const response = await client.say(
        { sentence },
        {
          headers: {
            'x-test-id': 'unary-test-001',
          },
        },
      );

      expect(response.sentence).toBe(`You said: ${sentence}`);
    });

    it('should handle empty sentence', async () => {
      const response = await client.say({ sentence: '' });

      expect(response.sentence).toBe('You said: ');
    });

    it('should handle special characters', async () => {
      const sentence = 'Hello! @#$%^&*() 你好';

      const response = await client.say({ sentence });

      expect(response.sentence).toBe(`You said: ${sentence}`);
    });

    it('should handle long sentences', async () => {
      const sentence = 'a'.repeat(1000);

      const response = await client.say({ sentence });

      expect(response.sentence).toBe(`You said: ${sentence}`);
    });
  });

  describe('sayMany - Client Streaming RPC', () => {
    it('should collect and respond to multiple messages', async () => {
      const sentences = ['First message', 'Second message', 'Third message'];

      async function* generateRequests() {
        for (const sentence of sentences) {
          yield create(SayRequestSchema, { sentence });
        }
      }

      const response = await client.sayMany(generateRequests(), {
        headers: {
          'x-test-id': 'client-streaming-test-001',
        },
      });

      expect(response.responses).toHaveLength(sentences.length);
      response.responses.forEach((resp, idx) => {
        expect(resp.sentence).toBe(`You said: ${sentences[idx]}`);
      });
    });

    it('should handle single message', async () => {
      async function* generateRequests() {
        yield create(SayRequestSchema, { sentence: 'Single message' });
      }

      const response = await client.sayMany(generateRequests());

      expect(response.responses).toHaveLength(1);
      expect(response.responses[0].sentence).toBe('You said: Single message');
    });

    it('should handle empty stream', async () => {
      async function* generateRequests() {
        // Empty generator
      }

      const response = await client.sayMany(generateRequests());

      expect(response.responses).toHaveLength(0);
    });

    it('should handle many messages', async () => {
      const count = 100;

      async function* generateRequests() {
        for (let i = 0; i < count; i++) {
          yield create(SayRequestSchema, { sentence: `Message ${i}` });
        }
      }

      const response = await client.sayMany(generateRequests());

      expect(response.responses).toHaveLength(count);
      response.responses.forEach((resp, idx) => {
        expect(resp.sentence).toBe(`You said: Message ${idx}`);
      });
    });
  });

  describe('listenMany - Server Streaming RPC', () => {
    it('should stream responses for each word', async () => {
      const sentence = 'Hello Streaming World';
      const words = sentence.split(' ');
      const responses: string[] = [];

      for await (const response of client.listenMany(
        { sentence },
        {
          headers: {
            'x-test-id': 'server-streaming-test-001',
          },
        },
      )) {
        responses.push(response.sentence);
      }

      expect(responses).toHaveLength(words.length);
      words.forEach((word, idx) => {
        expect(responses[idx]).toBe(`Echo: ${word}`);
      });
    });

    it('should handle single word', async () => {
      const sentence = 'Hello';
      const responses: string[] = [];

      for await (const response of client.listenMany({ sentence })) {
        responses.push(response.sentence);
      }

      expect(responses).toHaveLength(1);
      expect(responses[0]).toBe('Echo: Hello');
    });

    it('should handle empty sentence', async () => {
      const sentence = '';
      const responses: string[] = [];

      for await (const response of client.listenMany({ sentence })) {
        responses.push(response.sentence);
      }

      expect(responses).toHaveLength(1);
      expect(responses[0]).toBe('Echo: ');
    });

    it('should stream multiple words', async () => {
      const words = ['one', 'two', 'three', 'four', 'five'];
      const sentence = words.join(' ');
      const responses: string[] = [];

      for await (const response of client.listenMany({ sentence })) {
        responses.push(response.sentence);
      }

      expect(responses).toHaveLength(words.length);
      words.forEach((word, idx) => {
        expect(responses[idx]).toBe(`Echo: ${word}`);
      });
    });
  });
});
