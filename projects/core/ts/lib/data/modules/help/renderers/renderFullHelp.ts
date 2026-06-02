import { Snapshot } from "@data/modules/help";
import { renderFlagInline, renderFullAction, renderSections } from "@data/modules/help/shared";
import { ModuleInfos } from "@types";

export function renderFullHelp(snapshot: Snapshot, stageName: string) {


	const sections: string[] = [];

	const header = "Full Help";
	sections.push(header);


	const stage = snapshot.stages.stages[stageName]!

	const file = stage.file!;
	const stageOptions = stage.options!;

	const stageHeader = `Stage:\n  Name: ${stageName}\n  File: ${file}`

	let stageOutput = stageHeader + "\n  Options:\n"
	let firstOpt = true;
	for (const [optionName, option] of Object.entries(stageOptions)) {
		if (!firstOpt) stageOutput += "\n";
		firstOpt = false;
		stageOutput += `    ${optionName}`;
		stageOutput += option.description ? `: ${option.description} ->` : " ->";
		stageOutput += `\n      Env: ${option.env}`;
		stageOutput += `\n      Default value: '${option.default}'`
	}
	stageOutput.trim()
	sections.push(stageOutput);


	const globals = snapshot.globals.options;
	const globalsHeader = `Global Options:`;

	let globalsOutput = globalsHeader;
	for (const [groupName, group] of Object.entries(globals)) {

		globalsOutput += `\n  Group: ${groupName}`;

		for (const [optionName, option] of Object.entries(group)) {

			globalsOutput += `\n    ${optionName}:`;

			if (option.description) globalsOutput += `\n      Description: ${option.description}`;

			globalsOutput += `\n      env: ${option.env}`;

			if (option.cli && option.cli.length > 0) {

				globalsOutput += `\n      flags:`;

				for (const flag of option.cli) {
					globalsOutput += `\n${renderFlagInline(flag, 8)}`;
				}
			}
		}

	}
	sections.push(globalsOutput);


	const modules = snapshot.modules.modules;
	const modulesHeader = `Modules:`

	let modulesOutput = modulesHeader;

	for (const moduleEntry of Object.entries(modules)) {
		const [moduleName, module]: [string, ModuleInfos] = moduleEntry;
		modulesOutput += `\n  ${moduleName}:`
		if (module.description) modulesOutput += `\n    Description: ${module.description}`
		if (module.defaultAction) {
			const action = module.defaultAction["__defaultAction__"];
			modulesOutput += `\n    Type: Default Action Module`;
			modulesOutput += `\n${renderFullAction('', action)}`
		}
		if (module.actions) {
			for (const [actionName, action] of Object.entries(module.actions)) {
				modulesOutput += `\n    Type: Multi Actions Module`;
				modulesOutput += `\n${renderFullAction(actionName, action)}`
			}
		}
	}

	sections.push(modulesOutput);

	console.log(renderSections(sections))

}

