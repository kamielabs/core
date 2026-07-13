import { CoreHelpers } from "@helpers";
import { CoreProviders } from "@providers";

export type CoreHelpersContext = {
	providers: CoreProviders
}

export type ResolvePathHelperMethod = CoreHelpers["resolvePath"];
