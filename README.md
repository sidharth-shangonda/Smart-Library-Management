## Setup

1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your values
	- For Render, set `APP_URL` to your public HTTPS URL (example: `https://your-service.onrender.com`)
4. Run `node init.js` to set up the database
5. Run `node scripts/fetchCovers` to set up the book covers
5. Run `node index.js` to start the server
