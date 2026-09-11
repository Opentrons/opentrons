import { useEffect } from 'react'
import { css } from 'styled-components'

import {
  BaseDeck,
  Box,
  CenterLabwareInModuleChildSlot,
  CenterLabwareInSlot,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  JUSTIFY_FLEX_END,
  RobotCoordsForeignDiv,
  useDeckLocationSelect,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getLabwareViewBox,
  getModuleDef,
  getModuleType,
} from '@opentrons/shared-data'

import type { ComponentProps } from 'react'
import type {
  LabwareDefinition,
  LabwareLocation,
  ModuleLocation,
  RobotType,
} from '@opentrons/shared-data'

export type MapKind = 'intervention' | 'deck-config'

export interface InterventionStyleDeckMapContentProps extends Pick<
  ComponentProps<typeof BaseDeck>,
  'deckConfig' | 'robotType' | 'labwareOnDeck' | 'modulesOnDeck'
> {
  kind: 'intervention'
  highlightLabwareEventuallyIn: string[]
}

export interface DeckConfigStyleDeckMapContentProps {
  kind: 'deck-config'
  robotType: RobotType
  setSelectedLocation: (location: ModuleLocation) => void
}

export type DeckMapContentProps =
  DeckConfigStyleDeckMapContentProps | InterventionStyleDeckMapContentProps

export const DeckMapContent: (
  props: DeckMapContentProps
) => JSX.Element = props =>
  props.kind === 'intervention' ? (
    <InterventionStyleDeckMapContent {...props} />
  ) : (
    <DeckConfigStyleDeckMapContent {...props} />
  )

function InterventionStyleDeckMapContent(
  props: InterventionStyleDeckMapContentProps
): JSX.Element {
  const deckDef = getDeckDefFromRobotType(props.robotType)

  const labwareWithHighlights =
    props.labwareOnDeck?.map(labwareOnDeck => {
      const found = props.highlightLabwareEventuallyIn.some(locationToMatch =>
        getIsLabwareMatch(labwareOnDeck.labwareLocation, locationToMatch)
      )
      return found
        ? {
            ...labwareOnDeck,
            labwareChildren: (
              <CenterLabwareInSlot definition={labwareOnDeck.definition}>
                {/*
                LabwareHighlight is a valid "labware" in CenterLabwareInSlot because it
                sizes and positions itself exactly like the underlying labware definition would.
                */}
                <LabwareHighlight
                  highlight={true}
                  definition={labwareOnDeck.definition}
                />
              </CenterLabwareInSlot>
            ),
          }
        : labwareOnDeck
    }) ?? []

  const modulesWithHighlights =
    props.modulesOnDeck?.map(module => {
      const found = props.highlightLabwareEventuallyIn.some(locationToMatch => {
        const moduleType = getModuleType(module.moduleModel)
        return (
          moduleType !== FLEX_STACKER_MODULE_TYPE &&
          getIsLabwareMatch(module.moduleLocation, locationToMatch)
        )
      })
      return found
        ? {
            ...module,
            moduleChildren:
              module?.nestedLabwareDefsBottomToTop.length > 0 ? (
                <CenterLabwareInModuleChildSlot
                  deckId={deckDef.otId}
                  slotId={module.moduleLocation.slotName}
                  moduleDefinition={getModuleDef(module.moduleModel)}
                  labwareDefinition={
                    module.nestedLabwareDefsBottomToTop[
                      module.nestedLabwareDefsBottomToTop.length - 1
                    ]
                  }
                >
                  {/*
                  LabwareHighlight is a valid "labware" in CenterLabwareInModuleChildSlot because it
                  sizes and positions itself exactly like the underlying labware definition would.
                  */}
                  <LabwareHighlight
                    highlight={true}
                    definition={
                      module.nestedLabwareDefsBottomToTop[
                        module.nestedLabwareDefsBottomToTop.length - 1
                      ]
                    }
                  />
                </CenterLabwareInModuleChildSlot>
              ) : undefined,
          }
        : module
    }) ?? []

  return (
    <BaseDeck
      deckConfig={props.deckConfig}
      robotType={props.robotType}
      labwareOnDeck={labwareWithHighlights}
      modulesOnDeck={modulesWithHighlights}
    />
  )
}

function DeckConfigStyleDeckMapContent({
  robotType,
  setSelectedLocation,
}: DeckConfigStyleDeckMapContentProps): JSX.Element {
  const { DeckLocationSelect, selectedLocation } = useDeckLocationSelect(
    robotType,
    'default'
  )
  useEffect(() => {
    setSelectedLocation != null && setSelectedLocation(selectedLocation)
  }, [selectedLocation, setSelectedLocation])
  return <>{DeckLocationSelect}</>
}

function LabwareHighlight({
  highlight,
  definition,
}: {
  highlight: boolean
  definition: LabwareDefinition
}): JSX.Element {
  // Size and position ourselves exactly like the underlying labware.
  const { minX, minY, xDimension, yDimension } = getLabwareViewBox(definition)

  return (
    <RobotCoordsForeignDiv
      x={minX}
      y={minY}
      width={xDimension}
      height={yDimension}
      innerDivProps={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        justifyContent: JUSTIFY_FLEX_END,
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        width="100%"
        height="100%"
        css={highlight ? HIGHLIGHT_STYLE : undefined}
      />
    </RobotCoordsForeignDiv>
  )
}

const HIGHLIGHT_STYLE = css`
  border-radius: 7.04px;
  border: 3px solid ${COLORS.blue50};
  box-shadow: 0 0 4px 3px #74b0ff;
`

export function getIsLabwareMatch(
  locationToCheck: LabwareLocation | ModuleLocation,
  deckRootLocation: string
): boolean {
  if (typeof locationToCheck === 'string') {
    // This is the "off deck" case, which we do not render (and therefore return false).
    return false
  } else if ('slotName' in locationToCheck) {
    // This is if we're checking a module or a labware loaded on a slot
    return locationToCheck.slotName === deckRootLocation
  } else if ('addressableAreaName' in locationToCheck) {
    // This is if we're loaded on an AA like a staging slot
    return locationToCheck.addressableAreaName === deckRootLocation
  } else {
    // Defaulted cases:
    // if ('moduleId' in locationToCheck), e.g. on a module:
    // this should never happen because labware that is loaded on a module wouldn't be
    // in onDeckLabware, and onDeckModules is for modules not labware.
    // if ('labwareId' in locationToCheck), e.g. stacked labware:
    // this should never happen because we don't really render it properly here
    return false
  }
}
