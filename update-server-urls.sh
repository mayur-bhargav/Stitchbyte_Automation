#!/bin/bash

# Script to replace all hardcoded server URLs with SERVER_URI import
# Run this from the Stitchbyte_Automation directory

echo "🔧 Replacing hardcoded server URLs with SERVER_URI..."

# Files to update
files=(
  "src/app/campaigns/page.tsx"
  "src/app/templates/create/page.tsx"
  "src/app/hooks/useRealTimeChat.ts"
  "src/app/logs/page.tsx"
  "src/app/workflows/page.tsx"
  "src/app/status/page.tsx"
  "src/app/triggers/CreateTriggerModal.tsx"
)

# Replace the URLs
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Replace https://automationwhats.stitchbyte.in with ${SERVER_URI}
    sed -i '' 's|"https://automationwhats\.stitchbyte\.in/|`${SERVER_URI}/|g' "$file"
    sed -i '' "s|'https://automationwhats\.stitchbyte\.in/|\`\${SERVER_URI}/|g" "$file"
    
    echo "  ✅ Updated $file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Replacement complete!"
echo ""
echo "⚠️  IMPORTANT: You need to manually add this import to each updated file:"
echo "import { SERVER_URI } from '@/config/server';"
echo ""
echo "Files that need the import:"
for file in "${files[@]}"; do
  echo "  - $file"
done
