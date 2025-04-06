# ⚡ Power Assistant

![Hackathon Project](https://img.shields.io/badge/Hackathon-Project-blue)
![Status](https://img.shields.io/badge/Status-Submitted-success)
![License](https://img.shields.io/badge/License-MIT-green)
![Platform](https://img.shields.io/badge/Platform-Web%20%26%20Voice-orange)

---

> 🎙️ **AI-powered voice chatbot for real-time Power Grid query resolution**, built with Flask, advanced NLP, semantic search, and audio processing.  
> 🎯 Designed for technical personnel to retrieve crucial transformer data, safety checks, and operational parameters instantly via voice or text.

---

## 🚀 Live Demo

🎥 [Watch our working demo on YouTube](https://youtu.be/si8NTiJj-I8?si=3BR5ijK7lnS39cQH)

---

## ✨ Features

- ✅ Voice + Text input (Multimodal)
- ✅ Real-time transformer & substation query resolution
- ✅ Semantic PDF search for accurate, deep data extraction
- ✅ Intelligent Chat UI with typing indicator & history
- ✅ Dark-mode styled interface
- ✅ Pre-trained model integration (local or remote)
- ✅ Optimized backend with Flask & OpenAI embeddings

---

## 📦 Project Structure

```bash
Power-Assistant/
│
├── backend/                  # Flask API backend
│   ├── app.py                # Main Flask server
│   ├── model.py              # NLP logic & search
│   └── ...
│
├── frontend/                 # HTML/CSS/JS chatbot UI
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
├── pdf_data/                 # Knowledge base PDFs
├── Power_Grid_Ltd/           # Extra utilities
├── .gitignore
├── README.md
└── requirements.txt

## 🧠 How It Works
User types or speaks a query (e.g., “What is the dew point for transformer insulation?”)

Voice is converted to text via SpeechRecognition.

Semantic Search extracts the closest match from the PDF using Sentence-BERT embeddings.

Answer is displayed via chatbot UI.

## 🧪 Sample Queries to Try
Permissible dew point limit at 23.11°C

Standing time after oil circulation in transformer

Tan delta value of RIP bushing

Winding resistance deviation limit

Pre-commissioning checks on CT

✅ Used .gitignore for clean commits

✅ Removed 600+ MB of large files using git-filter-repo

✅ All team members used feature branches + pull requests

✅ Video demo linked directly in README

✅ Clearly structured repo with backend/frontend separation

✅ GitHub Actions ready (optional CI integration)

## 📦 Setup instructions

# 1. Clone the repo
git clone https://github.com/Harshal-Halgarkar/Power-Assistant.git
cd Power-Assistant

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the Flask server
cd backend
python app.py


