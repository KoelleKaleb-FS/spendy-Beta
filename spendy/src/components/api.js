const API_URL = 'https://spendy-beta.onrender.com/api';

export const createBudget = async (totalBudget) => {
  const response = await fetch(`${API_URL}/budget`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ totalBudget }),
  });

  if (!response.ok) {
    throw new Error('Failed to create budget');
  }

  return response.json();
};

export const getBudget = async () => {
  const response = await fetch(`${API_URL}/budget`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }

  return response.json();
};
