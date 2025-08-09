# WhatsApp-Driven Google Drive Assistant

A powerful n8n workflow that enables WhatsApp users to manage their Google Drive files through simple text commands. Send messages to control your Drive - list files, delete documents, move items, and get AI-powered summaries.

## 🚀 Features

- **📱 WhatsApp Integration**: Use Twilio Sandbox for WhatsApp as the entry point
- **📁 Google Drive Operations**: List, delete, and move files with simple commands
- **🤖 AI Summarization**: Get intelligent summaries of PDF, DOCX, and TXT files using OpenAI GPT-4o
- **🔐 Security**: OAuth2 authentication, confirmation required for deletions
- **📊 Audit Logging**: Complete activity tracking in Google Sheets
- **⚡ Real-time**: Instant responses to WhatsApp commands

## 📋 Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `LIST /folder` | List files in a folder | `LIST /ProjectX` |
| `DELETE /path/file` | Delete a file (requires confirmation) | `CONFIRM DELETE /ProjectX/report.pdf` |
| `MOVE /source /dest` | Move file to new location | `MOVE /ProjectX/report.pdf /Archive` |
| `SUMMARY /folder` | Get AI summary of files | `SUMMARY /ProjectX` |
| `HELP` | Show available commands | `HELP` |

## 🛠️ Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Google Cloud Platform account
- Twilio account with WhatsApp sandbox
- OpenAI API key

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd whatsapp-drive-assistant
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your credentials:

```bash
# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password

# Webhook URL (update after getting your domain/ngrok)
WEBHOOK_URL=https://your-domain.com/webhook/whatsapp-webhook

# Google APIs
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

### 3. Google Cloud Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable APIs**:
   - Google Drive API
   - Google Sheets API

3. **Create OAuth2 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Add authorized redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`

4. **Create Audit Spreadsheet**:
   - Create a new Google Sheet
   - Note the sheet ID from the URL
   - Share with your Google account

### 4. Start n8n with Docker

```bash
# Start n8n
docker-compose up -d

# Check logs
docker-compose logs -f n8n
```

### 5. Configure n8n

1. **Access n8n**: Open `http://localhost:5678`
2. **Import Workflow**: 
   - Go to Workflows > Import from file
   - Select `workflow.json`
3. **Setup Credentials**:
   - **Google OAuth2**: Use your Google credentials
   - **OpenAI API**: Add your OpenAI API key
   - **Google Sheets**: Use same OAuth2 for Sheets access

### 6. Setup Twilio WhatsApp Sandbox

1. **Create Twilio Account**: [Sign up at Twilio](https://www.twilio.com/)
2. **Access WhatsApp Sandbox**:
   - Console > Develop > Messaging > Try it out > Send a WhatsApp message
3. **Configure Webhook**:
   - Use ngrok for local testing: `ngrok http 5678`
   - Webhook URL: `https://your-ngrok-url.ngrok.io/webhook/whatsapp-webhook`
4. **Join Sandbox**:
   - Send the join code to the Twilio WhatsApp number
   - Format: `join <your-code>`

### 7. Test the Workflow

Send these messages to your Twilio WhatsApp number:

```
HELP
LIST /
SUMMARY /
```

## 🐳 Docker Configuration

The included `docker-compose.yml` provides:

- **n8n**: Main workflow engine
- **PostgreSQL**: Database for n8n data
- **Volume persistence**: Data survives container restarts

### Production Deployment

For production, consider:

1. **Use external database**: PostgreSQL or MySQL
2. **SSL certificates**: Let's Encrypt or similar
3. **Environment variables**: Use Docker secrets
4. **Monitoring**: Health checks and logging
5. **Scaling**: Multiple n8n instances behind load balancer

## 🔧 Configuration Files

### docker-compose.yml
Complete Docker setup with PostgreSQL database and proper networking.

### .env.example
Template for all required environment variables with explanations.

### setup-credentials.js
Helper script to validate API connections and setup credentials.

## 🛡️ Security Considerations

- **OAuth2 Authentication**: Secure Google API access
- **Delete Confirmation**: Prevents accidental file deletion
- **Webhook Validation**: Verify Twilio webhook signatures
- **Rate Limiting**: Implement request throttling
- **Data Encryption**: All data encrypted in transit and at rest

## 📊 Monitoring and Logging

- **Audit Trail**: All commands logged to Google Sheets
- **Error Handling**: Comprehensive error messages via WhatsApp
- **Performance Monitoring**: Track response times and usage
- **Webhook Logs**: Monitor incoming WhatsApp messages

## 🔄 Extending the Workflow

### Adding New Commands

1. **Update Command Parser**: Add new command pattern in "Parse Command" node
2. **Add Route Logic**: Create new condition in "Route Commands" switch
3. **Implement Handler**: Create nodes for new command logic
4. **Update Help**: Add command to help text

### Example: Adding COPY Command

```javascript
// In Parse Command node
else if (command.startsWith('COPY ')) {
  const parts = command.replace('COPY ', '').split(' ');
  if (parts.length >= 2) {
    parsedCommand = {
      ...parsedCommand,
      type: 'COPY',
      path: parts[0],
      destination: parts[1],
      valid: true
    };
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Messages**:
   - Check ngrok is running and URL is correct
   - Verify Twilio webhook configuration
   - Check n8n workflow is activated

2. **Google Drive Authentication Fails**:
   - Verify OAuth2 credentials are correct
   - Check redirect URI matches exactly
   - Ensure required APIs are enabled

3. **OpenAI API Errors**:
   - Verify API key is valid and has credits
   - Check rate limits aren't exceeded
   - Ensure model name is correct

4. **File Operations Fail**:
   - Check Google Drive permissions
   - Verify file paths are correct
   - Ensure files exist and are accessible

### Debug Mode

Enable debug logging in n8n:

```bash
docker-compose -f docker-compose.debug.yml up
```

## 📈 Performance Optimization

- **File Size Limits**: Restrict summary to files under 10MB
- **Batch Operations**: Process multiple files efficiently
- **Caching**: Cache frequently accessed file metadata
- **Async Processing**: Use webhooks for long-running operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join our Discord for support and discussions

## 🎯 Roadmap

- [ ] Natural language command parsing
- [ ] Multi-language support
- [ ] File preview generation
- [ ] Scheduled tasks integration
- [ ] Team collaboration features
- [ ] Advanced search capabilities

---

**⚡ Built with n8n - The workflow automation platform that puts you in control**