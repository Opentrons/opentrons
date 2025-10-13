import { Fragment } from 'react'
import { useSelector } from 'react-redux'

import {
  COLORS,
  FlexTrash,
  Module,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  SlotLabels,
  StagingAreaFixture,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getAddressableAreaFromSlotId,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  getModuleDef,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  STAGING_AREA_CUTOUTS,
  THERMOCYCLER_MODULE_TYPE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwaresOnModuleFromStack } from '/protocol-designer/utils'

import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type { CutoutId } from '@opentrons/shared-data'
import type { AdditionalEquipmentEntity } from '@opentrons/step-generation'

interface BaseDeckTipSelectionProps {
  controls: JSX.Element
  hoveredId?: string | null
  showSlotLabels?: boolean
  viewBox?: string | null
}

export function BaseDeckTipSelection(
  props: BaseDeckTipSelectionProps
): JSX.Element {
  const { controls, hoveredId, showSlotLabels = true, viewBox } = props
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const robotType = useSelector(getRobotType)
  const deckDef = getDeckDefFromRobotType(robotType)
  const filteredAddressableAreas = deckDef.locations.addressableAreas.filter(
    aa => isAddressableAreaStandardSlot(aa.id, deckDef)
  )
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const stagingAreaFixtures: AdditionalEquipmentEntity[] = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea'
  )
  const trash = Object.values(activeDeckSetup.additionalEquipmentOnDeck).find(
    ae => ae.name === 'trashBin'
  )
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
  const wasteChuteStagingAreaFixtures = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea' &&
      aE.location === WASTE_CHUTE_CUTOUT &&
      wasteChuteFixtures.length > 0
  )
  const allLabware = Object.values(activeDeckSetup.labware)
  const allModules = Object.values(activeDeckSetup.modules)
  return (
    <RobotCoordinateSpaceWithRef
      height="100%"
      width="100%"
      deckDef={deckDef}
      viewBox={viewBox}
      zoomed={viewBox != null}
    >
      {() => (
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
                slotClipColor={COLORS.grey60}
                showExpansion={cutoutId === 'cutoutA1'}
                fixtureBaseColor={COLORS.grey35}
              />
            ) : null
          })}
          {stagingAreaFixtures.map(fixture => {
            return (
              <StagingAreaFixture
                key={fixture.id}
                cutoutId={fixture.location as StagingAreaLocation}
                deckDefinition={deckDef}
                slotClipColor={COLORS.grey60}
                fixtureBaseColor={COLORS.grey35}
              />
            )
          })}
          {trash != null
            ? trashBinFixtures.map(({ cutoutId }) =>
                cutoutId != null ? (
                  <Fragment key={cutoutId}>
                    <SingleSlotFixture
                      cutoutId={cutoutId}
                      deckDefinition={deckDef}
                      slotClipColor={COLORS.transparent}
                      fixtureBaseColor={COLORS.grey35}
                    />
                    <FlexTrash
                      robotType={FLEX_ROBOT_TYPE}
                      trashIconColor={COLORS.grey35}
                      trashCutoutId={cutoutId as TrashCutoutId}
                      backgroundColor={COLORS.grey50}
                    />
                  </Fragment>
                ) : null
              )
            : null}
          {wasteChuteFixtures.map(fixture => (
            <WasteChuteFixture
              key={fixture.id}
              cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
              deckDefinition={deckDef}
              fixtureBaseColor={COLORS.grey35}
            />
          ))}
          {wasteChuteStagingAreaFixtures.map(fixture => (
            <WasteChuteStagingAreaFixture
              key={fixture.id}
              cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
              deckDefinition={deckDef}
              slotClipColor={COLORS.grey60}
              fixtureBaseColor={COLORS.grey35}
            />
          ))}
          {allModules.map(({ id, slot, model, moduleState }) => {
            const slotId = slot
            const slotPosition = getPositionFromSlotId(slotId, deckDef)
            if (slotPosition == null) {
              console.warn(`no slot ${slotId} for module ${id}`)
              return null
            }
            const moduleDef = getModuleDef(model)
            const { topMostId, rightBelowTopId } = getLabwaresOnModuleFromStack(
              id,
              allLabware
            )
            return (
              <Fragment key={id}>
                <Module
                  key={slot}
                  x={slotPosition[0]}
                  y={slotPosition[1]}
                  def={moduleDef}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slotPosition[0]
                  )}
                  innerProps={
                    moduleState.type === THERMOCYCLER_MODULE_TYPE
                      ? { lidMotorState: 'open' }
                      : {}
                  }
                  targetSlotId={slotId}
                  targetDeckId={deckDef.otId}
                  childrenPositioningMode="offsetToSlot"
                >
                  <>
                    {rightBelowTopId != null ? (
                      <LabwareOnDeck
                        x={0}
                        y={0}
                        labwareOnDeck={
                          initialDeckSetup.labware[rightBelowTopId]
                        }
                      />
                    ) : null}
                    {topMostId != null ? (
                      <LabwareOnDeck
                        x={0}
                        y={0}
                        labwareOnDeck={initialDeckSetup.labware[topMostId]}
                      />
                    ) : null}
                  </>
                </Module>
              </Fragment>
            )
          })}

          {allLabware.map(labware => {
            if (
              getSlotInLocationStack(labware.stack) === 'offDeck' ||
              labware.stack.includes('fixedTrash') ||
              allModules.some(m => labware.stack.includes(m.id))
            ) {
              return null
            }
            const slot = getSlotInLocationStack(labware.stack)

            const slotPosition = getPositionFromSlotId(slot, deckDef)
            const slotBoundingBox = getAddressableAreaFromSlotId(
              slot,
              deckDef
            )?.boundingBox
            if (slotPosition == null || slotBoundingBox == null) {
              console.warn(`no slot ${slot} for labware ${labware.id}!`)
              return null
            }
            return (
              <LabwareOnDeck
                key={labware.id}
                x={slotPosition[0]}
                y={slotPosition[1]}
                labwareOnDeck={labware}
                highlight={labware.id === hoveredId}
                showHighlightedWells={false}
              />
            )
          })}
          {/* labware controls for selecting tiprack or tips */}
          {controls}
          {showSlotLabels ? (
            <SlotLabels
              robotType={robotType}
              show4thColumn={
                [...stagingAreaFixtures, ...wasteChuteStagingAreaFixtures]
                  .length > 0
              }
            />
          ) : null}
        </>
      )}
    </RobotCoordinateSpaceWithRef>
  )
}
