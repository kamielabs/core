import { Snapshot } from "@data/modules/help";
import { renderFlag, renderSections } from "@data/modules/help/shared";

export function renderModuleFlagHelp(snapshot: Snapshot, moduleName: string, flagName: string) {

	const module = snapshot.modules.moduleIndex.byName[moduleName]!

	const flag = module.options![flagName]!;

	let flagHead = `Module Flag Help: ${flagName}`
	flagHead += `\nModule: ${moduleName}`
	if (flag.description) flagHead += `\nDescription: ${flag.description}`;
	const flagOutput = renderFlag(flag);
	console.log(renderSections([flagHead, flagOutput]));
}
