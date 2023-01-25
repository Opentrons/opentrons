import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { last } from 'lodash'
import { format } from 'date-fns'
import styled from 'styled-components'
import {
  COLORS,
  Flex,
  Icon,
  SIZE_2,
  SPACING,
  JUSTIFY_FLEX_START,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useDeleteProtocolMutation,
  useProtocolAnalysesQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import {
  BackButton,
  SecondaryTertiaryButton,
  TertiaryButton,
} from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import type { OnDeviceRouteParams } from '../../App/types'
import type { Protocol } from '@opentrons/api-client'

type ProtocolType = 'json' | 'python'
type CreationMethod = 'Protocol Designer' | 'Python'

const getCreationMethod = (protocolType: ProtocolType): CreationMethod =>
  protocolType === 'json' ? 'Protocol Designer' : 'Python'

const ProtocolHeader = (props: {
  title: string
  date: number | null
  protocolType: ProtocolType
}): JSX.Element => {
  const { t } = useTranslation(['protocol_info, protocol_details', 'shared'])
  const { title, date, protocolType } = props
  return (
    <Flex flexDirection="column" margin={SPACING.spacing5}>
      <Flex gridGap={SPACING.spacing5} marginBottom={SPACING.spacing3}>
        <StyledText as="h1">{title}</StyledText>
        <TertiaryButton>{t('protocol_details:run_protocol')}</TertiaryButton>
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
          option === props.currentOption
            ? TertiaryButton
            : SecondaryTertiaryButton
        return (
          <Button key={option} onClick={() => props.setCurrentOption(option)}>
            {option}
          </Button>
        )
      })}
    </Flex>
  )
}

const Summary = (props: { protocolRecord: Protocol }): JSX.Element => {
  const { t } = useTranslation('protocol_details')
  return (
    <Flex flexDirection="column" gridGap={SPACING.spacing2}>
      <Flex gridGap={SPACING.spacing2}>
        <StyledText
          as="h2"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >{`${t('author')}: `}</StyledText>
        <StyledText>{props.protocolRecord.data.metadata.author}</StyledText>
      </Flex>
      <StyledText>{props.protocolRecord.data.metadata.description}</StyledText>
    </Flex>
  )
}

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: collapse;
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing2};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformUppercase};
  color: ${COLORS.darkBlackEnabled};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing2};
`

const Hardware = (): JSX.Element => (
  <Table>
    <thead>
      <tr>
        <TableHeader>Location</TableHeader>
        <TableHeader>Hardware</TableHeader>
        <TableHeader>Connected Status</TableHeader>
      </tr>
    </thead>
  </Table>
)

interface ProtocolSectionContentProps {
  protocolRecord: Protocol
  currentOption: TabOption
}
const ProtocolSectionContent = (
  props: ProtocolSectionContentProps
): JSX.Element => {
  let protocolSection
  switch (props.currentOption) {
    case 'Summary':
      protocolSection = <Summary protocolRecord={props.protocolRecord} />
      break
    case 'Hardware':
      protocolSection = <Hardware />
      break
    case 'Labware':
      break
    case 'Liquids':
      break
    case 'Initial Deck Layout':
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

  const { deleteProtocol } = useDeleteProtocolMutation(protocolId)
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  if (mostRecentAnalysis?.status !== 'completed' || protocolRecord == null)
    return null

  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  return (
    <Flex flexDirection="column" alignItems={JUSTIFY_FLEX_START}>
      <BackButton />
      <ProtocolHeader
        title={displayName}
        date={protocolRecord.data.metadata.created ?? null}
        protocolType={protocolRecord.data.protocolType}
      />
      <ProtocolSectionTabs
        currentOption={currentOption}
        setCurrentOption={setCurrentOption}
      />
      <ProtocolSectionContent
        protocolRecord={protocolRecord}
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
