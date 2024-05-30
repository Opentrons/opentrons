import * as React from 'react'
import capitalize from 'lodash/capitalize'
import head from 'lodash/head'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Trans, useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { DropTipWizardFlows, useDropTipWizardFlows } from '.'

import type { HostConfig } from '@opentrons/api-client'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { PipetteWithTip } from '.'

interface TipsAttachedModalProps {
  pipettesWithTip: PipetteWithTip[]
  host: HostConfig | null
  setTipStatusResolved: (onEmpty?: () => void) => Promise<void>
}

export const handleTipsAttachedModal = (
  props: TipsAttachedModalProps
): Promise<unknown> => {
  return NiceModal.show(TipsAttachedModal, {
    ...props,
  })
}

const TipsAttachedModal = NiceModal.create(
  (props: TipsAttachedModalProps): JSX.Element => {
    const { pipettesWithTip, host, setTipStatusResolved } = props
    const { t } = useTranslation(['drop_tip_wizard'])
    const modal = useModal()

    const { mount, specs } = head(pipettesWithTip) as PipetteWithTip
    const { showDTWiz, toggleDTWiz } = useDropTipWizardFlows()

    const tipsAttachedHeader: ModalHeaderBaseProps = {
      title: t('tips_are_attached'),
      iconName: 'ot-alert',
      iconColor: COLORS.yellow50,
    }

    const cleanUpAndClose = (): void => {
      modal.remove()
      setTipStatusResolved()
    }

    const is96Channel = specs.channels === 96
    const displayMountText = is96Channel ? '96-Channel' : capitalize(mount)

    return (
      <ApiHostProvider {...host} hostname={host?.hostname ?? null}>
        <Modal header={tipsAttachedHeader}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <StyledText as="p">
              <Trans
                t={t}
                i18nKey="remove_the_tips"
                values={{
                  mount: displayMountText,
                }}
                components={{
                  mount: <strong />,
                }}
              />
            </StyledText>
            <Flex gridGap={SPACING.spacing8}>
              <SmallButton
                flex="1"
                buttonType="secondary"
                buttonText={t('skip')}
                onClick={cleanUpAndClose}
              />
              <SmallButton
                flex="1"
                buttonText={t('begin_removal')}
                onClick={toggleDTWiz}
              />
            </Flex>
          </Flex>
        </Modal>
        {showDTWiz ? (
          <DropTipWizardFlows
            instrumentModelSpecs={specs}
            mount={mount}
            robotType={FLEX_ROBOT_TYPE}
            closeFlow={() => {
              toggleDTWiz()
              cleanUpAndClose()
            }}
          />
        ) : null}
      </ApiHostProvider>
    )
  }
)
