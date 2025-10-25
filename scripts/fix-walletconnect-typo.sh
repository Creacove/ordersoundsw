#!/bin/bash

# Fix WalletConnect heartbeat typo
# This script fixes the toMiliseconds -> toMilliseconds typo in @walletconnect/heartbeat

echo "🔧 Fixing WalletConnect heartbeat typo..."

# Path to the problematic file
FILE="node_modules/@walletconnect/heartbeat/dist/index.es.js"

if [ ! -f "$FILE" ]; then
    echo "❌ Error: $FILE not found. Make sure node_modules is installed."
    exit 1
fi

# Fix the typo: toMiliseconds -> toMilliseconds
sed -i.bak 's/toMiliseconds/toMilliseconds/g' "$FILE"

echo "✅ Typo fixed in $FILE"

# Create the patch
echo "📦 Creating patch file..."
npx patch-package @walletconnect/heartbeat

echo "✅ Patch created successfully!"
echo ""
echo "⚠️  IMPORTANT: Add this to your package.json scripts section:"
echo '  "postinstall": "patch-package"'
echo ""
echo "This ensures the patch is applied after every npm install."
