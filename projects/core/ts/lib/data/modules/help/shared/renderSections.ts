import { blockDivider } from "@data/modules/help/shared";

export function renderSections(sections: string[]): string {
	let output = "";

	for (const section of sections) {
		output += blockDivider + "\n" + section + "\n";
	}
	output += blockDivider;

	return output;
}
