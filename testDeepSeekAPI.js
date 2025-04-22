// testMistralAPI.js - Test script for Mistral AI API using OpenAI SDK
require('dotenv').config();
const OpenAI = require("openai");

async function testMistralAPI() {
    console.log('Testing Mistral API with OpenAI SDK...\n');
    
    const apiKey = process.env.MISTRAL_API_KEY || 'vxnFoqziINlgP29cyKRwGIwuOpPirdaj';
    console.log('API Key found:', apiKey.substring(0, 5) + '...');
    
    const openai = new OpenAI({
        baseURL: 'https://api.mistral.ai/v1',
        apiKey: apiKey
    });
    
    try {
        console.log('Making test API call...');
        
        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "Je bent een behulpzame medewerker van Een Vakman Nodig. Antwoord in het Nederlands." 
                },
                { 
                    role: "user", 
                    content: "Wat kost het om lid te worden?" 
                }
            ],
            model: "mistral-tiny", // or "mistral-small", "mistral-medium"
            temperature: 0.7,
            max_tokens: 150
        });
        
        console.log('\nAPI Response received successfully!');
        console.log('Response:', completion.choices[0].message.content);
        console.log('\nFull response object:', JSON.stringify(completion, null, 2));
        
    } catch (error) {
        console.error('\nError calling Mistral API:', error.message);
        
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
    }
}

// Test all available Mistral models
async function testAllModels() {
    const models = ['mistral-tiny', 'mistral-small', 'mistral-medium'];
    
    for (const model of models) {
        console.log(`\n=== Testing ${model} ===`);
        try {
            const openai = new OpenAI({
                baseURL: 'https://api.mistral.ai/v1',
                apiKey: 'vxnFoqziINlgP29cyKRwGIwuOpPirdaj'
            });
            
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: "Hello" }],
                model: model,
                max_tokens: 10
            });
            
            console.log(`Success! Response: ${completion.choices[0].message.content}`);
        } catch (error) {
            console.error(`Failed: ${error.message}`);
        }
    }
}

// Run tests
testMistralAPI();
// Uncomment to test all models:
// testAllModels();