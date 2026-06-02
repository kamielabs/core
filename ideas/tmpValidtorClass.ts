/* -------------------------------------------------------------------------- */
/* Runtime schema validator                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Minimal deterministic runtime validator.
 *
 * Goals:
 * - validate core declarative user inputs
 * - zero transformation
 * - zero coercion
 * - enum-aware
 * - optional-aware
 * - recursive object support
 * - lightweight unions via validateOneOf()
 *
 * NOT intended to replace zod/yup/etc.
 */

export type RuntimeSchema =
	| RuntimePrimitive
	| RuntimeEnum
	| RuntimeObjectSchema;

export type RuntimePrimitive =
	| "string"
	| "number"
	| "boolean"
	| "object"
	| "array"
	| "any"
	| "never"
	| "string?"
	| "number?"
	| "boolean?"
	| "object?"
	| "array?"
	| "any?"
	| "never?"
	| "string[]"
	| "string[]?";

export type RuntimeEnum = Record<string | number, unknown>;

export type RuntimeObjectSchema = {
	[key: string]: RuntimeSchema;
};

export class RuntimeSchemaValidator {

	/* ---------------------------------------------------------------------- */
	/* Public API                                                             */
	/* ---------------------------------------------------------------------- */

	public static validateSchema(
		value: unknown,
		schema: RuntimeObjectSchema,
		path = "root"
	): void {

		if (!this.isPlainObject(value)) {
			throw new Error(
				`Invalid object at "${path}"`
			);
		}

		for (const [key, validator] of Object.entries(schema)) {

			const currentPath = `${path}.${key}`;

			const property = (value as Record<string, unknown>)[key];

			this.validateProperty(
				property,
				validator,
				currentPath
			);
		}
	}

	public static validateOneOf(
		value: unknown,
		schemas: RuntimeObjectSchema[],
		path = "root"
	): void {

		const errors: string[] = [];

		for (const schema of schemas) {
			try {
				this.validateSchema(
					value,
					schema,
					path
				);

				return;
			} catch (error) {

				if (error instanceof Error) {
					errors.push(error.message);
				}
			}
		}

		throw new Error(
			`No matching schema for "${path}"\n${errors.join("\n")}`
		);
	}

	/* ---------------------------------------------------------------------- */
	/* Property validation                                                    */
	/* ---------------------------------------------------------------------- */

	private static validateProperty(
		value: unknown,
		validator: RuntimeSchema,
		path: string
	): void {

		/* ------------------------------------------------------------------ */
		/* Primitive validator strings                                        */
		/* ------------------------------------------------------------------ */

		if (typeof validator === "string") {

			const optional = validator.endsWith("?");

			const normalized = optional
				? validator.slice(0, -1)
				: validator;

			// undefined + optional -> valid
			if (value === undefined && optional) {
				return;
			}

			switch (normalized) {

				case "string":
					if (typeof value !== "string") {
						this.throwTypeError(path, "string", value);
					}
					return;

				case "number":
					if (typeof value !== "number") {
						this.throwTypeError(path, "number", value);
					}
					return;

				case "boolean":
					if (typeof value !== "boolean") {
						this.throwTypeError(path, "boolean", value);
					}
					return;

				case "object":
					if (!this.isPlainObject(value)) {
						this.throwTypeError(path, "object", value);
					}
					return;

				case "array":
					if (!Array.isArray(value)) {
						this.throwTypeError(path, "array", value);
					}
					return;

				case "string[]":
					if (!Array.isArray(value)) {
						this.throwTypeError(path, "string[]", value);
					}

					for (const item of value) {
						if (typeof item !== "string") {
							this.throwTypeError(
								path,
								"string[]",
								value
							);
						}
					}

					return;

				case "any":
					return;

				case "never":
					if (value !== undefined) {
						throw new Error(
							`Property "${path}" is forbidden`
						);
					}
					return;

				default:
					throw new Error(
						`Unknown validator "${normalized}" at "${path}"`
					);
			}
		}

		/* ------------------------------------------------------------------ */
		/* Enum validator                                                     */
		/* ------------------------------------------------------------------ */

		if (this.isEnumObject(validator)) {

			if (
				typeof value !== "number" ||
				validator[value] === undefined
			) {
				throw new Error(
					`Invalid enum value at "${path}"`
				);
			}

			return;
		}

		/* ------------------------------------------------------------------ */
		/* Nested object schema                                               */
		/* ------------------------------------------------------------------ */

		if (this.isPlainObject(validator)) {

			this.validateSchema(
				value,
				validator,
				path
			);

			return;
		}

		throw new Error(
			`Unknown validator type at "${path}"`
		);
	}

	/* ---------------------------------------------------------------------- */
	/* Helpers                                                                */
	/* ---------------------------------------------------------------------- */

	private static isPlainObject(
		value: unknown
	): value is Record<string, unknown> {

		return (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value)
		);
	}

	private static isEnumObject(
		value: unknown
	): value is RuntimeEnum {

		return (
			this.isPlainObject(value)
		);
	}

	private static throwTypeError(
		path: string,
		expected: string,
		received: unknown
	): never {

		const receivedType = Array.isArray(received)
			? "array"
			: typeof received;

		throw new Error(
			`Invalid type at "${path}"\nExpected: ${expected}\nReceived: ${receivedType}`
		);
	}
}
