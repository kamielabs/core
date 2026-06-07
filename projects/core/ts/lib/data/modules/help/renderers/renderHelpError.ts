import { HelpRoute } from "@data/modules/help";

export function renderHelpError(helpCli: string, help: HelpRoute) {

	const errPrefix = "Help Error:";

	switch (help.route) {
		case 'stageEnvNotFound': {
			const stageHelp = `List Stage Envs -> ${helpCli} -S`;
			console.error(`${errPrefix} Invalid Stage Env "${help.env}"\n${stageHelp}`);
			break;;
		}
		case 'globalFlagNotFound': {
			const globalsHelp = `List Global Flags -> $ ${helpCli} -G`;
			console.error(`${errPrefix} Invalid Global Flag "${help.flag}"\n${globalsHelp}`);
			break;;
		}
		case 'moduleNotFound': {
			const moduleHelp = `List Modules -> $ ${helpCli} -M`;
			console.error(`${errPrefix} Invalid Module Name "${help.module}"\n${moduleHelp}`);
			break;;
		}
		case 'moduleFlagNotFound': {
			const moduleFlagHelp = `List Module Flags -> $ ${helpCli} ${help.module}`;
			console.error(`${errPrefix} Invalid Module Flag "${help.flag}" (Module:${help.module})\n${moduleFlagHelp}`);
			break;;
		}
		case 'actionNotSupported': {
			const defaultModuleHelp = `Module Help -> ${helpCli} ${help.module}`;
			console.error(`${errPrefix} Unsupported named action for module "${help.module}"\n${defaultModuleHelp}`);
			break;;
		}
		case 'actionNotFound': {
			const actionHelp = `List Module Actions -> $ ${helpCli} ${help.module}`;
			console.error(`${errPrefix} Invalid Action Name "${help.action}" (Module:${help.module})\n${actionHelp}`);
			break;;
		}
		case 'actionFlagNotFound': {
			const actionLabel = help.action === "__defaultAction__" ? '' : ` ${help.action}`;
			const actionFlagHelp = `List Action Flags -> $ ${helpCli} ${help.module}${actionLabel}`;
			console.error(`${errPrefix} Invalid Action Flag "${help.flag}" (Module/Action:${help.module}${actionLabel})\n${actionFlagHelp}`);
			break;;
		}
		case 'helpFlagConflictError': {
			console.error(`${errPrefix} help flags cannot be combined`);
			break;;
		}
		case 'notAflagError': {
			console.error(`${errPrefix} Invalid Flag "${help.flag}" : flags must start by '-'`);
			break;;
		}
	}
	process.exit(1);
}
