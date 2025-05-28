import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { DropdownStepFormField } from '../../../../../components/molecules'
import { getDisposalOptions } from '../../../../../ui/labware/selectors'
import { hoverSelection } from '../../../../../ui/steps/actions/actions'
import { useLabwareDropdownOptions } from '../../../utils'

import type { DropdownOption } from '@opentrons/components'
import type { FieldProps } from '../types'

function useDisposalOptionsTranslated(): DropdownOption[] {
  const { t } = useTranslation('deck_configuration')
  const disposalOptions = useSelector(getDisposalOptions)

  return disposalOptions.map(item => {
    item.name = item.name === 'trashBin' ? t('trash_bin') : t('waste')
    return item
  })
}

export function LabwareField(props: FieldProps): JSX.Element {
  const { name } = props
  const { i18n, t } = useTranslation(['protocol_steps', 'application'])
  const translatedDisposalOptions = useDisposalOptionsTranslated()
  const options = useLabwareDropdownOptions('labware')
  const dispatch = useDispatch()

  const allOptions =
    name === 'dispense_labware'
      ? [...options, ...translatedDisposalOptions]
      : [...options]

  return (
    <DropdownStepFormField
      {...props}
      name={name}
      options={allOptions}
      title={i18n.format(t(`${name}`), 'capitalize')}
      onEnter={(id: string) => {
        dispatch(hoverSelection({ id, text: t('application:select') }))
      }}
      onExit={() => {
        dispatch(hoverSelection({ id: null, text: null }))
      }}
      width="100%"
    />
  )
}
