import * as React from 'react'
import styled from 'styled-components'
import { format, formatDistance } from 'date-fns'
import {
  COLORS,
  SPACING,
  SIZING,
  TYPOGRAPHY,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

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
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Table>
        <thead>
          <tr>
            <TableHeader>Protocol Name</TableHeader>
            <TableHeader>Last Run</TableHeader>
            <TableHeader>Date Added</TableHeader>
          </tr>
        </thead>

        <tbody>
          {protocols.data?.data.map((protocol, index) => {
            const lastRun = runs.data?.data.find(
              run => run.protocolId === protocol.id
            )?.createdAt
            return (
              <TableRow key={index}>
                <TableDatum> {protocol.metadata.protocolName}</TableDatum>
                <TableDatum>
                  {formatDistance(new Date(lastRun), new Date(), {
                    addSuffix: true,
                  }) ?? 'No History'}
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
