import babel            from '@rollup/plugin-babel';
import { nodeResolve }  from '@rollup/plugin-node-resolve';

const config = {
  input: 'src/index.js',
  external: [],
  output: {
    file: 'lib/index.js',
    format: 'umd',
    name: 'vue_dsl',
    sourcemap: false
  },

  plugins: [
    nodeResolve(),
    babel({
      presets: [
        ['@babel/preset-env',
        {
          targets: {
            esmodules: true,
          },
        }]
      ],
      exclude: '**/node_modules/**',
      babelHelpers: 'bundled',
    })
  ]
};

export default config;