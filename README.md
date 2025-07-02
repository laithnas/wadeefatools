# Wadeefa Tools

This repository includes a simple Resume Optimizer widget. The widget can be embedded on any HTML page and provides a basic analysis comparing a resume to a job description.

## Getting Started

Install dependencies and start the server:

```bash
cd resume_optimizer
npm install
node server.js
```

Then open `http://localhost:3000` in your browser.

### Quick preview via cURL

You can test the optimizer without a browser by posting a DOCX resume and a job
description string:

```bash
curl -F "resume=@myresume.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
     -F "jobDesc=developer python java" \
     http://localhost:3000/optimize
```

The server responds with a JSON object containing the score before/after and the
suggested missing keywords.

## Features

- Upload a PDF or DOCX resume
- Enter a job description or URL
- See a match score before and after suggested keyword additions
- Download an optimized PDF containing the missing keywords

The code is intentionally lightweight and modular so it can be extended.
