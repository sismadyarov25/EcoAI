const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const calculateEcoData = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/calculate` || '/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Ошибка сервера при расчете данных');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
