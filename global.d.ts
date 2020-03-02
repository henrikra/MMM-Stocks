type ModuleConfig<T, K> = {
	defaults?: T;
	getDom(this: ModuleThis<T> & K): HTMLDivElement;
	start(this: ModuleThis<T> & K): void;
	getStyles?(this: ModuleThis<T> & K): string[];
	[x: string]: any;
};

type ModuleThis<T> = {
	config: T;
	updateDom(speed?: number): void;
	file(filename: string): string;
};

type Module = {
	register<T, K>(moduleName: string, module: ModuleConfig<T, K>): void;
};

declare var Module: Module;
