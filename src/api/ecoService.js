const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function safeJsonParse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Сервер вернул не JSON: ${text.slice(0, 120)}`);
  }
}

export const calculateEcoData = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/calculate`;
    const token = localStorage.getItem('ecoaiUser') ? JSON.parse(localStorage.getItem('ecoaiUser')).email : localStorage.getItem('ecoaiToken');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const result = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(result.message || 'Ошибка сервера при расчете данных');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getUserHistory = async () => {
  const url = `${API_BASE_URL}/api/user/history`;
  const token = localStorage.getItem('ecoaiUser') ? JSON.parse(localStorage.getItem('ecoaiUser')).email : localStorage.getItem('ecoaiToken');
  
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await safeJsonParse(response);
};

export const getUserDynamics = async () => {
  const url = `${API_BASE_URL}/api/user/dynamics`;
  const token = localStorage.getItem('ecoaiUser') ? JSON.parse(localStorage.getItem('ecoaiUser')).email : localStorage.getItem('ecoaiToken');
  
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await safeJsonParse(response);
};
