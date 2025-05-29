import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { DropdownStepFormField } from '../../../../../../components/molecules'
import { getEnableStacking } from '../../../../../../feature-flags/selectors'
import { getAdditionalEquipmentEntities } from '../../../../../../step-forms/selectors'
import {
  getDeckSetupForActiveItem,
  getRobotStateAtActiveItem,
  getUnoccupiedLabwareLocationOptions,
} from '../../../../../../top-selectors/labware-locations'
import { hoverSelection } from '../../../../../../ui/steps/actions/actions'
import { getUnoccupiedStackOptions } from '../../../../utils'

import type { Option } from '../../../../../../top-selectors/labware-locations'
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
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const { labware: deckSetupLabware } = useSelector(getDeckSetupForActiveItem)
  const dispatch = useDispatch()
  const robotState = useSelector(getRobotStateAtActiveItem)
  const unoccupiedLabwareStackOptions: Option[] =
    robotState && enableStacking
      ? getUnoccupiedStackOptions(robotState, deckSetupLabware, labware, t)
      : []
  const isLabwareOffDeck =
    labware != null
      ? getSlotInLocationStack(robotState?.labware[labware]?.stack ?? []) ===
        'offDeck'
      : false

  const unoccupiedLabwareLocationsOptionsSelector =
    useSelector(getUnoccupiedLabwareLocationOptions) ?? []

  let unoccupiedLabwareLocationsOptions = [
    ...unoccupiedLabwareStackOptions,
    ...unoccupiedLabwareLocationsOptionsSelector,
  ]
  if (useGripper || isLabwareOffDeck) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== 'offDeck'
    )
  }

  if (
    !useGripper &&
    Object.values(additionalEquipmentEntities).find(
      ae => ae.name === 'wasteChute'
    ) != null
  ) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== WASTE_CHUTE_CUTOUT
    )
  }

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
