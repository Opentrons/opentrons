Basic usage:

```js
<DeprecatedTooltip
  open={true}
  tooltipComponent={<div>Something Explanatory!</div>}
>
  {props => <span ref={props.ref}>Look at my tooltip!</span>}
</DeprecatedTooltip>
```

Component is controlled by the `open` prop:

```js
<DeprecatedTooltip
  open={false}
  tooltipComponent={<div>Something Explanatory!</div>}
>
  {props => <span ref={props.ref}>My tooltip is closed!</span>}
</DeprecatedTooltip>
```

Specify Placement:

```js
<DeprecatedTooltip
  open={true}
  placement="right"
  tooltipComponent={<div>Something Explanatory, but over here this time!</div>}
>
  {props => <span ref={props.ref}>Look at my tooltip!</span>}
</DeprecatedTooltip>
```

Specify Placement (with override):

```js
<DeprecatedTooltip
  open={true}
  placement="left"
  tooltipComponent={
    <div>
      Something explanatory that cannot go left so it defaults to right!
    </div>
  }
>
  {props => <span ref={props.ref}>Look at my tooltip!</span>}
</DeprecatedTooltip>
```
