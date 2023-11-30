import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  LocationIcon,
  ModuleIcon,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  GRIPPER_V1,
  getCutoutDisplayName,
  getGripperDisplayName,
  getModuleDisplayName,
  getModuleType,
  getPipetteNameSpecs,
  getFixtureDisplayName,
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
  border-spacing: 0 ${SPACING.spacing8};
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
    border-top-left-radius: ${BORDERS.borderRadiusSize4};
    border-bottom-left-radius: ${BORDERS.borderRadiusSize4};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadiusSize4};
    border-bottom-right-radius: ${BORDERS.borderRadiusSize4};
  }
`

const getHardwareLocation = (
  protocolHardware: ProtocolHardware,
  translator: TFunction<'protocol_details'>
): string => {
  if (protocolHardware.hardwareType === 'gripper') {
    return translator(`extension_mount`)
  } else if (protocolHardware.hardwareType === 'pipette') {
    return translator(`${protocolHardware.mount}_mount`)
  } else if (protocolHardware.hardwareType === 'module') {
    return translator('slot', { slotName: protocolHardware.slot })
  } else {
    return 'location unknown'
  }
}

const getHardwareName = (protocolHardware: ProtocolHardware): string => {
  if (protocolHardware.hardwareType === 'gripper') {
    return getGripperDisplayName(GRIPPER_V1)
  } else if (protocolHardware.hardwareType === 'pipette') {
    return getPipetteNameSpecs(protocolHardware.pipetteName)?.displayName ?? ''
  } else if (protocolHardware.hardwareType === 'module') {
    return getModuleDisplayName(protocolHardware.moduleModel)
  } else {
    return getFixtureDisplayName(protocolHardware.cutoutFixtureId)
  }
}

export const Hardware = (props: { protocolId: string }): JSX.Element => {
  const { requiredProtocolHardware } = useRequiredProtocolHardware(
    props.protocolId
  )
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
          let location: JSX.Element = (
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {i18n.format(getHardwareLocation(hardware, t), 'titleCase')}
            </StyledText>
          )
          if (hardware.hardwareType === 'module') {
            location = <LocationIcon slotName={hardware.slot} />
          } else if (hardware.hardwareType === 'fixture') {
            location = (
              <LocationIcon
                slotName={getCutoutDisplayName(hardware.location.cutout)}
              />
            )
          }
          return (
            <TableRow key={id}>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24}>{location}</Flex>
              </TableDatum>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24}>
                  {hardware.hardwareType === 'module' && (
                    <Flex
                      alignItems={ALIGN_CENTER}
                      height="2rem"
                      paddingBottom={SPACING.spacing4}
                      paddingRight={SPACING.spacing8}
                    >
                      <ModuleIcon
                        moduleType={getModuleType(hardware.moduleModel)}
                        size="1.75rem"
                      />
                    </Flex>
                  )}
                  <StyledText as="p">{getHardwareName(hardware)}</StyledText>
                </Flex>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
