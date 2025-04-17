import { useDispatch, useSelector } from 'react-redux'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  MAGNETIC_BLOCK_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'
import { HardwareConfigurator } from '../../components/organisms'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
} from '../../step-forms/selectors'
import { uuid } from '../../utils'
import { updateInitialDeckState } from './util'
import type {
  CutoutFixtureId,
  CutoutId,
  FlexModuleCutoutFixtureId,
} from '@opentrons/shared-data'
import type { ModuleExtended } from '../../components/organisms/HardwareConfigurator/AddFixtureModal'
import type { ThunkDispatch } from '../../types'
import type { Fixtures, FixtureName } from '../../components/organisms'

export function FlexHardware(): JSX.Element {
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const hasGripper = Object.values(additionalEquipmentEntities).some(
    ae => ae.name === 'gripper'
  )
  const { modules: moduleOnDeck, additionalEquipmentOnDeck } = initialDeckSetup
  const hasStagingAreaAndWasteChute =
    Object.values(additionalEquipmentOnDeck).filter(
      ae => ae.location === WASTE_CHUTE_CUTOUT
    )?.length === 2

  const fixtures: Fixtures = Object.values(additionalEquipmentOnDeck).reduce(
    (acc: Fixtures, fixture) => {
      let cutoutFixtureId: CutoutFixtureId = TRASH_BIN_ADAPTER_FIXTURE

      //  the stagingArea + magneticBlock combo is added to the modules and
      //  filtered out here
      if (
        fixture.name === 'stagingArea' &&
        Object.values(moduleOnDeck).some(
          module =>
            module.type === MAGNETIC_BLOCK_TYPE &&
            fixture.location.includes(module.slot)
        )
      ) {
        return acc
      }
      if (hasStagingAreaAndWasteChute) {
        cutoutFixtureId = STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
      } else if (fixture.name === 'stagingArea') {
        cutoutFixtureId = STAGING_AREA_RIGHT_SLOT_FIXTURE
      } else if (fixture.name === 'wasteChute') {
        cutoutFixtureId = WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
      }
      acc[fixture.id] = {
        cutoutId: fixture.location as CutoutId,
        name: fixture.name as FixtureName,
        cutoutFixtureId,
      }

      return acc
    },
    {}
  )

  const modules: {
    [x: string]: ModuleExtended
  } = Object.values(moduleOnDeck).reduce((acc, onDeckModule) => {
    let cutoutFixtureId = onDeckModule.model as FlexModuleCutoutFixtureId
    if (
      onDeckModule.type === MAGNETIC_BLOCK_TYPE &&
      Object.values(additionalEquipmentOnDeck).some(
        ae =>
          ae.name === 'stagingArea' && ae.location.includes(onDeckModule.slot)
      )
    ) {
      cutoutFixtureId = STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
    }
    const module = {
      [uuid()]: {
        ...onDeckModule,
        cutoutId: getCutoutIdForSlotName(onDeckModule.slot, deckDef),
        cutoutFixtureId,
      },
    }

    return { ...acc, ...module }
  }, {})

  return (
    <HardwareConfigurator
      modules={modules}
      fixtures={fixtures}
      hasGripper={hasGripper}
      updateInitialDeckState={value => {
        updateInitialDeckState(value, initialDeckSetup, dispatch)
      }}
    />
  )
}
