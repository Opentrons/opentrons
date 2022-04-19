import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  Text,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import { PipetteModelSpecs } from '@opentrons/shared-data'
import { ConfigurePipette } from '../../ConfigurePipette'
import { Slideout } from '../../../atoms/Slideout'

import type { Mount } from '../../../redux/pipettes/types'

interface PipetteSettingsSlideoutProps {
  robotName: string
  mount: Mount
  pipetteName: PipetteModelSpecs['displayName']
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const PipetteSettingsSlideout = (
  props: PipetteSettingsSlideoutProps
): JSX.Element | null => {
  const { pipetteName, mount, robotName, isExpanded, onCloseClick } = props
  const { t } = useTranslation('device_details')

  return (
    <Slideout
      title={t('pipette_settings', { pipetteName: pipetteName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Trans
          t={t}
          i18nKey={'these_are_advanced_settings'}
          components={{
            block: (
              <Text
                fontSize={TYPOGRAPHY.fontSizeLabel}
                paddingBottom={SPACING.spacingXS}
              />
            ),
          }}
        />
        <ConfigurePipette
          robotName={robotName}
          mount={mount}
          closeModal={onCloseClick}
        />
      </Flex>
    </Slideout>
  )
}
