# PersonaSphere - Design Guide

## 1. Overview & Core Value

This is a smart relationship management tool for personal or business use, adopting the design philosophy of "AI-assisted, human-confirmed". Users input information about someone through natural language (typing), and the large model automatically extracts and classifies it, ultimately forming structured person profiles, relationship networks, and circle views. The application emphasizes user review and intervention to ensure the accuracy of AI assistance while respecting user custom adjustments.

### Core Value

- **Minimal Input**: Update relationship profiles with everyday conversations.
- **Smart Structuring**: Automatically extract key information (personal info, events, future appointments, resource directions).
- **Visual Insights**: Intuitively discover core relationships and social circles through relationship network graphs and circle bubble charts.
- **User Control**: All AI-generated content requires user confirmation, conflicts and ambiguities are resolved by users, and fields edited by users are never overwritten by AI.

---

## 2. Core Data Models

### 2.1 Person

- `id`: Unique identifier
- `name`: Name (unique constraint, no duplicate names allowed)
- `avatar`: Avatar path (optional)
- `profile_json`: Stores profile information, including:
  - `job`: Occupation (string type, current occupation; occupation history can be recorded through events)
  - `birthday`: Birthday (format can be MM-DD or YYYY-MM-DD, use xxxx placeholder when year is unknown, e.g., xxxx-05-20)
- `age`: Age (calculated based on birthday, shows unknown if information is insufficient)
- `events`: Event list (sorted by time, each event contains date, location, description)
- Other custom fields (such as intro, company, etc.)
- `created_at`, `updated_at`

> Note: The `birthday` field allows year supplementation later, storage format preserves original precision. Age is automatically calculated, not calculated if year is unknown.

### 2.2 Relation

- `id`
- `from_person_id`
- `to_person_id`
- `relation_type`: Relationship type (e.g., "friend", "colleague")
- `confirmed_by_user`: Whether confirmed by user (all saved relationships are considered user-confirmed)
- `created_at`

> Important: Relationships are considered bidirectional by default. When saving from-to relationship, system automatically creates or updates to-from relationship of same type, ensuring consistency on both sides. For asymmetric relationships (such as "superior"), can be refined in future versions, MVP stage handles uniformly as bidirectional.

### 2.3 Annotation

- `id`
- `person_id`: Associated person
- `time`: Specific date or time period (format YYYY-MM-DD or YYYY-MM, if relative time like "next month", converts to YYYY-MM based on current time at input, representing entire month)
- `location`: Location
- `description`: Key action (e.g., "business trip")
- `confirmed_by_user`
- `created_at`

> Note: Relative time conversion rules: Calculated based on system time at user input. For example "next month" → current month +1, format YYYY-MM; "next week" → current week +1, converts to that week's start date or directly stores as YYYY-MM-DD (takes specific date, but frontend can display as "next week"). If current is December, converts to January of next year. MVP uniformly uses specific dates or year-month to simplify storage.

### 2.4 Development

- `id`
- `person_id`
- `content`: Description (e.g., "AI", "chip")
- `type`: Type (e.g., "resource")
- `confirmed_by_user`
- `created_at`

### 2.5 Circle

- `id`
- `name`: Circle name
- `color`: Morandi color value
- `created_at`

> Note: Circles are only created manually by user or confirmed from auto-generation, no assigned_by_user field, creation is considered user-owned.

### 2.6 PersonCircle

- `person_id`
- `circle_id`
- `assigned_by_user`: Always true (circle assignments only take effect after user confirmation)

### 2.7 Source Tags

Each sub-item (events, annotations, developments, etc.) needs to store source field, enum values:

- `user`: User manually edited or confirmed (permanent, never overwritten by AI)
- `ai_suggested`: AI extracted but not yet confirmed (only for preview, converts to user after saving)
- `ai_confirmed`: Once extracted by AI and confirmed by user (merged with user, considered user data after confirmation)

> Person attributes (such as job, birthday) don't have separate source tags, considered user data after conflict resolution process.

---

## 3. Full Process Detailed Steps

### 3.1 Home Page: Information Input & AI Extraction

1. Input a description about someone in the home page text box, click submit.
2. System sends text to backend POST /extract endpoint.
3. Backend calls large model, forces output of following JSON structure through function calling:

```json
{
  "profile": {
    "name": "Zhang San",
    "job": "AI Engineer",
    "birthday": "05-20",
    "events": [
      { "date": "2025-03-15", "description": "Had dinner together", "location": "Beijing" }
    ]
  },
  "annotations": [
    { "time": "2025-04-01", "location": "Shanghai", "description": "Business trip" }
  ],
  "developments": [
    { "content": "AI Chip", "type": "resource" }
  ],
  "relations": [
    { "name": "Li Si", "relation_type": "Colleague" }
  ]
}
```

### 3.2 Same Name Detection & Branch Handling

After backend receives AI-extracted JSON, queries database based on profile.name:

- If name doesn't exist: Enters new creation flow, jumps to confirmation interface (3.3).
- If name already exists: Enters same name disambiguation step. Pops up modal, lets user choose:
  - **This is the same person**: Option A: Improve description: After clicking, system compares this AI-extracted content (except name) with existing profile, only shows new or conflicting parts, and enters confirmation interface (see 3.3). User can modify these new items in confirmation interface.
  - **This is a different person**: Option B: Create new, but need to modify name (system can automatically add numeric suffix, e.g., "Zhang San(2)"), user can also manually rename.

### 3.3 Confirmation Interface (Preview & Edit)

#### Layout:

- Top shows original input text.
- Below splits into three columns showing extracted content, each item in each column is editable:
  - Profile column: Name, occupation, birthday, event list.
  - Annotation column: Future annotations (time, location, description).
  - Development column: Content, type.
- Separate area shows detected person relationship list (e.g., "With Li Si (Colleague)"), can modify relationship type or delete.
- If conflicts exist (see 3.4), pops up conflict prompt box below relationship area, lists all conflicting items and provides resolution options.

#### Edit Functionality:

- Each extracted item has edit icon or inline edit box next to it, user can click to modify content.
- Delete button exists independently, for deleting entire extracted item.
- Each column provides "Add" button below, can manually add new entries.

#### Event Display Rules:

- Events from same day merge into one time module. (Need to compare event similarity, detailed version takes priority. For example same day, originally recorded "Had dinner with B", now want to add "Had lunch with B" shows current new addition, and replaces original record after saving, vice versa doesn't show)
- Visually: Green small module shows time (e.g., "March 15th"), blue small module shows location (optional), same line shows event description in black text.
- Different events from same day display in separate lines, each event independent line (time module and location module reused, description wraps).

### 3.4 Conflict Detection & Resolution

#### Conflict Types:

1. **Information Conflict** (only for person attribute fields, such as birthday, occupation):
   - For example database has birthday "05-21", AI extracts "05-20".
   - Resolution: Lists in conflict prompt box, lets user choose to keep original value, keep new value, or manually enter new value.

2. **Event List Merge**:
   - New events extracted by AI show directly as new additions, no conflict judgment with existing events. User can manually delete duplicates or modify descriptions in confirmation interface.

3. **Relationship Bidirectional Inconsistency** (theoretically shouldn't happen, because system automatically maintains bidirectional, but may happen if user manually modifies unidirectional relationship):
   - Resolution: Prompts user to choose to keep unidirectional or force bidirectional.

> User must resolve all conflicts before clicking "Save" button.

### 3.5 Save & Update

- After user clicks "Save", frontend sends final confirmed data to backend POST /confirm.
- Backend merges updates database with atomic operation:
  - For improvement mode, adds new items to corresponding person lists, conflicting items based on user choice.
  - Relationship table: Creates/updates based on user-confirmed relationships, and automatically completes reverse relationships.
  - All saved entries source tagged as user.
- After successful update, frontend refreshes visualization views.

---

## 4. Visualization & Interaction

### 4.1 Person Profile Page

- Click person avatar or enter from list.
- Top: Name, avatar upload, intro.
- Below tabs:
  - **Profile**: Personal info, event timeline (sorted by date, display format same as confirmation interface), future annotation list, development list. All fields can be clicked to directly modify, takes effect immediately after editing and tagged as user.
  - **Relationship**: Shows other people directly connected to this person and relationships in mini relationship graph or list. Can add/edit relationships here.

### 4.2 Relationship Network Graph (Page 2 Mode 1)

Force-directed graph, nodes are person names, node size proportional to connection count.

Connection lines label relationship type.

For people not existing in relationships, doesn't create that person by default, and triggers prompt "Person not created" (e.g., user writes B is A's friend in A's profile, but B is not created at this time, then triggers "B not created" prompt)

Interaction:

- Hover shows person card (name, avatar, intro).
- Double-click node enters person profile page.
- Supports dragging nodes, manually organizing layout.
- Layout save: Node coordinates after user adjustment will be saved to backend (one per user), restored when entering next time.

### 4.3 Circle Classification Graph (Page 2 Mode 2)

#### 4.3.1 Circle Basic Operations

- **Create**: Click "New Circle", enter name, choose Morandi color.
- **Assign Person**:
  - Manual drag: Drag person avatar into a bubble.
  - Based on development: In person profile page, if person has development direction, shows "Join [field] circle" button next to it (premise that circle with same name exists), click to join.
  - Batch assign: Filter by development direction in person list page, batch select people and assign to specified circle.
- **Visualization**:
  - Each circle displays as colored bubble, size proportional to number of people in circle.
  - People in circle display as small avatars floating on bubble.
  - Simple collision detection between bubbles, can drag to adjust layout.

#### 4.3.2 Circle Auto Classification Feature

- **Trigger**: Add "Auto Generate Circles" button in circle management page.
- **Algorithm**:
  1. Iterate all people's development content (development.content).
  2. Exact match grouping, same strings归为一类.
  3. Need to introduce simple semantic similarity, like AI and人工智能 not same category, prioritize shorter string display (if same then later occurrence).
  4. Each category generates a suggested circle: Name takes that development content, color randomly selects from Morandi colors, people are all people with that development.
- **Preview & Confirm**:
  - Pops up modal, lists each circle in card form.
  - Each card can edit name, color, person list (check/uncheck), can delete entire circle.
  - After user modification click "Confirm Save", formally creates circles; if name duplicates with existing circle, prompts merge or rename.
- **Note**: Auto-generated circles won't overwrite existing circles, and people can belong to multiple circles.

---

## 5. Technical Implementation Points

### 5.1 Frontend

- Framework: React + TypeScript
- State Management: Zustand
- UI Library: AntDesign or Material-UI
- Visualization:
  - Relationship Network: Cytoscape.js (lightweight, supports force-directed)
  - Circle Bubbles: Canvas + d3-force simulation layout
- Local Storage: IndexedDB (for temporary storing confirmation data when network is down)
- Layout Save: Periodically upload force-directed graph node coordinates to backend.

### 5.2 Backend

- Language: Python + FastAPI
- Large Model Integration:
  - Uses user's existing API (Nvidia free API, can call domestic models like z-ai/glm4.7), forces output specified JSON through function calling.
  - Timeout setting 10 seconds, prompts user to retry on failure.
  - Input text length limit 2000 characters.
- Data Validation: Pydantic model validation.
- API Endpoints:
  - POST /extract: Receives text, returns extracted JSON
  - POST /confirm: Receives confirmation data, updates database
  - GET /persons, GET /graph, GET /circles and other query endpoints
  - POST /graph/layout: Save relationship graph layout coordinates

### 5.3 Database

- SQLite, file storage at ./data/app.db
- Uses SQLAlchemy ORM
- Layout storage table (example):
```sql
CREATE TABLE graph_layout (
  user_id TEXT PRIMARY KEY,
  layout_json TEXT,
  updated_at DATETIME
);
```

### 5.4 Security Hardening

- Frontend rendering React escapes by default, prevents XSS
- Backend input validation, length limits
- Error messages don't expose sensitive details
- Environment variable management for API keys
- Provides data export (JSON/CSV) and delete functionality

---

## 6. Color Requirements

Interface main colors, relationship graph lines, circle bubbles, etc. all use Morandi colors. Suggested color values (extendable):

- #4A7B9C (Gray Blue)
- #9B6B6B (Red Bean)
- #5F7256 (Moss Green)
- #B5A189 (Khaki)
- #9251A8 (Purple Gray)
- #F7F6F1 (Off White)

---

## 7. Additional Notes

- Person limit: 30 people, ensuring interface smoothness.
- Input method: Text input only, doesn't support voice, image, document for now.
- Data backup: Reminds users to regularly backup SQLite file.
- Error recovery: When network is down, frontend temporarily stores confirmation data in IndexedDB, automatically retries after network recovery.
- UI design: Modern soft elegant style, like using rounded rectangles, etc.
