:og:description: Advice on choosing effective parameters in Opentrons Python protocols.

.. _good-rtps:

************************
Choosing Good Parameters
************************

The first decision you need to make when adding parameters to your protocol is "What should be parameterized?" Your goals in adding parameters should be the following:

1. **Add flexibility.** Accommodate changes from run to run or from lab to lab.
2. **Work efficiently.** Don't burden run setup with too many choices or confusing options.
3. **Avoid errors.** Ensure that every combination of parameters produces an analyzable, runnable protocol.

The trick to choosing good parameters is reasoning through the choices the protocol's users may make. If any of them lead to nonsensical outcomes or errors, adjust the parameters — or how your protocol :ref:`uses parameter values <using-rtp>` — to avoid those situations.

Build on a Task
===============

Consider what scientific task is at the heart of your protocol, and build parameters that contribute to, rather than diverge from it.

For example, it makes sense to add a parameter for number of samples to a DNA prep protocol that uses a particular reagent kit. But it wouldn't make sense to add a parameter for *which reagent kit* to use for DNA prep. That kind of parameter would affect so many aspects of the protocol that it would make more sense to maintain a separate protocol for each kit.

Also consider how a small number of parameters can combine to produce many useful outputs. Take the serial dilution task from the :ref:`tutorial` as an example. We could add just three parameters to it: number of dilutions, dilution factor, and number of rows. Now that single protocol can produce a whole plate that gradually dilutes, a 2×4 grid that rapidly dilutes, and *thousands* of other combinations.

Consider Contradictions
=======================

Here's a common time-saving use of parameters: your protocol requires a 1-channel pipette and an 8-channel pipette, but it doesn't matter which mount they're attached to. Without parameters, you would have to assign the mounts in your protocol. Then if the robot is set up in the reverse configuration, you'd have to either physically swap the pipettes or modify your protocol.

One way to get this information is to ask which mount the 1-channel pipette is on, and which mount the 8-channel pipette is on. But if a technician answers "left" to both questions — even by accident — the API will raise an error, because you can't load two pipettes on a single mount. It's no better to flip things around by asking which pipette is on the left mount, and which pipette is on the right mount. Now the technician can say that both mounts have a 1-channel pipette. This is even more dangerous, because it *might not* raise any errors in analysis. The protocol could run "successfully" on a robot with two 1-channel pipettes, but produce completely unintended results.

The best way to avoid these contradictions is to collapse the two questions into one, with limited choices. Where are the pipettes mounted? Either the 1-channel is on the left and the 8-channel on the right, or the 8-channel is on the left and the 1-channel is on the right. This approach is best for several reasons:

- It avoids analysis errors.
- It avoids potentially dangerous execution errors.
- It only requires answering one question instead of two.
- The :ref:`phrasing of the question and answer <rtp-style>` makes it clear that the protocol requires exactly one of each pipette type.

Set Boundaries
==============

Numerical parameters support minimum and maximum values, which you should set to avoid incorrect inputs that are outside of your protocol's possibile actions.

Consider our earlier example of parameterizing serial dilution. Each of the three numerical parameters have logical upper and lower bounds, which we need to enforce to get sensible results.

- *Number of dilutions* must be between 0 and 11 on a 96-well plate. And it may make sense to require at least 1 dilution.
- *Dilution factor* is a ratio, which we can express as a decimal number that must be between 0 and 1.
- *Number of rows* must be between 1 and 8 on a 96-well plate.

What if you wanted to perform a dilution with 20 repetitions? It's possible with two 96-well plates, or with a 384-well plate. You could set the maximum for the number of dilutions to 24 and allow for these possibilities — either switching the plate type or loading an additional plate based on the provided value. 

But what if the technician wanted to do just 8 repetitions on a 384-well plate? That would require an additional parameter, an additional choice by the technician, and additional logic in your protocol code. It's up to you as the protocol author to decide if adding more parameters will make protocol setup overly difficult. Sometimes it's more efficient to work with two or three simple protocols rather than one that's long and complex.