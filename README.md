# High-Performance MERN Backend (Express + MongoDB)

A clean, production-ready Node.js and Express backend API with cursor-based pagination optimized for large-scale datasets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| ODM | Mongoose |
| Database | MongoDB |
| Config | dotenv |
| Dev tooling | Nodemon |

---

## Project Structure

```
CodeVector/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   └── productController.js   # Business logic for /products
├── models/
│   └── Product.js             # Mongoose schema + indexes
├── routes/
│   └── productRoutes.js       # Route definitions only
├── scripts/
│   └── seedProducts.js        # Bulk seed 200,000 products
├── server.js                  # App entry point
└── .env                       # Environment variables
```

---

## Database Design

The `Product` collection has three fields plus automatic timestamps:

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, trimmed |
| `category` | String | Required, one of 5 values |
| `price` | Number | Required, ≥ 0 |
| `createdAt` | Date | Auto-managed by Mongoose |
| `updatedAt` | Date | Auto-managed by Mongoose |

### Indexes

Two compound indexes are added for fast cursor pagination:

**1. `{ updatedAt: -1, _id: -1 }` — Global pagination index**

When fetching all products sorted by most-recently-updated, MongoDB needs to traverse this sort order efficiently. `_id` is appended as a tie-breaker because multiple documents can share the same `updatedAt` millisecond — without it the sort order is non-deterministic and the cursor breaks.

**2. `{ category: 1, updatedAt: -1, _id: -1 }` — Category-filtered pagination index**

Follows MongoDB's **ESR rule** (Equality → Sort → Range): the equality filter field (`category`) comes first, then the sort keys. This allows category-filtered queries to use the index directly and skip in-memory sorting entirely.

---

## Architecture & Design Decisions

### MVC Separation

Routes live in `routes/` and only map HTTP paths to controller functions. All business logic (query building, cursor encoding, DB calls) lives in `controllers/`. This keeps files focused, testable, and easy to extend.

---

### Why Cursor Pagination — Not `skip()`

#### The problem with `skip()`

`skip(offset)` tells MongoDB to scan the entire result set from position 0, count `offset` documents, and throw them away before returning results. At page 500 with 20 items per page (`skip(10000)`), MongoDB has wasted work scanning 10,000 documents it never sends to the client. This is **O(N)** and degrades linearly as the dataset or page number grows.

#### How cursor pagination works

A **cursor** is a pointer that encodes the sort-key values of the last seen document. Instead of skipping, the next query uses a range filter on the index:

```
updatedAt < cursor.updatedAt
OR (updatedAt == cursor.updatedAt AND _id < cursor.id)
```

MongoDB performs an **index seek** — it jumps directly to that position without scanning anything before it. This is **O(1)** regardless of how deep into the dataset you paginate.

| | `skip()` | Cursor Pagination |
|---|---|---|
| Complexity | O(N) | O(1) |
| Performance at page 10,000 | Very slow | Same as page 1 |
| Duplicates on concurrent writes | Yes | No |
| Missing items on concurrent deletes | Yes | No |

#### Cursor encoding

The cursor is a Base64 string containing `{ updatedAt, id, snapshotTime }`. Base64 makes it URL-safe and opaque to the client.

---

### Why `snapshotTime` Was Added

Consider this scenario without a snapshot:

1. User loads page 1 (newest 20 products).
2. Product #50,000 (currently on page 2,500) gets updated — its `updatedAt` is now the newest in the collection.
3. User requests page 2. Without a snapshot, this product now appears at the top, **duplicating** it.

`snapshotTime` is set to the server time at the moment the user loads **page 1** and is embedded in every subsequent cursor. All queries restrict to `updatedAt <= snapshotTime`, so updates made after the user started browsing are invisible to their session. The user gets a consistent, stable view of the data until they explicitly refresh.

---

### Why Bulk Insert for Seeding

The seed script inserts 200,000 records in batches of 20,000 using `insertMany()`:

- **Single inserts** require 200,000 network round-trips and 200,000 separate write journal flushes inside MongoDB.
- **`insertMany()`** sends an entire batch in one network packet and one journal operation.
- **Batching at 20,000** keeps the Node.js V8 heap well under the out-of-memory threshold and stays within MongoDB's 16 MB BSON document limit per request.

---

## API Endpoints

### `GET /products`

Returns products sorted by `updatedAt` descending with optional category filtering and cursor-based pagination.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | Number | No | Items per page (1–20, default 20) |
| `category` | String | No | Filter by: `Electronics`, `Clothing`, `Books`, `Sports`, `Home` |
| `cursor` | String | No | Base64 cursor from the previous page's `nextCursor` |

**Sample — First Page**
```
GET /products?limit=5&category=Electronics
```

**Sample — Next Page**
```
GET /products?limit=5&category=Electronics&cursor=eyJ1cGRhdGVkQXQiOi...
```

**Response**
```json
{
  "success": true,
  "count": 5,
  "products": [
    {
      "_id": "64968412ff284a0d9cde83b4",
      "name": "Wireless Headphones #42",
      "category": "Electronics",
      "price": 99.99,
      "createdAt": "2026-06-24T05:00:00.000Z",
      "updatedAt": "2026-06-24T05:00:00.000Z"
    }
  ],
  "pagination": {
    "nextCursor": "eyJ1cGRhdGVkQXQiOiIyMDI2LTA2...",
    "hasNextPage": true
  }
}
```

---

## Setup & Installation

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment variables**

Create a `.env` file based on `.env.example`:
```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mern_db
NODE_ENV=development
```

---

## Running the Project

**Seed the database** (inserts 200,000 products):
```bash
npm run seed
```

**Start in development** (auto-restart on file changes):
```bash
npm run dev
```

**Start in production:**
```bash
npm start
```

---

## Future Improvements

1. **Rate Limiting** — Add `express-rate-limit` to protect endpoints from abuse.
2. **Caching** — Integrate Redis to cache page 1 responses and reduce DB load.
3. **Authentication** — JWT-based auth for write operations (create, update, delete).
4. **Validation** — Replace manual checks with `zod` or `joi` for request validation.
5. **Containerization** — Add `Dockerfile` + `docker-compose.yml` for portable deployment.
