import { vi } from "vitest";
import { writeFileSync, unlinkSync } from "node:fs";

export async function loadCLI() {
	vi.resetModules();
	return await import("@kamie-oss/core");
}

export async function withEnvAndArgs(
	args: string[] | undefined,
	envs: Record<string, string> | undefined,
	fn: () => Promise<void>
): Promise<void> {
	const originalArgv = [...process.argv];
	const originalEnv = { ...process.env };

	try {
		// argv
		if (args) {
			process.argv = [...originalArgv.slice(0, 2), ...args];
		}

		// env
		if (envs) {
			for (const [key, value] of Object.entries(envs)) {
				process.env[key] = value;
			}
		}

		await fn();
	} finally {
		// restore argv
		process.argv = originalArgv;

		// restore env
		process.env = originalEnv;
	}
}

export function captureOutput() {
	let output = "";

	const logSpy = vi
		.spyOn(console, "log")
		.mockImplementation((...args: unknown[]) => {
			output += args.join(" ") + "\n";
		});

	const errorSpy = vi
		.spyOn(console, "error")
		.mockImplementation((...args: unknown[]) => {
			output += args.join(" ") + "\n";
		});

	return {
		getOutput: () => output,
		restore: () => {
			logSpy.mockRestore();
			errorSpy.mockRestore();
		}
	};
}

export async function withTempEnvFile(content: string, path: string, fn: (path: string) => Promise<void>) {
	// const filePath = join(tmpdir(), `test-env-${Date.now()}.env`);

	writeFileSync(path, content);

	return fn(path).finally(() => {
		unlinkSync(path);
	});
}

