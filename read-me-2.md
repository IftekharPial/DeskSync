

---

## ✅ **Detailed Workflow: Webhooks, Meetings, User Assignment, Dynamic Support Platforms, Reporting, Analytics → Slack**

---

### 1️⃣ **Webhook Reception (Meetings)**

* **Purpose:** Automatically create meetings in the system from external platforms (e.g., WordPress, Calendars, CRMs) **via webhook payloads.**

#### **Process:**

1. **Unique Webhook Endpoint Created Per Integration:**

   * Example URL:

     ```
     https://desk-sync-web.vercel.app/api/webhooks/{webhookId}/receive
     ```

2. **Incoming Payload Example (Meeting Creation):**

```json
{
  "meeting_id": "abc-123",
  "meeting_title": "Support Onboarding Call",
  "start_time": "2025-06-20T10:00:00Z",
  "end_time": "2025-06-20T11:00:00Z",
  "host_id": "support-agent-42",
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}
```

3. **Actions upon Receiving Payload:**

   * ✅ **Full payload is logged** in the `PayloadLogs` table.
   * ✅ Meeting entry is **created in the `MeetingReports` table.**
   * ✅ **Host ID from payload is matched against registered users** → automatically associates the meeting to that Support Agent’s profile.
   * ✅ If `host_id` is missing → meeting can be flagged as **“Unassigned”** until manual assignment.

---

### 2️⃣ **Slack Notification**

* After meeting is created → **Slack Notification is triggered automatically.**
* Uses **Message Templates** to format output. Example Slack message:

```
📅 New Meeting Created
Title: Support Onboarding Call
Start: 2025-06-20 10:00 UTC
Assigned To: Alex (alex@example.com)
Customer: John Doe
```

* ✅ Slack delivery **status is logged** with delivery ID, timestamp, status (success/failure), retry attempts (via BullMQ queue).

---

### 3️⃣ **Meeting Management (After Creation)**

* Meetings appear in **Dashboard → Reports → Meeting Reports**
* ✅ **Meetings are:**

  * **Viewable** → By assigned agent, by admins.
  * **Editable** → Change title, notes, success status, customer attendance, review outcome.
  * **Audit Tracked** → Any edits → tracked in edit history/logs.

#### **Meeting Attributes Stored:**

| Field          | Editable? | Notes                               |
| -------------- | --------- | ----------------------------------- |
| Meeting Title  | ✅         | Can rename after creation           |
| Start Time     | ❌         | Locked (comes from payload)         |
| End Time       | ✅         | Can adjust manually if needed       |
| Customer Name  | ✅         | For corrections                     |
| Customer Email | ✅         |                                     |
| Success Status | ✅         | e.g., Completed, No-show, Follow-up |
| Notes          | ✅         | Summary of discussion, actions      |

---

## 4️⃣ **Admin-Controlled Support Platforms (Dynamic Management)**

### 🎯 **Purpose:**

Allow **Super Admins** to dynamically manage a list of **support platforms** (e.g., Facebook, YouTube, Crisp) **through the Admin Portal**, so Support Agents always have an up-to-date set of options when submitting daily reports.

#### **Admin Platform Management UI**

* **Location:** Dashboard → Admin → **Platforms Management**
* ✅ **Features:**

  * ➕ Add New Platform → e.g., “Facebook”
  * 🖊️ Edit Platform Name → e.g., Rename “Crisp” to “Crisp Chat”
  * ❌ Archive Platform → Hide from forms but preserve in analytics
  * ✅ View all active/inactive platforms

#### **SupportPlatform Model Example:**

```prisma
model SupportPlatform {
  id          String   @id @default(uuid())
  name        String   @unique
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

✅ **Real-time → Any change reflects immediately across the system.**

---

## 5️⃣ **Daily Report Submission by Support Agents**

* **Where:** Dashboard → Reports → Daily Reports
* ✅ Agents can add:

  * Number of tickets handled **per platform**
  * Number of chat conversations
  * GitHub issues handled
  * Number of meetings attended → *auto-associated with created meetings via matching host\_id*
  * Notes or relevant links

#### **Dynamic Form Example:**

```
Which platforms did you work on today?
[✔️] Facebook → Tickets Resolved: 5
[✔️] YouTube → Tickets Resolved: 2
[ ] Crisp Chat → Tickets Resolved: _
```

#### **Daily Report Example Payload:**

```json
{
  "date": "2025-06-21",
  "platformReports": [
    { "platform": "Facebook", "ticketsHandled": 5 },
    { "platform": "YouTube", "ticketsHandled": 2 }
  ],
  "notes": "Handled critical issues for the YouTube channel."
}
```

---

### 6️⃣ **Analytics & Slack Integration**

* ✅ **When Daily Report is submitted:**

  * Sends **summary to Slack** in pre-configured format. Example:

```
📊 Daily Report by Alex (alex@example.com)
Facebook: 5 tickets
YouTube: 2 tickets
Meetings Attended: 1
Notes: “Handled escalations on YouTube.”
```

* ✅ Report stored in `DailyReports` table.
* ✅ Linked to Meetings in DB → Full relational data integrity.
* ✅ Aggregated by platform for reporting → “Top Platforms,” “Most Active Support Agent,” etc.

---

## 🗄️ **Database Relationships (Simplified)**

```
User (id)
  └── hasMany → MeetingReport (assigned_user_id)
  └── hasMany → DailyReport (user_id)

SupportPlatform (id)
  └── referenced by → DailyReport.platformReports[].platform

MeetingReport
  └── belongsTo → User (assigned_user_id)
  └── hasOne → PayloadLog

DailyReport
  └── belongsTo → User (user_id)
  └── hasMany → MeetingReport (meetings_attended)

PayloadLog
  └── stores → Full original payload JSON
```

---

## ⚙ **System Integrity**

* ✅ Every incoming payload → logged.
* ✅ Every meeting → assigned or flagged as needing assignment.
* ✅ Every platform → controlled by Admin Portal, dynamic, no redeploys required.
* ✅ Every report → viewable, editable, tracked.
* ✅ Every submission → pushed to Slack → **delivery confirmed or retried**.
* ✅ **Full circular integrity:**

  * Webhook → Log → Meeting → Report (w/ platforms) → Analytics → Slack → Records


