export function wrapCliLine(
	parts: string[],
	maxLength: number = 80,
	indent: string = "     "
): string {

	const lines: string[] = [];

	let currentLine = "";

	for (const part of parts) {

		// First token of line
		if (currentLine.length === 0) {
			currentLine = part;
			continue;
		}

		const next = `${currentLine} ${part}`;

		// Still fits current line
		if (next.length <= maxLength) {
			currentLine = next;
			continue;
		}

		// Wrap current line
		lines.push(currentLine + " \\");

		// Start new wrapped line
		currentLine = indent + part;
	}

	// Push remaining line
	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	return lines.join("\n");
}
