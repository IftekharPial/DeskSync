

---

## ⚠️ **Current Issue Summary**

1. **Webhook Testing is Broken/Incomplete**
   → Incoming webhook **test requests** do not trigger expected actions (logging, forwarding, Slack notification).

2. **No Meeting Auto-Creation Logic Exists Yet**
   → Webhooks currently **do not** generate meetings in the system when receiving meeting-related payloads.

3. **Meeting Webhooks Are Missing in UI & DB**
   → We need **distinct “Meeting Webhooks”** with:

   * Configurable **Webhook URLs** for receiving
   * Configurable **Outgoing Endpoints (Slack, etc.)**
   * A **Template Engine** for outgoing Slack messages.

---

## ✅ **Detailed Implementation Instructions**

---

### 1️⃣ DATABASE UPDATES → Prisma Schema Changes

Add or update **Prisma** schema models:

```prisma
model IncomingWebhook {
  id          String     @id @default(cuid())
  name        String
  type        WebhookType // NEW → ENUM: GENERIC | MEETING
  slug        String     @unique
  secret      String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  endpoints   OutgoingEndpoint[]
  logs        PayloadLog[]
}

enum WebhookType {
  GENERIC
  MEETING
}
```

---

### 2️⃣ NEW FEATURE → **Meeting Webhook Processing**

#### API Endpoint

```http
POST /api/webhooks/:webhookId/receive
```

#### Flow Logic:

1. **Check IncomingWebhook.type**

   * If `GENERIC` → handle normally.
   * If `MEETING` → run **meeting creation logic**.

2. **Meeting Creation Logic:**

   * Parse payload → extract fields:

     * `hostId`
     * `meetingTitle`
     * `startTime`
     * `duration`
     * `clientName`
     * `notes` (optional)
   * Lookup **User** by matching `User.externalUserId == payload.hostId`
   * If matched:

     * Create new `MeetingReport`:

```prisma
model MeetingReport {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id])
  meetingStart  DateTime
  meetingEnd    DateTime
  title         String
  clientName    String?
  notes         String?
  createdAt     DateTime   @default(now())
}
```

```
 - meetingStart = payload.startTime
 - meetingEnd = meetingStart + payload.duration (minutes)
 - title = payload.meetingTitle
 - clientName = payload.clientName
 - notes = payload.notes
 - outcome = default to `PENDING` or omit for now
```

---

### 3️⃣ SLACK NOTIFICATION → Template Mapping System

* Each OutgoingEndpoint **should be linked to a MessageTemplate.**
* Use **Handlebars** or **Mustache-style** placeholders, example:

```
"🚀 New Meeting Created: *{{meetingTitle}}*\n🕑 {{startTimeFormatted}}\n👤 {{clientName}}"
```

→ Backend replaces variables **from the received payload** or derived values (e.g., formatted start time).

#### Example Replacement Map

```json
{
  "meetingTitle": "Weekly Sync",
  "startTimeFormatted": "2025-06-18 10:00 UTC",
  "clientName": "Acme Inc."
}
```

---

### 4️⃣ MULTIPLE MEETING WEBHOOKS → Management UI

Add **“Meeting Webhooks”** section in the Webhook Management UI:

* List of **Meeting Webhooks**
* “Add Meeting Webhook” → generates new unique webhook URL.
* **Per webhook → list of Outgoing Endpoints**
* Each **Outgoing Endpoint → select Template**

---

### 5️⃣ API Testing → Required Testing Feature

* **In the UI → Add a button to “Send Test Request”** to each webhook with a sample payload.
* Test response should:

  1. **Log payload**
  2. **Trigger meeting creation (if applicable)**
  3. **Send test Slack notification → show status success/fail**

---

### 6️⃣ NOTIFICATION DELIVERY → Slack Integration

* Must support **retries** using existing BullMQ queue.
* Delivery status for each outgoing webhook → logged in `PayloadLog`.

---

### 7️⃣ FUTURE SUPPORT (OPTIONAL → Not required now)

* Support for **other destinations** (Google Sheets, APIs)
* Support for **custom payload transformers**

---

## 📦 **Example Payload for Testing**

```json
{
  "hostId": "12345",
  "meetingTitle": "Client Demo",
  "startTime": "2025-06-18T14:00:00Z",
  "duration": 45,
  "clientName": "BigCorp",
  "notes": "Demo of new features"
}
```

---

## ⚙️ **Execution Priority (Ordered List):**

1. Update database schema → add `WebhookType`
2. Implement `POST /api/webhooks/:id/receive` full flow
3. Add **MeetingReport creation logic**
4. Build/plug **Template rendering** → Slack payload generation
5. Add multiple **Outgoing Endpoints** per Meeting Webhook
6. Add **Webhook Test** feature in frontend
7. Ensure **Slack delivery** → success/fail → show in UI
8. (Optional) → Add **Meeting Webhooks** tab in Admin Dashboard UI

---

## 🎯 **Expected Output:**

* Webhook receiving → creates **MeetingReport** → visible on dashboard
* Slack message → formatted by template → delivered reliably
* Full **Webhook → Meeting → Slack Notification → Success/Fail Log** flow complete
* Multiple **Meeting Webhooks** supported
* Fully testable through UI test button

