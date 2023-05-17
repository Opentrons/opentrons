import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import { StyledText } from '../../../atoms/text'
import { useRequiredProtocolHardware } from '../../Protocols/hooks'
import { EmptySection } from './EmptySection'

import type { ProtocolHardware } from '../../Protocols/hooks'
import type { TFunction } from 'react-i18next'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing4};
  margin: ${SPACING.spacing16} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  padding: ${SPACING.spacing4};
`

const TableRow = styled('tr')`
  background-color: ${COLORS.light1};
  border: 1px ${COLORS.white} solid;
  height: 4.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.size4};
    border-bottom-left-radius: ${BORDERS.size4};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.size4};
    border-bottom-right-radius: ${BORDERS.size4};
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
  const { t, i18n } = useTranslation('protocol_details')

  return requiredProtocolHardware.length === 0 ? (
    <EmptySection section="hardware" />
  ) : (
    <Table>
      <thead>
        <tr>
          <TableHeader>
            <StyledText
              fontSize={TYPOGRAPHY.fontSize20}
              color={COLORS.darkBlack70}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('location'), 'capitalize')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              fontSize={TYPOGRAPHY.fontSize20}
              color={COLORS.darkBlack70}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('hardware'), 'capitalize')}
            </StyledText>
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        {requiredProtocolHardware.map((hardware, id) => {
          return (
            <TableRow key={id}>
              <TableDatum>
                <StyledText
                  as="p"
                  color={COLORS.darkBlack100}
                  paddingLeft={SPACING.spacing24}
                >
                  {i18n.format(getHardwareLocation(hardware, t), 'capitalize')}
                </StyledText>
              </TableDatum>
              <TableDatum>
                <StyledText
                  as="p"
                  color={COLORS.darkBlack100}
                  paddingLeft={SPACING.spacing24}
                >
                  {getHardwareName(hardware)}
                </StyledText>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
