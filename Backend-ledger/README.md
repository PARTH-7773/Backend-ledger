# Banking Ledger System

A robust backend API for a banking ledger system built with Node.js, Express, and MongoDB. This system provides secure user authentication, account management, and transaction processing with ledger-based balance tracking.

## Features

- **User Authentication**: Secure user registration and login with JWT tokens
- **Account Management**: Create and manage multiple accounts per user
- **Transaction Processing**: Transfer funds between accounts with idempotency support
- **Ledger System**: Double-entry bookkeeping with DEBIT and CREDIT entries
- **Balance Calculation**: Real-time balance calculation using MongoDB aggregation
- **Security**: Password hashing with bcryptjs, JWT authentication, token blacklisting on logout

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **UUID**: UUID v7 for idempotency keys
- **Utilities**: Cookie Parser

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd Backend-ledger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27018/Banking-ledger?directConnection=true
   JWT_SECRET=your_secret_key_here
   EMAIL_USER=your_email@example.com
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   The server will run on `http://localhost:3000`

## Project Structure

```
Backend-ledger/
├── server.js                 # Entry point
├── .env                      # Environment variables
├── src/
│   ├── app.js               # Express app configuration
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js           # Authentication logic
│   │   ├── account.controller.js        # Account management logic
│   │   └── transaction.controller.js    # Transaction processing logic
│   ├── middleware/
│   │   └── auth.middleware.js           # Authentication middleware
│   ├── models/
│   │   ├── user.model.js                # User schema
│   │   ├── account.model.js             # Account schema
│   │   ├── transaction.model.js         # Transaction schema
│   │   ├── ledger.model.js              # Ledger entries schema
│   │   └── blackList.model.js           # Token blacklist schema
│   ├── routes/
│   │   ├── auth.route.js                # Authentication routes
│   │   ├── account.route.js             # Account routes
│   │   └── transaction.route.js         # Transaction routes
│   └── services/
│       └── email.service.js             # Email notification service
```

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

---

## Authentication Endpoints

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Description**: Register a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Success Response** (Status: 201):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (Status: 422):
```json
{
  "message": "User already exists with email.",
  "status": "failed"
}
```

---

### 2. User Login

**Endpoint**: `POST /api/auth/login`

**Description**: Login with email and password

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (Status: 200):
```json
{
  "message": "John Doe login success",
  "status": "success"
}
```

**Error Response** (Status: 401):
```json
{
  "message": "Not exists user in this email",
  "status": "failed"
}
```

or

```json
{
  "message": "Wrong password",
  "status": "failed"
}
```

---

### 3. User Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: Logout user and blacklist token

**Headers**:
```
Authorization: Bearer <token>
```

or Cookie:
```
token=<token>
```

**Success Response** (Status: 200):
```json
{
  "message": "User logout successfully"
}
```

---

## Account Endpoints

### 4. Create Account

**Endpoint**: `POST /api/accounts/`

**Description**: Create a new account for the authenticated user

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{}
```

**Success Response** (Status: 201):
```json
{
  "account": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "status": "ACTIVE",
    "currency": "INR",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5. Get User Accounts

**Endpoint**: `GET /api/accounts/`

**Description**: Retrieve all accounts for the authenticated user

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (Status: 200):
```json
{
  "message": "Account fetched success.",
  "account": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "email": "user@example.com"
      },
      "status": "ACTIVE",
      "currency": "INR",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 6. Get Account Balance

**Endpoint**: `GET /api/accounts/balance/:accountId`

**Description**: Get the current balance of a specific account

**Parameters**:
- `accountId` (string, required): The ID of the account

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (Status: 200):
```json
{
  "accountId": "507f1f77bcf86cd799439012",
  "Name": "John Doe",
  "balance": 5000
}
```

**Error Response** (Status: 404):
```json
{
  "message": "Account not found"
}
```

---

## Transaction Endpoints

### 7. Create Transaction (Transfer)

**Endpoint**: `POST /api/transaction/`

**Description**: Create a new transaction to transfer funds between accounts. Uses idempotency keys to prevent duplicate transactions.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "fromAccount": "507f1f77bcf86cd799439012",
  "toAccount": "507f1f77bcf86cd799439013",
  "amount": 1000,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response** (Status: 201):
```json
{
  "message": "Transaction completed successfully",
  "transaction": {
    "_id": "507f1f77bcf86cd799439014",
    "fromAccount": "507f1f77bcf86cd799439012",
    "toAccount": "507f1f77bcf86cd799439013",
    "amount": 1000,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses**:

Missing required fields (Status: 400):
```json
{
  "message": "Please fill all the required credentials"
}
```

Invalid accounts (Status: 400):
```json
{
  "message": "Invalid fromAccount or toAccount"
}
```

Invalid amount (Status: 400):
```json
{
  "message": "Please enter a positive amounts(>= 1)."
}
```

Inactive accounts (Status: 400):
```json
{
  "message": "Both fromAccount and toAccount must be ACTIVE to process transaction"
}
```

Insufficient balance (Status: 400):
```json
{
  "message": "Insufficient balance, Current balance is 500. Requested amount is 1000"
}
```

Transaction already processed (Status: 200):
```json
{
  "message": "Transaction already processed",
  "transaction": { /* transaction object */ }
}
```

Transaction pending (Status: 200):
```json
{
  "message": "Transation is still processing"
}
```

Transaction failed (Status: 200):
```json
{
  "message": "Transaction processing failed, please retry"
}
```

Transaction reversed (Status: 200):
```json
{
  "message": "Transaction was reversed, please retry"
}
```

---

### 8. Create Initial Funds Transaction (System Only)

**Endpoint**: `POST /api/transaction/system/initial-funds`

**Description**: System endpoint to create initial funds transaction for an account. Restricted to system users only.

**Headers**:
```
Authorization: Bearer <system_token>
```

**Request Body**:
```json
{
  "toAccount": "507f1f77bcf86cd799439012",
  "amount": 10000,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Success Response** (Status: 201):
```json
{
  "message": "Initial funds transaction completed successfully",
  "transaction": {
    "_id": "507f1f77bcf86cd799439015",
    "fromAccount": "system",
    "toAccount": "507f1f77bcf86cd799439012",
    "amount": 10000,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440001",
    "status": "COMPLETED",
    "createdAt": "2024-01-15T10:40:00Z",
    "updatedAt": "2024-01-15T10:40:00Z"
  }
}
```

---

## Database Models

### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  name: String (required),
  password: String (hashed, required),
  systemUser: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Account Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  status: String (enum: ["ACTIVE", "FROZEN", "CLOSED"], default: "ACTIVE"),
  currency: String (default: "INR"),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  _id: ObjectId,
  fromAccount: ObjectId (ref: Account),
  toAccount: ObjectId (ref: Account),
  amount: Number,
  idempotencyKey: String (unique),
  status: String (enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"]),
  createdAt: Date,
  updatedAt: Date
}
```

### Ledger Model
```javascript
{
  _id: ObjectId,
  account: ObjectId (ref: Account),
  amount: Number,
  transaction: ObjectId (ref: Transaction),
  type: String (enum: ["DEBIT", "CREDIT"]),
  createdAt: Date,
  updatedAt: Date
}
```

### BlackList Model
```javascript
{
  _id: ObjectId,
  token: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Key Features Explained

### Idempotency
Transactions use idempotency keys (UUID v7) to prevent duplicate transactions. If the same idempotency key is used twice:
- **COMPLETED**: Returns the completed transaction
- **PENDING**: Returns pending status
- **FAILED**: Allows retry
- **REVERSED**: Allows retry

### Double-Entry Bookkeeping
Every transaction creates two ledger entries:
- **DEBIT**: Decreases the sender's account
- **CREDIT**: Increases the receiver's account

This ensures accounting integrity and allows for audit trails.

### Balance Calculation
Balance is calculated in real-time using MongoDB aggregation:
```
Balance = Total Credits - Total Debits
```

### JWT Authentication
- Tokens expire in 3 days
- Tokens are stored in HTTP-only cookies
- On logout, tokens are added to a blacklist

---

## Testing the API

### Using cURL

**Register a user**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Create an account**:
```bash
curl -X POST http://localhost:3000/api/accounts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{}'
```

**Get account balance**:
```bash
curl -X GET http://localhost:3000/api/accounts/balance/<accountId> \
  -H "Authorization: Bearer <token>"
```

**Create a transaction**:
```bash
curl -X POST http://localhost:3000/api/transaction/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "fromAccount": "<accountId1>",
    "toAccount": "<accountId2>",
    "amount": 100,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27018/Banking-ledger` |
| `JWT_SECRET` | Secret key for JWT signing | `529caa89ac6e418fc779c6f97055c6bb` |
| `EMAIL_USER` | Email for notifications | `your-email@gmail.com` |
| `CLIENT_ID` | OAuth client ID | `your_client_id` |
| `CLIENT_SECRET` | OAuth client secret | `your_client_secret` |
| `PORT` | Server port | `3000` |

---

## Error Handling

The API returns appropriate HTTP status codes:

| Status Code | Meaning |
|-------------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or business logic error |
| 401 | Unauthorized - Authentication failed |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |

---

## Security Considerations

1. **Password Security**: All passwords are hashed using bcryptjs
2. **JWT Authentication**: Secure token-based authentication
3. **Token Blacklisting**: Logout tokens are blacklisted
4. **Input Validation**: All inputs are validated before processing
5. **MongoDB Transactions**: Multi-document transactions ensure data consistency
6. **Idempotency**: Prevents duplicate transactions

---

## Dependencies

See `package.json` for the complete list of dependencies and their versions.

---

## Support & Contact

For issues or questions, please create an issue in the project repository.

---

## License

This project is part of the banking system learning project.
