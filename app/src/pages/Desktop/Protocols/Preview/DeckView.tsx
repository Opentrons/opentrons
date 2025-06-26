import { Dispatch, Fragment, SetStateAction, useMemo, useState } from 'react'

import {
  COLORS,
  FlexTrash,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  SlotLabels,
  StagingAreaFixture,
  StagingAreaLocation,
  StyledText,
  TrashCutoutId,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  CutoutId,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  isAddressableAreaStandardSlot,
  RobotType,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import { DeckViewDetails } from './DeckViewDetails'
import styles from './preview.module.css'

import type {
  InvariantContext,
  TimelineFrame,
} from '@opentrons/step-generation'

interface DeckViewProps {
  invariantContext: InvariantContext
  robotState: TimelineFrame
  robotType: RobotType
  selectedSlot: string | null
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
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
  } = props
  const [isSlotActive, setSlotActive] = useState<boolean>(false)
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])
  const {
    trashBinEntities,
    wasteChuteEntities,
    stagingAreaEntities,
  } = invariantContext

  const trashBinFixtures = [
    {
      cutoutId: trashBinEntities[0]?.location as CutoutId,
      cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    },
  ]

  const wasteChuteStagingAreaFixtures = Object.values(
    stagingAreaEntities
  ).filter(stagingArea => stagingArea.location === WASTE_CHUTE_CUTOUT)

  const filteredAddressableAreas = deckDef.locations.addressableAreas.filter(
    aa => isAddressableAreaStandardSlot(aa.id, deckDef)
  )

  return (
    <div style={{ padding: '0px 16px' }}>
      <div className={styles.deckViewContainer}>
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
                ? trashBinFixtures.map(({ cutoutId }) =>
                    cutoutId != null ? (
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
                          backgroundColor={COLORS.grey50}
                        />
                      </Fragment>
                    ) : null
                  )
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
                robotType={robotType}
                isSlotActive={isSlotActive}
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
