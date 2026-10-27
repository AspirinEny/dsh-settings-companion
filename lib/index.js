/**
 * Host-side entry. This plugin is purely a client-plugin: the browser bundle in
 * `lib/client.js` registers the sidebar entry and the stylesheet. The host row
 * exists only so the bundle patch can mount the package.
 */
export const name = "settings-companion";

export function apply() {}