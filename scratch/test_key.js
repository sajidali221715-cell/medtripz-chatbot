async function testKey() {
  const apiKey = "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";
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'user', content: 'hi' }]
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
testKey();
