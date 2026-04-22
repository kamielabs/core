import { cli } from "./CLITests";

export function setStageBuiltinDefaults() {


	cli.hooks().setBuiltinStageDefaults({
		file: '.test',
		options: {
			lang: 'fr',
			workingDir: '/',
		}
	});
}

export function configureCLI() {
	// cli.hooks().onBuiltinStage('dev', ({ options }) => {
	// 	console.log(options.optdev1)
	// })
	// cli.hooks().onBuiltinStage('default', ({ options }) => {
	// 	console.log(options);
	// })
	//
	// cli.hooks().onGlobals(({ options, tools }) => {

	// tools.addListener(
	// 	(event) => console.log("CUSTOM ONLY:", event.code),
	// 	"default",
	// 	"*"
	// )
	// console.log(options.customGlobalGroup1)

	// })

	// cli.hooks().onModule('test2', ({ options }) => {
	// 	console.log(options)
	// })
}


export function addModules() {

	// cli.hooks().onModuleAction('__defaultModule__', '__singleAction__', ({ runtime }) => {
	//
	// 	console.log(runtime.module);
	// })

	cli.hooks().onModuleAction('test', '__defaultAction__', ({ tools, options, runtime }) => {

		tools.signal('testEventCustom2');
		console.log("Hooking ! action test.__defaultAction__ OK !");
		console.log(runtime.globals)
		console.log(runtime.module)
		console.log(options)
	});
	cli.hooks().onModuleAction('test2', 'testAction', ({ runtime, tools, snapshot, options }) => {
		if (snapshot) {
			console.log(snapshot.modules)
		}
		tools.signal('testEventCustom2');
		console.log(runtime.globals);
		console.log("Hooking ! action test2.testAction OK !");
		console.log(options)
	})
}
