import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { format, formatDistance } from 'date-fns'
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'
import { BackButton } from '../../atoms/buttons'

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
const TableRow = styled('tr')`
  border: 1px ${COLORS.medGreyHover} solid;
  height: 4rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: wrap;
`

export function ProtocolDashboard(): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const history = useHistory()
  const { t } = useTranslation('protocol_info')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <BackButton />
      <Table>
        <thead>
          <tr>
            <TableHeader>{t('protocol_name_title')}</TableHeader>
            <TableHeader>{t('last_run')}</TableHeader>
            <TableHeader>{t('date_added')}</TableHeader>
          </tr>
        </thead>

        <tbody>
          {protocols.data?.data.map((protocol, index) => {
            const lastRun = runs.data?.data.find(
              run => run.protocolId === protocol.id
            )?.createdAt
            return (
              <TableRow
                key={index}
                onClick={() => history.push(`/protocols/${protocol.id}`)}
              >
                <TableDatum> {protocol.metadata.protocolName}</TableDatum>
                <TableDatum>
                  {lastRun != null
                    ? formatDistance(new Date(lastRun), new Date(), {
                        addSuffix: true,
                      })
                    : t('no_history')}
                </TableDatum>
                <TableDatum>
                  {format(new Date(protocol.createdAt), 'Pp')}
                </TableDatum>
              </TableRow>
            )
          })}
        </tbody>
      </Table>
    </Flex>
  )
}
