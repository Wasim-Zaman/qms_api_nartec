# QMS API (Queue Management System)

A robust Queue Management System API built with Node.js, Express, Prisma, and WebSocket for real-time updates.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 User Management (Admin & Department Users)
- 🏥 Department Management
- 👨‍👩‍👦 Patient Queue Management
- 🔄 Real-time Updates via WebSocket
- 📄 PDF Ticket Generation
- 🏥 Vital Signs Recording
- 📊 Patient State Tracking
- 📝 Swagger API Documentation

## Prerequisites

- Node.js (v14 or higher)
- SQL Server
- Redis Server
- npm or yarn

## Project Structure

qms_api/
├── assets/ # Static assets (images, etc.)
├── prisma/
│ └── schema/ # Prisma schema definitions
├── src/
│ ├── config/ # Configuration files
│ ├── controllers/ # Route controllers
│ ├── docs/ # Swagger documentation
│ ├── middlewares/ # Express middlewares
│ ├── routes/ # Route definitions
│ ├── schemas/ # Validation schemas
│ ├── services/ # Business logic
│ ├── utils/ # Utility functions
│ └── view/ # PDF templates
├── uploads/ # Uploaded files and generated

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DOMAIN="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

# Database Configuration
DATABASE_URL="sqlserver://host;database=QMS;user=username;password=password;trustServerCertificate=true"

# Email Configuration
EMAIL_FROM="your-email@domain.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_APP_PASSWORD="your-app-specific-password"

# JWT Configuration
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRY="1d"
JWT_REFRESH_EXPIRY="7d"

# Redis Configuration
REDIS_HOST="your-redis-host"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# Super Admin
SUPER_ADMIN_EMAIL="admin@qms.com"
SUPER_ADMIN_PASSWORD="admin"

# Sentry
SENTRY_DSN="your-sentry-dsn"
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/qms_api.git
cd qms_api
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma Client:

```bash
npx prisma generate
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the server:

```bash
npm run dev    # Development
npm start      # Production
```

## CI/CD with Jenkins

The project uses Jenkins for continuous integration and deployment. Two Jenkinsfile configurations are available:

### Initial Deployment (Jenkinsfile-initial)

The initial deployment pipeline:

1. Checks out the code from the GitHub repository
2. Sets up environment variables from a secure location
3. Manages PM2 processes:
   - Stops and deletes existing PM2 processes if running
   - Installs dependencies with `npm ci` for clean installation
   - Generates Prisma client files
   - Creates new PM2 processes for the main app and workers
   - Saves the PM2 configuration

### Subsequent Deployments (Jenkinsfile)

For regular updates after initial deployment:

1. Checks out the latest code
2. Updates environment variables
3. Manages PM2 processes:
   - Temporarily stops the running processes
   - Updates dependencies with `npm install`
   - Regenerates Prisma client files
   - Restarts the existing PM2 processes
   - Saves the updated PM2 configuration

### Jenkins Environment Setup

The Jenkins pipeline requires:

- PM2 installed globally on the Jenkins agent
- Node.js and npm installed on the Jenkins agent
- Environment file stored at a secure location (`C:\ProgramData\Jenkins\.jenkins\jenkinsEnv\qms-v2-backend`)
- GitHub credentials configured in Jenkins

## API Documentation

Access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## WebSocket Events

### Server to Client

- `connection`: Initial connection success
- `patient-call`: Patient called by department

### Client to Server

- Connect to WebSocket:

```javascript
const ws = new WebSocket("ws://localhost:3000");
```

## API Endpoints

### Authentication

- `POST /api/v1/user/register` - Register new user
- `POST /api/v1/user/login` - User login
- `POST /api/v1/user/refresh-token` - Refresh JWT token

### Departments

- `GET /api/v1/departments` - List all departments
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments/:deptcode` - Get department
- `PUT /api/v1/departments/:deptcode` - Update department
- `DELETE /api/v1/departments/:deptcode` - Delete department

### Patients

- `GET /api/v1/patients` - List all patients
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/patients/:id` - Get patient
- `PUT /api/v1/patients/:id` - Update patient
- `DELETE /api/v1/patients/:id` - Delete patient
- `POST /api/v1/patients/:id/vital-sign` - Add vital signs
- `PATCH /api/v1/patients/:id/toggle-call` - Toggle patient call status
- `PATCH /api/v1/patients/:id/assign-department` - Assign department

## Error Handling

The API uses standardized error responses:

```json
{
  "status": 400,
  "success": false,
  "message": "Error message",
  "data": null
}
```

## Security Features

- JWT Authentication
- Password Hashing
- CORS Protection
- Rate Limiting
- Error Logging (Sentry)
- Input Validation
- Secure Headers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
