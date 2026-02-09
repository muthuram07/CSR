import os
import re
import json
import logging
from datetime import datetime

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import requests

import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.getcwd()
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets')
INDEX_DIR = os.path.join(BASE_DIR, 'index_store')

# OPTIMIZATION: Using a much lighter model for 512MB RAM limit
DEFAULT_EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL', 'paraphrase-MiniLM-L3-v2')
TOP_K = int(os.environ.get('TOP_K', '3'))

USE_OLLAMA = os.environ.get('USE_OLLAMA', 'false').strip().lower() in ('1', 'true', 'yes')
OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'qwen2.5:0.5b') # Use smaller model if using Ollama

def _ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def _safe_str(v):
    return str(v) if v is not None else ''

def _detect_intent(query_lower, query_type=None):
    if query_type:
        qt = str(query_type).strip().lower()
        if qt in ('denial', 'denial_code'): return 'denial'
        if qt in ('member', 'member_lookup'): return 'member'
        if qt in ('plan', 'coverage', 'plan_coverage'): return 'plan'

    if any(w in query_lower for w in ['denial', 'reject', 'rejected', 'denied', 'co-', 'pr-']): return 'denial'
    if any(w in query_lower for w in ['member', 'patient', 'subscriber']): return 'member'
    if any(w in query_lower for w in ['plan', 'coverage', 'covered', 'benefit']): return 'plan'
    return 'general'

class TrainedCSRModelService:
    def __init__(self):
        self.denial_data = None
        self.member_data = None
        self.plan_data = None
        self.embedder = None
        self.faiss_index = None
        self.corpus = []
        self.corpus_meta = []
        self._load_csv_data()
        self._init_retriever()

    def _load_csv_data(self):
        """OPTIMIZATION: Load only necessary columns to save RAM"""
        try:
            # Denial Data
            self.denial_data = pd.read_csv(
                os.path.join(DATASETS_DIR, 'denial_reason.csv'),
                usecols=['user_code', 'denial_code', 'description', 'suggested_action'],
                dtype={'user_code': 'category', 'denial_code': 'string'}
            )
            # Member Data
            self.member_data = pd.read_csv(
                os.path.join(DATASETS_DIR, 'member_subscription.csv'),
                usecols=['member_id', 'member_name', 'plan_id', 'status', 'effective_date', 'end_date']
            )
            # Plan Data
            self.plan_data = pd.read_csv(
                os.path.join(DATASETS_DIR, 'plan_coverage.csv')
            )
            logger.info(f"Loaded CSVs efficiently: {len(self.denial_data)} denials.")
        except Exception as e:
            logger.error(f"Error loading CSV data: {e}")

    def _init_retriever(self):
        try:
            if self.denial_data is None: return
            _ensure_dir(INDEX_DIR)
            
            # Load Embedder - Move to CPU to save memory
            logger.info(f"Loading embedding model: {DEFAULT_EMBEDDING_MODEL}")
            self.embedder = SentenceTransformer(DEFAULT_EMBEDDING_MODEL, device='cpu')
            
            self.corpus, self.corpus_meta = self._build_corpus()
            
            # Build Index
            embeddings = self.embedder.encode(self.corpus, convert_to_numpy=True, normalize_embeddings=True)
            dim = embeddings.shape[1]
            self.faiss_index = faiss.IndexFlatIP(dim)
            self.faiss_index.add(embeddings.astype('float32'))
            
            logger.info("Retriever Initialized.")
        except Exception as e:
            logger.error(f"Failed retriever init: {e}")

    def _build_corpus(self):
        corpus, meta = [], []
        # Process denials
        for _, row in self.denial_data.iterrows():
            text = f"Denial {row['user_code']}{row['denial_code']}: {row['description']}"
            corpus.append(text)
            meta.append({'source': 'denial_reason', 'user_code': row['user_code'], 'denial_code': row['denial_code']})
        # Process plans (sample some to save memory if dataset is huge)
        for _, row in self.plan_data.iterrows():
            text = f"Plan {row['plan_id']} covers {row['covered_services']} with {row['copay']} copay."
            corpus.append(text)
            meta.append({'source': 'plan_coverage', 'plan_id': row['plan_id']})
        return corpus, meta

    def process_query(self, user_query, query_type=None):
        query_lower = user_query.lower()
        # 1. Try Direct Lookup First (Zero RAM usage)
        direct = self._direct_csv_lookup(query_lower, query_type)
        if direct: return {'success': True, 'response': direct, 'source': 'direct_lookup'}

        # 2. Semantic Search
        if not self.faiss_index: return {'success': False, 'response': "I'm still warming up."}
        
        q_emb = self.embedder.encode([user_query], normalize_embeddings=True).astype('float32')
        scores, idxs = self.faiss_index.search(q_emb, TOP_K)
        
        top_idx = idxs[0][0]
        return {
            'success': True, 
            'response': {'message': self.corpus[top_idx], 'type': 'semantic_help'},
            'source': 'semantic_search'
        }

    def _direct_csv_lookup(self, query, query_type):
        # Simplified regex for denial codes (e.g., CO-123)
        match = re.search(r'([a-z]{1,2})[-]?(\d{1,3})', query)
        if match:
            u_code, d_code = match.group(1).upper(), match.group(2)
            res = self.denial_data[(self.denial_data['user_code'] == u_code) & (self.denial_data['denial_code'] == d_code)]
            if not res.empty:
                row = res.iloc[0]
                return {'type': 'denial_explanation', 'description': row['description'], 'action': row['suggested_action']}
        return None

app = Flask(__name__)
CORS(app)
model_service = TrainedCSRModelService()

@app.route('/query', methods=['POST'])
def handle_query():
    data = request.get_json() or {}
    query = data.get('query', '').strip()
    if not query: return jsonify({'success': False, 'error': 'No query'}), 400
    return jsonify(model_service.process_query(query, data.get('type')))

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'online', 'memory_optimized': True})

if __name__ == '__main__':
    # Render uses the PORT environment variable
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
