import { Snapshot } from "@data/modules/help";
import { renderFlagInline, renderSections } from "@data/modules/help/shared";

export function renderGlobalFlagHelp(snapshot: Snapshot, groupName: string, optionName: string) {

	const option = snapshot.globals.options[groupName]![optionName]!;



	let header = `Global Option Help: ${optionName}`
	header += `\nGroup: ${groupName}`
	header += `\nEnv Var: ${option.env}`

	const sections: string[] = [];
	sections.push(header);

	let flagsOutput: string | undefined = undefined;

	if (option.cli && option.cli.length > 0) {
		flagsOutput = `Available Flags:`
		for (const flag of option.cli) {
			flagsOutput += "\n" + renderFlagInline(flag);
		}
	}

	if (flagsOutput) sections.push(flagsOutput);

	console.log(renderSections(sections));
}
