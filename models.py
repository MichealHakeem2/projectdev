from transformers import pipeline

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def classify_comment(comment):
    labels = ["genuine", "ai-generated", "hype"]
    result = classifier(comment, candidate_labels=labels)
    return {
        "label": result['labels'][0], 
        "score": float(result['scores'][0]),
        "score_percentage": f"{round(result['scores'][0] * 100, 1)}%"
    }
