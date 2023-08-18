import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  ALIGN_CENTER,
  Icon,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  BORDERS,
  Box,
  MoveLabwareOnDeck,
  Module,
  LabwareRender,
  LocationIcon,
  DISPLAY_NONE,
  RESPONSIVENESS,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'

import {
  getRunLabwareRenderInfo,
  getRunModuleRenderInfo,
  getLabwareNameFromRunData,
  getModuleModelFromRunData,
  getModuleDisplayLocationFromRunData,
} from './utils'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'

import {
  CompletedProtocolAnalysis,
  LabwareLocation,
  MoveLabwareRunTimeCommand,
  RobotType,
  getDeckDefFromRobotType,
  getLoadedLabwareDefinitionsByUri,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  getRobotTypeFromLoadedLabware,
} from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'
import { getLoadedLabware } from '../CommandText/utils/accessors'

const LABWARE_DESCRIPTION_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  padding: ${SPACING.spacing16};
  background-color: ${COLORS.fundamentalsBackground};
  border-radius: ${BORDERS.radiusSoftCorners};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${COLORS.light1};
    border-radius: ${BORDERS.borderRadiusSize3};
  }
`

const LABWARE_NAME_TITLE_STYLE = css`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    display: ${DISPLAY_NONE};
  }
`

const LABWARE_NAME_STYLE = css`
  color: ${COLORS.errorDisabled};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.bodyTextBold}
    color: ${COLORS.darkBlack100};
  }
`

const DIVIDER_STYLE = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    display: ${DISPLAY_NONE};
  }
`

const LABWARE_DIRECTION_STYLE = css`
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing4};
  text-transform: ${TEXT_TRANSFORM_UPPERCASE};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing8};
  }
`

const ICON_STYLE = css`
  height: 1.5rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 2.5rem;
  }
`

export interface MoveLabwareInterventionProps {
  command: MoveLabwareRunTimeCommand
  analysis: CompletedProtocolAnalysis | null
  run: RunData
  isOnDevice: boolean
}

export function MoveLabwareInterventionContent({
  command,
  analysis,
  run,
  isOnDevice,
}: MoveLabwareInterventionProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'protocol_command_text'])

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)
  const robotType = getRobotTypeFromLoadedLabware(run.labware)
  const deckDef = getDeckDefFromRobotType(robotType)

  const moduleRenderInfo = getRunModuleRenderInfo(
    run,
    deckDef,
    labwareDefsByUri
  )
  const labwareRenderInfo = getRunLabwareRenderInfo(
    run,
    labwareDefsByUri,
    deckDef
  )
  const oldLabwareLocation =
    getLoadedLabware(run, command.params.labwareId)?.location ?? null

  const labwareName = getLabwareNameFromRunData(
    run,
    command.params.labwareId,
    analysisCommands
  )
  const movedLabwareDefUri = run.labware.find(
    l => l.id === command.params.labwareId
  )?.definitionUri
  const movedLabwareDef =
    movedLabwareDefUri != null
      ? labwareDefsByUri?.[movedLabwareDefUri] ?? null
      : null

  if (oldLabwareLocation == null || movedLabwareDef == null) return null
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <Flex gridGap={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          width="50%"
        >
          <Flex css={LABWARE_DESCRIPTION_STYLE}>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="h2" css={LABWARE_NAME_TITLE_STYLE}>
                {t('labware_name')}
              </StyledText>
              <StyledText as="p" css={LABWARE_NAME_STYLE}>
                {labwareName}
              </StyledText>
            </Flex>
            <Divider css={DIVIDER_STYLE} />
            <Flex css={LABWARE_DIRECTION_STYLE}>
              <LabwareDisplayLocation
                protocolData={run}
                location={oldLabwareLocation}
                robotType={robotType}
              />

              <Icon name="arrow-right" css={ICON_STYLE} />
              <LabwareDisplayLocation
                protocolData={run}
                location={command.params.newLocation}
                robotType={robotType}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex width="50%">
          <Box margin="0 auto" width="100%">
            <MoveLabwareOnDeck
              key={command.id} // important so that back to back move labware commands bust the cache
              robotType={robotType}
              deckFill={isOnDevice ? COLORS.light1 : '#e6e6e6'}
              initialLabwareLocation={oldLabwareLocation}
              finalLabwareLocation={command.params.newLocation}
              movedLabwareDef={movedLabwareDef}
              loadedModules={run.modules}
              // TODO(bh, 2023-07-19): read trash slot name from protocol
              trashSlotName={robotType === 'OT-3 Standard' ? 'A3' : undefined}
              backgroundItems={
                <>
                  {moduleRenderInfo.map(
                    ({ x, y, moduleId, moduleDef, nestedLabwareDef }) => (
                      <Module key={moduleId} def={moduleDef} x={x} y={y}>
                        {nestedLabwareDef != null ? (
                          <LabwareRender definition={nestedLabwareDef} />
                        ) : null}
                      </Module>
                    )
                  )}
                  {labwareRenderInfo
                    .filter(l => l.labwareId !== command.params.labwareId)
                    .map(({ x, y, labwareDef, labwareId }) => (
                      <g key={labwareId} transform={`translate(${x},${y})`}>
                        <LabwareRender definition={labwareDef} />
                      </g>
                    ))}
                </>
              }
            />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}

interface LabwareDisplayLocationProps {
  protocolData: RunData
  location: LabwareLocation
  robotType: RobotType
}
function LabwareDisplayLocation(
  props: LabwareDisplayLocationProps
): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const { protocolData, location, robotType } = props
  let displayLocation: React.ReactNode = ''
  if (location === 'offDeck') {
    // typecheck thinks t() can return undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    displayLocation = <LocationIcon slotName={t('offdeck') as string} />
  } else if ('slotName' in location) {
    displayLocation = <LocationIcon slotName={location.slotName} />
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModelFromRunData(
      protocolData,
      location.moduleId
    )
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
    } else {
      displayLocation = t('module_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          robotType
        ),
        module: getModuleDisplayName(moduleModel),
        slot_name: getModuleDisplayLocationFromRunData(
          protocolData,
          location.moduleId
        ),
      })
    }
  } else {
    console.warn('display location could not be established: ', location)
  }
  return <>{displayLocation}</>
}
