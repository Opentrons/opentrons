import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  SecondaryBtn,
  Text,
  SPACING_2,
  COLOR_WARNING,
  COLOR_ERROR,
  FONT_SIZE_CAPTION,
} from '@opentrons/components'

import styles from './styles.css'
import { SectionContentHalf } from '../../../atoms/layout'

export interface MissingItemWarningProps {
  missingItem: string
  urlLabel: string
  url: string
  isBlocking?: boolean
}

export function MissingItemWarning(
  props: MissingItemWarningProps
): JSX.Element {
  const { missingItem, urlLabel, url, isBlocking = false } = props
  return (
    <SectionContentHalf className={styles.align_center}>
      <SecondaryBtn as={Link} to={url}>
        {urlLabel}
      </SecondaryBtn>
      <Text
        marginTop={SPACING_2}
        fontSize={FONT_SIZE_CAPTION}
        color={isBlocking ? COLOR_ERROR : COLOR_WARNING}
      >
        {missingItem} is missing
      </Text>
    </SectionContentHalf>
  )
}
