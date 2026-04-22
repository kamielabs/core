import { FinalGlobals } from "@data";
import { GlobalOption, ParsedOptionValue, EnvIndex, FlagIndex } from "@types"


export type GlobalsShape = Record<string, GlobalOption<string, ParsedOptionValue>>;

export type CoreGlobalsShape = Record<string, GlobalsShape>;

export interface CoreGlobalsDecl<
	TGlobals extends CoreGlobalsShape
> {
	options: FinalGlobals<TGlobals>;
	flagIndex: FlagIndex;
	envIndex: EnvIndex;
}


export type RuntimeGlobalOption = Record<string, ParsedOptionValue>;
export type RuntimeGlobalOptions = Record<string, RuntimeGlobalOption>;

// export type RuntimeGlobalsFacts = Record<string, Record<string, ParsedOptionValue>>;

export type RuntimeGlobalsFacts = {
	[Group in string]: {
		[Key in string]: ParsedOptionValue;
	}
}

type WidenLiteral<T> =
	T extends string ? string :
	T extends number ? number :
	T extends boolean ? boolean :
	T;

type ExtractGlobalsGroupValues<TGroup> = {
	[K in keyof TGroup]:
	TGroup[K] extends GlobalOption<string, infer D>
	? WidenLiteral<D>
	: ParsedOptionValue;
};

export type ExtractGlobalsValues<TGlobals extends CoreGlobalsShape> = {
	[G in keyof FinalGlobals<TGlobals>]:
	ExtractGlobalsGroupValues<FinalGlobals<TGlobals>[G]>;
};

export type ExtractGlobals<TGlobals extends CoreGlobalsShape> = {

	[G in keyof FinalGlobals<TGlobals>]: {
		[K in keyof FinalGlobals<TGlobals>[G]]:
		FinalGlobals<TGlobals>[G][K] extends GlobalOption<string, infer D>
		? WidenLiteral<D>
		: ParsedOptionValue;
	}
}





