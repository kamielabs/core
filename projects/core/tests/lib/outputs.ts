

const testScript = "node forks.js"

const normalHelp = `--------------------------------------------------------------------------------
Full Help:
  ${testScript} help --full (-f)
--------------------------------------------------------------------------------
All Stage Envs Help:
  ${testScript} help --stage-envs-all (-S)
--------------------------------------------------------------------------------
All Globals Help:
  ${testScript} help --globals-all (-G)
--------------------------------------------------------------------------------
All Modules Help:
  ${testScript} help --modules-all (-M)
--------------------------------------------------------------------------------
Staging Envs Help:
  ${testScript} help --stage-env=<STAGE_ENV>
--------------------------------------------------------------------------------
Global Help:
  ${testScript} help --global=<--globalFlag/GLOBAL_ENV>
--------------------------------------------------------------------------------
Module Help:
  ${testScript} help <module>
--------------------------------------------------------------------------------
Module Flag Help:
  ${testScript} help <module> <--flag>
--------------------------------------------------------------------------------
Action Help:
  ${testScript} help <module> <action>
--------------------------------------------------------------------------------
Action Flag Help:
  ${testScript} help <module> <action> <--flag>
--------------------------------------------------------------------------------`;

const fullHelp = `--------------------------------------------------------------------------------
Full Help
--------------------------------------------------------------------------------
Stage:
  Name: default
  File: .env
  Options:
    lang: define language to use ->
      Env: NODE_CLI_LANG
      Default value: 'en'
    workingDir: Working directory used in stage ->
      Env: WORKING_DIR
      Default value: ''
--------------------------------------------------------------------------------
Global Options:
  Group: core
    help:
      Description: show help
      env: _NODE_CLI_HELP
      flags:
        --help/-h
    version:
      Description: show version
      env: _NODE_CLI_VERSION
      flags:
        --version/-v
--------------------------------------------------------------------------------
Modules:
  help:
    Description: Display help information
    Type: Default Action Module
    Description: Show help
    Flags:
      fullHelp:
        --full/-f (-F/--all/-A)
      allModules:
        --modules-all/-M
      stageOption:
        --stage-env=<STAGE_ENV_VAR>/-s=<STAGE_ENV_VAR>
      allStageOptions:
        --stage-envs-all/-S
      globalOption:
        --global=<-f/--flag/GLOBAL_ENV_VAR>/-g=<-f/--flag/GLOBAL_ENV_VAR>
      allGlobalOptions:
        --globals-all/-G
    Args hints: [module], <module> <action>, <module> <--flag/-f>, <module> <action> <--flag/-f>
  version:
    Description: Show CLI version (and Core Build)
    Type: Default Action Module
    Description: Show Version
--------------------------------------------------------------------------------`;

const allGlobalOptionsHelp = `--------------------------------------------------------------------------------
All Global Options Help
--------------------------------------------------------------------------------
Details:
  ${testScript} help --global=<--flag/GLOBAL_ENV>
--------------------------------------------------------------------------------
Group: core
  help:
    env: _NODE_CLI_HELP
    flags:
      --help/-h
  version:
    env: _NODE_CLI_VERSION
    flags:
      --version/-v
--------------------------------------------------------------------------------`;

const allStageOptionsHelp = `--------------------------------------------------------------------------------
All Stage Envs Help
Stage: default
Config File: .env
--------------------------------------------------------------------------------
Details:
  ${testScript} help --stage-env=<STAGE_ENV>
--------------------------------------------------------------------------------
lang: define language to use ->
  Env: NODE_CLI_LANG
  Default value: 'en'
--------------------------------------------------------------------------------
workingDir: Working directory used in stage ->
  Env: WORKING_DIR
  Default value: ''
--------------------------------------------------------------------------------`;


const allModulesHelp = `--------------------------------------------------------------------------------
All Modules Help
--------------------------------------------------------------------------------
Details:
  ${testScript} help <module>
--------------------------------------------------------------------------------
Modules:
  help -> Display help information
  version -> Show CLI version (and Core Build)
--------------------------------------------------------------------------------`;

const stageOptionHelp = `--------------------------------------------------------------------------------
Stage Env Help:
  lang: define language to use
--------------------------------------------------------------------------------
Env: NODE_CLI_LANG
Default: 'en'
--------------------------------------------------------------------------------`;

const globalFlagHelp = `--------------------------------------------------------------------------------
Global Option Help: help
Group: core
Env Var: _NODE_CLI_HELP
--------------------------------------------------------------------------------
Available Flags:
  --help/-h
--------------------------------------------------------------------------------`;

const globalEnvVarHelp = globalFlagHelp;

const moduleDefaultActionHelp = `--------------------------------------------------------------------------------
Action Help: Default (Module: help)
Description: Show help
--------------------------------------------------------------------------------
Details:
  Flag: ${testScript} help help <-f/--flag/--alias>
--------------------------------------------------------------------------------
Flags ->
  fullHelp:
    --full/-f (-F/--all/-A)
  allModules:
    --modules-all/-M
  stageOption:
    --stage-env=<STAGE_ENV_VAR>/-s=<STAGE_ENV_VAR>
  allStageOptions:
    --stage-envs-all/-S
  globalOption:
    --global=<-f/--flag/GLOBAL_ENV_VAR>/-g=<-f/--flag/GLOBAL_ENV_VAR>
  allGlobalOptions:
    --globals-all/-G
--------------------------------------------------------------------------------
Args hints ->
  [module]
  <module> <action>
  <module> <--flag/-f>
  <module> <action> <--flag/-f>
--------------------------------------------------------------------------------`;

const moduleDefaultActionFlagHelp = `--------------------------------------------------------------------------------
Action Flag Help: fullHelp
Action: Default (Module:help)
Description: Display Full Help
--------------------------------------------------------------------------------
  long : --full
  short: -f
Aliases: -F/--all/-A
--------------------------------------------------------------------------------`;


const moduleHelp = `--------------------------------------------------------------------------------
Module Help: test
Description: Test Module for VITESTS
--------------------------------------------------------------------------------
Details:
  Action: ${testScript} help test <action>
  Flag: ${testScript} help test <-f/--flag/--alias>
--------------------------------------------------------------------------------
Flags:
  full:
    --full/-f
--------------------------------------------------------------------------------
Actions:
  test1: First Test Action for VITESTS
  test2: Second Test Action for VITESTS
--------------------------------------------------------------------------------`;

const moduleActionHelp = `--------------------------------------------------------------------------------
Action Help: test1 (Module: test)
Description: First Test Action for VITESTS
--------------------------------------------------------------------------------
Details:
  Flag: ${testScript} help test test1 <-f/--flag/--alias>
--------------------------------------------------------------------------------`;

const unknownModuleError = `Unknown Module: unknown`
const fullHelpUsage = `Full Help: ${testScript} help`

export const outputs = {
	normalHelp,
	fullHelp,
	allGlobalOptionsHelp,
	allStageOptionsHelp,
	allModulesHelp,
	stageOptionHelp,
	globalFlagHelp,
	globalEnvVarHelp,
	moduleDefaultActionHelp,
	moduleDefaultActionFlagHelp,
	moduleHelp,
	moduleActionHelp,
	unknownModuleError,
	fullHelpUsage
}
