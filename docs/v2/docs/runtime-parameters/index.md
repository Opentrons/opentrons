---
title: "Python API: Runtime Parameters"
---

Runtime parameters let you define user-customizable variables in your Python protocols. This gives you greater flexibility and puts extra control in the hands of the technician running the protocol — without forcing them to switch between lots of protocol files or write code themselves.

This section begins with the fundamentals of runtime parameters:

- Preliminary advice on how to [choose good parameters](choosing.md), before you start writing code.
- The syntax for [defining parameters](defining.md) with boolean, numeric, and string values.
- How to [use parameter values](using-values.md) in your protocol, building logic and API calls that implement the technician's choices.

It continues with a selection of use cases and some overall style guidance. When adding parameters, you are in charge of the user experience when it comes time to set up the protocol! These pages outline best practices for making your protocols reliable and easy to use.

- [Use case – sample count](use-case-sample-count.md): Change behavior throughout a protocol based on how many samples you plan to process. Setting sample count exactly saves time, tips, and reagents.
- [Use case – dry run](use-case-dry-run.md): Test your protocol, rather than perform a live run, just by flipping a toggle.
- [Use case – cherrypicking](use-case-cherrypicking.md): Use a CSV file to specify locations and volumes for a simple cherrypicking protocol.
- [Style and usage](style.md): When you're a protocol author, you write code. When you're a parameter author, you write words. Follow this advice to make things as clear as possible for the technicians who will run your protocol.
