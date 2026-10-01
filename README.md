# Linea

Linea is a full-stack website monitoring application that checks user-provided URLs on a schedule and sends email alerts when a site goes down or comes back online.

The project is designed around a separate API and worker architecture so website checks can run independently from the main application server.

**Live:** https://linea.callmedugan.dev

## Features

- Website uptime monitoring
- Configurable expected HTTP status codes
- Email alerts when a website goes down or recovers
- Passwordless magic-link authentication
- Secure session-based auth with HTTP-only cookies
- Background worker queue for scheduled checks
- SSRF-resistant URL fetching
- Per-user alert limits
- Website response-time tracking
- Error reporting for timeout, network, and unknown failures
- Responsive React dashboard
- Automatic dashboard polling for updated results

## Architecture

Linea is split into three main pieces:

### Client

A React frontend that allows users to:

- Sign in with a magic link
- Add and remove website alerts
- View current website status
- See response times and monitoring errors
- Monitor pending, up, and down states

### Server

The Express API handles:

- Authentication and sessions
- Website CRUD operations
- Worker job claiming and submission
- Email alerts
- Database access
- Rate limiting
- Business logic

### Worker

A separate Node.js worker continuously:

1. Claims due monitoring jobs from the API
2. Checks websites concurrently
3. Records status codes, response times, and errors
4. Submits results back to the server
5. Receives the next batch of work

Workers never access the database directly.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- CSS / responsive UI

### Backend

- Node.js
- TypeScript
- Express
- PostgreSQL
- Drizzle ORM
- Zod
- Argon2
- `express-rate-limit`
- `undici`
- `guarded-fetch`

### AWS / Infrastructure

- Amazon EC2
- Amazon SES
- Amazon Route 53
- Caddy
- systemd
- Linux
- nftables

## Monitoring Queue

Website checks are scheduled using the database rather than an external queue service.

Each website record contains values such as:

- `next_check_at`
- `claimed_at`
- `claim_id`
- `interval_seconds`

Workers claim jobs using PostgreSQL row locking with `FOR UPDATE SKIP LOCKED`.

A claim ID is attached to each claimed job so stale or duplicate workers cannot overwrite newer results.

If a worker disappears before completing its batch, the claim expires and the job becomes available to another worker.

This allows multiple workers to process jobs concurrently without checking the same website at the same time.

## SSRF Protection

Because Linea performs HTTP requests against user-provided URLs, website checks are isolated from the main application and protected against Server-Side Request Forgery.

Linea:

- Allows only HTTP and HTTPS URLs
- Rejects URLs containing credentials
- Blocks localhost
- Blocks loopback addresses
- Blocks private network ranges
- Blocks link-local addresses
- Blocks IPv6 private ranges
- Blocks cloud metadata endpoints
- Limits redirects
- Uses request timeouts
- Runs website checks from a separate worker instance

## Authentication

Linea uses passwordless email authentication.

1. The user enters their email address.
2. Linea generates a single-use login token.
3. A magic-link email is sent through Amazon SES.
4. The token is verified when the user follows the link.
5. Linea creates a server-side session.
6. The browser receives a secure HTTP-only session cookie.

Login tokens expire after a short period and cannot be reused.

## Status Alerts

When a worker submits a website result, the server compares the previous state with the new state.

Email notifications are sent only when a meaningful transition occurs:

- **Up → Down**
- **Down → Up**

This prevents Linea from repeatedly emailing users while a website remains in the same state.

## API

### Authentication

```http
POST /api/login
POST /api/login/verify
POST /api/logout
```

### Websites

```http
GET    /api/websites
POST   /api/websites
DELETE /api/websites/:id
```

### Worker

```http
POST /api/worker/jobs/claim
POST /api/worker/jobs/submit
```

Worker routes require a private API key and are protected separately from normal application routes.

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/callmedugan/Linea.git
cd Linea
```

### 2. Install dependencies

Install dependencies for the project workspaces:

```bash
npm install
```

If your local setup uses separate workspace installs, install dependencies inside the relevant `client`, `server`, and `worker` directories.

### 3. Configure environment variables

Create the required `.env` files or provide environment variables through your runtime.

Example server variables:

```env
PORT=8080
DATABASE_URL=postgresql://...
NODE_ENV=development

AWS_REGION=us-east-2

SESSION_COOKIE_NAME=session

WORKER_API_KEY=your-worker-api-key
```

Example worker variables:

```env
API_URL=http://localhost:8080
WORKER_API_KEY=your-worker-api-key
```

AWS credentials should be supplied through the AWS SDK credential chain, IAM roles, or your local AWS configuration rather than committed to the repository.

### 4. Set up the database

Apply the Drizzle schema to PostgreSQL:

```bash
npx drizzle-kit push
```

### 5. Run the application

Start the server, client, and worker using the scripts defined in their respective `package.json` files.

For example:

```bash
npm run dev
```

## Production Deployment

The production deployment uses two EC2 instances:

### Server VM

Runs:

- Express API
- PostgreSQL
- Built frontend
- Caddy reverse proxy
- systemd service

### Worker VM

Runs:

- Linea worker
- systemd service
- Network firewall rules
- No direct database access

Caddy handles HTTPS and reverse proxies public traffic to the Node.js application.

Amazon Route 53 manages DNS for:

```text
linea.callmedugan.dev
```

Amazon SES is used for magic-link authentication emails and website status alerts.

## Security

Linea includes several protections intended for an internet-facing monitoring service:

- SSRF-resistant outbound requests
- Worker isolation
- HTTP-only session cookies
- Single-use login tokens
- Expiring sessions
- Zod request validation
- API rate limiting
- Worker API-key authentication
- Parameterized SQL
- Job claim ownership
- Request timeouts
- Restricted worker networking

## Project Goals

Linea was built to explore backend system design beyond a traditional CRUD application.

The project focuses on:

- Distributed background work
- Reliable job claiming
- Worker isolation
- Authentication
- Secure user-controlled networking
- State transitions
- Email infrastructure
- AWS deployment
- Production-oriented backend design

## Future Improvements

Potential improvements include:

- Custom monitoring intervals
- Monitoring history and charts
- Multiple notification channels
- Additional worker instances
- Improved dashboard filtering
- Health and metrics endpoints
- Structured application logging
- Automated deployment
- Containerized workers

## License

This project is currently intended as a personal portfolio project.
