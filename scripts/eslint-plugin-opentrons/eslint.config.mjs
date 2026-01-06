import pluginJs from '@eslint/js'
import eslintPlugin from 'eslint-plugin-eslint-plugin'
import pluginNode from 'eslint-plugin-n'

export default [
  pluginJs.configs.recommended,
  ...pluginNode.configs['flat/mixed-esm-and-cjs'],
  eslintPlugin.configs['flat/recommended'],
]
