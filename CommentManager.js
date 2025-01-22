const mongoose = require('mongoose');
const { Schema } = mongoose;

// Default Comment Schema
const defaultCommentSchema = {
  commentId: { type: String, required: true, unique: true },
  postId: { type: String, required: true },
  content: { type: String, required: true },
  username: { type: String, required: true },
  order: { type: Number, required: true }, // Auto-incremented
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }, // Tracks soft deletion time
  status: { type: String, enum: ['active', 'deleted', 'flagged'], default: 'active' },
  reactions: {
    like: { type: [String], default: [] },
    dislike: { type: [String], default: [] },
  },
  repliesCount: { type: Number, default: 0 },
  replies: [
    {
      replyId: { type: String, required: true, unique: true },
      parentReplyId: { type: String },
      isDirectReply: { type: Boolean, default: true },
      order: { type: Number, required: true }, // Auto-incremented for replies
      content: { type: String, required: true },
      username: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      deletedAt: { type: Date, default: null }, // Tracks soft deletion time
      status: { type: String, enum: ['active', 'deleted', 'flagged'], default: 'active' },
      reactions: {
        like: { type: [String], default: [] },
        dislike: { type: [String], default: [] },
      },
      repliesCount: { type: Number, default: 0 },
    },
  ],
};

class CommentManager {
  constructor(dbConfig, collectionName, customSchema = null) {
    this.dbConfig = dbConfig;
    this.collectionName = collectionName;
    this.customSchema = customSchema;
    this.commentModel = null;

    // Establish database connection and set up schema
    this.connectToDatabase();
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(this.dbConfig.uri, this.dbConfig.options);
      console.log('Connected to MongoDB');
      this.initializeModel();
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  }

  initializeModel() {
    const commentSchema = new Schema(this.customSchema || defaultCommentSchema, { collection: this.collectionName });
    this.commentModel = mongoose.model(this.collectionName, commentSchema);
  }

  comment() {
    return {
      create: async (data) => {
        try {
          const latestComment = await this.commentModel.findOne({}, 'order').sort({ order: -1 });
          data.order = (latestComment?.order || 0) + 1;
          const comment = new this.commentModel(data);
          return await comment.save();
        } catch (err) {
          console.error('Error creating comment:', err);
          throw err;
        }
      },

      read: async (criteria) => {
        try {
          return await this.commentModel.find(criteria).sort({ order: 1 });
        } catch (err) {
          console.error('Error reading comment:', err);
          throw err;
        }
      },

      update: async (data, criteria) => {
        try {
          data.updatedAt = new Date();
          return await this.commentModel.updateMany(criteria, data);
        } catch (err) {
          console.error('Error updating comment:', err);
          throw err;
        }
      },

      delete: async (data, criteria) => {
        try {
          if (data.strict) {
            return await this.commentModel.deleteMany(criteria);
          } else {
            return await this.commentModel.updateMany(criteria, {
              status: 'deleted',
              deletedAt: new Date(),
            });
          }
        } catch (err) {
          console.error('Error deleting comment:', err);
          throw err;
        }
      }
    };
  }

  reply() {
    return {
      create: async (data) => {
        try {
          const comment = await this.commentModel.findOne({ commentId: data.commentId });
          if (!comment) throw new Error('Comment not found.');

          const parentReply = data.parentReplyId
            ? comment.replies.find(reply => reply.replyId === data.parentReplyId)
            : null;

          const replyOrder = parentReply
            ? parentReply.repliesCount + 1
            : comment.repliesCount + 1;

          data.order = replyOrder;
          comment.replies.push(data);
          comment.repliesCount += 1;

          if (parentReply) {
            parentReply.repliesCount += 1;
          }

          return await comment.save();
        } catch (err) {
          console.error('Error creating reply:', err);
          throw err;
        }
      },

      read: async (criteria) => {
        try {
          const { commentId, replyId } = criteria;
          const targetComment = await this.commentModel.findOne({ commentId });
          if (!targetComment) throw new Error('Comment not found.');

          return replyId
            ? targetComment.replies.find(reply => reply.replyId === replyId)
            : targetComment.replies;
        } catch (err) {
          console.error('Error reading reply:', err);
          throw err;
        }
      },

      update: async (data, criteria) => {
        try {
          const { replyId: updateReplyId } = criteria;
          const commentToUpdate = await this.commentModel.findOne({ commentId: criteria.commentId });
          if (!commentToUpdate) throw new Error('Comment not found.');

          const replyToUpdate = commentToUpdate.replies.find(reply => reply.replyId === updateReplyId);
          if (!replyToUpdate) throw new Error('Reply not found.');

          Object.assign(replyToUpdate, data, { updatedAt: new Date() });
          return await commentToUpdate.save();
        } catch (err) {
          console.error('Error updating reply:', err);
          throw err;
        }
      },

      delete: async (data, criteria) => {
        try {
          const { replyId: deleteReplyId } = criteria;
          const commentToDelete = await this.commentModel.findOne({ commentId: criteria.commentId });
          if (!commentToDelete) throw new Error('Comment not found.');

          const replyIndex = commentToDelete.replies.findIndex(reply => reply.replyId === deleteReplyId);
          if (replyIndex === -1) throw new Error('Reply not found.');

          if (data.strict) {
            commentToDelete.replies.splice(replyIndex, 1);
          } else {
            commentToDelete.replies[replyIndex].status = 'deleted';
            commentToDelete.replies[replyIndex].deletedAt = new Date();
          }

          commentToDelete.repliesCount -= 1;
          return await commentToDelete.save();
        } catch (err) {
          console.error('Error deleting reply:', err);
          throw err;
        }
      }
    };
  }

  async closeConnection() {
    try {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
  }
}

// Export CommentManager and defaultCommentSchema
module.exports = {
  CommentManager,
  defaultCommentSchema,
};
