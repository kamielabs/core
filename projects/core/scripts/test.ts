#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import fs from "node:fs"
import { join } from "node:path";

const projectRoot = new URL("../", import.meta.url).pathname;


const id = process.argv[2];

const command = "pnpm build > /dev/null && pnpm vitest run"

if (!id) {
	execSync(
		command,
		{ stdio: "inherit" }
	);
} else {
	const testsDir = join(projectRoot, "tests");
	const files = fs
		.readdirSync(testsDir)
		.filter(file =>
			file.startsWith(id) &&
			file.endsWith(".test.ts")
		);

	if (files.length === 0) {
		throw new Error(
			`No test file found for id '${id}'`
		);
	}

	if (files.length > 1) {
		throw new Error(
			`Multiple test files found for id '${id}':\n${files.join("\n")}`
		);
	}
	// if (!fs.existsSync(testFileName)) {
	// 	throw new Error(`Test File with id : ${id} not found`)
	// }
	const testFileName = join(testsDir, files[0]!)
	execSync(
		command + ` ${testFileName}`,
		{ stdio: "inherit" }
	);
}
