import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { useRequiredProtocolHardware } from '../../Protocols/hooks'
import type { ProtocolHardware } from '../../Protocols/hooks'
import type { TFunction } from 'react-i18next'
import {
  getModuleDisplayName,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: separate
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
  border: 1px ${COLORS.white} solid;
  height: 4rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: wrap;
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  &:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }
  &:last-child {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`

const getHardwareLocation = (
  protocolHardware: ProtocolHardware,
  translator: TFunction<'protocol_details'>
): string => {
  if (protocolHardware.hardwareType === 'pipette') {
    return translator(`${protocolHardware.mount}_mount`)
  } else {
    return translator('slot', { slotName: protocolHardware.slot })
  }
}

const getHardwareName = (protocolHardware: ProtocolHardware): string => {
  if (protocolHardware.hardwareType === 'pipette') {
    return getPipetteNameSpecs(protocolHardware.pipetteName)?.displayName ?? ''
  } else {
    return getModuleDisplayName(protocolHardware.moduleModel)
  }
}

export const Hardware = (props: { protocolId: string }): JSX.Element => {
  const requiredProtocolHardware = useRequiredProtocolHardware(props.protocolId)
  const { t } = useTranslation('protocol_details')

  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>Location</TableHeader>
          <TableHeader>Hardware</TableHeader>
          <TableHeader>Connected Status</TableHeader>
        </tr>
      </thead>
      <tbody>
        {requiredProtocolHardware.map((hardware, id) => {
          const isConnected = hardware.connected
          return (
            <TableRow
              key={id}
              style={{
                backgroundColor: isConnected
                  ? COLORS.successBackgroundMed
                  : COLORS.warningBackgroundMed,
              }}
            >
              <TableDatum>{getHardwareLocation(hardware, t)}</TableDatum>
              <TableDatum>{getHardwareName(hardware)}</TableDatum>
              <TableDatum>
                {isConnected ? 'Connected' : 'Not Connected'}
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
