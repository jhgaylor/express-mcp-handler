[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/jhgaylor-express-mcp-handler-badge.png)](https://mseep.ai/app/jhgaylor-express-mcp-handler)

# express-mcp-handler

A middleware for integrating [Model Context Protocol (MCP)](https://modelcontextprotocol.github.io) with Express applications, enabling seamless communication between LLMs and tools.

[![npm version](https://img.shields.io/npm/v/express-mcp-handler.svg)](https://www.npmjs.com/package/express-mcp-handler)
[![npm downloads](https://img.shields.io/npm/dm/express-mcp-handler.svg)](https://www.npmjs.com/package/express-mcp-handler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/express-mcp-handler.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/jhgaylor/express-mcp-handler/actions/workflows/ci.yml/badge.svg)](https://github.com/jhgaylor/express-mcp-handler/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jhgaylor/express-mcp-handler/branch/main/graph/badge.svg)](https://codecov.io/gh/jhgaylor/express-mcp-handler)

## What is Model Context Protocol (MCP)?

[Model Context Protocol (MCP)](https://modelcontextprotocol.github.io) is an open protocol for integrating large language models (LLMs) with external data sources and tools. It enables AI assistants to access real-time data, execute operations, and interact with various services through a standardized interface.

## Features

- **Stateful Handler**: Can handle one off requests or maintain long-lived sessions with session IDs and Server-Sent Events (SSE).
- **Stateless Handler**: Handles each request in complete isolation for simple, one-off interactions.
- **SSE Handler**: Handles Model Context Protocol (MCP) over Server-Sent Events (SSE) with dedicated GET and POST endpoints.
- **Type-Safe API**: Built with TypeScript for reliable integration.
- **Flexible Configuration**: Customizable error handling, session management, and lifecycle hooks.
- **Express Integration**: Plugs directly into Express routes with middleware pattern.

## Installation

Install via npm:

```bash
npm install express-mcp-handler
```

Or yarn:

```bash
yarn add express-mcp-handler
```

Or pnpm:

```bash
pnpm add express-mcp-handler
```

### Peer Dependencies

This package requires the following peer dependencies:

- `express` >= 4.0.0
- `@modelcontextprotocol/sdk` >= 1.10.2
- `zod` >= 3.0.0

Install them if you haven't already:

```bash
npm install express @modelcontextprotocol/sdk zod
```

## Quick Start

Here's a basic example to get you started:

```ts
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { statelessHandler } from 'express-mcp-handler';

const app = express();
app.use(express.json());

// Create a factory function that returns a new McpServer instance for each request
const serverFactory = () => new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
});

// Mount the stateless handler
app.post('/mcp', statelessHandler(serverFactory));

app.listen(3000, () => {
  console.log('Express MCP server running on port 3000');
});
```

## Usage

Express-mcp-handler provides three handler types to suit different use cases:

### Stateful Mode

Use `statefulHandler` to establish reusable sessions between client and server, ideal for maintaining context across multiple interactions:

```ts
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { statefulHandler } from 'express-mcp-handler';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(express.json());

// Create an MCP server instance
const server = new McpServer({
  name: 'my-server',
  version: '1.0.0',
});

// Configure handler options
const handlerOptions = {
  sessionIdGenerator: randomUUID, // Function to generate unique session IDs
  onSessionInitialized: (sessionId: string) => {
    console.log(`Session initialized: ${sessionId}`);
    // You could store session metadata or initialize resources here
  },
  onSessionClosed: (sessionId: string) => {
    console.log(`Session closed: ${sessionId}`);
    // Perform cleanup logic here
  },
  onError: (error: Error, sessionId?: string) => {
    console.error(`Error in session ${sessionId}:`, error);
    // Handle errors for monitoring or logging
  }
};

// Mount the handlers for different HTTP methods
app.post('/mcp', statefulHandler(server, handlerOptions));
app.get('/mcp', statefulHandler(server, handlerOptions));
app.delete('/mcp', statefulHandler(server, handlerOptions));

app.listen(3000, () => {
  console.log('Express MCP server running on port 3000');
});
```

The stateful handler:

- Initializes a new session on the first request (with no `mcp-session-id` header)
- Returns a `mcp-session-id` header that clients must include in subsequent requests
- Manages Server-Sent Events (SSE) to push messages from the server to the client
- Automatically cleans up sessions when closed

### Stateless Mode

Use `statelessHandler` for one-off request handling with no session management, perfect for serverless environments or simple requests:

```ts
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { statelessHandler } from 'express-mcp-handler';

const app = express();
app.use(express.json());

// Function that creates a fresh McpServer for each request
const serverFactory = () => new McpServer({
  name: 'stateless-mcp-server',
  version: '1.0.0',
});

// Configure with custom error handling
const options = {
  onError: (error: Error) => {
    console.error('MCP error:', error);
    // Add custom error reporting logic here
  }
};

app.post('/mcp', statelessHandler(serverFactory, options));

app.listen(3000, () => {
  console.log('Express Stateless MCP server running on port 3000');
});
```

Each stateless request:

- Creates a fresh transport and server instance
- Ensures complete isolation with no session tracking
- Is suitable for simple or serverless environments

### SSE Mode

Use `sseHandlers` to handle Model Context Protocol (MCP) over Server-Sent Events (SSE), ideal for real-time streaming responses:

```ts
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { sseHandlers } from 'express-mcp-handler';

const app = express();
app.use(express.json());

// Provide a factory function that returns a fresh McpServer for each SSE connection
const serverFactory = () => new McpServer({
  name: 'sse-mcp-server',
  version: '1.0.0',
});

// Configure SSE handlers
const handlers = sseHandlers(serverFactory, {
  onError: (error: Error, sessionId?: string) => {
    console.error(`[SSE][${sessionId || 'unknown'}]`, error);
  },
  onClose: (sessionId: string) => {
    console.log(`[SSE] transport closed: ${sessionId}`);
    // Clean up any session resources
  },
});

// Mount the SSE endpoints
app.get('/sse', handlers.getHandler);
app.post('/messages', handlers.postHandler);

app.listen(3002, () => {
  console.log('Express MCP SSE server running on port 3002');
});
```

SSE handlers provide:

- **GET /sse**: Establishes the SSE stream and returns a `mcp-session-id` header
- **POST /messages**: Sends MCP messages over the SSE transport using the `mcp-session-id` query parameter

## API Reference

### statefulHandler

```ts
function statefulHandler(
  server: McpServer,
  options: {
    sessionIdGenerator: () => string;
    onSessionInitialized?: (sessionId: string) => void;
    onSessionClosed?: (sessionId: string) => void;
    onError?: (error: Error, sessionId?: string) => void;
    onInvalidSession?: (req: express.Request) => void;
  }
): express.RequestHandler;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `server` | `McpServer` | Instance of `McpServer` to handle protocol logic |
| `options.sessionIdGenerator` | `() => string` | Function that returns a unique session ID |
| `options.onSessionInitialized` | `(sessionId: string) => void` | _(optional)_ Callback invoked with the new session ID |
| `options.onSessionClosed` | `(sessionId: string) => void` | _(optional)_ Callback invoked when a session is closed |
| `options.onError` | `(error: Error, sessionId?: string) => void` | _(optional)_ Callback invoked on errors |
| `options.onInvalidSession` | `(req: express.Request) => void` | _(optional)_ Callback invoked when an invalid session is accessed |

### statelessHandler

```ts
function statelessHandler(
  serverFactory: () => McpServer,
  options?: {
    sessionIdGenerator?: () => string;
    onClose?: (req: express.Request, res: express.Response) => void;
    onError?: (error: Error) => void;
  }
): express.RequestHandler;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `serverFactory` | `() => McpServer` | Function that returns a new server instance for each request |
| `options.sessionIdGenerator` | `() => string` | _(optional)_ Override transport session ID generation |
| `options.onClose` | `(req: express.Request, res: express.Response) => void` | _(optional)_ Callback fired when the request/response cycle ends |
| `options.onError` | `(error: Error) => void` | _(optional)_ Callback fired on errors during handling |

### sseHandlers

```ts
function sseHandlers(
  serverFactory: ServerFactory,
  options: SSEHandlerOptions
): {
  getHandler: express.RequestHandler;
  postHandler: express.RequestHandler;
};
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `serverFactory` | `ServerFactory` | Factory function that returns a fresh `McpServer` for each SSE connection |
| `options.onError` | `(error: Error, sessionId?: string) => void` | _(optional)_ Callback invoked on errors, receives `error` and optional `sessionId` |
| `options.onClose` | `(sessionId: string) => void` | _(optional)_ Callback invoked when an SSE session is closed, receives `sessionId` |

## Error Handling

All handler types support custom error handling through their options:

```ts
// Example of custom error handling for stateful handler
const handlerOptions = {
  // ... other options
  onError: (error: Error, sessionId?: string) => {
    console.error(`Error in session ${sessionId}:`, error);
    // Send error to monitoring service
    Sentry.captureException(error, {
      extra: { sessionId }
    });
  }
};
```

## TypeScript Support

This package is written in TypeScript and provides type definitions for all exports. When using TypeScript, you'll get full IntelliSense and type checking.

```ts
import { statefulHandler, StatefulHandlerOptions } from 'express-mcp-handler';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Type-safe options
const options: StatefulHandlerOptions = {
  sessionIdGenerator: () => Date.now().toString(),
  onError: (error, sessionId) => {
    // TypeScript knows the types of these parameters
    console.error(`Error in session ${sessionId}:`, error);
  }
};

const server = new McpServer({
  name: 'typed-server',
  version: '1.0.0',
});

// Type-safe handler
app.post('/mcp', statefulHandler(server, options));
```

## Development

To contribute to this project:

```bash
git clone https://github.com/jhgaylor/express-mcp-handler.git
cd express-mcp-handler
npm install
npm run build
npm test
```

### Test Coverage

The project has solid test coverage and promises to maintain it.

All changes are verified through our CI/CD pipeline using Jest for testing and Codecov for coverage reporting.

### Continuous Integration

This project uses GitHub Actions for continuous integration. Every push to the main branch and pull request will:

1. Run the lint check
2. Build the project
3. Run tests with coverage
4. Upload coverage reports to [Codecov](https://codecov.io/gh/jhgaylor/express-mcp-handler)

You can view the current CI status in the badge at the top of this README or on the [Actions tab](https://github.com/jhgaylor/express-mcp-handler/actions) of the GitHub repository.

## License

[MIT License](LICENSE)

## Publishing to npm

Log in to npm if you haven't already:
```bash
npm login
```

Publish the package to npm (will run your prepublishOnly build):
```bash
npm publish
```

To bump, tag, and push a new version:
```bash
npm version patch    # or minor, major
git push origin main --tags
```

## Handler Types at a Glance

| Handler          | Scenario                        | Sessions | Streaming |
|------------------|---------------------------------|----------|-----------|
| statelessHandler | One-off or serverless workloads | No       | No        |
| statefulHandler  | Multi-turn interactions         | Yes      | Yes       |
| sseHandlers      | Real-time SSE streaming         | Yes      | Yes       |

## Troubleshooting

**Missing `mcp-session-id` header**  
Ensure the client includes the `mcp-session-id` header returned on the initial request.

**Transport connection closed prematurely**  
Verify network connectivity and ensure the client properly handles SSE events.

## Changelog

All notable changes to this project are documented in the [CHANGELOG.md](CHANGELOG.md).