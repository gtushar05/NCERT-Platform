const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Chapter = require('./models/Chapter');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/ncert_db');

// Route 1: Get the sidebar curriculum (lightweight)
app.get('/api/curriculum', async (req, res) => {
  try {
    const chapter = await Chapter.findOne({}, 'title concepts.title concepts._id concepts.subconcepts.title concepts.subconcepts._id');
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Route 2: Get specific subconcept content (strip answers)
app.get('/api/content/:conceptId/:subconceptId', async (req, res) => {
  try {
    const chapter = await Chapter.findOne({
      "concepts._id": req.params.conceptId,
      "concepts.subconcepts._id": req.params.subconceptId
    });

    const concept = chapter.concepts.id(req.params.conceptId);
    const subconcept = concept.subconcepts.id(req.params.subconceptId);

    // Deep copy to allow modification before sending
    const secureData = JSON.parse(JSON.stringify(subconcept.content));

    // Strip out the answers
    secureData.scq?.forEach(q => q.options.forEach(opt => delete opt.is_correct));
    secureData.mcq?.forEach(q => q.options.forEach(opt => delete opt.is_correct));

    res.json(secureData);
  } catch (error) {
    res.status(500).json({ error: "Content not found" });
  }
});

// Route 3: Evaluate Quiz
app.post('/api/evaluate', async (req, res) => {
  const { conceptId, subconceptId, questionType, questionId, selectedOptionIds } = req.body;

  try {
    const chapter = await Chapter.findOne({ "concepts._id": conceptId });
    const question = chapter.concepts.id(conceptId)
                            .subconcepts.id(subconceptId)
                            .content[questionType].id(questionId);

    const correctOptionIds = question.options
      .filter(opt => opt.is_correct)
      .map(opt => opt._id.toString());

    // Check if lengths match AND all selected are correct
    const isCorrect = 
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every(id => correctOptionIds.includes(id));

    res.json({
      isCorrect,
      correctOptionIds,
      explanation: question.explanation
    });
  } catch (error) {
    res.status(500).json({ error: "Evaluation failed" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));