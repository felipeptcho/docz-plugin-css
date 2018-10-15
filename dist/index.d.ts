/**
 * Loaders
 */
export interface Opts {
    [key: string]: any;
}
export interface CSSPluginOptions {
    preprocessor?: 'default' | 'sass' | 'less' | 'stylus';
    cssmodules?: boolean;
    loaderOpts?: Opts;
    cssOpts?: Opts;
    postcssOpts?: Opts;
    ruleOpts?: Opts;
}
export declare const css: (opts?: CSSPluginOptions) => import("docz-core/dist/Plugin").Plugin<any>;
