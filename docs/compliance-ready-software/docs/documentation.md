---
title: "Documentation"
description: "Covers the concept of documenting user actions in Compliance Ready Software."
---

Required **documentation** is an important part of the Flex's Compliance Ready Software.  Whenever administrators and users make changes to modules, set up a protocol, detach a pipette, or run a protocol, they'll need to document their reason for doing so. 

Their documentation, along with their name and user ID, become a part of the [files](../records.md) your compliance ready Flex generates.

This section covers *how* users will add documentation and includes examples of when it's required. For a full list of user actions that require documentation, see the [Documented Actions](../docs/actions.md) appendix.

!!! note
    Opentrons Flex Compliance Ready Software adds required documentation checkpoints when you use and interact with the Flex. It's up to your lab to decide what suffient, audit-ready documentation looks like for you.

<!----
link to glossary
----->

## Adding documentation

Installing Opentrons Compliance Ready Software on your Flex slows down your lab's workflows on purpose. It adds checkpoints to document nearly every robot and protocol action. 

Your compliance ready Flex prompts users to document nearly every action they complete on the robot. They'll see a "Documentation required" screen, shown below.

<figure class="screenshot" markdown>
  ![Users should add documentation bfeore beginning protocol setup.](../../images/documentation-setup.png)
  <figcaption>Add documentation before beginning protocol setup.</figcaption>
</figure>

You'll see the same screen every time you need to add documentation, no matter which step you're on.

Each time, you'll have the option to use an on-screen, collapsible keyboard, or attach an [external keyboard](../devices.md) to the Flex.

** insert keyboard image from devices page**

When you're finished, click **Confirm** to save your text and move on.

## View actions

While working on the bench, your compliance ready Flex will prompt you many times to add documentation. In case you've stepped away, forgot which action you started, or simply want to view a list of every user action during your session, you can click **View Actions** in the upper right to open a list of actions.

<figure class="screenshot" markdown>
  ![View the list of actions still requiring documentation.](../../images/view-actions-list.png)
  <figcaption>View the list of actions you'll need to enter documentation for.</figcaption>
</figure>

Click each action to view its documentation. When you're finished, click **Confirm** to save your text and move to the next action.

## Documentation Settings

Administrators can customize documentation [settings](../features/settings.md) like minimum character requirements.

<!---------

TODO and comments: 
- confirm in the alpha whether documentation can be edited from the view actions list
- not included for now: double click to cut/copy/past text selections? is this included in the feature?
- any other documentation-related settings admins can customize, besides character limits (covered in settings) 
- minimum character requirements might be the only docs setting admins have control over. 
- view actions list different app vs odd? 
-------------->