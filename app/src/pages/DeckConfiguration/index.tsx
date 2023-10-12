import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex } from '@opentrons/components'
import { ChildNavigation } from '../../organisms/ChildNavigation'

export function DeckConfiguration(): JSX.Element {
  const { t } = useTranslation('')

  return <Flex flexDirection={DIRECTION_COLUMN}></Flex>
}
