const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeCode = async (code) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Analyze the following code snippet and provide its time and space complexity, and add comments explaining the code.\n\nCode:\n${code}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error analyzing code with AI:", error);
        return "Could not analyze the code.";
    }
};
