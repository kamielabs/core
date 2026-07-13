export class CoreEventError extends Error {
	public readonly exitCode: number;

	public constructor(message: string, exitCode = 1) {
		super(message);
		this.name = "CoreEventError";
		this.exitCode = exitCode;
	}
}
