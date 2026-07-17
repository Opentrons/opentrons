import { Fragment, useMemo, useState } from 'react'

import {
  COLORS,
  DeckFromLayers,
  FixedTrashText,
  FlexTrash,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  SlotLabels,
  StagingAreaFixture,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getActiveLayer } from '../utils/getActiveLayer'
import { getIsCutoutA1Active } from '../utils/getIsCutoutA1Active'
import { getIsPipetteOverTrash } from '../utils/getIsPipetteOverTrash'
import styles from './deckview.module.css'
import { DeckViewDetails } from './DeckViewDetails'

import type { Dispatch, SetStateAction } from 'react'
import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type {
  CutoutId,
  Liquid,
  LoadLabwareRunTimeCommand,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntity,
  TimelineFrame,
} from '@opentrons/step-generation'

export interface LabwareEntityExtended extends LabwareEntity {
  nickName: string | null
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

interface DeckViewProps {
  commands: RunTimeCommand[]
  invariantContext: InvariantContext
  robotState: TimelineFrame
  robotType: RobotType
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  liquids: Liquid[]
  // filtered commands means we are filtering out the load commands
  filteredCommands: RunTimeCommand[]
  selectedRunTimeCommand?: RunTimeCommand
}

const lightFill = COLORS.grey35
const darkFill = COLORS.grey60
const extraSize = 260

export function DeckView(props: DeckViewProps): JSX.Element {
  const {
    robotType,
    invariantContext,
    setSelectedSlot,
    robotState,
    selectedRunTimeCommand,
    liquids,
    commands,
    // filteredCommands,
  } = props
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])
  const {
    trashBinEntities,
    wasteChuteEntities,
    stagingAreaEntities,
    labwareEntities,
    moduleEntities,
  } = invariantContext
  const { labware, modules, pipettes } = robotState
  const loadLabwareCommands = commands.filter(
    command => command.commandType === 'loadLabware'
  )
  const hasFlexStacker = Object.values(moduleEntities).some(
    module => module.type === FLEX_STACKER_MODULE_TYPE
  )
  const baseViewBox = `${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`
  const stackerViewBox = useMemo(() => {
    if (!hasFlexStacker) return baseViewBox
    const [originX, originY] = deckDef.cornerOffsetFromOrigin
    const [deckWidth, deckHeight] = deckDef.dimensions

    return `${originX} ${originY} ${deckWidth + extraSize} ${deckHeight}`
  }, [baseViewBox, deckDef, hasFlexStacker])

  const labwareEntitiesExtended = Object.entries(labwareEntities).reduce(
    (acc: Record<string, LabwareEntityExtended>, [key, entity]) => {
      const matchingCommand =
        loadLabwareCommands.find(
          (command): command is LoadLabwareRunTimeCommand =>
            command.result?.labwareId === entity.id
        ) ?? null
      acc[key] = {
        ...entity,
        nickName: matchingCommand?.params?.displayName ?? null,
      }
      return acc
    },
    {}
  )

  const trashBinFixtures = Object.values(trashBinEntities).map(trash => ({
    cutoutId: trash.location as CutoutId,
    slot: trash.location.split('cutout')[1],
    id: trash.id,
  }))
  const wasteChuteStagingAreaFixtures = Object.values(
    stagingAreaEntities
  ).filter(stagingArea => stagingArea.location === WASTE_CHUTE_CUTOUT)

  const filteredAddressableAreas = deckDef.locations.addressableAreas.filter(
    aa => isAddressableAreaStandardSlot(aa.id, deckDef)
  )

  return (
    <div className={styles.deck_view_container}>
      <div className={styles.body_container}>
        <div className={styles.deck_svg_wrapper}>
          <RobotCoordinateSpaceWithRef
            height="100%"
            width="100%"
            deckDef={deckDef}
            zoomed={true}
            viewBox={stackerViewBox}
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
                      const labwareOnSlot = Object.entries(labware).find(
                        ([_, lw]) =>
                          getSlotInLocationStack(lw.stack) ===
                          addressableArea.id
                      )
                      const { isActiveLayerVisible } =
                        labwareOnSlot != null
                          ? getActiveLayer(
                              labwareOnSlot[0],
                              pipettes,
                              selectedRunTimeCommand
                            )
                          : { isActiveLayerVisible: false }

                      return cutoutId != null ? (
                        <SingleSlotFixture
                          key={addressableArea.id}
                          cutoutId={cutoutId}
                          deckDefinition={deckDef}
                          showExpansion={cutoutId === 'cutoutA1'}
                          fixtureBaseColor={
                            isActiveLayerVisible ||
                            getIsCutoutA1Active(
                              labware,
                              modules,
                              pipettes,
                              cutoutId,
                              selectedRunTimeCommand
                            )
                              ? COLORS.purple30
                              : lightFill
                          }
                          slotClipColor={darkFill}
                        />
                      ) : null
                    })}
                    {Object.values(stagingAreaEntities).map(entity => (
                      <StagingAreaFixture
                        key={entity.id}
                        cutoutId={entity.location as StagingAreaLocation}
                        deckDefinition={deckDef}
                        fixtureBaseColor={lightFill}
                        slotClipColor={darkFill}
                      />
                    ))}
                    {Object.values(trashBinEntities).length > 0
                      ? trashBinFixtures.map(({ cutoutId, slot, id }) => {
                          const isPipetteOverTrash = getIsPipetteOverTrash(
                            pipettes,
                            id,
                            selectedRunTimeCommand
                          )

                          return (
                            <Fragment key={cutoutId}>
                              <SingleSlotFixture
                                cutoutId={cutoutId}
                                deckDefinition={deckDef}
                                slotClipColor={COLORS.transparent}
                                fixtureBaseColor={
                                  isPipetteOverTrash
                                    ? COLORS.purple30
                                    : lightFill
                                }
                              />
                              <FlexTrash
                                robotType={robotType}
                                trashIconColor={lightFill}
                                trashCutoutId={cutoutId as TrashCutoutId}
                                backgroundColor={COLORS.grey50}
                                onClick={() => {
                                  setSelectedSlot(slot)
                                }}
                              />
                            </Fragment>
                          )
                        })
                      : null}
                    {Object.values(wasteChuteEntities).map(
                      ({ id, location }) => {
                        const isPipetteOverTrash = getIsPipetteOverTrash(
                          pipettes,
                          id,
                          selectedRunTimeCommand
                        )
                        return (
                          <WasteChuteFixture
                            key={id}
                            cutoutId={location as typeof WASTE_CHUTE_CUTOUT}
                            deckDefinition={deckDef}
                            fixtureBaseColor={
                              isPipetteOverTrash ? COLORS.purple30 : lightFill
                            }
                          />
                        )
                      }
                    )}
                    {wasteChuteStagingAreaFixtures.map(fixture => (
                      <WasteChuteStagingAreaFixture
                        key={fixture.id}
                        cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                        deckDefinition={deckDef}
                        fixtureBaseColor={lightFill}
                        slotClipColor={darkFill}
                      />
                    ))}
                  </>
                )}
                <DeckViewDetails
                  labwareEntitiesExtended={labwareEntitiesExtended}
                  liquids={liquids}
                  hoveredSlot={hoveredSlot}
                  setHoveredSlot={setHoveredSlot}
                  robotType={robotType}
                  setSelectedSlot={setSelectedSlot}
                  robotState={robotState}
                  invariantContext={invariantContext}
                  stagingAreaCutoutIds={Object.values(stagingAreaEntities).map(
                    areas => areas.location as CutoutId
                  )}
                  {...{
                    deckDef,
                  }}
                  selectedRunTimeCommand={selectedRunTimeCommand}
                />
                <SlotLabels
                  robotType={robotType}
                  show4thColumn={Object.values(stagingAreaEntities).length > 0}
                />
              </>
            )}
          </RobotCoordinateSpaceWithRef>
        </div>
      </div>
    </div>
  )
}
