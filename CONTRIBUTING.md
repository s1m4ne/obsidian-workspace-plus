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

`main.js` is the bundled output and is not tracked in git -- a fresh clone
has to run `npm run build` (or `npm run dev` to watch) before Obsidian can
load the plugin. Release builds are produced by CI and attached to the
GitHub release.

## Pull Requests

Keep changes focused and include tests when changing session switching, persistence, or settings behavior. Run `npm test` and `npm run build` before submitting.
