import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_URI = 'ui://next-reply/chips.html';
const DEFAULT_HTML_PATH = path.join(__dirname, 'ui', 'dist', 'chips.html');

function readAppHtml() {
  const htmlPath = process.env.NEXT_REPLY_APP_HTML || DEFAULT_HTML_PATH;
  return fs.readFileSync(htmlPath, 'utf8');
}

const server = new Server(
  {
    name: 'next-reply-suggestions',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'suggest_replies',
      description:
        'Render an inline row of clickable next-reply suggestion chips at the end of a turn. Clicking a chip sends that text directly as the user\'s next message.',
      inputSchema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            description:
              '2 to 3 concise, first-person next-turn replies the user is most likely to send next.',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 4,
          },
          hint: {
            type: 'string',
            description:
              'Optional short header label above the chips (defaults to "猜你下一步想说").',
          },
        },
        required: ['suggestions'],
      },
      _meta: {
        ui: {
          resourceUri: APP_URI,
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'suggest_replies') {
    return {
      isError: true,
      content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
    };
  }

  const rawArgs = request.params.arguments ?? {};
  const rawList = Array.isArray(rawArgs.suggestions) ? rawArgs.suggestions : [];
  const suggestions = rawList
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, 4);

  const hint =
    typeof rawArgs.hint === 'string' && rawArgs.hint.trim().length > 0
      ? rawArgs.hint.trim()
      : '猜你下一步想说';

  if (suggestions.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'suggestions must contain at least one non-empty string.' }],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `已展示 ${suggestions.length} 条快捷回复建议。`,
      },
    ],
    structuredContent: {
      hint,
      suggestions,
    },
  };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: APP_URI,
      name: 'Next Reply Suggestions UI',
      description: 'Interactive inline suggestion chips for one-click follow-up replies.',
      mimeType: 'text/html;profile=mcp-app',
      _meta: {
        ui: {
          prefersBorder: false,
        },
      },
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri !== APP_URI) {
    throw new Error(`Resource not found: ${request.params.uri}`);
  }

  return {
    contents: [
      {
        uri: APP_URI,
        mimeType: 'text/html;profile=mcp-app',
        text: readAppHtml(),
        _meta: {
          ui: {
            prefersBorder: false,
          },
        },
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
