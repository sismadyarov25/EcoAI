export const calculateEcoData = async (data) => {
  try {
    const response = await fetch('http://localhost:5001/api/calculate', {
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
