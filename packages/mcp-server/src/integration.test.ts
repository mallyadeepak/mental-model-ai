/**
 * Integration tests for MCP server protocol compliance
 * Run with: npx tsx src/integration.test.ts
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    failed++;
  }
}

async function sendRequest(
  server: ChildProcess,
  request: object
): Promise<object> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, 5000);

    const handler = (data: Buffer) => {
      clearTimeout(timeout);
      server.stdout?.off('data', handler);
      try {
        const response = JSON.parse(data.toString());
        resolve(response);
      } catch {
        reject(new Error(`Invalid JSON: ${data.toString()}`));
      }
    };

    server.stdout?.on('data', handler);
    server.stdin?.write(JSON.stringify(request) + '\n');
  });
}

async function runTests() {
  console.log('\n=== MCP Server Integration Tests ===\n');

  const serverPath = join(import.meta.dirname, '..', 'dist', 'index.js');

  // Start the server
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // Test 1: Initialize
    console.log('--- Protocol tests ---');
    const initResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      },
    })) as { result?: { serverInfo?: { name: string } } };

    assert(
      initResponse?.result?.serverInfo?.name === 'mental-model-ai',
      'Server should return correct name on initialize'
    );

    // Test 2: List tools
    const toolsResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    })) as { result?: { tools: Array<{ name: string }> } };

    const tools = toolsResponse?.result?.tools || [];
    assert(tools.length === 5, `Should have 5 tools (got ${tools.length})`);

    const toolNames = tools.map((t) => t.name);
    assert(
      toolNames.includes('explain_concept'),
      'Should have explain_concept tool'
    );
    assert(toolNames.includes('explain_code'), 'Should have explain_code tool');
    assert(toolNames.includes('explain_file'), 'Should have explain_file tool');
    assert(
      toolNames.includes('explain_relationship'),
      'Should have explain_relationship tool'
    );
    assert(
      toolNames.includes('format_mental_model'),
      'Should have format_mental_model tool'
    );

    // Test 3: Call explain_concept tool
    console.log('\n--- Tool call tests ---');
    const conceptResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'explain_concept',
        arguments: { concept: 'recursion', depth: 2 },
      },
    })) as { result?: { content: Array<{ text: string }> } };

    const conceptText = conceptResponse?.result?.content?.[0]?.text || '';
    assert(
      conceptText.includes('recursion'),
      'explain_concept should include concept name'
    );
    assert(
      conceptText.includes('6-10 nodes'),
      'explain_concept should calculate nodes for depth 2'
    );

    // Test 4: Call explain_code tool
    const codeResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'explain_code',
        arguments: {
          code: 'function add(a, b) { return a + b; }',
          language: 'javascript',
          focus: 'logic',
        },
      },
    })) as { result?: { content: Array<{ text: string }> } };

    const codeText = codeResponse?.result?.content?.[0]?.text || '';
    assert(
      codeText.includes('javascript'),
      'explain_code should include language'
    );
    assert(
      codeText.includes('control flow'),
      'explain_code should include focus instructions'
    );

    // Test 5: Call explain_file tool
    const fileResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'explain_file',
        arguments: {
          filePath: '/src/utils.ts',
          fileContent: 'export const helper = () => {};',
          projectContext: 'A utility library',
        },
      },
    })) as { result?: { content: Array<{ text: string }> } };

    const fileText = fileResponse?.result?.content?.[0]?.text || '';
    assert(
      fileText.includes('/src/utils.ts'),
      'explain_file should include file path'
    );
    assert(
      fileText.includes('A utility library'),
      'explain_file should include project context'
    );

    // Test 6: Call explain_relationship tool
    const relResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'explain_relationship',
        arguments: {
          components: ['UserService', 'AuthService'],
          question: 'How do they interact?',
        },
      },
    })) as { result?: { content: Array<{ text: string }> } };

    const relText = relResponse?.result?.content?.[0]?.text || '';
    assert(
      relText.includes('UserService, AuthService'),
      'explain_relationship should include components'
    );
    assert(
      relText.includes('How do they interact?'),
      'explain_relationship should include question'
    );

    // Test 7: Call format_mental_model tool (will fail due to no git repo, but should not crash)
    const sampleModel = JSON.stringify({
      title: 'Test Model',
      summary: 'A test mental model',
      diagramType: 'mindmap',
      nodes: [
        {
          id: 'n1',
          label: 'Root',
          description: 'Root node',
          depth: 0,
          nodeType: 'concept',
        },
      ],
      edges: [],
      analogies: [],
    });

    const commitResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'format_mental_model',
        arguments: {
          content: sampleModel,
          filename: 'test-model',
        },
      },
    })) as { result?: { content: Array<{ text: string }>; isError?: boolean } };

    const commitText = commitResponse?.result?.content?.[0]?.text || '';
    // The tool should return preview content (default is save=false)
    assert(
      commitText.includes('Preview') ||
        commitText.includes('Failed to format'),
      'format_mental_model should return preview or error'
    );

    // Test 8: Unknown tool should return error
    const unknownResponse = (await sendRequest(server, {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'unknown_tool',
        arguments: {},
      },
    })) as { result?: { content: Array<{ text: string }>; isError?: boolean } };

    assert(
      unknownResponse?.result?.isError === true,
      'Unknown tool should return error'
    );
  } catch (error) {
    console.error('Test error:', error);
    failed++;
  } finally {
    server.kill();
  }

  // Summary
  console.log('\n=== Integration Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
