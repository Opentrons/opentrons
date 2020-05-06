```js
const [state, setState] = React.useState({
  isChecked: false,
})
;<div>
  <ToggleField
    labelOff="Toggled Off"
    labelOn="Toggled On"
    className="display-block"
    onChange={() => setState({ ...state, isChecked: !state.isChecked })}
    value={state.isChecked}
  />
</div>
```
