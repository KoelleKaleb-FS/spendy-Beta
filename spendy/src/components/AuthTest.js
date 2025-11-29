import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export default function AuthTest() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [out, setOut] = useState('');

  async function runTest() {
    if (!isAuthenticated) {
      setOut('Please log in first.');
      return;
    }
    try {
      const token = await getAccessTokenSilently({ audience: 'https://spendy-api' });
      console.log('token (first 64 chars):', token && token.slice(0, 64));
      setOut('Got token — calling endpoints...');

      const [forecastRes, recurringRes] = await Promise.all([
        fetch(`${API_BASE}/api/budget/forecast`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/recurring/monthly-impact`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const forecastJson = await forecastRes.json().catch(() => ({ status: forecastRes.status }));
      const recurringJson = await recurringRes.json().catch(() => ({ status: recurringRes.status }));

      console.log('/api/budget/forecast', forecastRes.status, forecastJson);
      console.log('/api/recurring/monthly-impact', recurringRes.status, recurringJson);

      setOut(JSON.stringify({
        forecastStatus: forecastRes.status,
        forecast: forecastJson,
        recurringStatus: recurringRes.status,
        recurring: recurringJson,
      }, null, 2));
    } catch (err) {
      console.error(err);
      setOut('Error: ' + (err.message || err));
    }
  }

  return (
    <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6, marginTop: 12 }}>
      <h4>Auth SDK Test</h4>
      <p>Checks getAccessTokenSilently() then calls forecast + recurring endpoints.</p>
      <button onClick={runTest}>Run auth test</button>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{out}</pre>
    </div>
  );
}
