# Lessons Learned

## To John Smith, CEO

I am grateful for your continued support and trust in our development team, despite the delays. You've asked me to elaborate on some technical details so you can determine better estimates in the future.

Developing server software is a delicate, patient endeavor. To an outsider, the issues developers spend their time dealing with with can seem incongruent with their goals.

- Why, Grant, did you spend three hours yesterday messing with code that ultimately did not effect change to program inputs or outputs?

  - "If it ain't broke, don't fix it" you say; but that first prototype only worked the same under those narrow conditions we first tested on. Sure, users can create and delete tasks just like in the initial demonstration, but now users can only delete tasks that they are authorized to, i.e. their own, rather than any task at all.

  - If we hadn't spent time developing proper authorization, or even just ensuring that users have to be logged in (authenticated) to perform useful actions, then the feature would be *worse than* useless upon release because it would take only one bad actor to undo every user's work.

  - Further, requiring cryptographic hashing of passwords before storing them in the database prevents future disasters where one database hack or leak causes all user accounts to be compromised.

- Why is the setup complicated just to use the software?

  - You can't just run 1 command, you need to run anywhere from 4 to 6 depending on if it's the first time setting it up. This is a tradeoff between flexibility and ease of use, as most of those commands are for configuring the database. Sure, there could just be 1 command, but then it would pigeonhole the user into one terminal and one database software rather than letting them make that decision.

- I noticed there was a two hour gap between your commits, followed by a commit message that simply read "fixed."

  - Sometimes we make mistakes. Switching to using TypeScript from JavaScript took some getting used to, and I had to learn some new skills to abide by the new rules, specifically how generic type declarations work. I spent most of those two hours just trying to get the red squiggly lines to disappear, but by the end of it I could dedicate half of a file to defining just the right types to support a function that can allow a variety of parameter types.
  
  - I also learned that I can annotate functions with their own custom types rather than needing to annotate the types on each individual parameter, which made denoting middleware functions much easier.

- What advice would you give to your past self before developing this software?

  - I would say to write the tests *early*. You think you're super smart, and perhaps you are capable of writing software that you don't test until hundreds of lines and hours through the night later. But it is worthwhile to slow down and write the endpoint tests right after the implementation, both to meet the requirements and test security. If you move too quickly, you will forget something, and need to spend extra time refreshing yourself later on when you do eventually write the tests.

One security risk that persists in this softeare is that it does not use HTTPS, which means that it is subject to 'man-in-the-middle' attacks. While someone can't do much with the password hashes that would come from a database leak, all it would take is for someone to sneak in a new piece of middleware that sniffs plaintext passwords at login to prove those password hashes pointless.

## From Grant Fink, CTO
