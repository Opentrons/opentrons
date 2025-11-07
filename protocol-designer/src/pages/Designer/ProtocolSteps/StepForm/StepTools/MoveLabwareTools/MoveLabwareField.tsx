import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { useLabwareDropdownOptions } from '/protocol-designer/pages/Designer/utils'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { getSortedAddressableArea } from './utils'

import type { FieldProps } from '../../types'

interface MoveLabwareFieldProps extends FieldProps {
  useGripper: boolean
}
export function MoveLabwareField(props: MoveLabwareFieldProps): JSX.Element {
  const { useGripper } = props
  const options = useLabwareDropdownOptions('moveLabware', useGripper)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const dispatch = useDispatch()
  const { t } = useTranslation(['protocol_steps', 'application'])
  const optionsSorted =
    robotState != null ? getSortedAddressableArea(options, robotState) : options

  return (
    <DropdownStepFormField
      {...props}
      options={optionsSorted}
      title={t('select_labware')}
      width="100%"
      onEnter={(id: string) => {
        dispatch(hoverSelection({ id, text: t('application:select') }))
      }}
      onExit={() => {
        dispatch(hoverSelection({ id: null, text: null }))
      }}
      tooltipContent={null}
    />
  )
}
