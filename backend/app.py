import os
import re
import sqlite3
import pickle
import torch
from flask import Flask, request, jsonify, render_template
from sentence_transformers import SentenceTransformer, util
from rapidfuzz import fuzz
from chatterbot import ChatBot
from chatterbot.trainers import ListTrainer
from pdfminer.high_level import extract_text
import numpy as np

app = Flask(__name__, template_folder="templates", static_folder="static")

# Load Sentence Transformer Model for Semantic Search
model = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L6-v2", device="cpu")

# ChatterBot Instance
chatbot = ChatBot("PDFChatBot")
trainer = ListTrainer(chatbot)

# Database Configuration
DATABASE = "pdf_data.db"

# 🔹 Step 1: Extract and Process PDF
def extract_pdf_text(pdf_path):
    """Extract text from a PDF and split into meaningful chunks."""
    try:
        text = extract_text(pdf_path)
        if not text:
            raise ValueError("No text extracted from the PDF.")

        # Custom splitting method to preserve context
        chunks = re.split(r"(?<=\n)([0-9]+\.[0-9]+|[-•]|\n{2,})", text)
        processed_chunks = [chunk.strip() for chunk in chunks if chunk.strip()]
        return processed_chunks
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return []

# 🔹 Step 2: Compute Embeddings and Store in DB
def compute_and_store_embeddings(pdf_path):
    """Compute embeddings for text chunks and store them in the database."""
    pdf_chunks = extract_pdf_text(pdf_path)
    if not pdf_chunks:
        print("No chunks extracted. Aborting storage.")
        return

    embeddings = model.encode(pdf_chunks, convert_to_tensor=False)

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM pdf_chunks")  # Clear previous data
        for chunk, embedding in zip(pdf_chunks, embeddings):
            serialized_embedding = pickle.dumps(embedding)
            cursor.execute("INSERT INTO pdf_chunks (chunk, embedding) VALUES (?, ?)", (chunk, serialized_embedding))
        conn.commit()
    print(f"Stored {len(pdf_chunks)} chunks in the database.")

# 🔹 Step 3: Load Chunks & Embeddings from DB
def load_data_from_db():
    """Retrieve stored text chunks and embeddings from the database."""
    chunks, embeddings = [], []
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT chunk, embedding FROM pdf_chunks")
        for row in cursor.fetchall():
            chunks.append(row[0])
            embeddings.append(pickle.loads(row[1]))  # Deserialize embeddings
    return chunks, np.array(embeddings)

# 🔹 Step 4: Train ChatterBot with PDF Data
def train_chatbot():
    """Train ChatterBot with structured Q&A from PDF."""
    pdf_chunks = extract_pdf_text("Power_Grid_Ltd.pdf")
    qa_pairs = []

    for chunk in pdf_chunks:
        sentences = chunk.split(". ")
        for i in range(len(sentences) - 1):
            question = sentences[i].strip()
            answer = sentences[i + 1].strip()

            # Store longer phrases instead of just sentences
            full_answer = ". ".join(sentences[i:i+3])  # Take 3 consecutive sentences
            
            if len(question) > 5 and len(full_answer) > 10:
                qa_pairs.append((question, full_answer))

    # Train ChatterBot with improved Q&A pairs
    trainer.train(sum([[q, a] for q, a in qa_pairs], []))
    print(f"Trained ChatterBot with {len(qa_pairs)} improved Q&A pairs.")


# 🔹 Step 5: Intelligent Query Handling
@app.route("/")
def home():
    return render_template("index.html")

MIN_CONFIDENCE = 0.5  # Adjust this threshold as needed

@app.route("/query", methods=["POST"])
def query():
    """Handles user queries using ChatterBot and Semantic Search."""
    data = request.json
    user_query = data.get("query", "").strip()

    if not user_query:
        return jsonify({"response": "Please enter a valid query."})

    # First attempt to get response from ChatterBot
    response = chatbot.get_response(user_query)
    if response.confidence > 0.5:
        return jsonify({
            "status": "success",
            "response": str(response).strip(),
            "source": "ChatterBot"
        })

    # If ChatterBot fails, use Semantic Search
    chunks, embeddings = load_data_from_db()
    print(f"Loaded {len(chunks)} chunks with {len(embeddings)} embeddings.")

    # 🔹 Compute the embedding for the user query
    query_embedding = model.encode(user_query, convert_to_tensor=True)  # Ensure tensor format

    # 🔹 Calculate cosine similarity
    similarities = util.pytorch_cos_sim(query_embedding, torch.tensor(embeddings))[0]
    best_match_index = torch.argmax(similarities).item()
    confidence_score = similarities[best_match_index].item()

    if confidence_score < 0.5:  # Increased threshold for better accuracy
        return jsonify({
            "status": "error",
            "response": "This question is out of scope. No relevant information found in the provided document.",
            "source": "None"
        })

    best_response = chunks[best_match_index] if chunks else "No relevant answer found in the PDF."
    
    extracted_answer = extract_best_sentence(best_response, user_query) if best_response else "No relevant answer found."

    return jsonify({
        "status": "success",
        "response": extracted_answer.strip(),
        "confidence_score": round(confidence_score, 2),
        "source": "Extracted from PDF"
    })





def extract_best_sentence(text, query):
    """Extracts the most relevant part of the retrieved text."""
    if not text:
        return "No relevant answer found."

    # Split into sentences
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    
    # Find top 2 relevant sentences instead of 1
    best_sentences = sorted(sentences, key=lambda s: fuzz.ratio(s.lower(), query.lower()), reverse=True)[:2]
    
    return " ".join(best_sentences) if best_sentences else "No clear answer found in the document."

# 🔹 Step 6: Response Formatting
def format_response(response_text):
    """
    Format the response in a structured manner.
    Ensures readability and consistency.
    """
    formatted_response = {
        "status": "success",
        "response": {
            "answer": response_text,
            "source": "Extracted from PDF",
            "confidence": "High" if len(response_text) > 20 else "Medium"
        }
    }
    return formatted_response

# 🔹 Step 7: Initialize & Train
if __name__ == "__main__":
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pdf_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chunk TEXT NOT NULL,
                embedding BLOB NOT NULL
            )
        """)
        conn.commit()
    
    compute_and_store_embeddings("Power_Grid_Ltd.pdf")  
    train_chatbot()
    app.run(debug=True)
