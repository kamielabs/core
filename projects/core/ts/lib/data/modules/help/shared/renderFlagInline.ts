// export function renderFlagInline(
// 	flag: {
// 		long: string;
// 		short?: string;
// 		description?: string;
// 		aliases?: string[];
// 		valueHint?: string;
// 	},
// 	padding = 2
// ): string {
// 	let flagOutput = "";
// 	const flagValueHint = flag.valueHint ? `=${flag.valueHint}` : undefined;
// 	flagOutput += `  --${flag.long}`;
// 	if (flagValueHint) flagOutput += flagValueHint;
// 	if (flag.short) flagOutput += `/-${flag.short}`;
// 	if (flagValueHint) flagOutput += flagValueHint;
// 	if (flag.aliases) {
// 		flagOutput += " ("
// 		for (const alias of flag.aliases) {
// 			if (flag.aliases.indexOf(alias) !== 0) flagOutput += "/"
// 			if (alias.length === 1) {
// 				flagOutput += `-${alias}`;
// 			} else {
// 				flagOutput += `--${alias}`
// 			}
// 			if (flagValueHint) flagOutput += flagValueHint;
// 		}
// 		flagOutput += ")"
// 	}
// 	if (flag.description) flagOutput += `: ${flag.description}`;
//
// 	return flagOutput;
// }
export function renderFlagInline(
	flag: {
		long: string;
		short?: string;
		description?: string;
		aliases?: string[];
		valueHint?: string;
	},
	padding = 2
): string {

	const indent = " ".repeat(padding);

	let output = `${indent}--${flag.long}`;

	if (flag.valueHint) {
		output += `=<${flag.valueHint}>`;
	}

	if (flag.short) {
		output += `/-${flag.short}`;

		if (flag.valueHint) {
			output += `=<${flag.valueHint}>`;
		}
	}

	if (flag.aliases?.length) {

		output += " (";

		for (const alias of flag.aliases) {

			if (flag.aliases.indexOf(alias) !== 0) {
				output += "/";
			}

			output += alias.length === 1
				? `-${alias}`
				: `--${alias}`;

			if (flag.valueHint) {
				output += `=<${flag.valueHint}>`;
			}
		}

		output += ")";
	}

	if (flag.description) {
		output += `: ${flag.description}`;
	}

	return output;
}
