# Demo artifacts for Tuk Tracker API

Files in this folder:
- `postman_collection_full.json` - Postman collection to import (contains Auth step that saves JWT)
- `curl_examples.md` - curl commands to test the API

How to run the demo locally
1. Seed the database (recommended):

   Run the helper script which prompts for your Atlas password and seeds the DB:

   ```bash
   ./scripts/set_env_and_seed.sh
   ```

   Or manually edit `.env` and run:

   ```bash
   npm run seed
   ```

2. Start the server:

```bash
npm start
```

3. Import the Postman collection:
- Open Postman → Import → choose `postman_collection_full.json`
- Run `Auth -> Admin Login` to get a token; the collection test will save it into collection variable `jwt_token` automatically.
- Run the protected requests (Create Route, Create Tuk, Update Tuk Location).

4. Curl examples are in `curl_examples.md` (use `jq` to pretty print JSON).

Packaging script
- Run `demo/create_demo_zip.sh` to generate `tuk-tracker-demo.zip` containing the demo files and README.
