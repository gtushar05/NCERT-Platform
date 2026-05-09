const mongoose = require('mongoose');
const Chapter = require('./models/Chapter');
const chapterData = require('./ncert_ch8_motion.json');

mongoose.connect('mongodb://127.0.0.1:27017/ncert_db');

async function seedDB() {
  try {
    await Chapter.deleteMany({}); // Clear existing data
    await Chapter.create({
      title: "Chapter 8: Motion",
      concepts: chapterData.concepts
    });
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit();
  }
}

seedDB();