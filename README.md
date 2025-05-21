# Express Auth Demo

A simple Express.js application demonstrating authentication and protected routes using sessions and Handlebars templates.

## Features

- Express.js server with session-based authentication
- Handlebars templating engine
- Bootstrap 5 for styling
- Public and protected routes
- Login/logout functionality

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:

```
PORT=3000
SESSION_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=development
```

3. Start the development server:

```bash
npm run dev
```

## Usage

- Visit `http://localhost:3000` to access the application
- Default login credentials:
  - Username: `admin`
  - Password: `password`

## Routes

- `/` - Home page
- `/public` - Public page (accessible to everyone)
- `/secret` - Secret page (requires authentication)
- `/login` - Login endpoint (POST)
- `/logout` - Logout endpoint (POST)
