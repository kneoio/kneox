#!/bin/bash

if [ "$EUID" -eq 0 ]; then
  echo "❌ Please run this script as the 'kneox' user, not root."
  exit 1
fi

sudo apt update
echo "🔧 Installing required packages..."
sudo apt install -y coreutils git nodejs npm

echo "🛑 Stopping Keycloak, PostgreSQL, and Express..."
sudo systemctl stop keycloak
sudo systemctl stop postgresql
sudo systemctl stop kneox

REPO_DIR_FE="/home/kneox/fe_server"
if [ -d "$REPO_DIR_FE" ]; then
  echo "🔄 Updating Kneox frontend project from GitHub..."
  git -C $REPO_DIR_FE pull origin master
else
  echo "📥 Cloning Kneox frontend project from GitHub..."
  git clone https://github.com/kneoio/kneox.git $REPO_DIR_FE
fi

sudo chown -R kneox:kneox $REPO_DIR_FE

echo "📄 Copying .env.production file to frontend project directory..."
cp /home/kneox/.env $REPO_DIR_FE/.env.production

echo "📦 Installing frontend dependencies..."
cd $REPO_DIR_FE && npm install
echo "⚙️  Building the frontend project..."
NODE_OPTIONS="--max_old_space_size=512" npm run build

echo "🚀 Restarting Keycloak, PostgreSQL, and Express..."
sudo systemctl start postgresql
sudo systemctl start keycloak
sudo systemctl restart kneox

echo "✅ Complete ..."
