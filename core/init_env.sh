#!/bin/bash

# Copy .env.example to .env
cp .env.example .env

# Replace all occurrences of ${HOST_ADDRESS} with 'host.docker.internal'
sed -i 's/\${HOST_ADDRESS}/host.docker.internal/g' .env

echo ".env file created and updated successfully."
