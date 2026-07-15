<!--
EXEMPLAR — Ideagen EHSQ Enterprise product documentation (real, from Ideagen Luminate help centre).
Source: "Understanding common fields", help.ideagen.com (EHSQ Enterprise / Miramar).
Archetype: reference.
Pure reference: term + definition lists grouped by category (Global / System / Custom). Terse, neutral, no procedure.
Use as few-shot for the PRODUCT-DOCS artifact. Imitate structure & neutral how-to voice, not the specific feature.
-->

# Understanding common fields

(13 July 2026).
Who is this article for?
Users who want to learn about common fields
No elevated permissions are required.
Common Fields are those that can be searched and reported on across multiple modules. There are three types of common fields:
- Global
- System
- Custom
## Global
These common fields are automatically created and populated for all modules:
-
Assigned Date: The date that the most recent assignment was made, through workflow progress or manual assignment.
-
Created By: The Person that initiated the object.
-
Created On: The date an object was initiated on.
-
Creation Process: The background process that created the object.
-
Last Updated By: The Person who most recently saved or completed workflow on an object. When this field is empty, the object is last updated by an automated process.
-
Last Updated On: The date the object was most recently saved or had workflow completed.
-
Last Updating Process: The name of the process that most recently updated the object.
-
Reporting Authority: The Reporting Authority the object is attached to.
-
Working Step: For workflow enabled modules, the workflow step that the object is currently in.
-
Working Task: For workflow enabled modules, the workflow task that the object is currently in. Each module has one or more Working Tasks associated with each Working Step.
-
Working Task Assignee: The Person or Organization that is currently assigned to the object.
## System
These common fields are automatically created, but must be mapped to a field in each module where the fields are in use:
-
Classified Information Label: The classification label displayed in search results.
-
Date Closed: The date the object was closed.
-
Description: The description of the object.
-
Due Date: The date the current workflow step or task is due.
-
Identifier: A unique code that is automatically generated for each object. May be mapped to a custom identifier field for the object.
-
Parent: The object that created this object. In Miramar standard workflow layout, this field is used to generate the process map.
-
Priority: A numeric priority value for the object.
-
Scheduled Date: The date the object is scheduled to be completed.
-
Severity: A Text field representing the severity of the object.
-
Status: The current state of an object.
-
Title: The title of the object.
System Generated Emails
The Title common field is used in system generated New Assignment and Upcoming and Overdue Assignments email notifications.
## Custom fields
Custom fields can be manually created for each subscriber. When they are created, they must be mapped to a field in each module where the fields are in use. These can be set up for the following types of header-level fields:
- Checkbox
- Date
- Numeric
- Text (including picklists, references to other objects, Persons, and Teams)
## Common field search caveat
When a reference field is used as a common field (e.g., a person or organization field), the list of available values for the SearchAPI filters will be limited to the current values of that field in the selected modules.
Example
The Organization module contains one hundred departments, with one being a Safety department. However, the Safety department has never been selected as one of the Responsible Group options in a Condition Report or Action module.
Let's say only seventy of the one hundred departments have been set as options in these two modules. When performing a multi-module search on these modules using the Responsible Group common field, thirty of the departments, including Safety, will not be available as a filter.
Stated differently, a filter cannot be set using values that are not present in the subset of data.
