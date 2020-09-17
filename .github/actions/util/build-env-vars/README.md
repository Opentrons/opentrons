# util/build-env-vars: GH action for setting env vars in builds

This action sets up the environment variables for robot stack builds: OT_BRANCH, OT_TAG, and OT_BUILD_NUMBER. These are a pain to set up because they require text parsing stuff out of the github context, so they're stuffed into an action.

To make the action cross-platform enough, it's also written in javascript. This is fine but github actions are checked out and executed in place by github, so you need to check in node_modules. We don't want to do that, so instead, we're using the [recommended by github](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github) `@vercel/ncc` javascript tool.

## Updating and Committing
- Install ncc: `npm install -g @vercel/ncc`
- Compile `main.js`: `ncc build main.js`
- check in the changed file `dist/main.js`

The changed file is marked as binary in the `.gitattributes` file in this dir, so you'll just see `Binary file changed` rather than the diff.
