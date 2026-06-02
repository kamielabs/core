#!/usr/bin/env tsx
import { CoreEventKind, CoreEventLevel, CoreEventPhase } from "@types";
import { CLI } from "@core";
import { addModules, configureCLI, setStageBuiltinDefaults } from "./CLIHookTests";

export const cli = CLI.init({
	meta: {
		name: "Test CLI",
		version: "0.2.0",
		author: "k4mie"
	},
	settings: {
		skipI18nWarnings: false,
		console: {
			level: 'info',
			showLevel: false,
			showTS: false,
			showPhase: false
		},
		defaultStageName: "dev",
		engine: "fed"
	},
	events: {
		testEventCustom1: {
			name: "test.event.custom1",
			phase: CoreEventPhase.runtime,
			kind: CoreEventKind.message,
			level: CoreEventLevel.info
		},
		testEventCustom2: {
			name: "test.event.custom2",
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
			testGlobalNoFlag: {
				env: 'OPT_NO_FLAG_GLOBAL',
				default: false,
				description: "No Flag Global Option"
			},
			testGlobal1: {
				env: 'OPT_GLOBAL',
				default: false,
				description: "Gestion Globale de test",
				cli: [{
					long: 'global',
					short: 'g',
					aliases: ["gggg", "x"],
					description: "Test Cli Flag",
					value: true
				}, {
					long: "test",
					short: "z",
					aliases: ["r"],
					description: "Test 2",
					valueHint: "<value>"
				}]
			},
			testGlobal2: {
				env: 'OPT_GLOBAL2',
				default: false,
				cli: [{
					long: 'global2',
					short: 'n',
					aliases: ["m"],
					value: true
				}]
			}

		}

	},
	translations: {
		en: {
			testEventCustom1: {
				name: 'test.event.custom1',
				content: "Custom Test 1"
			}
		},
		es: {
			testEventCustom1: {
				name: 'test.event.custom1',
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
							description: "Add a value",
							long: "add",
							short: "a",
							valueHint: "<value>"
						},
						addTest2: {
							description: "Add2 test",
							long: "add2",
							valueHint: "<value>"
						}
					}
				}
			}
		},
		test2: {
			aliases: ["test3", "t"],
			description: "Test Module 2ème du nom",
			options: {
				moduleFlag2: {
					long: "moduleFlag",
					short: "a",
					aliases: ["t"],
					value: "moduleFlag"
				},
				add: {
					description: "Add a value",
					long: "add",
					short: "z",
					aliases: ["bla"],
					valueHint: "<value>"
				}
			},
			actions: {
				"testAction": {
					aliases: ["ta"],
					description: "test",
					argsHint: ["[id] [name]"],
					options: {
						add: {
							description: "Add a value",
							long: "add",
							short: "a",
							aliases: ["addAlias"],
							valueHint: "<value>"
						},
						delTest: {
							description: "Remove a value",
							long: "del",
							short: "d",
							valueHint: "<value>"
						}
					}
				},
				act2: {
					description: "Action 2 from test 2"
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
