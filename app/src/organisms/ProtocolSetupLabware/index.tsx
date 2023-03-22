import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import map from 'lodash/map'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  Module,
  RobotWorkSpace,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getLabwareDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import {
  useCreateLiveCommandMutation,
  useModulesQuery,
} from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import { BackButton } from '../../atoms/buttons'
import { ContinueButton, DeckMapButton } from '../ProtocolSetupModules' // Probably should move this to atoms/buttons as well
import { Portal } from '../../App/portal'
import { Modal } from '../../molecules/Modal'

import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getLabwareDisplayLocation } from '../CommandText/utils'
import { getLabwareSetupItemGroups } from '../../pages/Protocols/utils'
import { getProtocolModulesInfo } from '../Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { getAttachedProtocolModuleMatches } from '../ProtocolSetupModules/utils'
import { getLabwareRenderInfo } from '../Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { ROBOT_MODEL_OT3 } from '../../redux/discovery'

import type {
  CompletedProtocolAnalysis,
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  LabwareDefinition2,
  LabwareLocation,
} from '@opentrons/shared-data'
import type { LabwareSetupItem } from '../../pages/Protocols/utils'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'
import type { AttachedProtocolModuleMatch } from '../ProtocolSetupModules/utils'
import type { LatchStatus } from '../../redux/modules/api-types'

const OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'DECK_BASE',
  'BARCODE_COVERS',
  'SLOT_SCREWS',
  'SLOT_10_EXPANSION',
  'CALIBRATION_CUTOUTS',
]
const EQUIPMENT_POLL_MS = 2000

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  width: 12rem;
  flex-shrink: 0;
`

export interface ProtocolSetupLabwareProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupLabware({
  runId,
  setSetupScreen,
}: ProtocolSetupLabwareProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const { t: commandTextTranslator } = useTranslation('protocol_command_text')
  const [showDeckMapModal, setShowDeckMapModal] = React.useState<boolean>(false)
  const [
    showLabwareDetailsModal,
    setShowLabwareDetailsModal,
  ] = React.useState<boolean>(false)
  const [selectedLabware, setSelectedLabware] = React.useState<
    (LabwareDefinition2 & { location: LabwareLocation }) | null
  >(null)

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const deckDef = getDeckDefFromRobotType(ROBOT_MODEL_OT3)
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(
    mostRecentAnalysis?.commands ?? []
  )
  const labwareRenderInfo =
    mostRecentAnalysis != null
      ? getLabwareRenderInfo(mostRecentAnalysis, deckDef)
      : {}
  const moduleQuery = useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })
  const attachedModules = moduleQuery?.data?.data ?? []
  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []
  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )

  const handleLabwareClick = (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ): void => {
    const foundLabwareLocation = mostRecentAnalysis?.labware.find(
      labware => labware.id === labwareId
    )?.location
    if (foundLabwareLocation != null) {
      setSelectedLabware({
        ...labwareDef,
        location: foundLabwareLocation,
      })
      setShowLabwareDetailsModal(true)
    }
  }

  return (
    <>
      <Portal level="top">
        {showDeckMapModal ? (
          <Modal
            title={t('map_view')}
            onClose={() => setShowDeckMapModal(false)}
            fullPage
          >
            <RobotWorkSpace
              deckDef={deckDef}
              deckLayerBlocklist={OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
              id="LabwareSetup_deckMap"
            >
              {() => (
                <>
                  {map(
                    attachedProtocolModuleMatches,
                    ({
                      x,
                      y,
                      moduleDef,
                      nestedLabwareDef,
                      nestedLabwareId,
                    }) => (
                      <Module
                        key={`LabwareSetup_Module_${String(
                          moduleDef.model
                        )}_${x}${y}`}
                        x={x}
                        y={y}
                        orientation={inferModuleOrientationFromXCoordinate(x)}
                        def={moduleDef}
                        innerProps={
                          moduleDef.model === THERMOCYCLER_MODULE_V1
                            ? { lidMotorState: 'open' }
                            : {}
                        }
                      >
                        {nestedLabwareDef != null && nestedLabwareId != null ? (
                          <React.Fragment
                            key={`LabwareSetup_Labware_${String(
                              nestedLabwareDef.metadata.displayName
                            )}_${x}${y}`}
                          >
                            <LabwareRender
                              definition={nestedLabwareDef}
                              onLabwareClick={() =>
                                handleLabwareClick(
                                  nestedLabwareDef,
                                  nestedLabwareId
                                )
                              }
                            />
                          </React.Fragment>
                        ) : null}
                      </Module>
                    )
                  )}
                  {map(labwareRenderInfo, ({ x, y, labwareDef }, labwareId) => {
                    return (
                      <React.Fragment
                        key={`LabwareSetup_Labware_${String(
                          labwareDef.metadata.displayName
                        )}_${x}${y}`}
                      >
                        <g transform={`translate(${x},${y})`}>
                          <LabwareRender
                            definition={labwareDef}
                            onLabwareClick={() =>
                              handleLabwareClick(labwareDef, labwareId)
                            }
                          />
                        </g>
                      </React.Fragment>
                    )
                  })}
                </>
              )}
            </RobotWorkSpace>
          </Modal>
        ) : null}
        {showLabwareDetailsModal && selectedLabware != null ? (
          <Modal
            onClose={() => {
              setShowLabwareDetailsModal(false)
              setSelectedLabware(null)
            }}
            minHeight="14.375rem"
            minWidth="43.1875rem"
          >
            <Flex alignItems={ALIGN_STRETCH} gridGap={SPACING.spacing7}>
              <LabwareThumbnail
                viewBox={` 0 0 ${String(
                  selectedLabware.dimensions.xDimension
                )} ${String(selectedLabware.dimensions.yDimension)}`}
              >
                <LabwareRender definition={selectedLabware} />
              </LabwareThumbnail>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                alignItems={ALIGN_FLEX_START}
                gridGap={SPACING.spacing4}
              >
                <StyledText>
                  {mostRecentAnalysis != null
                    ? getLabwareDisplayLocation(
                        mostRecentAnalysis,
                        selectedLabware.location,
                        commandTextTranslator
                      )
                    : null}
                </StyledText>
                <StyledText
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  fontSize="1.5rem"
                >
                  {getLabwareDisplayName(selectedLabware)}
                </StyledText>
              </Flex>
            </Flex>
          </Modal>
        ) : null}
      </Portal>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <BackButton onClick={() => setSetupScreen('prepare to run')}>
          {t('labware')}
        </BackButton>
        <Flex gridGap={SPACING.spacingXXL}>
          <ContinueButton onClick={() => setSetupScreen('lpc')} />
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        marginTop={SPACING.spacing6}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex paddingLeft={SPACING.spacing5} width="16%">
            <StyledText>{'Location'}</StyledText>
          </Flex>
          <Flex width="84%">
            <StyledText>{'Labware Name'}</StyledText>
          </Flex>
        </Flex>
        {[...onDeckItems, ...offDeckItems].map((labware, i) => {
          return mostRecentAnalysis != null ? (
            <RowLabware
              key={i}
              labware={labware}
              robotSideAnalysis={mostRecentAnalysis}
              attachedProtocolModules={attachedProtocolModuleMatches}
              refetchModules={moduleQuery.refetch}
            />
          ) : null
        })}
      </Flex>
      <DeckMapButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}

interface LabwareLatchProps {
  toggleLatch: () => void
  latchStatus: LatchStatus
}

function LabwareLatch({
  toggleLatch,
  latchStatus,
}: LabwareLatchProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'heater_shaker'])
  let icon: 'latch-open' | 'latch-closed' | null = null
  let statusText: string | null = null
  switch (latchStatus) {
    case 'idle_open':
      icon = 'latch-open'
      statusText = 'heater_shaker:open'
      break
    case 'idle_closed':
      icon = 'latch-closed'
      statusText = 'heater_shaker:closed'
      break
    case 'opening':
      icon = 'latch-closed'
      statusText = 'heater_shaker:opening'
      break
    case 'closing':
      icon = 'latch-open'
      statusText = 'heater_shaker:closing'
      break
    default:
      icon = 'latch-open'
      statusText = 'heater_shaker:open'
      break
  }

  return (
    <Flex
      minWidth="11.4375rem"
      height="7rem"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_FLEX_START}
      padding={SPACING.spacing4}
      gridGap="0.75rem"
      backgroundColor={COLORS.foundationalBlue}
      color={
        latchStatus === 'opening' || latchStatus === 'closing'
          ? `${COLORS.darkBlack_hundred}${COLORS.opacity60HexCode}`
          : COLORS.darkBlackEnabled
      }
      borderRadius={BORDERS.size_three}
      onClick={toggleLatch}
    >
      <StyledText
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        fontSize="1.375rem"
      >
        {t('labware_latch')}
      </StyledText>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        {statusText != null && icon != null ? (
          <>
            <StyledText
              fontSize="1.375rem"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
            >
              {t(statusText)}
            </StyledText>
            <Icon
              name={icon}
              size="2.5rem"
              color={latchStatus === 'idle_open' ? COLORS.blueEnabled : ''}
            />
          </>
        ) : null}
      </Flex>
    </Flex>
  )
}

interface RowLabwareProps {
  labware: LabwareSetupItem
  robotSideAnalysis: CompletedProtocolAnalysis
  attachedProtocolModules: AttachedProtocolModuleMatch[]
  refetchModules: () => void
}

function RowLabware({
  labware,
  robotSideAnalysis,
  attachedProtocolModules,
  refetchModules,
}: RowLabwareProps): JSX.Element | null {
  const { definition, initialLocation, nickName } = labware
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { t: commandTextTranslator } = useTranslation('protocol_command_text')
  const { t: setupTextTranslator } = useTranslation('protocol_setup')
  const matchedModule =
    initialLocation !== 'offDeck' &&
    'moduleId' in initialLocation &&
    attachedProtocolModules.length > 0
      ? attachedProtocolModules.find(
          mod => mod.moduleId === initialLocation.moduleId
        )
      : null
  const moduleInstructions = (
    <StyledText color={COLORS.darkBlack_seventy}>
      {setupTextTranslator('labware_latch_instructions')}
    </StyledText>
  )

  let latchCommand:
    | HeaterShakerCloseLatchCreateCommand
    | HeaterShakerOpenLatchCreateCommand
  let latchStatus: LatchStatus = 'unknown'
  if (
    matchedModule != null &&
    matchedModule.attachedModuleMatch != null &&
    matchedModule.attachedModuleMatch.moduleType === HEATERSHAKER_MODULE_TYPE
  ) {
    latchStatus = matchedModule.attachedModuleMatch.data.labwareLatchStatus
    latchCommand = {
      commandType:
        latchStatus === 'idle_closed' || latchStatus === 'closing'
          ? 'heaterShaker/openLabwareLatch'
          : 'heaterShaker/closeLabwareLatch',
      params: { moduleId: matchedModule.attachedModuleMatch.id },
    }
  }

  const toggleLatch = (): void => {
    createLiveCommand({
      command: latchCommand,
    })
      .then(() => {
        refetchModules()
      })
      .catch((e: Error) => {
        console.error(
          `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
        )
      })
  }

  const isOnHeaterShaker =
    matchedModule != null &&
    matchedModule.attachedModuleMatch?.moduleType === HEATERSHAKER_MODULE_TYPE

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.light_one}
      borderRadius={BORDERS.size_four}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing4} ${SPACING.spacing5}`}
      gridGap={SPACING.spacing6}
    >
      <Flex minWidth="10%">
        <StyledText>
          {getLabwareDisplayLocation(
            robotSideAnalysis,
            initialLocation,
            commandTextTranslator
          )}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        width="86%"
        gridGap={SPACING.spacing2}
        alignSelf={ALIGN_FLEX_START}
      >
        <StyledText fontSize="1.5rem" fontWeight="500">
          {getLabwareDisplayName(definition)}
        </StyledText>
        <StyledText color={COLORS.darkBlack_seventy}>{nickName}</StyledText>
        {isOnHeaterShaker ? moduleInstructions : null}
      </Flex>
      {isOnHeaterShaker ? (
        <LabwareLatch toggleLatch={toggleLatch} latchStatus={latchStatus} />
      ) : null}
    </Flex>
  )
}
