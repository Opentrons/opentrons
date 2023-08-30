import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Box,
  Btn,
  Flex,
  Icon,
  TYPOGRAPHY,
} from '@opentrons/components'

// TODO(bh, 2022-12-7): finish styling when designs finalized
export function BackButton({
  onClick,
  children,
}: React.HTMLProps<HTMLButtonElement>): JSX.Element {
  const history = useHistory()
  const { t } = useTranslation('shared')

  return (
    <Btn
      marginBottom="1rem"
      maxWidth="fit-content"
      // go back in the history stack if no click handler specified
      onClick={onClick != null ? onClick : () => history.goBack()}
    >
      <Flex alignItems={ALIGN_CENTER}>
        <Icon name="back" height="3rem" />
        <Box fontSize="2rem" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {/* render "Back" if no children given */}
          {children != null ? children : t('back')}
        </Box>
      </Flex>
    </Btn>
  )
}
