# KODEZI-CLI Configuration for RD Burman Tribute

## Build/Run Commands
- **Start server**: `npm start` or `node server.js`
- **Development mode**: `npm run dev` (uses nodemon for auto-reload)
- **Test**: `npm test` (currently not implemented)
- **Docker build**: `docker build -t rdburman-tribute .`
- **Docker run**: `docker-compose up -d`

## Code Style Guidelines

### General
- Node.js backend (Express) + vanilla HTML/CSS/JS frontend
- No TypeScript, no build step, no bundler
- Keep it simple and maintainable

### JavaScript Style
- Use `const` and `let`, never `var`
- Use CommonJS (`require`/`module.exports`) for Node.js backend
- Use async/await for asynchronous operations, avoid callbacks
- Use template literals for string interpolation
- Use arrow functions for callbacks and short functions

### Naming Conventions
- Variables/functions: camelCase (`audioFiles`, `getFolderContents`)
- Constants: UPPER_SNAKE_CASE (`YOUTUBE_API_KEY`, `CONFIG`)
- Files: kebab-case (`server.js`, `docker-compose.yml`)
- API routes: lowercase with hyphens (`/api/drive/folder-contents/:id`)

### Error Handling
- Always use try-catch blocks for async operations
- Log errors with descriptive context using `console.error`
- Return JSON error responses: `{ success: false, error: message }`
- Include error codes when available
- Never expose sensitive information in error messages

### API Design
- All API routes start with `/api/`
- Use RESTful conventions (GET for reads, POST for writes)
- Return consistent JSON format: `{ success: true/false, data/error: ... }`
- Include CORS headers for allowed origins
- Log all API requests with timestamp

### Comments
- Add section headers with decorative borders (see server.js examples)
- Comment complex logic and API integrations
- Document environment variables and configuration

### Dependencies
- Check package.json before adding new dependencies
- Prefer well-maintained, popular packages
- Keep dependencies minimal
