from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from utils import extract_keywords, generate_trending_hashtags
from models import classify_comment

app = FastAPI(title="Trendverse AI")

class CommentsRequest(BaseModel):
    comments: List[str]

@app.post("/analyze")
def analyze_comments(request: CommentsRequest):
    comments = request.comments
    keywords = extract_keywords(comments)
    classification = [classify_comment(c) for c in comments]
    hashtags = generate_trending_hashtags(comments)

    results = []
    for c, k, cl in zip(comments, keywords, classification):
        results.append({
            "comment": c,
            "keywords": k,
            "classification": cl
        })
    return {"results": results, "hashtags": hashtags}
