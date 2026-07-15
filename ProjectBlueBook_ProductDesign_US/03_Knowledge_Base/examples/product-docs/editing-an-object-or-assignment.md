<!--
EXEMPLAR — Ideagen EHSQ Enterprise product documentation (real, from Ideagen Luminate help centre).
Source: "Editing an object or assignment", help.ideagen.com (EHSQ Enterprise / Miramar).
Archetype: conceptual + reference.
Longer conceptual doc: explains the object model, layout variants, small-screen behaviour, toolbar options. Good for docs that orient before instructing.
Use as few-shot for the PRODUCT-DOCS artifact. Imitate structure & neutral how-to voice, not the specific feature.
-->

# Editing an object or assignment

(13 July 2026).
Who is this article for?
Ideagen EHS - Enterprise and Decani Users
No elevated permissions are required.
This article covers general features common to all assignment objects. For detailed information regarding specific fields or workflow steps, please consult the help documentation or job aids designed for your solution.
Behind the scenes, data is collected in a module.  Object pulls information from the different modules using rules and field behaviors settings to display the information a user would need to complete an assignment.
Tasks and assignments are objects that have been assigned to a user. These objects are also referred to as the records within a solution. A list of assignment objects can be found on the home page's default dashboard under the Assignment dashboard component and is displayed as a saved search reports.
Fields and behaviours differ considerably depending on the purpose of your solution and the specific workflow step. Some assignments may be related to tasks, while others pertain to review and approval processes.
Mark as unread
The assignment component on seen on the Default Dashboard, allows a user to sort assignments by View All, View Unread, View Overdue. An object that has been viewed could be changed to Mark Unread, by selecting the Options button on the toolbar when available.
## Object Layouts
### Standard Workflow Layout
Workflow-enabled Miramar modules using the Standard Workflow Layout (SWL) provide a consistent experience for the user. For a detailed description of the different SWL features, visit Navigating the Standard Workflow Layout (SWL).
### Model Templates
The most common use of a model template is as a prepopulated form to create a new object. For a detailed description of a Model Template, visit Creating model templates.
### Small Screen Layouts
The standard object screen is capable of automatically adapting to a Small Screen layout whenever the user session detects that the screen width is less than 700 pixels. This Small Screen layout has been specifically designed to enhance the user experience on devices with limited screen space.
The Toolbar Buttons are accessible as menu items within the Tools menu and the Back button retains its traditional position.
(Click the images to enlarge)
Options located on the left-side toolbar, including Home, Search, Dashboards, and Reports, are available in the dropdown menu of the left-side header.
Dashboard regions will be displayed vertically, while object regions will be shown in full and will not be collapsible. This behaviour is consistent across all child-level fields as well.
Fields are presented inline, without prompts for the remaining fields. The styling of other field types, including checkboxes and radio buttons, remains consistent with the existing layouts.
Child levels will either present an expansion panel with a visible name or, in the absence of a name, display the full field in a non-collapsible format. Child level grids should employ horizontal scrolling to maintain a functional display, ensuring that cells are not diminished to an unusable size.
For users who are anonymous, only the primary button will be displayed to streamline the focus area and enhance usability.
## Object Workflows
A workflow refers to the series of sequential steps or actions that are undertaken to move an object or record from the initial stage through to the completion of a particular working process. It encompasses all the tasks, decisions, and activities that need to be performed to achieve the desired outcome during a specific order or at a specific time.  This ensures that the process is organized and efficient from start to finish.
The workflow card is a graphical representation of an object's workflow steps and tasks in the business process.
## Object Toolbar Buttons
An object's toolbar shows a set of buttons that change depending on the specific workflow rules in place. This means the user interface (UI) is designed to suit the current task, making sure only the most relevant options are available to the user who is currently assigned to the object.
By adjusting the buttons shown, the tool improves usability and efficiency, helping users focus on the actions that matter most for their workflow. This adaptable design not only makes the process smoother but also helps reduce errors by guiding users towards the right choices based on the workflow rules.
-
Create New - Users have the capability to create new module objects to fulfil specific business process requirements, such as reporting an incident, generating an action assignment, recording an observation, and so forth. These new objects may be automatically generated through rules and behaviours or manually initiated by a user. Additionally, the option to allow anonymous creation of new objects can be configured.
-
Save - This function allows for the preservation of modifications made to the object. It executes your defined rules, calculations, and any other components integral to the process flow.
-
Submit/Complete (Ctrl+Enter) - This action finalizes the current task, executes calculations, and transitions the object to the subsequent task or to the Close state. The sole distinction between [Submit] and [Complete] is that [Submit] is displayed by default when the object is newly created or remains in the Initiate state. The text associated with this button can be customized according to each object and workflow task, allowing for a more specific designation relevant to your area.
-
Export (Ctrl+Alt+P) - This function can generate a downloadable PDF version of the object if required. A dropdown menu allows for multiple print templates that can be configured.
-
Act as Assignee - This button is commonly referred to as "Edit". Unless the configuration of your object explicitly prevents it, you may click this button to act on behalf of the individual assigned to the currently active task (historical records will still reflect you as the individual making the modification). This button will not be visible under the following circumstances:
- If the object is hard-locked (pessimistic locking is enabled and another user has it open).
- If the object is read-only and is being accessed via a shared link.
- If the end-user is the current assignee or if the object has not yet been submitted.
- If workflow is not enabled for the object.
- If the status of the object is Closed, On Hold, or Cancelled.
-
Rollback - Users are required to provide a comment when reverting an object. This action may also be referred to as [Reopen], [Reopen Item], or [Reopen Tasks]:
-
Reopen - This is a non-workflow object, and the object is currently closed. It is typically restricted to administrators, the originator, or an alternate for the originator.
-
Reopen Tasks - This is a workflow object that permits the reopening of tasks.
-
Reopen Item - This is a workflow object where the object is closed, tasks are available for reopening, and the user is designated as a superuser.
-
Reopen Tasks - This is a workflow object where the object is in a read-only state, tasks are available for reopening, and the user is designated as a superuser.
-
Options - A dropdown menu can contain actions that are less commonly used. Many of these are only available when the object or the user has the proper rules:
-
History - Opens a history screen that displays how the object's data has changed over time.
-
Mark Unread - Marks the object as unread so it will appear as bold on your assignments list.
-
Cancel - Sets the object to status "Cancelled". Visible if you have the appropriate role. This action cannot be undone.
-
Delete - After confirmation, it will delete the object. Visible if you have the appropriate role. In general, we recommend this option is not available to users since it cannot be undone and it does not check to see if other objects reference the object you're deleting, so you could be left with orphaned objects. Therefore, this action should only be performed by users who know what they are doing.
-
Hold - Sets the object to status "Held". This is not commonly used. Visible if you have the appropriate role.
Homepage features and toolbars
When working with an object, you will notice that many of the navigation features and toolbars on the homepage remain consistent. This continuity ensures that users can navigate seamlessly without having to adjust to different controls or layouts.
## Object Modifiability
Object modifiability is governed by specific rules and role-based permissions:
- General Rules:
- Objects with workflow are only modifiable by users assigned to work on them.
- Assignees are either individuals or teams (or their alternates).
- Objects without workflow are only modifiable by users who either created them or those with elevated roles that allow them to “Create new items from the dashboard” (or their alternates).
- Exceptions to the Rules:
- Objects are modifiable by users who have been granted editing rights by users who have chosen to share the object.
- Objects are modifiable to users who have a role with the "Edit any item, including those assigned to others" privilege.
- Objects are not modifiable when they are locked for editing by another user and Pessimistic Object Locking (Hard Locking) is enabled for the associated object.
Object Locking Options - Pessimistic and Optimistic
Each module can be configured to use one of two object locking options.
- A module configured for Pessimistic locking prevents any user or process from updating (saving) an object that is currently open. Under Pessimistic locking, an object is secured as soon as a user opens it. Anyone opening it after the initial user cannot save their changes.
- Conversely, when a module is set to Optimistic locking, a user or process is permitted to open and save an object, even if it is already open by another user. Any unsaved modifications made by the first user will be lost if the second user saves the object.
### Modifiability Indicators
To help users quickly identify which fields and controls are editable, the system uses distinct visual cues:
-
Character Fields: If the background of a character field is shaded, this indicates that the field is non-modifiable. Editable fields typically have a clear or white background.
-
Interactive Controls: Non-modifiable checkboxes, radio buttons, and picklist tags appear muted, with lighter outlines or subdued colors. In contrast, modifiable controls are styled with bold outlines and vibrant colors, clearly signaling that the user can interact with them
These visual distinctions support intuitive navigation and reduce errors by making the modifiability status immediately recognizable.
## Adding attachments
When an application is configured to allow attachments users can copy paste, drag, and drop, or upload attachments from a computer.  Visit the Editing Attachments article for more information.
## Editing multiple objects
User can use inline editing to update multiple records without opening each record one by one from a search Table view. See the article Navigating mass-editing of objects for more information.
