#!/usr/bin/env node

import { CLI } from "@kamie-oss/core"

const cli = CLI.init({
	modules: {
		test: {
			description: "Test Module for VITESTS",
			options: {
				full: {
					long: "full",
					short: "f",
					value: "full"
				}
			},
			actions: {
				test1: {
					description: "First Test Action for VITESTS"
				},
				test2: {
					description: "Second Test Action for VITESTS"
				}
			}
		}
	}
});

async function main() {
	await cli.run();
}

main();
