# Drissman API Specification

Ce document définit les endpoints API nécessaires pour le backend.

---

## Authentication

### `POST /api/auth/register`
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "student" | "school_admin"
}
```

**Response:** `201 Created`
```json
{
  "user": { "id": "string", "email": "string", "role": "string" },
  "token": "string"
}
```

---

### `POST /api/auth/login`
Connexion utilisateur.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "user": { "id": "string", "email": "string", "role": "string" },
  "token": "string"
}
```

---

## Schools

### `GET /api/schools`
Liste des auto-écoles (avec filtres).

**Query Params:** `?city=&minPrice=&maxPrice=&rating=`

**Response:** `200 OK`
```json
{
  "schools": [
    {
      "id": "string",
      "name": "string",
      "address": "string",
      "city": "string",
      "rating": 4.5,
      "priceRange": { "min": 500, "max": 1200 },
      "imageUrl": "string"
    }
  ],
  "total": 42
}
```

---

### `GET /api/schools/:id`
Détails d'une auto-école.

**Response:** `200 OK`
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "rating": 4.5,
  "reviewCount": 128,
  "offers": [
    { "id": "string", "name": "Pack Permis B", "price": 850, "hours": 20 }
  ],
  "gallery": ["url1", "url2"]
}
```

---

## Bookings

### `POST /api/bookings`
Créer une réservation.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "schoolId": "string",
  "offerId": "string",
  "date": "2026-02-01",
  "time": "10:00"
}
```

**Response:** `201 Created`

---

### `GET /api/bookings`
Liste des réservations de l'utilisateur.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "string",
      "school": { "name": "string" },
      "offer": { "name": "string" },
      "date": "2026-02-01",
      "status": "confirmed" | "pending" | "cancelled"
    }
  ]
}
```

---

## Invoices

### `GET /api/invoices`
Factures de l'utilisateur.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Code (Quiz)

### `GET /api/quiz/questions`
Questions de quiz pour l'entraînement au code.

**Response:** `200 OK`
```json
{
  "questions": [
    {
      "id": "string",
      "text": "string",
      "image": "string?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0
    }
  ]
}
```

---

> [!TIP]
> Ce document servira de contrat entre le frontend et le backend.
