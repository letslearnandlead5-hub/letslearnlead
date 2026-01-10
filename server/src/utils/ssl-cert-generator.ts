import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Generate self-signed SSL certificates for local development
 * This should NOT be used in production. Use Let's Encrypt for production.
 */
export function generateSelfSignedCertificate(): { certPath: string; keyPath: string } {
    const certsDir = path.join(process.cwd(), 'certs');
    const certPath = path.join(certsDir, 'server.crt');
    const keyPath = path.join(certsDir, 'server.key');

    // Check if certificates already exist
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        console.log('✅ SSL certificates already exist');
        return { certPath, keyPath };
    }

    // Create certs directory if it doesn't exist
    if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
    }

    console.log('🔐 Generating self-signed SSL certificate for development...');

    try {
        // Generate self-signed certificate using OpenSSL
        // Valid for 365 days, uses localhost as common name
        const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;

        execSync(command, { stdio: 'inherit' });

        console.log('✅ SSL certificates generated successfully');
        console.log(`   Certificate: ${certPath}`);
        console.log(`   Private Key: ${keyPath}`);
        console.log('');
        console.log('⚠️  NOTE: These are self-signed certificates for development only.');
        console.log('   Your browser will show a security warning - this is expected.');
        console.log('   For production, use Let\'s Encrypt or a trusted certificate authority.');

        return { certPath, keyPath };
    } catch (error) {
        console.error('❌ Failed to generate SSL certificates:', error);
        console.error('');
        console.error('Make sure OpenSSL is installed on your system:');
        console.error('  - Windows: Install Git Bash or use WSL');
        console.error('  - macOS: Pre-installed');
        console.error('  - Linux: sudo apt-get install openssl');
        throw error;
    }
}

/**
 * Read SSL certificates from file paths
 */
export function readSSLCertificates(certPath: string, keyPath: string): { cert: Buffer; key: Buffer } {
    try {
        const cert = fs.readFileSync(certPath);
        const key = fs.readFileSync(keyPath);
        return { cert, key };
    } catch (error) {
        console.error('❌ Failed to read SSL certificates:', error);
        throw error;
    }
}
