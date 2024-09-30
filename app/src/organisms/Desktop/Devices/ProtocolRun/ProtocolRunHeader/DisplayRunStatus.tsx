import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  SPACING,
  Icon,
  Flex,
  StyledText,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'

import type { RunStatus } from '@opentrons/api-client'

interface DisplayRunStatusProps {
  runStatus: RunStatus | null
}

// Styles the run status copy.
export function DisplayRunStatus(props: DisplayRunStatusProps): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Flex alignItems={ALIGN_CENTER}>
      {props.runStatus === RUN_STATUS_RUNNING ? (
        <Icon
          name="circle"
          color={COLORS.blue50}
          size={SPACING.spacing4}
          marginRight={SPACING.spacing4}
          data-testid="running_circle"
        >
          <animate
            attributeName="fill"
            values={`${COLORS.blue50}; transparent`}
            dur="1s"
            calcMode="discrete"
            repeatCount="indefinite"
          />
        </Icon>
      ) : null}
      <StyledText desktopStyle="bodyDefaultRegular">
        {props.runStatus != null ? t(`status_${String(props.runStatus)}`) : ''}
      </StyledText>
    </Flex>
  )
}
