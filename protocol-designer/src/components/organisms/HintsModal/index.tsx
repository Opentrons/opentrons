import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
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

import { removeHint } from '/protocol-designer/tutorial/actions'
import { getHint } from '/protocol-designer/tutorial/selectors'

import { getMainPagePortalEl } from '../Portal'

import type { PropsWithChildren, ReactNode } from 'react'
import type { HintKey } from '/protocol-designer/tutorial'

export const HintsModal = (): ReactNode => {
  const { t, i18n } = useTranslation(['alert', 'shared'])
  const [rememberDismissal, setRememberDismissal] = useState<boolean>(false)
  const toggleRememberDismissal = useCallback(() => {
    setRememberDismissal(prevDismissal => !prevDismissal)
  }, [])
  const hint = useSelector(getHint)
  const dispatch = useDispatch()
  const handleRemoveHint = (hintKey: HintKey): void => {
    dispatch(removeHint(hintKey, rememberDismissal))
  }

  if (hint == null) {
    return null
  }

  const i18nValues = {
    temperature: 'targetTemperature' in hint ? hint.targetTemperature : null,
  }

  let hintContents: JSX.Element | null = null
  if (hint.hintKey === 'thermocycler_lid_passive_cooling') {
    hintContents = (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t(`alert:hint.${hint.hintKey}.body`)}
        </StyledText>
        <Flex marginLeft={SPACING.spacing16}>
          <ul>
            <li>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(`alert:hint.${hint.hintKey}.li1`)}
              </StyledText>
            </li>
            <li>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(`alert:hint.${hint.hintKey}.li2`)}
              </StyledText>
            </li>
          </ul>
        </Flex>
      </Flex>
    )
  } else if (hint.hintKey === 'waste_chute_warning') {
    hintContents = (
      <StyledText desktopStyle="bodyDefaultRegular">
        {t(`alert:hint.${hint.hintKey}.body1`)}
      </StyledText>
    )
  } else if (
    hint.hintKey === 'wait_for_heater_shaker_temp' ||
    hint.hintKey === 'wait_for_temperature_module_temp' ||
    hint.hintKey === 'wait_for_thermocycler_block_temp' ||
    hint.hintKey === 'wait_for_thermocycler_lid_temp' ||
    hint.hintKey === 'wait_for_thermocycler_profile'
  ) {
    const bodyParagraphs = (
      <Trans
        t={t}
        i18nKey={`alert:hint.${hint.hintKey}.body`}
        values={i18nValues}
        components={{ p: <BodyParagraph /> }}
      />
    )
    hintContents = (
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        {bodyParagraphs}
      </Flex>
    )
  }

  return createPortal(
    <Modal
      type="warning"
      zIndexOverlay={15}
      title={t(`hint.${hint.hintKey}.title`, i18nValues)}
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
                handleRemoveHint(hint.hintKey)
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

function BodyParagraph({ children }: PropsWithChildren): JSX.Element {
  return (
    <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.black90}>
      {children}
    </StyledText>
  )
}
