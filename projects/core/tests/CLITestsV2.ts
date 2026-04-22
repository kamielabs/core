import { CLI } from "@core";
import { CoreEventKind, CoreEventLevel, CoreEventPhase } from "@types";

type TestCase = {
	name: string
	argv: string[]
}

const tests: TestCase[] = [

	// -------------------------------------------------
	// GLOBAL FLAGS
	// -------------------------------------------------

	{
		name: "#0. global flag simple",
		argv: ["-g", "test"]
	},

	{
		name: "#1. global flag unknown",
		argv: ["--unknown", "test"]
	},

	// -------------------------------------------------
	// MODULE DEFAULT ACTION
	// -------------------------------------------------

	{
		name: "#2. default action simple",
		argv: ["test"]
	},

	{
		name: "#3. default action flag",
		argv: ["test", "--add=value"]
	},

	{
		name: "#4. default action short flag",
		argv: ["test", "-a=value"]
	},

	// -------------------------------------------------
	// MODULE + ACTION
	// -------------------------------------------------

	{
		name: "#5. module + action",
		argv: ["test2", "testAction"]
	},

	{
		name: "#6. module flag",
		argv: ["test2", "--moduleFlag", "testAction"]
	},

	{
		name: "#7. action flag",
		argv: ["test2", "testAction", "--add=value"]
	},

	// -------------------------------------------------
	// ARGS
	// -------------------------------------------------

	{
		name: "#8. args after action",
		argv: ["test2", "testAction", "arg1", "arg2"]
	},

	{
		name: "#9. args after default action",
		argv: ["test", "arg1", "arg2"]
	},

	// -------------------------------------------------
	// STOP TOKEN
	// -------------------------------------------------

	{
		name: "#10. stop token",
		argv: ["test2", "testAction", "--", "-a", "-b", "--c"]
	},

	// -------------------------------------------------
	// SHORT GROUPS
	// -------------------------------------------------

	{
		name: "#11. short group",
		argv: ["test2", "testAction", "-aaa"]
	},

	{
		name: "#12. short group with value",
		argv: ["test2", "testAction", "-aa a=value"]
	},

	// -------------------------------------------------
	// ERROR CASES
	// -------------------------------------------------

	{
		name: "#13. unknown module",
		argv: ["unknown", "action", "arg1", "arg2"]
	},

	{
		name: "#14. unknown action",
		argv: ["test2", "unknown"]
	},

	{
		name: "#15. missing flag value",
		argv: ["test2", "testAction", "-a"]
	},

	{
		name: "#16. unexpected flag value",
		argv: ["test2", "testAction", "--moduleFlag=value"]
	},

	{
		name: "#17. duplicate flag",
		argv: ["test2", "testAction", "--add=test", "-a=test"]
	},

	// -------------------------------------------------
	// CHAOS TEST
	// -------------------------------------------------

	{
		name: "#18. chaos parsing",
		argv: [
			"-Lm=quiet",
			"--unknown",
			"test2",
			"-u",
			"--moduleFlag",
			"testAction",
			"--add=test",
			"-bla",
			"bla",
			"bla"
		]
	}
]

async function runTest(test: TestCase) {

	console.log("\n--------------------------------------")
	console.log("TEST:", test.name)
	console.log("Args Inputs : ", test.argv)
	console.log("--------------------------------------")

	process.argv = [
		"/usr/bin/node",
		"CLITestsV2.ts",
		...test.argv
	]

	const cli = CLI.init({

		events: {
			testEventCustom1: {
				code: "TEST_EVENT_CUSTOM1",
				phase: CoreEventPhase.declarative,
				kind: CoreEventKind.signal,
				level: CoreEventLevel.trace
			}
		},

		stages: {
			dev: {
				options: {
					optdev1: { env: "OPT_DEV_1", default: "test1" }
				}
			}
		},

		globals: {
			customGlobalGroup1: {
				testGlobal1: {
					env: "OPT_GLOBAL",
					default: "",
					cli: [{
						long: "global",
						short: "g",
						value: "global"
					}]
				}
			}
		},

		modules: {

			test: {
				defaultAction: {
					__defaultAction__: {
						description: "test action",
						options: {
							addTest: {
								long: "add",
								short: "a",
								valueHint: "<value>"
							}
						}
					}
				}
			},

			test2: {
				options: {
					moduleFlag: {
						long: "moduleFlag",
						value: "moduleFlag"
					}
				},

				actions: {
					testAction: {
						description: "test",
						options: {
							add: {
								long: "add",
								short: "a",
								valueHint: "<value>"
							}
						}
					}
				}
			}

		}

	})
	cli.hooks().onModuleAction("test", "__defaultAction__", () => {
		console.log("Hook : test.__defaultAction__ -> OK")
	})
	cli.hooks().onModuleAction("test2", "testAction", () => {
		console.log("Hook : test2.testAction -> OK")
	})

	await cli.run()

	// console.log("GLOBALS")
	// console.log(cli.context().globals.getResolved())
	//
	// console.log("MODULES")
	// console.log(cli.context().modules.getResolved())
	//
	// console.log("PARSER")
	// console.log(cli.context().parser.getResolved())
	//
	// console.log("ISSUES")
	// console.log(cli.context().parser.getIssues())
	await CLI.destroy();
}

async function main() {

	const arg = process.argv[2];

	// -------------------------------------------------
	// RUN ALL TESTS
	// -------------------------------------------------

	if (!arg) {

		console.log(`Running all ${tests.length} tests\n`);

		for (let i = 0; i < tests.length; i++) {
			console.log(`\nTEST INDEX: ${i}`);
			await runTest(tests[i]!);
		}

		return;
	}

	// -------------------------------------------------
	// RUN SINGLE TEST
	// -------------------------------------------------

	const index = Number(arg);

	if (Number.isNaN(index)) {
		console.error(`Invalid test index: ${arg}`);
		process.exit(1);
	}

	const test = tests[index];

	if (!test) {
		console.error(`Test index out of range: ${index}`);
		console.error(`Available tests: 0 → ${tests.length - 1}`);
		process.exit(1);
	}

	console.log(`Running single test: ${index}\n`);

	await runTest(test);
}

main()
