import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const generateHealthRecommendations = async (metrics) => {
  try {
    const prompt = `Based on the following health metrics, provide 3 concise, practical recommendations for improving health:
    - Respiratory Health: ${metrics.respiratory.level} impact (${metrics.respiratory.score}%)
    - Cardiovascular Health: ${metrics.cardiovascular.level} impact (${metrics.cardiovascular.score}%)
    - Sleep Quality: ${metrics.sleep.level} impact (${metrics.sleep.score}%)
    
    Format the response as a JSON array of 3 strings, each being a health recommendation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      "Use air purifier in bedroom to improve sleep quality.",
      "Enjoy outdoor activities when air quality is good.",
      "Stay hydrated to help your body process pollutants."
    ];
  }
}; 