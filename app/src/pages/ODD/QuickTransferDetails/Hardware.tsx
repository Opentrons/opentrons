import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DeckInfoLabel,
  Flex,
  ModuleIcon,
  SPACING,
  LegacyStyledText,
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
} from '/app/local-resources/instruments'
import { useRequiredProtocolHardware } from '/app/resources/protocols'

import type {
  ProtocolHardware,
  ProtocolPipette,
} from '/app/transformations/commands'
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
    <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
      {i18n.format(getHardwareLocation(hardware, t as TFunction), 'titleCase')}
    </LegacyStyledText>
  )
  if (hardware.hardwareType === 'module') {
    location = <DeckInfoLabel deckLabel={hardware.slot} />
  } else if (hardware.hardwareType === 'fixture') {
    location = (
      <DeckInfoLabel
        deckLabel={getCutoutDisplayName(hardware.location.cutout)}
      />
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
          <LegacyStyledText as="p">{hardwareName}</LegacyStyledText>
        </Flex>
      </TableDatum>
    </TableRow>
  )
}

export const Hardware = (props: { transferId: string }): JSX.Element => {
  const { requiredProtocolHardware } = useRequiredProtocolHardware(
    props.transferId
  )
  const { t, i18n } = useTranslation('protocol_details')

  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>
            <LegacyStyledText
              fontSize={TYPOGRAPHY.fontSize20}
              color={COLORS.grey60}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('location'), 'capitalize')}
            </LegacyStyledText>
          </TableHeader>
          <TableHeader>
            <LegacyStyledText
              fontSize={TYPOGRAPHY.fontSize20}
              color={COLORS.grey60}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('hardware'), 'capitalize')}
            </LegacyStyledText>
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
