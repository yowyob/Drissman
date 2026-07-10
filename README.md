# Drissman - Modern Driving School Platform

Drissman is a premium, high-performance web application designed for modern driving schools. It features a sleek "Asphalt & Steel" aesthetic with glassmorphism effects and advanced GSAP animations.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Animations**: GSAP (GreenSock Animation Platform)
- **Icons**: Lucide React
- **Theming**: Premium Light/Dark mode with glassmorphism

### Backend
- **Framework**: Spring Boot 3
- **Reactor**: Project Reactor (Reactive/WebFlux)
- **Database**: PostgreSQL (R2DBC)
- **Cache**: Redis
- **Security**: JWT Authentication

## 📂 Project Structure

- `frontend/`: Next.js application (Port 3000)
- `backend/`: Spring Boot reactive service (Port 8080)
- `docker-compose.deployment.yml`: Production orchestration for Frontend, Backend, Postgres, and Redis.

## 🛠️ Getting Started

### Local Development

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
mvn spring-boot:run
```

### Docker Deployment
The project is configured for easy deployment using Docker Compose.

```bash
docker-compose -f docker-compose.deployment.yml up --build -d
```

## 🌐 Online Access & Deployment

- **Frontend**: Optimized for deployment on [Vercel](https://vercel.com).
- **GitHub**: [japh004/aphelion-granule](https://github.com/japh004/aphelion-granule)

---
Developed with ❤️ for Drissman.
