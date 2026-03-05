# Khalsa Dairy Backend — Node.js + Express + MongoDB

Migrated from Spring Boot + SQL. Same API contracts — zero React Native frontend changes required.

---

## Tech Stack

| Concern    | Spring Boot (before) | Node.js (now)      |
| ---------- | -------------------- | ------------------ |
| Runtime    | Java 17              | Node.js 18+        |
| Framework  | Spring Boot          | Express 4          |
| Database   | SQL (JPA/Hibernate)  | MongoDB (Mongoose) |
| Auth token | Base64 string        | JWT (jsonwebtoken) |
| Password   | Base64 encode ⚠️     | bcryptjs ✅        |
| ORM        | JPA Repository       | Mongoose           |

---

## Project Structure

```
khalsa-dairy-backend/
├── server.js                  # Entry point
├── .env.example               # Environment variable template
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js                # User schema
│   ├── Order.js               # Order schema (items as subdoc array)
│   └── Product.js             # Product schema
├── middleware/
│   ├── auth.js                # JWT protect middleware
│   └── errorHandler.js        # Global error handler
├── controllers/
│   ├── auth.controller.js
│   ├── customer.controller.js
│   ├── order.controller.js
│   ├── product.controller.js
│   ├── analytics.controller.js
│   └── phone.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── customer.routes.js
│   ├── order.routes.js
│   ├── product.routes.js
│   ├── analytics.routes.js
│   └── phone.routes.js
└── utils/
    └── asyncHandler.js
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. .env variables

```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/khalsa_dairy
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
ABSTRACTAPI_PHONE_KEY=your_key_here
ABSTRACTAPI_PHONE_URL=https://phonevalidation.abstractapi.com/v1/
```

### 4. Run

```bash
npm run dev    # development (nodemon)
npm start      # production
```

---

## API Reference

All endpoints below (except `/api/auth/*` and `/api/phone/verify`) require:

```
Authorization: Bearer <token>
```

### Auth

| Method | Route                | Body                                 | Response       |
| ------ | -------------------- | ------------------------------------ | -------------- |
| POST   | `/api/auth/register` | `{ name, phone, password, address }` | `AuthResponse` |
| POST   | `/api/auth/login`    | `{ phone, password }`                | `AuthResponse` |

**AuthResponse shape:**

```json
{
  "userId": "...",
  "name": "John",
  "phone": "9876543210",
  "address": "...",
  "token": "<JWT>",
  "message": "Login successful"
}
```

### Customers

| Method | Route                              | Notes                   |
| ------ | ---------------------------------- | ----------------------- |
| GET    | `/api/customers`                   | All customers           |
| GET    | `/api/customers/search?query=`     | Search by name or phone |
| GET    | `/api/customers/:id`               | Single customer         |
| GET    | `/api/customers/:id/orders`        | Customer's orders       |
| DELETE | `/api/customers/:id`               | Delete customer         |
| PUT    | `/api/customers/:id/toggle-active` | Toggle isActive         |

### Orders

| Method | Route                    | Notes                       |
| ------ | ------------------------ | --------------------------- |
| POST   | `/api/orders`            | Place order                 |
| GET    | `/api/orders`            | All orders (newest first)   |
| GET    | `/api/orders/:id`        | Single order                |
| PUT    | `/api/orders/:id/status` | `{ "status": "CONFIRMED" }` |
| DELETE | `/api/orders/:id`        | Delete order                |

**Order status values:** `PENDING` | `CONFIRMED` | `DELIVERED` | `CANCELLED`

**Place order body:**

```json
{
  "customerName": "John Doe",
  "phone": "9876543210",
  "address": "123 Main St",
  "total": 250.0,
  "items": [
    { "productId": "<mongoId>", "quantity": 2 },
    { "productId": "<mongoId>", "quantity": 1 }
  ]
}
```

### Products

| Method | Route               | Notes          |
| ------ | ------------------- | -------------- |
| GET    | `/api/products`     | All products   |
| POST   | `/api/products`     | Add product    |
| GET    | `/api/products/:id` | Single product |
| PUT    | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Analytics

| Method | Route                               | Notes                      |
| ------ | ----------------------------------- | -------------------------- |
| GET    | `/api/analytics/dashboard`          | 8-field stats object       |
| GET    | `/api/analytics/sales?period=TODAY` | `TODAY` / `WEEK` / `MONTH` |

### Phone Verification

| Method | Route                      | Notes               |
| ------ | -------------------------- | ------------------- |
| GET    | `/api/phone/verify?phone=` | Proxies AbstractAPI |

---

## Key Migration Changes

### 1. Password Security

- **Before:** `Base64.encode(password)` — trivially reversible, not encryption
- **After:** `bcrypt.hash(password, 12)` — industry-standard one-way hash

### 2. Auth Token

- **Before:** Base64 of `userId:phone:timestamp` — forgeable, no expiry
- **After:** Signed JWT with expiry — verifiable, tamper-proof

### 3. Order Items Storage

- **Before:** Items serialised to raw JSON string in a TEXT SQL column
- **After:** Proper subdocument array `[{ productId, quantity }]` in MongoDB
- **Benefit:** Enables real aggregations — popular products analytics now works

### 4. Popular Products (was TODO in Java)

- **Before:** `// TODO: Implement popular products` — always returned `{}`
- **After:** Fully implemented via MongoDB `$unwind` + `$group` aggregation

### 5. IDs

- **Before:** Auto-increment `Long` (1, 2, 3...)
- **After:** MongoDB `ObjectId` strings (24-char hex)
- **Frontend change needed:** Replace any hardcoded numeric id comparisons with string comparisons

---

## Frontend Migration Notes (React Native)

The only change your React Native app needs is **how to send the token**:

```js
// Before (if you were using the old token as-is):
headers: { 'Authorization': token }

// After (standard Bearer JWT):
headers: { 'Authorization': `Bearer ${token}` }
```

Everything else — routes, request bodies, response shapes — is identical.
