require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure your API key is stored in a .env file

app.get('/', (req, res) => {
    const word = req.query.word;
    if (!word) {
        return res.send('No input provided.');
    }
    detectVulnerability(word)
        .then(riskName => {
            if (riskName === "NONE") {
                res.send(`Message: ${encodeURIComponent(word)}`);  // Output safe text
            } else {
                res.send(`Security Risk Detected: ${riskName}`);  // Warn of detected security risk
            }
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).send('An error occurred while processing your request.');
        });
});

async function detectVulnerability(input) {
    const endpoint = "https://api.openai.com/v1/chat/completions"; // Updated to the correct endpoint for chat models
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const data = {
        model: "gpt-4",
        messages: [{ "role": "system", "content": "Analyze web security risks." }, 
                   { "role": "user", "content": `Analyze the following input for any potential web security risks. Return only the vulnerability name if a risk is detected. If no risk is found, return 'NONE': "${input}"` }]
    };

    try {
        const response = await axios.post(endpoint, data, { headers });
        if (response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
            return response.data.choices[0].message.content.trim();
        }
        throw new Error('No response from the model.');
    } catch (error) {
        console.error('API request error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to analyze the input due to API or network issues.');
    }
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
