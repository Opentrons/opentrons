// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  OutlineButton,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING_2,
  COLOR_WARNING,
  COLOR_ERROR,
  FONT_SIZE_CAPTION,
} from '@opentrons/components'

import styles from './styles.css'
import { SectionContentHalf } from '../layout'

export type MissingItemWarningProps = {|
  missingItem: string,
  urlLabel: string,
  url: string,
  isBlocking?: boolean,
|}

export function MissingItemWarning(props: MissingItemWarningProps): React.Node {
  const { missingItem, urlLabel, url, isBlocking = false } = props
  return (
    <SectionContentHalf className={styles.align_center}>
      <OutlineButton
        texttransform={TEXT_TRANSFORM_UPPERCASE}
        Component={Link}
        to={url}
         // this needs to be as a class because something about making a button
         // pretending to be a Link means that stuff specified in the css that's
         // passed to the link can't be overridden with props
        className={styles.width_auto}
      >
        {urlLabel}
      </OutlineButton>
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
