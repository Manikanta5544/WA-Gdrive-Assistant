#!/usr/bin/env node

/**
 * Backup Script for n8n WhatsApp Drive Assistant
 * Creates backups of workflows, credentials templates, and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackupManager {
    constructor() {
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.backupDir = path.join(__dirname, '..', 'backups', this.timestamp);
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',    // cyan
            success: '\x1b[32m', // green
            warning: '\x1b[33m', // yellow
            error: '\x1b[31m',   // red
            reset: '\x1b[0m'     // reset
        };

        const prefix = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        }[type];

        console.log(`${colors[type]}${prefix} ${message}${colors.reset}`);
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            this.log(`Created directory: ${dirPath}`, 'success');
        }
    }

    copyFile(src, dest) {
        try {
            if (fs.existsSync(src)) {
                this.ensureDirectoryExists(path.dirname(dest));
                fs.copyFileSync(src, dest);
                this.log(`Copied: ${src} → ${dest}`, 'success');
                return true;
            } else {
                this.log(`Source file not found: ${src}`, 'warning');
                return false;
            }
        } catch (error) {
            this.log(`Error copying ${src}: ${error.message}`, 'error');
            return false;
        }
    }

    backupWorkflows() {
        this.log('Backing up workflows...', 'info');
        
        const workflowsDir = path.join(__dirname, '..', 'workflows');
        const backupWorkflowsDir = path.join(this.backupDir, 'workflows');
        
        if (!fs.existsSync(workflowsDir)) {
            this.log('Workflows directory not found', 'warning');
            return;
        }

        const files = fs.readdirSync(workflowsDir);
        let copiedCount = 0;

        files.forEach(file => {
            if (file.endsWith('.json')) {
                const success = this.copyFile(
                    path.join(workflowsDir, file),
                    path.join(backupWorkflowsDir, file)
                );
                if (success) copiedCount++;
            }
        });

        this.log(`Backed up ${copiedCount} workflow files`, 'success');
    }

    backupConfiguration() {
        this.log('Backing up configuration files...', 'info');
        
        const configFiles = [
            'docker-compose.yml',
            'docker-compose.debug.yml',
            '.env.example',
            'package.json',
            'README.md'
        ];

        let copiedCount = 0;
        const configBackupDir = path.join(this.backupDir, 'config');

        configFiles.forEach(file => {
            const success = this.copyFile(
                path.join(__dirname, '..', file),
                path.join(configBackupDir, file)
            );
            if (success) copiedCount++;
        });

        this.log(`Backed up ${copiedCount} configuration files`, 'success');
    }

    backupCredentialTemplates() {
        this.log('Backing up credential templates...', 'info');
        
        const credentialsDir = path.join(__dirname, '..', 'credentials');
        const backupCredentialsDir = path.join(this.backupDir, 'credentials');
        
        if (!fs.existsSync(credentialsDir)) {
            this.log('Credentials directory not found', 'warning');
            return;
        }

        const files = fs.readdirSync(credentialsDir).filter(file => 
            file.endsWith('.json') || file === 'README.md'
        );

        let copiedCount = 0;
        files.forEach(file => {
            // Skip actual credential files, only backup templates
            if (!file.includes('actual') && !file.includes('real')) {
                const success = this.copyFile(
                    path.join(credentialsDir, file),
                    path.join(backupCredentialsDir, file)
                );
                if (success) copiedCount++;
            }
        });

        this.log(`Backed up ${copiedCount} credential template files`, 'success');
    }

    backupDockerData() {
        this.log('Creating Docker data export instructions...', 'info');
        
        const instructions = `# Docker Data Backup Instructions

## Created: ${new Date().toISOString()}

### To backup Docker volumes:
\`\`\`bash
# Backup n8n data
docker run --rm -v whatsapp-drive-assistant_n8n_data:/data -v $(pwd)/backups/${this.timestamp}/docker:/backup alpine tar czf /backup/n8n_data.tar.gz -C /data .

# Backup PostgreSQL data  
docker run --rm -v whatsapp-drive-assistant_postgres_data:/data -v $(pwd)/backups/${this.timestamp}/docker:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
\`\`\`

### To restore Docker volumes:
\`\`\`bash
# Restore n8n data
docker run --rm -v whatsapp-drive-assistant_n8n_data:/data -v $(pwd)/backups/${this.timestamp}/docker:/backup alpine tar xzf /backup/n8n_data.tar.gz -C /data

# Restore PostgreSQL data
docker run --rm -v whatsapp-drive-assistant_postgres_data:/data -v $(pwd)/backups/${this.timestamp}/docker:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
\`\`\`

### Alternative using docker-compose:
\`\`\`bash
# Stop services
docker-compose down

# Create volume backups
docker-compose run --rm postgres pg_dump -h postgres -U n8n n8n > backups/${this.timestamp}/database_dump.sql

# Restart services
docker-compose up -d
\`\`\`
`;

        const dockerBackupDir = path.join(this.backupDir, 'docker');
        this.ensureDirectoryExists(dockerBackupDir);
        
        fs.writeFileSync(
            path.join(dockerBackupDir, 'backup_instructions.md'), 
            instructions
        );
        
        this.log('Created Docker backup instructions', 'success');
    }

    generateManifest() {
        this.log('Generating backup manifest...', 'info');
        
        const manifest = {
            created: new Date().toISOString(),
            version: '1.0.0',
            type: 'whatsapp-drive-assistant-backup',
            contents: {
                workflows: fs.existsSync(path.join(this.backupDir, 'workflows')),
                configuration: fs.existsSync(path.join(this.backupDir, 'config')),
                credentials: fs.existsSync(path.join(this.backupDir, 'credentials')),
                docker_instructions: fs.existsSync(path.join(this.backupDir, 'docker'))
            },
            restore_instructions: {
                workflows: 'Import workflow.json files through n8n interface',
                configuration: 'Copy configuration files to project root',
                credentials: 'Use templates to recreate credentials in n8n',
                docker: 'Follow docker/backup_instructions.md'
            }
        };

        fs.writeFileSync(
            path.join(this.backupDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        this.log('Generated backup manifest', 'success');
    }

    createArchive() {
        this.log('Creating backup archive...', 'info');
        
        try {
            const archivePath = path.join(__dirname, '..', 'backups', `backup-${this.timestamp}.tar.gz`);
            execSync(`tar -czf "${archivePath}" -C "${path.dirname(this.backupDir)}" "${path.basename(this.backupDir)}"`, {
                stdio: 'inherit'
            });
            this.log(`Created archive: ${archivePath}`, 'success');
            
            // Remove the temporary directory
            execSync(`rm -rf "${this.backupDir}"`);
            this.log('Cleaned up temporary files', 'success');
            
            return archivePath;
        } catch (error) {
            this.log(`Failed to create archive: ${error.message}`, 'error');
            return null;
        }
    }

    async run() {
        this.log('🎯 Starting backup process...', 'info');
        
        // Ensure backup directory exists
        this.ensureDirectoryExists(this.backupDir);
        
        // Perform backups
        this.backupWorkflows();
        this.backupConfiguration();
        this.backupCredentialTemplates();
        this.backupDockerData();
        this.generateManifest();
        
        // Create archive
        const archivePath = this.createArchive();
        
        this.log('\n' + '='.repeat(50), 'info');
        this.log('📦 BACKUP COMPLETED', 'success');
        this.log('='.repeat(50), 'info');
        
        if (archivePath) {
            this.log(`Archive created: ${archivePath}`, 'success');
            this.log('Backup includes:', 'info');
            this.log('  • Workflow definitions', 'info');
            this.log('  • Configuration files', 'info');
            this.log('  • Credential templates', 'info');
            this.log('  • Docker backup instructions', 'info');
        }
        
        this.log('\n💡 To restore from backup:', 'info');
        this.log('1. Extract the archive', 'info');
        this.log('2. Follow instructions in manifest.json', 'info');
        this.log('3. Use docker backup instructions for data', 'info');
    }
}

// Run if called directly
if (require.main === module) {
    const backup = new BackupManager();
    backup.run().catch(error => {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    });
}

module.exports = BackupManager;