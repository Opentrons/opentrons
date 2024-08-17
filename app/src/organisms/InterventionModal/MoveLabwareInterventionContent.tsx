import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  DISPLAY_NONE,
  Flex,
  Icon,
  LabwareRender,
  Module,
  MoveLabwareOnDeck,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TEXT_TRANSFORM_UPPERCASE,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  OT2_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
} from '@opentrons/shared-data'

import {
  getRunLabwareRenderInfo,
  getRunModuleRenderInfo,
  getLabwareNameFromRunData,
  getModuleModelFromRunData,
  getModuleDisplayLocationFromRunData,
} from './utils'
import { Divider } from '../../atoms/structure'
import {
  getLoadedLabware,
  getLoadedModule,
} from '../../molecules/Command/utils/accessors'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinitionsByUri,
  LabwareLocation,
  MoveLabwareRunTimeCommand,
  RobotType,
} from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'

const LABWARE_DESCRIPTION_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  padding: ${SPACING.spacing16};
  background-color: ${COLORS.grey20};
  border-radius: ${BORDERS.borderRadius4};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    background-color: ${COLORS.grey35};
    border-radius: ${BORDERS.borderRadius8};
  }
`

const LABWARE_NAME_TITLE_STYLE = css`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    display: ${DISPLAY_NONE};
  }
`

const LABWARE_NAME_STYLE = css`
  color: ${COLORS.grey60};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    ${TYPOGRAPHY.bodyTextBold}
    color: ${COLORS.black90};
  }
`

const DIVIDER_STYLE = css`
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    display: ${DISPLAY_NONE};
  }
`

const LABWARE_DIRECTION_STYLE = css`
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing4};
  text-transform: ${TEXT_TRANSFORM_UPPERCASE};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    grid-gap: ${SPACING.spacing8};
  }
`

const ICON_STYLE = css`
  height: 1.5rem;
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    height: 2.5rem;
  }
`

export interface MoveLabwareInterventionProps {
  command: MoveLabwareRunTimeCommand
  analysis: CompletedProtocolAnalysis | null
  run: RunData
  robotType: RobotType
  isOnDevice: boolean
}

export function MoveLabwareInterventionContent({
  command,
  analysis,
  run,
  robotType,
  isOnDevice,
}: MoveLabwareInterventionProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'protocol_command_text'])

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)
  const deckDef = getDeckDefFromRobotType(robotType)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

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
              <LegacyStyledText as="h2" css={LABWARE_NAME_TITLE_STYLE}>
                {t('labware_name')}
              </LegacyStyledText>
              <LegacyStyledText as="p" css={LABWARE_NAME_STYLE}>
                {labwareName}
              </LegacyStyledText>
            </Flex>
            <Divider css={DIVIDER_STYLE} />
            <Flex css={LABWARE_DIRECTION_STYLE}>
              <LabwareDisplayLocation
                protocolData={run}
                location={oldLabwareLocation}
                robotType={robotType}
                labwareDefsByUri={labwareDefsByUri}
              />

              <Icon name="arrow-right" css={ICON_STYLE} />
              <LabwareDisplayLocation
                protocolData={run}
                location={command.params.newLocation}
                robotType={robotType}
                labwareDefsByUri={labwareDefsByUri}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex width="50%">
          <Box margin="0 auto" width="100%">
            <MoveLabwareOnDeck
              key={command.id} // important so that back to back move labware commands bust the cache
              robotType={robotType}
              deckFill={isOnDevice ? COLORS.grey35 : '#e6e6e6'}
              initialLabwareLocation={oldLabwareLocation}
              finalLabwareLocation={command.params.newLocation}
              movedLabwareDef={movedLabwareDef}
              loadedModules={run.modules}
              loadedLabware={run.labware}
              deckConfig={deckConfig}
              backgroundItems={
                <>
                  {moduleRenderInfo.map(
                    ({
                      x,
                      y,
                      moduleId,
                      moduleDef,
                      nestedLabwareDef,
                      nestedLabwareId,
                    }) => (
                      <Module key={moduleId} def={moduleDef} x={x} y={y}>
                        {nestedLabwareDef != null &&
                        nestedLabwareId !== command.params.labwareId ? (
                          <LabwareRender definition={nestedLabwareDef} />
                        ) : null}
                      </Module>
                    )
                  )}
                  {labwareRenderInfo
                    .filter(l => l.labwareId !== command.params.labwareId)
                    .map(({ x, y, labwareDef, labwareId }) => (
                      <g key={labwareId} transform={`translate(${x},${y})`}>
                        {labwareDef != null &&
                        labwareId !== command.params.labwareId ? (
                          <LabwareRender definition={labwareDef} />
                        ) : null}
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
  labwareDefsByUri: LabwareDefinitionsByUri
}
function LabwareDisplayLocation(
  props: LabwareDisplayLocationProps
): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const { protocolData, location, robotType, labwareDefsByUri } = props
  let displayLocation: React.ReactNode = ''
  if (location === 'offDeck') {
    // TODO(BC, 08/28/23): remove this string cast after update i18next to >23 (see https://www.i18next.com/overview/typescript#argument-of-type-defaulttfuncreturn-is-not-assignable-to-parameter-of-type-xyz)
    displayLocation = <DeckInfoLabel deckLabel={String(t('offdeck'))} />
  } else if ('slotName' in location) {
    displayLocation = <DeckInfoLabel deckLabel={location.slotName} />
  } else if ('addressableAreaName' in location) {
    displayLocation = <DeckInfoLabel deckLabel={location.addressableAreaName} />
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
  } else if ('labwareId' in location) {
    const adapter = protocolData.labware.find(
      lw => lw.id === location.labwareId
    )
    const adapterDef =
      adapter != null ? labwareDefsByUri[adapter.definitionUri] : null
    const adapterDisplayName =
      adapterDef != null ? getLabwareDisplayName(adapterDef) : ''

    if (adapter == null) {
      console.warn('labware is located on an unknown adapter')
    } else if (adapter.location === 'offDeck') {
      displayLocation = t('off_deck')
    } else if ('slotName' in adapter.location) {
      displayLocation = t('adapter_in_slot', {
        adapter: adapterDisplayName,
        slot_name: adapter.location.slotName,
      })
    } else if ('addressableAreaName' in adapter.location) {
      return t('adapter_in_slot', {
        adapter: adapterDisplayName,
        slot: adapter.location.addressableAreaName,
      })
    } else if ('moduleId' in adapter.location) {
      const moduleIdUnderAdapter = adapter.location.moduleId
      const moduleModel = protocolData.modules.find(
        module => module.id === moduleIdUnderAdapter
      )?.model
      if (moduleModel == null) {
        console.warn('labware is located on an adapter on an unknown module')
      } else {
        const slotName =
          getLoadedModule(protocolData, adapter.location.moduleId)?.location
            ?.slotName ?? ''
        displayLocation = t('adapter_in_module_in_slot', {
          count: getOccludedSlotCountForModule(
            getModuleType(moduleModel),
            robotType ?? OT2_ROBOT_TYPE
          ),
          module: getModuleDisplayName(moduleModel),
          adapter: adapterDisplayName,
          slot_name: slotName,
        })
      }
    } else {
      console.warn('display location could not be established: ', location)
    }
  }
  return <>{displayLocation}</>
}
