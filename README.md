# CoinFundIt.com Campaign Relay Server

This repository contains the source code for a simple SQLite3 Node.js server that handles backend crowdfunding or donations campaigns data processing.

## Repository Contents

- `/src` directory:
  - `config.js`: Contains server configuration settings.
  - `database.js`: Manages database connections and operations.
  - `server.js`: Initializes and starts the server.
  - `syncRelays.js`: Syncs data between relays.
  - `relays.json`: Contains list of relays.
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
- `sudo apt install ufw`
- `sudo apt install nginx`
- `sudo apt install sqlite3`
- `sudo apt install nodejs npm`
- `sudo apt install python3-certbot-nginx`

2. Clone the repository:

- `git clone https://github.com/Spl0itable/backend_invoices.git`
- `cd backend_invoices`
- `sudo npm install`
- `sudo npm install axios`
- `sudo npm install -g pm2`
- `sudo npm install request`

3. Configure nginx to act as a reverse proxy for the Node.js server.

- `sudo systemctl start nginx`
- `sudo systemctl enable nginx`

Delete the default nginx settings file:
- `sudo rm -f /etc/nginx/sites-available/default`

Use a text editor like nano to make a new one:
- `sudo nano /etc/nginx/sites-available/default`

Add the following example configuration (replace `your_domain.com` with your relay domain):

```
server{
    server_name your_domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
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

3. Ensure the pm2 process runs on boot:

- `pm2 startup systemd`

4. Confirm the server is running:

- `pm2 describe server`

(if running it will show a status of `online`)

5. Secure server with ufw

- `sudo ufw allow 22`
- `sudo ufw allow 443`
- `sudo ufw allow 3000`
- `sudo ufw enable`

6. Confirm the server is accessible

- Visit your relay server domain and see if you get the message `Cannot GET /` which is a good sign as it means the server is online and publicly accessible. (may require reboot, see step 9)

7. Sync data from other relays

- `cd src`
- `/usr/bin/node syncRelays.js`

8. Create server cron job for continuous sync

- `crontab -e`
- Select your preferred text editor, then paste the following and save:
- `*/5 * * * * /usr/bin/node /backend_invoices/src/syncRelays.js`

9. Reboot the server

# Submit Relay for Inclusion

Once the relay server is up and running, please submit a Pull Request for the `/js/relays.js` (<a href="https://github.com/Spl0itable/coinfundit/blob/main/js/relays.js">here</a>) and `relays.json` (<a href="https://github.com/Spl0itable/backend_invoices/blob/main/src/relays.json">here</a>) files.

Add your domain in the same syntax as outlined in the files:

`{ "name": "https://your_domain" },`

Once approved and merged to the production CoinFundIt.com app, your relay server will immediately begin to read/write data for all crowdfunding or donations campaigns. 

# Censorship-resistant access:

As with the <a href="https://github.com/Spl0itable/coinfundit">main repo</a> of the CoinFundIt.com app, this repo is also mirroed on IPFS. The `relays.json` file used within the `syncRelays.js` script calls the file through an IPFS gateway. In the event the gateway goes down, a new IPFS gateway can be found <a href="https://ipfs.github.io/public-gateway-checker/">here</a> and changed within the `syncRelays.js` file. 
