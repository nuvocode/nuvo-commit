export type TicketIdMode = "off" | "footer" | "prefix";

export const DEFAULT_TICKET_PATTERN = "[A-Z][A-Z0-9]+-\\d+";

/** Finds a ticket ID such as `ABC-123` in a branch name. */
export function extractTicketId(
  branch: string,
  pattern: string = DEFAULT_TICKET_PATTERN,
): string | undefined {
  try {
    return new RegExp(pattern || DEFAULT_TICKET_PATTERN).exec(branch)?.[0];
  } catch {
    return undefined;
  }
}

/** Adds the ticket ID as a `Refs:` footer or in front of the subject. */
export function addTicketId(
  message: string,
  ticket: string | undefined,
  mode: TicketIdMode,
): string {
  if (!ticket || mode === "off" || message.includes(ticket)) return message;
  if (mode === "footer") return `${message}\n\nRefs: ${ticket}`;

  // Keep the Conventional Commit prefix first so the header still parses.
  return message.replace(
    /^([a-z]+(\([^)]*\))?!?: )?/i,
    (prefix) => `${prefix}${ticket} `,
  );
}
