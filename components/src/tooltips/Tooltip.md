Basic usage:

```js
<Tooltip open={true} tooltipComponent={<div>Something Explanatory!</div>}>
  {props => <span ref={props.ref}>Look at my tooltip!</span>}
</Tooltip>
```

Component is controlled by the `open` prop:

```js
<Tooltip open={false} tooltipComponent={<div>Something Explanatory!</div>}>
  {props => <span ref={props.ref}>My tooltip is closed!</span>}
</Tooltip>
```

Specify Placement:

```js
<Tooltip
  open={true}
  placement="right"
  tooltipComponent={<div>Something Explanatory, but over here this time!</div>}
>
  {props => <span ref={props.ref}>Look at my tooltip!</span>}
</Tooltip>
```

Specify Placement (with override):

```js
<Tooltip
  open={true}
  placement="left"
  tooltipComponent={
    <div>
      Something explanatory that cannot go left so it defaults to right!
    </div>
  }
>
  {props => <span ref={props.ref}>Look at my tooltip!</span>}
</Tooltip>
```
