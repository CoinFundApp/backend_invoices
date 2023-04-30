# CoinFundIt.com Campaign Relay Server

This repository contains the source code for a simple SQLite3 Node.js server that handles backend crowdfunding or donation campaign data processing. The relay server uses the [nginx](https://nginx.org/) web server as a reverse proxy to handle incoming requests.

## Repository Contents

- `/src` directory:
  - `config.js`: Contains server configuration settings.
  - `database.js`: Manages database connections and operations.
  - `server.js`: Initializes and starts the server.
- `app.js`: Main entry point for the application.
- `package.json`: Lists the project's dependencies and scripts.
- `package-lock.json`: Locks down dependency versions for consistent installs.
- `server.sh`: Shell script used to start the server.

# Contribute Relay Server

If you would like to help CoinFundIt.com remain decentralized, please contribute a relay server.

## Prerequisites

- Ubuntu Linux 22.04 LTS VPS
  - `Specs`: Minimum 1 vCPU, 1GB RAM
- [Node.js](https://nodejs.org/) 14.x or higher
- [npm](https://www.npmjs.com/) 6.x or higher
- [pm2](https://pm2.keymetrics.io/) (Needed for production deployment)
- [nginx](https://nginx.org/) web server

## Installation

1. Install the dependencies:

- `sudo apt update`
- `sudo apt upgrade`
- `sudo apt install nginx`
- `sudo npm install`
- `sudo npm install -g pm2`

2. Clone the repository:

- `git clone https://github.com/Spl0itable/backend_invoices.git`
- `cd backend_invoices`

3. Configure nginx to act as a reverse proxy for the Node.js server. Create a new nginx configuration file (e.g., /etc/nginx/sites-available/default).

- `sudo systemctl start nginx`
- `sudo systemctl enable nginx`

Delete the default nginx settings file:
- `sudo rm -f /etc/nginx/sites-available/default`

Use a text editor like nano to make a new one:
- `sudo nano  /etc/nginx/sites-available/default`

Add the following example configuration (replace `data.coinfundit.com` with your relay domain):

```
server {
    server_name data.coinfundit.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
```

Restart nginx

- `sudo service nginx restart`

Use a service such as Certbot to provision a Let's Encrypt free SSL certificate for your domain, replacing `your_domain.com` with the real domain.

- `sudo certbot --nginx -d your_domain.com`

Restart nginx

- `sudo service nginx restart`

## Running the Server

1. Make the server.sh script executable:

- `chmod +x server.sh`

2. Start the server using pm2:

- `pm2 start server.sh`

3. Confirm the server is running:

- `pm2 describe server`

(if running it will show a status of `online`)

# Submit Relay for Inclusion

Once the relay server is up and running, please submit a PR for the `relay.js` file, found here: https://github.com/Spl0itable/coinfundit/blob/main/js/relays.js

Add your domain in the same syntax as outlined in the file:

`{ name: "https://your_domain.com" },`

Once approved and merged to the production CoinFundIt.com app, your relay server will immediately begin to read/write data for all crowdfunding or donation campaigns. 