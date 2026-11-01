# echo

A test fixture, never in a lesson. It shows one thing: the learner's `subject` with its publisher, from the start
(`session.start.subject`, SDK 0.3.3), or `none`. Narai's browser test seeds a learner who linked their account and
checks that the subject Narai sends is the one the tool shows.

Its manifest declares `surfaces.account_link`, since a start carries a subject only to such a tool. The three URLs are
placeholders on one origin: nothing calls them. It is never registered anywhere but a test.

```sh
pnpm --filter @narai-labs/echo dev    # the harness, with no linked learner: it shows none
```
