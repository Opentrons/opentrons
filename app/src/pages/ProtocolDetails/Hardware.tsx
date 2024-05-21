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
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getModuleDisplayName,
  getModuleType,
  getFixtureDisplayName,
  GRIPPER_V1_2,
  MAGNETIC_BLOCK_FIXTURES,
  MAGNETIC_BLOCK_TYPE,
} from '@opentrons/shared-data'

import {
  useGripperDisplayName,
  usePipetteNameSpecs,
} from '../../resources/instruments/hooks'
import { useRequiredProtocolHardware } from '../Protocols/hooks'
import { EmptySection } from './EmptySection'

import type { ProtocolHardware, ProtocolPipette } from '../Protocols/hooks'
import type { TFunction } from 'i18next'

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
  background-color: ${COLORS.grey35};
  border: 1px ${COLORS.white} solid;
  height: 4.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.borderRadius8};
    border-bottom-left-radius: ${BORDERS.borderRadius8};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadius8};
    border-bottom-right-radius: ${BORDERS.borderRadius8};
  }
`

const getHardwareLocation = (
  protocolHardware: ProtocolHardware,
  translator: TFunction
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

// convert to anon

const useHardwareName = (protocolHardware: ProtocolHardware): string => {
  const gripperDisplayName = useGripperDisplayName(GRIPPER_V1_2)

  const pipetteDisplayName =
    usePipetteNameSpecs((protocolHardware as ProtocolPipette).pipetteName)
      ?.displayName ?? ''

  if (protocolHardware.hardwareType === 'gripper') {
    return gripperDisplayName
  } else if (protocolHardware.hardwareType === 'pipette') {
    return pipetteDisplayName
  } else if (protocolHardware.hardwareType === 'module') {
    return getModuleDisplayName(protocolHardware.moduleModel)
  } else {
    return getFixtureDisplayName(protocolHardware.cutoutFixtureId)
  }
}

function HardwareItem({
  hardware,
}: {
  hardware: ProtocolHardware
}): JSX.Element {
  const { t, i18n } = useTranslation('protocol_details')

  const hardwareName = useHardwareName(hardware)

  let location: JSX.Element = (
    <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
      {i18n.format(getHardwareLocation(hardware, t), 'titleCase')}
    </StyledText>
  )
  if (hardware.hardwareType === 'module') {
    location = <LocationIcon slotName={hardware.slot} />
  } else if (hardware.hardwareType === 'fixture') {
    location = (
      <LocationIcon slotName={getCutoutDisplayName(hardware.location.cutout)} />
    )
  }
  const isMagneticBlockFixture =
    hardware.hardwareType === 'fixture' &&
    hardware.cutoutFixtureId != null &&
    MAGNETIC_BLOCK_FIXTURES.includes(hardware.cutoutFixtureId)
  let iconModuleType = null
  if (hardware.hardwareType === 'module') {
    iconModuleType = getModuleType(hardware.moduleModel)
  } else if (isMagneticBlockFixture) {
    iconModuleType = MAGNETIC_BLOCK_TYPE
  }
  return (
    <TableRow>
      <TableDatum>
        <Flex paddingLeft={SPACING.spacing24}>{location}</Flex>
      </TableDatum>
      <TableDatum>
        <Flex paddingLeft={SPACING.spacing24}>
          {iconModuleType != null ? (
            <Flex
              alignItems={ALIGN_CENTER}
              height="2rem"
              paddingBottom={SPACING.spacing4}
              paddingRight={SPACING.spacing8}
            >
              <ModuleIcon moduleType={iconModuleType} size="1.75rem" />
            </Flex>
          ) : null}
          <StyledText as="p">{hardwareName}</StyledText>
        </Flex>
      </TableDatum>
    </TableRow>
  )
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
              color={COLORS.grey60}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('location'), 'capitalize')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              fontSize={TYPOGRAPHY.fontSize20}
              color={COLORS.grey60}
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
          return <HardwareItem key={id} hardware={hardware} />
        })}
      </tbody>
    </Table>
  )
}
