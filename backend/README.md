# Drissman Backend

Spring Boot 3 API backend with WebFlux (reactive) for the Drissman driving school platform.

## Prerequisites

- Java 21
- Docker & Docker Compose
- Maven 3.9+

## Quick Start

### 1. Start Database Services

```bash
cd backend
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 2. Run the Application

```bash
./mvnw spring-boot:run
```

Or with Maven:
```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Schools
- `GET /api/schools` - List all schools (optional `?city=` filter)
- `GET /api/schools/{id}` - Get school details with offers

### Bookings (Protected)
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user's bookings

### Health
- `GET /api/health` - Health check

## Project Structure

```
src/main/java/com/drissman/
├── api/
│   ├── controller/     # REST controllers
│   └── dto/            # Data Transfer Objects
├── domain/
│   ├── entity/         # JPA entities
│   └── repository/     # R2DBC repositories
├── security/           # JWT & Security config
├── service/            # Business logic
└── DrissmanApplication.java
```

## Configuration

See `src/main/resources/application.properties` for configuration options.

## Tech Stack
- Spring Boot 3.2
- WebFlux (Reactive)
- R2DBC PostgreSQL
- Liquibase (migrations)
- JWT (authentication)
- Redis (caching)
