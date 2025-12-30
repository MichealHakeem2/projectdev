import spacy
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
import nltk

nltk.download('stopwords')
nlp = spacy.load("en_core_web_sm")

def extract_keywords(text_list, top_n=5):
    """Extract top N keywords using TF-IDF"""
    vectorizer = TfidfVectorizer(stop_words=stopwords.words('english'))
    X = vectorizer.fit_transform(text_list)
    keywords_list = []
    for i, text in enumerate(text_list):
        scores = zip(vectorizer.get_feature_names_out(), X[i].toarray()[0])
        sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
        keywords = [word for word, score in sorted_scores[:top_n]]
        keywords_list.append(keywords)
    return keywords_list

def generate_trending_hashtags(text_list, top_n=5):
    """Generate trending hashtags from high-frequency words"""
    if not text_list:
        return []
    
    vectorizer = CountVectorizer(stop_words=stopwords.words('english'), max_features=top_n)
    try:
        X = vectorizer.fit_transform(text_list)
        keywords = vectorizer.get_feature_names_out()
        
        counts = X.sum(axis=0).A1
        
        freq_dist = zip(keywords, counts)
        sorted_freq = sorted(freq_dist, key=lambda x: x[1], reverse=True)
        
        hashtags = [f"#{word}" for word, count in sorted_freq[:top_n]]
        return hashtags
    except ValueError:
        return []
