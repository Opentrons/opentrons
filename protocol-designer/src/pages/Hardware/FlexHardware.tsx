import { useDispatch, useSelector } from 'react-redux'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getModuleType,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
} from '@opentrons/shared-data'
import { HardwareConfigurator } from '../../components/organisms'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
} from '../../step-forms/selectors'
import { uuid } from '../../utils'
import { deleteModule } from '../../modules'
import { createModule } from '../../step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../step-forms/actions/additionalItems'
import { FIXTURES } from '../Designer/DeckSetup/constants'
import type {
  CutoutFixtureId,
  CutoutId,
  FlexModuleCutoutFixtureId,
  ModuleModel,
} from '@opentrons/shared-data'
import type {
  CutoutConfigExtended,
  ModuleMore,
} from '../../components/organisms/HardwareConfigurator/AddFixtureModal'
import type { ThunkDispatch } from '../../types'
import type { DeckFixture } from '../../step-forms/actions/additionalItems'
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

  const fixtures: Fixtures = Object.values(additionalEquipmentOnDeck).reduce(
    (acc: Fixtures, fixture) => {
      let cutoutFixtureId: CutoutFixtureId = 'trashBinAdapter'

      if (fixture.name === 'stagingArea') {
        cutoutFixtureId = 'stagingAreaRightSlot'
      } else if (fixture.name === 'wasteChute') {
        cutoutFixtureId = 'wasteChuteRightAdapterNoCover'
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
    [x: string]: ModuleMore
  } = Object.values(moduleOnDeck).reduce((acc, module) => {
    let cutoutFixtureId = module.model as FlexModuleCutoutFixtureId
    if (
      module.type === MAGNETIC_BLOCK_TYPE &&
      Object.values(additionalEquipmentOnDeck).hasOwnProperty(module.slot)
    ) {
      cutoutFixtureId = 'stagingAreaSlotWithMagneticBlockV1'
    }
    const mod = {
      [uuid()]: {
        ...module,
        cutoutId: getCutoutIdForSlotName(module.slot, deckDef),
        cutoutFixtureId,
      },
    }

    return { ...acc, ...mod }
  }, {})

  const updateInitialDeckState = (value: CutoutConfigExtended[]): void => {
    value.forEach(val => {
      if (val.cutoutFixtureId === 'thermocyclerModuleV2Rear') {
        return
      }
      const matchingFixture = Object.values(additionalEquipmentOnDeck).find(
        ae => ae.name === (val.type as DeckFixture)
      )
      const matchingModule = Object.values(moduleOnDeck).find(
        module =>
          module.model === (val.type as ModuleModel) &&
          getCutoutIdForSlotName(module.slot, deckDef) === val.cutoutId
      )
      if (FIXTURES.includes(val.type as DeckFixture)) {
        if (matchingFixture != null) {
          dispatch(deleteDeckFixture(matchingFixture.id))
        } else {
          dispatch(createDeckFixture(val.type as DeckFixture, val.cutoutId))
        }
      } else if (val.type === 'stagingAreaAndMagneticBlock') {
        const matchingStagingArea = Object.values(
          additionalEquipmentOnDeck
        ).find(ae => ae.name === 'stagingArea' && ae.location === val.cutoutId)

        if (matchingStagingArea != null) {
          dispatch(deleteDeckFixture(matchingStagingArea.id))
        } else {
          dispatch(
            createDeckFixture('stagingArea' as DeckFixture, val.cutoutId)
          )
        }
        if (matchingModule != null) {
          dispatch(deleteModule({ moduleId: matchingModule.id }))
        } else {
          dispatch(
            createModule({
              slot: val.cutoutId.split('cutout')[1],
              model: MAGNETIC_BLOCK_V1,
              type: MAGNETIC_BLOCK_TYPE,
            })
          )
        }
      } else {
        if (matchingModule != null) {
          dispatch(deleteModule({ moduleId: matchingModule.id }))
        } else {
          const type = getModuleType(val.type as ModuleModel)
          const model = val.type as ModuleModel
          dispatch(
            createModule({
              slot: val.cutoutId.split('cutout')[1],
              model,
              type,
            })
          )
        }
      }
    })
  }
  return (
    <HardwareConfigurator
      modules={modules}
      fixtures={fixtures}
      hasGripper={hasGripper}
      updateInitialDeckState={updateInitialDeckState}
    />
  )
}
