# profilic-server
A very basic, unopinionated, schema-less _user-profiles-as-a-service_ server.

## Not intended for general use
This module is in its infancy, and is part of a learning exercise. It is neither stable nor secure. In other words, use/fork at your own (considerable) risk.

### How to use profilic server in standalone mode:
After installing the package, simply type:
```> profilic```

### How to use profilic server in inline mode:
You can fold profilic into your express application fairly easily. An example express app setup is shown below:
```
const express = require('express');
const app = express();
const profilicServer = require('profilic-server'); 

//configure it to run inline: pass 'true' to the second argument (inlineMode)
profilicServer.configureExpressApp(app, true);
app.get('/', (req, res) => res.send('Hello World!'));

app.listen(3000, () => console.log('Example app listening on port 3000!'));
```

The API routes for user management will now be in place.

## API endpoints for profilic-server.
Proper documentation to come.

- GET /api/v1/profiles/
- GET /api/v1/profiles/:username
- PUT /api/v1/profiles/filter/:fieldname
- POST /api/v1/profiles/create
- POST /api/v1/profiles/signup
- POST /api/v1/profiles/link
- DELETE /api/v1/profiles/link
- PUT /api/v1/profiles/update
- PUT /api/v1/profiles/updatelist
- PUT /api/v1/profiles/update/micro
- PUT /api/v1/profiles/login
- POST /api/v1/profiles/auth
- DELETE /api/v1/profiles/:id

profilic-client is in the works.