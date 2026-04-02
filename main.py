import torch
from transformers import AutoModelForSequenceClassification, BertTokenizer
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os

app = FastAPI(title="Spam Detection API")

# Enable CORS (Good practice even if we serve static files from the same origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# Load Model & Tokenizer
# --------------------------
MODEL_DIR = "./saved_model"

try:
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    tokenizer = BertTokenizer.from_pretrained(MODEL_DIR)
    device = torch.device("cpu")
    model.to(device)
    model.eval()
    print("Model and tokenizer loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    tokenizer = None


class EmailRequest(BaseModel):
    text: str

# --------------------------
# Prediction Endpoint
# --------------------------
@app.post("/predict")
def predict_email(request: EmailRequest):
    if not model or not tokenizer:
        raise HTTPException(status_code=500, detail="Model is not loaded properly.")

    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text provided.")

    encoding = tokenizer(
        text,
        padding=True,
        truncation=True,
        max_length=128,
        return_tensors="pt"
    )

    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)

    with torch.no_grad():
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask
        )

    logits = outputs.logits
    probabilities = torch.softmax(logits, dim=1)
    prediction = torch.argmax(probabilities, dim=1).item()

    confidence = probabilities[0][prediction].item()

    return {
        "prediction": prediction,  # 1 for Spam, 0 for Ham (assuming this based on app.py)
        "confidence": confidence,
        "label": "SPAM" if prediction == 1 else "HAM"
    }

# --------------------------
# Mount Static Files (Frontend)
# --------------------------
# We will place our HTML/CSS/JS in a directory named 'frontend'
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
os.makedirs(frontend_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
