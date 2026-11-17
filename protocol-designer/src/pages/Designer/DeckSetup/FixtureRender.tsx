import { Fragment } from 'react'
import { useSelector } from 'react-redux'

import {
  COLORS,
  FixedTrash,
  FlexTrash,
  Module,
  SingleSlotFixture,
  StagingAreaFixture,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import {
  getModuleDef,
  getPositionFromSlotId,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  getLabwareSlot,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { LabwareOnDeck as LabwareOnDeckComponent } from '../../../components/organisms'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { darkFill, lightFill } from './DeckSetupContainer'
import { getAdjacentSlots } from './utils'

import type { ReactNode } from 'react'
import type {
  DeckLabelProps,
  StagingAreaLocation,
  TrashCutoutId,
} from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  RobotType,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import type { Fixture } from './constants'

interface FixtureRenderProps {
  fixture: Fixture
  cutout: CutoutId
  robotType: RobotType
  deckDef: DeckDefinition
  showHighlight?: boolean
  tagInfo?: DeckLabelProps[]
}
export const FixtureRender = (props: FixtureRenderProps): ReactNode => {
  const { fixture, cutout, deckDef, robotType, showHighlight, tagInfo } = props
  const deckSetup = useSelector(getInitialDeckSetup)
  const { labware, modules } = deckSetup
  const adjacentSlots = getAdjacentSlots(fixture, cutout)

  // magnetic block in column 3 if staging area is used
  const adjacentModule = Object.values(modules).find(({ slot }) =>
    adjacentSlots?.includes(slot as AddressableAreaName)
  )

  // labware in column 3 or 4, possibly on a magnetic block in column 3
  const adjacentLabwares = Object.values(labware).filter(
    ({ stack }) =>
      adjacentSlots?.includes(
        getSlotInLocationStack(stack) as AddressableAreaName
      ) ||
      (adjacentModule != null && stack.includes(adjacentModule?.id))
  )
  const renderLabwareOnDeck = (): JSX.Element | null => {
    return (
      <>
        {adjacentLabwares.map(adjacentLabware => {
          const slot = getLabwareSlot(adjacentLabware.id, labware)
          const slotPosition = getPositionFromSlotId(slot, deckDef)
          return (
            <LabwareOnDeckComponent
              key={adjacentLabware.id}
              x={slotPosition != null ? slotPosition[0] : 0}
              y={slotPosition != null ? slotPosition[1] : 0}
              labwareOnDeck={adjacentLabware}
            />
          )
        })}
      </>
    )
  }
  const renderModuleOnDeck = (): JSX.Element | null => {
    if (adjacentModule == null) {
      return null
    }
    const slotPosition = getPositionFromSlotId(adjacentModule.slot, deckDef)

    return (
      <Module
        key={adjacentModule.id}
        x={slotPosition != null ? slotPosition[0] : 0}
        y={slotPosition != null ? slotPosition[1] : 0}
        def={getModuleDef(adjacentModule.model)}
        targetSlotId={adjacentModule.slot}
        targetDeckId={deckDef.otId}
        childrenPositioningMode="passThrough"
      />
    )
  }

  switch (fixture) {
    case 'stagingArea': {
      return (
        <Fragment
          key={`fixtureRender_${fixture}_${
            adjacentLabwares.length > 0 ? adjacentLabwares[0]?.id : 0
          }`}
        >
          <StagingAreaFixture
            cutoutId={cutout as StagingAreaLocation}
            deckDefinition={deckDef}
            slotClipColor={darkFill}
            fixtureBaseColor={lightFill}
          />
          {renderModuleOnDeck()}
          {renderLabwareOnDeck()}
        </Fragment>
      )
    }
    case 'trashBin': {
      if (robotType === OT2_ROBOT_TYPE && showHighlight) {
        return <FixedTrash highlight />
      } else {
        return (
          <Fragment key={`fixtureRender_${fixture}`}>
            <SingleSlotFixture
              cutoutId={cutout}
              deckDefinition={deckDef}
              slotClipColor={COLORS.transparent}
              fixtureBaseColor={lightFill}
            />
            <FlexTrash
              robotType={robotType}
              trashIconColor={lightFill}
              trashCutoutId={cutout as TrashCutoutId}
              backgroundColor={COLORS.grey50}
              showHighlight={showHighlight}
              tagInfo={tagInfo}
            />
          </Fragment>
        )
      }
    }
    case 'wasteChute': {
      return (
        <WasteChuteFixture
          key={`fixtureRender_${fixture}`}
          cutoutId={cutout as typeof WASTE_CHUTE_CUTOUT}
          deckDefinition={deckDef}
          fixtureBaseColor={lightFill}
          showHighlight={showHighlight}
          tagInfo={tagInfo}
        />
      )
    }
    case 'wasteChuteAndStagingArea': {
      return (
        <Fragment
          key={`fixtureRender_${fixture}_${
            adjacentLabwares.length > 0 ? adjacentLabwares[0]?.id : 0
          }`}
        >
          <WasteChuteStagingAreaFixture
            cutoutId={cutout as typeof WASTE_CHUTE_CUTOUT}
            deckDefinition={deckDef}
            fixtureBaseColor={lightFill}
            showHighlight={showHighlight}
            tagInfo={tagInfo}
          />
          {renderLabwareOnDeck()}
        </Fragment>
      )
    }
  }
}
