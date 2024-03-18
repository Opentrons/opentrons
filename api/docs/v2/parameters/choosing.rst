:og:description: Advice on choosing effective parameters in Opentrons Python protocols.

.. _good-rtps:

************************
Choosing Good Parameters
************************

The first decision you need to make when adding parameters to your protocol is "What should be parameterized?" Your goals in adding parameters should be the following:

1. **Add flexibility.** Accommodate changes from run to run or from lab to lab.
2. **Work efficiently.** Don't burden run setup with too many choices or confusing options.
3. **Avoid errors.** Ensure that every combination of parameters produces an analyzable, runnable protocol.

Consider what scientific task is at the heart of your protocol, and build parameters that contribute to, rather than diverge from it.

For example, it makes sense to add a parameter for number of samples to a protocol for a particular DNA prep reagent kit. But it wouldn't make sense to add a parameter for *which reagent kit* to use for DNA prep. That kind of parameter would affect so many aspects of the protocol that it would make more sense to maintain two protocols, one for each kit.

Also consider how a small number of parameters can combine to produce many useful outputs. Take the serial dilution task from the :ref:`tutorial` as an example. We could add just three parameters to it: number of dilutions, dilution factor, and number of rows. Now that single protocol can produce a whole plate that gradually dilutes, a 2×4 grid that rapidly dilutes, and *thousands* of other combinations.

The trick to choosing good parameters is reasoning through the choices the protocol's users may make. If any of them lead to nonsensical outcomes or errors, adjust the parameters — or how your protocol :ref:`uses parameter values <using-rtp>` — to avoid those situations.
