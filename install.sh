#!/usr/bin/env bash
# ===================================================================
#  Kythia SaaS v2.0 — Quick Install Script
# ===================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔═══════════════════════════════════╗"
echo "  ║     Kythia SaaS v2.0 Installer    ║"
echo "  ╚═══════════════════════════════════╝"
echo -e "${NC}"

# ── Node version check ──────────────────────────────────────────────
NODE_VERSION=$(node -v 2>/dev/null | cut -c 2- | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js 20+ is required. Got: $(node -v 2>/dev/null || echo 'not found')${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# ── Install bot dependencies ────────────────────────────────────────
echo ""
echo "📦 Installing bot dependencies..."
npm install

# ── Install dashboard dependencies ─────────────────────────────────
echo ""
echo "🎨 Installing dashboard dependencies..."
cd dashboard && npm install && cd ..

# ── Copy env template ───────────────────────────────────────────────
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env from template. Edit it before starting the bot!${NC}"
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Installation complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "  1. Edit .env with your Discord credentials"
echo "  2. npm start       — Start the bot"
echo "  3. cd dashboard && npm run dev — Start the dashboard"
echo ""
echo "  Deployment:"
echo "  • Railway: git push (auto-detected)"
echo "  • Vercel:  cd dashboard && vercel deploy"
echo "  • Docker:  docker build -t kythia . && docker run -d kythia"
echo "  • PM2:     pm2 start ecosystem.config.js"
echo ""
