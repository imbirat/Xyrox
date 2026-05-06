#!/bin/bash

# Xyrox Bot Installation Script
echo "🤖 Xyrox Bot Installation Script"
echo "================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null)

if [ -z "$NODE_VERSION" ]; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js v18 or higher from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Install bot dependencies
echo "📦 Installing bot dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install bot dependencies"
    exit 1
fi

echo "✅ Bot dependencies installed"
echo ""

# Install dashboard dependencies
echo "📦 Installing dashboard dependencies..."
cd dashboard
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dashboard dependencies"
    exit 1
fi

cd ..
echo "✅ Dashboard dependencies installed"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your bot token and other credentials"
    echo "   - BOT_TOKEN"
    echo "   - CLIENT_ID"
    echo "   - CLIENT_SECRET"
    echo "   - MONGODB_URI"
    echo ""
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Start MongoDB (if using local)"
echo "3. Deploy commands: npm run deploy"
echo "4. Start bot: npm run dev"
echo "5. Start dashboard: npm run dashboard"
echo ""
echo "📚 See QUICK_START.md for detailed setup instructions"
echo ""
