import { Snapshot } from "@data/modules/help";
import { renderSections } from "@data/modules/help/shared";

export function renderModuleHelp(snapshot: Snapshot, helpCli: string, moduleName: string) {
	const module = snapshot.modules.moduleIndex.byName[moduleName]!;
	let header = `Module Help: ${moduleName}`;
	if (module.aliases) header += `\nAliases: ${module.aliases.join(', ')}`;
	if (module.description) header += `\nDescription: ${module.description}`

	let details = `Details:\n  Action: ${helpCli} ${moduleName} <action>`
	details += module.options ? `\n  Flag: ${helpCli} ${moduleName} <-f/--flag/--alias>` : "";

	const sections: string[] = [];
	sections.push(header, details);

	let moduleOptionsOutput: string | undefined = undefined
	let moduleActionsOutput: string | undefined;
	if (module.options) {
		moduleOptionsOutput = `Flags:`;
		for (const [flagName, flag] of Object.entries(module.options)) {

			const flagValueHint = flag.valueHint ? `=${flag.valueHint}` : undefined;

			moduleOptionsOutput += `\n  ${flagName}:\n`;
			moduleOptionsOutput += `    --${flag.long}`;
			if (flagValueHint) moduleOptionsOutput += flagValueHint;


			if (flag.short) {
				moduleOptionsOutput += `/-${flag.short}`;
				if (flagValueHint) moduleOptionsOutput += flagValueHint;

			}


			if (flag.aliases) {
				moduleOptionsOutput += " ("
				for (const alias of flag.aliases) {
					if (flag.aliases.indexOf(alias) !== 0) moduleOptionsOutput += "/"
					if (alias.length === 1) {
						moduleOptionsOutput += `-${alias}`;
					} else {
						moduleOptionsOutput += `--${alias}`
					}
					if (flagValueHint) moduleOptionsOutput += flagValueHint;
				}
				moduleOptionsOutput += ")"
			}

		}

	}

	if (module.actions) {
		moduleActionsOutput = `Actions:`;
		for (const [actionName, action] of Object.entries(module.actions)) {
			moduleActionsOutput += `\n  ${actionName}`;
			if (action.aliases) moduleActionsOutput += ` (${action.aliases.join(', ')})`;
			if (action.description) moduleActionsOutput += `: ${action.description}`;
		}
	}


	if (moduleOptionsOutput) sections.push(moduleOptionsOutput);
	if (moduleActionsOutput) sections.push(moduleActionsOutput);

	const output = renderSections(sections);

	console.log(output);

}
