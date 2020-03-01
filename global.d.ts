type ModuleConfig<T> = {
	defaults?: T;
	getDom(this: ModuleThis<T>): HTMLDivElement;
	[x: string]: any;
};

type ModuleThis<T> = { config: T };

type Module = {
	register<T>(moduleName: string, module: ModuleConfig<T>): void;
};

declare var Module: Module;
