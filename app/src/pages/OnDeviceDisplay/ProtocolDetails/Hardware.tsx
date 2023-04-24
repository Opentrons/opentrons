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
import type { ProtocolHardware } from '../../Protocols/hooks'
import type { TFunction } from 'react-i18next'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: separate
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing2};
  margin: ${SPACING.spacing4} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing2};
`

const TableRow = styled('tr')`
  background-color: ${COLORS.light_one};
  border: 1px ${COLORS.white} solid;
  height: 4.75rem;
`

const TableDatum = styled('td')`
  font-size: ${TYPOGRAPHY.fontSize22};
  font-weight: ${TYPOGRAPHY.lineHeight28};
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.size_four};
    border-bottom-left-radius: ${BORDERS.size_four};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.size_four};
    border-bottom-right-radius: ${BORDERS.size_four};
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
          <TableHeader>
            <StyledText
              color={COLORS.darkBlack_seventy}
              fontSize={TYPOGRAPHY.fontSize20}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              lineHeight={TYPOGRAPHY.lineHeight24}
              paddingLeft={SPACING.spacing5}
            >
              {t('location')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              color={COLORS.darkBlack_seventy}
              fontSize={TYPOGRAPHY.fontSize20}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              lineHeight={TYPOGRAPHY.lineHeight24}
              paddingLeft={SPACING.spacing5}
            >
              {t('hardware')}
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
                  color={COLORS.darkBlack_hundred}
                  lineHeight={TYPOGRAPHY.lineHeight28}
                  paddingLeft={SPACING.spacing5}
                >
                  {getHardwareLocation(hardware, t)}
                </StyledText>
              </TableDatum>
              <TableDatum>
                <StyledText
                  color={COLORS.darkBlack_hundred}
                  lineHeight={TYPOGRAPHY.lineHeight28}
                  paddingLeft={SPACING.spacing5}
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
