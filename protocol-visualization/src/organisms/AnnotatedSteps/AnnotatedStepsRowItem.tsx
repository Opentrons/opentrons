import { COLORS, Icon, StyledText } from '@opentrons/components'

import { AnnotatedGroup } from './AnnotatedGroup'
import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { RowComponentProps } from 'react-window'
import type { ItemData } from './index'

export function AnnotatedStepsRowItem(
  props: RowComponentProps<ItemData>
): JSX.Element {
  const { index, style, ariaAttributes, ...data } = props
  const row = data.rows[index]
  return (
    <div style={style} {...ariaAttributes}>
      <div className={styles.annotated_steps_row}>
        {row.type === 'group' ? (
          <AnnotatedGroup
            scrollTargetId={data.scrollTargetId}
            listElement={data.listElement}
            analysis={data.analysis}
            annotationType={row.annotationType}
            subCommands={row.group.subCommands}
            commandStartNumber={row.commandStartNumber}
            allRunDefs={data.allRunDefs}
            setSelectedCommand={data.setSelectedCommand}
            handlePause={data.handlePause}
            annotationDescription={row.annotationDescription}
          />
        ) : row.type === 'command' ? (
          <IndividualCommand
            scrollTargetId={data.scrollTargetId}
            listElement={data.listElement}
            fromGroup={false}
            command={row.command}
            isHighlighted={row.isHighlighted}
            analysis={data.analysis}
            allRunDefs={data.allRunDefs}
            setSelectedCommand={data.setSelectedCommand}
            commandNumber={row.commandNumber}
          />
        ) : (
          <div className={styles.annotated_steps_error_wrapper}>
            {row.errors.map(error => (
              <div
                className={styles.annotated_steps_error_container}
                key={error.id}
                onClick={() => {
                  data.onShowErrorDetails()
                }}
              >
                <div className={styles.annotated_steps_header}>
                  <Icon name="ot-alert" size="1rem" color={COLORS.red60} />
                  <StyledText
                    desktopStyle="captionSemiBold"
                    color={COLORS.red60}
                  >
                    {data.t('step_error')}
                  </StyledText>
                </div>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {error.detail}
                </StyledText>
              </div>
            ))}
            <div className={styles.annotated_steps_final_command}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {data.t('unable_to_show_steps_past_errors')}
              </StyledText>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
