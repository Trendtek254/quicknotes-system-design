QuickNotes System Architecture

1. Overview

QuickNotes is a web application that allows users to create, view, update, delete, and organize notes using tags.

The architecture is designed to support growth toward one million registered users while maintaining good performance, security, reliability, and availability.

The system uses a load-balanced application layer, caching, a primary database with a read replica, and a background job queue.

2. Functional Requirements

The system must:

1. Allow users to register, log in, and authenticate securely.
2. Allow authenticated users to create, retrieve, update, and delete their notes.
3. Allow users to organize notes using tags.
4. Ensure users can access only their own notes and authorized resources.
5. Support searching and listing notes.
6. Validate incoming requests and return appropriate HTTP status codes.
7. Process non-urgent tasks, such as notifications, asynchronously where appropriate.

3. Non-Functional Requirements

- Performance: Common note-listing requests should aim for a response time below 300 ms at the 95th percentile under normal operating conditions.
- Scalability: The system should scale horizontally by adding application servers and workers.
- Availability: Target 99.9% monthly availability, subject to the deployment and operational arrangements.
- Security: Use HTTPS, secure authentication, authorization checks, input validation, and encrypted storage where supported.
- Reliability: Back up database data and support recovery after failures.
- Consistency: Successful note writes must be persisted in the primary database before the API confirms success.
- Maintainability: Separate the client, application services, data layer, and background processing.
- Observability: Collect logs, metrics, traces, and alerts for errors, latency, resource usage, and service health.

These are design targets to validate through testing and monitoring, not guarantees.

4. Load Estimates for One Million Users

Assumptions

For an initial capacity estimate:

- Registered users: 1,000,000.
- Daily active users: 10% of registered users, or 100,000.
- Reads per active user per day: 20.
- Writes per active user per day: 2.
- Average stored note size: 2 KB, including its basic content and metadata.
- Peak traffic: 10 times average traffic.
- Storage growth estimate excludes database replicas, backups, logs, and media attachments.

Estimated traffic

Reads per day

100,000 active users × 20 reads = 2,000,000 reads per day.

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23 reads/second.

Estimated peak: approximately 230 reads/second.

Writes per day

100,000 active users × 2 writes = 200,000 writes per day.

Average writes per second:

200,000 ÷ 86,400 ≈ 2.3 writes/second.

Estimated peak: approximately 23 writes/second.

Metric| Average Estimate| Peak / Annual Estimate
Registered users| 1,000,000| 1,000,000
Daily active users| 100,000| 10% of registered users
Reads per second| 23| 230
Writes per second| 2.3| 23
New notes per year| —| 73 million
Raw note storage per year| —| Approximately 146 GB
Storage with 50% overhead| —| Approximately 219 GB

Storage calculation

200,000 notes/day × 365 days = 73,000,000 notes/year.

73,000,000 × 2 KB ≈ 146 GB/year of raw note data.

Allowing an additional 50% for indexes and database overhead gives approximately 219 GB/year.

These are planning estimates. Actual demand depends on usage patterns, note size, caching effectiveness, and peak traffic. Capacity tests should validate the assumptions before deployment.

5. Architecture Diagram

flowchart TD
    U[User / Browser] --> DNS[DNS]
    DNS --> CDN[CDN]
    CDN --> LB[Redundant Load Balancer]

    LB --> A1[Application Server 1]
    LB --> A2[Application Server 2]

    A1 --> C[Distributed Cache]
    A2 --> C

    A1 --> DB[(Primary Database)]
    A2 --> DB

    DB --> RR[(Read Replica)]

    A1 --> Q[Durable Job Queue]
    A2 --> Q

    Q --> W1[Worker 1]
    Q --> W2[Worker 2]

    W1 --> DB
    W2 --> DB

The diagram shows the logical request paths. In production, redundant infrastructure should be deployed across availability zones, and the cache, queue, load balancer, and database must be configured to avoid single points of failure.

6. Components and the Problems They Solve

1. Client / Browser: Provides the user interface for creating, viewing, and managing notes.
2. DNS: Resolves the application domain to its public entry point so users can find the service.
3. CDN: Caches eligible static assets close to users, reducing latency and origin-server traffic.
4. Load Balancer: Distributes incoming requests across healthy application servers to prevent one server from becoming overloaded.
5. Application Servers: Run API logic, validate requests, authenticate users, enforce authorization, and coordinate database operations.
6. Distributed Cache: Stores frequently requested data temporarily to reduce repeated database reads and improve response times.
7. Primary Database: Stores authoritative user, note, tag, and relationship data and handles writes.
8. Read Replica: Serves eligible read queries to reduce pressure on the primary database.
9. Durable Job Queue: Holds background tasks until workers can process them, allowing the API to avoid waiting for non-urgent work.
10. Background Workers: Process queued jobs independently, such as notifications, cleanup, or other deferred tasks.

7. GET /notes Request Flow

The following flow retrieves a user's notes.

1. The user opens the notes page in the browser.
2. DNS resolves the application domain.
3. The browser sends "GET /api/v1/notes" through the CDN and load balancer.
4. The CDN forwards the API request to the origin rather than serving a cached response containing private notes.
5. The load balancer routes the request to a healthy application server.
6. The application server validates the user's authentication and authorization.
7. The server checks the distributed cache using a key scoped to that user.
8. If the cached result is valid, the server returns it after applying any necessary authorization checks.
9. On a cache miss, the server queries the read replica when the query can tolerate replication lag; otherwise, it queries the primary database.
10. The server caches the result according to its expiration and invalidation policy.
11. The application returns "200 OK" with a JSON response containing the user's notes.
12. The browser renders the notes.

If the cache or read replica is unavailable, the application can fall back to the primary database where capacity permits.

8. POST /notes Request Flow

The following flow creates a new note.

1. The user submits the note form in the browser.
2. The browser sends "POST /api/v1/notes" with a JSON request body and authentication credentials.
3. DNS resolves the application domain, and the request passes through the CDN to the load balancer.
4. The load balancer routes the request to a healthy application server.
5. The application server authenticates the user and validates the title, body, and other allowed fields.
6. The server inserts the note into the primary database using the authenticated user's ID as the owner.
7. The database commits the transaction and returns the created note and its ID.
8. The application invalidates or updates affected cache entries so stale note lists are not served.
9. If a background action is required, the application records or publishes a durable job using a reliable delivery approach, such as a transactional outbox.
10. The API returns "201 Created" with the new note's JSON representation.
11. A background worker processes queued work independently and retries eligible transient failures.

The API must not report successful creation before the database transaction is committed. Background jobs should be idempotent so that retries do not unintentionally repeat side effects.

9. Trade-Offs

Trade-off 1: Cache performance vs. data freshness

Benefit: Caching reduces database load and can improve response times for frequently accessed notes.

Cost: Cached data can become stale, especially after note updates or deletion.

Mitigation: Use short expiration times, invalidate affected cache keys after writes, and avoid caching sensitive responses in the public CDN. For operations requiring immediate consistency, read directly from the primary database.

Trade-off 2: Read replicas vs. consistency

Benefit: Read replicas distribute read traffic and reduce pressure on the primary database.

Cost: Replication can lag behind the primary, so a recently created or updated note might not immediately appear in replica-backed queries.

Mitigation: Route consistency-sensitive reads to the primary database and monitor replication lag.

Trade-off 3: Asynchronous jobs vs. operational complexity

Benefit: A queue lets the API respond without waiting for non-urgent work to finish.

Cost: The queue and workers introduce additional infrastructure, retry handling, and possible processing delays.

Mitigation: Use durable queues, idempotent workers, bounded retries, dead-letter handling, and monitoring of queue depth and processing failures.

10. Avoiding Single Points of Failure

A single point of failure is a component whose failure can make the whole service unavailable.

The architecture reduces this risk through the following measures:

- DNS: Use a reliable DNS provider with redundant authoritative infrastructure and health-aware routing where appropriate.
- CDN: Use a provider with a distributed edge network and an origin fallback plan.
- Load balancer: Deploy redundant load-balancing infrastructure across availability zones instead of relying on one instance.
- Application servers: Run at least two instances across separate availability zones, with health checks and automatic replacement or scaling.
- Cache: Use a highly available distributed cache with replicas or managed failover; allow controlled database fallback when cache nodes fail.
- Primary database: Use automated failover to a healthy replica, maintain tested backups, and define recovery objectives.
- Read replica: Monitor replica health and lag, and fall back to the primary when safe and capacity permits.
- Queue: Use a durable, replicated queue with persistence and a documented recovery process.
- Workers: Run multiple workers so that queued jobs can continue if one worker stops.
- Monitoring: Alert on service failures, elevated latency, exhausted capacity, replication lag, and growing queue backlogs.

Database failover and cache recovery may cause temporary disruption; redundancy reduces the risk of an outage but does not eliminate every failure mode.

11. Conclusion

QuickNotes uses a layered, horizontally scalable architecture with a CDN, load balancing, multiple application servers, caching, a primary database and read replica, and asynchronous workers. The estimated traffic and storage provide a starting point for capacity planning, while redundancy, monitoring, backups, and failover help improve reliability as the application grows.

The design should be validated through load testing, security testing, backup restoration exercises, and failure simulations before production deployment.