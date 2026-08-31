import { formatRelativeTime } from '../../modals/format-relative-time.ts';
import type { SessionItem } from '../../storage/default-data.ts';

export interface SessionPresentationOptions {
    activeSessionId?: string | null;
    index?: number;
    orderIndex?: number;
    commandHotkey?: string | null;
    defaultSessionName?: string;
}

export interface SessionPresentation {
    readonly id: string;
    readonly name: string;
    readonly isActive: boolean;
    readonly isDefault: boolean;
    readonly modifiedText: string;
    readonly hotkeyText: string;
}

export function isSessionActive(
    session: { id: string },
    activeSessionId?: string | null
): boolean {
    return Boolean(activeSessionId && session.id === activeSessionId);
}

export function isDefaultSession(
    session: { isDefault?: boolean; name?: string },
    defaultSessionName?: string
): boolean {
    return Boolean(
        session.isDefault &&
        (!defaultSessionName || session.name !== defaultSessionName)
    );
}

export function formatSessionHotkey(
    index?: number,
    commandHotkey?: string | null
): string {
    if (commandHotkey && commandHotkey.trim()) {
        return commandHotkey;
    }
    if (typeof index === 'number' && index >= 0) {
        return String(index + 1);
    }
    return '';
}

export function formatSessionModified(
    modified?: number | null
): string {
    if (typeof modified !== 'number' || isNaN(modified)) {
        return '';
    }
    return formatRelativeTime(modified);
}

export function deriveSessionPresentation(
    session: SessionItem,
    options?: SessionPresentationOptions
): SessionPresentation {
    const opts = options || {};
    const hintIndex = typeof opts.orderIndex === 'number' ? opts.orderIndex : opts.index;

    return {
        id: session.id,
        name: session.name,
        isActive: isSessionActive(session, opts.activeSessionId),
        isDefault: isDefaultSession(session, opts.defaultSessionName),
        modifiedText: formatSessionModified(session.modified),
        hotkeyText: formatSessionHotkey(hintIndex, opts.commandHotkey),
    };
}
