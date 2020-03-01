type ModuleConfig<T, K> = {
	defaults?: T;
	getDom(this: ModuleThis<T> & K): HTMLDivElement;
	start(this: ModuleThis<T> & K): void;
	[x: string]: any;
};

type ModuleThis<T> = { config: T };

type Module = {
	register<T, K>(moduleName: string, module: ModuleConfig<T, K>): void;
};

declare var Module: Module;
