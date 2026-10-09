# Day 7 Assignment: Scaling a Photo-Sharing App

## 1. Introduction

SnapShare is a photo-sharing application where users upload
photos and view a feed of photos shared by people they follow.

The purpose of this scaling plan is to design a system that
can support millions of users while maintaining good performance,
reliability, and efficient storage.

## 2. Assumptions and Traffic Estimates

### Assumptions

- Registered users: 10,000,000
- Daily active users: 10%
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- Average photo size: 2 MB
- Thumbnail size: 50 KB
- One day is approximately 100,000 seconds.
- Peak traffic is 5 times the average traffic.
- Assume 365 days per year and constant daily activity.

### Daily Active Users

10,000,000 × 10% = 1,000,000

SnapShare has approximately 1 million daily active users.

### Photo Uploads per Second

Daily uploads = 1,000,000 × 1 = 1,000,000 uploads

Average uploads per second:

1,000,000 ÷ 100,000 = 10 uploads/second

Peak uploads per second:

10 × 5 = 50 uploads/second

### Feed Views per Second

Daily feed views = 1,000,000 × 50 = 50,000,000

Average feed views per second:

50,000,000 ÷ 100,000 = 500 views/second

Peak feed views per second:

500 × 5 = 2,500 views/second

### Photo Storage per Year

Each upload requires:

2 MB + 50 KB = 2.05 MB

Daily storage:

1,000,000 × 2.05 MB = 2,050,000 MB

Yearly storage:

2,050,000 × 365 = 748,250,000 MB

Approximately 748.25 TB of storage per year.

## 3. Read-Heavy vs Write-Heavy System

SnapShare is a read-heavy application because users view
feed pages much more frequently than they upload photos.

The estimated average traffic is:
- 500 feed views per second.
- 10 photo uploads per second.

This means feed views happen approximately 50 times more
often than photo uploads.

To support this traffic, SnapShare should use:
- A CDN to deliver photos quickly.
- Redis caching to reduce repeated database queries.
- Database read replicas to handle frequent read requests.
- Multiple application servers behind a load balancer.

These components help improve performance and reduce
pressure on the main database.

## 4. Where Should Photos Be Stored?

Photos should not be stored directly inside the relational
database because image files are large and would increase
database storage requirements, backup times, and costs.

Instead, SnapShare should store original photos and
thumbnails in object storage, such as Amazon S3 or
Azure Blob Storage.

The relational database should store only photo metadata,
including:
- Photo ID
- User ID
- Photo URL or object key
- Upload date
- Caption

This approach keeps the database smaller and makes it
easier to scale photo storage independently.

## 5. SnapShare System Architecture

The following diagram shows how SnapShare handles user requests,
photo storage, database operations, and thumbnail processing.

```text
                     USERS
                       |
                       v
                +-------------+
                |     CDN     |
                +-------------+
                       |
                       v
                +---------------+
                | Load Balancer |
                +---------------+
                       |
             +---------+---------+
             |                   |
             v                   v
       +------------+      +------------+
       | App Server |      | App Server |
       |     1      |      |     2      |
       +------------+      +------------+
             |                   |
             +---------+---------+
                       |
          +------------+------------+----------------+
          |            |            |                |
          v            v            v                v
      +--------+  +----------+  +----------+  +-------------+
      | Redis  |  | Primary  |  |  Object  |  | Job Queue   |
      | Cache  |  | Database |  | Storage  |  |             |
      +--------+  +----------+  +----------+  +-------------+
                       |                             |
                       v                             v
                 +------------+               +-------------+
                 | Read       |               | Thumbnail   |
                 | Replica    |               | Worker      |
                 +------------+               +-------------+
                                                    |
                                                    v
                                              Object Storage

The CDN serves cached photos and thumbnails from locations
close to users. Requests that need application processing
continue to the load balancer and application servers.
```

## 6. Architecture Component Explanations

1. **CDN:** Delivers cached photos and thumbnails from locations closer to users to reduce loading time.

2. **Load Balancer:** Distributes incoming requests across multiple application servers to prevent overloading a single server.

3. **Application Servers:** Process user requests, manage photo uploads, and generate feed responses.

4. **Redis Cache:** Stores frequently accessed feed data temporarily to reduce database queries and improve response speed.

5. **Primary Database:** Stores user information, photo metadata, follow relationships, and other application records.

6. **Read Replica:** Handles additional database read requests to reduce pressure on the primary database.

7. **Object Storage:** Stores original photos and thumbnails separately from the relational database.

8. **Job Queue:** Holds thumbnail-generation tasks so photo uploads do not have to wait for image processing.

9. **Thumbnail Worker:** Processes queued jobs, creates smaller versions of uploaded photos, and saves them in object storage.


## 7. Step-by-Step Photo Upload Flow

1. **User selects a photo:** A user opens SnapShare and chooses a photo to upload.

2. **Request reaches the server:** The upload request passes through the load balancer, which forwards it to an available application server.

3. **User authentication:** The application server verifies that the user is logged in and checks the uploaded file.

4. **Photo storage:** The original photo is uploaded to object storage, such as Amazon S3.

5. **Save metadata:** The application server stores the photo ID, user ID, object storage key, caption, and upload time in the primary database.

6. **Create thumbnail job:** The application server sends a thumbnail-generation task to the job queue.

7. **Background processing:** A thumbnail worker receives the job, downloads the original photo from object storage, and generates a smaller 50 KB thumbnail.

8. **Store thumbnail:** The worker saves the thumbnail in object storage and updates the photo metadata in the database.

9. **Update cache:** The application invalidates or refreshes affected cached feed data so followers can see the new photo.

10. **Display photo:** When followers open their feeds, the application retrieves feed information from the cache or database, while the CDN delivers the photo and thumbnail files.

## 8. Scaling Trade-offs

### Trade-off 1: Caching vs Fresh Data

Using Redis caching improves performance because frequently
requested feed data can be retrieved without repeatedly
querying the database.

However, cached information may become outdated when users
upload or delete photos.

To reduce this problem, SnapShare should invalidate or update
affected cache entries whenever important data changes.

### Trade-off 2: Read Replicas vs Data Consistency

Database read replicas help SnapShare handle many feed requests
without overloading the primary database.

However, replicas may take some time to receive the latest
changes from the primary database.

This means users might briefly see outdated information.
Critical reads requiring the latest data should use the
primary database.

### Trade-off 3: Background Processing vs Immediate Results

Using a job queue and thumbnail worker allows photo uploads
to finish without waiting for thumbnail generation.

However, thumbnails may not be available immediately.

SnapShare can display a temporary placeholder until the
thumbnail is ready.

