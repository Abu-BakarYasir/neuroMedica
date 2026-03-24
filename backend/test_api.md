# Testing the Groq API Integration

## Start the Backend Server

1. Open a terminal in the `backend` directory
2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
3. Start the server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

## Test in Chrome DevTools

### 1. Open Chrome DevTools
- Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Go to the **Console** tab

### 2. Test the Health Endpoint
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Error:', err));
```

Expected response:
```json
{"status": "healthy"}
```

### 3. Test the Root Endpoint
```javascript
fetch('http://localhost:8000/')
  .then(r => r.json())
  .then(data => console.log('Root endpoint:', data))
  .catch(err => console.error('Error:', err));
```

Expected response:
```json
{
  "message": "NeuroMedica Chat API",
  "version": "1.0.0",
  "status": "running"
}
```

### 4. Test the Chat API (Requires Authentication)

First, you need to get a Supabase session token. In your Next.js app's browser console:

```javascript
// Get the Supabase session token from your app
// This assumes you're logged in to your Next.js app
const session = await window.supabase?.auth.getSession();
const token = session?.data?.session?.access_token;

if (!token) {
  console.error('No session token found. Please log in first.');
} else {
  // Test the chat endpoint
  fetch('http://localhost:8000/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'Hello, what is diabetes?',
      conversation_id: null,
      history: []
    })
  })
    .then(r => r.json())
    .then(data => {
      console.log('Chat response:', data);
      if (data.message) {
        console.log('AI Response:', data.message);
      }
    })
    .catch(err => console.error('Error:', err));
}
```

### 5. Alternative: Test from Network Tab

1. Open Chrome DevTools → **Network** tab
2. Make sure "Preserve log" is checked
3. Send a message through your chat interface
4. Look for the request to `/api/chat` or `/api/chat/message`
5. Click on the request to see:
   - **Headers**: Check the Authorization header
   - **Payload**: See the request body
   - **Response**: See the API response
   - **Preview**: Formatted JSON response

### 6. Check for Errors

If you see errors, check:
- **Console tab**: For JavaScript errors
- **Network tab**: For failed requests (red entries)
  - Click on failed requests to see error details
  - Check the status code (should be 200 for success)
  - Check the response body for error messages

## Common Issues

1. **CORS Error**: Make sure the backend is running and CORS is configured
2. **401 Unauthorized**: Check that you're logged in and the token is valid
3. **404 Not Found**: Verify the backend URL is correct (`http://localhost:8000`)
4. **500 Internal Server Error**: Check the backend terminal for error messages

## Expected Groq API Response

When working correctly, you should see a response like:
```json
{
  "message": "Diabetes is a chronic condition...",
  "conversation_id": "uuid-here",
  "timestamp": "2024-01-01T00:00:00"
}
```

The `message` field should contain the AI's response from Groq.


