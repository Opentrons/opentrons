Basic usage with the `useTooltip` hook:

```js
import { useTooltip } from '@opentrons/components'
const [targetProps, tooltipProps] = useTooltip()

;<>
  <span {...targetProps}>Target!</span>
  <Tooltip visible={true} {...tooltipProps}>
    Something Explanatory!
  </Tooltip>
</>
```

Getting a little fancier and overriding the placement:

```js
import {
  useTooltip,
  TOOLTIP_TOP,
  TOOLTIP_RIGHT,
  TOOLTIP_BOTTOM,
  TOOLTIP_LEFT,
} from '@opentrons/components'

const [placement, setPlacement] = React.useState(TOOLTIP_RIGHT)
const [targetProps, tooltipProps] = useTooltip({ placement })

;<>
  <span {...targetProps}>Target!</span>
  <Tooltip visible={true} {...tooltipProps}>
    Something Explanatory!
  </Tooltip>
  <div style={{ float: 'left', marginRight: '8rem' }}>
    {[TOOLTIP_TOP, TOOLTIP_RIGHT, TOOLTIP_BOTTOM, TOOLTIP_LEFT].map(p => (
      <label style={{ display: 'block' }}>
        <input
          type="radio"
          name="place"
          value={p}
          onChange={() => setPlacement(p)}
          checked={placement === p}
        />
        {p}
      </label>
    ))}
  </div>
</>
```

Basic usage with the `useHoverTooltip` hook:

```js
import { useHoverTooltip } from '@opentrons/components'
const [targetProps, tooltipProps] = useHoverTooltip()

;<>
  <span {...targetProps}>Hover me!</span>
  <Tooltip {...tooltipProps}>Something Explanatory!</Tooltip>
</>
```

`useHoverTooltip` can take `useTooltip` and `useHover` options:

```js
import {
  useHoverTooltip,
  TOOLTIP_RIGHT,
  TOOLTIP_FIXED,
} from '@opentrons/components'

const [targetProps, tooltipProps] = useHoverTooltip({
  placement: TOOLTIP_RIGHT,
  strategy: TOOLTIP_FIXED,
  enterDelay: 2000,
  leaveDelay: 1000,
})

;<>
  <span {...targetProps}>Hover me!</span>
  <Tooltip {...tooltipProps}>Something Explanatory!</Tooltip>
</>
```
