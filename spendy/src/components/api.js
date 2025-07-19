const API_URL = process.env.REACT_APP_API_URL || 'https://spendy-beta.onrender.com/api';


export const createBudget = async (totalBudget, token) => {
  const response = await fetch(`${API_URL}/budget`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount: totalBudget }),
  });

  if (!response.ok) {
    throw new Error('Failed to create budget');
  }

  return response.json();
};

export const getBudget = async (token) => {
  console.log('Sending token to backend:', token);
  const response = await fetch(`${API_URL}/budget`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }

  return response.json();
};
