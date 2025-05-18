import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { sseHandlers } from '../src/index.js';

// Create Express app
const app = express();
app.use(express.json());

function serverFactory() {
  const server = new McpServer({
    name: 'sse-example-server',
    version: '1.0.0',
  });

  // Add a simple echo tool
  server.tool(
    'echo',
    { message: z.string() },
    async ({ message }) => ({ content: [{ type: 'text', text: `Echo: ${message}` }] })
  );

  return server;
}

// Configure the SSE handlers
const handlers = sseHandlers(serverFactory, {
  onError: (error: Error, sessionId?: string) => {
    console.error(`[SSE][${sessionId || 'unknown'}]`, error);
  },
  onClose: (sessionId: string) => {
    console.log(`[SSE] transport closed: ${sessionId}`);
  }
});

// Mount the handlers
app.get('/sse', handlers.getHandler);
app.post('/messages', handlers.postHandler);

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`SSE MCP server running on port ${PORT}`);
  console.log(`- MCP Stream endpoint: http://localhost:${PORT}/sse`);
  console.log(`- MCP Messages endpoint: http://localhost:${PORT}/messages`);
}); 