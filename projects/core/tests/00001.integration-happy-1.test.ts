import { expect } from "vitest";
import { createRuntimeTests } from "./lib/createRuntimeTest";

createRuntimeTests({
	describe: "Integration Happy Tests",
	cli: {
		modules: {
			test: {
				actions: {
					run: {}
				}
			}
		}
	},
	setup(cli) {
		const state = {
			called: false
		};
		cli.hooks().onModuleAction("test", "run", async () => {
			state.called = true;
		});
		return state

	},
	tests: [
		{
			name: "should execute module action",
			args: ["test", "run"],
			assert: ({ setup }) => {
				expect(setup?.called).toBe(true)
			}
		}
	]
});
