/**
 * Express MCP Handler
 * 
 * A utility for integrating Model Context Protocol (MCP) into Express applications
 * with both stateful and stateless modes.
 */

// Export the stateful handler
export { statefulHandlers } from './stateful.js';

// Export the stateless handler
export { statelessHandler } from './stateless.js';

// Export the SSE handler
export { sseHandlers } from './sse.js';

// Export types
export type {
  StatefulHandlerOptions,
  StatelessHandlerOptions,
  SSEHandlerOptions,
  ServerFactory
} from './types.js'; 