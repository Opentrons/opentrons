import { useTranslation } from 'react-i18next'
import {
  FormGroup,
  SelectField,
  LegacyTooltip,
  useHoverTooltip,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { getDisabledChangeTipOptions } from './getDisabledChangeTipOptions'
import styles from '../../StepEditForm.module.css'
import type { DisabledChangeTipArgs } from './getDisabledChangeTipOptions'
import type { ChangeTipOptions } from '@opentrons/step-generation'
import type { FieldProps } from '../../types'

const ALL_CHANGE_TIP_VALUES: ChangeTipOptions[] = [
  'always',
  'once',
  'perSource',
  'perDest',
  'never',
]
type Props = FieldProps & DisabledChangeTipArgs

export const ChangeTipField = (props: Props): JSX.Element => {
  const {
    aspirateWells,
    dispenseWells,
    name,
    path,
    stepType,
    updateValue,
    value,
  } = props
  const { t } = useTranslation('form')
  const disabledOptions = getDisabledChangeTipOptions({
    aspirateWells,
    dispenseWells,
    path,
    stepType,
  })

  const options = ALL_CHANGE_TIP_VALUES.map(value => ({
    value,
    isDisabled: disabledOptions ? disabledOptions.has(value) : false,
  }))

  return (
    <FormGroup
      label={t('step_edit_form.field.change_tip.label')}
      className={styles.large_field}
    >
      <SelectField
        name={name}
        options={options}
        value={value ? String(value) : null}
        onValueChange={(name, value) => {
          updateValue(value)
        }}
        formatOptionLabel={({ value }) => (
          <ChangeTipOptionLabel value={value} />
        )}
      />
    </FormGroup>
  )
}

interface LabelProps {
  value: string
}

const ChangeTipOptionLabel = (props: LabelProps): JSX.Element => {
  const { value } = props
  const { t } = useTranslation('form')
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })
  return (
    <>
      <div {...targetProps}>
        {t(`step_edit_form.field.change_tip.option.${value}`)}
        <LegacyTooltip {...tooltipProps}>
          <div className={styles.tooltip}>
            {t(`step_edit_form.field.change_tip.option_tooltip.${value}`)}
          </div>
        </LegacyTooltip>
      </div>
    </>
  )
}
