# AI Finance Assistant - Testing Guide

## Quick Start Testing

### 1. Frontend Testing
Open the app and navigate to "AI Finance Assistant" tab.

### 2. Test API Directly

#### Test Health Check
```bash
curl http://localhost:3000/api/v1/health
```

#### Test Chat API (POST)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "message": "What is GST?",
    "category": "gst",
    "useRAG": true
  }'
```

#### Expected Response
```json
{
  "success": true,
  "data": {
    "answer": "GST (Goods and Services Tax) is...",
    "sources": [...],
    "category": "gst"
  }
}
```

#### Get Chat History (GET)
```bash
curl http://localhost:3000/api/ai/chat?limit=10 \
  -H "x-user-id: test-user-123"
```

## Test Scenarios

### Scenario 1: GST Question
**Input:** "What are GST registration requirements?"
**Expected:** Detailed response about GST registration with 18% standard rate info

### Scenario 2: Tax Planning
**Input:** "Help me with tax planning for my business"
**Expected:** Personalized tax optimization strategies

### Scenario 3: Accounting Help
**Input:** "Explain the balance sheet"
**Expected:** Detailed explanation of balance sheet components

### Scenario 4: General Finance
**Input:** "What's the difference between profit and cash flow?"
**Expected:** Clear explanation with examples

## Browser Console Testing

Add this to your browser console while on the chatbot page:

```javascript
// Get useAIChat hook state (requires component exposure)
console.log('Messages:', messages);
console.log('Loading:', loading);
console.log('Error:', error);

// Manually test API
fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': localStorage.getItem('userId')
  },
  body: JSON.stringify({
    message: 'Test message',
    category: 'general'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

## Environment Verification

Before testing, verify:

1. **GEMINI_API_KEY is set**
   ```bash
   echo $GEMINI_API_KEY
   ```

2. **Database is connected**
   ```bash
   # Check Supabase connection
   curl -s https://[your-project].supabase.co/rest/v1/chat_history \
     -H "apikey: [your-anon-key]" | head -20
   ```

3. **API route is accessible**
   ```bash
   curl http://localhost:3000/api/ai/chat -I
   ```

## Performance Testing

### Response Time
Measure response time for different query types:

```bash
time curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"message": "What is GST?"}'
```

Expected: 2-5 seconds for Gemini response

### Load Testing
Test with multiple concurrent requests:

```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/ai/chat \
    -H "Content-Type: application/json" \
    -H "x-user-id: user-$i" \
    -d "{\"message\": \"Question $i\"}" &
done
wait
```

## Debugging

### Enable Logging
Add debug logs in `lib/hooks/useAIChat.ts`:

```typescript
console.log('[useAIChat] Sending message:', message);
console.log('[useAIChat] Response:', result);
```

### Network Tab
1. Open DevTools → Network tab
2. Send a message
3. Check `/api/ai/chat` request:
   - Headers (verify x-user-id is sent)
   - Response (should have data.answer)
   - Timing (how long it took)

### Check Database
In Supabase dashboard:
1. Go to SQL Editor
2. Run: `SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 10;`
3. Verify messages are being saved

## Known Issues & Solutions

### Issue: "User ID required"
**Solution:** Make sure x-user-id header is being sent
```javascript
// In useAIChat hook, verify this line:
const userId = getUserId(); // Should always return a value
```

### Issue: Empty responses
**Solution:** Check if Gemini API is returning text
1. Add console.log in `ai.service.ts` after `model.generateContent()`
2. Verify response has `.text()` method

### Issue: Slow responses
**Solution:** This is normal for Gemini - takes 3-5 seconds
- Check Gemini API status
- Verify network latency
- Consider streaming implementation

### Issue: Database save failures
**Solution:** Check Supabase connection
1. Verify SUPABASE_URL and SUPABASE_ANON_KEY
2. Check RLS policies allow inserts to chat_history
3. Ensure user_id column is not null

## Success Criteria

The chatbot is working correctly when:
- ✅ Messages appear in real-time UI
- ✅ Responses come from Gemini (not hardcoded)
- ✅ Conversation history is saved to database
- ✅ Error messages display when issues occur
- ✅ User ID is managed automatically
- ✅ Sources/citations appear for RAG results
- ✅ Category detection works (GST/tax/accounting)

## Production Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] Environment variables set in Vercel
- [ ] Database migrations complete
- [ ] RLS policies configured
- [ ] Error handling tested
- [ ] Load tested with expected user volume
- [ ] Monitoring/logging configured
- [ ] Rate limiting implemented (optional)

---

**Ready to test! Happy chatting!** 🚀
