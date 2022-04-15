import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { LEFT, RIGHT } from '../../../redux/pipettes'
import {
  Box,
  Flex,
  Text,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING,
  FONT_WEIGHT_REGULAR,
  FONT_SIZE_CAPTION,
  TYPOGRAPHY,
  COLORS,
  useOnClickOutside,
  InstrumentDiagram,
} from '@opentrons/components'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { PipetteOverflowMenu } from './PipetteOverflowMenu'

import type {
  Mount,
  AttachedPipettesByMount,
} from '../../../redux/pipettes/types'

interface PipetteCardProps {
  leftPipette?: AttachedPipettesByMount['left']
  rightPipette?: AttachedPipettesByMount['right']
}

const IMAGE_CSS = css`
  transform: scale(0.3);
  width: 50px;
  height: 50px;
  transform-origin: 20% -10%;
`

export const PipetteCard = (props: PipetteCardProps): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const [showOverflowMenu, setShowOverflowMenu] = React.useState(false)
  const { leftPipette, rightPipette } = props

  const pipetteOverflowWrapperRef = useOnClickOutside({
    onClickOutside: () => setShowOverflowMenu(false),
  }) as React.RefObject<HTMLDivElement>

  let mount: Mount = 'left'
  let pipetteName: string = t('empty')
  if (leftPipette != null) {
    pipetteName = leftPipette.modelSpecs.displayName
    mount = 'left'
  } else if (rightPipette != null) {
    pipetteName = rightPipette.modelSpecs.displayName
    mount = 'right'
  } else if (leftPipette === null) {
    mount = 'left'
  } else if (rightPipette === null) {
    mount = 'right'
  }

  return (
    <>
      <Flex
        backgroundColor={COLORS.background}
        borderRadius={SPACING.spacing2}
        marginBottom={SPACING.spacing3}
        marginLeft={SPACING.spacing2}
        marginRight={SPACING.spacing2}
        width={'100%'}
        data-testid={`PipetteCard_${pipetteName}`}
      >
        <Box
          padding={`${SPACING.spacing4} ${SPACING.spacing3} ${SPACING.spacing4} ${SPACING.spacing3}`}
          width="100%"
        >
          <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING.spacing3}>
            <Flex alignItems={ALIGN_START}>
              {leftPipette === null || rightPipette === null ? null : (
                <InstrumentDiagram
                  pipetteSpecs={
                    leftPipette?.modelSpecs ?? rightPipette?.modelSpecs
                  }
                  mount={leftPipette != null ? LEFT : RIGHT}
                  css={IMAGE_CSS}
                />
              )}
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingLeft={SPACING.spacing3}
            >
              <Text
                textTransform={TEXT_TRANSFORM_UPPERCASE}
                color={COLORS.darkGrey}
                fontWeight={FONT_WEIGHT_REGULAR}
                fontSize={FONT_SIZE_CAPTION}
                paddingBottom={SPACING.spacing2}
                data-testid={`PipetteCard_mount_${pipetteName}`}
              >
                {t('mount', { side: mount === 'left' ? 'left' : 'right' })}
              </Text>
              <Flex
                paddingBottom={SPACING.spacing2}
                data-testid={`PipetteCard_display_name_${pipetteName}`}
              >
                <Text fontSize={TYPOGRAPHY.fontSizeP}>{pipetteName}</Text>
              </Flex>
            </Flex>
          </Flex>
        </Box>
        <Box
          alignSelf={ALIGN_START}
          padding={SPACING.spacing2}
          data-testid={`PipetteCard_overflow_btn_${pipetteName}`}
        >
          <OverflowBtn
            aria-label="overflow"
            onClick={() => {
              setShowOverflowMenu(prevShowOverflowMenu => !prevShowOverflowMenu)
            }}
          />
        </Box>
        {showOverflowMenu && (
          <div
            ref={pipetteOverflowWrapperRef}
            data-testid={`PipetteCard_overflow_menu_${pipetteName}`}
          >
            <PipetteOverflowMenu pipetteName={pipetteName} mount={mount} />
          </div>
        )}
      </Flex>
    </>
  )
}
