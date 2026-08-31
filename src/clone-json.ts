// A deep copy of JSON-shaped data - layouts, session records, the data file.
//
// This lives on its own rather than in utils.ts because utils.ts imports
// Platform from obsidian, and both callers here are pure leaf modules that the
// tests load without the harness. Putting a shared helper in an impure module
// drags that dependency into everything that reaches for it.
//
// JSON.stringify(undefined) is undefined and JSON.parse(undefined) throws, so
// the undefined case needs its own answer. The overload signatures say so in
// the type; the previous `undefined as unknown as T` told the caller it was
// getting a T when it was getting undefined.

export function cloneJson(value: undefined): undefined;
export function cloneJson<T>(value: T): T;
export function cloneJson<T>(value: T): T | undefined {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value)) as T;
}
