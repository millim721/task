const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['assessment', 'class-change'],
    required: true
  },
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assessment: {
    subject: String,
    rubric: [{
      criteria: String,
      points: Number
    }],
    dueDate: Date
  },
  classChange: {
    changeType: {
      type: String,
      enum: ['교체', '단축', '휴강', '기타']
    },
    period: [Number],
    originalClass: String,
    newClass: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);