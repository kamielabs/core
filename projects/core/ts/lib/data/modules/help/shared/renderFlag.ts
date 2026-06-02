export function renderFlag(
	flag: {
		long: string;
		short?: string;
		description?: string;
		aliases?: string[];
		valueHint?: string;
	}
): string {
	let flagOutput = "";
	const flagValueHint = flag.valueHint ? `=${flag.valueHint}` : undefined;
	flagOutput += `  long : --${flag.long}`;
	if (flagValueHint) flagOutput += flagValueHint;
	if (flag.short) flagOutput += `\n  short: -${flag.short}`;
	if (flagValueHint) flagOutput += flagValueHint;
	if (flag.aliases) {
		flagOutput += "\nAliases: "
		for (const alias of flag.aliases) {
			if (flag.aliases.indexOf(alias) !== 0) flagOutput += "/"
			if (alias.length === 1) {
				flagOutput += `-${alias}`;
			} else {
				flagOutput += `--${alias}`
			}
			if (flagValueHint) flagOutput += flagValueHint;
		}
	}

	return flagOutput;
}
