const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const TerserPlugin = require('terser-webpack-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
// const reactRefreshBabel = require('react-refresh/babel');
// const CopyWebpackPlugin = require("copy-webpack-plugin");

const ROOT = path.resolve(__dirname, ".");
const SOURCE = path.join(ROOT, "src");
const DEST = path.join(ROOT, "dist");

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

function envVariableMap() {
  const envKeys = ["NODE_ENV", "API_BASE_URL", "AUTH_BASE_URL", "DISABLE_PAYLOAD_CRYPTOGRAPHY", "MAX_PERMISSIBLE_LIMIT", "PERMISSIBLE_LIMIT", "X_API_KEY", "DEV_TOOL", "API_MOCK"];
  return {
    "process.env": envKeys.reduce((env, key) => {
      env[key] = JSON.stringify(process.env[key])
      return env
    }, {})
  }
}

const PATHS = {
  appPackageJson: path.join(SOURCE, "package.json"),
  appSrc: SOURCE,
  appBuild: DEST,
  appHtml: path.join(SOURCE, "index.html"),
  appIndex: path.join(SOURCE, "index.tsx"),
  appPath: ROOT,
};

const devPlugins = [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin(envVariableMap()),
    new HtmlWebpackPlugin({ template: PATHS.appHtml }),
    new ReactRefreshWebpackPlugin(),
    // new CopyWebpackPlugin({
    //   patterns : [
    //     // {
    //     //   from: "src/mockServiceWorker.js",
    //     //   to: "mockServiceWorker.js",
    //     // }
    //   ]
    // })
];
const prodPlugins = [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
        filename: '[name][contenthash:8].css',
        chunkFilename: '[id].css',
    }),
    new webpack.DefinePlugin(envVariableMap()),
    new HtmlWebpackPlugin({ template: PATHS.appHtml }),
    // new BundleAnalyzerPlugin(), // TODO: find a way to add this
];

const devServer = {
    publicPath: "/",
    contentBase: PATHS.appBuild,
    port: PORT,
    hot: true,
    historyApiFallback: true,
    disableHostCheck: true,
};

const optimization = {
    minimize: true,
    minimizer: [
        new TerserPlugin({
            terserOptions: {
                parse: { ecma: 8 },
                compress: {
                    ecma: 5,
                    warnings: false,
                    comparisons: false,
                    inline: 2,
                    drop_console: process.env.DEV_TOOL === "true" ? false : true,
                },
                mangle: { safari10: true,},
                output: {
                    ecma: 5,
                    comments: false,
                    ascii_only: true,
                },
            },
            // sourceMap: true //TODO: FROM env
        }),
        new CssMinimizerPlugin({
            minimizerOptions: {
              preset: ['default', { minifyFontValues: { removeQuotes: false } }],
              processorOptions: {
                parser: safePostCssParser,
                map: false,
              }
            },
        }),
    ],
    splitChunks: {
        chunks: 'all',
        name: false,
    },
    runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`,
    },
};

const typescriptLoader = {
    test: /\.(ts|tsx)$/,
    use: [
      {
          loader: 'babel-loader',
          options: {
              plugins: [
                  !IS_PROD && undefined,
              ].filter(Boolean),
          }
      }
    ],
    exclude: /node_modules/
};
const cssLoader = {
    test: /\.scss$/,
    use: [
        IS_PROD ? MiniCssExtractPlugin.loader : 'style-loader',
        {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
        },
        {
            loader: 'sass-loader',
            options: {
                implementation: require('sass'),
                sassOptions: {
                    fiber: require('fibers'),
                    sourceMap: true,
                    includePaths: ['node_modules'],
                },
                webpackImporter: false,
            }
        }
    ]
};
const urlLoader = {
    test: /\.(png|jpe?g|gif|svg)$/i,
    use: [
        {
            loader: 'url-loader',
            options: {
                limit: 8192,
            },
        },
    ],
};

const optImageLoader = {
  test: /\.(gif|png|jpe?g|svg)$/i,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[name].[contenthash:8].[ext]',
        outputPath: 'assets/images/',
        publicPath: 'assets/images/',
      }
    },
    {
      loader: 'image-webpack-loader',
      options: {
        mozjpeg: {
          progressive: true,
        },
        // optipng.enabled: false will disable optipng
        optipng: {
          enabled: false,
        },
        pngquant: {
          quality: [0.65, 0.90],
          speed: 4
        },
        gifsicle: {
          interlaced: false,
        },
        // the webp option will enable WEBP
        webp: {
          quality: 75
        }
      }
    },
  ],
}


const fontLoader = {
  test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[name].[contenthash:8].[ext]',
        outputPath: 'assets/fonts/',
        publicPath: 'assets/fonts/',
      }
    }
  ]
};

const loaders = {
    rules: [
        typescriptLoader,
        {
          oneOf: [
            cssLoader,
            fontLoader,
            urlLoader,
            optImageLoader,
            {
              loader: 'file-loader',
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: '[name].[contenthash:8].[ext]',
                outputPath: 'assets/misc/',
                publicPath: 'assets/misc/',
              },
            },
          ]
        }
    ]
}
const WEBPACK_CONFIG = {
    entry: {
        main: PATHS.appIndex,
    },
    output: {
        filename: IS_PROD ? '[name].[contenthash:8].js' : '[name].js',
        chunkFilename: IS_PROD ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
        path: PATHS.appBuild,
        publicPath: "/"
    },
    module: loaders,
    plugins: IS_PROD ? prodPlugins : devPlugins,
    optimization: IS_PROD ? optimization : undefined,
    mode: IS_PROD ? 'production' : 'development',
    devtool: IS_PROD ? undefined : 'inline-source-map',
    target: 'web',
    devServer: IS_PROD ? undefined : devServer,
    resolve: {
      extensions: ['.js','.ts', '.jsx', '.tsx'],
      alias: {
        assets: path.resolve(SOURCE, "./assets"),
        config: path.resolve(SOURCE, "./config"),
        type: path.resolve(SOURCE, "./common/types"),
        common: path.resolve(SOURCE, "./common"),
        component: path.resolve(SOURCE, "./component"),
        feature: path.resolve(SOURCE, "./feature"),
        pages: path.resolve(SOURCE, "./pages"),
      }
    }
};
module.exports = WEBPACK_CONFIG;

