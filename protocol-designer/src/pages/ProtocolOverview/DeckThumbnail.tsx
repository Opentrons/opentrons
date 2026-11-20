import { Fragment, useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DeckFromLayers,
  FixedTrashText,
  Flex,
  FlexTrash,
  JUSTIFY_CENTER,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  SlotLabels,
  SPACING,
  StagingAreaFixture,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  getModuleType,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  STAGING_AREA_CUTOUTS,
  TRASH_BIN_ADAPTER_FIXTURE,
  VACUUM_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import {
  getDeckConfiguration,
  getInitialDeckSetup,
} from '../../step-forms/selectors'
import { useUpdateDeckConfigurationFromStartingDeck } from '../Designer/DeckSetup/hooks/useUpdateDeckConfigurationFromStartingDeck'
import { DeckThumbnailDetails } from './DeckThumbnailDetails'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type { CutoutId, DeckSlotId, RobotType } from '@opentrons/shared-data'
import type { AdditionalEquipmentEntity } from '@opentrons/step-generation'

const RIGHT_COLUMN_FIXTURE_PADDING = 50 // mm
const FLEX_STACKER_FIXTURE_PADDING = 220 // mm
const WASTE_CHUTE_SPACE = 30
const OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
  'fixedTrash',
]

const lightFill = COLORS.grey35
const darkFill = COLORS.grey60

interface DeckThumbnailProps {
  hoverSlot: DeckSlotId | null
  setHoverSlot: Dispatch<SetStateAction<string | null>>
  robotType: RobotType
}
export function DeckThumbnail(props: DeckThumbnailProps): ReactNode {
  const { hoverSlot, setHoverSlot, robotType } = props
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const { deckConfig } = useSelector(getDeckConfiguration)
  useUpdateDeckConfigurationFromStartingDeck({
    activeDeckSetup: initialDeckSetup,
    robotType,
  })
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])
  const trash = Object.values(initialDeckSetup.additionalEquipmentOnDeck).find(
    ae => ae.name === 'trashBin'
  )
  const trashBinFixtures = [
    {
      cutoutId: trash?.location as CutoutId,
      cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    },
  ]
  const wasteChuteFixtures = Object.values(
    initialDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      WASTE_CHUTE_CUTOUT.includes(aE.location as CutoutId) &&
      aE.name === 'wasteChute'
  )
  const stagingAreaFixtures: AdditionalEquipmentEntity[] = Object.values(
    initialDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea'
  )
  const wasteChuteStagingAreaFixtures = Object.values(
    initialDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea' &&
      aE.location === WASTE_CHUTE_CUTOUT &&
      wasteChuteFixtures.length > 0
  )

  const hasWasteChute =
    wasteChuteFixtures.length > 0 || wasteChuteStagingAreaFixtures.length > 0

  const hasFlexStacker = Object.values(initialDeckSetup.modules).some(
    module => getModuleType(module.model) === FLEX_STACKER_MODULE_TYPE
  )
  const hasVacuumModule = Object.values(initialDeckSetup.modules).some(
    module => getModuleType(module.model) === VACUUM_MODULE_TYPE
  )
  const flexStackerLocations = Object.values(initialDeckSetup.modules)
    .filter(stacker => stacker.type === FLEX_STACKER_MODULE_TYPE)
    .map(({ slot: location, ...rest }) => ({ ...rest, location }))
  flexStackerLocations.forEach(
    stacker => (stacker.location = `cutout${stacker.location.slice(0, 1)}3`)
  )
  const stagingAreaFixturesAndStacker = [
    ...stagingAreaFixtures,
    ...flexStackerLocations,
  ]
  const stagingAreaCutoutIds = stagingAreaFixturesAndStacker.map(
    stagingArea => stagingArea.location.split('cutout')[1]
  )
  const filteredAddressableAreas = deckDef.locations.addressableAreas.filter(
    aa =>
      isAddressableAreaStandardSlot(aa.id, deckDef) &&
      !stagingAreaCutoutIds.includes(aa.id) &&
      (!hasWasteChute || aa.id !== 'D3')
  )
  const hasRightColumnFixtures =
    stagingAreaFixtures.length + wasteChuteFixtures.length > 0 || hasFlexStacker
  const rightColumnAdjustment = hasFlexStacker
    ? FLEX_STACKER_FIXTURE_PADDING
    : RIGHT_COLUMN_FIXTURE_PADDING

  return (
    <Flex
      width="100%"
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      backgroundColor={
        robotType === OT2_ROBOT_TYPE ? COLORS.white : COLORS.grey10
      }
      paddingY={robotType === FLEX_ROBOT_TYPE ? SPACING.spacing24 : undefined}
      borderRadius={BORDERS.borderRadius8}
    >
      <RobotCoordinateSpaceWithRef
        height="100%"
        width="100%"
        deckDef={deckDef}
        viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${
          hasWasteChute
            ? deckDef.cornerOffsetFromOrigin[1] - WASTE_CHUTE_SPACE
            : deckDef.cornerOffsetFromOrigin[1]
        } ${
          hasRightColumnFixtures
            ? deckDef.dimensions[0] + rightColumnAdjustment
            : deckDef.dimensions[0]
        } ${deckDef.dimensions[1]}`}
        zoomed
      >
        {() => (
          <>
            {robotType === OT2_ROBOT_TYPE ? (
              <>
                <DeckFromLayers
                  robotType={robotType}
                  layerBlocklist={OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
                />
                <FixedTrashText />
              </>
            ) : (
              <>
                {filteredAddressableAreas.map(addressableArea => {
                  const cutoutId = getCutoutIdForAddressableArea(
                    addressableArea.id,
                    deckDef.cutoutFixtures
                  )
                  return cutoutId != null ? (
                    <SingleSlotFixture
                      key={addressableArea.id}
                      cutoutId={cutoutId}
                      deckDefinition={deckDef}
                      showExpansion={cutoutId === 'cutoutA1'}
                      fixtureBaseColor={lightFill}
                      slotClipColor={darkFill}
                      showSlotClips={false}
                    />
                  ) : null
                })}
                {stagingAreaFixturesAndStacker.map(fixture => (
                  <StagingAreaFixture
                    key={fixture.id}
                    cutoutId={fixture.location as StagingAreaLocation}
                    deckDefinition={deckDef}
                    fixtureBaseColor={lightFill}
                    slotClipColor={darkFill}
                    showSlotClips={false}
                  />
                ))}
                {trash != null
                  ? trashBinFixtures.map(({ cutoutId }) =>
                      cutoutId != null ? (
                        <Fragment key={cutoutId}>
                          <SingleSlotFixture
                            cutoutId={cutoutId}
                            deckDefinition={deckDef}
                            slotClipColor={COLORS.transparent}
                            fixtureBaseColor={lightFill}
                            showSlotClips={false}
                          />
                          <FlexTrash
                            robotType={robotType}
                            trashIconColor={lightFill}
                            trashCutoutId={cutoutId as TrashCutoutId}
                            backgroundColor={COLORS.grey50}
                          />
                        </Fragment>
                      ) : null
                    )
                  : null}
                {wasteChuteFixtures.map(fixture => (
                  <Fragment key={fixture.id}>
                    <SingleSlotFixture
                      cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                      deckDefinition={deckDef}
                      slotClipColor={COLORS.transparent}
                      fixtureBaseColor={lightFill}
                      showSlotClips={false}
                    />
                    <WasteChuteFixture
                      cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                      deckDefinition={deckDef}
                      fixtureBaseColor={lightFill}
                    />
                  </Fragment>
                ))}
                {wasteChuteStagingAreaFixtures.map(fixture => (
                  <WasteChuteStagingAreaFixture
                    key={fixture.id}
                    cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                    deckDefinition={deckDef}
                    fixtureBaseColor={lightFill}
                    slotClipColor={darkFill}
                    showSlotClips={false}
                  />
                ))}
              </>
            )}
            <DeckThumbnailDetails
              robotType={robotType}
              hover={hoverSlot}
              setHover={setHoverSlot}
              initialDeckSetup={initialDeckSetup}
              stagingAreaCutoutIds={stagingAreaFixturesAndStacker.map(
                areas => areas.location as CutoutId
              )}
              deckConfig={deckConfig}
              {...{
                deckDef,
              }}
            />
            <SlotLabels
              robotType={robotType}
              show4thColumn={stagingAreaFixtures.length > 0 || hasVacuumModule}
            />
          </>
        )}
      </RobotCoordinateSpaceWithRef>
    </Flex>
  )
}
