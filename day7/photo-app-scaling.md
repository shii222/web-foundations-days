# Day 7 Assignment: Scaling a Photo-Sharing App

## 1. Introduction

SnapShare is a photo-sharing application where users upload photos and view a feed of photos shared by people they follow.

The purpose of this scaling plan is to design a system that can support millions of users while maintaining good performance, reliability, and efficient storage.

## 2. Assumptions and Traffic Estimates

### Assumptions

- Registered users: 10,000,000
- Daily active users: 10%
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- Average photo size: 2 MB.
- Thumbnail size: 50 KB.
- One day is approximately 100,000 seconds for estimation.
- Peak traffic is 5 times average traffic.
- Assume 365 days per year.
- Assume constant daily activity and no deletion of photos.
- Storage calculations use decimal units: 1 MB = 1,000 KB and 1 TB = 1,000,000 MB.

### Daily Active Users

Daily active users = Registered users × Active percentage

10,000,000 × 10% = 1,000,000

Therefore, SnapShare has approximately 1 million daily active users.

### Photo Uploads per Second

Daily uploads:

1,000,000 × 1 = 1,000,000 uploads per day.

Average uploads per second:

1,000,000 ÷ 100,000 = 10 uploads/second.

Peak uploads per second:

10 × 5 = 50 uploads/second.

### Feed Views per Second

Daily feed views:

1,000,000 × 50 = 50,000,000 feed views per day.

Average feed views per second:

50,000,000 ÷ 100,000 = 500 views/second.

Peak feed views per second:

500 × 5 = 2,500 views/second.

### Photo Storage per Year

Original photo size = 2 MB.

Thumbnail size = 50 KB = 0.05 MB.

Total storage per upload:

2 MB + 0.05 MB = 2.05 MB.

Daily storage:

1,000,000 × 2.05 MB = 2,050,000 MB.

Yearly storage:

2,050,000 × 365 = 748,250,000 MB.

Yearly storage in terabytes:

748,250,000 ÷ 1,000,000 = 748.25 TB.

Therefore, SnapShare requires approximately **748.25 TB of new photo and thumbnail storage per year**.

This estimate excludes database storage, backups, replication, and additional image versions.

## 3. Read-Heavy vs Write-Heavy System

SnapShare is a read-heavy application because users view feed pages much more frequently than they upload photos.

The estimated average traffic is:

- 500 feed views per second.
- 10 photo uploads per second.

Feed views happen approximately 50 times more often than photo uploads.

This means SnapShare must prioritize fast read operations and efficient photo delivery.

To support this traffic, SnapShare should use:

1. A CDN to deliver photos and thumbnails quickly.
2. Redis caching to reduce repeated database queries.
3. Database read replicas to handle frequent read requests.
4. Multiple stateless application servers behind a load balancer.
5. Object storage to manage large photo files independently.

These components improve performance and reduce pressure on the primary database.

## 4. Where Should Photos Be Stored?

Photos should not be stored directly inside the relational database because image files are large and would increase database size, backup times, and storage costs.

Large binary files can also make database maintenance and scaling more difficult.

Instead, SnapShare should store original photos and thumbnails in object storage, such as Amazon S3 or Azure Blob Storage.

The relational database should store only photo metadata, including:

- Photo ID
- User ID
- Photo object storage key
- Thumbnail object storage key
- Upload date and time
- Caption
- Processing status

This approach keeps the database smaller and allows photo storage to scale independently from application data.

## 5. SnapShare System Architecture

The following diagram illustrates the proposed architecture.

```text
                        USERS
                          |
             +------------+------------+
             |                         |
             v                         v
       +-------------+          +---------------+
       |     CDN     |          | Load Balancer |
       | Photo Files |          | API Requests  |
       +-------------+          +---------------+
             |                         |
             | Cache Miss              |
             v                         v
       +-------------+        +--------------------+
       |   Object    |        |   App Servers      |
       |   Storage   |        |  Server 1 / 2 / N  |
       +-------------+        +--------------------+
             ^                         |
             |              +----------+----------+
             |              |          |          |
             |              v          v          v
             |         +---------+ +---------+ +-----------+
             |         | Redis   | | Primary | | Job Queue |
             |         | Cache   | | Database| +-----------+
             |         +---------+ +---------+       |
             |                          |             v
             |                          v       +-------------+
             |                    +-----------+ | Thumbnail   |
             |                    | Read      | | Worker      |
             |                    | Replica   | +-------------+
             |                    +-----------+       |
             |                                        |
             +----------------------------------------+
                  Save Original / Thumbnail Files
```

Application servers store photo metadata in the primary database and can use read replicas for feed queries.

The primary database replicates data to the read replica.

The thumbnail worker retrieves original images from object storage, generates thumbnails, and saves the results back to object storage.

The CDN retrieves photos and thumbnails from object storage when they are not already cached.

## 6. Architecture Component Explanations

1. **CDN:** Delivers cached photos and thumbnails from locations closer to users to reduce image loading time.

2. **Load Balancer:** Distributes incoming API requests across multiple application servers to prevent one server from becoming overloaded.

3. **Application Servers:** Handle authentication, photo uploads, feed requests, and other application logic while keeping persistent data in shared services.

4. **Redis Cache:** Stores frequently requested feed information temporarily to reduce database queries and improve response speed.

5. **Primary Database:** Stores user records, photo metadata, follow relationships, and other application data while processing database writes.

6. **Read Replica:** Handles additional database read requests to reduce pressure on the primary database.

7. **Object Storage:** Stores original photos and thumbnails separately from the relational database.

8. **Job Queue:** Holds thumbnail-generation tasks so users do not have to wait for image processing during uploads.

9. **Thumbnail Worker:** Processes queued tasks, creates smaller versions of uploaded photos, and saves them to object storage.

## 7. Step-by-Step Photo Upload Flow

SnapShare uses asynchronous background processing so users can upload photos without waiting for thumbnail generation.

### Step 1: User Selects a Photo

The user opens SnapShare, selects a photo, adds an optional caption, and clicks the Upload button.

### Step 2: Request Reaches the Application Server

The upload request passes through the load balancer, which forwards it to an available application server.

### Step 3: Authentication and Validation

The application server verifies that the user is logged in and checks the uploaded file type and size.

Invalid uploads are rejected.

### Step 4: Store the Original Photo

The application server uploads the original 2 MB photo to object storage, such as Amazon S3.

Object storage returns an object key that identifies the saved photo.

### Step 5: Save Photo Metadata

The application server stores the following information in the primary database:

- Photo ID
- User ID
- Caption
- Upload timestamp
- Original photo object key
- Processing status

The processing status is initially set to `pending`.

The actual image file is not stored in the relational database.

### Step 6: Send a Thumbnail Job to the Queue

After saving the photo metadata, the application server creates a thumbnail-generation job.

The job contains the photo ID and original photo object key.

The application server sends the job to the message queue.

This allows thumbnail processing to happen separately from the upload request.

### Step 7: Confirm the Upload

Once the original photo and its metadata have been saved and the thumbnail job has been successfully queued, the application server confirms the upload to the user.

The user does not need to wait for the thumbnail to be generated.

### Step 8: Worker Retrieves the Job

A background thumbnail worker retrieves the job from the queue.

The worker uses the original photo object key to locate and download the photo from object storage.

### Step 9: Generate the Thumbnail

The worker resizes the original photo to create a smaller thumbnail.

The estimated thumbnail size is 50 KB.

This smaller image helps reduce bandwidth consumption and improves feed loading speed.

### Step 10: Store the Thumbnail

The worker uploads the generated thumbnail to object storage.

Object storage returns a new key identifying the thumbnail file.

### Step 11: Update Database Metadata

The worker updates the photo record in the primary database with the thumbnail object key.

It also changes the processing status from `pending` to `ready`.

After successful processing, the worker acknowledges the completed queue job.

If processing fails, the system can retry the job.

### Step 12: Update Cached Feed Information

SnapShare invalidates or refreshes affected Redis feed cache entries so followers can retrieve updated feed information.

This helps prevent users from seeing outdated cached results.

### Step 13: Display Photos Through the CDN

When followers open their feeds, application servers retrieve feed metadata from Redis or the database.

The CDN delivers cached photos and thumbnails from servers close to users.

If an image is not already cached, the CDN retrieves it from object storage.

### Step 14: Handle Thumbnail Delays

If thumbnail generation has not finished, SnapShare displays a temporary placeholder.

Once processing completes, the application can display the generated thumbnail.

This approach improves responsiveness while keeping image processing reliable.

## 8. Architectural Trade-offs

### Trade-off 1: Redis Caching vs Data Freshness

**Advantage:**

Redis caching improves feed loading speed by storing frequently requested information in memory.

It reduces repeated database queries and helps SnapShare handle approximately 500 average feed views per second and 2,500 peak feed views per second.

**Disadvantage:**

Cached information may become outdated when users upload, modify, or delete photos.

**Decision:**

SnapShare will use Redis caching for better performance while invalidating or refreshing affected cache entries after important changes.

This adds cache-management complexity but reduces database load.

### Trade-off 2: Database Read Replicas vs Data Consistency

**Advantage:**

Read replicas distribute database read traffic and reduce pressure on the primary database.

They allow SnapShare to handle more feed requests without requiring every read to access the primary database.

**Disadvantage:**

Replication is not always instantaneous.

A newly uploaded photo may briefly be missing from queries served by a read replica because of replication lag.

**Decision:**

SnapShare will accept short periods of eventual consistency for normal feed browsing.

Operations requiring the latest information will read from the primary database.

This balances scalability and consistency.

### Trade-off 3: Background Processing vs Immediate Thumbnail Availability

**Advantage:**

Using a job queue and thumbnail worker allows users to complete photo uploads without waiting for image resizing.

This improves upload response times.

**Disadvantage:**

Thumbnail generation may be delayed when workers are busy.

Jobs may also fail and require retries.

**Decision:**

SnapShare will use asynchronous thumbnail processing to improve upload responsiveness.

Failed jobs will be retried, queue backlogs will be monitored, and placeholder images will appear while thumbnails are being generated.

### Trade-off 4: CDN Performance vs Additional Cost

**Advantage:**

A CDN delivers images from locations closer to users, reducing latency and repeated requests to object storage.

**Disadvantage:**

CDN services introduce additional costs.

Cached images may also remain available briefly after the original photo has been updated or deleted.

**Decision:**

SnapShare will use a CDN because fast image delivery is essential for a photo-sharing application.

Cache expiration policies and targeted invalidation will help manage outdated content.

## 9. Conclusion

SnapShare is a read-heavy photo-sharing application supporting approximately 1 million daily active users.

The estimated traffic includes:

- 10 average photo uploads per second.
- 50 peak photo uploads per second.
- 500 average feed views per second.
- 2,500 peak feed views per second.
- Approximately 748.25 TB of new photo and thumbnail storage per year.

The proposed architecture combines a CDN, load balancer, stateless application servers, Redis cache, primary database, read replica, object storage, job queue, and thumbnail worker.

These components allow SnapShare to scale photo storage and feed delivery independently while balancing performance, consistency, reliability, and cost.

The asynchronous thumbnail-processing pipeline also improves upload responsiveness and allows background workers to scale separately as photo uploads increase.