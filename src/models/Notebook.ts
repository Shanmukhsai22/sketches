import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  x: Number,
  y: Number
});

const strokeSchema = new mongoose.Schema({
  points: [pointSchema],
  type: {
    type: String,
    enum: ['draw', 'erase'],
    default: 'draw'
  }
});

const notebookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    default: 'Untitled Notebook',
  },
  content: {
    type: String,
    default: '',
  },
  strokes: {
    type: [strokeSchema],
    default: [],
  },
  createdBy: {
    type: String,
    default: 'Anonymous',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  }
}, {
  timestamps: true,
});

export default mongoose.models.Notebook || mongoose.model('Notebook', notebookSchema);