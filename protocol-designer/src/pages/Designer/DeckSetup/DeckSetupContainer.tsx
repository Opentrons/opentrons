import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DeckFromLayers,
  Flex,
  FlexTrash,
  JUSTIFY_CENTER,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  SlotLabels,
  StagingAreaFixture,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  STAGING_AREA_CUTOUTS,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getSelectedTerminalItemId } from '../../../ui/steps'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { getDisableModuleRestrictions } from '../../../feature-flags/selectors'
import { getRobotType } from '../../../file-data/selectors'
import { getHasGen1MultiChannelPipette } from '../../../step-forms'
import { SlotDetailsContainer } from '../../../organisms'
import { selectZoomedInSlot } from '../../../labware-ingred/actions'
import { DeckSetupDetails } from './DeckSetupDetails'
import { selectors } from '../../../labware-ingred/selectors'
import {
  animateZoom,
  getCutoutIdForAddressableArea,
  zoomInOnCoordinate,
} from './utils'
import { DeckSetupTools } from './DeckSetupTools'

import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutId,
  ModuleModel,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntity,
  DeckSlot,
} from '@opentrons/step-generation'
import type { Fixture } from './constants'

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

export const lightFill = COLORS.grey35
export const darkFill = COLORS.grey60

export function DeckSetupContainer(): JSX.Element {
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const dispatch = useDispatch<any>()
  const zoomIn = useSelector(selectors.getZoomedInSlot)
  const _disableCollisionWarnings = useSelector(getDisableModuleRestrictions)
  const robotType = useSelector(getRobotType)
  const deckDef = React.useMemo(() => getDeckDefFromRobotType(robotType), [
    robotType,
  ])
  const [hoverSlot, setHoverSlot] = React.useState<DeckSlot | null>(null)
  const trash = Object.values(activeDeckSetup.additionalEquipmentOnDeck).find(
    ae => ae.name === 'trashBin'
  )
  const [hoveredLabware, setHoveredLabware] = React.useState<string | null>(
    null
  )
  const [hoveredModule, setHoveredModule] = React.useState<ModuleModel | null>(
    null
  )
  const [hoveredFixture, setHoveredFixture] = React.useState<Fixture | null>(
    null
  )

  const addEquipment = (slotId: string): void => {
    const cutoutId =
      getCutoutIdForAddressableArea(
        slotId as AddressableAreaName,
        deckDef.cutoutFixtures
      ) ?? 'cutoutD1'

    dispatch(selectZoomedInSlot({ slot: slotId, cutout: cutoutId }))
  }

  const trashSlot = trash?.location

  const _hasGen1MultichannelPipette = React.useMemo(
    () => getHasGen1MultiChannelPipette(activeDeckSetup.pipettes),
    [activeDeckSetup.pipettes]
  )
  const showGen1MultichannelCollisionWarnings =
    !_disableCollisionWarnings && _hasGen1MultichannelPipette

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

  const initialViewBox = `${deckDef.cornerOffsetFromOrigin[0]} ${
    hasWasteChute
      ? deckDef.cornerOffsetFromOrigin[1] - WASTE_CHUTE_SPACE
      : deckDef.cornerOffsetFromOrigin[1]
  } ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`

  const [viewBox, setViewBox] = React.useState<string>(initialViewBox)

  // TODO(ja): the animation is causing deckSetupTools to rerender 62 times
  // should optimize this
  // const hoveredSlotPosition = React.useMemo(
  //   () => getPositionFromSlotId(zoomIn?.slot ?? '', deckDef),
  //   [deckDef, zoomIn]
  // )

  // React.useEffect(() => {
  //   if (zoomIn != null && hoveredSlotPosition != null) {
  //     const zoomedInViewBox = zoomInOnCoordinate({
  //       x: hoveredSlotPosition[0],
  //       y: hoveredSlotPosition[1],
  //       deckDef,
  //     })

  //     animateZoom({
  //       targetViewBox: zoomedInViewBox,
  //       viewBox,
  //       setViewBox,
  //     })
  //   } else {
  //     animateZoom({
  //       targetViewBox: initialViewBox,
  //       viewBox,
  //       setViewBox,
  //     })
  //   }
  // }, [zoomIn, animateZoom])

  return (
    <>
      <Flex
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius8}
        width="100%"
        height={zoomIn.slot != null ? '75vh' : '70vh'}
      >
        <Flex
          width="100%"
          height="100%"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <RobotCoordinateSpaceWithRef
            height={zoomIn.slot != null ? '100%' : '70%'}
            width="100%"
            deckDef={deckDef}
            viewBox={viewBox}
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
                  zoomedInSlot={zoomIn.slot ?? undefined}
                  hoveredLabware={hoveredLabware}
                  hoveredModule={hoveredModule}
                  hoveredFixture={hoveredFixture}
                  hover={hoverSlot}
                  setHover={setHoverSlot}
                  addEquipment={addEquipment}
                  trashSlot={trashSlot ?? null}
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
                {hoverSlot != null ? (
                  <SlotDetailsContainer
                    robotType={robotType}
                    slot={hoverSlot}
                  />
                ) : null}
              </>
            )}
          </RobotCoordinateSpaceWithRef>
        </Flex>
      </Flex>
      {zoomIn.slot != null && zoomIn.cutout != null ? (
        <DeckSetupTools
          onDeckProps={{
            setHoveredFixture,
            setHoveredModule,
          }}
          onCloseClick={() => {
            dispatch(selectZoomedInSlot({ slot: null, cutout: null }))
          }}
          setHoveredLabware={setHoveredLabware}
        />
      ) : null}
    </>
  )
}
