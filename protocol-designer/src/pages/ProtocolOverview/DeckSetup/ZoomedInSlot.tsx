import * as React from 'react'
import {
  COLORS,
  DIRECTION_ROW,
  Flex,
  Module,
  PrimaryButton,
  RobotCoordinateSpace,
  SingleSlotFixture,
} from '@opentrons/components'
import {
  CutoutId,
  DeckDefinition,
  RobotType,
  THERMOCYCLER_MODULE_TYPE,
  getCutoutFixturesForCutoutId,
  getDeckDefFromRobotType,
  getModuleDef2,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import { LabwareSelectionModal } from '../../../components/LabwareSelectionModal/LabwareSelectionModal'
import { useSelector } from 'react-redux'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import values from 'lodash/values'
import type { DeckSlot } from '@opentrons/step-generation'
import type {
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
  ModuleTemporalProperties,
} from '../../../step-forms'
import { LabwareOnDeck } from '../../../components/DeckSetup/LabwareOnDeck'

interface ZoomedInContentsProps {
  deckDef: DeckDefinition
  slot: DeckSlot
  moduleOnSlot?: ModuleOnDeck
  labwareOnSlot?: LabwareOnDeckType
}

const ZoomedInContents = (props: ZoomedInContentsProps): JSX.Element | null => {
  const { moduleOnSlot, slot, labwareOnSlot, deckDef } = props
  const slotPosition = getPositionFromSlotId(slot, deckDef)

  if (slotPosition == null) {
    return null
  }

  if (moduleOnSlot != null) {
    const moduleDef = getModuleDef2(moduleOnSlot.model)
    const getModuleInnerProps = (
      moduleState: ModuleTemporalProperties['moduleState']
    ): React.ComponentProps<typeof Module>['innerProps'] => {
      if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
        let lidMotorState = 'unknown'
        if (moduleState.lidOpen === true) {
          lidMotorState = 'open'
        } else if (moduleState.lidOpen === false) {
          lidMotorState = 'closed'
        }
        return {
          lidMotorState,
          blockTargetTemp: moduleState.blockTargetTemp,
        }
      } else if (
        'targetTemperature' in moduleState &&
        moduleState.type === 'temperatureModuleType'
      ) {
        return {
          targetTemperature: moduleState.targetTemperature,
        }
      } else if ('targetTemp' in moduleState) {
        return {
          targetTemp: moduleState.targetTemp,
        }
      }
    }
    return (
      <Module
        key={moduleOnSlot.slot}
        x={slotPosition[0]}
        y={slotPosition[1]}
        def={moduleDef}
        orientation={'left'}
        innerProps={getModuleInnerProps(moduleOnSlot.moduleState)}
      >
        {labwareOnSlot != null ? (
          <LabwareOnDeck x={0} y={0} labwareOnDeck={labwareOnSlot} />
        ) : null}
      </Module>
    )
  } else if (moduleOnSlot == null && labwareOnSlot != null) {
    return (
      <LabwareOnDeck
        x={slotPosition[0]}
        y={slotPosition[1]}
        labwareOnDeck={labwareOnSlot}
      />
    )
  } else {
    return null
  }
}
interface ZoomedInProps {
  robotType: RobotType
  slot: DeckSlot
  cutoutId: CutoutId
  goBack: () => void
}
export const ZoomedInSlot = (props: ZoomedInProps): JSX.Element => {
  const { robotType, slot, cutoutId, goBack } = props
  const deckDef = getDeckDefFromRobotType(robotType)
  getCutoutFixturesForCutoutId
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const modules = values(activeDeckSetup.modules)
  console.log(modules, slot)
  const moduleOnSlot = modules.find(module => module.slot === slot)
  console.log('moduleOnSlot', moduleOnSlot)
  const labware = values(activeDeckSetup.labware)
  const labwareOnSlot = labware.find(lw => lw.slot === slot)

  return (
    <>
      <PrimaryButton onClick={goBack}>exit</PrimaryButton>
      <Flex flexDirection={DIRECTION_ROW}>
        <RobotCoordinateSpace
          height="100%"
          deckDef={deckDef}
          viewBox={`-50, -150, 400, 300`}
        >
          <>
            <SingleSlotFixture
              key={`${cutoutId}_${robotType}`}
              cutoutId={cutoutId}
              deckDefinition={deckDef}
              showExpansion={cutoutId === 'cutoutA1'}
              fixtureBaseColor={COLORS.grey35}
            />
            <ZoomedInContents
              deckDef={deckDef}
              moduleOnSlot={moduleOnSlot}
              labwareOnSlot={labwareOnSlot}
              slot={slot}
            />
          </>
        </RobotCoordinateSpace>

        <LabwareSelectionModal />
      </Flex>
    </>
  )
}
