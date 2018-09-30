/**
 * Loaders
 */
export interface Opts {
    [key: string]: any;
}
export interface CSSPluginOptions {
    preprocessor?: 'postcss' | 'sass' | 'less' | 'stylus';
    cssmodules?: boolean;
    loaderOpts?: Opts;
    cssOpts?: Opts;
    ruleOpts?: Opts;
}
export declare const css: (opts?: CSSPluginOptions) => import("docz-core/dist/Plugin").Plugin<any>;
