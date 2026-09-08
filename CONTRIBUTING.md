# Contributing

Thanks for helping improve Workspace++.

## Reporting Issues

Before opening an issue, please check the existing issues to avoid duplicates. Include:

- Your Obsidian version
- Your Workspace++ version
- Your operating system
- Steps to reproduce the problem
- What you expected to happen
- Any relevant console errors or screenshots

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the plugin:

```bash
npm run build
```

Run everything CI runs, which is what a commit has to pass:

```bash
npm run check
```

That is one command and seventeen checks - types, lint, tests, coverage, the
build, and a dozen project-specific ones. Three of them are ratchets that
compare against a recorded baseline (`.eslint-baseline.json`,
`.coverage-baseline.json`, `.dual-dispatch-baseline.json`) and fail only when a
count gets worse. Each check explains itself when it fails, including why it
exists.

`main.js` is the bundled output and is not tracked in git -- a fresh clone
has to run `npm run build` (or `npm run dev` to watch) before Obsidian can
load the plugin. Release builds are produced by CI and attached to the
GitHub release.

## Pull Requests

Keep changes focused and include tests when changing session switching,
persistence, or settings behavior. Run `npm run check` before submitting; CI
runs the same command, so anything it accepts here it accepts there.

Two things are worth knowing before touching `tests/`:

- **`tests/lock/` holds Behavior Lock tests and they are not edited to make a
  change pass.** The two that remain pin all 310 locale strings in all 21
  languages, by value. If one fails, a string moved - which is sometimes the
  intent, and then the edit is recorded in the lock's own header with the
  reason.
- **Tests run `.ts` directly** through Node's native type stripping, so
  TypeScript that emits runtime code is rejected: no `enum`, no `namespace`, no
  parameter properties, no decorators. Relative imports need the `.ts`
  extension.
