#!/bin/bash
# Quick start script for Colorgorical integration
# 
# This script is now DEPRECATED. Use the simpler command instead:
#
#   yarn dev
#
# This will start both the proxy and study server in one terminal.

echo "⚠️  This script is deprecated!"
echo ""
echo "Use the simpler command instead:"
echo ""
echo "  yarn dev"
echo ""
echo "This will start both servers in one terminal with nice colored output."
echo ""
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue with old method..."
sleep 5

echo ""
echo "🎨 Starting Colorgorical Integration Services"
echo "=============================================="
echo ""

# Check if Colorgorical server is running
echo "Checking if Colorgorical server is accessible..."
if curl -s http://localhost:8888 > /dev/null 2>&1; then
    echo "✓ Colorgorical server is running on port 8888"
else
    echo "✗ Colorgorical server is NOT running!"
    echo ""
    echo "Please start it first:"
    echo "  cd /path/to/colorgorical"
    echo "  python run.py --server --port 8888"
    echo ""
    exit 1
fi

echo ""
echo "Starting both servers..."
yarn dev

# Note: yarn dev uses concurrently, so Ctrl+C will kill both servers
