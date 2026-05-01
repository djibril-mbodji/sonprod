# Capital Chicken API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new customer account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+221770000000",
  "customerType": "RETAIL",
  "address": "123 Main St",
  "city": "Dakar"
}
```

**Response:** `201 Created`
```json
{
  "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "CUSTOMER", "customerType": "RETAIL" },
  "token": "jwt-token"
}
```

### POST /auth/login
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK` — same format as register.

### GET /auth/profile
Get current user profile. **Requires auth.**

### PUT /auth/profile
Update current user profile. **Requires auth.**

---

## Product Endpoints

### GET /products
List all products. Supports pagination, filtering, and search.

**Query params:** `page`, `limit`, `category` (categoryId), `search`, `active` (true/false)

### GET /products/:id
Get a single product by ID.

### POST /products
Create a new product. **Admin only.**

**Body:**
```json
{
  "name": "Whole Live Chicken",
  "description": "Farm-raised live chicken",
  "categoryId": "uuid",
  "retailPrice": 3500,
  "wholesalePrice": 3000,
  "unit": "piece",
  "stock": 200,
  "minWholesaleQty": 20
}
```

### PUT /products/:id
Update a product. **Admin only.**

### DELETE /products/:id
Soft-delete (deactivate) a product. **Admin only.**

---

## Category Endpoints

### GET /categories
List all active categories.

### GET /categories/:id
Get category with its products.

### POST /categories
Create a category. **Admin only.**

### PUT /categories/:id
Update a category. **Admin only.**

### DELETE /categories/:id
Soft-delete a category. **Admin only.**

---

## Cart Endpoints (All require auth)

### GET /cart
Get current user's cart with calculated prices.

### POST /cart
Add item to cart.

**Body:**
```json
{
  "productId": "uuid",
  "quantity": 5
}
```

### PUT /cart/:id
Update cart item quantity.

### DELETE /cart/:id
Remove item from cart.

### DELETE /cart
Clear entire cart.

---

## Order Endpoints (All require auth)

### POST /orders
Create an order from cart items.

**Body:**
```json
{
  "deliveryAddress": "123 Main St",
  "deliveryCity": "Dakar",
  "deliveryPhone": "+221770000000",
  "paymentMethod": "CASH_ON_DELIVERY",
  "notes": "Please call before delivery"
}
```

### GET /orders
List orders. Customers see their own; admins see all.

**Query params:** `page`, `limit`, `status`

### GET /orders/:id
Get order details.

### PATCH /orders/:id/status
Update order status. **Admin/Delivery Agent only.**

**Body:**
```json
{
  "status": "CONFIRMED",
  "deliveryAgentId": "uuid"
}
```

**Status flow:** PENDING → CONFIRMED → PROCESSING → OUT_FOR_DELIVERY → DELIVERED

---

## Admin Endpoints (Admin only)

### GET /admin/dashboard
Get dashboard overview: stats, recent orders, low stock alerts.

### GET /admin/customers
List customers with pagination and search.

**Query params:** `page`, `limit`, `search`, `type` (RETAIL/WHOLESALE)

### GET /admin/customers/:id
Get customer details with order history.

### PUT /admin/customers/:id
Update customer type or active status.

### GET /admin/analytics/sales
Get sales analytics.

**Query params:** `days` (default 30)

---

## Health Check

### GET /health
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "details": [{ "field": "email", "message": "Invalid email" }]
}
```

**Status codes:**
- `400` — Validation error
- `401` — Authentication required
- `403` — Insufficient permissions
- `404` — Resource not found
- `409` — Conflict (duplicate)
- `500` — Server error
