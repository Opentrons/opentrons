import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'

import {
  DIRECTION_COLUMN,
  Flex,
  Modal,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { displayFeatureFlagsModalAtom } from '/ai-client/resources/atoms'

import { FeatureFlags } from '../FeatureFlags'

export function FeatureFlagsModal(): JSX.Element {
  const [, setDisplayFeatureFlagsModalAtom] = useAtom(
    displayFeatureFlagsModalAtom
  )
  const { t } = useTranslation('feature_flags')

  return (
    <Modal type="info" title={t('feature_flags_title')}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          paddingTop={`${SPACING.spacing8}`}
          paddingBottom={`${SPACING.spacing24}`}
        >
          {t('feature_flags_body')}
        </StyledText>
        <FeatureFlags />
        <PrimaryButton
          onClick={() => {
            setDisplayFeatureFlagsModalAtom(false)
          }}
        >
          {t('close')}
        </PrimaryButton>
      </Flex>
    </Modal>
  )
}
