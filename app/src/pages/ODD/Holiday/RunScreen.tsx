import { useEffect, useState } from 'react'

// oxlint-disable-next-line no-restricted-imports
import { useAllCommandsQuery } from '@opentrons/react-api-client'

import { useCurrentRunId } from '/app/resources/runs'

import { GrabbingPrize } from './GrabbingPrize'
import styles from './holiday.module.css'
import { Instructions } from './Instructions'
import { Snowflakes } from './Snowflakes'
import { RadialTimer } from './Timer'

import type { ReactNode } from 'react'

function TimerScreen(): ReactNode {
  const [start] = useState(Date.now())

  return (
    <div className={styles.background}>
      <div className={styles.timer_container}>
        <RadialTimer from={start} until={start + 30000} />
      </div>
      <Snowflakes count={100} />
    </div>
  )
}

export type GamePhase = 'loading' | 'instructions' | 'playing' | 'grabbing'

export function RunScreen(): ReactNode {
  const runId = useCurrentRunId()

  const [gamePhase, setGamePhase] = useState<GamePhase>('loading')

  const { data: commands } = useAllCommandsQuery(
    runId,
    {
      pageLength: 5,
    },
    {
      refetchInterval: 1000,
    }
  )
  useEffect(() => {
    if (!commands?.data) {
      console.log('no commands')
      return
    }
    if (
      gamePhase === 'playing' &&
      commands.data.some(
        command =>
          command.commandType === 'comment' &&
          command.params.message === 'grabbing'
      )
    ) {
      console.log('grabbing')
      setGamePhase('grabbing')
    }
    console.log('commands', commands.data)
  }, [commands, gamePhase])

  switch (gamePhase) {
    case 'loading':
    case 'instructions':
      return <Instructions setGamePhase={setGamePhase} />
    case 'playing':
      return <TimerScreen />
    case 'grabbing':
      return <GrabbingPrize />
  }
}
