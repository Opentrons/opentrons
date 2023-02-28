import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SIZE_2,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useCreateRunMutation,
  useDeleteProtocolMutation,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { ProtocolMetadata } from '@opentrons/shared-data'
import {
  BackButton,
  QuaternaryButton,
  TertiaryButton,
} from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { Deck } from './Deck'
import { Hardware } from './Hardware'

import type { OnDeviceRouteParams } from '../../../App/types'

type ProtocolType = 'json' | 'python'
type CreationMethod = 'Protocol Designer' | 'Python'

const getCreationMethod = (protocolType: ProtocolType): CreationMethod =>
  protocolType === 'json' ? 'Protocol Designer' : 'Python'

const ProtocolHeader = (props: {
  title: string
  date: number | null
  protocolType: ProtocolType
  handleRunProtocol: () => void
}): JSX.Element => {
  const { t } = useTranslation(['protocol_info, protocol_details', 'shared'])
  const { title, date, protocolType, handleRunProtocol } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING.spacing5}>
      <Flex gridGap={SPACING.spacing5} marginBottom={SPACING.spacing3}>
        <StyledText as="h1">{title}</StyledText>
        <TertiaryButton onClick={handleRunProtocol}>
          {t('protocol_details:run_protocol')}
        </TertiaryButton>
      </Flex>
      <Flex flexDirection="row" gridGap={'1rem'}>
        <StyledText as="h2">{`${t('protocol_info:date_added')}: ${
          date != null
            ? format(new Date(date), 'MM/dd/yyyy')
            : t('shared:no_data')
        }`}</StyledText>
        <StyledText as="h2">{`${t(
          'protocol_details:creation_method'
        )}: ${getCreationMethod(protocolType)}`}</StyledText>
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
        const Button =
          option === props.currentOption ? TertiaryButton : QuaternaryButton
        return (
          <Button key={option} onClick={() => props.setCurrentOption(option)}>
            {option}
          </Button>
        )
      })}
    </Flex>
  )
}

const Summary = (props: {
  author: string | null
  description: string | null
}): JSX.Element => {
  const { t } = useTranslation('protocol_details')
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
      <Flex gridGap={SPACING.spacing2}>
        <StyledText
          as="h2"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >{`${t('author')}: `}</StyledText>
        <StyledText>{props.author}</StyledText>
      </Flex>
      <StyledText>{props.description}</StyledText>
    </Flex>
  )
}

interface ProtocolSectionContentProps {
  protocolId: string
  metadata: ProtocolMetadata
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
          author={props.metadata.author ?? null}
          description={props.metadata.description ?? null}
        />
      )
      break
    case 'Hardware':
      protocolSection = <Hardware protocolId={props.protocolId} />
      break
    case 'Labware':
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
  const { t } = useTranslation('protocol_details')
  const { protocolId } = useParams<OnDeviceRouteParams>()
  const history = useHistory()
  const [currentOption, setCurrentOption] = React.useState<TabOption>(
    protocolSectionTabOptions[0]
  )
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  const { createRun } = useCreateRunMutation({
    onSuccess: data => {
      const runId: string = data.data.id
      history.push(`/protocols/${runId}/setup`)
    },
  })
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
      <BackButton />
      <ProtocolHeader
        title={displayName}
        date={protocolRecord.data.metadata.created ?? null}
        handleRunProtocol={handleRunProtocol}
        protocolType={protocolRecord.data.protocolType}
      />
      <ProtocolSectionTabs
        currentOption={currentOption}
        setCurrentOption={setCurrentOption}
      />
      <ProtocolSectionContent
        protocolId={protocolId}
        metadata={protocolRecord.data.metadata}
        currentOption={currentOption}
      />
      <Flex margin={SPACING.spacing4}>
        <Flex
          cursor={'default'}
          onClick={() => {
            deleteProtocol()
            history.goBack()
          }}
        >
          <Icon
            size={SIZE_2}
            color={COLORS.errorEnabled}
            marginRight={SPACING.spacing4}
            name={'delete'}
          />
          <StyledText
            color={COLORS.errorEnabled}
            alignSelf={TYPOGRAPHY.textAlignCenter}
          >
            {t('delete_protocol')}
          </StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
