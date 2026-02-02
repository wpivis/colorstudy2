#!/usr/bin/env node
/* eslint-disable */

// Quick test script for Colorgorical integration
// Run with: node test-colorgorical-integration.js

const http = require('http');

console.log('🧪 Testing Colorgorical Integration\n');
console.log('=' .repeat(50));

// Test 1: Check proxy health
function testProxyHealth() {
  return new Promise((resolve, reject) => {
    console.log('\n1️⃣  Testing proxy server health...');
    
    const req = http.get('http://localhost:3001/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Proxy server is healthy');
          console.log('   Response:', data);
          resolve(true);
        } else {
          console.log('   ❌ Proxy server returned error:', res.statusCode);
          reject(new Error('Health check failed'));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('   ❌ Cannot connect to proxy server');
      console.log('   Make sure to run: node colorgorical-proxy.js');
      reject(err);
    });
  });
}

// Test 2: Test alternative generation
function testAlternatives() {
  return new Promise((resolve, reject) => {
    console.log('\n2️⃣  Testing alternative color generation...');
    
    const postData = JSON.stringify({
      palette: ['#58b5e1', '#41d26b', '#996f31'],
      selectedIndex: 1,
      numCandidates: 9
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/color-alternatives',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          console.log('   ✅ Generated alternatives successfully');
          console.log(`   Original color: ${result.originalColor}`);
          console.log(`   Alternatives (${result.alternatives.length}):`);
          result.alternatives.forEach((color, i) => {
            console.log(`      ${i + 1}. ${color}`);
          });
          resolve(true);
        } else {
          console.log('   ❌ API returned error:', res.statusCode);
          console.log('   Response:', data);
          if (data.includes('Cannot connect to Colorgorical')) {
            console.log('\n   ⚠️  Colorgorical server is not running!');
            console.log('   Start it with: cd /path/to/colorgorical && python run.py --server --port 8888');
          }
          reject(new Error('API request failed'));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('   ❌ Request failed:', err.message);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runTests() {
  try {
    await testProxyHealth();
    await testAlternatives();
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ All tests passed! Integration is working correctly.\n');
    console.log('Next steps:');
    console.log('  1. Open http://localhost:8080/');
    console.log('  2. Select "color-palette-study"');
    console.log('  3. Click on any color');
    console.log('  4. Watch alternatives load from Colorgorical!\n');
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ Some tests failed. Check the errors above.\n');
    console.log('Make sure you have:');
    console.log('  1. Colorgorical running: python run.py --server --port 8888');
    console.log('  2. Proxy running: node colorgorical-proxy.js');
    console.log('  3. Study running: yarn serve\n');
    process.exit(1);
  }
}

runTests();
