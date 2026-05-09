const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  is_correct: { type: Boolean, required: true }
});

const SCQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [OptionSchema],
  explanation: String
});

const MCQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [OptionSchema],
  explanation: String
});

const SAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  sample_answer: String
});

const ContentSchema = new mongoose.Schema({
  theory: [String],
  scq: [SCQSchema],
  mcq: [MCQSchema],
  saq: [SAQSchema]
});

const SubconceptSchema = new mongoose.Schema({
  title: String,
  order_index: Number,
  content: ContentSchema
});

const ConceptSchema = new mongoose.Schema({
  title: String,
  order_index: Number,
  subconcepts: [SubconceptSchema]
});

const ChapterSchema = new mongoose.Schema({
  title: { type: String, default: "Chapter 8: Motion" },
  concepts: [ConceptSchema]
});

module.exports = mongoose.model('Chapter', ChapterSchema);