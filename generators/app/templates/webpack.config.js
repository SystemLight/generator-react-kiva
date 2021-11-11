const path = require('path');

const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');

const MockServer = require('./mocks/mock-server');

/** @typedef { import('webpack/declarations/WebpackOptions').WebpackOptions } WebpackOptions  */
/** @typedef { import('webpack/declarations/WebpackOptions').OptimizationSplitChunksOptions } OptimizationSplitChunksOptions */
/** @typedef { import('webpack/declarations/WebpackOptions').RuleSetRules } RuleSetRules */
/** @typedef { import('webpack/declarations/WebpackOptions').WebpackPluginInstance } WebpackPluginInstance */
/** @typedef { import('webpack/declarations/WebpackOptions').WebpackPluginFunction } WebpackPluginFunction */
/** @typedef { (WebpackPluginInstance | WebpackPluginFunction)[] } WebpackPlugins */

const webpackDevClientEntry = require.resolve('react-dev-utils/webpackHotDevClient');
const targetDistPath = path.resolve(__dirname, 'dist');
const publicPath = '/';

/**
 * 获取开发服务器配置信息
 * 更多配置：https://v4.webpack.js.org/configuration/dev-server/#devserver
 * @type { Object } devServer
 */
const devServer = {
    stats: 'errors-only',
    clientLogLevel: 'silent',
    quiet: true,
    noInfo: true,
    overlay: true,
    open: false,
    openPage: '',
    transportMode: 'ws',
    disableHostCheck: false,
    contentBase: targetDistPath,
    writeToDisk: false,
    index: 'index.html',
    historyApiFallback: true,
    inline: true,
    hot: false,
    hotOnly: false,
    port: 8080,
    proxy: {
        '/proxy': {
            target: 'http://127.0.0.1:5000',
            pathRewrite: {'^/proxy': ''},
            changeOrigin: true,
            secure: false,
            autoRewrite: true,
            hostRewrite: 'localhost:8080/proxy',
            protocolRewrite: null
        }
    },
    before: function (app) {
        MockServer(app);
    }
};

/**
 * 切割代码块规则配置
 * 更多配置：https://v4.webpack.js.org/plugins/split-chunks-plugin/#configuration
 * @type { OptimizationSplitChunksOptions } splitChunks
 */
const splitChunks = {
    chunks: 'async',
    automaticNameDelimiter: '-',
    cacheGroups: {
        common: {
            name: 'common',
            chunks: 'all',
            priority: -20,
            minChunks: 2,
            reuseExistingChunk: true
        },
        vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: -10
        },
        react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](scheduler|react|react-dom|prop-types)/,
            chunks: 'all',
            enforce: true
        },
        antd: {
            name: 'antd',
            test: /[\\/]node_modules[\\/](@ant-design|antd)/,
            chunks: 'all'
        },
        styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true
        }
    }
};

/**
 * 获取加载Loader配置规则，https://v4.webpack.js.org/configuration/module/#rule
 * @param { boolean } isProduction
 * @return { RuleSetRules } rules
 */
const getLoader = function (isProduction) {
    // 获取生产环境和开发环境CSS Loader配置
    const getCssLoader = function (isProduction, less = false) {
        const basic = [
            'css-loader',
            'postcss-loader'
        ];

        if (isProduction) {
            basic.unshift(MiniCssExtractPlugin.loader);
        } else {
            basic.unshift('style-loader');
        }

        if (less) {
            basic.push({
                loader: 'less-loader',
                options: {
                    lessOptions: {
                        javascriptEnabled: true
                    }
                }
            });
        }

        return basic;
    };

    return [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: ['thread-loader', 'babel-loader']
        },
        {
            test: /\.jsx$/,
            use: ['thread-loader', 'babel-loader']
        },
        {
            test: /\.tsx?$/,
            use: [
                'thread-loader',
                'babel-loader',
                {
                    loader: 'ts-loader',
                    options: {
                        // https://github.com/TypeStrong/ts-loader#happypackmode
                        transpileOnly: true,
                        happyPackMode: true,
                        compilerOptions: {
                            jsx: 'preserve'
                        }
                    }
                }
            ]
        },
        {
            test: /\.css$/,
            use: getCssLoader(isProduction)
        },
        {
            test: /\.less$/,
            use: getCssLoader(isProduction, true)
        },
        {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            issuer: /\.tsx?$/,
            use: [
                'babel-loader',
                {
                    loader: '@svgr/webpack',
                    options: {
                        babel: false,
                        icon: true
                    }
                },
                {
                    loader: 'file-loader',
                    options: {
                        name: 'images/[name].[ext]',
                        publicPath: publicPath,
                        esModule: false
                    }
                }
            ]
        },
        {
            test: /\.(png|jpe?g|gif|svg)$/,
            use: [
                {
                    loader: 'url-loader',
                    options: {
                        limit: 8192,
                        fallback: 'file-loader',
                        name: 'images/[name].[fullhash:8].[ext]',
                        publicPath: publicPath,
                        esModule: false
                    }
                }
            ]
        },
        {
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            use: [
                {
                    loader: 'file-loader',
                    options: {
                        name: 'font/[name].[fullhash:8].[ext]',
                        publicPath: publicPath,
                        esModule: false
                    }
                }
            ]
        },
        {
            test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 8192,
                    fallback: 'file-loader',
                    name: 'media/[name].[fullhash:8].[ext]',
                    publicPath: publicPath,
                    esModule: false
                }
            }
        }
    ];
};

/**
 * 根据开发环境获取相对插件，https://v4.webpack.js.org/configuration/plugins/#plugins
 * @param { boolean } isProduction
 * @return { WebpackPlugins } plugins
 */
const getPlugin = function (isProduction) {
    // 生产环境插件
    const productPlugin = [
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:8].css',
            chunkFilename: 'css/[name].[contenthash:8].css'
        }),
        // 内联webpack runtime脚本。此脚本太小，网络请求耗费资源
        // https://github.com/facebook/create-react-app/issues/5358
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime\..*\.js$/])
    ];

    // 开发环境插件
    const developmentPlugin = [
        new WebpackBar(),
        new FriendlyErrorsWebpackPlugin({
            compilationSuccessInfo: {
                messages: ['Your application is running here: http://localhost:8080']
            }
        }),
        // https://github.com/TypeStrong/ts-loader#usage-with-webpack-watch
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/
        ])
    ];

    // 通用插件
    let basic = [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: __dirname + '/public',
                    to: targetDistPath,
                    globOptions: {
                        ignore: ['.*']
                    }
                }
            ]
        }),
        new HtmlWebpackPlugin({
            hash: false,
            filename: 'index.html',
            template: './template.ejs',
            inject: true,
            minify: isProduction ? {
                removeComments: true,
                collapseWhitespace: true,
                minifyCSS: true
            } : undefined
        })
    ];

    if (isProduction) {
        basic = basic.concat(productPlugin);
    } else {
        basic = basic.concat(developmentPlugin);
    }

    return basic;
};

/**
 * webpack 核心配置，https://v4.webpack.js.org/configuration/
 * @param { any } env
 * @param { any } argv
 * @return { WebpackOptions } options
 */
module.exports = function (env, argv) {
    const mode = argv.mode || 'development';
    const isProduction = mode === 'production';

    return {
        mode: mode,
        target: 'web',
        stats: 'errors-only',
        devtool: isProduction ? false : 'cheap-module-source-map',
        context: __dirname,
        resolve: {
            extensions: ['.js', '.ts', '.jsx', '.tsx'],
            alias: {
                '@': path.join(__dirname, 'src')
            }
        },
        devServer: devServer,
        optimization: {
            runtimeChunk: 'single',
            splitChunks: splitChunks,
            minimize: isProduction,
            minimizer: [
                new TerserJSPlugin(),
                new OptimizeCSSAssetsPlugin()
            ]
        },
        performance: {
            maxAssetSize: 3 * 1024 * 1024,
            maxEntrypointSize: 3 * 1024 * 1024
        },
        entry: isProduction ? './src/main.ts' : [
            webpackDevClientEntry,
            './src/main.ts'
        ],
        output: {
            filename: isProduction ? 'js/[name].[chunkhash:8].js' : 'js/[name].[fullhash:8].js',
            path: targetDistPath,
            publicPath: publicPath
        },
        module: {
            rules: getLoader(isProduction)
        },
        plugins: getPlugin(isProduction)
    };
};
