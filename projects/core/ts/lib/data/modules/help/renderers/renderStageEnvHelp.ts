import { Snapshot } from "@data/modules/help";
import { renderSections } from "@data/modules/help/shared";

export function renderStageEnvHelp(snapshot: Snapshot, stage: string, env: string) {

	const sections: string[] = [];

	const stageOptionIndex = snapshot.stages.envIndex.byStage[stage]!.byEnv[env]!
	const stageOption = snapshot.stages.stages[stage]!.options[stageOptionIndex.optionName]!
	let header = `Stage Env Help:`
	header += `\n  ${stageOptionIndex.optionName}`
	header += stageOption.description ? `: ${stageOption.description}` : "";

	sections.push(header);

	const optionOutput = `Env: ${stageOption.env}\nDefault: '${stageOption.default}'`

	sections.push(optionOutput)

	console.log(renderSections(sections))
}
