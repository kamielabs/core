import { Snapshot } from "@data/modules/help";
import { renderSections } from "@data/modules/help/shared";


export function renderNormalHelp(_snapshot: Snapshot, helpCli: string) {

	const fullHelp = `Full Help:\n  ${helpCli} --full (-f)`
	const allStageEnvsHelp = `All Stage Envs Help:\n  ${helpCli} --stage-envs-all (-S)`
	const allGlobalsHelp = `All Globals Help:\n  ${helpCli} --globals-all (-G)`
	const allModulesHelp = `All Modules Help:\n  ${helpCli} --modules-all (-M)`
	const stageEnvHelp = `Staging Envs Help:\n  ${helpCli} --stage-env=<STAGE_ENV>`
	const globalHelp = `Global Help:\n  ${helpCli} --global=<--globalFlag/GLOBAL_ENV>`
	const moduleHelp = `Module Help:\n  ${helpCli} <module>`
	const moduleFlagHelp = `Module Flag Help:\n  ${helpCli} <module> <--flag>`
	const actionHelp = `Action Help:\n  ${helpCli} <module> <action>`
	const actionFlagHelp = `Action Flag Help:\n  ${helpCli} <module> <action> <--flag>`

	const sections = [fullHelp, allStageEnvsHelp, allGlobalsHelp, allModulesHelp, stageEnvHelp, globalHelp, moduleHelp, moduleFlagHelp, actionHelp, actionFlagHelp]
	console.log(renderSections(sections));

}
