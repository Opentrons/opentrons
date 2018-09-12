// @flow
import i18n from '../../localization'

export default function getTooltipForField (stepType: ?string, name: string): ?string {
  if (!stepType) {
    console.error(`expected stepType for form, cannot getTooltipText for ${name}`)
    return null
  }

  const prefixes = ['aspirate_', 'dispense_']
  const nameWithoutPrefix = prefixes.some(prefix => name.startsWith(prefix))
    ? name.split('_').slice(1).join('_')
    : name

  // specificity cascade for names.
  // first level: try getting from step_fields.transfer, fallback to step_fields.default
  // second level: prefix. "aspirate_foo" wins over "foo"
  const text: string = i18n.t([
    `tooltip.step_fields.${stepType}.${name}`,
    `tooltip.step_fields.${stepType}.${nameWithoutPrefix}`,
    `tooltip.step_fields.defaults.${name}`,
    `tooltip.step_fields.defaults.${nameWithoutPrefix}`,
    '',
  ])

  return text || null
}
