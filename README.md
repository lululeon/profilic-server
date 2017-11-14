# profilic-server
A very basic, unopinionated, schema-less _user-profiles-as-a-service_ server.

## Not intended for general use
This module is in its infancy, and is part of a learning exercise. It is neither stable nor secure. In other words, use/fork at your own (considerable) risk.

## API endpoints for profilic-server.
Proper documentation to come.

- GET /api/v1/profiles/
- GET /api/v1/profiles/:username
- PUT /api/v1/profiles/filter/:fieldname
- POST /api/v1/profiles/create
- POST /api/v1/profiles/signup
- POST /api/v1/profiles/link
- PUT /api/v1/profiles/update
- PUT /api/v1/profiles/updatelist
- PUT /api/v1/profiles/login
- POST /api/v1/profiles/auth
- DELETE /api/v1/profiles/:id

profilic-client is in the works.