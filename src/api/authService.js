const API_BASE_URL = 'http://localhost:5001/api';

async function requestAuth(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || 'Ошибка запроса аутентификации');
  }

  return result;
}

export const registerUser = (data) => requestAuth('/auth/register', data);
export const loginUser = (data) => requestAuth('/auth/login', data);
