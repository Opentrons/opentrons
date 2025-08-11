import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { getSlotInLocationStack } from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getEnableStacking } from '/protocol-designer/feature-flags/selectors'
import { getUnoccupiedStackOptions } from '/protocol-designer/pages/Designer/utils'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'
import {
  getDeckSetupForActiveItem,
  getRobotStateAtActiveItem,
  getUnoccupiedLabwareLocationOptions,
} from '/protocol-designer/top-selectors/labware-locations'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import type { Option } from '/protocol-designer/top-selectors/labware-locations'
import type { FieldProps } from '../../types'

interface LabwareLocationFieldProps extends FieldProps {
  useGripper: boolean
  canSave: boolean
  labware: string
}
export function LabwareLocationField(
  props: LabwareLocationFieldProps
): JSX.Element {
  const { t } = useTranslation(['form', 'protocol_steps'])
  const { labware, useGripper } = props
  const enableStacking = useSelector(getEnableStacking)
  const { labware: deckSetupLabware } = useSelector(getDeckSetupForActiveItem)
  const dispatch = useDispatch()
  const labwareEntities = useSelector(getLabwareEntities)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const unoccupiedLabwareStackOptions: Option[] =
    robotState && enableStacking
      ? getUnoccupiedStackOptions({
          robotState,
          deckSetupLabware,
          labwareIdFromDropdown: labware,
          labwareEntities,
          t,
        })
      : []
  const isLabwareOffDeck =
    labware != null
      ? getSlotInLocationStack(robotState?.labware[labware]?.stack ?? []) ===
        'offDeck'
      : false

  const unoccupiedLabwareLocationsOptionsSelector =
    useSelector(getUnoccupiedLabwareLocationOptions) ?? []

  // invalid offDeck move filter
  const unoccupiedLabwareLocationsOptions = [
    ...unoccupiedLabwareStackOptions,
    ...unoccupiedLabwareLocationsOptionsSelector,
  ].filter(option => {
    const canMoveOffDeck = !(useGripper || isLabwareOffDeck)
    return option.value !== 'offDeck' || canMoveOffDeck
  })

  return (
    <DropdownStepFormField
      {...props}
      options={unoccupiedLabwareLocationsOptions}
      errorToShow={props.errorToShow}
      width="100%"
      title={t('protocol_steps:new_location')}
      onEnter={(id: string) => {
        dispatch(
          hoverSelection({
            id,
            text: t('application:new_location'),
          })
        )
      }}
      onExit={() => {
        dispatch(hoverSelection({ id: null, text: null }))
      }}
      tooltipContent={null}
    />
  )
}
