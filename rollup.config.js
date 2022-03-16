import { join } from 'path'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

export const ALIAS_ENTRIES = {
  '@opentrons/api-client': join(__dirname, './api-client/src/index.ts'),
  '@opentrons/react-api-client': join(
    __dirname,
    './react-api-client/src/index.ts'
  ),
}

const input = ({ packageName }) => ({
  input: join(packageName, 'src', 'index.ts'),
})

const output = ({ packageName, browser }) => ({
  output: [
    {
      file: join(
        packageName,
        'dist',
        `${packageName}${browser ? '.browser' : ''}.js`
      ),
      format: 'cjs',
      sourcemap: true,
      plugins: [terser()],
    },
    {
      file: join(
        packageName,
        'dist',
        `${packageName}${browser ? '.browser' : ''}.mjs`
      ),
      format: 'esm',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
})

const plugins = ({ browser }) => ({
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      },
    }),
    alias({
      entries: ALIAS_ENTRIES,
    }),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.ts', '.tsx'],
      exclude: '**/node_modules/**',
      rootMode: 'upward',
    }),
    resolve({
      preferBuiltins: true,
      extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
      browser,
    }),
    json(),
    commonjs(),
  ],
})

const configs = [
  { packageName: 'api-client' },
  { packageName: 'api-client', browser: true },
  { packageName: 'react-api-client', browser: true },
].map(options => ({
  ...input(options),
  ...output(options),
  ...plugins(options),
  external: ['react'],
}))

// eslint-disable-next-line import/no-default-export
export default configs
