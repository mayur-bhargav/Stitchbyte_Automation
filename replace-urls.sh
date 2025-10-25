#!/bin/bash

# Script to replace hardcoded localhost:8000 URLs with getApiBaseUrl()
# This will update all TypeScript and TSX files in the src directory

echo "🔧 Replacing hardcoded localhost URLs with dynamic API base URL..."

# Find all TypeScript and TSX files and replace the hardcoded URLs
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|'http://localhost:8000/|\`\${getApiBaseUrl()}/|g" \
  -e 's|"http://localhost:8000/|`${getApiBaseUrl()}/|g' \
  {} \;

echo "✅ Replacement complete!"
echo ""
echo "⚠️  Note: You may need to add the import statement to files that don't have it yet:"
echo "import { getApiBaseUrl } from '../config/backend';"
echo ""
echo "Run this command to find files that need the import:"
echo "grep -r 'getApiBaseUrl()' src --include='*.ts' --include='*.tsx' | cut -d: -f1 | sort -u | while read f; do grep -q 'getApiBaseUrl' \"\$f\" || echo \"\$f\"; done"
