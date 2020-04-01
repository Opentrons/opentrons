`ClickOutside` is a "function as children" component that calls its `onClickOutside` whenever a user clicks outside of the child.

The `ref` parameter in the `children` function must be passed into the wrapped child component.

```js
const [state, setState] = React.useState({ timesClickedOutside: 0 })

function handleClickOutside() {
  setState({ timesClickedOutside: state.timesClickedOutside + 1 })
}

;<ClickOutside onClickOutside={handleClickOutside}>
  {({ ref }) => (
    <div
      ref={ref}
      style={{
        padding: '1em',
        backgroundColor: '#dadada',
        border: '2px solid blue',
      }}
    >
      You clicked outside this box {state.timesClickedOutside} times
    </div>
  )}
</ClickOutside>
```
