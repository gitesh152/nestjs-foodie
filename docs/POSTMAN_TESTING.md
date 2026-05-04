# Testing GraphQL API with Postman

## Setup Instructions

### Step 1: Import Collection and Environment

1. Open Postman → click **Import** (top-left)
2. Select the **Files** tab
3. Import both files:
   - [postman/nestjs-foodie.postman_collection.json](../postman/nestjs-foodie.postman_collection.json)
   - [postman/nestjs-foodie.postman_environment.json](../postman/nestjs-foodie.postman_environment.json)

### Step 2: Configure Environment Variables

1. In Postman's sidebar, click **Environments** → select **nestjs-foodie**
2. Set the following variables from your `.env` file:

| Variable          | Value (from .env)                                            |
| ----------------- | ------------------------------------------------------------ |
| `baseUrl`         | `http://localhost:3000/graphql`                              |
| `defaultPassword` | `ChangeMe123!` (from `SEED_PASSWORD`)                        |
| `adminEmail`      | (use seeded admin email, e.g., `admin@foodie.com`)           |
| `manager1Email`   | (use seeded manager email, e.g., `india.manager@foodie.com`) |
| `manager2Email`   | (use seeded manager email, e.g., `usa.manager@foodie.com`)   |
| `member1Email`    | (use seeded member email, e.g., `thanos@foodie.com`)         |
| `member2Email`    | (use seeded member email, e.g., `thor@foodie.com`)           |
| `member3Email`    | (use seeded member email, e.g., `travis@foodie.com`)         |
| `accessToken`     | _(leave empty — auto-populated on login)_                    |
| `refreshToken`    | _(leave empty — auto-populated on login)_                    |
| `restaurantId`    | _(leave empty — auto-populated from restaurants request)_    |
| `paymentMethodId` | _(leave empty — auto-populated from create payment)_         |
| `orderId`         | _(leave empty — auto-populated from create order)_           |

### Step 3: Activate Environment

1. In the top-right corner of Postman, click the **dropdown** (currently showing "No Environment")
2. Select **nestjs-foodie** to activate it

---

## Overview

This repo uses a Postman collection export to exercise the GraphQL API through HTTP `POST` requests. The collection already contains after-response scripts for token and id chaining, so you can run the requests in sequence without manually copying every value.

Use the collection at [postman/nestjs-foodie.postman_collection.json](../postman/nestjs-foodie.postman_collection.json) together with the environment file at [postman/nestjs-foodie.postman_environment.json](../postman/nestjs-foodie.postman_environment.json).

---

## Request Chaining

The collection uses Postman test scripts after a response is received. The current automation is:

- `login`, `signup`, and `refresh` save `accessToken` and `refreshToken`
- `logout` and `logoutAll` clear `accessToken` and `refreshToken`
- `Get Restaurants` saves the first restaurant id into `restaurantId`
- `Add Payment Method (Admin)` saves `paymentMethodId`
- `Create Order` saves `orderId`

That means a typical run looks like this:

1. Log in as the role you want to test.
2. Use `me` to confirm the current identity.
3. Use `refresh` when you want to rotate tokens.
4. Create a payment method as admin and reuse the returned `paymentMethodId` for checkout.
5. Create an order and reuse the returned `orderId` for add-item, checkout, and cancel requests.
6. Log out with `logout` or `logoutAll` to clear the session state.

## How To Make A GraphQL Call

1. Create a `POST` request to `{{baseUrl}}`.
2. Add the header `Content-Type: application/json`.
3. Add `Authorization: Bearer {{accessToken}}` for guarded requests.
4. Set the body mode to `GraphQL`.
5. Put the query in the GraphQL editor and variables in the variables panel.

Example request body:

```graphql
query {
  restaurants {
    id
    name
    menuItems {
      id
      name
    }
  }
}
```

Example variables:

```json
{
  "input": {
    "cardLast4": "3121",
    "brand": "MASTERCARD"
  }
}
```

## Postman Script Behavior

The collection uses these response scripts:

```javascript
// Auth requests
if (res.data.login?.accessToken) {
  pm.environment.set('accessToken', res.data.login.accessToken);
  pm.environment.set('refreshToken', res.data.login.refreshToken);
}

if (res.data.refresh?.accessToken) {
  pm.environment.set('accessToken', res.data.refresh.accessToken);
  pm.environment.set('refreshToken', res.data.refresh.refreshToken);
}

if (res.data.logout || res.data.logoutAll) {
  pm.environment.unset('accessToken');
  pm.environment.unset('refreshToken');
}

// Payment method creation
if (res.data.createPayment?.id) {
  pm.environment.set('paymentMethodId', res.data.createPayment.id);
}

// Restaurant list
if (res.data.restaurants?.[0]?.id) {
  pm.environment.set('restaurantId', res.data.restaurants[0].id);
}

// Order creation
if (res.data.createOrder?.id) {
  pm.environment.set('orderId', res.data.createOrder.id);
}
```

## Common Request Templates

### Login

```graphql
mutation Login($input: AuthLoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
  }
}
```

Variables:

```json
{
  "input": {
    "email": "{{adminEmail}}",
    "password": "{{defaultPassword}}"
  }
}
```

### Refresh Token

```graphql
mutation {
  refresh(refreshToken: "{{refreshToken}}") {
    accessToken
    refreshToken
  }
}
```

### Me

```graphql
query {
  me {
    id
    name
    email
    country
    role
  }
}
```

### Payment Method

```graphql
mutation CreatePayment($input: CreatePaymentInput!) {
  createPayment(input: $input) {
    id
    cardLast4
    brand
  }
}
```

Variables:

```json
{
  "input": {
    "cardLast4": "3121",
    "brand": "MASTERCARD"
  }
}
```

### Create Order

> If you are logged in as `ADMIN`, you must pass `country` explicitly in `CreateOrderInput`. For `MANAGER` or `MEMBER`, the order country is taken from the current user’s token and you can omit `country`.

```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    status
    country
    totalAmount
  }
}
```

Variables:

```json
{
  "input": {
    "country": "INDIA"
  }
}
```

### Restaurants and Menu

```graphql
query {
  restaurants {
    id
    name
    menuItems {
      id
      name
      price
    }
  }
}
```

```graphql
query {
  menu(restaurantId: "{{restaurantId}}") {
    id
    name
    price
  }
}
```

Variables:

```json
{
  "restaurantId": "{{restaurantId}}"
}
```

### Add Item

```graphql
mutation AddItem($input: AddItemInput!) {
  addItem(input: $input) {
    id
    status
    country
    totalAmount
    items {
      id
      quantity
      menuItemId
    }
  }
}
```

Variables:

```json
{
  "input": {
    "orderId": "{{orderId}}",
    "menuItemId": "{{menuItemId}}",
    "quantity": 1
  }
}
```

### Checkout

```graphql
mutation CheckoutOrder($input: CheckoutOrderInput!) {
  checkoutOrder(input: $input) {
    id
    status
    country
    totalAmount
    items {
      id
      quantity
      menuItemId
    }
  }
}
```

Variables:

```json
{
  "input": {
    "orderId": "{{orderId}}",
    "paymentMethodId": "{{paymentMethodId}}"
  }
}
```

### Cancel

```graphql
mutation {
  cancelOrder(orderId: "{{orderId}}") {
    id
    status
    country
    totalAmount
    items {
      id
      quantity
      menuItemId
    }
  }
}
```

Variables:

```json
{
  "orderId": "{{orderId}}"
}
```

## End-To-End Test Flows

### 1. ADMIN login, me, refresh, payment methods, logout

1. Run `auth/login` using `{{adminEmail}}` and `{{defaultPassword}}`.
2. Confirm the returned tokens are stored in `accessToken` and `refreshToken`.
3. Run `auth/me` to confirm the role and country.
4. Run `auth/refresh` to rotate tokens.
5. Run `payment/Add Payment Method (Admin)`.
6. Capture the returned `paymentMethodId` automatically.
7. Run `payment/Update Payment Method (Admin)` using `{{paymentMethodId}}`.
8. Run `auth/logout` to end the current session.
9. Run `auth/global logout` if you want to revoke all remaining sessions.

Expected behavior:

- `login`, `me`, `refresh`, `createPayment`, `updatePayment`, `logout`, and `logoutAll` should succeed for admin.
- `createPayment` stores the payment method id in `paymentMethodId`.
- `logout` clears the token variables.

### 2. MANAGER1 in COUNTRY-A

1. Run `auth/login` with `{{manager1Email}}`.
2. Run `auth/me` to confirm the manager identity.
3. Run `restaurent/Get Restaurants` and let the first restaurant id populate `restaurantId`.
4. Run `menu/Get Menu` using `{{restaurantId}}`.
5. Run `order/Create Order` without passing `country`. For manager and member users, the order country is taken from the authenticated token.

Example:

```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    status
    country
    totalAmount
  }
}
```

Variables:

```json
{
  "input": {}
}
```

6. Run `order items/Add Order Items` using `{{orderId}}` and a menu item id from the menu response.
7. Run `auth/logout`.

Expected behavior:

- `createOrder` should succeed and use COUNTRY-A from the manager token.
- `addItem` should succeed while the order is still `PENDING`.
- If you later call `checkoutOrder` on this order as manager1, it should succeed because the order belongs to COUNTRY-A.
- If you later call `cancelOrder` on this order while it is still `PENDING`, it should also succeed.

### 3. MANAGER2 in COUNTRY-B tries to act on MANAGER1 COUNTRY-A order

1. Run `auth/login` with `{{manager2Email}}`.
2. Reuse the `orderId` created by manager1.
3. Run `order/Checkout Order (Manager and Admin)`.
4. Run `order/Cancel Order (Manager and Admin)`.
5. Run `auth/logout`.

Expected behavior:

- Both requests should fail with `ForbiddenException` and the message `Managers can only access orders from their country`.
- The failure happens before the status transition because the order country does not match COUNTRY-B.

### 4. MEMBER1 in COUNTRY-A tries checkout and cancel

1. Run `auth/login` with `{{member1Email}}`.
2. Run `order/Create Order`.
3. Run `order items/Add Order Items` for that member’s order.
4. Try `order/Checkout Order (Manager and Admin)` on the member order.
5. Try `order/Cancel Order (Manager and Admin)` on the member order.
6. Run `auth/logout`.

Expected behavior:

- The order create and add-item steps should succeed.
- Checkout and cancel should fail at the role guard with `ForbiddenException: Access denied` because those mutations are restricted to ADMIN and MANAGER.
- The member cannot complete or cancel the order through those guarded mutations.

### 5. MANAGER1 checks out own COUNTRY-A order and cancels a COUNTRY-A member order

1. Log in again as `{{manager1Email}}`.
2. Use manager1’s own `orderId` and call `order/Checkout Order (Manager and Admin)`.
3. If you have a separate COUNTRY-A member order that is still `PENDING`, call `order/Cancel Order (Manager and Admin)` on that order id.
4. Run `auth/logout`.

Expected behavior:

- Manager1 can checkout their own COUNTRY-A order successfully.
- Manager1 can cancel another COUNTRY-A order successfully if it is still `PENDING`.
- If the target order is already `PAID` or `CANCELLED`, the service returns a `ForbiddenException` with `Order already processed` or `Cannot cancel order with status ...` depending on the mutation.

### 6. ADMIN creates a COUNTRY-B order, then MANAGER2 checks it out

1. Log in as admin.
2. Run `order/Create Order` with an explicit `country` value for COUNTRY-B.

Example:

```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    status
    country
    totalAmount
  }
}
```

Variables:

```json
{
  "input": {
    "country": "USA"
  }
}
```

3. Capture the returned `orderId`.
4. Add items to the admin-created order.
5. Log out.
6. Log in as `{{manager2Email}}`.
7. Run `order/Checkout Order (Manager and Admin)` on the admin-created COUNTRY-B order.
8. Run `auth/logout`.

Expected behavior:

- Admin must pass a country when creating the order.
- The order is created under COUNTRY-B even though the admin is the creator.
- Manager2 can successfully checkout the COUNTRY-B order because the country matches.

## Expected Failure Cases From The Backend

- Invalid login credentials return `UnauthorizedException: Invalid credentials`.
- Invalid refresh token return `UnauthorizedException: Invalid refresh token`.
- Admin order creation without a country returns `BadRequestException: Admin must provide country for the order`.
- Non-admin payment creation or update returns `ForbiddenException` with an admin-only message.
- Creating a payment with a non-4-digit `cardLast4` fails validation.
- Updating a payment without changes returns `BadRequestException: No fields provided to update`.
- Missing order, menu item, or payment method ids return `NotFoundException`.
- `addItem` on a finalized order returns `ForbiddenException: Cannot modify finalized order`.
- `checkoutOrder` on a finalized order returns `ForbiddenException: Order already processed`.
- `cancelOrder` on a finalized order returns `ForbiddenException: Cannot cancel order with status ...`.

## Notes

- The menu request now uses `{{restaurantId}}`, so you can either let the `Get Restaurants` request populate it automatically or override it manually in the environment.
- The collection stores auth tokens and ids automatically, so repeated test runs only need fresh login credentials and a valid seeded database.

---
