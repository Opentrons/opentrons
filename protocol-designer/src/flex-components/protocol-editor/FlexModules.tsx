import * as React from 'react'
import { Flex, DIRECTION_COLUMN, SPACING, Box } from '@opentrons/components'
import { i18n } from '../localization'
import { StyledText } from './StyledText'
import { css } from 'styled-components'
import { MiniCard } from '../../../app/src/molecules/MiniCard'
import OT3_PNG from '../../../app/src/assets/images/OT3.png'
import styles from './FlexComponents.css'

function FlexModulesComponent({ formProps }: any): JSX.Element {
  let isSelected = false

  function on2Click(): void {
    isSelected = true
  }

  const modules = [
    {
      name: 'Heater-Shaker GEN1',
      supporting_copy: 'supporting copy',
    },
    {
      name: 'Thermocycler GEN2',
      supporting_copy: 'supporting copy',
    },
    {
      name: 'Temperature GEN2',
      supporting_copy: 'supporting copy',
    },
    {
      name: 'Magnetic Block GEN1',
      supporting_copy: 'supporting copy',
    },
    {
      name: 'Gripper',
      supporting_copy: '',
    },
    {
      name: 'Trash Chute',
      supporting_copy: '',
    },
  ]

  return (
    <>
      <StyledText as="h2">
        {i18n.t('flex.modules_selection.heading')}
      </StyledText>

      <div className={styles.flex_sub_heading}>
        <>
          {modules.map(({ name, supporting_copy }) => {
            return (
              <>
                <div className={styles.mini_card}>
                  <MiniCard
                    onClick={on2Click}
                    isSelected={isSelected}
                    isError={false}
                  >
                    <img
                      src={OT3_PNG}
                      css={css`
                        width: 67px;
                        height: 54px;
                      `}
                    />
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      marginLeft={SPACING.spacing4}
                      marginTop={SPACING.spacing3}
                      marginBottom={SPACING.spacing4}
                    >
                      <StyledText as="h4">{name}</StyledText>
                      <Box>
                        <StyledText as="h4">{supporting_copy}</StyledText>
                      </Box>
                    </Flex>
                  </MiniCard>
                </div>
                <div className={styles.line_separator} />
              </>
            )
          })}
        </>
      </div>
    </>
  )
}

export const FlexModules = FlexModulesComponent
