import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { OT3_PIPETTES } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { PipetteSelect } from '../../molecules/PipetteSelect'

export type PipetteSelectionProps = React.ComponentProps<typeof PipetteSelect>

export function PipetteSelection(props: PipetteSelectionProps): JSX.Element {
  const { t } = useTranslation('change_pipette')
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText css={TYPOGRAPHY.h1Default} marginBottom={SPACING.spacing5}>
        {t('choose_pipette')}
      </StyledText>
      <Flex marginBottom="1.2rem">
        <PipetteSelect
          pipetteName={props.pipetteName}
          onPipetteChange={props.onPipetteChange}
          nameBlocklist={OT3_PIPETTES}
        />
      </Flex>
    </Flex>
  )
}
