import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  ALIGN_END,
  Check,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { removeHint } from '../../../tutorial/actions'
import { getHint } from '../../../tutorial/selectors'
import { getMainPagePortalEl } from '../Portal'

import type { HintKey } from '../../../tutorial'

export const HintsModal = (): JSX.Element | null => {
  const { t, i18n } = useTranslation(['alert', 'shared'])
  const [rememberDismissal, setRememberDismissal] = useState<boolean>(false)
  const toggleRememberDismissal = useCallback(() => {
    setRememberDismissal(prevDismissal => !prevDismissal)
  }, [])
  const hintKey = useSelector(getHint)
  const dispatch = useDispatch()
  const handleRemoveHint = (hintKey: HintKey): void => {
    dispatch(removeHint(hintKey, rememberDismissal))
  }

  let hintContents: JSX.Element | null = null
  if (hintKey === 'thermocycler_lid_passive_cooling') {
    hintContents = (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t(`alert:hint.${hintKey}.body`)}
        </StyledText>
        <Flex marginLeft={SPACING.spacing16}>
          <ul>
            <li>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(`alert:hint.${hintKey}.li1`)}
              </StyledText>
            </li>
            <li>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(`alert:hint.${hintKey}.li2`)}
              </StyledText>
            </li>
          </ul>
        </Flex>
      </Flex>
    )
  } else if (hintKey === 'waste_chute_warning') {
    hintContents = (
      <StyledText desktopStyle="bodyDefaultRegular">
        {t(`hint.${hintKey}.body1`)}
      </StyledText>
    )
  }

  if (hintKey == null) {
    return null
  }

  return createPortal(
    <Modal
      marginLeft="0"
      type="warning"
      zIndexOverlay={15}
      title={t(`hint.${hintKey}.title`)}
      footer={
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
        >
          <Flex
            alignItems={ALIGN_CENTER}
            onClick={toggleRememberDismissal}
            gridGap={SPACING.spacing8}
          >
            <Check isChecked={rememberDismissal} color={COLORS.blue50} />
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('hint.dont_show_again')}
            </StyledText>
          </Flex>
          <Flex alignItems={ALIGN_END}>
            <PrimaryButton
              onClick={() => {
                handleRemoveHint(hintKey)
              }}
            >
              {i18n.format(t('shared:confirm'), 'capitalize')}
            </PrimaryButton>
          </Flex>
        </Flex>
      }
    >
      {hintContents}
    </Modal>,
    getMainPagePortalEl()
  )
}
