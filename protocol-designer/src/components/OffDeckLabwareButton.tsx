import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  LegacyPrimaryButton,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'
import { getSelectedTerminalItemId } from '../ui/steps'
import { i18n } from '../localization'
import { OffDeckLabwareSlideout } from './OffDeckLabwareSlideout'

export const OffDeckLabwareButton = (): JSX.Element => {
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)

  const [showSlideout, setShowSlideout] = React.useState<boolean>(false)

  return (
    <Flex position={POSITION_ABSOLUTE} right={SPACING.spacing16} zIndex={2}>
      <Flex position={POSITION_RELATIVE} padding={SPACING.spacing16}>
        <LegacyPrimaryButton onClick={() => setShowSlideout(true)}>
          {i18n.t('button.edit_off_deck')}
        </LegacyPrimaryButton>
      </Flex>
      {showSlideout ? (
        <OffDeckLabwareSlideout
          isExpanded={showSlideout}
          onCloseClick={() => setShowSlideout(false)}
          initialSetupTerminalItemId={
            selectedTerminalItemId === '__initial_setup__'
          }
        />
      ) : null}
    </Flex>
  )
}
