import { ReactNode, useState } from 'react'
import styles from './holiday.module.css'
import { Snowflakes } from './Snowflakes'
import { RadialTimer } from './Timer'

export function RunScreen(): ReactNode {

    const [start, setStart] = useState(Date.now())

    
    return (
        <div className={styles.background}>
            <div className={styles.timer_container}>
                <RadialTimer
                    from={start}
                    until={start + 60000}
                />
            </div>
            <Snowflakes count={100} />
        </div>
    )
}