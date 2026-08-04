# Reflection

1. What is the difference between authentication and authorization?

    - Authentication is whether you are logged in or just visiting the site as a guest.
    - Authorization is about what permissions your account has while logged in i.e. standard user privileges or admin privileges, e.g. only admins are able to delete user accounts

2. Why should passwords be hashed instead of stored directly?

    - Database contents can be leaked by a bad actor internal to a server, or by an external hacker. 
    - If contents of the database are leaked, exposed plaintext passwords would allow anyone to use them to edit any user's data.
    - Hashing passwords ensures that in the event of a leak, passwords are still safe.

3. What information did you include in your JWT, and why?

    - User ID is recorded, which definitively distinguishes one user from another internally.
    - User email is recorded, which acts as a unique username so the user is able to determine which account to log into.
    - Password is recorded, which authenticates the user so only the one who registered the user can act on its behalf.

4. What is the difference between a 401 response and a 403 response?

    - 401 means unauthenticated (no token sent), even though the formal name for this status code is 'unauthorized'.
    - 403 means unauthorized, however the formal name for this status code is 'forbidden'. This response means your token/account does not have the proper roles to perform the requested action.

5. Where does your application perform role or ownership checks?

    - `authenticator.ts` is a middleware that checks for authentication tokens, but also performs role and ownership checks as well.
    - In the route definitions for `projects.ts` and `tasks.ts`, you will find many middleware references that all ultimately lead back to `authenticator.ts`, which itself relies upon `authService.ts` for the database queries that are used to determine authorization.

6. How are users, projects, and tasks related in your database?

    - Only *users* can interact with projects and tasks. They must be authenticated by logging in, and registering if they haven't already.
    - Projects are owned by one user each, and tasks can belong to one project and one user each.
    - Tasks can be reassigned to difference projects and different users.

7. What was the hardest part of adding authentication or authorization?

    - Understanding password hashing was straightforward for authentication, as there are clear security reasons for it.
        - However, understanding JWT and how that acts as the proof of login - this pattern eluded me for a while.
        - Because HTTP isn't imperative; that is, every request is independent from another request, then each request must declare its identity.
        - I figured this would automatically happen such that the server sees the IP who's sending the request and associate it with the previous login.
        - Understanding this declarative model where a token header is sent with every request is what took me the longest to understand
