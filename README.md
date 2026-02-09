<p align="center">
  <img src="https://img.shields.io/badge/AI_Engine-v2.0-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Architecture-Spring_Boot_%2B_React-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Operational-238636?style=flat-square" />
</p>

<h1 align="center">CSR Denial Knowledge Bot</h1>

<p align="center">
  <a href="https://csr-bot.netlify.app/" target="_blank" style="text-decoration: none;">
    <img src="https://cdn-icons-png.flaticon.com/512/2593/2593635.png" width="50" height="50" alt="Logo"/><br/>
    <kbd><b> ✨ ENTER LIVE EXPERIENCE </b></kbd>
  </a>
</p>

<p align="center">
  <i>"The intelligent bridge between claim denials and instant resolution."</i>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#support">Support</a>
</p>

---

## 📖 Overview

The **CSR Denial Knowledge Bot** transforms the way Customer Service Representatives handle insurance complexities. By merging human-centric design with a powerful AI resolution engine, it turns cryptic denial codes into actionable workflows in seconds.

### ✨ What's New
* **Enhanced UI/UX**: Modern design with smooth animations and responsive layout.
* **Robust Error Handling**: Comprehensive management with auto-retry logic.
* **General Knowledge Bot**: Integrated open-source chatbot for general questions.
* **Performance Optimized**: Lazy loading, debouncing, and memory management.
* **Fully Responsive**: Mobile-first design with accessibility support.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | `React 18` | Modern UI with hooks-based architecture |
| **Backend** | `Spring Boot 3.2.1` | RESTful API with enterprise security |
| **AI Model** | `FastAPI / Scikit-learn` | Intelligent query processing |
| **Database** | `MySQL 8.0` | Persistent data storage |

---

## 🚀 Key Features

### 🧠 Core Functionality
* **Denial Code Lookup**: Instant explanations for industry-standard codes.
* **Plan Coverage Queries**: Check member benefits and coverage details.
* **AI-Powered Responses**: Natural language processing for smart answers.

### 🎨 User Experience
* **Modern Animations**: Smooth transitions and professional loading states.
* **Accessibility**: WCAG compliant with screen reader support.
* **Dark Mode**: Automatic theme detection.

---

## 📂 Project Structure

```text
CSR/
├── Frontend_CSR_Denial_Knowledge_Bot/   # React application
├── Backend_CSR_Denial_Knowledge_Bot/    # Spring Boot API
└── AI_Model_CSR_Denial_Knowledge_Bot/   # Python AI logic

An AI-powered web application designed to help Customer Service Representatives (CSRs) instantly interpret and resolve insurance claim denial codes with enhanced user experience and modern architecture.

---

## Overview

The **CSR Denial Knowledge Bot** bridges the gap between complex medical billing codes and actionable solutions. By leveraging a Spring Boot backend, Python-based AI model, and a modern React frontend, the system provides human-readable explanations and suggests the next best steps for claim recovery.

### What's New

- **Enhanced UI/UX**: Modern design with smooth animations and responsive layout
- **Robust Error Handling**: Comprehensive error management with auto-retry logic
- **General Knowledge Bot**: Integrated open-source chatbot for general questions
- **Performance Optimized**: Lazy loading, debouncing, and memory management
- **Fully Responsive**: Mobile-first design with accessibility support
- **Rich Animations**: Professional loading states and micro-interactions

---

## Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 18, React Router, CSS3 | Modern UI with hooks-based architecture |
| **Backend** | Java 17, Spring Boot 3.2.1 | RESTful API with Spring Security |
| **AI Model** | Python, FastAPI/Flask, Scikit-learn | Intelligent query processing |
| **Database** | MySQL 8.0 | Persistent data storage |
| **Authentication** | JWT, Spring Security | Secure token-based auth |

---

## Key Features

### Core Functionality
- **Denial Code Lookup**: Instant explanations for industry-standard codes
- **Plan Coverage Queries**: Check member benefits and coverage details
- **Member Information**: Access member data and plan information
- **AI-Powered Responses**: Natural language processing for smart answers

### Enhanced User Experience
- **Modern Animations**: Smooth transitions and loading states
- **Responsive Design**: Mobile-first approach with touch optimization
- **Accessibility**: WCAG compliant with screen reader support
- **Dark Mode Support**: Automatic theme detection
- **Performance Optimized**: Lazy loading and bundle optimization

### Robust Error Handling
- **Auto-Retry Logic**: Intelligent retry for transient errors
- **Contextual Error Messages**: User-friendly error descriptions
- **Fallback Systems**: Graceful degradation when main system fails
- **Connection Status**: Real-time connection indicators

### General Knowledge Integration
- **Pattern-Based Responses**: Handles general queries intelligently
- **Contextual Suggestions**: Quick-reply options for common questions
- **Seamless Fallback**: Automatic switching between specialized and general modes

---

## Project Structure

```text
CSR/
├── Frontend_CSR_Denial_Knowledge_Bot/    # React frontend application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   └── ChatBot/         # Main chat interface
│   │   ├── pages/               # Page components
│   │   │   ├── Homepage.js     # Landing page with enhanced features
│   │   │   ├── SignInpage.js   # Authentication page
│   │   │   └── SignUppage.js   # Registration page
│   │   ├── context/             # React context providers
│   │   ├── services/            # API and utility services
│   │   ├── utils/               # Performance utilities
│   │   └── styles/              # CSS modules and animations
│   ├── public/                  # Static assets
│   └── package.json             # Dependencies and scripts
├── Backend_CSR_Denial_Knowledge_Bot/     # Spring Boot backend
│   ├── src/main/java/com/denial/bot/
│   │   ├── controller/         # REST API endpoints
│   │   ├── service/           # Business logic
│   │   ├── repository/        # Data access layer
│   │   ├── entity/           # JPA entities
│   │   ├── model/            # DTOs and request models
│   │   └── config/           # Configuration classes
│   ├── src/main/resources/     # Configuration files
│   └── pom.xml               # Maven dependencies
├── AI_Model_CSR_Denial_Knowledge_Bot/    # Python AI model
│   ├── csr_ai_complete.ipynb # Jupyter notebook with model
│   └── datasets/             # Training and test data
└── README.md                 # This file
```

---

## Getting Started

### Prerequisites
- **Node.js** 16+ and npm
- **Java** 17+ and Maven 3.6+
- **Python** 3.8+ with pip
- **MySQL** 8.0+ database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CSR
   ```

2. **Frontend Setup**
   ```bash
   cd Frontend_CSR_Denial_Knowledge_Bot
   npm install
   npm start
   ```
   The application will be available at `http://localhost:3000`

3. **Backend Setup**
   ```bash
   cd Backend_CSR_Denial_Knowledge_Bot
   mvn clean install
   mvn spring-boot:run
   ```
   The API will be available at `http://localhost:8080`

4. **AI Model Setup** (Optional - for development)
   ```bash
   cd AI_Model_CSR_Denial_Knowledge_Bot
   pip install -r requirements.txt
   python app.py
   ```

### Environment Configuration

Create a `.env` file in the frontend root:
```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_JWT_SECRET=your-jwt-secret
```

Configure database in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/csr_db
spring.datasource.username=your-username
spring.datasource.password=your-password
```

---

## Usage

### For CSR Agents

1. **Sign In**: Access the system with your credentials
2. **Ask Questions**: Type natural language queries about:
   - Denial codes (e.g., "What does CO-45 mean?")
   - Plan coverage (e.g., "Is dental covered for member M12345?")
   - Member information (e.g., "What benefits does John Doe have?")
3. **Get Instant Results**: Receive structured, actionable responses

### For Administrators

1. **Monitor Performance**: Built-in performance tracking
2. **Manage Users**: Secure authentication system
3. **View Analytics**: Usage statistics and error tracking

---

## Configuration

### Frontend Configuration

Key configuration files:
- `src/config/api.js` - API endpoints
- `src/context/AuthContext.js` - Authentication context
- `src/utils/performance.js` - Performance utilities

### Backend Configuration

Key configuration files:
- `src/main/resources/application.properties` - Database and server config
- `src/main/java/com/denial/bot/config/` - Security and CORS config

### AI Model Configuration

- `csr_ai_complete.ipynb` - Model training and evaluation
- `datasets/` - Training data for denial codes and coverage

---

## Testing

### Frontend Tests
```bash
cd Frontend_CSR_Denial_Knowledge_Bot
npm test
```

### Backend Tests
```bash
cd Backend_CSR_Denial_Knowledge_Bot
mvn test
```

### Integration Tests
```bash
# Run full application stack
docker-compose up --build
```

---

## Performance Features

### Frontend Optimizations
- **Lazy Loading**: Components loaded on-demand
- **Code Splitting**: Reduced initial bundle size
- **Debouncing**: Optimized input handling
- **Memory Management**: Automatic cleanup utilities
- **Virtual Scrolling**: Efficient for large lists

### Backend Optimizations
- **Connection Pooling**: Database connection reuse
- **Caching**: Redis integration for frequent queries
- **Async Processing**: Non-blocking API responses

---

## Security

### Authentication
- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: BCrypt encryption
- **Session Management**: Automatic token refresh

### API Security
- **CORS Configuration**: Proper cross-origin setup
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Prevents abuse and DDoS

---

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check backend CORS configuration
2. **Database Connection**: Verify MySQL service and credentials
3. **Authentication Failures**: Check JWT secret and token expiration
4. **Performance Issues**: Monitor browser console for performance warnings

### Debug Mode

Enable debug logging:
```bash
# Frontend
REACT_APP_DEBUG=true npm start

# Backend
mvn spring-boot:run -Dspring-boot.run.debug=true
```

---

## Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Testing**: Maintain >80% code coverage
- **Documentation**: Update README for new features
- **Performance**: Profile changes before merging

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **React Team** - For the excellent UI library
- **Spring Boot Team** - For the robust backend framework
- **OpenAI** - For inspiration in AI integration
- **Healthcare Industry** - For domain expertise and requirements

---

## Support

For support and questions:
- **Email**: support@csr-denial-bot.com
- **Documentation**: [Wiki](https://github.com/your-org/csr-denial-bot/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/csr-denial-bot/issues)

---

## Version History

### v2.0.0 (Current)
- Enhanced UI/UX with modern animations
- Robust error handling with auto-retry
- General knowledge chatbot integration
- Performance optimizations and lazy loading
- Fully responsive design
- Accessibility improvements

### v1.0.0
- Initial release with core functionality
- Denial code lookup
- Plan coverage queries
- Member information access

---

**Built with ❤️ for Customer Service Representatives everywhere**
