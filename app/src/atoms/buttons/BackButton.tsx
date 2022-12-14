import * as React from 'react'
import { useHistory } from 'react-router-dom'

import { ALIGN_CENTER, Box, Btn, Flex, Icon } from '@opentrons/components'

import { useTranslation } from 'react-i18next'

// TODO(bh, 2022-12-7): finish styling when designs finalized
export function BackButton(): JSX.Element {
  const history = useHistory()
  const { t } = useTranslation('shared')

  return (
    <Btn marginBottom="1rem">
      <Flex alignItems={ALIGN_CENTER} onClick={() => history.goBack()}>
        <Icon name="chevron-left" height="3rem" />
        <Box fontSize="2rem" fontWeight="700">
          {t('back')}
        </Box>
      </Flex>
    </Btn>
  )
}
