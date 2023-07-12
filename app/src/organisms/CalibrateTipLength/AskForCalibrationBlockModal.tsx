import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  Link,
  SPACING,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  PrimaryButton,
  SecondaryButton,
  CheckboxField,
} from '@opentrons/components'
import { useDispatch } from 'react-redux'

import styles from './styles.css'
import { labwareImages } from '../../organisms/CalibrationPanels/labwareImages'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { Portal } from '../../App/portal'
import { setUseTrashSurfaceForTipCal } from '../../redux/calibration'
import { StyledText } from '../../atoms/text'

import type { Dispatch } from '../../redux/types'

const BLOCK_REQUEST_EMAIL_BODY =
  '• Full name\n• Company or institution name\n• Shipping address\n• VAT ID (if outside the US)'
const BLOCK_REQUEST_URL = `mailto:support@opentrons.com?subject=Calibration%20Block%20Request&body=${encodeURIComponent(
  BLOCK_REQUEST_EMAIL_BODY
)}`
const CAL_BLOCK_LOAD_NAME = 'opentrons_calibrationblock_short_side_right'

interface Props {
  onResponse: (hasBlock: boolean) => void
  titleBarTitle: string
  closePrompt: () => void
}

export function AskForCalibrationBlockModal(props: Props): JSX.Element {
  const { t } = useTranslation(['robot_calibration', 'shared'])
  const [rememberPreference, setRememberPreference] = React.useState<boolean>(
    true
  )
  const dispatch = useDispatch<Dispatch>()

  const makeSetHasBlock = (hasBlock: boolean) => (): void => {
    if (rememberPreference) {
      dispatch(setUseTrashSurfaceForTipCal(!hasBlock))
    }
    props.onResponse(hasBlock)
  }

  return (
    <Portal level="top">
      <LegacyModalShell
        width="47rem"
        header={
          <WizardHeader
            title={t('tip_length_calibration')}
            onExit={props.closePrompt}
          />
        }
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing32}
          minHeight="25rem"
        >
          <Flex gridGap={SPACING.spacing8}>
            <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
              <StyledText as="h1" marginBottom={SPACING.spacing16}>
                {t('do_you_have_a_cal_block')}
              </StyledText>

              <Trans
                t={t}
                i18nKey="calibration_block_description"
                components={{
                  block: <StyledText as="p" marginBottom={SPACING.spacing8} />,
                  supportLink: (
                    <Link
                      external
                      href={BLOCK_REQUEST_URL}
                      css={TYPOGRAPHY.linkPSemiBold}
                    />
                  ),
                }}
              />
            </Flex>
            <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
              <img
                className={styles.block_image}
                src={labwareImages[CAL_BLOCK_LOAD_NAME]}
              />
            </Flex>
          </Flex>

          <Flex
            width="100%"
            marginTop={SPACING.spacing32}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <Flex alignItems={ALIGN_CENTER}>
              <CheckboxField
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRememberPreference(e.currentTarget.checked)
                }
                value={rememberPreference}
              />
              <StyledText as="p" marginLeft={SPACING.spacing8}>
                {t('shared:remember_my_selection_and_do_not_ask_again')}
              </StyledText>
            </Flex>
            <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
              <SecondaryButton onClick={makeSetHasBlock(false)}>
                {t('use_trash_bin')}
              </SecondaryButton>
              <PrimaryButton onClick={makeSetHasBlock(true)}>
                {t('use_calibration_block')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </Flex>
      </LegacyModalShell>
    </Portal>
  )
}
