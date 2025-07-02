const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const cheerio = require('cheerio');
const PDFDocument = require('pdfkit');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('public'));

// Utility to clean text
function cleanText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

// Extract text from resume file
async function extractResumeText(path, mimetype) {
  if (mimetype === 'application/pdf') {
    const dataBuffer = fs.readFileSync(path);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const data = await mammoth.extractRawText({ path });
    return data.value;
  }
  throw new Error('Unsupported file type');
}

// Fetch job description text from URL or use provided text
async function getJobDescription(textOrUrl) {
  if (!textOrUrl) return '';
  if (/^https?:\/\//i.test(textOrUrl.trim())) {
    const res = await axios.get(textOrUrl);
    const $ = cheerio.load(res.data);
    return $('body').text();
  }
  return textOrUrl;
}

// Compare resume text with job description
function analyze(resumeText, jobText) {
  const resumeWords = new Set(cleanText(resumeText).split(/\s+/).filter(Boolean));
  const jobWords = new Set(cleanText(jobText).split(/\s+/).filter(Boolean));
  let matchCount = 0;
  const missing = [];
  jobWords.forEach((word) => {
    if (resumeWords.has(word)) {
      matchCount++;
    } else {
      missing.push(word);
    }
  });
  const score = jobWords.size ? Math.round((matchCount / jobWords.size) * 100) : 0;
  return { score, missing };
}

// Generate optimized resume PDF
function generatePdf(originalText, missingWords, res) {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(12).text(originalText);
  doc.addPage().fontSize(14).text('Suggested Improvements:', { underline: true });
  doc.fontSize(12).list(missingWords);
  doc.end();
}

app.post('/optimize', upload.single('resume'), async (req, res) => {
  try {
    const jobDesc = await getJobDescription(req.body.jobDesc || '');
    const resumeText = await extractResumeText(req.file.path, req.file.mimetype);
    const before = analyze(resumeText, jobDesc);
    const optimizedText = resumeText + '\n\nMissing Keywords Added:\n' + before.missing.join(', ');
    const after = analyze(optimizedText, jobDesc);
    fs.unlinkSync(req.file.path); // clean uploaded file
    res.json({
      beforeScore: before.score,
      afterScore: after.score,
      missing: before.missing,
      optimizedText,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/download', (req, res) => {
  const text = req.query.text || '';
  const missing = req.query.missing ? req.query.missing.split(',') : [];
  generatePdf(text, missing, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
