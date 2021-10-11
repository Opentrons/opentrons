import * as React from 'react'
import { Page } from '../../atoms/Page'
import { SessionHeader } from '../../organisms/SessionHeader'
import { RunDetails } from '../../organisms/RunDetails'
import { useFeatureFlag } from '../../redux/config'
import { RunLog } from './RunLog'
import {
  BORDER_WIDTH_DEFAULT,
  C_BLUE,
  C_WHITE,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_FLEX_END,
  LINE_HEIGHT_SOLID,
  PrimaryBtn,
  SPACING_1,
  SPACING_4,
  SPACING_AUTO,
} from '@opentrons/components'

export function Run(): JSX.Element {
  const isNewProtocolRunPage = useFeatureFlag('preProtocolFlowWithoutRPC')
  const cancelRunButton = (
    <Flex justifyContent={JUSTIFY_FLEX_END} marginLeft={SPACING_AUTO}>
      <PrimaryBtn
        onClick={() => console.log('Cancel Run')}
        backgroundColor={C_WHITE}
        color={C_BLUE}
        borderWidth={BORDER_WIDTH_DEFAULT}
        lineHeight={LINE_HEIGHT_SOLID}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginX={SPACING_4}
        paddingRight={SPACING_1}
        paddingLeft={SPACING_1}
      >
        Cancel Run
      </PrimaryBtn>
    </Flex>
  )

  return isNewProtocolRunPage ? (
    <RunDetails />
  ) : (
    <Page
      titleBarProps={{
        title: <SessionHeader />,
        rightNode: cancelRunButton,
      }}
    >
      <RunLog />
    </Page>
  )
}
