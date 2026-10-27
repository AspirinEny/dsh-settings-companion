#!/usr/bin/env node
/**
 * Verify this plugin against the checks a DSH plugin bundle must pass before it
 * is installed or handed to someone else:
 *
 *  1. `package.json` parses and declares the Client entry, the patch, and the
 *     display exports (`./locale/*.json`, `./icon`).
 *  2. Every locale file carries `meta.title` and `meta.description`, and the
 *     translated label used by the Client bundle is defined for each locale.
 *  3. `files` covers the patch, the locales, the icon, and every runtime module,
 *     so a packed tarball is complete (a linked directory is not filtered by
 *     `files`, which is why the packed list is checked separately).
 *  4. The icon is a supported image under 256 KiB.
 *  5. JavaScript files pass `node --check`.
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const notes = [];

const fail = (message) => problems.push(message);
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => {
	try {
		return JSON.parse(read(path));
	} catch (error) {
		fail(`${path}: ${error.message}`);
		return undefined;
	}
};
const size = (path) => {
	try {
		return statSync(join(root, path)).size;
	} catch {
		return -1;
	}
};

// 1. manifest
const manifest = json("package.json");
const name = manifest?.name;
if (typeof name !== "string" || name.length === 0) fail("package.json: missing name");
if (!/^\d+\.\d+\.\d+/.test(manifest?.version ?? "")) fail("package.json: missing semver version");
if (!manifest?.description) fail("package.json: missing description");
if (manifest?.type !== "module") fail('package.json: expected "type": "module"');

const exportsMap = manifest?.exports ?? {};
const entry = exportsMap["./client"];
const clientFile = typeof entry === "string" ? entry : entry?.default;
if (!clientFile) fail('package.json: missing exports["./client"]');
if (!exportsMap["./locale/*.json"]) fail('package.json: missing exports["./locale/*.json"]');
if (!exportsMap["./icon"]) fail('package.json: missing exports["./icon"]');

const patch = manifest?.dsh?.bundle?.patch;
if (!patch) fail("package.json: missing dsh.bundle.patch");
else if (!existsSync(join(root, patch))) fail(`package.json: dsh.bundle.patch points at missing ${patch}`);
if (manifest?.dsh?.client?.platform !== "web") fail('package.json: expected dsh.client.platform "web"');

// 2. locales
const localeDir = join(root, "locale");
const locales = existsSync(localeDir) ? readdirSync(localeDir).filter((file) => file.endsWith(".json")) : [];
if (locales.length === 0) fail("locale/: no locale files");
for (const file of locales) {
	const data = json(`locale/${file}`);
	if (!data?.meta?.title) fail(`locale/${file}: missing meta.title`);
	if (!data?.meta?.description) fail(`locale/${file}: missing meta.description`);
}
if (!locales.includes("en.json")) fail("locale/en.json: required base locale is missing");

// The Client bundle carries the runtime dictionaries (Plugin Manager only reads
// `meta` from the JSON files), so every displayed language must be registered too.
const clientSource = clientFile && existsSync(join(root, clientFile.replace(/^\.\//, ""))) ? read(clientFile.replace(/^\.\//, "")) : "";
if (clientSource.includes("locale.register(")) {
	const namespace = clientSource.match(/NS\s*=\s*"([^"]+)"/)?.[1];
	if (!namespace) fail("lib/client.js: locale.register() is used but no NS constant was found");
	for (const file of locales) {
		const code = file.replace(/\.json$/, "");
		if (!new RegExp(`\\b${code}\\s*:`).test(clientSource)) fail(`lib/client.js: no ${code} dictionary, but locale/${file} exists`);
	}
} else fail("lib/client.js: no locale.register() call; visible text must come from the locale service");

// 3. files whitelist completeness
const files = manifest?.files ?? [];
if (!Array.isArray(files) || files.length === 0) fail("package.json: missing files list");
const covered = (path) =>
	files.some((pattern) => {
		if (!pattern.includes("*")) return pattern === path;
		return new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")}$`).test(path);
	});
const required = [patch?.replace(/^\.\//, ""), clientFile?.replace(/^\.\//, ""), "lib/index.js", "icon.svg", ...locales.map((file) => `locale/${file}`)].filter(
	Boolean,
);
for (const path of required) {
	if (!existsSync(join(root, path))) fail(`missing required file: ${path}`);
	else if (!covered(path)) fail(`package.json files does not cover: ${path}`);
}
if (!files.includes("README.md")) notes.push("files does not list README.md (npm always includes it, ustar pack does too)");

// 4. icon
const icon = manifest?.icon ?? exportsMap["./icon"];
const iconPath = typeof icon === "string" ? icon.replace(/^\.\//, "") : undefined;
if (!iconPath || !existsSync(join(root, iconPath))) fail("icon: file not found");
else {
	const bytes = size(iconPath);
	if (bytes > 256 * 1024) fail(`icon: ${bytes} B exceeds the 256 KiB limit`);
	const extension = iconPath.split(".").pop();
	if (!["svg", "png", "jpg", "jpeg", "webp"].includes(extension)) fail(`icon: unsupported format .${extension}`);
	if (extension === "svg") {
		const text = read(iconPath);
		if (!/^\s*<svg[\s>]/.test(text)) fail("icon: SVG does not start with an <svg> element");
		if (!/viewBox=/.test(text)) fail("icon: SVG has no viewBox (will not scale)");
	}
}

// 5. syntax
const sources = ["lib/index.js", clientFile?.replace(/^\.\//, ""), "scripts/pack.mjs", "scripts/verify.mjs"].filter(
	(path) => typeof path === "string" && existsSync(join(root, path)),
);
for (const path of sources) {
	const result = spawnSync(process.execPath, ["--check", join(root, path)], { stdio: ["ignore", "inherit", "inherit"] });
	if (result.status !== 0) fail(`syntax: ${path}`);
}

// report
for (const note of notes) console.log(`note: ${note}`);
if (problems.length > 0) {
	for (const problem of problems) console.error(`error: ${problem}`);
	console.error(`\n${problems.length} problem(s)`);
	process.exit(1);
}
console.log(`ok: ${name}@${manifest.version} — ${sources.length} modules, ${locales.length} locales, icon ${iconPath} (${size(iconPath)} B)`);
