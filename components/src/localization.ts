/**
 * Node-safe localization exports for @opentrons/components.
 *
 * Import from `@opentrons/components/localization` instead of the package root
 * when running outside a browser (scripts, tests, SSR). The root entry pulls in
 * React/DOM code and is not safe to load in bare Node.
 */
export {
  resources,
  shared_en_resources,
  shared_zh_resources,
} from './assets/localization'
