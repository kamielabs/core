import { ActionInfos } from "@types";

export function renderFullAction(name: string, action: ActionInfos, padding = 2): string {
	const indent = " ".repeat(padding);
	const indentCat = " ".repeat(padding * 2);
	const indentFlag = " ".repeat(padding * 3);
	const indentFlagDetails = " ".repeat(padding * 4);

	let output = name === '' ? '' : `${indent}${name}`;
	if (action.description) {
		output += output !== '' ? '\n' : '';

		output += `${indentCat}Description: ${action.description}`;
	}
	if (action.options) {
		output += output !== '' ? '\n' : '';
		output += `${indentCat}Flags:`;
		for (const [flagName, flag] of Object.entries(action.options)) {

			const flagValueHint = flag.valueHint ? `=${flag.valueHint}` : undefined;

			output += `\n${indentFlag}${flagName}:`;
			output += `\n${indentFlagDetails}--${flag.long}`;
			if (flagValueHint) output += flagValueHint;


			if (flag.short) {
				output += `/-${flag.short}`;
				if (flagValueHint) output += flagValueHint;

			}


			if (flag.aliases) {
				output += " ("
				for (const alias of flag.aliases) {
					if (flag.aliases.indexOf(alias) !== 0) output += "/"
					if (alias.length === 1) {
						output += `-${alias}`;
					} else {
						output += `--${alias}`
					}
					if (flagValueHint) output += flagValueHint;
				}
				output += ")"
			}

		}
	}

	if (action.argsHint && action.argsHint.length > 0) {
		output += `\n${indentCat}Args hints: `
		output += action.argsHint.join(", ");
	}

	return output;

}
