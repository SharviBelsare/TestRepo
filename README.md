# CollabMentor - Student-Mentor Collaboration Platform

A modern, professional web application that connects students with industry mentors for project collaboration. Built with React, Tailwind CSS, and Lucide React icons.

## 🚀 Features

- **Role-based Authentication** - Separate experiences for students and mentors
- **Project Management** - Upload, track, and manage projects with integrated tools
- **Real-time Communication** - Chat, calendar integration, and notifications
- **Integrated Tools** - Miro boards, GitHub integration, and Google Calendar
- **Modern UI/UX** - Beautiful, responsive design with smooth animations
- **Base Route Configuration** - Flexible deployment with customizable base routes

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Hooks

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collaboration-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## ⚙️ Environment Configuration

The application uses environment variables for flexible configuration. Copy `env.example` to `.env` and customize the settings:

### Base Route Configuration

```bash
# Set the base route for your application
VITE_BASE_ROUTE=/

# Examples for different deployments:
# VITE_BASE_ROUTE=/collaborationtool
# VITE_BASE_ROUTE=/app
# VITE_BASE_ROUTE=/mentor-platform
```

### API Configuration

```bash
# Backend API URL (for future integration)
VITE_API_BASE_URL=http://localhost:3001/api
```

### Feature Flags

```bash
# Enable/disable integrations
VITE_ENABLE_MIRO_INTEGRATION=true
VITE_ENABLE_GITHUB_INTEGRATION=true
VITE_ENABLE_CALENDAR_INTEGRATION=true
```

### External Services

```bash
# Add your service credentials here
VITE_MIRO_APP_ID=your_miro_app_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Main navigation
│   ├── Sidebar.jsx     # Role-based sidebar
│   └── AuthModal.jsx   # Authentication modal
├── pages/              # Page components
│   ├── HomePage.jsx    # Landing page
│   ├── StudentDashboard.jsx
│   ├── MentorDashboard.jsx
│   ├── ProjectDetail.jsx
│   ├── Profile.jsx
│   └── ProjectUpload.jsx
├── config/             # Configuration utilities
│   └── index.js        # Environment and route config
└── App.jsx             # Main application component
```

## 🔧 Configuration System

The application uses a centralized configuration system in `src/config/index.js`:

### Route Management

```javascript
import { routes, buildRoute } from './config'

// Use predefined routes
<Link to={routes.studentDashboard}>Dashboard</Link>

// Build dynamic routes
<Link to={routes.projectDetail(projectId)}>View Project</Link>

// Custom base route support
const customRoute = buildRoute('/custom-path')
```

### Feature Flags

```javascript
import config from './config'

if (config.features.miroIntegration) {
  // Show Miro integration
}
```

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Base Route Deployment

To deploy with a custom base route (e.g., `/collaborationtool`):

1. **Set environment variable**:
   ```bash
   VITE_BASE_ROUTE=/collaborationtool
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy to your hosting service**:
   - The app will be accessible at `yourdomain.com/collaborationtool`
   - All routes will automatically include the base path

### Example Deployments

```bash
# Local development
VITE_BASE_ROUTE=/

# Subdirectory deployment
VITE_BASE_ROUTE=/collaborationtool

# Custom app path
VITE_BASE_ROUTE=/mentor-platform

# Enterprise deployment
VITE_BASE_ROUTE=/apps/student-mentor
```

## 🎨 Customization

### Styling

The application uses Tailwind CSS with custom utilities. Modify `src/App.css` for additional styles:

```css
@import "tailwindcss";

/* Custom styles */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Components

All components are modular and can be easily customized. Each component includes:
- Responsive design
- Accessibility features
- Hover and focus states
- Loading states

## 🔒 Security

- Environment variables are prefixed with `VITE_` for client-side access
- Sensitive data should be handled server-side
- All external integrations use secure OAuth flows

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the configuration examples

---

**Built with ❤️ for student-mentor collaboration**
