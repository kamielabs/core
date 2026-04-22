export type NodeEnvEnum = 'dev' | 'prod';

export interface RuntimeScript {
	full: Readonly<string[]>;
	raw: string;
	name: string;
	path: string;
	file: string;
	ext: string;
	args: string[];
}

export type RuntimeEnv = Readonly<NodeJS.ProcessEnv>;

export interface RuntimeCoreFacts {
	node: string;
	script: RuntimeScript;
	cwd: string;
	envs: RuntimeEnv;
}
