import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { statefulHandlers, statelessHandler, sseHandlers } from '../src';

// Create Express app
const app = express();
app.use(express.json());

function serverFactory(): McpServer {
  const server = new McpServer({
    name: 'my-server',
    version: '1.0.0',
  });
  
  // Add a tool to the stateful server
  server.tool(
    'greet',
    { name: z.string() },
    async ({ name }) => ({ content: [{ type: 'text', text: `Hello, ${name}! (from stateful server)` }] })
  );

  return server;
}

// Create stateful handler with session management
const statefulMcpHandlers = statefulHandlers(serverFactory, {
  sessionIdGenerator: () => randomUUID(),
  onSessionInitialized: (sessionId: string) => {
    console.log(`Stateful session initialized: ${sessionId}`);
  },
  onSessionClosed: (sessionId: string) => {
    console.log(`Stateful session closed: ${sessionId}`);
  }
});

// Create stateless handler
const statelessMcpHandler = statelessHandler(serverFactory);

// Create SSE handler
const sseMcpHandlers = sseHandlers(serverFactory, {
  onError: (error: Error, sessionId?: string) => {
    console.error(`[SSE][${sessionId || 'unknown'}]`, error);
  },
  onClose: (sessionId: string) => {
    console.log(`SSE transport closed: ${sessionId}`);
  }
});

// Mount handlers on different routes
app.post('/mcp/stateful', statefulMcpHandlers.postHandler);
app.get('/mcp/stateful', statefulMcpHandlers.getHandler);
app.delete('/mcp/stateful', statefulMcpHandlers.deleteHandler);

app.post('/mcp/messages', sseMcpHandlers.postHandler);
app.get('/mcp/sse', sseMcpHandlers.getHandler);

app.post('/mcp/stateless', statelessMcpHandler);

// Add a health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Combined Server running on port ${PORT}`);
  console.log(`- Stateful endpoint: http://localhost:${PORT}/mcp/stateful`);
  console.log(`- Stateless endpoint: http://localhost:${PORT}/mcp/stateless`);
}); 