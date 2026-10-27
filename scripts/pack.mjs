#!/usr/bin/env node
/**
 * Pack this plugin into a pnpm/npm-installable tarball under `dist/`.
 *
 * Pure Node (no dependencies, no shelling out to `tar`), so the artifact is
 * identical on every platform and in CI. Honors the `files` whitelist the same
 * way `npm pack` does, and always includes package.json / README / LICENSE.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

/** Expand one `files` entry (only `*` inside a path segment is supported). */
function expand(pattern) {
	const walk = (base, segments) => {
		if (segments.length === 0) {
			try {
				return statSync(base).isFile() ? [base] : [];
			} catch {
				return [];
			}
		}
		const [head, ...rest] = segments;
		if (head === "*" || head.includes("*")) {
			const match = new RegExp(`^${head.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
			let names = [];
			try {
				names = readdirSync(base);
			} catch {
				return [];
			}
			return names.filter((name) => match.test(name)).flatMap((name) => walk(join(base, name), rest));
		}
		return walk(join(base, head), rest);
	};
	return walk(root, pattern.split("/"));
}

const always = ["package.json", "README.md", "LICENSE"].map((name) => join(root, name)).filter((path) => {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
});

const files = [...new Set([...always, ...(manifest.files ?? []).flatMap(expand)])].sort();

/** Write one 512-byte ustar header. */
function header(name, size, mode = 0o644) {
	const buffer = Buffer.alloc(512);
	const write = (offset, length, value) => buffer.write(value, offset, length, "utf8");
	const octal = (value, length) => value.toString(8).padStart(length - 1, "0") + "\0";
	const stamp = Math.floor(Date.now() / 1000);
	write(0, 100, name);
	write(100, 8, octal(mode, 8));
	write(108, 8, octal(0, 8));
	write(116, 8, octal(0, 8));
	write(124, 12, octal(size, 12));
	write(136, 12, octal(stamp, 12));
	write(148, 8, "        ");
	write(156, 1, "0");
	write(257, 6, "ustar\0");
	write(263, 2, "00");
	let sum = 0;
	for (const byte of buffer) sum += byte;
	write(148, 8, sum.toString(8).padStart(6, "0") + "\0 ");
	return buffer;
}

const chunks = [];
for (const path of files) {
	const data = readFileSync(path);
	const name = `package/${relative(root, path).split(sep).join("/")}`;
	if (Buffer.byteLength(name) > 100) throw new Error(`path too long for ustar: ${name}`);
	chunks.push(header(name, data.length), data);
	const pad = (512 - (data.length % 512)) % 512;
	if (pad > 0) chunks.push(Buffer.alloc(pad));
}
chunks.push(Buffer.alloc(1024));

const target = join(root, "dist", `${manifest.name}-${manifest.version}.tgz`);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, gzipSync(Buffer.concat(chunks), { level: 9 }));

const bytes = statSync(target).size;
console.log(`packed ${files.length} files -> ${relative(process.cwd(), target) || target} (${bytes} B)`);
for (const path of files) console.log(`  ${relative(root, path).split(sep).join("/")}`);
