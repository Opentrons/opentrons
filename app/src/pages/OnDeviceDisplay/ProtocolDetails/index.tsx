import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
  NewPrimaryBtn,
  SPACING,
  truncateString,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useCreateRunMutation,
  useHost,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { ProtocolResource } from '@opentrons/shared-data'
import { MAXIMUM_PINNED_PROTOCOLS } from '../../../App/constants'
import { MediumButton, TabbedButton } from '../../../atoms/buttons'
import { Chip } from '../../../atoms/Chip'
import { StyledText } from '../../../atoms/text'
import { SmallModalChildren } from '../../../molecules/Modal/OnDeviceDisplay'
import { useToaster } from '../../../organisms/ToasterOven'
import { getPinnedProtocolIds, updateConfigValue } from '../../../redux/config'
import { Deck } from './Deck'
import { Hardware } from './Hardware'
import { Labware } from './Labware'
import { Liquids } from './Liquids'

import type { Dispatch } from '../../../redux/types'
import type { OnDeviceRouteParams } from '../../../App/types'
import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'

const ProtocolHeader = (props: {
  title: string
  handleRunProtocol: () => void
}): JSX.Element => {
  const history = useHistory()
  const { t } = useTranslation(['protocol_info, protocol_details', 'shared'])
  const { title, handleRunProtocol } = props

  const [truncate, setTruncate] = React.useState<boolean>(true)
  const toggleTruncate = (): void => setTruncate(value => !value)

  let displayedTitle = title

  if (title.length > 92 && truncate) {
    displayedTitle = truncateString(title, 92, 69)
  }

  //  TODO(ew, 3/23/23): put real info in the chip

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      margin={SPACING.spacing16}
      marginBottom={SPACING.spacing40}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
        marginBottom={SPACING.spacing8}
      >
        <Btn
          paddingLeft="0rem"
          paddingRight="1.25rem"
          onClick={() => history.goBack()}
          width="2.5rem"
        >
          <Icon name="back" width="2.5rem" color={COLORS.darkBlack100} />
        </Btn>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          maxWidth="42.625rem"
        >
          <Flex maxWidth="15.125rem">
            <Chip type="warning" text="Chip TBD" />
          </Flex>
          <StyledText
            fontSize={TYPOGRAPHY.fontSize38}
            fontWeight={TYPOGRAPHY.fontWeightBold}
            lineHeight={TYPOGRAPHY.lineHeight48}
            onClick={toggleTruncate}
            overflowWrap="anywhere"
          >
            {displayedTitle}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        alignItems={ALIGN_CENTER}
        marginLeft={SPACING.spacing40}
        maxHeight="3.75rem"
        minWidth="15.6875rem"
      >
        <NewPrimaryBtn
          backgroundColor={COLORS.blueEnabled}
          borderRadius={BORDERS.size6}
          boxShadow="none"
          onClick={handleRunProtocol}
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        >
          <StyledText
            fontSize="2.333125rem"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            lineHeight={TYPOGRAPHY.lineHeight48}
            textTransform={TYPOGRAPHY.textTransformNone}
          >
            {t('protocol_details:start_setup')}
          </StyledText>
        </NewPrimaryBtn>
      </Flex>
    </Flex>
  )
}

const protocolSectionTabOptions = [
  'Summary',
  'Hardware',
  'Labware',
  'Liquids',
  'Initial Deck Layout',
] as const

type TabOption = typeof protocolSectionTabOptions[number]

interface ProtocolSectionTabsProps {
  currentOption: TabOption
  setCurrentOption: (option: TabOption) => void
}
const ProtocolSectionTabs = (props: ProtocolSectionTabsProps): JSX.Element => {
  const { currentOption, setCurrentOption } = props
  return (
    <Flex gridGap={SPACING.spacing8} margin={SPACING.spacing16}>
      {protocolSectionTabOptions.map(option => {
        return (
          <TabbedButton
            foreground={option === currentOption}
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
  const { t } = useTranslation('protocol_details')
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        gridGap={SPACING.spacing4}
        lineHeight={TYPOGRAPHY.lineHeight28}
      >
        <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>{`${t(
          'author'
        )}: `}</StyledText>
        <StyledText>{author}</StyledText>
      </Flex>
      <StyledText
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
      >
        {description}
      </StyledText>
      <Flex
        backgroundColor={COLORS.darkBlack20}
        borderRadius={BORDERS.size1}
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
        marginTop={SPACING.spacing24}
        maxWidth="22rem"
        padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
      >
        <StyledText>{`${t('protocol_info:date_added')}: ${
          date != null
            ? format(new Date(date), 'MM/dd/yyyy k:mm')
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
    case 'Initial Deck Layout':
      protocolSection = <Deck protocolId={protocolId} />
      break
  }
  return <Flex margin={SPACING.spacing16}>{protocolSection}</Flex>
}

export function ProtocolDetails(): JSX.Element | null {
  const { t } = useTranslation(['protocol_details', 'protocol_info', 'shared'])
  const { protocolId } = useParams<OnDeviceRouteParams>()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const host = useHost()
  const { makeSnackbar } = useToaster()
  const [currentOption, setCurrentOption] = React.useState<TabOption>(
    protocolSectionTabOptions[0]
  )
  const [showMaxPinsAlert, setShowMaxPinsAlert] = React.useState<boolean>(false)
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  let pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const pinned = pinnedProtocolIds.includes(protocolId)

  const { createRun } = useCreateRunMutation({
    onSuccess: data => {
      const runId: string = data.data.id
      history.push(`/runs/${runId}/setup`)
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
    createRun({ protocolId })
  }

  const handleDeleteClick = (): void => {
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

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
      {showMaxPinsAlert && (
        <SmallModalChildren
          header={t('too_many_pins_header')}
          subText={t('too_many_pins_body')}
          buttonText={t('shared:close')}
          handleCloseMaxPinsAlert={() => setShowMaxPinsAlert(false)}
        />
      )}
      <ProtocolHeader
        title={displayName}
        handleRunProtocol={handleRunProtocol}
      />
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
        margin={SPACING.spacing16}
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
          onClick={handleDeleteClick}
          width="29.25rem"
        />
      </Flex>
    </Flex>
  )
}
