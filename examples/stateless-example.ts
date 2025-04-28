import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { statelessHandler } from '../src';

// Create Express app
const app = express();
app.use(express.json());

// Configure server factory function
const createServer = () => {
  const server = new McpServer({
    name: 'stateless-example-server',
    version: '1.0.0',
  });

  // Add a simple echo tool
  server.tool(
    'echo',
    { message: z.string() },
    async ({ message }) => ({ content: [{ type: 'text', text: `Echo: ${message}` }] })
  );

  return server;
};

// Configure the stateless handler
const handler = statelessHandler(createServer, {
  onClose: (req, res) => {
    console.log('Request completed and transport closed');
  },
  onError: (error) => {
    console.error('Error handling request:', error);
  }
});

// Mount the handler (stateless only needs POST)
app.post('/mcp', handler);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Stateless MCP server running on port ${PORT}`);
}); 