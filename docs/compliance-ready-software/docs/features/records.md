---
title: "Protocol log files"
description: "."
---

## Protocol log files

All Flex robots generate [log files] when idle, when running a protocol, or when performing robot actions like homing the gantry. Without compliance-ready software, users normally don't need to access these files, but have the option to download all logs as a `.zip` file. 

A compliance-ready Flex generates the same log files, but preserves audit-ready information: 

* **What** robot actions the Flex performed
* **Who** completed the action, with user ID and legal name
* **When** the Flex completed the action, with a precise UTC timestamp
* **Why** each action was performed, with documentation

On the Flex's touchscreen, click [insert here] to view all protocols loaded on the Flex, then click [insert here] to view the protocol's full run history. 

**image ** 

Run history includes completed, canceled, or failed protocol runs, and a date for each. 

Read more about [log files] in this manual, including downloading, exporting, and viewing logs from the Flex. 

<!---------

TODO: 
- need to better differentiate between run records and log files. this is confusing for me, so is going to continue to be confusing for users
- then, name this file and section accordingly, and update .yml file
- maybe run history? and if this is truly different from the log files, this header text should be moved elsehwere
- if run history itself isn't a new feature (which I'm not sure it is), combine that with the larger log files doc and differentiate at the beginning instead of in this separate file
- where did protocol `run records` come from? the Flex manual only uses `log files`
- Link to Flex manual > Advanced Operations > Flex log files
- do protocol cards on a regular flex include this much run history? or has some functionality been added for CRS? 
- is run history ever deleted? is it truly a "full" run history? 
-------------->