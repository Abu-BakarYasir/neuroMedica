// Test script for Chrome DevTools Console
// Copy and paste this into Chrome DevTools Console (F12)

async function testChatAPI() {
  console.log("🧪 Testing Chat API...\n");
  
  // Step 1: Get Supabase session token
  console.log("Step 1: Getting Supabase session...");
  const supabaseUrl = localStorage.getItem('sb-' + window.location.hostname.split('.')[0] + '-auth-token');
  
  // Try to get token from Supabase client if available
  let token = null;
  try {
    if (window.supabase) {
      const { data: { session } } = await window.supabase.auth.getSession();
      token = session?.access_token;
      console.log("✅ Session found:", session ? "Yes" : "No");
    }
  } catch (e) {
    console.log("⚠️ Could not access Supabase client:", e.message);
  }
  
  if (!token) {
    console.error("❌ No authentication token found. Please log in first.");
    console.log("\nTo get your token manually:");
    console.log("1. Open Application tab → Local Storage");
    console.log("2. Look for keys starting with 'sb-'");
    console.log("3. Find the 'access_token' value");
    return;
  }
  
  console.log("✅ Token found (length:", token.length, "chars)\n");
  
  // Step 2: Test backend health
  console.log("Step 2: Testing backend health...");
  try {
    const healthResponse = await fetch("http://localhost:8001/health");
    const healthData = await healthResponse.json();
    console.log("✅ Backend is healthy:", healthData);
  } catch (e) {
    console.error("❌ Backend health check failed:", e.message);
    console.log("Make sure backend is running on port 8001");
    return;
  }
  console.log("");
  
  // Step 3: Test chat API endpoint directly
  console.log("Step 3: Testing backend chat endpoint directly...");
  try {
    const backendResponse = await fetch("http://localhost:8001/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: "Hello, what is diabetes?",
        conversation_id: null,
        history: [],
      }),
    });
    
    const backendData = await backendResponse.json();
    if (backendResponse.ok) {
      console.log("✅ Backend response:", backendData);
    } else {
      console.error("❌ Backend error:", backendData);
    }
  } catch (e) {
    console.error("❌ Backend request failed:", e.message);
  }
  console.log("");
  
  // Step 4: Test frontend API route
  console.log("Step 4: Testing frontend API route (/api/chat)...");
  try {
    const frontendResponse = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: "Hello, what is diabetes?",
        conversationId: null,
        history: [],
      }),
    });
    
    const frontendData = await frontendResponse.json();
    if (frontendResponse.ok) {
      console.log("✅ Frontend API response:", frontendData);
    } else {
      console.error("❌ Frontend API error:", frontendData);
    }
  } catch (e) {
    console.error("❌ Frontend API request failed:", e.message);
  }
  
  console.log("\n✅ Test complete!");
}

// Run the test
testChatAPI();


