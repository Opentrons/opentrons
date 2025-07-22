import { Fragment, useMemo, useState } from 'react'

import {
  COLORS,
  FlexTrash,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  SlotLabels,
  StagingAreaFixture,
  StyledText,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  isAddressableAreaStandardSlot,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import { DeckViewDetails } from './DeckViewDetails'
import styles from './preview.module.css'
import { getBackgroundColor } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type {
  CutoutId,
  Liquid,
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
const POTENTIAL_TRASH_COMMAND_TYPES = [
  'moveToAddressableArea',
  'moveToAddressableAreaForDropTip',
  'dropTip',
  'dropTipInPlace',
  'airGapInPlace',
  'blowOutInPlace',
  'blowOut',
  'airGap',
]

interface DeckViewProps {
  commands: RunTimeCommand[]
  invariantContext: InvariantContext
  robotState: TimelineFrame
  robotType: RobotType
  selectedSlot: string | null
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  showDeckRenders: boolean
  liquids: Liquid[]
  selectedRunTimeCommand?: RunTimeCommand
}

const lightFill = COLORS.grey35
const darkFill = COLORS.grey60

export function DeckView(props: DeckViewProps): JSX.Element {
  const {
    robotType,
    invariantContext,
    selectedSlot,
    setSelectedSlot,
    robotState,
    selectedRunTimeCommand,
    showDeckRenders,
    liquids,
    commands,
  } = props
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])
  const {
    trashBinEntities,
    wasteChuteEntities,
    stagingAreaEntities,
    labwareEntities,
  } = invariantContext
  const loadLabwareCommands = commands.filter(
    command => command.commandType === 'loadLabware'
  )
  const labwareEntitiesExtended = Object.entries(labwareEntities).reduce(
    (acc: Record<string, LabwareEntityExtended>, [key, entity]) => {
      const matchingCommand = loadLabwareCommands.find(
        command => command.result?.labwareId === entity.id
      )
      acc[key] = {
        ...entity,
        nickName: matchingCommand?.params.displayName ?? null,
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
    <div className={styles.deck_view_padding}>
      <div className={styles.deck_view_container}>
        <StyledText desktopStyle="bodyLargeSemiBold">Deck View</StyledText>
        <RobotCoordinateSpaceWithRef
          height="100%"
          width="100%"
          deckDef={deckDef}
          viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
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
                    showExpansion={cutoutId === 'cutoutA1'}
                    fixtureBaseColor={lightFill}
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
                    // TODO: the dropTipInPlace, airGapInplace, and
                    // blowoutInPlace commands don't have
                    // any knowledge of where its dropping. would be
                    // nice to expand the results key to include the
                    // addressable area name
                    const isPipetteOverTrash =
                      Object.values(robotState.pipettes).some(
                        pipette => pipette.entityId === id
                      ) &&
                      selectedRunTimeCommand != null &&
                      POTENTIAL_TRASH_COMMAND_TYPES.includes(
                        selectedRunTimeCommand.commandType
                      )

                    return (
                      <Fragment key={cutoutId}>
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
                          backgroundColor={getBackgroundColor(
                            hoveredSlot,
                            selectedSlot,
                            slot,
                            isPipetteOverTrash
                          )}
                          onClick={() => {
                            setSelectedSlot(slot)
                          }}
                          onMouseEnter={() => {
                            setHoveredSlot(slot)
                          }}
                          onMouseLeave={() => {
                            setHoveredSlot(null)
                          }}
                        />
                      </Fragment>
                    )
                  })
                : null}
              {Object.values(wasteChuteEntities).map(entity => (
                <WasteChuteFixture
                  key={entity.id}
                  cutoutId={entity.location as typeof WASTE_CHUTE_CUTOUT}
                  deckDefinition={deckDef}
                  fixtureBaseColor={lightFill}
                />
              ))}
              {wasteChuteStagingAreaFixtures.map(fixture => (
                <WasteChuteStagingAreaFixture
                  key={fixture.id}
                  cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                  deckDefinition={deckDef}
                  fixtureBaseColor={lightFill}
                  slotClipColor={darkFill}
                />
              ))}
              <DeckViewDetails
                labwareEntitiesExtended={labwareEntitiesExtended}
                liquids={liquids}
                showDeckRenders={showDeckRenders}
                hoveredSlot={hoveredSlot}
                setHoveredSlot={setHoveredSlot}
                robotType={robotType}
                selectedSlot={selectedSlot}
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
  )
}
