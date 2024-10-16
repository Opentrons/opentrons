import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { selectors as uiLabwareSelectors } from '../../../../../ui/labware'
import { DropdownStepFormField } from '../../../../../molecules'
import type { Options } from '@opentrons/components'
import type { FieldProps } from '../types'

type BlowoutLocationDropdownProps = FieldProps & {
  options: Options
}

export function BlowoutLocationField(
  props: BlowoutLocationDropdownProps
): JSX.Element {
  const { options: propOptions, ...restProps } = props
  const { t } = useTranslation('protocol_steps')
  const disposalOptions = useSelector(uiLabwareSelectors.getDisposalOptions)
  const options = [...disposalOptions, ...propOptions]

  return (
    <DropdownStepFormField
      title={t('blowout_location')}
      options={options}
      addPadding={false}
      {...restProps}
      width="16.5rem"
    />
  )
}
