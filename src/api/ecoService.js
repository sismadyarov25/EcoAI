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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
