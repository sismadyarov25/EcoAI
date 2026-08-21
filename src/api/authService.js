const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function requestAuth(path, payload) {
  const url = `${API_BASE_URL || ''}${path}`;

  const response = await fetch(url, {
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
