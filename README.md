

---

# 📦 `comment-manager-mongoose` 

A simple and efficient package to manage comments and replies in MongoDB using Mongoose. This package helps manage comment threads, reactions (likes/dislikes), and replies, including nested replies.

## 🛠️ **Basic Requirements**
- **Node.js**: v12 or higher
- **MongoDB**: v4.0 or higher
- **Peer Dependency**: `mongoose`

## 🔗 **Installation**

To install the package, run:

```bash
npm install comment-manager-mongoose
```

## 🚀 **Usage**

### 1️⃣ **Basic Setup**

First, create a new instance of `CommentManager`:

```javascript
const { CommentManager } = require('comment-manager-mongoose');

const dbConfig = { uri: 'mongodb://localhost:27017/commentsDB', options: {} };
const commentManager = new CommentManager(dbConfig, 'comments');
```

### 2️⃣ **Create a Comment**

```javascript
const newComment = await commentManager.comment().create({
  commentId: 'unique-comment-id',
  postId: 'post-id-123',
  content: 'This is a comment',
  username: 'user123',
  order: 1,
});
```

### 3️⃣ **Create a Reply**

```javascript
const newReply = await commentManager.reply().create({
  commentId: 'unique-comment-id',
  replyId: 'unique-reply-id',
  parentReplyId: null, // null for top-level reply
  content: 'This is a reply',
  username: 'user456',
  isDirectReply: true,
});
```

### 4️⃣ **Read Comments and Replies**

```javascript
const comments = await commentManager.comment().read({ postId: 'post-id-123' });
const replies = await commentManager.reply().read({ commentId: 'unique-comment-id' });
```

### 5️⃣ **Update a Comment or Reply**

```javascript
await commentManager.comment().update({ content: 'Updated comment content' }, { commentId: 'unique-comment-id' });
```

### 6️⃣ **Delete a Comment or Reply**

```javascript
await commentManager.comment().delete({ strict: false }, { commentId: 'unique-comment-id' });
await commentManager.reply().delete({ strict: false }, { replyId: 'unique-reply-id', commentId: 'unique-comment-id' });
```

### 7️⃣ **Close Database Connection**

```javascript
await commentManager.closeConnection();
```

## 🔑 **Important Fields in Reply Schema**

The reply schema contains the following important fields:

| Field             | Type      | Description                                                                 |
|-------------------|-----------|-----------------------------------------------------------------------------|
| `replyId`         | String    | Unique ID for each reply (🔑 required).                                      |
| `parentReplyId`   | String    | If the reply is a child, it stores the parent reply ID (📜 optional).       |
| `isDirectReply`   | Boolean   | Indicates if it's a direct reply or nested (🔗 default: `true`).            |
| `order`           | Number    | The order of replies, auto-incremented (🔢 required).                        |
| `content`         | String    | The content of the reply (✏️ required).                                      |
| `username`        | String    | The username of the person who replied (👤 required).                         |
| `createdAt`       | Date      | Timestamp of when the reply was created (⏱️ default: `Date.now`).            |
| `updatedAt`       | Date      | Timestamp of the last update (🔄 default: `Date.now`).                       |
| `deletedAt`       | Date      | Timestamp of when the reply was soft-deleted (🗑️ default: `null`).          |
| `status`          | String    | Status of the reply, can be `active`, `deleted`, or `flagged` (🚨 default: `active`). |
| `reactions`       | Object    | Reactions (likes/dislikes) on the reply (👍👎).                               |
| `repliesCount`    | Number    | The number of nested replies (🔢 default: `0`).                             |

### **Comment Schema Fields**

| Field             | Type      | Description                                                                 |
|-------------------|-----------|-----------------------------------------------------------------------------|
| `commentId`       | String    | Unique ID for each comment (🔑 required).                                    |
| `postId`          | String    | ID of the post that the comment belongs to (📜 required).                    |
| `content`         | String    | The content of the comment (✏️ required).                                   |
| `username`        | String    | The username of the person who commented (👤 required).                      |
| `order`           | Number    | The order of comments, auto-incremented (🔢 required).                       |
| `createdAt`       | Date      | Timestamp of when the comment was created (⏱️ default: `Date.now`).          |
| `updatedAt`       | Date      | Timestamp of the last update (🔄 default: `Date.now`).                       |
| `deletedAt`       | Date      | Timestamp of when the comment was soft-deleted (🗑️ default: `null`).        |
| `status`          | String    | Status of the comment, can be `active`, `deleted`, or `flagged` (🚨 default: `active`). |
| `reactions`       | Object    | Reactions (likes/dislikes) on the comment (👍👎).                             |
| `repliesCount`    | Number    | The number of replies to the comment (🔢 default: `0`).                      |

## ⚙️ **Additional Configuration**

### Custom Schema

You can pass a custom schema to the `CommentManager` by providing it as the third argument:

```javascript
const customSchema = {
  commentId: { type: String, required: true },
  content: { type: String, required: true },
  // Add other custom fields here
};
const commentManagerWithCustomSchema = new CommentManager(dbConfig, 'comments', customSchema);
```

## 🚨 **Notes**
- Soft deletion is supported using the `status` field (`active`, `deleted`, or `flagged`).
- Comments and replies are stored with a creation order (`order`) to maintain chronological order.

---
