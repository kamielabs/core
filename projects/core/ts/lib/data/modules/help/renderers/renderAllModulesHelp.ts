import { Snapshot } from "@data/modules/help";
import { renderSections } from "@data/modules/help/shared";

export function renderAllModulesHelp(snapshot: Snapshot, helpCli: string) {

	const modules = snapshot.modules.modules;

	const sections: string[] = [];
	const header = `All Modules Help`
	const details = `Details:\n  ${helpCli} <module>`;
	sections.push(header, details);

	let modulesOutput = "Modules:";
	for (const [moduleName, module] of Object.entries(modules)) {
		modulesOutput += `\n  ${moduleName}`
		if (module.description) modulesOutput += ` -> ${module.description}`
	}
	sections.push(modulesOutput);

	console.log(renderSections(sections));
}
