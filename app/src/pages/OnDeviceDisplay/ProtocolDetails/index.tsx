import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Icon,
  SPACING,
  truncateString,
  TYPOGRAPHY,
  POSITION_STICKY,
} from '@opentrons/components'
import {
  useCreateRunMutation,
  useHost,
  useProtocolAnalysesQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import {
  CompletedProtocolAnalysis,
  ProtocolResource,
} from '@opentrons/shared-data'
import { MAXIMUM_PINNED_PROTOCOLS } from '../../../App/constants'
import { MediumButton, SmallButton, TabbedButton } from '../../../atoms/buttons'
import { Chip } from '../../../atoms/Chip'
import { StyledText } from '../../../atoms/text'
import { useMissingHardwareText } from '../../../organisms/OnDeviceDisplay/RobotDashboard/hooks'
import { Modal, SmallModalChildren } from '../../../molecules/Modal'
import { useToaster } from '../../../organisms/ToasterOven'
import { getPinnedProtocolIds, updateConfigValue } from '../../../redux/config'
import { useMissingProtocolHardware } from '../../Protocols/hooks'
import { Deck } from './Deck'
import { Hardware } from './Hardware'
import { Labware } from './Labware'
import { Liquids } from './Liquids'

import type { ModalHeaderBaseProps } from '../../../molecules/Modal/types'
import type { Dispatch } from '../../../redux/types'
import type { OnDeviceRouteParams } from '../../../App/types'
import { useOffsetCandidatesForAnalysis } from '../../../organisms/ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'

const ProtocolHeader = (props: {
  title: string
  handleRunProtocol: () => void
  chipText: string
  isScrolled: boolean
}): JSX.Element => {
  const history = useHistory()
  const { t } = useTranslation(['protocol_info, protocol_details', 'shared'])
  const { title, handleRunProtocol, chipText, isScrolled } = props
  const [truncate, setTruncate] = React.useState<boolean>(true)
  const toggleTruncate = (): void => setTruncate(value => !value)

  let displayedTitle = title
  if (title.length > 92 && truncate) {
    displayedTitle = truncateString(title, 80, 60)
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      boxShadow={isScrolled ? BORDERS.shadowBig : undefined}
      gridGap={SPACING.spacing40}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing32} ${SPACING.spacing40}`}
      position={POSITION_STICKY}
      top="0"
      backgroundColor={COLORS.white}
      marginX={`-${SPACING.spacing32}`}
      zIndex={1} // the header is always visble when things scroll beneath
    >
      <Flex
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
        width="42.125rem"
      >
        <Btn
          paddingLeft="0rem"
          paddingRight={SPACING.spacing24}
          onClick={() => history.goBack()}
          width="3rem"
        >
          <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
        </Btn>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          maxWidth="42.625rem"
        >
          <Flex maxWidth="max-content">
            <Chip
              type={chipText === 'Ready to run' ? 'success' : 'warning'}
              text={chipText}
            />
          </Flex>
          <StyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            onClick={toggleTruncate}
            overflowWrap="anywhere"
          >
            {displayedTitle}
          </StyledText>
        </Flex>
      </Flex>
      <SmallButton
        buttonCategory="rounded"
        onClick={handleRunProtocol}
        buttonText={t('protocol_details:start_setup')}
        buttonType="primary"
      />
    </Flex>
  )
}

const protocolSectionTabOptions = [
  'Summary',
  'Hardware',
  'Labware',
  'Liquids',
  'Deck',
] as const

type TabOption = typeof protocolSectionTabOptions[number]

interface ProtocolSectionTabsProps {
  currentOption: TabOption
  setCurrentOption: (option: TabOption) => void
}
const ProtocolSectionTabs = (props: ProtocolSectionTabsProps): JSX.Element => {
  const { currentOption, setCurrentOption } = props
  return (
    <Flex gridGap={SPACING.spacing8} marginX={SPACING.spacing16}>
      {protocolSectionTabOptions.map(option => {
        return (
          <TabbedButton
            isSelected={option === currentOption}
            key={option}
            onClick={() => setCurrentOption(option)}
          >
            {option}
          </TabbedButton>
        )
      })}
    </Flex>
  )
}

const Summary = (props: {
  author: string | null
  description: string | null
  date: string | null
}): JSX.Element => {
  const { author, description, date } = props
  const { t, i18n } = useTranslation('protocol_details')
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        gridGap={SPACING.spacing4}
      >
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >{`${i18n.format(t('author'), 'capitalize')}: `}</StyledText>
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {author}
        </StyledText>
      </Flex>
      <StyledText
        as="p"
        color={description === null ? COLORS.darkBlack70 : undefined}
      >
        {description ?? i18n.format(t('no_summary'), 'capitalize')}
      </StyledText>
      <Flex
        backgroundColor={COLORS.darkBlack20}
        borderRadius={BORDERS.borderRadiusSize1}
        marginTop={SPACING.spacing24}
        width="max-content"
        padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
      >
        <StyledText as="p">{`${t('protocol_info:date_added')}: ${
          date != null
            ? format(new Date(date), 'MM/dd/yy k:mm')
            : t('shared:no_data')
        }`}</StyledText>
      </Flex>
    </Flex>
  )
}

interface ProtocolSectionContentProps {
  protocolId: string
  protocolData: ProtocolResource
  currentOption: TabOption
}
const ProtocolSectionContent = (
  props: ProtocolSectionContentProps
): JSX.Element => {
  const { protocolId, protocolData, currentOption } = props
  let protocolSection
  switch (currentOption) {
    case 'Summary':
      protocolSection = (
        <Summary
          author={protocolData.metadata.author ?? null}
          date={protocolData.createdAt ?? null}
          description={protocolData.metadata.description ?? null}
        />
      )
      break
    case 'Hardware':
      protocolSection = <Hardware protocolId={protocolId} />
      break
    case 'Labware':
      protocolSection = <Labware protocolId={protocolId} />
      break
    case 'Liquids':
      protocolSection = <Liquids protocolId={props.protocolId} />
      break
    case 'Deck':
      protocolSection = <Deck protocolId={protocolId} />
      break
  }
  return <Flex margin={SPACING.spacing16}>{protocolSection}</Flex>
}

export function ProtocolDetails(): JSX.Element | null {
  const { t, i18n } = useTranslation([
    'protocol_details',
    'protocol_info',
    'shared',
  ])
  const { protocolId } = useParams<OnDeviceRouteParams>()
  const missingProtocolHardware = useMissingProtocolHardware(protocolId)
  const chipText = useMissingHardwareText(missingProtocolHardware)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const host = useHost()
  const { makeSnackbar } = useToaster()
  const queryClient = useQueryClient()
  const [currentOption, setCurrentOption] = React.useState<TabOption>(
    protocolSectionTabOptions[0]
  )
  const [showMaxPinsAlert, setShowMaxPinsAlert] = React.useState<boolean>(false)
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  // Watch for scrolling to toggle dropshadow
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false)
  const observer = new IntersectionObserver(([entry]) => {
    setIsScrolled(!entry.isIntersecting)
  })
  if (scrollRef.current) {
    observer.observe(scrollRef.current)
  }

  let pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const pinned = pinnedProtocolIds.includes(protocolId)

  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId)
  const mostRecentAnalysis =
    (protocolAnalyses?.data ?? [])
      .reverse()
      .find(
        (analysis): analysis is CompletedProtocolAnalysis =>
          analysis.status === 'completed'
      ) ?? null
  const scrapedLabwareOffsets = useOffsetCandidatesForAnalysis(
    mostRecentAnalysis
  ).map(({ vector, location, definitionUri }) => ({
    vector,
    location,
    definitionUri,
  }))

  const { createRun } = useCreateRunMutation({
    onSuccess: data => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`could not invalidate runs cache: ${e.message}`)
        )
    },
  })

  const handlePinClick = (): void => {
    if (!pinned) {
      if (pinnedProtocolIds.length === MAXIMUM_PINNED_PROTOCOLS) {
        setShowMaxPinsAlert(true)
      } else {
        pinnedProtocolIds.push(protocolId)
        makeSnackbar(t('protocol_info:pinned_protocol'))
      }
    } else {
      pinnedProtocolIds = pinnedProtocolIds.filter(p => p !== protocolId)
      makeSnackbar(t('protocol_info:unpinned_protocol'))
    }
    dispatch(
      updateConfigValue('protocols.pinnedProtocolIds', pinnedProtocolIds)
    )
  }

  const handleRunProtocol = (): void => {
    createRun({ protocolId, labwareOffsets: scrapedLabwareOffsets })
  }
  const [
    showConfirmDeleteProtocol,
    setShowConfirmationDeleteProtocol,
  ] = React.useState<boolean>(false)

  const handleDeleteClick = (): void => {
    setShowConfirmationDeleteProtocol(false)
    if (host != null) {
      getProtocol(host, protocolId)
        .then(
          response =>
            response.data.links?.referencingRuns.map(({ id }) => id) ?? []
        )
        .then(referencingRunIds =>
          Promise.all(referencingRunIds?.map(runId => deleteRun(host, runId)))
        )
        .then(() => deleteProtocol(host, protocolId))
        .then(() => history.goBack())
        .catch((e: Error) => {
          console.error(`error deleting resources: ${e.message}`)
          history.goBack()
        })
    } else {
      console.error(
        'could not delete resources because the robot host is unknown'
      )
    }
  }

  if (protocolRecord == null) return null
  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  const deleteModalHeader: ModalHeaderBaseProps = {
    title: 'Delete this protocol?',
    iconName: 'ot-alert',
    iconColor: COLORS.yellow2,
  }
  return (
    <>
      {showConfirmDeleteProtocol ? (
        <Flex alignItems={ALIGN_CENTER}>
          <Modal
            modalSize="medium"
            onOutsideClick={() => setShowConfirmationDeleteProtocol(false)}
            header={deleteModalHeader}
          >
            <Flex flexDirection={DIRECTION_COLUMN} width="100%">
              <StyledText
                as="h4"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
                marginBottom={SPACING.spacing40}
              >
                {t('delete_protocol_perm', { name: displayName })}
              </StyledText>
              <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
                <SmallButton
                  onClick={() => setShowConfirmationDeleteProtocol(false)}
                  buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
                  buttonType="primary"
                  width="50%"
                />
                <SmallButton
                  onClick={handleDeleteClick}
                  buttonText={t('shared:delete')}
                  buttonType="alert"
                  width="50%"
                />
              </Flex>
            </Flex>
          </Modal>
        </Flex>
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing32}
        paddingBottom={SPACING.spacing32}
      >
        {showMaxPinsAlert && (
          <SmallModalChildren
            header={t('too_many_pins_header')}
            subText={t('too_many_pins_body')}
            buttonText={i18n.format(t('shared:close'), 'capitalize')}
            handleCloseMaxPinsAlert={() => setShowMaxPinsAlert(false)}
          />
        )}
        {/* Empty box to detect scrolling */}
        <Flex ref={scrollRef} />
        <ProtocolHeader
          title={displayName}
          handleRunProtocol={handleRunProtocol}
          chipText={chipText}
          isScrolled={isScrolled}
        />
        <Flex flexDirection={DIRECTION_COLUMN}>
          <ProtocolSectionTabs
            currentOption={currentOption}
            setCurrentOption={setCurrentOption}
          />
          <ProtocolSectionContent
            protocolId={protocolId}
            protocolData={protocolRecord.data}
            currentOption={currentOption}
          />
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing8}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            paddingTop={SPACING.spacing60}
            marginX={SPACING.spacing16}
          >
            <MediumButton
              buttonText={
                pinned
                  ? t('protocol_info:unpin_protocol')
                  : t('protocol_info:pin_protocol')
              }
              buttonType="secondary"
              iconName="pin"
              onClick={handlePinClick}
              width="29.25rem"
            />
            <MediumButton
              buttonText={t('protocol_info:delete_protocol')}
              buttonType="alertSecondary"
              iconName="trash"
              onClick={() => setShowConfirmationDeleteProtocol(true)}
              width="29.25rem"
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
