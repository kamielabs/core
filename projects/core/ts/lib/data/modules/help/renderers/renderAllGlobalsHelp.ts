import { Snapshot } from "@data/modules/help";
import { renderFlagInline, renderSections } from "@data/modules/help/shared";

export function renderAllGlobalsHelp(snapshot: Snapshot, helpCli: string) {

	const globals = snapshot.globals.options;

	const sections: string[] = [];
	const header = `All Global Options Help`
	const details = `Details:\n  ${helpCli} --global=<--flag/GLOBAL_ENV>`;
	sections.push(header, details);

	for (const [groupName, group] of Object.entries(globals)) {

		let groupOutput = `Group: ${groupName}`;

		for (const [optionName, option] of Object.entries(group)) {

			groupOutput += `\n  ${optionName}:`;

			groupOutput += `\n    env: ${option.env}`;

			if (option.cli && option.cli.length > 0) {

				groupOutput += `\n    flags:`;

				for (const flag of option.cli) {
					groupOutput += `\n${renderFlagInline(flag, 6)}`;
				}
			}
		}

		sections.push(groupOutput);
	}

	const output = renderSections(sections);

	console.log(output);
}
