import { RuntimeService, SnapshotService, ToolsService } from "@services"

export type CoreServicesContext = {
	tools: ToolsService
	snapshot: SnapshotService,
	runtime: RuntimeService
}
