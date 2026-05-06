import { CoreEventKind, CoreEventLevel, CoreEventPhase } from "@types";
import { CLI } from "@core";
import { addModules, configureCLI, setStageBuiltinDefaults } from "./CLIHookTests";

export const cli = CLI.init({
	settings: {
		skipI18nWarnings: false,
		coreConsoleLevel: 'trace',
		defaultStageName: "dev",
		engine: "fed"
	},
	events: {
		testEventCustom1: {
			name: "TEST_EVENT_CUSTOM1",
			phase: CoreEventPhase.runtime,
			kind: CoreEventKind.message,
			level: CoreEventLevel.info
		},
		testEventCustom2: {
			name: "TEST_EVENT_CUSTOM2",
			phase: CoreEventPhase.runtime,
			kind: CoreEventKind.signal,
			level: CoreEventLevel.error
		}
	},
	stages: {
		default: {
			options: {
				opt1: {
					env: "STAGE_OPT1",
					default: "Stage Option 1"
				},
				opt2: {
					env: "STAGE_OPT2",
					default: "Stage Option 1"
				}
			}
		}
	},
	globals: {
		customGlobalGroup1: {
			testGlobal1: {
				env: 'OPT_GLOBAL',
				default: false,
				cli: [{
					long: 'global',
					short: 'g',
					value: true
				}]
			},
			testGlobal2: {
				env: 'OPT_GLOBAL2',
				default: false,
				cli: [{
					long: 'global2',
					short: 'n',
					value: true
				}]
			}

		}

	},
	translations: {
		es: {
			testEventCustom1: {
				name: 'TEST_EVENT_CUSTOM4',
				title: 'Maque !',
				description: 'Quesadillas ! ! ! '
			}
		}
	},
	modules: {
		// 	__defaultModule__: {
		// 		singleAction: {
		// 			__singleAction__: {
		// 				description: ''
		// 			}
		// 		}
		// 	}
		// }
		test: {
			defaultAction: {
				__defaultAction__: {
					description: 'test action',
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
				},
				add: {
					long: "add",
					valueHint: "<value>"
				}
			},
			actions: {
				"testAction": {
					description: "test",
					options: {
						add: {
							long: "add",
							short: "a",
							valueHint: "<value>"
						},
						delTest: {
							long: "del",
							short: "d",
							valueHint: "<value>"
						}
					}
				}
			}
		}
	}

});

async function main() {

	setStageBuiltinDefaults();

	configureCLI();

	addModules();

	// and run the cli, nothing more in main use file
	await cli.run()


}

main()
