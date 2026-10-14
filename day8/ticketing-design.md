
# TicketHub — Event Ticketing System Design

## 1. Requirements

### 1.1 Introduction

TicketHub is an online ticketing platform where users can browse events, select seats, purchase tickets, and manage their bookings.

The platform has 2 million registered users. It must support normal daily traffic and high demand when popular concerts go on sale.

The biggest challenge is preventing two customers from purchasing the same seat.

### 1.2 Functional Requirements

1. Users can register and log in.
2. Users can browse and search for events.
3. Users can view available seats and ticket prices.
4. Users can temporarily reserve seats during checkout.
5. Users can pay for tickets.
6. Users can view their purchased tickets.
7. Users receive booking confirmations.
8. Users can cancel eligible bookings.

### 1.3 Non-Functional Requirements

**Performance**
- Event pages should load quickly.
- Normal API requests should target responses below 300 milliseconds at the 95th percentile.
- The platform should remain responsive during popular ticket sales.

**Correctness**
- A seat must never be sold to two customers.
- Seat booking must use database transactions.
- Database constraints must prevent duplicate sales.
- Failed payments must not create confirmed tickets.

**Fairness**
- A virtual waiting room controls access during high demand.
- Seat reservations expire after a limited time.
- Rate limiting reduces automated abuse.

**Security**
- Users must authenticate before purchasing tickets.
- HTTPS protects data during transmission.
- A trusted payment provider processes payments.

**Availability and Scalability**
- Target 99.9% availability.
- Multiple application servers provide redundancy.
- Support 2 million registered users.
- Handle 200,000 buyers arriving within 10 minutes.

These are proposed design targets, not measured guarantees.


## 2. Traffic and Capacity Estimates

### 2.1 Normal Daily Traffic

TicketHub has 2,000,000 registered users.

On a normal day:
- 50,000 people visit the website.
- Each visitor views 10 pages.
- 5,000 tickets are sold.

Total page views per day:

50,000 × 10 = 500,000 page views

Average page views per second:

500,000 / 86,400 = 5.8 page views/second

Average ticket sales per second:

5,000 / 86,400 = 0.058 tickets/second

### 2.2 Popular Concert Sale

When a popular concert goes on sale:
- 200,000 people attempt to purchase tickets.
- Only 20,000 seats are available.
- Buyers arrive within 10 minutes (600 seconds).

Average buyer arrivals per second:

200,000 / 600 = 333 buyers/second

If all 20,000 seats sell within 10 minutes:

20,000 / 600 = 33.3 tickets/second

Demand compared to available seats:

200,000 / 20,000 = 10 buyers per seat

### 2.3 Traffic Comparison

| Metric | Normal Day | Popular Concert Sale |
|---|---|---|
| Visitors/buyers | 50,000 per day | 200,000 in 10 minutes |
| Average page views | 5.8 per second | Not specified |
| Buyer arrivals | Not specified | 333 per second |
| Ticket sales | 0.058 per second | Up to 33.3 per second on average |
| Seat demand | Normal | 10 buyers per seat |

If all concert seats sell within 10 minutes, the average ticket sales rate is approximately 576 times the normal daily average.

Actual peak traffic may be higher because requests can arrive in bursts.

### 2.4 How TicketHub Handles High Traffic

1. A virtual waiting room controls access to checkout.
2. A load balancer distributes traffic across application servers.
3. Redis caches event details and approximate seat availability.
4. PostgreSQL transactions prevent double-booking.
5. Rate limiting protects against excessive requests.
6. A message queue handles background notifications.
7. Monitoring and autoscaling help the system respond to demand.

The database is the authoritative source of seat ownership. Cached seat information cannot guarantee that a seat is available.


## 3. REST API Design

### 3.1 Overview

TicketHub uses a REST API to allow the frontend to communicate with the backend.

The API uses HTTPS and JSON for exchanging data.

The main HTTP methods are:

- GET: Retrieve information.
- POST: Create a new resource or perform an action.
- PATCH: Update an existing resource.
- DELETE: Remove a resource.

### 3.2 API Endpoints

| Method | Endpoint | Description | Success Status |
|---|---|---|---|
| GET | /api/events | Browse available events | 200 OK |
| GET | /api/events/{id} | View event details | 200 OK |
| GET | /api/events/{id}/seats | View seats and availability | 200 OK |
| POST | /api/holds | Temporarily reserve seats | 201 Created |
| POST | /api/orders | Create an order from a valid hold | 201 Created |
| POST | /api/orders/{id}/payment | Initiate payment for an order | 202 Accepted |
| GET | /api/orders/{id} | Check order and payment status | 200 OK |
| GET | /api/me/tickets | View purchased tickets | 200 OK |
| DELETE | /api/holds/{id} | Release a seat hold | 204 No Content |

### 3.3 Example: Browse Events

Request:

GET /api/events

Example response (200 OK):

```json
{
  "events": [
    {
      "id": 101,
      "name": "Live Music Concert",
      "venue": "National Stadium",
      "date": "2026-12-20"
    }
  ]
}
```

### 3.4 Example: View Available Seats

Request:

GET /api/events/101/seats

Example response (200 OK):

```json
{
  "eventId": 101,
  "seats": [
    {
      "seatId": 501,
      "section": "VIP",
      "seatNumber": "A1",
      "status": "available"
    },
    {
      "seatId": 502,
      "section": "VIP",
      "seatNumber": "A2",
      "status": "sold"
    }
  ]
}
```

Seat availability shown to customers is informational. Final availability must be checked atomically by the database when a hold is created.

### 3.5 Example: Hold a Seat

Request:

POST /api/holds

```json
{
  "eventId": 101,
  "seatId": 501
}
```

Successful response (201 Created):

```json
{
  "holdId": 9001,
  "seatId": 501,
  "status": "held",
  "expiresAt": "2026-12-20T15:05:00Z"
}
```

A seat hold temporarily reserves a seat for a specific customer.

Holds expire after five minutes unless the customer completes checkout.

The server determines the authenticated customer from their access token rather than trusting a user ID supplied by the browser.

### 3.6 Example: Create an Order

Request:

POST /api/orders

```json
{
  "holdId": 9001
}
```

Successful response (201 Created):

```json
{
  "orderId": 7001,
  "status": "pending_payment",
  "seatId": 501
}
```

The server verifies that the hold belongs to the authenticated customer and has not expired.

### 3.7 Example: Pay for an Order

Request:

POST /api/orders/7001/payment

```json
{
  "paymentMethod": "card",
  "paymentToken": "tok_example_123"
}
```

Example response (202 Accepted):

```json
{
  "orderId": 7001,
  "paymentStatus": "processing"
}
```

The payment provider processes the transaction.

A verified payment callback or server-side confirmation updates the order status.

The system issues a ticket only after payment is confirmed and the seat is successfully finalized.

### 3.8 Error Handling

| Status Code | Meaning | Example |
|---|---|---|
| 400 Bad Request | Invalid request | Missing seat ID |
| 401 Unauthorized | Authentication required | User not logged in |
| 403 Forbidden | Access denied | Accessing another user's order |
| 404 Not Found | Resource missing | Event does not exist |
| 409 Conflict | Seat unavailable | Another customer holds the seat |
| 410 Gone | Hold expired | Reservation time elapsed |
| 429 Too Many Requests | Rate limit exceeded | Too many booking attempts |
| 500 Internal Server Error | Unexpected server failure | Database operation failed |

### 3.9 API Security and Reliability

- Use HTTPS for all requests.
- Require authentication for holds, orders, payments, and tickets.
- Validate input on the backend.
- Check that customers own their holds and orders.
- Use idempotency keys for payment and booking requests to prevent duplicate processing.
- Apply rate limiting during high-demand sales.
- Never trust cached seat availability as proof that a seat can be purchased.

## 4. Database Design

### 4.1 Overview

TicketHub uses PostgreSQL, a relational database, to store users, events, seats, seat holds, orders, and payments.

PostgreSQL is suitable because it supports:
- Primary keys and foreign keys.
- Database transactions.
- Unique constraints.
- Reliable concurrent updates.
- Data integrity.

The most important database requirement is preventing two customers from purchasing the same seat.

### 4.2 Database Tables

#### Table 1: users

Stores registered customers.

| Column | Data Type | Constraint |
|---|---|---|
| user_id | BIGINT | Primary Key |
| full_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

#### Table 2: events

Stores concerts and other events.

| Column | Data Type | Constraint |
|---|---|---|
| event_id | BIGINT | Primary Key |
| event_name | VARCHAR(200) | NOT NULL |
| venue | VARCHAR(200) | NOT NULL |
| event_date | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

#### Table 3: seats

Stores individual seats for each event.

| Column | Data Type | Constraint |
|---|---|---|
| seat_id | BIGINT | Primary Key |
| event_id | BIGINT | Foreign Key to events |
| section | VARCHAR(50) | NOT NULL |
| seat_number | VARCHAR(20) | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| status | VARCHAR(20) | NOT NULL |
| hold_expires_at | TIMESTAMP | Nullable |

Constraints:
- UNIQUE(event_id, section, seat_number)
- CHECK(price >= 0)
- CHECK(status IN ('available', 'held', 'sold'))

#### Table 4: seat_holds

Stores temporary seat reservations.

| Column | Data Type | Constraint |
|---|---|---|
| hold_id | BIGINT | Primary Key |
| user_id | BIGINT | Foreign Key to users |
| seat_id | BIGINT | Foreign Key to seats |
| status | VARCHAR(20) | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Hold statuses include active, expired, released, and converted.

A customer can hold a seat for five minutes. Expired holds can be released by a background worker.

#### Table 5: orders

Stores ticket purchase orders.

| Column | Data Type | Constraint |
|---|---|---|
| order_id | BIGINT | Primary Key |
| user_id | BIGINT | Foreign Key to users |
| seat_id | BIGINT | Foreign Key to seats |
| hold_id | BIGINT | Foreign Key to seat_holds, UNIQUE |
| total_amount | DECIMAL(10,2) | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Order statuses include pending_payment, confirmed, failed, and cancelled.

A partial unique index on seat_id for confirmed orders prevents two confirmed purchases of the same seat.

#### Table 6: payments

Stores payment transaction information.

| Column | Data Type | Constraint |
|---|---|---|
| payment_id | BIGINT | Primary Key |
| order_id | BIGINT | Foreign Key to orders |
| provider_reference | VARCHAR(255) | UNIQUE |
| amount | DECIMAL(10,2) | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Payment statuses include pending, successful, and failed.

Sensitive card information is handled by the payment provider, not stored directly in TicketHub.

### 4.3 Database Relationships

- One user can create many seat holds.
- One user can have many orders.
- One event can have many seats.
- One seat can have multiple historical holds, but only one active hold at a time.
- One order belongs to one user and one seat.
- One order can have multiple payment attempts.

### 4.4 Entity Relationship Diagram

```text
USERS (1)
   |
   +------< SEAT_HOLDS (many)
   |             |
   |             v
   |           SEATS (many) >------ EVENTS (1)
   |             |
   +------< ORDERS (many)
                 |
                 v
             PAYMENTS (many)
```

### 4.5 How TicketHub Prevents Double-Booking

The database, not the browser or Redis cache, is responsible for guaranteeing seat ownership.

#### Step 1: Customer Selects a Seat

Two customers may see seat A1 as available at the same time.

Both customers attempt to reserve it.

#### Step 2: Atomic Conditional Update

The backend attempts to change the seat from available to held using a database transaction.

Example PostgreSQL statement:

```sql
UPDATE seats
SET status = 'held',
    hold_expires_at = NOW() + INTERVAL '5 minutes'
WHERE seat_id = 501
  AND (
      status = 'available'
      OR (
          status = 'held'
          AND hold_expires_at < NOW()
      )
  )
RETURNING seat_id;
```

Only one competing transaction can successfully claim the available seat.

If no row is returned, the seat is unavailable.

#### Step 3: Create the Seat Hold

Within the same transaction, the server creates a seat_holds record for the successful customer.

The transaction commits only after both the seat update and hold creation succeed.

If an operation fails, the transaction rolls back.

#### Step 4: Process Payment

The successful customer proceeds to checkout.

The payment provider processes the payment.

The backend verifies the payment result before confirming the order.

#### Step 5: Confirm the Seat

The backend starts another transaction.

It locks the seat and verifies:
- The hold belongs to the customer.
- The hold has not expired.
- The seat is still assigned to that hold.
- Payment has been verified.

It then marks the seat as sold and the order as confirmed.

The database uses a unique constraint or partial unique index to ensure only one confirmed order can exist for the seat.

Example:

```sql
CREATE UNIQUE INDEX unique_confirmed_seat
ON orders (seat_id)
WHERE status = 'confirmed';
```

If a conflicting confirmed order exists, the database rejects the second confirmation.

#### Step 6: Handle Failed or Expired Holds

If payment fails or the hold expires, the system releases the seat when it is safe to do so.

A background worker can clean up expired holds.

Payment confirmation and hold expiration must be coordinated to prevent an expired hold from being sold to another customer while its payment is still being finalized.

If a payment succeeds after a hold can no longer be confirmed, the system must not issue a duplicate ticket and should initiate a refund or another defined recovery process.

### 4.6 Why This Design Is Safe

The system uses three important protections:

1. **Atomic conditional updates:** Only one transaction can successfully claim an available seat.
2. **Database transactions:** Related database changes succeed together or roll back.
3. **Unique constraints:** The database prevents two confirmed orders for the same seat.

Redis may display approximate availability, but PostgreSQL remains the authoritative source.

This design prevents double-booking even when thousands of customers attempt to reserve seats simultaneously.


## 5. System Architecture

### 5.1 Architecture Overview

TicketHub uses a scalable architecture designed to handle normal traffic and sudden increases in demand during popular concert sales.

The system separates event browsing, seat reservations, payment processing, and background notifications.

### 5.2 Architecture Diagram

```text
                    +----------------------+
                    |    Web / Mobile      |
                    |       Users          |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |      DNS + CDN       |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |   Rate Limiter and   |
                    |   Virtual Waiting    |
                    |        Room          |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |     Load Balancer    |
                    +----------+-----------+
                               |
                   +-----------+-----------+
                   |                       |
                   v                       v
          +----------------+      +----------------+
          | Application    |      | Application    |
          | Server 1       |      | Server 2       |
          +--------+-------+      +--------+-------+
                   |                       |
                   +-----------+-----------+
                               |
                +--------------+--------------+
                |              |              |
                v              v              v
          +-----------+  +------------+  +-----------+
          |   Redis   |  | PostgreSQL |  | Message   |
          |   Cache   |  | Primary DB |  | Queue     |
          +-----------+  +------+-----+  +-----+-----+
                               |              |
                   +-----------+------+       v
                   |                  |  +-----------+
                   v                  v  |Background |
             +-----------+     +-----------+ Worker |
             | Read      |     | Standby   |+----------+
             | Replica   |     | Database  |
             +-----------+     +-----------+

Application Servers ----> Payment Provider
```

### 5.3 Explanation of Components

#### 1. Web and Mobile Clients

Customers use browsers or mobile devices to browse events, select seats, and purchase tickets.

#### 2. DNS and CDN

DNS directs users to TicketHub.

The CDN delivers static files such as HTML, CSS, JavaScript, and event images quickly.

This reduces traffic reaching the application servers.

#### 3. Rate Limiter and Virtual Waiting Room

The rate limiter restricts excessive requests from users or automated bots.

The virtual waiting room controls how many buyers enter checkout at once.

During a popular concert sale, 200,000 interested buyers cannot all reserve seats simultaneously.

The waiting room admits customers at a controlled rate and applies a published, consistent admission policy.

#### 4. Load Balancer

The load balancer distributes incoming API requests across healthy application servers.

If one server fails, requests can be redirected to another healthy server.

#### 5. Application Servers

Application servers handle:
- Authentication and authorization.
- Event browsing.
- Seat reservation requests.
- Order creation.
- Payment coordination.
- Business logic and input validation.

The servers should be stateless so additional instances can be added during high demand.

#### 6. Redis Cache

Redis stores frequently requested information, including event details and approximate seat availability.

Caching reduces repeated database queries.

Redis must not be used as the final authority for seat ownership.

#### 7. PostgreSQL Primary Database

The primary database stores users, events, seats, holds, orders, and payments.

It handles authoritative seat reservations and confirmed purchases.

Database transactions, atomic conditional updates, and unique constraints prevent double-booking.

#### 8. Read Replica

The read replica serves suitable read-only queries and reduces load on the primary database.

Replication lag may cause slightly outdated availability information.

All final reservation decisions must be checked against the primary database.

#### 9. Standby Database

The standby database supports recovery if the primary database fails.

Failover requires health checks, promotion procedures, and safe routing to the new primary.

#### 10. Message Queue

The message queue stores background tasks such as sending confirmation emails and generating notifications.

Durable messaging and retries help prevent tasks from being lost.

#### 11. Background Workers

Workers process queued jobs without delaying user-facing requests.

Examples include:
- Sending confirmation emails.
- Updating search indexes.
- Releasing expired seat holds.
- Processing recovery and reconciliation tasks.

#### 12. Payment Provider

A trusted payment provider securely processes payments.

TicketHub stores payment references and transaction statuses rather than raw card details.

### 5.4 How TicketHub Survives the Big Sale

During the popular concert sale:

1. The CDN serves static content without repeatedly contacting the application servers.
2. Rate limiting reduces abusive requests.
3. The virtual waiting room controls admission into the booking process.
4. The load balancer distributes admitted traffic across multiple application servers.
5. Redis reduces repeated reads for event information.
6. PostgreSQL transactions prevent two customers from holding or purchasing the same seat.
7. Background workers handle notifications outside the critical booking process.
8. Autoscaling adds application capacity as demand increases.
9. Monitoring detects overloaded services and failed components.

The waiting room should admit buyers based on measured system capacity, not simply the total number of visitors.

### 5.5 Reliability and Failure Handling

**Application server failure:**
The load balancer stops sending requests to the failed server and routes new requests to healthy instances.

**Read replica failure:**
Read requests can be routed to another healthy replica or temporarily to the primary database.

**Primary database failure:**
A standby database can be promoted using a configured failover mechanism. Recovery must prevent two database nodes from accepting conflicting writes.

**Redis failure:**
Application servers may temporarily bypass the cache and query PostgreSQL, with traffic limits to protect the database.

**Message queue failure:**
Durable outbox records can preserve pending background events until queue service is restored.

**Payment failure:**
The order remains unconfirmed. The system safely releases or expires the seat hold according to the checkout state and payment reconciliation process.

### 5.6 Monitoring

TicketHub should monitor:

- Requests per second.
- API response times.
- Application server CPU and memory.
- Database transaction failures.
- Seat reservation conflicts.
- Waiting room size and admission rate.
- Payment success and failure rates.
- Cache hit rate.
- Message queue depth.
- Database replication lag.

These measurements help engineers identify bottlenecks and maintain service reliability.


## 6. Architecture Trade-offs

### 6.1 Trade-off 1: Caching vs Data Accuracy

**Decision:** Use Redis to cache event details and approximate seat availability.

**Advantages:**
- Reduces database queries.
- Improves browsing speed.
- Helps the system handle high traffic during popular events.

**Disadvantages:**
- Cached seat availability may become outdated.
- A seat may appear available even when another customer has reserved it.

**Solution:**
Redis is used for faster browsing, but PostgreSQL remains the authoritative source for seat ownership.

Every seat reservation must be verified through an atomic database transaction.

### 6.2 Trade-off 2: Virtual Waiting Room vs User Experience

**Decision:** Use a virtual waiting room during major ticket sales.

**Advantages:**
- Prevents too many customers from accessing checkout simultaneously.
- Protects application servers and the database from overload.
- Supports a consistent and transparent admission policy.

**Disadvantages:**
- Customers may experience long waiting times.
- Some customers may leave before reaching checkout.

**Solution:**
Display queue position or estimated waiting time when reliable estimates are available.

Use a clearly communicated admission policy, such as randomized queue placement for customers present before sales open and first-come-first-served admission afterward.

### 6.3 Trade-off 3: Database Consistency vs Performance

**Decision:** Use PostgreSQL transactions and constraints for seat reservations.

**Advantages:**
- Prevents double-booking.
- Maintains accurate seat ownership.
- Ensures related database operations succeed or fail together.

**Disadvantages:**
- Transactions and row locking add database overhead.
- Highly contested seats may experience increased response times.

**Solution:**
Keep transactions short, use suitable indexes, and control checkout traffic through the waiting room.

Do not hold database transactions open while waiting for external payment processing.

### 6.4 Trade-off 4: Multiple Servers vs Infrastructure Cost

**Decision:** Deploy multiple application servers behind a load balancer.

**Advantages:**
- Improves availability.
- Supports horizontal scaling.
- Allows traffic to be redirected when a server fails.

**Disadvantages:**
- Increases hosting costs.
- Requires additional monitoring and infrastructure management.

**Solution:**
Use autoscaling to increase capacity during major sales and reduce unnecessary capacity during quieter periods.

## 7. Final Design Summary

TicketHub is designed for 2 million registered users and must handle a popular concert sale where 200,000 customers compete for 20,000 seats within 10 minutes.

The architecture uses:
- A CDN for fast delivery of static content.
- A virtual waiting room and rate limiting for traffic control.
- Multiple application servers for scalability.
- Redis for faster event browsing.
- PostgreSQL for reliable seat reservations.
- Database transactions and unique constraints to prevent double-booking.
- A message queue for background tasks.
- A payment provider for secure payment processing.

The most important design principle is that seat ownership must be enforced by the database rather than by cached information or frontend checks.

The proposed performance and reliability targets must be validated through load testing and failure testing before production deployment.
