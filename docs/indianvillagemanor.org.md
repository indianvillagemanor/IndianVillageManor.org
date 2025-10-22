# IVM Condos

## software for the domain indianvillagemanor.org

### This project is for the indianvillagemanor.org domain, to support the condo association for the IVM Condos in Detroit, MI.

The functions of indianvillagemanor.org include:

- Provide a static website for general information about the condo for both the residents and the public.
- Provide a secure portal for condo residents, management and site administrators to log in and access
  - Condo documents (bylaws, meeting minutes, financials, etc)
  - Maintenance requests
  - Event calendar
  - Periodic newsletters
  - Announcements
  - Mailing list management
  - Committee information and documents
- Serve mailing lists
- Maintain a database of website accounts
- Backup database, and dynamic website content securely and regularly
- Maintain a git respository on github.com that, along with the backups, contains all the code and content needed to rebuild the website from scratch in case of catastrophic failure.
- Provide recovery instructions to rebuild the website from the git repository and backups.
- Provide instructions for developers to set up a local development environment to work on the website code and content.

### Technology Stack

The technology stack for indianvillagemanor.org includes:

- Web server: Nginx
- Database: PostgreSQL
- Full-stack: Next.js with React
- Authentication: OAuth 2.0 with JWT tokens
- Static site generation: Next.js static export
- Hosting: Containers running on an ubuntu server in the cloud
- Version control: Git with GitHub
- Backup: Automated scripts using cron jobs and cloud storage (e.g., AWS S3, Google Cloud Storage)
- Mailing list manangement: ListFix
- Containerization: Docker for easy deployment and development environment setup
