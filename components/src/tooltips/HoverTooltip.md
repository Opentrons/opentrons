Basic usage:

```js
import { FlatButton } from '@opentrons/components'
;<HoverTooltip tooltipComponent={<div>Something Explanatory!</div>}>
  {hoverTooltipHandlers => (
    <FlatButton
      hoverTooltipHandlers={hoverTooltipHandlers}
      onClick={() => alert('you clicked me')}
    >
      {'Hover me!'}
    </FlatButton>
  )}
</HoverTooltip>
```

Specify Placement:

```js
import { FlatButton } from '@opentrons/components'
;<HoverTooltip
  placement="right"
  tooltipComponent={<div>Something Explanatory, but over here this time!</div>}
>
  {hoverTooltipHandlers => (
    <FlatButton
      hoverTooltipHandlers={hoverTooltipHandlers}
      onClick={() => alert('you clicked me')}
    >
      {'Hover me!'}
    </FlatButton>
  )}
</HoverTooltip>
```

Specify Placement (with override):

```js
import { FlatButton } from '@opentrons/components'
;<HoverTooltip
  placement="left"
  tooltipComponent={
    <div>
      Something explanatory that cannot go left so it defaults to right!
    </div>
  }
>
  {hoverTooltipHandlers => (
    <FlatButton
      hoverTooltipHandlers={hoverTooltipHandlers}
      onClick={() => alert('you clicked me')}
    >
      {'Hover me!'}
    </FlatButton>
  )}
</HoverTooltip>
```
