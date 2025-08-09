# Workflows Directory

This directory contains n8n workflow files for easy import and backup.

## Files

- **workflow.json**: Main WhatsApp Drive Assistant workflow
- **workflow-backup.json**: Automated backup of the workflow (generated)

## Importing Workflows

1. Open n8n at http://localhost:5678
2. Go to "Workflows" in the sidebar
3. Click "Import from file"
4. Select the `workflow.json` file
5. Click "Import"

## Exporting Workflows

To create a backup of your modified workflow:

1. Open your workflow in n8n
2. Click the workflow settings (three dots)
3. Select "Download"
4. Save the file in this directory

## Workflow Structure

The main workflow includes these components:

### 1. Trigger
- **WhatsApp Webhook**: Receives messages from Twilio

### 2. Command Processing
- **Parse Command**: Extracts and validates commands
- **Route Commands**: Directs to appropriate handlers

### 3. Command Handlers
- **LIST**: Google Drive file listing
- **DELETE**: File deletion with confirmation
- **MOVE**: File movement between folders
- **SUMMARY**: AI-powered file summaries
- **HELP**: Command reference

### 4. Integrations
- **Google Drive API**: File operations
- **OpenAI API**: Content summarization
- **Google Sheets API**: Audit logging

### 5. Response
- **Format Response**: Prepare WhatsApp replies
- **Send Response**: Return formatted messages

## Node Groups

The workflow is organized into logical groups:

- **Input Processing**: Message parsing and validation
- **Security**: Authentication and confirmation checks
- **File Operations**: Google Drive interactions
- **AI Processing**: Content analysis and summarization
- **Logging**: Audit trail and monitoring
- **Output**: Response formatting and delivery

## Error Handling

Each critical operation includes error handling:

- **API Failures**: Graceful degradation with user notifications
- **Invalid Commands**: Clear error messages with help references
- **Permission Issues**: Detailed troubleshooting information
- **Rate Limits**: Automatic retry with backoff

## Security Features

- **OAuth2 Authentication**: Secure Google API access
- **Delete Confirmation**: Prevents accidental file deletion
- **Audit Logging**: Complete activity tracking
- **Input Validation**: Command sanitization and verification