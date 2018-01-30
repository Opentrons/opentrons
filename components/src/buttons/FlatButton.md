Basic usage:

```js
<FlatButton onClick={() => alert('you clicked me')}>
  {'Click me!'}
</FlatButton>
```

Disabled:

```js
<FlatButton onClick={() => alert("can't click me")} disabled>
  {"Can't click"}
</FlatButton>
```

With icon:

```js
<FlatButton onClick={() => alert('you clicked me')} iconName='flask'>
  {'Click me!'}
</FlatButton>
```
