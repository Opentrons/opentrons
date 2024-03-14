import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { useToaster } from '../../organisms/ToasterOven'
import { useRequiredProtocolHardware } from '../Protocols/hooks'
import { EmptySection } from './EmptySection'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing8};
  margin: ${SPACING.spacing16} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  padding: ${SPACING.spacing4};
  color: ${COLORS.grey60};
`

const TableRow = styled('tr')`
  background-color: ${COLORS.grey35};
  border: 1px ${COLORS.white} solid;
  height: 4.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.borderRadius4};
    border-bottom-left-radius: ${BORDERS.borderRadius4};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadius4};
    border-bottom-right-radius: ${BORDERS.borderRadius4};
  }
`

export const Parameters = (props: { protocolId: string }): JSX.Element => {
  //  TODO(Jr, 3/14/24): replace hook with correct hook to get parameters
  const { requiredProtocolHardware } = useRequiredProtocolHardware(
    props.protocolId
  )
  const { makeSnackbar } = useToaster()
  const { t, i18n } = useTranslation('protocol_details')

  const makeSnack = (): void => {
    makeSnackbar(t('start_setup_customize_values'))
  }
  return requiredProtocolHardware.length === 0 ? (
    <EmptySection section="parameters" />
  ) : (
    <Table onClick={makeSnack}>
      <thead>
        <tr>
          <TableHeader>
            <StyledText
              css={TYPOGRAPHY.labelSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('name'), 'capitalize')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              css={TYPOGRAPHY.labelSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('default_value'), 'capitalize')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              css={TYPOGRAPHY.labelSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('range'), 'capitalize')}
            </StyledText>
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        <TableRow>
          <TableDatum>
            <Flex paddingLeft={SPACING.spacing24}>TODO</Flex>
          </TableDatum>
          <TableDatum>
            <Flex paddingLeft={SPACING.spacing24}>TODO</Flex>
          </TableDatum>
          <TableDatum>
            <Flex paddingLeft={SPACING.spacing24}>TODO</Flex>
          </TableDatum>
        </TableRow>
      </tbody>
    </Table>
  )
}
