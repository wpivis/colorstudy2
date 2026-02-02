#!/bin/bash

# Test script for reVISit MCP Server

echo "🧪 Testing reVISit MCP Server..."
echo ""

# Build the server
echo "📦 Building server..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build successful!"
echo ""

# Test 1: Initialize
echo "🔧 Test 1: Server initialization..."
INIT_RESPONSE=$(echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}},"id":1}' | node build/index.js)
if echo "$INIT_RESPONSE" | grep -q '"serverInfo"'; then
    echo "✅ Server initialized successfully!"
else
    echo "❌ Server initialization failed!"
    echo "$INIT_RESPONSE"
    exit 1
fi
echo ""

# Test 2: Get version
echo "🔧 Test 2: Testing 'getversion' tool..."
VERSION_RESPONSE=$(echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"getversion","arguments":{}},"id":2}' | node build/index.js | tail -n 1)
if echo "$VERSION_RESPONSE" | grep -q "Revisit Framework Version"; then
    echo "✅ getversion tool working!"
    echo "$VERSION_RESPONSE" | grep -o '"text":"[^"]*"'
else
    echo "❌ getversion tool failed!"
    exit 1
fi
echo ""

# Test 3: Get citation
echo "🔧 Test 3: Testing 'getcitation' tool..."
CITATION_RESPONSE=$(echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"getcitation","arguments":{}},"id":2}' | node build/index.js | tail -n 1)
if echo "$CITATION_RESPONSE" | grep -q "@INPROCEEDINGS{revisit"; then
    echo "✅ getcitation tool working!"
else
    echo "❌ getcitation tool failed!"
    exit 1
fi
echo ""

# Test 4: Validate global config
echo "🔧 Test 4: Testing 'validateglobalconfig' tool..."
GLOBAL_CONFIG_RESPONSE=$(echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"validateglobalconfig","arguments":{}},"id":2}' | node build/index.js | tail -n 1)
if echo "$GLOBAL_CONFIG_RESPONSE" | grep -q "result"; then
    echo "✅ validateglobalconfig tool executed!"
    if echo "$GLOBAL_CONFIG_RESPONSE" | grep -q "valid"; then
        echo "   ✓ Global config validation result received"
    fi
else
    echo "❌ validateglobalconfig tool failed!"
    exit 1
fi
echo ""

# Test 5: Get study template metadata
echo "🔧 Test 5: Testing 'getstudytemplatemetadata' tool..."
TEMPLATE_RESPONSE=$(echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"getstudytemplatemetadata","arguments":{}},"id":2}' | node build/index.js | tail -n 1)
if echo "$TEMPLATE_RESPONSE" | grep -q "templates"; then
    echo "✅ getstudytemplatemetadata tool working!"
    TEMPLATE_COUNT=$(echo "$TEMPLATE_RESPONSE" | grep -o '"path"' | wc -l)
    echo "   ✓ Found $TEMPLATE_COUNT study templates"
else
    echo "❌ getstudytemplatemetadata tool failed!"
    exit 1
fi
echo ""

echo "🎉 All tests passed! The reVISit MCP Server is working correctly."
echo ""
echo "📝 Available tools:"
echo "   • getversion - Get Revisit framework version"
echo "   • getcitation - Get BibTeX citation"
echo "   • getconfigschema - Get config schema path"
echo "   • gettypes - Get types definition path"
echo "   • getstudytemplatemetadata - Get all study template metadata"
echo "   • generatestudyprompt - Generate enhanced study prompts"
echo "   • validateglobalconfig - Validate global.json"
echo "   • validatestudyconfig - Validate study config files"
