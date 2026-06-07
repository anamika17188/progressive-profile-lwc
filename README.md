# progressive-profile-lwc
Multi-tab progressive profile form built with Salesforce LWC and Custom Metadata
# Progressive Profile Form — Salesforce LWC

A multi-tab progressive profile form built using 
Salesforce Lightning Web Components (LWC) and 
Custom Metadata Types.

## What This Project Does

Instead of showing one long form, this project 
breaks a lengthy profile form into multiple tabs. 
Users fill one tab at a time and navigate using 
Next and Previous buttons.

## Key Features

- Multi-tab form with dynamic navigation
- All tabs and fields configured via Custom Metadata
- Add or remove tabs with ZERO code changes
- Client-side validation across all tabs
- Saves data to Salesforce Contact record
- Built and deployed on Salesforce Developer Edition

## Technologies Used

- Salesforce LWC (Lightning Web Components)
- Apex (Server-side controller)
- Custom Metadata Types (Configuration)
- SOQL (Database queries)
- JSON (Field configuration storage)
- JavaScript, HTML, XML

## Project Structure
force-app/
└── main/
└── default/
├── lwc/
│   └── progressiveProfile/
│       ├── progressiveProfile.html
│       ├── progressiveProfile.js
│       └── progressiveProfile.js-meta.xml
└── classes/
├── profile.cls
└── profile.cls-meta.xml
## How It Works

1. Custom Metadata stores tab names and 
   field API names as JSON
2. Apex reads metadata and returns to LWC
3. LWC renders tabs and fields dynamically
4. On Submit, Apex saves all data to Contact record

## Setup Instructions

1. Create Custom Metadata Type named 
   `Progressive_Profile__mdt` with fields:
   - `tab_label__c` (Text)
   - `tab_order__c` (Number)  
   - `field_json__c` (Long Text)
   - `is_active__c` (Checkbox)

2. Add metadata records for each tab

3. Deploy LWC component and Apex class

4. Add component to Contact Record Page 
   via Lightning App Builder

## Author

Anamika Sharma
Salesforce Developer (Beginner)
