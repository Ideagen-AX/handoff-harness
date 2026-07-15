<!--
EXEMPLAR — Ideagen EHSQ Enterprise product documentation (real, from Ideagen Luminate help centre).
Source: "Creating a child level data table report from a search", help.ideagen.com (EHSQ Enterprise / Miramar).
Archetype: task / how-to.
PRIMARY few-shot: feature changes most often yield a task doc. Note: audience line, plain-language concept intro, Overview+Availability, option breakdowns, then numbered procedure with inline sub-notes.
Use as few-shot for the PRODUCT-DOCS artifact. Imitate structure & neutral how-to voice, not the specific feature.
-->

# Creating a child level data table report from a search

(13 July 2026).
Who is this article for?
Enterprise or Decani users and administrators who want to know about data table search and reporting
No special access or permissions are required
Child-level data reporting lets you include and analyse related child records within your reports. Each parent record can have multiple child records, such as actions on an incident, tasks on a project, or inspection findings.
You can filter, display, and analyse child data alongside parent records in one report. Child data can be added to new or existing reports (supported types) and shown in tables or charts.
This article explains how you can create a child level data table report from a search.
## Overview
### Availability
With release 2.64.4, child-level data reporting will be made available to new customers as well as existing customers who have completed the search architecture migration and are utilizing the redesigned user interface.
Please refer to unlocking native child data reporting for further migration details and exploring the Phase 1 UI redesign for a comprehensive overview of the UI changes.
## Report layout options
### Tabular (Table) layouts
There are two available tabular layouts.
#### Nested
This layout:
- displays parent records as rows, with child records shown in a sub-table beneath each parent.
- preserves the relationship between parent and child data.
- is best for reviewing related records together in context.
#### Flattened
This layout:
- displays each child record as its own row.
- repeats Parent data on each row.
- is best for exporting, filtering, and bulk analysis (for example, in Excel).
### Chart layouts
Child data can be displayed in supported chart types, including table, area, bar, column, or line charts, heatmap, pie, single metric, and treemap.
Child data is rendered automatically using the chart’s native format, with no additional layout configuration required.
## Creating a child data report
To create a child data report:
- Create or open a report.
Child data can be added to both new and existing reports (supported types only)
- Select a supported Report Type (Table or Chart).
Your selection determines how child data will be displayed
- Open the Data panel.
- Select the child table you want to include in the report.
- Choose your Display mode.
- Add Fields to define what data is displayed.
- Refine Filters to define your results.
Parent and child fields can be filtered and sorted independently
- Click Save.
Once you save your report, you can:
- select Export to download the report as an Excel file for deeper analysis (exported reports use a flattened format for compatibility and analysis).
- add the report to a dashboard for real-time visibility.
- share the saved report it with your team using notifications.
