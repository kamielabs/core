import { Snapshot } from "@data/modules/help";
import { renderSections } from "@data/modules/help/shared";

export function renderAllStagesHelp(snapshot: Snapshot, helpCli: string, stageName: string) {
	const stage = snapshot.stages.stages[stageName]!


	const file = stage.file!;
	const options = stage.options!;


	const sections: string[] = [];
	const header = `All Stage Envs Help\nStage: ${stageName}\nConfig File: ${file}`
	const details = `Details:\n  ${helpCli} --stage-env=<STAGE_ENV>`
	sections.push(header, details);

	for (const [optionName, option] of Object.entries(options)) {
		let optionOutput = "";
		optionOutput += `${optionName}`;
		optionOutput += option.description ? `: ${option.description} ->` : " ->";
		optionOutput += `\n  Env: ${option.env}`;
		optionOutput += `\n  Default value: '${option.default}'`
		sections.push(optionOutput);
	}
	console.log(renderSections(sections))
}
