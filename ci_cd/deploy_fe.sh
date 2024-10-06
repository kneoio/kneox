#!/bin/bash

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

# Update and install core utilities
echo "Updating package list and installing core utilities..."
apt update && apt install -y coreutils git nodejs npm

# Clone/update the Keypractica frontend project
REPO_DIR_FE="/home/keypractica/fe_server"
if [ -d "$REPO_DIR_FE" ]; then
  echo "Updating Keypractica frontend project from GitHub..."
  git -C $REPO_DIR_FE pull origin master
else
  echo "Cloning Keypractica frontend project from GitHub..."
  git clone https://github.com/kneoio/kneox.git $REPO_DIR_FE
fi

# Copy environment variables file to frontend project directory
echo "Copying environment variables file to frontend project directory..."
cp ci_cd/.env.production $REPO_DIR_FE/.env.production

# Install frontend dependencies and build the project
echo "Installing frontend dependencies..."
cd $REPO_DIR_FE && npm install

echo "Building the frontend project..."
npm run build

# Parse command line options
RUN_AS_DAEMON=false
while getopts "d" opt; do
  case $opt in
    d)
      RUN_AS_DAEMON=true
      ;;
    *)
      echo "Usage: $0 [-d]"
      exit 1
      ;;
  esac
done

# Start the Express server
echo "Starting the Express server..."
if [ "$RUN_AS_DAEMON" = true ]; then
  # Create systemd service file
  SERVICE_FILE="/etc/systemd/system/keypractica-express.service"
  echo "Creating systemd service for Keypractica Express..."
  cat << EOF > $SERVICE_FILE
[Unit]
Description=Keypractica Express Server
After=network.target

[Service]
User=aida
EnvironmentFile=$REPO_DIR_FE/.env.production
ExecStart=/usr/bin/node $REPO_DIR_FE/server.cjs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

  # Reload systemd and enable/start the service
  echo "Reloading systemd daemon and starting Keypractica Express service..."
  systemctl daemon-reload
  systemctl enable keypractica-express
  systemctl start keypractica-express

  echo "Frontend is being served through Express as a systemd service at https://kneox.keypractica.com!"
else
  set -a
  source $REPO_DIR_FE/.env.production
  set +a
  node $REPO_DIR_FE/server.cjs
fi