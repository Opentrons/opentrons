:og:description: Advice on choosing effective parameters in Opentrons Python protocols.

************************
Choosing Good Parameters
************************

The first decision you need to make when adding parameters to your protocol is "What should be parameterized?" Your goals in adding parameters should be the following:

1. **Add flexibility.** Accommodate changes from run to run or from lab to lab.
2. **Work efficiently.** Don't burden run setup with too many choices or confusing options.
3. **Avoid errors.** Ensure that every combination of parameters produces an analyzable, runnable protocol.

