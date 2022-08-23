import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
import { OT3_PIPETTES } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { PipetteSelect } from '../../molecules/PipetteSelect'

export type PipetteSelectionProps = React.ComponentProps<typeof PipetteSelect>

export function PipetteSelection(props: PipetteSelectionProps): JSX.Element {
  const { t } = useTranslation('change_pipette')
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText as="h1" marginBottom={SPACING.spacing5}>
        {t('choose_pipette')}
      </StyledText>
      <PipetteSelect
        pipetteName={props.pipetteName}
        onPipetteChange={props.onPipetteChange}
        nameBlocklist={OT3_PIPETTES}
      />
    </Flex>
  )
}
