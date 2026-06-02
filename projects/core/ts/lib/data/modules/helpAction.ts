import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	BuiltinActionFlags
} from "@types";

import { ActionHook } from "@contexts";
import { HelpRoute } from "@data/modules/help";
import {
	renderActionFlagHelp,
	renderActionHelp,
	renderAllGlobalsHelp,
	renderAllModulesHelp,
	renderAllStagesHelp,
	renderFullHelp,
	renderGlobalFlagHelp,
	renderHelpError,
	renderModuleFlagHelp,
	renderModuleHelp,
	renderNormalHelp,
	renderStageEnvHelp
} from "@data/modules/help/renderers";

export const helpAction = <
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
>(): ActionHook<TEvents, TStages, TGlobals, TModules, TTranslations, BuiltinActionFlags<TModules, 'help', "__defaultAction__">> => {

	return async ({ options, args, snapshot, runtime }) => {
		const ignored = [...args];
		const [arg1, arg2, arg3] = args;

		const consumeArg = () => {
			ignored.shift();
		}

		const resolveCanonical = (
			input: string,
			aliases?: Record<string, string>
		) => aliases?.[input] ?? input;

		const resolveFlag = <
			T extends { optionName: string },
		>(
			flag: string,
			index?: { byKey: Record<string, T> }
		) => {

			const resolved = index?.byKey[flag];

			if (!resolved) {
				return {
					found: false,
					name: flag
				} as const;
			}

			return {
				found: true,
				name: resolved.optionName
			} as const;
		};

		const resolveGlobalFlag = (
			flag: string,
			index?: {
				byKey: Record<
					string,
					{
						groupName: string;
						optionName: string;
					}
				>
			}
		) => {

			const resolved = index?.byKey[flag];

			if (!resolved) {
				return {
					found: false,
					name: flag
				} as const;
			}

			return {
				found: true,
				group: resolved.groupName,
				name: resolved.optionName
			} as const;
		};

		const helpRoute = (): HelpRoute => {

			if (Object.entries(options).length > 1) {
				return { route: "helpFlagConflictError" }
			}

			const currentStage = runtime.stage!.name;

			if (options["full"]) return { route: "fullHelp", stage: currentStage };
			if (options["globals-all"]) return { route: "allGlobalsHelp" };
			if (options["modules-all"]) return { route: "allModulesHelp" };

			if (options["stage-envs-all"]) return { route: "allStageEnvsHelp", stage: currentStage };

			if (options["stage-env"]) {
				const env = options["stage-env"].toString();
				if (snapshot.stages.envIndex.byStage[currentStage]!.byEnv[env]) return { route: 'stageEnvHelp', stage: currentStage, env }
				return { route: "stageEnvNotFound", stage: currentStage, env }
			}

			if (options["global"]) {
				const globalOption = options["global"].toString();
				if (globalOption.startsWith('-')) {


					const globalFlag = resolveGlobalFlag(globalOption, snapshot.globals.flagIndex);

					if (globalFlag.found) return { route: "globalFlagHelp", group: globalFlag.group, flag: globalFlag.name };
					return { route: "globalFlagNotFound", flag: globalFlag.name };
				}
				const globalEnv = snapshot.globals.envIndex.byEnv[globalOption];
				if (globalEnv) {
					return { route: "globalFlagHelp", group: globalEnv.groupName, flag: globalEnv.optionName }
				}
				return { route: "globalFlagNotFound", flag: globalOption };
			}

			if (!arg1) { return { route: "normalHelp" }; }
			// on consomme arg1 vu qu'il existe quoiqu'il arrive
			consumeArg();

			if (arg1.startsWith("-")) {
				const globalFlag = resolveGlobalFlag(arg1, snapshot.globals.flagIndex);

				if (globalFlag.found) return { route: "globalFlagHelp", group: globalFlag.group, flag: globalFlag.name };

				return { route: "globalFlagNotFound", flag: globalFlag.name };
			}

			const moduleKey = resolveCanonical(arg1, snapshot.modules.moduleIndex.byAlias);
			const module = snapshot.modules.moduleIndex.byName[moduleKey];

			if (!module) {
				return { route: "moduleNotFound", module: arg1 };
			}

			if (!arg2) {
				return (module.defaultAction)
					? { route: "actionHelp", module: moduleKey, action: "__defaultAction__" }
					: { route: "moduleHelp", module: moduleKey };
			}

			// Arg2 existe alors on le consomme aussi
			consumeArg();

			if (arg2.startsWith("-")) {
				if (module.defaultAction) {
					const actionFlag = resolveFlag(arg2, snapshot.modules.flagIndex.action[moduleKey]!["__defaultAction__"]);

					if (actionFlag.found) return { route: "actionFlagHelp", module: moduleKey, action: "__defaultAction__", flag: actionFlag.name };
					return { route: "actionFlagNotFound", module: moduleKey, action: "__defaultAction__", flag: arg2 };
				}

				const moduleFlag = resolveFlag(arg2, snapshot.modules.flagIndex.module[moduleKey]);

				if (moduleFlag.found) return { route: "moduleFlagHelp", module: moduleKey, flag: moduleFlag.name };
				return { route: "moduleFlagNotFound", module: moduleKey, flag: moduleFlag.name };
			}

			const actionKey = resolveCanonical(arg2, snapshot.modules.actionIndex.byModule[moduleKey]?.byAlias);
			const action = snapshot.modules.actionIndex.byModule[moduleKey]!.byName[actionKey];

			if (!action) return { route: "actionNotFound", module: moduleKey, action: arg2 };

			if (!arg3) return { route: "actionHelp", module: moduleKey, action: actionKey };
			// Arg3 existe alors on le consomme aussi
			consumeArg();

			if (arg3.startsWith("-")) {
				const actionFlag = resolveFlag(arg3, snapshot.modules.flagIndex.action[moduleKey]![actionKey]);
				if (actionFlag.found) return { route: "actionFlagHelp", module: moduleKey, action: actionKey, flag: actionFlag.name };
				return { route: "actionFlagNotFound", module: moduleKey, action: actionKey, flag: arg3 };
			}
			return { route: "notAflagError", module: moduleKey, action: actionKey, flag: arg3 };

		}

		const help = helpRoute();


		const mode = "__defaultModule__" in snapshot.modules.modules ? 'single' : 'modular';
		const bootstrap = runtime.bootstrap!;
		const bin = bootstrap.script.ext === "js" ? "node" : "tsx"
		const script = bin + " " + bootstrap.script.file;

		const helpCli = mode === 'single'
			? `${script} --help`
			: `${script} help`;

		switch (help.route) {
			case "normalHelp": return renderNormalHelp(snapshot, helpCli);
			case "fullHelp": return renderFullHelp(snapshot, help.stage);
			case "allStageEnvsHelp": return renderAllStagesHelp(snapshot, helpCli, help.stage);
			case "allGlobalsHelp": return renderAllGlobalsHelp(snapshot, helpCli);
			case "allModulesHelp": return renderAllModulesHelp(snapshot, helpCli);
			case "globalFlagHelp": return renderGlobalFlagHelp(snapshot, help.group, help.flag);
			case "stageEnvHelp": return renderStageEnvHelp(snapshot, help.stage, help.env);
			case "moduleHelp": return renderModuleHelp(snapshot, helpCli, help.module);
			case "moduleFlagHelp": return renderModuleFlagHelp(snapshot, help.module, help.flag);
			case "actionHelp": return renderActionHelp(snapshot, helpCli, help.module, help.action);
			case "actionFlagHelp": return renderActionFlagHelp(snapshot, help.module, help.action, help.flag);

			case "stageEnvNotFound": return renderHelpError(helpCli, help);
			case "globalFlagNotFound": return renderHelpError(helpCli, help);
			case "moduleNotFound": return renderHelpError(helpCli, help);
			case "moduleFlagNotFound": return renderHelpError(helpCli, help);
			case "actionNotFound": return renderHelpError(helpCli, help);
			case "actionFlagNotFound": return renderHelpError(helpCli, help);
			case "helpFlagConflictError": return renderHelpError(helpCli, help);
			case "notAflagError": return renderHelpError(helpCli, help);
		}
	}
};

