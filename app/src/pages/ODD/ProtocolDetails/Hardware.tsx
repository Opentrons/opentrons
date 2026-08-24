import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  LegacyStyledText,
  ModuleIcon,
  RobotInfoLabel,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  getModuleDeckLabel,
  getModuleDisplayName,
  getModuleType,
  GRIPPER_V1_2,
  MAGNETIC_BLOCK_FIXTURES,
  MAGNETIC_BLOCK_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import {
  useGripperDisplayName,
  usePipetteNameSpecs,
} from '/app/local-resources/instruments'
import { useRequiredProtocolHardware } from '/app/resources/protocols'

import { EmptySection } from './EmptySection'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type {
  ProtocolHardware,
  ProtocolPipette,
} from '/app/transformations/commands'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing8};
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  padding: 0 ${SPACING.spacing24} 0 ${SPACING.spacing24};
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

const useHardwareName = (
  protocolHardware: ProtocolHardware,
  t: TFunction
): string => {
  const gripperDisplayName = useGripperDisplayName(GRIPPER_V1_2)

  const pipetteDisplayName =
    usePipetteNameSpecs((protocolHardware as ProtocolPipette).pipetteName)
      ?.displayName ?? ''

  if (protocolHardware.hardwareType === 'gripper') {
    return gripperDisplayName
  } else if (protocolHardware.hardwareType === 'pipette') {
    return pipetteDisplayName
  } else if (
    protocolHardware.hardwareType === 'module' &&
    protocolHardware.comboFixtureId != null
  ) {
    return getFixtureDisplayName(t, protocolHardware.comboFixtureId)
  } else if (protocolHardware.hardwareType === 'module') {
    return getModuleDisplayName(protocolHardware.moduleModel)
  } else {
    return getFixtureDisplayName(t, protocolHardware.cutoutFixtureId)
  }
}

function HardwareItem({ hardware }: { hardware: ProtocolHardware }): ReactNode {
  const { t, i18n } = useTranslation(['protocol_details', 'deck_configuration'])

  const hardwareName = useHardwareName(hardware, t as TFunction)

  let location: JSX.Element = (
    <LegacyStyledText
      forwardedAs="p"
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
    >
      {i18n.format(getHardwareLocation(hardware, t as TFunction), 'titleCase')}
    </LegacyStyledText>
  )
  if (hardware.hardwareType === 'module') {
    location = (
      <RobotInfoLabel
        deckLabel={getModuleDeckLabel(
          getModuleType(hardware.moduleModel),
          hardware.slot
        )}
      />
    )
  } else if (hardware.hardwareType === 'fixture') {
    const cutoutDisplayName = getCutoutDisplayName(hardware.location.cutout)
    const slotName =
      hardware.cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
        ? `${cutoutDisplayName[0]}4`
        : cutoutDisplayName
    location = <RobotInfoLabel deckLabel={slotName} />
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
          <LegacyStyledText forwardedAs="p">{hardwareName}</LegacyStyledText>
        </Flex>
      </TableDatum>
    </TableRow>
  )
}

export const Hardware = (props: { protocolId: string }): ReactNode => {
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
              color={COLORS.grey60}
              paddingLeft={SPACING.spacing24}
              oddStyle="smallBodyTextSemiBold"
            >
              {i18n.format(t('location'), 'capitalize')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              color={COLORS.grey60}
              paddingLeft={SPACING.spacing24}
              oddStyle="smallBodyTextSemiBold"
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
