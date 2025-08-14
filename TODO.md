# TODO

# registration reflow

- check verify Link: When an admin clicks “Verify”, the API route

  1. Sets the userVerified timestamp for the user.
  2. Sends the user a “Congratulations” email with a magic login link.

- check Deny Link:

  1. When an admin clicks “Deny”, the API route:
  2. Sends the user a “We could not verify your status” email.
  3. Note in the db that user denied

- User Login

  1. Only allow login for users with a non-null userVerified timestamp.
  2. If a user tries to log in before being verified, show a message: “Your registration is pending association approval.”

- Security

  1. Ensure the verify/deny links are single-use and expire after a reasonable time.
  2. Log admin actions for audit purposes.

- Add an admin dashboard to view and manage pending registrations.

# Other

- Make user's role a table, so that a user can have more than one role
- If a user tries to log in or register before their account is verified, give a page notifying of the status
