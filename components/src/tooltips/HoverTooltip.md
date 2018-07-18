Basic usage:

```js
<HoverTooltip tooltipComponent={<div>Something Explanatory!</div>}>
  {(hoverTooltipHandlers) => (
    <FlatButton hoverTooltipHandlers={hoverTooltipHandlers} onClick={() => alert('you clicked me')}>
      {'Hover me!'}
    </FlatButton>
  )}
</HoverTooltip>
```
Specify Placement:

```js
<HoverTooltip placement="right" tooltipComponent={<div>Something Explanatory, but over here this time!</div>}>
  {(hoverTooltipHandlers) => (
    <FlatButton hoverTooltipHandlers={hoverTooltipHandlers} onClick={() => alert('you clicked me')}>
      {'Hover me!'}
    </FlatButton>
  )}
</HoverTooltip>
```
Specify Placement (with override):

```js
<HoverTooltip placement="left" tooltipComponent={<div>Something Explanatory that can't go left so it defaults to right!</div>}>
  {(hoverTooltipHandlers) => (
    <FlatButton hoverTooltipHandlers={hoverTooltipHandlers} onClick={() => alert('you clicked me')}>
      {'Hover me!'}
    </FlatButton>
  )}
</HoverTooltip>
```