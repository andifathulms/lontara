# tests/reviewed/

**Empty, because no reviewer has signed off on anything yet (PRD §9).**

Files here carry a named reviewer's sign-off and are the highest authority in
the repository. Invariant 11:

> Files in `tests/reviewed/` may not be modified. They carry a named reviewer's
> sign-off. If the engine disagrees, **the engine is wrong**. Changing a
> reviewed fixture requires going back to that reviewer — a human task. Flag it
> and stop.

`pnpm rules:validate` enforces this mechanically: every `.json` here must have a
recorded sha256 in `checksums.json`, and a mismatch fails the build with that
instruction rather than letting the file drift.

## Adding a signed-off fixture

1. The reviewer approves a specific case — a Latin form, its Lontara, and for
   the reader the reading set. Sign-off is per fixture, never blanket.
2. Add the fixture as `<reviewer-slug>-<topic>.json`, recording the reviewer's
   name and the date inside it.
3. Add the reviewer to `data/rules/reviewers.json` if they are not there, with
   `consentRecorded` reflecting actual consent.
4. Record the sha256 in `checksums.json`.
5. Never edit either afterwards. Go back to the reviewer instead.
