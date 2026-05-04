import { describe, it, expect } from "vitest";
import { captureOutput, loadCLI, withEnvAndArgs, withTempEnvFile } from "./helpers";

describe("CLI integration", () => {
	it("should execute module action", async () => {
		const { CLI } = await loadCLI();

		const cli = CLI.init({
			modules: {
				test: {
					actions: {
						run: {}
					}
				}
			}
		});

		let called = false;

		cli.hooks().onModuleAction("test", "run", async () => {
			called = true;
		});

		await withEnvAndArgs(["test", "run"], undefined, async () => {
			await cli.run();
		});

		expect(called).toBe(true);
	});
	it("should fallback to help on unknown module", async () => {
		const { CLI } = await loadCLI();

		const cli = CLI.init({});

		const { getOutput, restore } = captureOutput();

		try {
			await withEnvAndArgs(["unknown"], undefined, async () => {
				await cli.run();
			});

			const output = getOutput();

			expect(output).toContain("MODULES");
			expect(output).toContain("help");
			expect(output).toContain("version");
		} finally {
			restore();
		}
	});
	it("env file tests", async () => {
		const { CLI } = await loadCLI();

		const cli = CLI.init({});

		const filePath = ".env.test";
		cli.hooks().setBuiltinStageDefaults({ file: filePath });
		const { getOutput, restore } = captureOutput();

		await withTempEnvFile("NODE_CLI_LANG=fr", filePath, async () => {

			try {

				await withEnvAndArgs(["unknown"], undefined, async () => {
					await cli.run();
				});

				const output = getOutput();

				expect(output).toContain("MODULES");
				expect(output).toContain("help");
				expect(output).toContain("version");
			} finally {
				restore();
			}
		});
	});
});
