import { vi } from "vitest";
import { writeFileSync, rmSync } from "node:fs";

export class ProcessExitError extends Error {
	constructor(public readonly code: number) {
		super(`process.exit(${code})`);
	}
}

export async function loadCLI() {
	vi.resetModules();
	return await import("@kamie-oss/core");
}

export async function withArgsAndEnv(
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

	const debugSpy = vi
		.spyOn(console, "debug")
		.mockImplementation((...args: unknown[]) => {
			output += args.join(" ") + "\n";
		});
	const infoSpy = vi
		.spyOn(console, "info")
		.mockImplementation((...args: unknown[]) => {
			output += args.join(" ") + "\n";
		});
	const logSpy = vi
		.spyOn(console, "log")
		.mockImplementation((...args: unknown[]) => {
			output += args.join(" ") + "\n";
		});

	const warnSpy = vi
		.spyOn(console, "warn")
		.mockImplementation((...args: unknown[]) => {
			output += args.join(" ") + "\n";
		});

	const errorSpy = vi
		.spyOn(console, "error")
		.mockImplementation((...args: unknown[]) => {
			output += args.join(" ") + "\n";
		});

	const exitSpy = vi
		.spyOn(process, "exit")
		.mockImplementation(((code?: number) => {
			throw new ProcessExitError(code ?? 0);
		}) as never);

	return {
		getOutput: () => output,
		restore: () => {
			exitSpy.mockRestore();
			debugSpy.mockRestore();
			infoSpy.mockRestore();
			logSpy.mockRestore();
			warnSpy.mockRestore();
			errorSpy.mockRestore();
		}
	};
}

// export async function withTempEnvFile(content: string, path: string, fn: (path: string) => Promise<void>) {
// 	// const filePath = join(tmpdir(), `test-env-${Date.now()}.env`);
//
// 	writeFileSync(path, content);
//
// 	return fn(path).finally(() => {
// 		unlinkSync(path);
// 	});
// }
export async function withTempEnvFile(
	content: string,
	path: string,
	fn: (path: string) => Promise<void>
) {
	writeFileSync(path, content);

	try {
		await fn(path);
	} finally {
		rmSync(path, {
			force: true
		});
	}
}
