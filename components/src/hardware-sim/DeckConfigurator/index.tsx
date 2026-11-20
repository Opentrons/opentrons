import { useMemo } from 'react'

import {
  filterAAByAreaType,
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  isModuleAllowedOnAA,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { SlotLabels } from '../Deck'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { AbsorbanceReaderItem } from './AbsorbanceReaderItem'
import { EmptyConfigItem } from './EmptyConfigItem'
import { FlexStackerItem } from './FlexStackerItem'
import { HeaterShakerItem } from './HeaterShakerItem'
import { MagneticBlockItem } from './MagneticBlockItem'
import { StagingAreaConfigItem } from './StagingAreaConfigItem'
import { StaticItem } from './StaticItem'
import { TemperatureModuleItem } from './TemperatureModuleItem'
import { ThermocyclerItem } from './ThermocyclerItem'
import { TrashBinConfigItem } from './TrashBinConfigItem'
import { VacuumModuleItem } from './VacuumModuleItem'
import { WasteChuteConfigFixture } from './WasteChuteConfigItem'

import type { ReactNode } from 'react'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  DeckConfiguration,
  ModuleModel,
} from '@opentrons/shared-data'

export * from './constants'

interface DeckConfiguratorProps {
  deckConfig: DeckConfiguration
  handleClickAdd: (
    cutoutId: CutoutId,
    addressableAreaId: AddressableAreaNamesWithFakes
  ) => void
  handleClickRemove: (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
  ) => void
  lightFill?: string
  darkFill?: string
  editableCutoutIds?: CutoutId[]
  showExpansion?: boolean
  children?: ReactNode
  additionalStaticFixtures?: Array<{ location: CutoutId; label: string }>
  height?: string
  selectedCutoutId?: CutoutId
  moduleModel?: ModuleModel
}

export function DeckConfigurator(props: DeckConfiguratorProps): ReactNode {
  const {
    deckConfig,
    handleClickAdd,
    handleClickRemove,
    additionalStaticFixtures,
    children,
    selectedCutoutId,
    darkFill = COLORS.black90,
    editableCutoutIds = deckConfig.map(({ cutoutId }) => cutoutId),
    height = '455px',
    moduleModel,
  } = props

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const deckConfigWithAA = useMemo(
    () => replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(deckConfig),
    [deckConfig]
  )

  const stagingAreaItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'stagingSlot'
  )

  const wasteChuteItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'wasteChute'
  )
  const fakeStagingItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'fakeStagingSlot'
  )

  const emptySlotLikeItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'slot'
  ).concat(fakeStagingItems)

  const trashBinItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'movableTrash'
  )
  const thermocyclerItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'thermocycler'
  )
  const heaterShakerItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'heaterShaker'
  )
  const temperatureModuleItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'temperatureModule'
  )
  const magneticBlockItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'magneticBlock'
  )
  const absorbanceReaderItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'absorbanceReader'
  )

  const flexStackerItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'flexStacker'
  )

  const vacuumModuleItems = filterAAByAreaType(
    deckConfigWithAA,
    deckDef,
    'vacuumModule'
  )

  return (
    <RobotCoordinateSpace
      height={height}
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {stagingAreaItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => {
          const shouldAllowRemove =
            moduleModel != null
              ? isModuleAllowedOnAA(cutoutId, addressableAreaId, moduleModel)
              : editableCutoutIds.includes(cutoutId)
          return (
            <StagingAreaConfigItem
              data-testid={cutoutId}
              key={addressableAreaId}
              deckDefinition={deckDef}
              handleClickRemove={
                shouldAllowRemove ? handleClickRemove : undefined
              }
              fixtureLocation={cutoutId}
              cutoutFixtureId={cutoutFixtureId}
              addressableAreaId={addressableAreaId}
              selected={cutoutId === selectedCutoutId}
            />
          )
        }
      )}
      {emptySlotLikeItems.map(({ cutoutId, addressableAreaId }) => (
        <EmptyConfigItem
          data-testid={addressableAreaId}
          editableCutoutIds={editableCutoutIds ?? []}
          key={addressableAreaId}
          addressableAreaId={addressableAreaId}
          deckDefinition={deckDef}
          handleClickAdd={handleClickAdd}
          fixtureLocation={cutoutId}
          moduleModel={moduleModel}
        />
      ))}
      {wasteChuteItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => {
          const shouldAllowRemove =
            moduleModel != null
              ? isModuleAllowedOnAA(cutoutId, addressableAreaId, moduleModel)
              : editableCutoutIds.includes(cutoutId)
          return (
            <WasteChuteConfigFixture
              data-testid={cutoutId}
              key={addressableAreaId}
              deckDefinition={deckDef}
              handleClickRemove={
                shouldAllowRemove ? handleClickRemove : undefined
              }
              fixtureLocation={cutoutId}
              cutoutFixtureId={cutoutFixtureId}
              selected={cutoutId === selectedCutoutId}
            />
          )
        }
      )}
      {trashBinItems.map(({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
        <TrashBinConfigItem
          data-testid={cutoutId}
          key={addressableAreaId}
          deckDefinition={deckDef}
          handleClickRemove={
            editableCutoutIds.includes(cutoutId) ? handleClickRemove : undefined
          }
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          addressableAreaId={addressableAreaId}
          selected={cutoutId === selectedCutoutId}
        />
      ))}
      {temperatureModuleItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
          <TemperatureModuleItem
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
            addressableAreaId={addressableAreaId}
            selected={cutoutId === selectedCutoutId}
          />
        )
      )}
      {heaterShakerItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
          <HeaterShakerItem
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
            addressableAreaId={addressableAreaId}
            selected={cutoutId === selectedCutoutId}
          />
        )
      )}
      {magneticBlockItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => {
          const shouldAllowRemove =
            moduleModel != null
              ? isModuleAllowedOnAA(cutoutId, addressableAreaId, moduleModel)
              : editableCutoutIds.includes(cutoutId)
          return (
            <MagneticBlockItem
              data-testid={cutoutId}
              key={addressableAreaId}
              deckDefinition={deckDef}
              handleClickRemove={
                shouldAllowRemove ? handleClickRemove : undefined
              }
              fixtureLocation={cutoutId}
              cutoutFixtureId={cutoutFixtureId}
              addressableAreaId={addressableAreaId}
              selected={cutoutId === selectedCutoutId}
              hasStagingArea={
                cutoutFixtureId ===
                STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
              }
            />
          )
        }
      )}
      {thermocyclerItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => {
          return (
            <ThermocyclerItem
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
              addressableAreaId={addressableAreaId}
              selected={
                selectedCutoutId != null &&
                THERMOCYCLER_MODULE_CUTOUTS.includes(selectedCutoutId) &&
                THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)
              }
            />
          )
        }
      )}
      {absorbanceReaderItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
          <AbsorbanceReaderItem
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
            addressableAreaId={addressableAreaId}
            selected={cutoutId === selectedCutoutId}
          />
        )
      )}
      {flexStackerItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
          <FlexStackerItem
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
            hasWasteChute={[
              'wasteChuteRightAdapterCovered',
              'wasteChuteRightAdapterNoCover',
            ].includes(cutoutFixtureId)}
            selected={cutoutId === selectedCutoutId}
            addressableAreaId={addressableAreaId}
          />
        )
      )}
      {vacuumModuleItems.map(
        ({ cutoutId, cutoutFixtureId, addressableAreaId }) => (
          <VacuumModuleItem
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
            addressableAreaId={addressableAreaId}
            selected={cutoutId === selectedCutoutId}
          />
        )
      )}
      {additionalStaticFixtures?.map(staticFixture => (
        <StaticItem
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
        show4thColumn={true}
      />
      {children}
    </RobotCoordinateSpace>
  )
}
