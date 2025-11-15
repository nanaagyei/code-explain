# 🚀 CodeXplain

**AI-Powered Code Documentation & Analysis Platform**

Transform your code documentation with AI-powered analysis, interactive diagrams, and intelligent insights. Support for 20+ programming languages with modern, responsive design.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## ✨ Features

### 🤖 **AI-Powered Documentation**
- **Automatic Generation**: Comprehensive documentation for functions, classes, and modules
- **Multi-Language Support**: Python, JavaScript, TypeScript, Java, C++, Go, Rust, and more
- **Custom Templates**: Tailor documentation style to your team's preferences
- **Real-time Processing**: Fast, on-demand analysis with intelligent caching

### 🔍 **Smart Code Review**
- **Security Analysis**: Detect vulnerabilities and security risks (OWASP Top 10)
- **Performance Optimization**: Identify bottlenecks and inefficiencies
- **Best Practices**: Suggest code improvements and standards
- **Overall Scoring**: Quantified assessment of code quality

### 📊 **Quality Metrics**
- **5-Dimensional Scoring**: Maintainability, Testability, Readability, Performance, Security
- **Actionable Insights**: Specific recommendations for improvement
- **Historical Tracking**: Monitor quality improvements over time
- **Team Comparisons**: Compare metrics across team members

### 🏗️ **Interactive Architecture Diagrams**
- **Visual Code Structure**: Interactive diagrams showing component relationships
- **Multiple Layouts**: Horizontal, vertical, and circular arrangements
- **Custom Node Types**: Different styles for functions, classes, modules, and APIs
- **Export Options**: Save as PNG, SVG, or interactive formats

### 🎓 **AI Coding Mentor**
- **Skill Assessment**: Personalized evaluation of your coding abilities
- **Learning Paths**: Customized recommendations based on your code patterns
- **Challenges**: Practice exercises tailored to your skill level
- **Progress Tracking**: Monitor your improvement over time

### ⚡ **Bulk Operations**
- **Multi-Repository Processing**: Analyze multiple repositories simultaneously
- **Batch Analysis**: Process code review, quality metrics, and architecture diagrams in parallel
- **GitHub Integration**: Seamlessly import and analyze GitHub repositories
- **Progress Monitoring**: Real-time updates on batch processing

### 🔧 **Advanced Features**
- **Custom AI Prompts**: Configure documentation style and focus areas
- **API Key Management**: Use your own OpenAI API keys for enhanced control
- **Export Options**: Generate documentation in multiple formats (Markdown, PDF, HTML)
- **Real-time Collaboration**: Live updates and team sharing

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- **Docker Desktop** (for local development services)
- **Git** (for version control)

### 1. Clone Repository
```bash
git clone https://github.com/codeexplain/codeexplain.git
cd codeexplain
```

### 2. Start Services with Docker
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Install dependencies
npm install
cd backend && pip install -r requirements.txt
```

### 3. Configure Environment
```bash
# Copy environment template
cp env.template .env

# Edit .env with your configuration
# Add your OpenAI API key for AI features
```

### 4. Run Database Migrations
```bash
cd backend
alembic upgrade head
```

### 5. Start Development Servers
```bash
# Backend (Terminal 1)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📚 Documentation

### 📖 **Comprehensive Guides**
- **[Getting Started](docs/docs/getting-started/introduction.md)** - Introduction and overview
- **[Installation Guide](docs/docs/getting-started/installation.md)** - Detailed setup instructions
- **[Quick Start](docs/docs/getting-started/quick-start.md)** - Create your first documentation in 5 minutes

### 🎯 **Feature Documentation**
- **[AI Code Review](docs/docs/features/ai-code-review.md)** - Security analysis and performance insights
- **[Quality Metrics](docs/docs/features/quality-metrics.md)** - 5-dimensional scoring system
- **[Architecture Diagrams](docs/docs/features/architecture-diagrams.md)** - Interactive code visualization
- **[AI Mentor](docs/docs/features/ai-mentor.md)** - Personalized learning paths

### 🔧 **Development Guides**
- **[API Reference](docs/docs/api/)** - Complete API documentation
- **[Development Guide](docs/docs/development/)** - Contributing and development setup
- **[Troubleshooting](docs/docs/troubleshooting/)** - Common issues and solutions

### 🌐 **Live Documentation Site**
Visit our comprehensive documentation site: **[docs.codeexplain.dev](https://docs.codeexplain.dev)**

## 🏗️ Architecture

### **Backend Stack**
- **FastAPI**: High-performance Python web framework
- **PostgreSQL**: Robust relational database
- **Redis**: High-speed caching and session management
- **SQLAlchemy**: Powerful ORM for database operations
- **OpenAI API**: Advanced AI capabilities for code analysis
- **Alembic**: Database migration management

### **Frontend Stack**
- **React 18**: Modern UI framework with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling framework
- **React Flow**: Interactive diagram visualization
- **Zustand**: Lightweight state management
- **React Query**: Data fetching and caching

### **Infrastructure**
- **Docker**: Containerized deployment
- **WebSocket**: Real-time communication
- **Server-Sent Events**: Streaming responses
- **CORS**: Cross-Origin Resource Sharing

## 🎯 Usage Examples

### **Upload and Analyze Code**
1. **Create Repository**: Upload files or import from GitHub
2. **Generate Documentation**: AI automatically creates comprehensive docs
3. **Review Code**: Get security and performance analysis
4. **View Quality Metrics**: See 5-dimensional quality scores
5. **Explore Architecture**: Interactive diagrams of code structure

### **AI-Powered Analysis**
```python
# Example: Python function analysis
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

# AI generates:
# - Documentation with parameters and return types
# - Security analysis (potential stack overflow)
# - Performance issues (exponential time complexity)
# - Quality metrics (maintainability, testability, etc.)
# - Architecture diagram showing function relationships
```

### **Bulk Operations**
```bash
# Process multiple repositories
curl -X POST "http://localhost:8000/repositories/batch-analyze" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "repository_ids": [1, 2, 3],
    "analysis_types": ["code_review", "quality_metrics", "architecture"]
  }'
```

## 🔧 Configuration

### **Environment Variables**
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/codeexplain
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### **Custom AI Prompts**
Configure documentation style in Settings:
- **Tone**: Formal, casual, technical
- **Detail Level**: Brief, comprehensive, expert
- **Focus Areas**: Security, performance, best practices

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
python -m pytest tests/
python test_code_analysis_features.py
```

### **Frontend Tests**
```bash
cd frontend
npm test
npm run test:coverage
```

### **Integration Tests**
```bash
# Test complete application flow
python backend/test_complete_application.py
```

## 🚀 Deployment

### **Production Deployment**
See our comprehensive deployment guide: **[Deployment Guide](docs/docs/development/deployment.md)**

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### **Cloud Deployment**
- **AWS**: ECS, RDS, ElastiCache
- **Google Cloud**: Cloud Run, Cloud SQL, Memorystore
- **Azure**: Container Instances, Database, Cache

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/docs/development/contributing.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### **Code Standards**
- **TypeScript**: Strict type checking
- **Python**: PEP 8 compliance
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear and comprehensive

## 📊 Performance

### **Benchmarks**
- **Documentation Generation**: < 5 seconds per file
- **Code Review Analysis**: < 10 seconds per file
- **Quality Metrics**: < 3 seconds per file
- **Architecture Diagrams**: < 8 seconds per file

### **Scalability**
- **Concurrent Users**: 1000+ simultaneous users
- **File Processing**: 100+ files per minute
- **Database**: Optimized queries with caching
- **API**: Rate limiting and request optimization

## 🔒 Security

### **Security Features**
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Controlled cross-origin access
- **API Key Encryption**: Secure storage of sensitive data

### **Privacy**
- **Data Encryption**: All sensitive data encrypted at rest
- **No Data Sharing**: Your code stays private
- **GDPR Compliant**: Full compliance with privacy regulations
- **Audit Logging**: Complete audit trail of all actions

## 📈 Roadmap

### **Upcoming Features**
- **Real-time Collaboration**: Multiple users editing simultaneously
- **VS Code Extension**: Seamless IDE integration
- **Advanced Analytics**: Team productivity insights
- **Custom Templates**: Industry-specific documentation templates
- **API Webhooks**: CI/CD integration
- **Multi-language Translation**: Documentation in multiple languages

### **Long-term Vision**
- **Enterprise Features**: SSO, RBAC, audit logs
- **AI Code Generation**: Generate code from documentation
- **Advanced Testing**: Automated test case generation
- **Performance Monitoring**: Real-time performance insights

## 📞 Support

### **Getting Help**
- **Documentation**: Comprehensive guides and API reference
- **GitHub Issues**: Report bugs and request features
- **Discord Community**: Real-time help and discussions
- **Email Support**: Enterprise support available

### **Community**
- **GitHub**: [github.com/codeexplain/codeexplain](https://github.com/codeexplain/codeexplain)
- **Discord**: [discord.gg/codeexplain](https://discord.gg/codeexplain)
- **Twitter**: [@codeexplain](https://twitter.com/codeexplain)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: For providing powerful AI capabilities
- **React Team**: For the amazing React framework
- **FastAPI**: For the high-performance Python framework
- **Community**: For feedback, contributions, and support

---

**Ready to revolutionize your code documentation?** 🚀

[Get Started](docs/docs/getting-started/introduction.md) | [View Features](docs/docs/features/) | [API Reference](docs/docs/api/) | [Contribute](docs/docs/development/contributing.md)

---

<div align="center">
  <strong>Built with ❤️ by the CodeXplain Team</strong>
</div>
