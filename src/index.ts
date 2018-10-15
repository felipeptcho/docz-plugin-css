import { createPlugin } from 'docz-core'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import merge from 'deepmerge'

import { getLocalIdent } from './get-local-ident'

/**
 * Tests
 */

type PreProcessor = 'default' | 'sass' | 'less' | 'stylus'
const tests: Record<PreProcessor, RegExp> = {
  default: /(\.module)?\.css$/,
  sass: /(\.module)?\.s(a|c)ss$/,
  less: /(\.module)?\.less$/,
  stylus: /(\.module)?\.styl(us)?$/,
}

/**
 * Loaders
 */

export interface Opts {
  [key: string]: any
}

const getStyleLoaders = (loader?: any, opts: Opts = {}) => (
  cssopts: any,
  postcssopts: any,
  dev: boolean
) => {
  const result = [
    {
      loader: dev
        ? require.resolve('style-loader')
        : MiniCssExtractPlugin.loader,
    },
    {
      loader: require.resolve('css-loader'),
      options: cssopts,
    },
    {
      loader: require.resolve('postcss-loader'),
      options: postcssopts,
    },
  ]

  if (loader) {
    result.push({
      loader,
      options: opts,
    })
  }

  return result
}

const loaders = {
  default: (opts: Opts = { plugins: [] }) => getStyleLoaders(),

  sass: (opts: Opts = {}) =>
    getStyleLoaders(
      require.resolve('sass-loader'),
      merge(opts, { indentedSyntax: false })
    ),

  less: (opts: Opts = {}) =>
    getStyleLoaders(require.resolve('less-loader'), opts),

  stylus: (opts: Opts = {}) =>
    getStyleLoaders(
      require.resolve('stylus-loader'),
      merge(opts, { preferPathResolver: 'webpack' })
    ),
}

/**
 * Rules
 */

const applyRule = (
  opts: CSSPluginOptions,
  cssmodules: boolean | undefined,
  dev: boolean
) => {
  const { preprocessor, cssOpts, postcssOpts, loaderOpts, ruleOpts } = opts

  const loaderfn = loaders[preprocessor as PreProcessor]
  const loader = loaderfn(loaderOpts)
  const cssoptions = merge(cssOpts, {
    importLoaders: 1,
    modules: cssmodules,
    sourceMap: !dev,
    ...(cssmodules && { getLocalIdent }),
  })
  const postcssoptions = merge(postcssOpts, {
    plugins: (loader: any) => {
      let plugins = [
        require('postcss-flexbugs-fixes'),
        require('autoprefixer')({
          flexbox: 'no-2009',
        }),
      ]

      if (postcssOpts && postcssOpts.plugins) {
        if (
          Object.prototype.toString.call(postcssOpts.plugins) ===
          '[object Function]'
        ) {
          postcssOpts.plugins = postcssOpts.plugins(loader)
        }

        if (Array.isArray(postcssOpts.plugins)) {
          plugins = postcssOpts.plugins.concat(plugins)
        }
      }

      return plugins
    },
  })

  return {
    test: tests[preprocessor as PreProcessor],
    use: loader(cssoptions, postcssoptions, dev),
    ...ruleOpts,
  }
}

export interface CSSPluginOptions {
  preprocessor?: 'default' | 'sass' | 'less' | 'stylus'
  cssmodules?: boolean
  loaderOpts?: Opts
  cssOpts?: Opts
  postcssOpts?: Opts
  ruleOpts?: Opts
}

const defaultOpts: Record<string, any> = {
  preprocessor: 'default',
  cssmodules: false,
  loadersOpts: {},
  cssOpts: {},
  ruleOpts: {},
}

export const css = (opts: CSSPluginOptions = defaultOpts) =>
  createPlugin({
    modifyBundlerConfig: (config, dev) => {
      config.module.rules.push(applyRule(opts, opts.cssmodules, dev))

      if (!dev) {
        const test = tests[opts.preprocessor || ('default' as PreProcessor)]
        const minimizer = config.optimization.minimizer || []
        const splitChunks = { ...config.optimization.splitChunks }

        config.optimization.minimizer = minimizer.concat([
          new OptimizeCSSAssetsPlugin({}),
        ])

        config.optimization.splitChunks = merge(splitChunks, {
          cacheGroups: {
            styles: {
              test: (m: any) => test.test(m.type),
              name: 'styles',
              chunks: 'all',
              enforce: true,
            },
          },
        })

        config.plugins.push(
          new MiniCssExtractPlugin({
            filename: 'static/css/[name].[hash].css',
          })
        )
      }

      return config
    },
  })
