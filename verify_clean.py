import requests
import json

url = "http://127.0.0.1:8000/analyze"
comments = {
    "comments": [
        "This product is amazing! I love the quality.",
        "It's okay, but could be better.",
        "Buy this now! Best crypto investment ever! guaranteed returns!",
        "The AI generated this text completely.",
        "Trend trend trend hashtag hashtag keyword keyword keyword"
    ]
}

try:
    response = requests.post(url, json=comments)
    if response.status_code == 200:
        data = response.json()
        print("Response Status: 200 OK")
        if "hashtags" in data and len(data["results"]) > 0:
            print("PASS: API functionality verified")
        else:
            print("FAIL: API check failed")
    else:
        print(f"Failed with status code: {response.status_code}")
except Exception as e:
    print(f"Error connecting to server: {e}")
