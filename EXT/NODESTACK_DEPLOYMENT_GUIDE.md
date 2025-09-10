# Node.js Full Stack Deployment Guide (Ubuntu)

## Table of Contents

1. [Server Preparation](#server-preparation)
2. [Install Node.js and npm](#install-nodejs-and-npm)
3. [Install MySQL](#install-mysql)
4. [Project Upload & Setup](#project-upload--setup)
5. [MySQL Database & User Setup](#mysql-database--user-setup)
6. [Install Project Dependencies](#install-project-dependencies)
7. [Build and Run Projects](#build-and-run-projects)
8. [Run as Services with PM2](#run-as-services-with-pm2)
9. [Reverse Proxy (Apache)](#reverse-proxy-apache)
10. [Update & Redeploy](#update--redeploy)

---

## 1. Server Preparation

```sh
sudo apt update && sudo apt upgrade -y
```

## 2. Install Node.js and npm

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
nvm alias default lts/*
node -v
npm -v
```

## 3. Install MySQL

```sh
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

## 4. Project Upload & Setup

- Upload your front-end and back-end project folders to the server (e.g., `/home/ubuntu/frontend` and `/home/ubuntu/backend`).
- Do **not** include `node_modules` or `dist/build` folders from local machine.

## 5. MySQL Database & User Setup

```sh
sudo mysql -u root -p
```

Inside MySQL prompt:

```sql
CREATE DATABASE myappdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'myappuser'@'localhost' IDENTIFIED BY 'mypassword';
GRANT ALL PRIVILEGES ON myappdb.* TO 'myappuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 6. Install Project Dependencies

```sh
# Front-end
cd /home/ubuntu/frontend
npm install

# Back-end
cd /home/ubuntu/backend
npm install
```

## 7. Build and Run Projects

### Front-end (React + Vite)

```sh
cd /home/ubuntu/frontend
npm run build
npm install -g serve
serve -s dist --listen 5173
```

### Back-end (NestJS)

```sh
cd /home/ubuntu/backend
npm run build
npm run start:prod
```

## 8. Run as Services with PM2

### Install PM2

```sh
npm install -g pm2
```

### Start Back-end with PM2

```sh
cd /home/ubuntu/backend
npm run build
pm run start:prod # (or)
pm2 start dist/main.js --name backend
```

### Start Front-end with PM2 (Manual Command)

```sh
cd /home/ubuntu/frontend
npm run build
pm2 start serve --name spa-frontend -- -s dist --listen 5173
```

### Save and Enable Auto-Start

```sh
pm2 save
pm2 startup
```

## 9. Reverse Proxy (Apache)

- On your public Apache server, set up a reverse proxy to your private server’s front-end and back-end:

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    # Proxy front-end
    ProxyPass / http://PRIVATE_IP:5173/
    ProxyPassReverse / http://PRIVATE_IP:5173/

    # Proxy API
    ProxyPass /api/ http://PRIVATE_IP:3000/api/
    ProxyPassReverse /api/ http://PRIVATE_IP:3000/api/
</VirtualHost>
```

- Enable required Apache modules:

```sh
sudo a2enmod proxy proxy_http ssl
sudo systemctl reload apache2
```

## 10. Update & Redeploy

- After code changes:
  - **Front-end:**
    ```sh
    cd /home/ubuntu/frontend
    npm run build
    pm2 restart spa-frontend
    ```
  - **Back-end:**
    ```sh
    cd /home/ubuntu/backend
    npm run build
    pm2 restart backend
    ```

---

**Notes:**

- Always use `pm2 save` after starting or restarting services to persist them across reboots.
- For environment variables, use `.env` files in each project as needed.
- For CORS, ensure your NestJS back-end allows requests from your front-end domain or proxy.

---

**This guide is based on your actual deployment scenario and tested solutions from our conversation.**
