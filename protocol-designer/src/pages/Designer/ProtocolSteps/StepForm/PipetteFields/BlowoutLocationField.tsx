import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { selectors as uiLabwareSelectors } from '/protocol-designer/ui/labware'

import type { ReactNode } from 'react'
import type { DropdownOption } from '@opentrons/components'
import type { FieldProps } from '../types'

type BlowoutLocationDropdownProps = FieldProps & {
  options: DropdownOption[]
}

export function BlowoutLocationField(
  props: BlowoutLocationDropdownProps
): ReactNode {
  const { options: propOptions, ...restProps } = props
  const { t } = useTranslation('protocol_steps')
  const disposalOptions = useSelector(uiLabwareSelectors.getDisposalOptions)
  const options = [...disposalOptions, ...propOptions]

  return (
    <DropdownStepFormField
      title={t('blowout_location')}
      options={options}
      {...restProps}
      width="100%"
    />
  )
}
