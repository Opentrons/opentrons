import type * as React from 'react'
import { pick } from 'lodash'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  StyledText,
  RESPONSIVENESS,
} from '@opentrons/components'

import { useCommandTextString } from './hooks'

import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'
import type { StyleProps } from '@opentrons/components'
import type { CommandTextData } from './types'

interface LegacySTProps {
  as?: React.ComponentProps<typeof LegacyStyledText>['as']
  modernStyledTextDefaults?: false
}

interface ModernSTProps {
  desktopStyle?: React.ComponentProps<typeof StyledText>['desktopStyle']
  oddStyle?: React.ComponentProps<typeof StyledText>['oddStyle']
  modernStyledTextDefaults: true
}

type STProps = LegacySTProps | ModernSTProps

interface BaseProps extends StyleProps {
  command: RunTimeCommand
  commandTextData: CommandTextData
  robotType: RobotType
  isOnDevice?: boolean
  propagateCenter?: boolean
  propagateTextLimit?: boolean
}
export function CommandText(props: BaseProps & STProps): JSX.Element | null {
  const { commandText, stepTexts } = useCommandTextString({
    ...props,
  })

  switch (props.command.commandType) {
    case 'thermocycler/runProfile': {
      return (
        <ThermocyclerRunProfile
          {...props}
          commandText={commandText}
          stepTexts={stepTexts}
        />
      )
    }
    default: {
      return <CommandStyledText {...props}>{commandText}</CommandStyledText>
    }
  }
}

const forwardSTProps = (props: STProps): STProps =>
  pick(props, ['as', 'oddStyle', 'desktopStyle', 'modernStyledTextDefaults'])

const isModernSTProps = (props: STProps): props is ModernSTProps =>
  props.hasOwnProperty('desktopStyle') ||
  props.hasOwnProperty('oddStyle') ||
  !!props.modernStyledTextDefaults

function CommandStyledText(
  props: STProps & {
    children: JSX.Element[] | JSX.Element | string
  } & StyleProps
): JSX.Element {
  if (isModernSTProps(props)) {
    return (
      <StyledText
        desktopStyle={props.desktopStyle ?? 'bodyDefaultRegular'}
        oddStyle={props.oddStyle ?? 'bodyTextRegular'}
        {...props}
      >
        {props.children}
      </StyledText>
    )
  } else {
    return (
      <LegacyStyledText as={props.as ?? 'p'} {...props}>
        {props.children}
      </LegacyStyledText>
    )
  }
}

type ThermocyclerRunProfileProps = BaseProps &
  STProps & {
    commandText: string
    stepTexts?: string[]
  }

function ThermocyclerRunProfile(
  props: ThermocyclerRunProfileProps
): JSX.Element {
  const {
    isOnDevice,
    propagateCenter = false,
    propagateTextLimit = false,
    commandText,
    stepTexts,
    ...styleProps
  } = props

  const shouldPropagateCenter = isOnDevice === true || propagateCenter
  const shouldPropagateTextLimit = isOnDevice === true || propagateTextLimit

  // TODO(sfoster): Command sometimes wraps this in a cascaded display: -webkit-box
  // to achieve multiline text clipping with an automatically inserted ellipsis, which works
  // everywhere except for here where it overrides this property in the flex since this is
  // the only place where CommandText uses a flex.
  // The right way to handle this is probably to take the css that's in Command and make it
  // live here instead, but that should be done in a followup since it would touch everything.
  // See also the margin-left on the <li>s, which is needed to prevent their bullets from
  // clipping if a container set overflow: hidden.
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      {...styleProps}
      alignItems={shouldPropagateCenter ? ALIGN_CENTER : undefined}
      css={`
        @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
          display: flex !important;
        } ;
      `}
    >
      <CommandStyledText
        {...forwardSTProps(props)}
        marginBottom={SPACING.spacing4}
        {...styleProps}
      >
        {commandText}
      </CommandStyledText>
      <CommandStyledText
        {...forwardSTProps(props)}
        marginLeft={SPACING.spacing16}
      >
        <ul>
          {shouldPropagateTextLimit ? (
            <li
              css={`
                margin-left: ${SPACING.spacing4};
              `}
            >
              {stepTexts?.[0]}
            </li>
          ) : (
            stepTexts?.map((step: string, index: number) => (
              <li
                css={`
                  margin-left: ${SPACING.spacing4};
                `}
                key={index}
              >
                {' '}
                {step}
              </li>
            ))
          )}
        </ul>
      </CommandStyledText>
    </Flex>
  )
}
