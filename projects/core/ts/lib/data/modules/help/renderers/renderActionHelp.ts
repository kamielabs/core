import { Snapshot } from "@data/modules/help";
import { renderSections } from "@data/modules/help/shared";

export function renderActionHelp(snapshot: Snapshot, helpCli: string, moduleName: string, actionName: string) {

	const actionLabel = actionName === "__defaultAction__" ? "Default" : actionName;

	const action = snapshot.modules.actionIndex.byModule[moduleName]!.byName[actionName]!;
	const sections: string[] = [];
	let header = `Action Help: ${actionLabel} (Module: ${moduleName})`;
	if (action.aliases) header += `\nAliases: ${action.aliases.join(', ')}`;
	if (action.description) header += `\nDescription: ${action.description}`;

	const details = `Details:\n  Flag: ${helpCli} ${moduleName}${actionName === '__defaultAction__' ? '' : ` ${actionName}`} <-f/--flag/--alias>`;

	sections.push(header, details);

	let actionOptionsOutput: string | undefined = undefined;
	let actionArgsOutput: string | undefined = undefined;
	if (action.options) {
		actionOptionsOutput = `Flags ->`;
		for (const [flagName, flag] of Object.entries(action.options)) {

			const flagValueHint = flag.valueHint ? `=${flag.valueHint}` : undefined;

			actionOptionsOutput += `\n  ${flagName}:\n`;
			actionOptionsOutput += `    --${flag.long}`;
			if (flagValueHint) actionOptionsOutput += flagValueHint;


			if (flag.short) {
				actionOptionsOutput += `/-${flag.short}`;
				if (flagValueHint) actionOptionsOutput += flagValueHint;

			}


			if (flag.aliases) {
				actionOptionsOutput += " ("
				for (const alias of flag.aliases) {
					if (flag.aliases.indexOf(alias) !== 0) actionOptionsOutput += "/"
					if (alias.length === 1) {
						actionOptionsOutput += `-${alias}`;
					} else {
						actionOptionsOutput += `--${alias}`
					}
					if (flagValueHint) actionOptionsOutput += flagValueHint;
				}
				actionOptionsOutput += ")"
			}

		}
	}

	if (action.argsHint && action.argsHint.length > 0) {
		actionArgsOutput = `Args hints ->\n  `
		actionArgsOutput += action.argsHint.join("\n  ");
	}

	if (actionOptionsOutput) sections.push(actionOptionsOutput);
	if (actionArgsOutput) sections.push(actionArgsOutput);

	const output = renderSections(sections);

	console.log(output);

}
