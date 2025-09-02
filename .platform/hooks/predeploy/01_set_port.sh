#!/bin/bash
echo "Setting up port 5000 configuration..."

# Set environment variable
export PORT=5000

# Create a simple gunicorn configuration
cat > /var/app/staging/gunicorn.conf.py << EOF
bind = "0.0.0.0:5000"
workers = 1
timeout = 300
worker_class = "sync"
EOF

echo "Port configuration completed." 