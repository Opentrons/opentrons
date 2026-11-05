import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { useLabwareDropdownOptions } from '/protocol-designer/pages/Designer/utils'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { getSortedAddressableArea } from './utils'

import type { ReactNode } from 'react'
import type { FieldProps } from '../../types'

interface MoveLabwareFieldProps extends FieldProps {
  useGripper: boolean
}
export function MoveLabwareField(props: MoveLabwareFieldProps): ReactNode {
  const { useGripper } = props
  const options = useLabwareDropdownOptions('moveLabware', useGripper)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch()
  const { t } = useTranslation(['protocol_steps', 'application'])
  const optionsSorted =
    robotState != null
      ? getSortedAddressableArea(options, robotState, robotType)
      : options

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
