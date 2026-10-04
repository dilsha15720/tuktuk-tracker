#!/usr/bin/env bash
set -euo pipefail

echo "This script will prompt for your MongoDB Atlas password, write a .env file, and run the seed script."
read -s -p "Enter Atlas DB password for user 'dilshasachini15720_db_user': " DBPASS
echo

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

cat > .env <<EOF
MONGODB_URI="mongodb+srv://dilshasachini15720_db_user:${DBPASS}@cluster0.iwjd3gh.mongodb.net/tuk_tracker?retryWrites=true&w=majority"
JWT_SECRET=verysecretkey
ADMIN_USER=admin
ADMIN_PASS=admin123
PORT=5000
STUDENT_ID=YOUR_STUDENT_ID_HERE
EOF

# clear the variable from this shell
unset DBPASS

echo ".env written (will not be displayed). Ensure .env is in .gitignore."

echo "Running seed script..."
npm run seed

echo "Done. If the seed succeeded, your Atlas DB now contains seeded data."
