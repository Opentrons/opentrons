---
title: "Documentation"
description: "Covers the concept of documenting user actions in Compliance Ready Software."
---

Required *documentation* is an important part of Opentrons Flex Compliance Ready Software.  Whenever administrators and users make changes to modules, set up a protocol, detach a pipette, or run a protocol, they'll need to document their reason for doing so. 

Their documentation, along with their name and user ID, become a part of the [files](../records.md) your compliance ready Flex generates.

This section covers *how* users will add documentation. For a full list of user actions that require documentation, see the [Documented Actions](../docs/actions.md) appendix.

!!! note
    Opentrons Flex Compliance Ready Software adds required documentation checkpoints to the Opentrons App and Flex touchscreen. It's up to your lab to decide what suffient, audit-ready documentation looks like for you.

<!----
TODO: link terms in italics to glossary
----->

## Adding documentation

Installing Opentrons Compliance Ready Software on your Flex slows down your lab's workflows on purpose. It adds checkpoints to document nearly every robot and protocol action. 

Your compliance ready Flex will prompt all users to document nearly every action they complete on the robot. On the Flex touchscreen, users can use the on-screen, collapsible keyboard to add text on the touchscreen.

<figure class="screenshot" markdown>
  ![Add documentation on the Flex touchscreen.](../images/documentation-required.png)
  <figcaption>Add documentation on the Flex touchscreen.</figcaption>
</figure>

!!! note
    The Flex touchscreen's on-screen keyboard includes features to make it easier for your lab to add documentation:

       * Tap the gray arrow on the right side to collapse the keyboard.
       * Double tap text to cut, copy, or paste.
   
    Flex also supports an [external keyboard](../docs/devices.md), attached via USB, to type documentation.

Users can also add text in the Opentrons App. Here, they can also view a list of documented actions on the right. 

<figure class="screenshot" markdown>
  ![Add documentation in the Opentrons App.](../images/documentation-required-app.png)
  <figcaption>Add documentation on the Flex touchscreen.</figcaption>
</figure>

You'll see the same screen on the Flex touchscreen and in the Opentrons App every time you need to add documentation, no matter which step you're on.

When you're finished, click **Confirm** to save your text and move on.

<!----
TODO: 
- I replaced dummy text for the list of actions for this image. need to make sure this text is realistic 
-  need to confirm that the documentation required screen pops up simultaneouly on BOTH odd and app in the alpha 
- add some language about how users are prompted to enter documentation AFTER each action? 
----->

## Viewing actions

While working on the bench, your compliance ready Flex will prompt you many times in the same workflow to add documentation. In case you've stepped away, forgot which action you started, or simply want to view a list of every user action during your session, you can click **View Actions** when adding documentation on the Flex touchscreen.

<figure class="screenshot" markdown>
  ![View the list of actions on the Flex touchscreen.](../images/view-actions-odd.png)
  <figcaption>View a list of actions requiring documentation on the Flex touchscreen.</figcaption>
</figure>

Click each action to view its documentation. When you're finished, click **Confirm** to save your text.

<!----
- may be confusing to say in the section ABOVE that users can view a list of actions, and then in this section introduce the concept? 
- can you actually click each action to view its documentation? on app and in ODD? confirm in alpha? and can you EDIT text here? 
- again, replaced dummy text for this image
----->

## Documentation Settings

Administrators can customize documentation settings in the Opentrons App. In **Robot Settings**, choose the **Compliance Ready** tab. Under **Audit log requirements**, administrators can update settings:  

*  **Require documentation for robot actions**: on by default.
*  **Minimum length of documentation for robot actions**: default of 20 characters.

See the complete list of administrator-customizable [settings](../docs/admin.md) for more.

<!----
- triple check that these settings can only be accessed from the app 
- add some text for the require documentation setting?... if this is off, does it just make documentation OPTIONAL? like does the screen still pop up? or does this stop all modals? 
----->