import * as React from 'react'
import { capitalize } from 'lodash'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Trans, useTranslation } from 'react-i18next'

import { Flex, LEGACY_COLORS, SPACING, DIRECTION_COLUMN } from '@opentrons/components'

import { useCloseCurrentRun } from '../ProtocolUpload/hooks'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'
import { DropTipWizard } from '.'

import type { PipetteData } from '@opentrons/api-client'
import type { PipetteModelSpecs, RobotType } from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface TipsAttachedModalProps {
  mount: PipetteData['mount']
  instrumentModelSpecs: PipetteModelSpecs
  robotType: RobotType
  onCloseClick?: (arg0: any) => void
}

export const handleTipsAttachedModal = (
  mount: TipsAttachedModalProps['mount'],
  instrumentModelSpecs: TipsAttachedModalProps['instrumentModelSpecs'],
  robotType: TipsAttachedModalProps['robotType'],
  onCloseClick: TipsAttachedModalProps['onCloseClick']
): Promise<unknown> => {
  return NiceModal.show(TipsAttachedModal, {
    mount,
    instrumentModelSpecs,
    robotType,
    onCloseClick,
  })
}

const TipsAttachedModal = NiceModal.create(
  (props: TipsAttachedModalProps): JSX.Element => {
    const { mount, onCloseClick, instrumentModelSpecs } = props
    const { t } = useTranslation(['drop_tip_wizard'])
    const modal = useModal()
    const [showWizard, setShowWizard] = React.useState(false)

    const { closeCurrentRun } = useCloseCurrentRun()

    const tipsAttachedHeader: ModalHeaderBaseProps = {
      title: t('tips_are_attached'),
      iconName: 'ot-alert',
      iconColor: COLORS.yellow50,
    }

    const is96Channel = instrumentModelSpecs.channels === 96
    const displayMountText = is96Channel ? '96-Channel' : capitalize(mount)

    return (
      <>
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
                onClick={() => {
                  onCloseClick?.([])
                  closeCurrentRun()
                  modal.remove()
                }}
              />
              <SmallButton
                flex="1"
                buttonText={t('begin_removal')}
                onClick={() => {
                  setShowWizard(true)
                }}
              />
            </Flex>
          </Flex>
        </Modal>
        {showWizard ? (
          <DropTipWizard
            {...props}
            closeFlow={() => {
              onCloseClick?.((pipettesWithTip: PipetteData[]) => {
                const newPipettesWithTip = pipettesWithTip.slice(1)
                if (newPipettesWithTip.length === 0) closeCurrentRun()
                return newPipettesWithTip
              })
              modal.remove()
            }}
          />
        ) : null}
      </>
    )
  }
)
