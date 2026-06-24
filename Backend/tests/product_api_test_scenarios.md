# Product API Test Scenarios & Verification Guide

This document outlines the test scenarios for validating the `GET /products` cursor-based pagination API, along with instructions on how to verify query correctness, prevent duplicate items, and ensure no products are missed.

---

## Test Scenario 1: Initial Page Request (First Page)

* **Objective**: Retrieve the first chunk of products sorted by newest first.
* **Request**: 
  ```http
  GET /products?limit=10
  ```
* **Expected Results**:
  1. HTTP Status `200 OK`.
  2. The response contains an array of exactly 10 products.
  3. The products are sorted by `updatedAt` in descending order. If two items share the exact same `updatedAt` timestamp, they are sorted by `_id` in descending order.
  4. The response contains a pagination block with `hasNextPage: true` and a non-null Base64 string `nextCursor`.

---

## Test Scenario 2: Sequential Page Request (Next Page)

* **Objective**: Retrieve the second page of products using the cursor returned from the first request.
* **Request**:
  ```http
  GET /products?limit=10&cursor=<nextCursor_from_scenario_1>
  ```
* **Expected Results**:
  1. HTTP Status `200 OK`.
  2. The response contains the next 10 products.
  3. **Ordering Verification**: 
     - Let $P_{last}$ be the last product from Page 1.
     - Let $P_{first}$ be the first product from Page 2.
     - Verify that either:
       - $P_{first}.updatedAt < P_{last}.updatedAt$ OR
       - ($P_{first}.updatedAt == P_{last}.updatedAt$ AND $P_{first}._id < P_{last}._id$).
  4. A new, unique `nextCursor` is returned.

---

## Test Scenario 3: Category Filtering + Pagination

* **Objective**: Ensure category filtering functions correctly combined with cursor pagination.
* **Request 1**:
  ```http
  GET /products?category=Electronics&limit=5
  ```
* **Expected Results 1**:
  1. All 5 products have `category: "Electronics"`.
  2. A valid `nextCursor` is returned.
* **Request 2**:
  ```http
  GET /products?category=Electronics&limit=5&cursor=<nextCursor_from_request_1>
  ```
* **Expected Results 2**:
  1. All products on Page 2 are in the "Electronics" category.
  2. Sequential ordering rules relative to Page 1 are preserved.

---

## Test Scenario 4: Concurrent Insertion (Adding Products While Browsing)

* **Objective**: Verify that inserting new products while a user is paginating does not cause duplicate items or skipped items.
* **Steps**:
  1. Send request: `GET /products?limit=5`. 
     - Save the last product's details ($P_{5}$) and the returned `nextCursor`.
  2. Insert 3 new products into the database. These products will have the most recent `updatedAt` timestamps (newer than $P_{5}$).
  3. Send request: `GET /products?limit=5&cursor=<nextCursor>`.
* **Expected Results**:
  1. Page 2 correctly starts with the product that immediately followed $P_{5}$ before the insertions occurred.
  2. The 3 newly inserted products are **not** present in Page 2 (they are older than the cursor's timestamp scope and are safely skipped).
  3. No duplicate products from Page 1 appear on Page 2.

---

## How to Verify No Duplicates and No Missing Products

### 1. Verification of No Duplicates
During traversal, the client stores all product IDs:
* **Check Method**:
  1. Initialize an empty array `seenIds`.
  2. Paginate through the entire dataset using `nextCursor` until `hasNextPage` is `false`.
  3. Push the `_id` of each product returned into `seenIds`.
  4. Compare the length of `seenIds` with the size of a Unique Set created from it:
     ```javascript
     const hasDuplicates = new Set(seenIds).size !== seenIds.length;
     ```
  5. If `hasDuplicates` is `false`, pagination successfully avoided returning duplicate documents.

### 2. Verification of No Missing Products
Ensure every single product in the database is fetched through the cursor traversal:
* **Check Method**:
  1. Record the database count before starting: `totalDbCount = await Product.countDocuments(query)`.
  2. Paginate through all pages using the cursor, adding each unique product `_id` to a `retrievedIds` Set.
  3. Assert that:
     ```javascript
     const allRetrieved = retrievedIds.size === totalDbCount;
     ```
  4. If `allRetrieved` is `true`, no products were missed during pagination.

### 3. Comparison vs. Offset Pagination (`skip`)
To demonstrate why cursor pagination is superior under write operations, consider this comparison:

| Scenario | Cursor Pagination | Offset Pagination (`skip`) |
| :--- | :--- | :--- |
| **New product is added at the top while user is on Page 1** | **Page 2 returns correct subsequent items.** The new product has a newer timestamp than the cursor, so it is ignored. | **Page 2 contains a duplicate.** The new product shifts all items down by 1, pushing the last item of Page 1 onto Page 2. |
| **An item is deleted from Page 1 while user is on Page 1** | **Page 2 returns correct subsequent items.** The deletion does not affect the cursor marker. | **An item is missed.** Remaining items shift up by 1. The first item of Page 2 is pulled onto Page 1, so the user misses it. |
