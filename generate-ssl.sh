#!/bin/bash

# Generate self-signed SSL certificates for development

echo "🔐 Generating self-signed SSL certificates for development..."

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key ssl/key.pem -out ssl/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in ssl/cert.csr -signkey ssl/key.pem -out ssl/cert.pem -days 365

# Clean up CSR file
rm ssl/cert.csr

echo "✅ SSL certificates generated in ssl/ directory"
echo "⚠️  These are self-signed certificates for development only!"
echo "   For production, use certificates from a trusted CA."

# Set appropriate permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "🔒 Permissions set correctly"
