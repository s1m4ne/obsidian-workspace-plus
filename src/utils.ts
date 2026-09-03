import { Platform } from 'obsidian';

// Utility functions for Workspace++
//
// Pure helpers with zero runtime state.

export interface ModifierEvent {
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
}

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

export function isMacPlatform(): boolean {
    return Platform.isMacOS;
}

export function isModPressed(e: ModifierEvent | null | undefined): boolean {
    if (!e) return false;
    return isMacPlatform() ? Boolean(e.metaKey) : Boolean(e.ctrlKey);
}

export function isModShiftPressed(e: ModifierEvent | null | undefined): boolean {
    return isModPressed(e) && Boolean(e?.shiftKey);
}
