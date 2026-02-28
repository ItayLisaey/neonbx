#!/usr/bin/env bash
set -euo pipefail

VERSION="v$(node -p "require('./package.json').version")"

git add package.json pnpm-lock.yaml
git commit -m "release: $VERSION"
git tag "$VERSION"

echo ""
echo "Released $VERSION"
echo "Run the following to publish:"
echo ""
echo "  git push && git push --tags && npm publish"
