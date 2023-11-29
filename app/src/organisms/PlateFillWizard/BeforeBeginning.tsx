import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'

interface BeforeBeginningProps {
  handleProceed: () => void
}
export function BeforeBeginning(props: BeforeBeginningProps): JSX.Element {
  const { handleProceed } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])

  return (
    <Flex
      padding={SPACING.spacing32}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      height="100%"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex css={ODD_TITLE_STYLE}>
          {t('plate_fill_wizard_introduction')}
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SmallButton
          buttonText={i18n.format(t('shared:continue'), 'capitalize')}
          onClick={handleProceed}
        />
      </Flex>
    </Flex>
  )
}

const ODD_TITLE_STYLE = css`
  ${TYPOGRAPHY.level4HeaderSemiBold}
  margin-bottom: ${SPACING.spacing16};
`
