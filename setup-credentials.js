#!/usr/bin/env node

/**
 * Setup Credentials Helper Script
 * Validates API connections and helps setup n8n credentials
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config();

class CredentialsSetup {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.success = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '💡',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        }[type] || 'ℹ️';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
        
        switch (type) {
            case 'error':
                this.errors.push(message);
                break;
            case 'warning':
                this.warnings.push(message);
                break;
            case 'success':
                this.success.push(message);
                break;
        }
    }

    checkEnvVariables() {
        this.log('Checking environment variables...');
        
        const required = [
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'OPENAI_API_KEY',
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN'
        ];
        
        const optional = [
            'WEBHOOK_URL',
            'GOOGLE_AUDIT_SHEET_ID',
            'N8N_BASIC_AUTH_PASSWORD'
        ];
        
        let missingRequired = 0;
        let missingOptional = 0;
        
        required.forEach(key => {
            if (!process.env[key]) {
                this.log(`Missing required environment variable: ${key}`, 'error');
                missingRequired++;
            } else {
                this.log(`Found required variable: ${key}`, 'success');
            }
        });
        
        optional.forEach(key => {
            if (!process.env[key]) {
                this.log(`Missing optional environment variable: ${key}`, 'warning');
                missingOptional++;
            } else {
                this.log(`Found optional variable: ${key}`, 'success');
            }
        });
        
        if (missingRequired === 0) {
            this.log('All required environment variables found', 'success');
        }
        
        return missingRequired === 0;
    }

    async testOpenAIConnection() {
        this.log('Testing OpenAI API connection...');
        
        if (!process.env.OPENAI_API_KEY) {
            this.log('OpenAI API key not found', 'error');
            return false;
        }
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/models',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'User-Agent': 'n8n-whatsapp-assistant/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                if (res.statusCode === 200) {
                    this.log('OpenAI API connection successful', 'success');
                    resolve(true);
                } else {
                    this.log(`OpenAI API connection failed: ${res.statusCode}`, 'error');
                    resolve(false);
                }
            });
            
            req.on('error', (error) => {
                this.log(`OpenAI API connection error: ${error.message}`, 'error');
                resolve(false);
            });
            
            req.setTimeout(5000, () => {
                this.log('OpenAI API connection timeout', 'error');
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    async testTwilioConnection() {
        this.log('Testing Twilio API connection...');
        
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            this.log('Twilio credentials not found', 'error');
            return false;
        }
        
        return new Promise((resolve) => {
            const auth = Buffer.from(
                `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
            ).toString('base64');
            
            const options = {
                hostname: 'api.twilio.com',
                path: `/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'User-Agent': 'n8n-whatsapp-assistant/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                if (res.statusCode === 200) {
                    this.log('Twilio API connection successful', 'success');
                    resolve(true);
                } else {
                    this.log(`Twilio API connection failed: ${res.statusCode}`, 'error');
                    resolve(false);
                }
            });
            
            req.on('error', (error) => {
                this.log(`Twilio API connection error: ${error.message}`, 'error');
                resolve(false);
            });
            
            req.setTimeout(5000, () => {
                this.log('Twilio API connection timeout', 'error');
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    generateCredentialsTemplate() {
        this.log('Generating n8n credentials template...');
        
        const credentials = {
            googleOAuth2: {
                name: 'Google Drive OAuth2',
                type: 'googleOAuth2Api',
                data: {
                    clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
                    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets'
                }
            },
            openAI: {
                name: 'OpenAI API',
                type: 'openAiApi',
                data: {
                    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
                }
            }
        };
        
        fs.writeFileSync('./credentials/template.json', JSON.stringify(credentials, null, 2));
        this.log('Credentials template generated: ./credentials/template.json', 'success');
    }

    generateSetupReport() {
        this.log('\n' + '='.repeat(50));
        this.log('SETUP REPORT');
        this.log('='.repeat(50));
        
        if (this.success.length > 0) {
            this.log('\n✅ SUCCESSFUL CHECKS:');
            this.success.forEach(msg => this.log(`  • ${msg}`));
        }
        
        if (this.warnings.length > 0) {
            this.log('\n⚠️  WARNINGS:');
            this.warnings.forEach(msg => this.log(`  • ${msg}`));
        }
        
        if (this.errors.length > 0) {
            this.log('\n❌ ERRORS TO FIX:');
            this.errors.forEach(msg => this.log(`  • ${msg}`));
        }
        
        this.log('\n📋 NEXT STEPS:');
        
        if (this.errors.length > 0) {
            this.log('  1. Fix the errors listed above');
            this.log('  2. Update your .env file with correct values');
            this.log('  3. Run this script again to verify');
        } else {
            this.log('  1. Start n8n: docker-compose up -d');
            this.log('  2. Access n8n: http://localhost:5678');
            this.log('  3. Import workflow.json');
            this.log('  4. Configure credentials using the template');
            this.log('  5. Set up Twilio webhook with your ngrok URL');
        }
        
        this.log('\n🔗 USEFUL LINKS:');
        this.log('  • n8n Documentation: https://docs.n8n.io/');
        this.log('  • Google Cloud Console: https://console.cloud.google.com/');
        this.log('  • Twilio Console: https://console.twilio.com/');
        this.log('  • OpenAI API Keys: https://platform.openai.com/api-keys');
    }

    async run() {
        this.log('🚀 Starting WhatsApp Drive Assistant Setup...\n');
        
        // Create directories if they don't exist
        if (!fs.existsSync('./credentials')) {
            fs.mkdirSync('./credentials');
            this.log('Created ./credentials directory', 'success');
        }
        
        // Check environment variables
        const envOk = this.checkEnvVariables();
        
        if (envOk) {
            // Test API connections
            await this.testOpenAIConnection();
            await this.testTwilioConnection();
        }
        
        // Generate templates
        this.generateCredentialsTemplate();
        
        // Generate final report
        this.generateSetupReport();
        
        // Exit code based on errors
        process.exit(this.errors.length > 0 ? 1 : 0);
    }
}

// Run if called directly
if (require.main === module) {
    const setup = new CredentialsSetup();
    setup.run().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = CredentialsSetup;