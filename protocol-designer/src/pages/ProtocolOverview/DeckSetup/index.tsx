import * as React from 'react'

import { useDispatch, useSelector } from 'react-redux'
import {
  COLORS,
  DeckFromLayers,
  Flex,
  FlexTrash,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  SlotLabels,
  StagingAreaFixture,
  useOnClickOutside,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  STAGING_AREA_CUTOUTS,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { getSelectedTerminalItemId } from '../../../ui/steps'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { getDisableModuleRestrictions } from '../../../feature-flags/selectors'
import { getRobotType } from '../../../file-data/selectors'
import { getHasGen1MultiChannelPipette } from '../../../step-forms'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { ZoomedInSlot } from './ZoomedInSlot'
import { SlotDetailsContainer } from './SlotDetailsContainer'
import { DeckSetupDetails } from './DeckSetupDetails'

import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutFixture,
  CutoutId,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntity,
  DeckSlot,
} from '@opentrons/step-generation'

interface DeckSetupProps {
  onCancel: () => void
  onSave: () => void
}
interface OpenSlot {
  cutoutId: CutoutId
  slot: DeckSlot
}

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

export const DeckSetup = (props: DeckSetupProps): JSX.Element => {
  const drilledDown =
    useSelector(labwareIngredSelectors.getDrillDownLabwareId) != null
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const _disableCollisionWarnings = useSelector(getDisableModuleRestrictions)
  const trash = Object.values(activeDeckSetup.additionalEquipmentOnDeck).find(
    ae => ae.name === 'trashBin'
  )
  const robotType = useSelector(getRobotType)
  const deckDef = React.useMemo(() => getDeckDefFromRobotType(robotType), [])
  const [hover, setHover] = React.useState<DeckSlot | null>(null)
  const [openSlot, setOpenSlot] = React.useState<OpenSlot | null>(null)

  const addEquipment = (slotId: string): void => {
    const cutoutId =
      getCutoutIdForAddressableArea(
        slotId as AddressableAreaName,
        deckDef.cutoutFixtures
      ) ?? 'cutoutD1'
    setOpenSlot({ cutoutId, slot: slotId })
  }

  const trashSlot = trash?.location
  const dispatch = useDispatch()

  const _hasGen1MultichannelPipette = React.useMemo(
    () => getHasGen1MultiChannelPipette(activeDeckSetup.pipettes),
    [activeDeckSetup.pipettes]
  )
  const showGen1MultichannelCollisionWarnings =
    !_disableCollisionWarnings && _hasGen1MultichannelPipette

  const wrapperRef: React.RefObject<HTMLDivElement> = useOnClickOutside({
    onClickOutside: () => {
      if (drilledDown) dispatch(labwareIngredActions.drillUpFromLabware())
    },
  })
  const trashBinFixtures = [
    {
      cutoutId: trash?.location as CutoutId,
      cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    },
  ]
  const wasteChuteFixtures = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      WASTE_CHUTE_CUTOUT.includes(aE.location as CutoutId) &&
      aE.name === 'wasteChute'
  )
  const stagingAreaFixtures: AdditionalEquipmentEntity[] = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea'
  )

  const wasteChuteStagingAreaFixtures = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea' &&
      aE.location === WASTE_CHUTE_CUTOUT &&
      wasteChuteFixtures.length > 0
  )

  const hasWasteChute =
    wasteChuteFixtures.length > 0 || wasteChuteStagingAreaFixtures.length > 0

  const filteredAddressableAreas = deckDef.locations.addressableAreas.filter(
    aa => isAddressableAreaStandardSlot(aa.id, deckDef)
  )
  return openSlot != null ? (
    <ZoomedInSlot
      robotType={robotType}
      slot={openSlot.slot}
      cutoutId={openSlot.cutoutId}
      goBack={() => {
        setOpenSlot(null)
      }}
    />
  ) : (
    <Flex
      maxWidth={robotType === FLEX_ROBOT_TYPE ? '130vh' : '100vh'}
      width="100%"
      maxHeight="120vh"
    >
      <RobotCoordinateSpaceWithRef
        height="90%"
        deckDef={deckDef}
        viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${
          hasWasteChute
            ? deckDef.cornerOffsetFromOrigin[1] - 30
            : deckDef.cornerOffsetFromOrigin[1]
        } ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
      >
        {() => (
          <>
            {robotType === OT2_ROBOT_TYPE ? (
              <DeckFromLayers
                robotType={robotType}
                layerBlocklist={OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
              />
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
                    />
                  ) : null
                })}
                {stagingAreaFixtures.map(fixture => (
                  <StagingAreaFixture
                    key={fixture.id}
                    cutoutId={fixture.location as StagingAreaLocation}
                    deckDefinition={deckDef}
                    slotClipColor={darkFill}
                    fixtureBaseColor={lightFill}
                  />
                ))}
                {trash != null
                  ? trashBinFixtures.map(({ cutoutId }) =>
                      cutoutId != null ? (
                        <React.Fragment key={cutoutId}>
                          <SingleSlotFixture
                            cutoutId={cutoutId}
                            deckDefinition={deckDef}
                            slotClipColor={COLORS.transparent}
                            fixtureBaseColor={lightFill}
                          />
                          <FlexTrash
                            robotType={robotType}
                            trashIconColor={lightFill}
                            trashCutoutId={cutoutId as TrashCutoutId}
                            backgroundColor={COLORS.grey50}
                          />
                        </React.Fragment>
                      ) : null
                    )
                  : null}
                {wasteChuteFixtures.map(fixture => (
                  <WasteChuteFixture
                    key={fixture.id}
                    cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                    deckDefinition={deckDef}
                    fixtureBaseColor={lightFill}
                  />
                ))}
                {wasteChuteStagingAreaFixtures.map(fixture => (
                  <WasteChuteStagingAreaFixture
                    key={fixture.id}
                    cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                    deckDefinition={deckDef}
                    slotClipColor={darkFill}
                    fixtureBaseColor={lightFill}
                  />
                ))}
              </>
            )}
            <DeckSetupDetails
              hover={hover}
              setHover={setHover}
              addEquipment={addEquipment}
              trashSlot={trashSlot ?? null}
              robotType={robotType}
              activeDeckSetup={activeDeckSetup}
              selectedTerminalItemId={selectedTerminalItemId}
              stagingAreaCutoutIds={stagingAreaFixtures.map(
                areas => areas.location as CutoutId
              )}
              {...{
                deckDef,

                showGen1MultichannelCollisionWarnings,
              }}
            />
            <SlotLabels
              robotType={robotType}
              show4thColumn={stagingAreaFixtures.length > 0}
            />
            {hover != null ? (
              <SlotDetailsContainer robotType={robotType} />
            ) : null}
          </>
        )}
      </RobotCoordinateSpaceWithRef>
    </Flex>
  )
}

function getCutoutIdForAddressableArea(
  addressableArea: AddressableAreaName,
  cutoutFixtures: CutoutFixture[]
): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] =
      Object.entries(
        cutoutFixture.providesAddressableAreas
      ).find(([_cutoutId, providedAAs]) =>
        providedAAs.includes(addressableArea)
      ) ?? []
    return (cutoutId as CutoutId) ?? acc
  }, null)
}
