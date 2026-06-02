import { Snapshot } from "@data/modules/help";
import { renderFlag, renderSections } from "@data/modules/help/shared";

export function renderActionFlagHelp(snapshot: Snapshot, moduleName: string, actionName: string, flagName: string) {

	const actionLabel = actionName === "__defaultAction__" ? "Default" : actionName;
	const action = snapshot.modules.actionIndex.byModule[moduleName]!.byName[actionName]!;

	const flag = action.options![flagName]!;

	let flagHead = `Action Flag Help: ${flagName}`
	flagHead += `\nAction: ${actionLabel} (Module:${moduleName})`
	if (flag.description) flagHead += `\nDescription: ${flag.description}`;

	const flagOutput = renderFlag(flag);
	console.log(renderSections([flagHead, flagOutput]));
}
