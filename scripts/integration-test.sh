#!/bin/bash

set -e

GATEWAY_URL="http://localhost:8080"
DOCUMENT_SERVICE_URL="http://localhost:8083"
PRESENTATION_SERVICE_URL="http://localhost:8081"
AI_SERVICE_URL="http://localhost:8082"

echo "========================================="
echo "   AI Presentation Builder Integration"
echo "========================================="

echo ""
echo "1. Checking service health..."

echo "Checking API Gateway..."
curl --fail "$GATEWAY_URL/health"
echo " ✓"

echo "Checking Presentation Service..."
curl --fail "$PRESENTATION_SERVICE_URL/health"
echo " ✓"

echo "Checking AI Service..."
curl --fail "$AI_SERVICE_URL/health"
echo " ✓"

echo "Checking Document Service..."
curl --fail "$DOCUMENT_SERVICE_URL/health"
echo " ✓"

echo ""
echo "All health checks passed!"
echo ""

echo "2. Generating presentation..."

GENERATE_RESPONSE=$(curl --fail --silent --show-error \
  -X POST "$GATEWAY_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a short presentation about Artificial Intelligence",
    "slide_count": 5
  }')

echo "$GENERATE_RESPONSE"

echo ""
echo "Presentation generation request passed!"
echo ""

echo "3. Updating a slide..."

PRESENTATION_ID=$(echo "$GENERATE_RESPONSE" | jq -r '.presentation_id')

PATCH_RESPONSE=$(curl --fail --silent --show-error \
  -X PATCH "$GATEWAY_URL/presentations/$PRESENTATION_ID/slides/1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Artificial Intelligence",
    "content": "AI enables machines to perform tasks that normally require human intelligence."
  }')

echo "$PATCH_RESPONSE"

echo ""
echo "Slide PATCH request passed!"
echo ""

echo "4. Regenerating slide..."

REGENERATE_RESPONSE=$(curl --fail --silent --show-error \
  -X POST "$GATEWAY_URL/presentations/$PRESENTATION_ID/slides/1/regenerate" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Make this slide more concise and engaging"
  }')

echo "$REGENERATE_RESPONSE"

echo ""
echo "Slide regeneration request passed!"
echo ""

echo "========================================="
echo " ALL INTEGRATION TESTS PASSED"
echo "========================================="