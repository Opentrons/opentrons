import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'

import { LabwareOffsetsTable } from '/app/organisms/LabwareOffsetsTable'

import type { ProtocolSetupOffsetsProps } from '/app/organisms/ODD/ProtocolSetup'

export function SetupOffsetsTable(
  props: ProtocolSetupOffsetsProps
): JSX.Element {
  return (
    <Flex css={TABLE_CONTAINER_STYLE}>
      <LabwareOffsetsTable {...props} />
    </Flex>
  )
}

const TABLE_CONTAINER_STYLE = css`
  padding: ${SPACING.spacing32} ${SPACING.spacing60};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
`
