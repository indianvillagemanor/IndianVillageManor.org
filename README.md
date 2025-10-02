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

# How to test

# How to setup automated database backups

# How to recover from backups
