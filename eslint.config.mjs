import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
    {
        ignores: ["main.js", "node_modules/**", "backups/**", "exports/**"],
    },

    ...obsidianmd.configs.recommended,

    {
        languageOptions: {
            parserOptions: {
                projectService: { allowDefaultProject: ["eslint.config.*"] },
            },
        },
        rules: {
            // Cmd+Shift+Enter and its siblings are core to this plugin's UX, not
            // incidental conveniences. Keeping them is a deliberate decision
            // recorded in issue #111.
            "obsidianmd/commands/no-default-hotkeys": "off",
        },
    },

    {
        // src/ is migrating to TypeScript module by module. Until a file is
        // converted it is CommonJS running in Obsidian's Electron renderer, so
        // it needs those globals and none of the ESM-era rules apply to it.
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                document: "readonly", window: "readonly", navigator: "readonly",
                activeDocument: "readonly", activeWindow: "readonly",
                console: "readonly", process: "readonly", __dirname: "readonly",
                setTimeout: "readonly", clearTimeout: "readonly",
                setInterval: "readonly", clearInterval: "readonly",
                setImmediate: "readonly", globalThis: "readonly",
                require: "readonly", module: "writable", exports: "writable",
                Element: "readonly", HTMLElement: "readonly",
            },
        },
        rules: {
            "no-implicit-globals": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-this-alias": "off",
        },
    },

    {
        // Build tooling and tests, not plugin code. They run in Node by design
        // and their fixtures name real vault paths, so the rules that guard
        // what ships to users do not apply.
        files: ["scripts/**/*.{js,ts}", "tests/**/*.{js,ts}"],
        rules: {
            "obsidianmd/no-nodejs-modules": "off",
            "obsidianmd/rule-custom-message": "off",
            "obsidianmd/hardcoded-config-path": "off",
            "obsidianmd/prefer-window-timers": "off",
        },
    },
]);
