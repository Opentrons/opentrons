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
  useDeleteProtocolMutation,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { ProtocolResource } from '@opentrons/shared-data'
import { MAXIMUM_PINNED_PROTOCOLS } from '../../../App/constants'
import {
  MediumButton,
  TabbedButton,
} from '../../../atoms/buttons/OnDeviceDisplay'
import { Chip } from '../../../atoms/chip'
import { StyledText } from '../../../atoms/text'
import { getPinnedProtocolIds, updateConfigValue } from '../../../redux/config'
import { Deck } from './Deck'
import { Hardware } from './Hardware'
import { Labware } from './Labware'
import { TooManyPinsModal } from '../TooManyPinsModal'

import type { Dispatch } from '../../../redux/types'
import type { OnDeviceRouteParams } from '../../../App/types'

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
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING.spacingXXL}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing5}
        marginBottom={SPACING.spacing3}
      >
        <Btn onClick={() => history.goBack()}>
          <Icon
            name="back"
            width="1.1875rem"
            color={COLORS.darkBlack_hundred}
          />
        </Btn>
        <Flex flexDirection={DIRECTION_COLUMN} maxWidth="42.625rem">
          <Flex maxWidth="15.125rem">
            <Chip type="warning" text="Chip TBD" />
          </Flex>
          <StyledText
            fontSize={TYPOGRAPHY.fontSize38}
            fontWeight={TYPOGRAPHY.fontWeightNearlyBold}
            lineHeight={TYPOGRAPHY.lineHeight48}
            onClick={toggleTruncate}
          >
            {displayedTitle}
          </StyledText>
        </Flex>
      </Flex>
      <Flex alignItems={ALIGN_CENTER} maxHeight="3.75rem" minWidth="15.6875rem">
        <NewPrimaryBtn
          backgroundColor={COLORS.blueEnabled}
          borderRadius={BORDERS.size_six}
          boxShadow="none"
          onClick={handleRunProtocol}
          padding={`${SPACING.spacing4} ${SPACING.spacing5}`}
        >
          <StyledText
            fontSize="2.333125rem"
            fontWeight={TYPOGRAPHY.fontWeightNearlyBold}
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
  return (
    <Flex gridGap={SPACING.spacing3} margin={SPACING.spacing4}>
      {protocolSectionTabOptions.map(option => {
        return (
          <TabbedButton
            foreground={option === props.currentOption}
            key={option}
            onClick={() => props.setCurrentOption(option)}
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
  const { t } = useTranslation('protocol_details')
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
      <Flex
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        gridGap={SPACING.spacing2}
        lineHeight={TYPOGRAPHY.lineHeight28}
      >
        <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>{`${t(
          'author'
        )}: `}</StyledText>
        <StyledText>{props.author}</StyledText>
      </Flex>
      <StyledText
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
      >
        {props.description}
      </StyledText>
      <Flex
        backgroundColor={COLORS.darkBlack_twenty}
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
        maxWidth="22rem"
        padding={`${SPACING.spacing3} 0.75rem`}
      >
        <StyledText>{`${t('protocol_info:date_added')}: ${
          props.date != null
            ? format(new Date(props.date), 'MM/dd/yyyy k:mm')
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
  let protocolSection
  switch (props.currentOption) {
    case 'Summary':
      protocolSection = (
        <Summary
          author={props.protocolData.metadata.author ?? null}
          date={props.protocolData.createdAt ?? null}
          description={props.protocolData.metadata.description ?? null}
        />
      )
      break
    case 'Hardware':
      protocolSection = <Hardware protocolId={props.protocolId} />
      break
    case 'Labware':
      protocolSection = <Labware protocolId={props.protocolId} />
      break
    case 'Liquids':
      break
    case 'Initial Deck Layout':
      protocolSection = <Deck protocolId={props.protocolId} />
      break
  }
  return <Flex margin={SPACING.spacing4}>{protocolSection}</Flex>
}

export function ProtocolDetails(): JSX.Element | null {
  const { t } = useTranslation(['protocol_details', 'protocol_info'])
  const { protocolId } = useParams<OnDeviceRouteParams>()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
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
      history.push(`/protocols/${runId}/setup`)
    },
  })

  const handlePinClick = (): void => {
    if (!pinned) {
      if (pinnedProtocolIds.length === MAXIMUM_PINNED_PROTOCOLS) {
        setShowMaxPinsAlert(true)
      } else {
        pinnedProtocolIds.push(protocolId)
      }
    } else {
      pinnedProtocolIds = pinnedProtocolIds.filter(p => p !== protocolId)
    }
    dispatch(
      updateConfigValue('protocols.pinnedProtocolIds', pinnedProtocolIds)
    )
  }

  const handleRunProtocol = (): void => {
    createRun({ protocolId })
  }

  const { deleteProtocol } = useDeleteProtocolMutation(protocolId)

  if (protocolRecord == null) return null
  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing6}>
      {showMaxPinsAlert && (
        <TooManyPinsModal
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
        gridGap={SPACING.spacing3}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        margin={SPACING.spacing4}
      >
        <MediumButton
          buttonText={
            pinned
              ? t('protocol_info:unpin_protocol')
              : t('protocol_info:pin_protocol')
          }
          buttonType="secondary"
          iconName={'push-pin'}
          onClick={handlePinClick}
          width="30.375rem"
        />
        <MediumButton
          buttonText={t('delete_protocol')}
          buttonType="alertSecondary"
          iconName={'delete'}
          onClick={() => {
            deleteProtocol()
            history.goBack()
          }}
          width="30.375rem"
        />
      </Flex>
    </Flex>
  )
}
