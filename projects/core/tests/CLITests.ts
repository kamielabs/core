import { CoreEventKind, CoreEventLevel, CoreEventPhase } from "@types";
import { CLI } from "@core";
import { addModules, configureCLI, setStageBuiltinDefaults } from "./CLIHookTests";

export const cli = CLI.init({
	settings: {
		coreConsoleLevel: 'trace',
		defaultStageName: "dev"
	},
	events: {
		testEventCustom1: {
			code: "TEST_EVENT_CUSTOM1",
			phase: CoreEventPhase.runtime,
			kind: CoreEventKind.message,
			level: CoreEventLevel.trace
		},
		testEventCustom2: {
			code: "TEST_EVENT_CUSTOM2",
			phase: CoreEventPhase.runtime,
			kind: CoreEventKind.signal,
			level: CoreEventLevel.trace
		}
	},
	stages: {
		default: {
			options: {
				opt1: {
					env: "STAGE_OPT1",
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
			}
		}

	},
	// translations: {
	// 	es: {
	// 		stageInit: {
	// 			code: 'CORE_EVENT_ACTION_INIT',
	// 			title: 'Maque !',
	// 			description: 'Quesadillas ! ! ! '
	// 		}
	// 	}
	// },
	// La il faut clairement refaire des helpers,
	// le dev ne doit avoir à déclarer defaultAction et son nom core implicite '__defaultAction__'
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
