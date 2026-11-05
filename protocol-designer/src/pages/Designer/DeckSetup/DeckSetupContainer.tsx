import { Fragment, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import round from 'lodash/round'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DeckFromLayers,
  DIRECTION_COLUMN,
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
  FLEX_STACKER_MODULE_TYPE,
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  STAGING_AREA_CUTOUTS,
  TRASH_BIN_ADAPTER_FIXTURE,
  VACUUM_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getIsSlotAVacuumDock } from '@opentrons/step-generation'

import {
  DECK_SETUP_TOOLS_WIDTH_REM,
  HOPPER_ZOOM_OFFSET_POSTITION,
  VACUUM_DOCK_ZOOM_OFFSET_POSITION,
} from '../../../constants'
import { getDisableModuleRestrictions } from '../../../feature-flags/selectors'
import {
  editSlotInfo,
  selectZoomedIntoSlot,
} from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { getHasGen1MultiChannelPipette } from '../../../step-forms'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { getSelectedTerminalItemId } from '../../../ui/steps'
import { getSlotInformation } from '../utils'
import { DeckSetupDetails } from './DeckSetupDetails'
import { DeckSetupToolbox } from './DeckSetupToolbox'
import {
  animateZoom,
  getCutoutIdForAddressableArea,
  getSVGContainerWidth,
  zoomInOnCoordinate,
} from './utils'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { AdditionalEquipmentEntity } from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'

const DECK_VIEW_CONTAINER_MAX_HEIGHT = '35rem'

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

interface DeckSetupContainerProps {
  setHoverSlot: Dispatch<SetStateAction<string | null>>
  hoverSlot: string | null
  robotType: RobotType
  deckDef: DeckDefinition
  setViewBox: Dispatch<SetStateAction<string>>
  viewBox: string
  initialViewBox: string
  currentStep: FormData | null
}
export function DeckSetupContainer(props: DeckSetupContainerProps): ReactNode {
  const {
    robotType,
    hoverSlot,
    setHoverSlot,
    deckDef,
    initialViewBox,
    viewBox,
    setViewBox,
    currentStep,
  } = props
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const dispatch = useDispatch<any>()
  const zoomIn = useSelector(selectors.getZoomedInSlot)
  const _disableCollisionWarnings = useSelector(getDisableModuleRestrictions)
  const terminalItemId = useSelector(getSelectedTerminalItemId)
  const trash = Object.values(activeDeckSetup.additionalEquipmentOnDeck).find(
    ae => ae.name === 'trashBin'
  )
  const wasteChuteFixtures = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      WASTE_CHUTE_CUTOUT.includes(aE.location as CutoutId) &&
      aE.name === 'wasteChute'
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

  const windowInnerWidthRem = window.innerWidth / 16
  const deckMapRatio = round(
    (windowInnerWidthRem - DECK_SETUP_TOOLS_WIDTH_REM) / windowInnerWidthRem,
    2
  )
  const hasFlexStacker = Object.values(activeDeckSetup.modules).some(
    module => module.type === FLEX_STACKER_MODULE_TYPE
  )
  const flexStackerLocations = Object.values(activeDeckSetup.modules)
    .filter(stacker => stacker.type === FLEX_STACKER_MODULE_TYPE)
    .map(({ slot: location, ...rest }) => ({ ...rest, location }))
  flexStackerLocations.forEach(
    stacker => (stacker.location = `cutout${stacker.location.slice(0, 1)}3`)
  )
  const isZoomed = Object.values(zoomIn).some(val => val != null)
  const viewBoxNumerical = viewBox?.split(' ').map(val => Number(val)) ?? []
  const viewBoxAdjustedNumerical = [
    ...viewBoxNumerical.slice(0, 2),
    (viewBoxNumerical[2] - viewBoxNumerical[0]) / deckMapRatio +
      viewBoxNumerical[0],
    viewBoxNumerical[3],
  ]
  const viewBoxAdjusted = viewBoxAdjustedNumerical.reduce((acc, num, i) => {
    return i < viewBoxNumerical.length - 1 ? acc + `${num} ` : acc + `${num}`
  }, '')

  // Returns the actual slot/addressable area for positioning
  const _getSlotForPositioning = (location: string): string => {
    const isOnHopper = location.includes('hopper')
    if (isOnHopper) {
      return location.split('hopper')[1]
    }
    return location
  }

  const _getZoomInOffsetFromRawLocation = (location: string): number => {
    const isOnHopper = location.includes('hopper')
    if (isOnHopper) {
      return HOPPER_ZOOM_OFFSET_POSTITION
    }
    if (getIsSlotAVacuumDock(location)) {
      return VACUUM_DOCK_ZOOM_OFFSET_POSITION
    }
    return 0
  }

  const addEquipment = (location: string): void => {
    const slotForPositioning = _getSlotForPositioning(location)
    const { createdModuleForSlot, preSelectedFixture } = getSlotInformation({
      deckSetup: activeDeckSetup,
      slot: location, // Keep using fake location for slot info
      deckDef,
    })

    const cutoutId =
      getCutoutIdForAddressableArea(
        slotForPositioning as AddressableAreaName,
        deckDef.cutoutFixtures
      ) ?? null
    if (cutoutId == null) {
      console.error('expected to find a cutoutId but could not')
    }
    dispatch(selectZoomedIntoSlot({ slot: location, cutout: cutoutId })) // Keep using fake location

    const zoomInSlotPosition = getPositionFromSlotId(
      slotForPositioning ?? '',
      deckDef,
      _getZoomInOffsetFromRawLocation(location)
    )
    if (zoomInSlotPosition != null) {
      const zoomedInViewBox = zoomInOnCoordinate({
        x: zoomInSlotPosition[0],
        y: zoomInSlotPosition[1],

        deckDef,
      })
      //  TODO(ja, 9/3/24): re-examine this usage. It is causing
      //  a handful of rerendering of the DeckSetupTools which may
      //  cause optimization issues??
      animateZoom({
        targetViewBox: zoomedInViewBox,
        viewBox,
        setViewBox,
      })
    }
    dispatch(
      editSlotInfo({
        moduleModel: createdModuleForSlot?.model,
        fixture: preSelectedFixture,
      })
    )
  }

  const _hasGen1MultichannelPipette = useMemo(
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
  const stagingAreaFixtures: AdditionalEquipmentEntity[] = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea'
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
      !stagingAreaCutoutIds.includes(aa.id)
  )
  const svgContainerWidth = getSVGContainerWidth(robotType, isZoomed)
  return (
    <>
      <Flex
        backgroundColor={!isZoomed ? COLORS.white : 'none'}
        borderRadius={BORDERS.borderRadius12}
        width="100%"
        height="100%"
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing60}
        justifyContent={JUSTIFY_CENTER}
        position="relative"
        maxHeight={isZoomed ? '100%' : DECK_VIEW_CONTAINER_MAX_HEIGHT}
      >
        <Flex
          width="100%"
          height="100%"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          gridGap={SPACING.spacing12}
        >
          <Flex
            width={svgContainerWidth}
            height="100%"
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            position="relative"
          >
            <RobotCoordinateSpaceWithRef
              height="100%"
              width="100%"
              minWidth="auto"
              deckDef={deckDef}
              viewBox={viewBoxAdjusted}
              transform={
                robotType === OT2_ROBOT_TYPE
                  ? 'scale(1.3, -1.3)'
                  : 'scale(1, -1)'
              }
              zoomed={zoomIn.slot != null}
              adjustViewBoxForStacker={hasFlexStacker}
              borderRadius={BORDERS.borderRadius12}
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
                        return cutoutId != null &&
                          !Object.keys(stagingAreaFixturesAndStacker).includes(
                            cutoutId
                          ) ? (
                          <SingleSlotFixture
                            key={addressableArea.id}
                            cutoutId={cutoutId}
                            deckDefinition={deckDef}
                            slotClipColor={darkFill}
                            showExpansion={cutoutId === 'cutoutA1'}
                            fixtureBaseColor={lightFill}
                            showSlotClips={false}
                          />
                        ) : null
                      })}
                      {stagingAreaFixturesAndStacker.map(fixture => {
                        if (
                          zoomIn.cutout == null ||
                          zoomIn.cutout !== fixture.location
                        ) {
                          return (
                            <StagingAreaFixture
                              key={fixture.id}
                              cutoutId={fixture.location as StagingAreaLocation}
                              deckDefinition={deckDef}
                              slotClipColor={darkFill}
                              fixtureBaseColor={lightFill}
                              showSlotClips={false}
                            />
                          )
                        }
                      })}
                      {trash != null
                        ? trashBinFixtures.map(({ cutoutId }) =>
                            cutoutId != null &&
                            (zoomIn.cutout == null ||
                              zoomIn.cutout !== cutoutId) ? (
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
                      {wasteChuteFixtures.map(fixture => {
                        if (
                          zoomIn.cutout == null ||
                          zoomIn.cutout !== fixture.location
                        ) {
                          return (
                            <WasteChuteFixture
                              key={fixture.id}
                              cutoutId={
                                fixture.location as typeof WASTE_CHUTE_CUTOUT
                              }
                              deckDefinition={deckDef}
                              fixtureBaseColor={lightFill}
                            />
                          )
                        }
                      })}
                      {wasteChuteStagingAreaFixtures.map(fixture => {
                        if (
                          zoomIn.cutout == null ||
                          zoomIn.cutout !== fixture.location
                        ) {
                          return (
                            <WasteChuteStagingAreaFixture
                              key={fixture.id}
                              cutoutId={
                                fixture.location as typeof WASTE_CHUTE_CUTOUT
                              }
                              deckDefinition={deckDef}
                              slotClipColor={darkFill}
                              fixtureBaseColor={lightFill}
                              showSlotClips={false}
                            />
                          )
                        }
                      })}
                    </>
                  )}
                  <DeckSetupDetails
                    selectedZoomInSlot={zoomIn.slot ?? undefined}
                    hover={hoverSlot}
                    terminalItemId={terminalItemId}
                    setHover={setHoverSlot}
                    addEquipment={addEquipment}
                    activeDeckSetup={activeDeckSetup}
                    currentStep={currentStep}
                    stagingAreaCutoutIds={stagingAreaFixturesAndStacker.map(
                      areas => areas.location as CutoutId
                    )}
                    {...{
                      deckDef,
                      showGen1MultichannelCollisionWarnings,
                    }}
                  />
                  <SlotLabels
                    robotType={robotType}
                    show4thColumn={
                      stagingAreaFixturesAndStacker.length > 0 ||
                      Object.values(activeDeckSetup.modules).some(
                        ({ type }) =>
                          type === FLEX_STACKER_MODULE_TYPE ||
                          type === VACUUM_MODULE_TYPE
                      )
                    }
                  />
                </>
              )}
            </RobotCoordinateSpaceWithRef>
          </Flex>
        </Flex>
        {zoomIn.slot != null && zoomIn.cutout != null ? (
          <DeckSetupToolbox
            onCloseClick={() => {
              dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
              animateZoom({
                targetViewBox: initialViewBox,
                viewBox,
                setViewBox,
              })
            }}
          />
        ) : null}
      </Flex>
    </>
  )
}
