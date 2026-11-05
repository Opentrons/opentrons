import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import { NameQuickTransfer } from './NameQuickTransfer'

import type { ReactNode } from 'react'

interface SaveOrRunModalProps {
  onSave: (protocolName: string) => void
  onRun: () => void
}

export const SaveOrRunModal = (props: SaveOrRunModalProps): ReactNode => {
  const { t } = useTranslation('quick_transfer')
  const [showNameTransfer, setShowNameTransfer] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  return showNameTransfer ? (
    <NameQuickTransfer onSave={props.onSave} />
  ) : (
    <OddModal
      header={{
        title: t('run_quick_transfer_now'),
        iconName: 'ot-alert',
        iconColor: COLORS.yellow50,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <StyledText oddStyle="bodyTextRegular">
          {t('save_to_run_later')}
        </StyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            width="50%"
            buttonText={t('save_for_later')}
            disabled={isLoading}
            onClick={() => {
              setShowNameTransfer(true)
            }}
            buttonType="secondary"
          />
          <SmallButton
            width="50%"
            buttonText={t('run_now')}
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true)
              props.onRun()
            }}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
