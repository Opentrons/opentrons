import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  Box,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_EVENLY,
  MODULE_ICON_NAME_BY_TYPE,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  Chip,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  parseInitialLoadedLabwareByAdapter,
} from '@opentrons/shared-data'
import {
  useCreateLiveCommandMutation,
  useModulesQuery,
} from '@opentrons/react-api-client'

import { FloatingActionButton, SmallButton } from '/app/atoms/buttons'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import {
  getLabwareSetupItemGroups,
  getNestedLabwareInfo,
} from '/app/transformations/commands'
import { getProtocolModulesInfo } from '/app/transformations/analysis'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { LabwareStackModal } from '../../../Devices/ProtocolRun/SetupLabware/LabwareStackModal'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getAttachedProtocolModuleMatches } from '../ProtocolSetupModulesAndDeck/utils'
import { LabwareMapView } from './LabwareMapView'
import { SingleLabwareModal } from './SingleLabwareModal'

import type { UseQueryResult } from 'react-query'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  LabwareDefinition2,
  LabwareLocation,
  LoadLabwareRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { HeaterShakerModule, Modules } from '@opentrons/api-client'
import type {
  LabwareSetupItem,
  NestedLabwareInfo,
} from '/app/transformations/commands'
import type { SetupScreens } from '../types'
import type { AttachedProtocolModuleMatch } from '../ProtocolSetupModulesAndDeck/utils'

const MODULE_REFETCH_INTERVAL_MS = 5000
const DECK_CONFIG_POLL_MS = 5000

export interface ProtocolSetupLabwareProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  isConfirmed: boolean
  setIsConfirmed: (confirmed: boolean) => void
}

export function ProtocolSetupLabware({
  runId,
  setSetupScreen,
  isConfirmed,
  setIsConfirmed,
}: ProtocolSetupLabwareProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [showMapView, setShowMapView] = React.useState<boolean>(false)
  const [
    showLabwareDetailsModal,
    setShowLabwareDetailsModal,
  ] = React.useState<boolean>(false)
  const [selectedLabware, setSelectedLabware] = React.useState<
    | (LabwareDefinition2 & {
        location: LabwareLocation
        nickName: string | null
        id: string
      })
    | null
  >(null)

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_POLL_MS,
  })
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(
    mostRecentAnalysis?.commands ?? []
  )
  const moduleQuery = useModulesQuery({
    refetchInterval: MODULE_REFETCH_INTERVAL_MS,
  })
  const attachedModules = moduleQuery?.data?.data ?? []
  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo,
    deckConfig
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
      const location = onDeckItems.find(
        item => item.labwareId === foundLabware.id
      )?.initialLocation
      if (location != null) {
        setSelectedLabware({
          ...labwareDef,
          location: location,
          nickName: nickName ?? null,
          id: labwareId,
        })
        setShowLabwareDetailsModal(true)
      } else {
        console.warn('no initial labware location found')
      }
    }
  }
  const selectedLabwareIsTopOfStack = mostRecentAnalysis?.commands.some(
    command =>
      command.commandType === 'loadLabware' &&
      command.result?.labwareId === selectedLabware?.id &&
      typeof command.params.location === 'object' &&
      ('moduleId' in command.params.location ||
        'labwareId' in command.params.location)
  )

  return (
    <>
      {showLabwareDetailsModal &&
      !selectedLabwareIsTopOfStack &&
      selectedLabware != null ? (
        <SingleLabwareModal
          selectedLabware={selectedLabware}
          onOutsideClick={() => {
            setShowLabwareDetailsModal(false)
            setSelectedLabware(null)
          }}
          mostRecentAnalysis={mostRecentAnalysis}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <ODDBackButton
          label={t('labware')}
          onClick={() => {
            setSetupScreen('prepare to run')
          }}
        />
        {isConfirmed ? (
          <Chip
            background
            iconName="ot-check"
            text={t('placements_confirmed')}
            type="success"
          />
        ) : (
          <SmallButton
            buttonText={t('confirm_placements')}
            onClick={() => {
              setIsConfirmed(true)
              setSetupScreen('prepare to run')
            }}
            buttonCategory="rounded"
          />
        )}
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        marginTop={SPACING.spacing32}
      >
        {showMapView ? (
          <LabwareMapView
            mostRecentAnalysis={mostRecentAnalysis}
            deckDef={deckDef}
            attachedProtocolModuleMatches={attachedProtocolModuleMatches}
            handleLabwareClick={handleLabwareClick}
            initialLoadedLabwareByAdapter={initialLoadedLabwareByAdapter}
          />
        ) : (
          <>
            <Flex
              gridGap={SPACING.spacing8}
              color={COLORS.grey60}
              fontSize={TYPOGRAPHY.fontSize22}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              lineHeight={TYPOGRAPHY.lineHeight28}
            >
              <Flex paddingLeft={SPACING.spacing16} width="10.5625rem">
                <LegacyStyledText>{t('location')}</LegacyStyledText>
              </Flex>
              <Flex>
                <LegacyStyledText>{t('labware_name')}</LegacyStyledText>
              </Flex>
            </Flex>
            {[...onDeckItems, ...offDeckItems].map((labware, i) => {
              const labwareOnAdapter = onDeckItems.find(
                item =>
                  labware.initialLocation !== 'offDeck' &&
                  'labwareId' in labware.initialLocation &&
                  item.labwareId === labware.initialLocation.labwareId
              )
              return mostRecentAnalysis != null && labwareOnAdapter == null ? (
                <RowLabware
                  key={i}
                  labware={labware}
                  attachedProtocolModules={attachedProtocolModuleMatches}
                  refetchModules={moduleQuery.refetch}
                  commands={mostRecentAnalysis?.commands}
                  nestedLabwareInfo={getNestedLabwareInfo(
                    labware,
                    mostRecentAnalysis.commands
                  )}
                />
              ) : null
            })}
          </>
        )}
        {showLabwareDetailsModal &&
        selectedLabware != null &&
        selectedLabwareIsTopOfStack ? (
          <LabwareStackModal
            labwareIdTop={selectedLabware?.id}
            commands={mostRecentAnalysis?.commands ?? null}
            closeModal={() => {
              setSelectedLabware(null)
              setShowLabwareDetailsModal(false)
            }}
          />
        ) : null}
      </Flex>
      <FloatingActionButton
        buttonText={showMapView ? t('list_view') : t('map_view')}
        onClick={() => {
          setShowMapView(mapView => !mapView)
        }}
      />
    </>
  )
}

const labwareLatchStyles = css`
  &:active {
    background-color: ${COLORS.blue35};
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
      backgroundColor={COLORS.blue35}
      borderRadius={BORDERS.borderRadius16}
      css={labwareLatchStyles}
      color={isLatchLoading ? COLORS.grey60 : COLORS.black90}
      height="6.5rem"
      alignSelf={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      fontSize={TYPOGRAPHY.fontSize22}
      gridGap={SPACING.spacing8}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      lineHeight={TYPOGRAPHY.lineHeight28}
      minWidth="11.0625rem"
      onClick={toggleLatch}
      padding={SPACING.spacing12}
    >
      <LegacyStyledText fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('protocol_setup:labware_latch')}
      </LegacyStyledText>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        {hsLatchText != null && icon != null ? (
          <>
            <LegacyStyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
              {hsLatchText}
            </LegacyStyledText>
            <Icon
              name={icon}
              size="2.5rem"
              color={
                commandType === 'heaterShaker/closeLabwareLatch'
                  ? COLORS.blue50
                  : COLORS.black90
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
  nestedLabwareInfo: NestedLabwareInfo | null
  commands?: RunTimeCommand[]
}

function RowLabware({
  labware,
  attachedProtocolModules,
  refetchModules,
  nestedLabwareInfo,
  commands,
}: RowLabwareProps): JSX.Element | null {
  const { definition, initialLocation, nickName } = labware
  const { t, i18n } = useTranslation([
    'protocol_command_text',
    'protocol_setup',
  ])

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

  let slotName: string = ''
  let location: JSX.Element | string | null = null
  if (initialLocation === 'offDeck') {
    location = (
      <DeckInfoLabel deckLabel={i18n.format(t('off_deck'), 'upperCase')} />
    )
  } else if ('slotName' in initialLocation) {
    slotName = initialLocation.slotName
    location = <DeckInfoLabel deckLabel={initialLocation.slotName} />
  } else if ('addressableAreaName' in initialLocation) {
    slotName = initialLocation.addressableAreaName
    location = <DeckInfoLabel deckLabel={initialLocation.addressableAreaName} />
  } else if (labware.moduleLocation != null) {
    location = (
      <>
        <DeckInfoLabel deckLabel={labware.moduleLocation.slotName} />
      </>
    )
  } else if ('labwareId' in initialLocation) {
    const adapterId = initialLocation.labwareId
    const adapterLocation = commands?.find(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware' &&
        command.result?.labwareId === adapterId
    )?.params.location

    if (adapterLocation != null && adapterLocation !== 'offDeck') {
      if ('slotName' in adapterLocation) {
        slotName = adapterLocation.slotName
        location = <DeckInfoLabel deckLabel={adapterLocation.slotName} />
      } else if ('moduleId' in adapterLocation) {
        const moduleUnderAdapter = attachedProtocolModules.find(
          module => module.moduleId === adapterLocation.moduleId
        )
        if (moduleUnderAdapter != null) {
          slotName = moduleUnderAdapter.slotName
          location = <DeckInfoLabel deckLabel={moduleUnderAdapter.slotName} />
        }
      }
    }
  }
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.grey35}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      gridGap={SPACING.spacing32}
    >
      <Flex gridGap={SPACING.spacing4} width="7.6875rem">
        {location}
        {nestedLabwareInfo != null || matchedModule != null ? (
          <DeckInfoLabel iconName="stacked" />
        ) : null}
      </Flex>
      <Flex
        alignSelf={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        flexDirection={DIRECTION_ROW}
        width="86%"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_EVENLY}
            gridGap={SPACING.spacing4}
          >
            <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {getLabwareDisplayName(definition)}
            </LegacyStyledText>
            <LegacyStyledText color={COLORS.grey60} as="p">
              {nickName}
            </LegacyStyledText>
          </Flex>
          {nestedLabwareInfo != null &&
          nestedLabwareInfo?.sharedSlotId === slotName ? (
            <>
              <Box
                borderBottom={`1px solid ${COLORS.grey60}`}
                marginY={SPACING.spacing16}
                width={matchingHeaterShaker != null ? '33rem' : '46rem'}
              />
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                <LegacyStyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {nestedLabwareInfo.nestedLabwareDisplayName}
                </LegacyStyledText>
                <LegacyStyledText as="p" color={COLORS.grey60}>
                  {nestedLabwareInfo.nestedLabwareNickName}
                </LegacyStyledText>
              </Flex>
            </>
          ) : null}
          {matchedModule != null ? (
            <>
              <Box
                borderBottom={`1px solid ${COLORS.grey60}`}
                marginY={SPACING.spacing16}
                width={matchingHeaterShaker != null ? '33rem' : '46rem'}
              />
              <Flex
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing12}
                alignItems={ALIGN_CENTER}
              >
                <DeckInfoLabel
                  iconName={
                    MODULE_ICON_NAME_BY_TYPE[matchedModule.moduleDef.moduleType]
                  }
                />
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <LegacyStyledText
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  >
                    {getModuleDisplayName(matchedModule.moduleDef.model)}
                  </LegacyStyledText>
                  {matchingHeaterShaker != null ? (
                    <LegacyStyledText as="p" color={COLORS.grey60}>
                      {t('protocol_setup:labware_latch_instructions')}
                    </LegacyStyledText>
                  ) : null}
                </Flex>
              </Flex>
            </>
          ) : null}
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
