import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import map from 'lodash/map'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_EVENLY,
  LabwareRender,
  LocationIcon,
  Module,
  MODULE_ICON_NAME_BY_TYPE,
  RobotWorkSpace,
  SlotLabels,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getLabwareDefURI,
  getLabwareDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  inferModuleOrientationFromXCoordinate,
  LoadLabwareRunTimeCommand,
  RunTimeCommand,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import {
  useCreateLiveCommandMutation,
  useModulesQuery,
} from '@opentrons/react-api-client'

import { FloatingActionButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { ODDBackButton } from '../../molecules/ODDBackButton'
import { Portal } from '../../App/portal'
import { Modal } from '../../molecules/Modal'

import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getLabwareSetupItemGroups } from '../../pages/Protocols/utils'
import { getProtocolModulesInfo } from '../Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { getAttachedProtocolModuleMatches } from '../ProtocolSetupModules/utils'
import { getLabwareRenderInfo } from '../Devices/ProtocolRun/utils/getLabwareRenderInfo'

import type { UseQueryResult } from 'react-query'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  LabwareDefinition2,
  LabwareLocation,
} from '@opentrons/shared-data'
import { parseInitialLoadedLabwareByAdapter } from '@opentrons/api-client'
import type { LabwareSetupItem } from '../../pages/Protocols/utils'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'
import type { AttachedProtocolModuleMatch } from '../ProtocolSetupModules/utils'
import type { HeaterShakerModule, Modules } from '@opentrons/api-client'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

const OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'DECK_BASE',
  'BARCODE_COVERS',
  'SLOT_SCREWS',
  'SLOT_10_EXPANSION',
  'CALIBRATION_CUTOUTS',
]

const MODULE_REFETCH_INTERVAL = 5000

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
  const [showDeckMapModal, setShowDeckMapModal] = React.useState<boolean>(false)
  const [
    showLabwareDetailsModal,
    setShowLabwareDetailsModal,
  ] = React.useState<boolean>(false)
  const [selectedLabware, setSelectedLabware] = React.useState<
    | (LabwareDefinition2 & {
      location: LabwareLocation
      nickName: string | null
    })
    | null
  >(null)

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(
    mostRecentAnalysis?.commands ?? []
  )
  const labwareRenderInfo =
    mostRecentAnalysis != null
      ? getLabwareRenderInfo(mostRecentAnalysis, deckDef)
      : {}
  console.log(labwareRenderInfo)
  const moduleQuery = useModulesQuery({
    refetchInterval: MODULE_REFETCH_INTERVAL,
  })
  const attachedModules = moduleQuery?.data?.data ?? []
  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []
  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    mostRecentAnalysis?.commands ?? []
  )

  const handleLabwareClick = (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ): void => {
    const foundLabware = mostRecentAnalysis?.labware.find(
      labware => labware.id === labwareId
    )
    if (foundLabware != null) {
      const nickName = onDeckItems.find(
        item => getLabwareDefURI(item.definition) === foundLabware.definitionUri
      )?.nickName
      setSelectedLabware({
        ...labwareDef,
        location: foundLabware.location,
        nickName: nickName ?? null,
      })
      setShowLabwareDetailsModal(true)
    }
  }

  let location: JSX.Element | string | null = null
  if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'slotName' in selectedLabware?.location
  ) {
    location = <LocationIcon slotName={selectedLabware?.location.slotName} />
  } else if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'moduleId' in selectedLabware?.location
  ) {
    const matchedModule = attachedProtocolModuleMatches.find(
      module =>
        typeof selectedLabware.location === 'object' &&
        'moduleId' in selectedLabware?.location &&
        module.moduleId === selectedLabware.location.moduleId
    )
    if (matchedModule != null) {
      location = (
        <>
          <LocationIcon slotName={matchedModule?.slotName} />
          <LocationIcon
            iconName={
              MODULE_ICON_NAME_BY_TYPE[matchedModule?.moduleDef.moduleType]
            }
          />
        </>
      )
    }
  } else if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'labwareId' in selectedLabware?.location
  ) {
    //  TODO(jr, 8/14/23): add adapter location icon when we have one
    const adapterId = selectedLabware.location.labwareId
    const adapterLocation = mostRecentAnalysis?.commands.find(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware' &&
        command.result?.labwareId === adapterId
    )?.params.location
    if (adapterLocation != null && adapterLocation !== 'offDeck') {
      if ('slotName' in adapterLocation) {
        location = <LocationIcon slotName={adapterLocation.slotName} />
      } else if ('moduleId' in adapterLocation) {
        const moduleUnderAdapter = attachedProtocolModuleMatches.find(
          module => module.moduleId === adapterLocation.moduleId
        )
        if (moduleUnderAdapter != null) {
          location = (
            <>
              <LocationIcon slotName={moduleUnderAdapter.slotName} />
              <LocationIcon
                iconName={
                  MODULE_ICON_NAME_BY_TYPE[
                  moduleUnderAdapter.moduleDef.moduleType
                  ]
                }
              />
            </>
          )
        }
      }
    }
  }

  const modalHeader: ModalHeaderBaseProps = {
    title: t('map_view'),
    hasExitIcon: true,
  }

  const selectedLabwareLocation = selectedLabware?.location
  return (
    <>
      <Portal level="top">
        {showDeckMapModal ? (
          <Modal
            header={modalHeader}
            modalSize="large"
            onOutsideClick={() => setShowDeckMapModal(false)}
          >
            <RobotWorkSpace
              deckDef={deckDef}
              deckLayerBlocklist={OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
              deckFill={COLORS.light1}
              trashSlotName="A3"
              id="LabwareSetup_deckMap"
              trashColor={COLORS.darkGreyEnabled}
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
                      moduleId,
                    }) => {
                      const labwareInAdapterInMod =
                        nestedLabwareId != null
                          ? initialLoadedLabwareByAdapter[nestedLabwareId]
                          : null
                      //  only rendering the labware on top most layer so
                      //  either the adapter or the labware are rendered but not both
                      const topLabwareDefinition =
                        labwareInAdapterInMod?.result?.definition ??
                        nestedLabwareDef
                      const topLabwareId =
                        labwareInAdapterInMod?.result?.labwareId ??
                        nestedLabwareId

                      return (
                        <Module
                          key={`LabwareSetup_Module_${moduleId}_${x}${y}`}
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
                          {topLabwareDefinition != null &&
                            topLabwareId != null ? (
                            <React.Fragment
                              key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}
                            >
                              <LabwareRender
                                definition={topLabwareDefinition}
                                onLabwareClick={() =>
                                  handleLabwareClick(
                                    topLabwareDefinition,
                                    topLabwareId
                                  )
                                }
                              />
                            </React.Fragment>
                          ) : null}
                        </Module>
                      )
                    }
                  )}
                  {map(labwareRenderInfo, ({ x, y, labwareDef }, labwareId) => {
                    const labwareInAdapter =
                      initialLoadedLabwareByAdapter[labwareId]
                    //  only rendering the labware on top most layer so
                    //  either the adapter or the labware are rendered but not both
                    const topLabwareDefinition =
                      labwareInAdapter?.result?.definition ?? labwareDef
                    const topLabwareId =
                      labwareInAdapter?.result?.labwareId ?? labwareId
                    return (
                      <React.Fragment
                        key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}
                      >
                        <g transform={`translate(${x},${y})`}>
                          <LabwareRender
                            definition={topLabwareDefinition}
                            onLabwareClick={() =>
                              handleLabwareClick(
                                topLabwareDefinition,
                                topLabwareId
                              )
                            }
                          />
                        </g>
                      </React.Fragment>
                    )
                  })}
                  <SlotLabels robotType={FLEX_ROBOT_TYPE} />
                </>
              )}
            </RobotWorkSpace>
          </Modal>
        ) : null}
        {showLabwareDetailsModal && selectedLabware != null ? (
          <Modal
            onOutsideClick={() => {
              setShowLabwareDetailsModal(false)
              setSelectedLabware(null)
            }}
          >
            <Flex alignItems={ALIGN_STRETCH} gridGap={SPACING.spacing48}>
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
                gridGap={SPACING.spacing12}
              >
                <Flex gridGap={SPACING.spacing4}>{location}</Flex>
                <StyledText
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  fontSize={TYPOGRAPHY.fontSize22}
                >
                  {getLabwareDisplayName(selectedLabware)}
                </StyledText>
                <StyledText as="p" color={COLORS.darkBlack70}>
                  {selectedLabware.nickName}
                  {
                    selectedLabwareLocation != null
                    && selectedLabwareLocation !== 'offDeck' 
                    && 'labwareId' in selectedLabwareLocation
                      ? t('on_adapter', { 
                        adapterName: mostRecentAnalysis?.labware.find(l => (
                          l.id === selectedLabwareLocation.labwareId
                        ))?.displayName
                      })
                      : null
                  }
                </StyledText>
              </Flex>
            </Flex>
          </Modal>
        ) : null}
      </Portal>
      <ODDBackButton
        label={t('labware')}
        onClick={() => setSetupScreen('prepare to run')}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        marginTop={SPACING.spacing32}
      >
        <Flex
          gridGap={SPACING.spacing8}
          color={COLORS.darkBlack70}
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight28}
        >
          <Flex paddingLeft={SPACING.spacing16} width="10.5625rem">
            <StyledText>{t('location')}</StyledText>
          </Flex>
          <Flex>
            <StyledText>{t('labware_name')}</StyledText>
          </Flex>
        </Flex>
        {[...onDeckItems, ...offDeckItems].map((labware, i) => {
          return mostRecentAnalysis != null ? (
            <RowLabware
              key={i}
              labware={labware}
              attachedProtocolModules={attachedProtocolModuleMatches}
              refetchModules={moduleQuery.refetch}
              commands={mostRecentAnalysis?.commands}
            />
          ) : null
        })}
      </Flex>
      <FloatingActionButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}

const labwareLatchStyles = css`
  &:active {
    background-color: ${COLORS.mediumBluePressed};
  }
`

interface LabwareLatchProps {
  matchedHeaterShaker: HeaterShakerModule
  refetchModules: UseQueryResult<Modules>['refetch']
}

function LabwareLatch({
  matchedHeaterShaker,
  refetchModules,
}: LabwareLatchProps): JSX.Element {
  const { t } = useTranslation(['heater_shaker', 'protocol_setup'])
  const {
    createLiveCommand,
    isLoading: isLiveCommandLoading,
  } = useCreateLiveCommandMutation()
  const [isRefetchingModules, setIsRefetchingModules] = React.useState(false)
  const isLatchLoading =
    isLiveCommandLoading ||
    isRefetchingModules ||
    matchedHeaterShaker.data.labwareLatchStatus === 'opening' ||
    matchedHeaterShaker.data.labwareLatchStatus === 'closing'
  const isLatchClosed =
    matchedHeaterShaker.data.labwareLatchStatus === 'idle_closed' ||
    matchedHeaterShaker.data.labwareLatchStatus === 'opening'

  let icon: 'latch-open' | 'latch-closed' | null = null

  const latchCommand:
    | HeaterShakerOpenLatchCreateCommand
    | HeaterShakerCloseLatchCreateCommand = {
    commandType: isLatchClosed
      ? 'heaterShaker/openLabwareLatch'
      : 'heaterShaker/closeLabwareLatch',
    params: { moduleId: matchedHeaterShaker.id },
  }

  const toggleLatch = (): void => {
    createLiveCommand({
      command: latchCommand,
      waitUntilComplete: true,
    })
      .then(() => {
        setIsRefetchingModules(true)
        refetchModules()
          .then(() => {
            setIsRefetchingModules(false)
          })
          .catch((e: Error) => {
            console.error(
              `error refetching modules after toggle latch: ${e.message}`
            )
            setIsRefetchingModules(false)
          })
      })
      .catch((e: Error) => {
        console.error(
          `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
        )
      })
  }
  const commandType = isLatchClosed
    ? 'heaterShaker/openLabwareLatch'
    : 'heaterShaker/closeLabwareLatch'
  let hsLatchText: string | null = t('open')
  if (commandType === 'heaterShaker/closeLabwareLatch' && isLatchLoading) {
    hsLatchText = t('closing')
    icon = 'latch-open'
  } else if (
    commandType === 'heaterShaker/openLabwareLatch' &&
    isLatchLoading
  ) {
    hsLatchText = t('opening')
    icon = 'latch-closed'
  } else if (
    commandType === 'heaterShaker/closeLabwareLatch' &&
    !isLatchLoading
  ) {
    hsLatchText = t('open')
    icon = 'latch-open'
  } else if (
    commandType === 'heaterShaker/openLabwareLatch' &&
    !isLatchLoading
  ) {
    hsLatchText = t('closed')
    icon = 'latch-closed'
  }

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.mediumBlueEnabled}
      borderRadius={BORDERS.borderRadiusSize3}
      css={labwareLatchStyles}
      color={
        isLatchLoading
          ? `${COLORS.darkBlack100}${COLORS.opacity60HexCode}`
          : COLORS.darkBlackEnabled
      }
      flexDirection={DIRECTION_COLUMN}
      fontSize={TYPOGRAPHY.fontSize22}
      gridGap={SPACING.spacing8}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      lineHeight={TYPOGRAPHY.lineHeight28}
      minWidth="11.0625rem"
      onClick={toggleLatch}
      padding={SPACING.spacing12}
    >
      <StyledText fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('protocol_setup:labware_latch')}
      </StyledText>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        {hsLatchText != null && icon != null ? (
          <>
            <StyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
              {hsLatchText}
            </StyledText>
            <Icon
              name={icon}
              size="2.5rem"
              color={
                commandType === 'heaterShaker/closeLabwareLatch'
                  ? COLORS.blueEnabled
                  : ''
              }
            />
          </>
        ) : null}
      </Flex>
    </Flex>
  )
}

interface RowLabwareProps {
  labware: LabwareSetupItem
  attachedProtocolModules: AttachedProtocolModuleMatch[]
  refetchModules: UseQueryResult<Modules>['refetch']
  commands?: RunTimeCommand[]
}

function RowLabware({
  labware,
  attachedProtocolModules,
  refetchModules,
  commands,
}: RowLabwareProps): JSX.Element | null {
  const { definition, initialLocation, nickName } = labware
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
  const matchingHeaterShaker =
    matchedModule?.attachedModuleMatch != null &&
      matchedModule.attachedModuleMatch.moduleType === HEATERSHAKER_MODULE_TYPE
      ? matchedModule.attachedModuleMatch
      : null

  const moduleInstructions = (
    <StyledText color={COLORS.darkBlack70} as="label">
      {setupTextTranslator('labware_latch_instructions')}
    </StyledText>
  )

  const matchedModuleType = matchedModule?.attachedModuleMatch?.moduleType

  let location: JSX.Element | string | null = null
  if (initialLocation === 'offDeck') {
    location = commandTextTranslator('off_deck')
  } else if ('slotName' in initialLocation) {
    location = <LocationIcon slotName={initialLocation.slotName} />
  } else if (matchedModuleType != null && matchedModule?.slotName != null) {
    location = (
      <>
        <LocationIcon slotName={matchedModule?.slotName} />
        <LocationIcon iconName={MODULE_ICON_NAME_BY_TYPE[matchedModuleType]} />
      </>
    )
  } else if ('labwareId' in initialLocation) {
    //  TODO(jr, 8/14/23): add adapter location icon when we have one
    const adapterId = initialLocation.labwareId
    const adapterLocation = commands?.find(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware' &&
        command.result?.labwareId === adapterId
    )?.params.location

    if (adapterLocation != null && adapterLocation !== 'offDeck') {
      if ('slotName' in adapterLocation) {
        location = <LocationIcon slotName={adapterLocation.slotName} />
      } else if ('moduleId' in adapterLocation) {
        const moduleUnderAdapter = attachedProtocolModules.find(
          module => module.moduleId === adapterLocation.moduleId
        )
        if (moduleUnderAdapter != null) {
          location = (
            <>
              <LocationIcon slotName={moduleUnderAdapter.slotName} />
              <LocationIcon
                iconName={
                  MODULE_ICON_NAME_BY_TYPE[
                  moduleUnderAdapter.moduleDef.moduleType
                  ]
                }
              />
            </>
          )
        }
      }
    }
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.light1}
      borderRadius={BORDERS.borderRadiusSize3}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      gridGap={SPACING.spacing32}
    >
      <Flex gridGap={SPACING.spacing4} width="7.6875rem">
        {location}
      </Flex>
      <Flex
        alignSelf={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing4}
        width="86%"
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_EVENLY}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {getLabwareDisplayName(definition)}
          </StyledText>
          <StyledText color={COLORS.darkBlack70} as="p">
            {nickName}
          </StyledText>
          {matchingHeaterShaker != null ? moduleInstructions : null}
        </Flex>
        {matchingHeaterShaker != null ? (
          <LabwareLatch
            matchedHeaterShaker={matchingHeaterShaker}
            refetchModules={refetchModules}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
