import { useTranslation } from 'react-i18next'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'

import { getDisabledChangeTipOptions } from './utils'

import type { ReactNode } from 'react'
import type { ChangeTipOptions } from '@opentrons/step-generation'
import type { FieldProps } from '../types'
import type { DisabledChangeTipArgs } from './utils'

const ALL_CHANGE_TIP_VALUES: ChangeTipOptions[] = [
  'always',
  'never',
  'once',
  'perDest',
  'perSource',
]

export function ChangeTipField(
  props: FieldProps & DisabledChangeTipArgs
): ReactNode {
  const {
    aspirateWells,
    dispenseWells,
    path,
    stepType,
    value,
    isDisposalLocation,
  } = props
  const { t } = useTranslation(['protocol_steps', 'form'])
  const disabledOptions = getDisabledChangeTipOptions({
    aspirateWells,
    dispenseWells,
    path,
    stepType,
    isDisposalLocation,
  })

  const options = ALL_CHANGE_TIP_VALUES.map(value => ({
    value,
    name: t(`form:step_edit_form.field.change_tip.option.${value}`),
    disabled: disabledOptions ? disabledOptions.has(value) : false,
  }))

  return (
    <DropdownStepFormField
      {...props}
      options={options}
      value={value}
      title={t('tip_handling.title')}
      width="100%"
    />
  )
}
