# IndianVillageManor

Full stack for IVM Condo Website

# How to start the development server

1. Clone the repository
2. Install dependencies
3. Start the server with `npm start dev` in `ivm_app`
4. Open your browser and navigate to `http://localhost:3000`

# How to build for production

This application is Dockerized for easy production deployment. To build and run for production:

1. Build the Docker image from the Dockerfile:

   ```bash
   docker build -t ivm_app ./ivm_app
   ```

2. Prepare your environment variables:

   - Copy `ivm_app/.env.example` to `ivm_app/.env` (if it exists), or create `ivm_app/.env` and fill in all required values.

3. Run the Docker container:

   ```bash
   docker run -d -p 3000:3000 --env-file ivm_app/.env --name ivm_app ivm_app
   ```

   - This will start the app in detached mode, mapping port 3000 on your server to the app.

4. Check logs and status:
   ```bash
   docker ps
   docker logs ivm_app
   ```

- If you want to avoid using `sudo` with Docker, add your user to the `docker` group:

  ```bash
  sudo usermod -aG docker $USER
  # Log out and back in for the change to take effect.
  ```

- For HTTPS and custom domains, set up a reverse proxy (e.g., Nginx) in front of your app.

# How to deploy

## Initial Server Setup (Fresh Ubuntu Installation)

If you're starting with a fresh Ubuntu server that only has a root user, follow these steps:

1. **Update the system and install essential packages:**

   ```bash
   apt update && apt upgrade -y
   apt install -y curl wget gnupg lsb-release ca-certificates software-properties-common
   ```

2. **Create a sudo-enabled admin user:**

   ```bash
   # Create the ivm_admin user
   adduser ivm_admin

   # Add to sudo group
   usermod -aG sudo ivm_admin

   # Switch to the new user for remaining setup
   su - ivm_admin
   ```

3. **Install Docker:**

   ```bash
   # Add Docker's official GPG key
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

   # Add Docker repository
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

   # Add ivm_admin to docker group to run docker without sudo
   sudo usermod -aG docker ivm_admin

   # Start and enable Docker
   sudo systemctl start docker
   sudo systemctl enable docker

   # Log out and back in for group changes to take effect
   exit
   su - ivm_admin
   ```

4. **Install Nginx:**

   ```bash
   sudo apt install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

5. **Install PostgreSQL:**

   ```bash
   sudo apt install -y postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # Set up PostgreSQL for the application
   sudo -u postgres createuser --interactive --pwprompt ivm_app
   sudo -u postgres createdb -O ivm_app ivm_production
   sudo -u postgres createdb -O ivm_app ivm_development
   ```

   **Note:** During the `createuser` command, you'll be prompted for:

   - **"Enter password for new role"**: This is the database password for the `ivm_app` user. Choose a strong password and save it securely - you'll need it for your application's `DATABASE_URL` in the `.env` file.
   - **"Shall the new role be a superuser?"**: Answer **No** for security. A superuser has unrestricted access to the entire database system, which is unnecessary and risky for an application user.
   - **"Shall the new role be allowed to create databases?"**: Answer **No** since we're creating the databases separately.
   - **"Shall the new role be allowed to create more new roles?"**: Answer **No** for security.

   The `ivm_app` user will have sufficient permissions to read/write data in the databases we created without excessive privileges.

6. **Install additional useful packages:**

   ```bash
   sudo apt install -y git htop ufw fail2ban
   ```

7. **Configure basic firewall:**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

## Production Deployment

After completing the initial server setup:

1. **Clone the repository and set up the application:**

   ```bash
   git clone https://github.com/levis501/IndianVillageManor.git
   cd IndianVillageManor
   ```

2. **Set up environment variables:**

   ```bash
   cp ivm_app/.env.example ivm_app/.env
   # Edit .env with your production values
   nano ivm_app/.env
   ```

3. **Configure Nginx with SSL:**

   ```bash
   cd nginx
   sudo ./setup.sh

   # Obtain SSL certificates
   sudo certbot --nginx -d indianvillagemanor.org -d www.indianvillagemanor.org
   sudo certbot --nginx -d dev.indianvillagemanor.org
   ```

4. **Pull and run the Docker image from GitHub Container Registry:**

   ```bash
   # Login to GitHub Container Registry
   echo $GITHUB_TOKEN | docker login ghcr.io -u <your-github-username> --password-stdin

   # Pull and run production container
   docker pull ghcr.io/levis501/indianvillagemanor:latest
   docker run -d -p 3000:3000 --env-file ivm_app/.env --name ivm_app ghcr.io/levis501/indianvillagemanor:latest

   # Pull and run development container (optional)
   docker run -d -p 3001:3001 --env-file ivm_app/.env --name ivm_app_dev ghcr.io/levis501/indianvillagemanor:latest
   ```

5. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

# How to test

# How to setup automated database backups

# How to recover from backups
