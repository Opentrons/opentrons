import {
  ABSORBANCE_READER_V1_FIXTURE,
  filterAaByAreaType,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_FIXTURES,
  FLEX_STACKER_V1_FIXTURE,
  getAAFromCutoutFixtureId,
  getDeckDefFromRobotType,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  transformCutoutFixturesToAaWithFixtures,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { SingleSlotFixture } from '../BaseDeck/SingleSlotFixture'
import { SlotLabels } from '../Deck'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { AbsorbanceReaderFixture } from './AbsorbanceReaderFixture'
import { EmptyConfigFixture } from './EmptyConfigFixture'
import { FlexStackerFixture } from './FlexStackerFixture'
import { HeaterShakerFixture } from './HeaterShakerFixture'
import { MagneticBlockFixture } from './MagneticBlockFixture'
import { StagingAreaConfigFixture } from './StagingAreaConfigFixture'
import { StaticFixture } from './StaticFixture'
import { TemperatureModuleFixture } from './TemperatureModuleFixture'
import { ThermocyclerFixture } from './ThermocyclerFixture'
import { TrashBinConfigFixture } from './TrashBinConfigFixture'
import { WasteChuteConfigFixture } from './WasteChuteConfigFixture'

import { useEffect, type ReactNode } from 'react'
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'

export * from './constants'

interface DeckConfiguratorProps {
  deckConfig: DeckConfiguration
  handleClickAdd: (cutoutId: CutoutId) => void
  handleClickRemove: (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  lightFill?: string
  darkFill?: string
  editableCutoutIds?: CutoutId[]
  showExpansion?: boolean
  children?: ReactNode
  additionalStaticFixtures?: Array<{ location: CutoutId; label: string }>
  height?: string
  selectedCutoutId?: CutoutId
}

export function DeckConfigurator(props: DeckConfiguratorProps): JSX.Element {
  const {
    deckConfig,
    handleClickAdd,
    handleClickRemove,
    additionalStaticFixtures,
    children,
    selectedCutoutId,
    lightFill = COLORS.grey35,
    darkFill = COLORS.black90,
    editableCutoutIds = deckConfig.map(({ cutoutId }) => cutoutId),
    showExpansion = true,
    height = '455px',
  } = props

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const deckConfigWithAA = transformCutoutFixturesToAaWithFixtures(
      deckConfig,
      deckDef
    )
  // useEffect(() => {
  //   deckConfigWithAA = transformCutoutFixturesToAaWithFixtures(
  //     deckConfig,
  //     deckDef
  //   )
  // }, [deckConfigWithAA])

  console.log("deckConfigWithAA: ", deckConfigWithAA)

  const stagingAreaFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'stagingSlot'
  )
  console.log("stagingAreaFixtures: ", stagingAreaFixtures)

  const wasteChuteFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'wasteChute'
  )
  const emptyCutouts = filterAaByAreaType(deckConfigWithAA, deckDef, 'slot')
  console.log("emptyCutouts: ",emptyCutouts)

  // const trashBinFixtures = deckConfigWithAA.filter(
  //   ({ cutoutFixtureId }) => cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
  // )

  const trashBinFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'movableTrash'
  )
  const thermocyclerFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'thermocycler'
  )
  const heaterShakerFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'heaterShaker'
  )
  const temperatureModuleFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'temperatureModule'
  )
  const magneticBlockFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'magneticBlock'
  )
  const absorbanceReaderFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'absorbanceReader'
  )
  // const magneticBlockStagingAreaFixtures = deckConfigWithAA.filter(
  //   ({ cutoutFixtureId }) =>
  //     cutoutFixtureId === STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
  // )
  const flexStackerFixtures = filterAaByAreaType(
    deckConfigWithAA,
    deckDef,
    'flexStacker'
  )

  const ot3DefaultSingleSlotOnDeck: Record<CutoutId, CutoutFixtureId> = {
    cutoutD1: 'singleLeftSlot',
    cutoutC1: 'singleLeftSlot',
    cutoutB1: 'singleLeftSlot',
    cutoutA1: 'singleLeftSlot',
    cutoutD2: 'singleCenterSlot',
    cutoutC2: 'singleCenterSlot',
    cutoutB2: 'singleCenterSlot',
    cutoutA2: 'singleCenterSlot',
    cutoutD3: 'stagingAreaRightSlot',
    cutoutC3: 'stagingAreaRightSlot',
    cutoutB3: 'stagingAreaRightSlot',
    cutoutA3: 'stagingAreaRightSlot',
  }

  return (
    <RobotCoordinateSpace
      height={height}
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {Object.keys(ot3DefaultSingleSlotOnDeck).map(key => (
        // give the outside of the base fixture svgs a stroke for extra spacing
        <g key={key} stroke={COLORS.white} strokeWidth="4">
          <SingleSlotFixture
            data-testid={key}
            cutoutId={key as CutoutId}
            slotClipColor={COLORS.transparent}
            fixtureBaseColor={lightFill}
            deckDefinition={deckDef}
            showExpansion={showExpansion}
          />
        </g>
      ))}
      {stagingAreaFixtures.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
          <StagingAreaConfigFixture
            data-testid={cutoutId}
            key={addressableAreaId}
            deckDefinition={deckDef}
            handleClickRemove={
              editableCutoutIds.includes(cutoutId)
                ? handleClickRemove
                : undefined
            }
            fixtureLocation={cutoutId}
            cutoutFixtureId={cutoutFixtureId}
            addressableArea={addressableAreaId}
            selected={cutoutId === selectedCutoutId}
          />
        )
      )}
      {emptyCutouts.map(({ cutoutId, addressableAreaId }) => (
        <EmptyConfigFixture
          data-testid={addressableAreaId}
          key={addressableAreaId}
          addressableArea={addressableAreaId}
          deckDefinition={deckDef}
          handleClickAdd={handleClickAdd}
          fixtureLocation={cutoutId}
        />
      ))}
      {wasteChuteFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <WasteChuteConfigFixture
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          selected={cutoutId === selectedCutoutId}
        />
      ))}
      {/* {wasteChuteStagingAreaFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <WasteChuteConfigFixture
          data-testid={cutoutId}
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          selected={cutoutId === selectedCutoutId}
          hasStagingAreas
        />
      ))} */}
      {trashBinFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <TrashBinConfigFixture
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          selected={cutoutId === selectedCutoutId}
        />
      ))}
      {temperatureModuleFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <TemperatureModuleFixture
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          selected={cutoutId === selectedCutoutId}
        />
      ))}
      {heaterShakerFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <HeaterShakerFixture
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          selected={cutoutId === selectedCutoutId}
        />
      ))}
      {magneticBlockFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <MagneticBlockFixture
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          selected={cutoutId === selectedCutoutId}
          hasStagingArea={
            cutoutFixtureId === STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
          }
        />
      ))}
      {thermocyclerFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => {
        return (
          <ThermocyclerFixture
            data-testid={cutoutId}
            key={addressableAreaId}
            deckDefinition={deckDef}
            handleClickRemove={
              editableCutoutIds.includes(cutoutId)
                ? handleClickRemove
                : undefined
            }
            fixtureLocation={cutoutId}
            cutoutFixtureId={cutoutFixtureId}
            selected={
              selectedCutoutId != null &&
              THERMOCYCLER_MODULE_CUTOUTS.includes(selectedCutoutId) &&
              THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)
            }
          />
        )
      })}
      {absorbanceReaderFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <AbsorbanceReaderFixture
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          selected={cutoutId === selectedCutoutId}
        />
      ))}
      {flexStackerFixtures.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <FlexStackerFixture
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          hasWasteChute={cutoutFixtureId !== FLEX_STACKER_V1_FIXTURE}
          selected={cutoutId === selectedCutoutId}
        />
      ))}
      {additionalStaticFixtures?.map(staticFixture => (
        <StaticFixture
          data-testid={staticFixture.location}
          key={staticFixture.location}
          deckDefinition={deckDef}
          label={staticFixture.label}
          fixtureLocation={staticFixture.location}
        />
      ))}
      */
      <SlotLabels
        robotType={FLEX_ROBOT_TYPE}
        color={darkFill}
        show4thColumn={
          stagingAreaFixtures.length > 0 ||
          absorbanceReaderFixtures.length > 0 ||
          flexStackerFixtures.length > 0
        }
      />
      {children}
    </RobotCoordinateSpace>
  )
}
