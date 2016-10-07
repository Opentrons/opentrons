# Opentrons API

## Introduction
Opentrons API is a versatile framework makes it incredibly easy to write protocols and command the robot. Using the API your protocols can be understood by our machines and read or modified by fellow non-programmer scientists. It's also an opportunity for you to learn a little bit Python.

## Basic Principles
**Human Readable**: API strikes a balance between human and machine readability of the protocol. Protocol written with Opentrons API sound similar to what the protocol will look in real life. For example:
```python
p200.aspirate(100, plate['A1']).dispense(plate['A2'])
```
Is exactly what you think it would do: 
* Take P200 pipette
* Aspirate 100 uL of liquid from well A1 on your plate
* Dispense everything into well A2 on the same plate

**Permissive**: everyone's process is different and we are not trying to impose our way of thinking on you. Instead, our API allows for different ways of expressing your protocol and adding fine details as you need them. 
For example:
```python
p200.aspirate(100, plate[0]).dispense(plate[1])
```
while using 0 or 1 instead of 'A1' and 'A2' will do just the same.

or

```python
p200.aspirate(100, plate[0].position(BOTTOM))
```
will aspirate 100, from the bottom of a well.

## What's next?
* Get yourself familiar with running [Opentrons API in Jupyter](running_in_jupyter.md).
* Write your [first API protocol](first_api_protocol.md).
* Learn some common [tips and tricks for API liquid handling](api_tips_and_tricks.md).
* Discover [full API documentation](full_documentation.md) for advanced API protocol writing.
