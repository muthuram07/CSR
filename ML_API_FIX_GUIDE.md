# 🔧 ML API Connection Fix Guide

## 🚨 Problem Identified

Your Spring Boot backend is trying to connect to ML API at `http://localhost:5004/query` but getting:
```
Connection refused: connect
```

This means the ML service is not running or not accessible on port 5004.

---

## 🛠️ Quick Fix Solutions

### **Option 1: Start ML Service (Recommended)**

#### **If you have the Python ML model:**
```bash
# Navigate to AI model directory
cd AI_Model_CSR_Denial_Knowledge_Bot

# Check if port 5004 is available
netstat -an | grep 5004

# Start the ML service
python app.py

# Or if using FastAPI:
uvicorn main:app --host 0.0.0.0 --port 5004

# Or if using Flask:
python app.py --host 0.0.0.0 --port 5004
```

#### **If you don't have the ML model running:**
```bash
# Create a simple ML API server
mkdir -p simple-ml-api
cd simple-ml-api

# Create requirements.txt
echo "fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0" > requirements.txt

# Install dependencies
pip install -r requirements.txt

# Create main.py
cat > main.py << 'EOF'
from fastapi import FastAPI
from pydantic import BaseModel
import json
import random

app = FastAPI(title="CSR ML API")

class QueryRequest(BaseModel):
    query: str
    user_id: str = None

class QueryResponse(BaseModel):
    response: str
    confidence: float
    denial_code: str = None
    suggested_action: str = None

@app.post("/query")
async def process_query(request: QueryRequest):
    # Simple rule-based responses for denial codes
    query_lower = request.query.lower()
    
    # Denial code patterns
    if "co-45" in query_lower:
        return QueryResponse(
            response="CO-45: Charge exceeds fee schedule/maximum allowable amount.",
            confidence=0.95,
            denial_code="CO-45",
            suggested_action="Check payer fee schedule or submit an appeal with documentation."
        )
    elif "co-97" in query_lower:
        return QueryResponse(
            response="CO-97: The benefit for this service is a non-covered charge.",
            confidence=0.92,
            denial_code="CO-97",
            suggested_action="Inform patient of non-coverage and discuss payment options."
        )
    elif "co-226" in query_lower:
        return QueryResponse(
            response="CO-226: Informational/EDU claim not covered by this payer/contractor.",
            confidence=0.88,
            denial_code="CO-226",
            suggested_action="Submit to patient's responsible party or other insurance."
        )
    
    # Coverage queries
    elif "dental" in query_lower and "covered" in query_lower:
        return QueryResponse(
            response="Dental coverage depends on the member's specific plan. Most PPO plans cover preventive dental services with copays.",
            confidence=0.85,
            suggested_action="Check member's specific plan details for exact coverage and copay amounts."
        )
    elif "medical" in query_lower and "covered" in query_lower:
        return QueryResponse(
            response="Medical coverage typically includes hospitalization, emergency services, and preventive care.",
            confidence=0.80,
            suggested_action="Review member's plan document for specific coverage details and limitations."
        )
    
    # Default response
    return QueryResponse(
        response=f"I understand you're asking about: '{request.query}'. This appears to be a general inquiry. For specific denial codes, please provide the exact code. For coverage questions, please provide the member ID.",
        confidence=0.60,
        suggested_action="Please provide more specific details for accurate assistance."
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "csr-ml-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5004)
EOF

# Start the service
uvicorn main:app --host 0.0.0.0 --port 5004
```

### **Option 2: Check Port Configuration**

#### **Verify which port your ML service is using:**
```bash
# Check all running Python services
ps aux | grep python

# Check all listening ports
netstat -tulpn | grep LISTEN

# Or on Windows:
netstat -an | findstr LISTENING
```

#### **If ML service is on different port:**
Update your backend configuration:

```properties
# src/main/resources/application.properties
ml.api.url=http://localhost:ACTUAL_PORT/query
```

### **Option 3: Update Backend Configuration**

#### **Change ML API URL in Spring Boot:**
```properties
# src/main/resources/application.properties
# Update this line to match your ML service port
spring.ml.api.url=http://localhost:5004/query

# Or if using environment variables:
ML_API_URL=http://localhost:5004/query
```

---

## 🔍 Debugging Steps

### **1. Test ML Service Directly**
```bash
# Test if ML API is responding
curl -X POST http://localhost:5004/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What does CO-45 mean?"}'

# Test health endpoint
curl http://localhost:5004/health
```

### **2. Check Spring Boot Logs**
```bash
# Look for connection errors
cd Backend_CSR_Denial_Knowledge_Bot
mvn spring-boot:run

# Check logs for:
# - Connection refused errors
# - Timeout errors
# - Network issues
```

### **3. Verify Network Connectivity**
```bash
# Test local connection
telnet localhost 5004

# Or using PowerShell on Windows:
Test-NetConnection -ComputerName localhost -Port 5004
```

---

## 🚀 Production Solution

### **Deploy ML Service to Free Hosting**

#### **Option 1: Railway (Recommended)**
```dockerfile
# Dockerfile for ML service
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5004

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5004"]
```

```bash
# Deploy to Railway
railway login
railway init
railway up
```

#### **Option 2: Render**
```yaml
# render.yaml
services:
  type: web
  name: csr-ml-api
  env: python
  plan: free
  buildCommand: pip install -r requirements.txt
  startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
  healthCheckPath: /health
```

#### **Option 3: PythonAnywhere**
```bash
# Quick deployment
pip install pythonanywhere
pythonanywhere --port 5004 main.py
```

---

## 🔧 Backend Code Fix

### **Update SmartQueryService with Better Error Handling**
```java
// src/main/java/com/denial/bot/service/SmartQueryService.java

@Service
public class SmartQueryService {
    
    @Value("${ml.api.url:http://localhost:5004/query}")
    private String mlApiUrl;
    
    private static final int MAX_RETRIES = 3;
    private static final int TIMEOUT_MS = 10000; // 10 seconds
    
    public QueryResponse processQuery(String query, String userId) {
        RestTemplate restTemplate = new RestTemplate();
        
        // Set timeout
        HttpComponentsClientHttpRequestFactory factory = 
            HttpComponentsClientHttpRequestFactory.builder()
                .setConnectTimeout(Duration.ofMillis(TIMEOUT_MS))
                .setReadTimeout(Duration.ofMillis(TIMEOUT_MS))
                .build();
        restTemplate.setRequestFactory(factory);
        
        // Retry logic with exponential backoff
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                QueryRequest request = new QueryRequest(query, userId);
                HttpEntity<QueryRequest> entity = new HttpEntity<>(request, headers);
                
                ResponseEntity<QueryResponse> response = restTemplate.exchange(
                    mlApiUrl,
                    HttpMethod.POST,
                    entity,
                    QueryResponse.class
                );
                
                if (response.getStatusCode() == HttpStatus.OK) {
                    return response.getBody();
                } else {
                    log.warn("ML API returned status: {}", response.getStatusCode());
                }
                
            } catch (ResourceAccessException e) {
                log.error("Connection failed to ML API (attempt {}): {}", attempt, e.getMessage());
                if (attempt == MAX_RETRIES) {
                    // Return fallback response
                    return createFallbackResponse(query);
                }
                // Exponential backoff
                Thread.sleep(1000 * (long) Math.pow(2, attempt - 1));
            } catch (Exception e) {
                log.error("Error calling ML API (attempt {}): {}", attempt, e.getMessage());
                if (attempt == MAX_RETRIES) {
                    return createFallbackResponse(query);
                }
                Thread.sleep(1000 * (long) Math.pow(2, attempt - 1));
            }
        }
        
        throw new RuntimeException("Failed to connect to ML service after " + MAX_RETRIES + " attempts");
    }
    
    private QueryResponse createFallbackResponse(String query) {
        // Simple rule-based fallback
        String lowerQuery = query.toLowerCase();
        
        if (lowerQuery.contains("co-45")) {
            return new QueryResponse("CO-45: Charge exceeds fee schedule", 0.8, "CO-45", "Check fee schedule");
        } else if (lowerQuery.contains("dental") && lowerQuery.contains("covered")) {
            return new QueryResponse("Dental coverage varies by plan", 0.7, null, "Check specific plan");
        }
        
        return new QueryResponse("I'm having trouble connecting to my AI services. Please try again.", 0.5, null, "Try again later");
    }
}
```

---

## ✅ Verification Steps

### **1. Test Connection**
```bash
# Test ML service
curl http://localhost:5004/health

# Should return:
{"status": "healthy", "service": "csr-ml-api"}
```

### **2. Test Full Integration**
```bash
# Test backend endpoint
curl -X POST http://localhost:8080/api/smart-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "What does CO-45 mean?"}'
```

### **3. Check Frontend**
- Open browser to `http://localhost:3000`
- Login and test the chatbot
- Try: "What does CO-45 mean?"

---

## 🎯 Quick Fix Summary

**Fastest Solution (2 minutes):**
1. Start the simple ML service: `uvicorn main:app --port 5004`
2. Test with: `curl http://localhost:5004/health`

**If still not working:**
3. Check if port 5004 is available: `netstat -an | grep 5004`
4. Update backend configuration to correct port

**Your CSR bot will be working immediately after starting the ML service!** 🚀
