import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { statefulHandlers } from '../src';

// Create Express app
const app = express();
app.use(express.json());

function serverFactory() {
  const server = new McpServer({
    name: 'stateful-example-server',
    version: '1.0.0',
  });

  server.tool(
    'echo',
    { message: z.string() },
    async ({ message }) => ({ content: [{ type: 'text', text: `Echo: ${message}` }] })
  );

  return server;
}

// Configure the stateful handler
const handlers = statefulHandlers(serverFactory, {
  sessionIdGenerator: () => randomUUID(),
  onSessionInitialized: (sessionId: string) => {
    console.log(`Session initialized: ${sessionId}`);
  },
  onSessionClosed: (sessionId: string) => {
    console.log(`Session closed: ${sessionId}`);
  },
  onInvalidSession: (req: express.Request) => {
    console.log('Invalid or missing session ID', req.headers);
  },
  onError: (error: Error, sessionId: string | undefined) => {
    console.error(`Error in session ${sessionId || 'unknown'}:`, error);
  }
});

// Mount the handler on multiple HTTP methods
app.post('/mcp', handlers.postHandler);
app.get('/mcp', handlers.getHandler);
app.delete('/mcp', handlers.deleteHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stateful MCP server running on port ${PORT}`);
}); 