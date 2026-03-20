import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function updateTools() {
    const assistantId = process.env.PATIENT_ASSISTANT_ID;
    if (!assistantId) throw new Error("PATIENT_ASSISTANT_ID not found in .env");

    console.log(`📡 Fetching assistant ${assistantId}...`);
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    const existingTools = assistant.tools || [];
    console.log(`Current tools: ${existingTools.length}`);

    const newTools = [
        ...existingTools,
        {
            type: 'function',
            function: {
                name: 'getMyProfile',
                description: 'Retrieve your current patient profile information including name, email, phone, age, address, gender, blood group, and medical history.',
                parameters: { type: 'object', properties: {} }
            }
        },
        {
            type: 'function',
            function: {
                name: 'updateMyProfile',
                description: 'Update your patient profile information. You can provide one or more fields to update.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Your full name' },
                        email: { type: 'string', description: 'Your email address' },
                        phone: { type: 'string', description: 'Your phone number (format: 0300-0000000)' },
                        age: { type: 'integer', description: 'Your current age' },
                        address: { type: 'string', description: 'Your home address' },
                        gender: { type: 'string', enum: ['Male', 'Female', 'Other'], description: 'Your gender' },
                        blood_group: { type: 'string', description: 'Your blood group (e.g., A+, O-)' },
                        medical_history: { type: 'string', description: 'A brief summary of your medical history' }
                    }
                }
            }
        }
    ];

    // Deduplicate tools by function name
    const toolMap = new Map();
    for (const tool of newTools) {
        if (tool.type === 'function') {
            toolMap.set(tool.function.name, tool);
        } else {
            // Keep non-function tools (like code_interpreter, though not used here likely)
            toolMap.set(Math.random().toString(), tool);
        }
    }

    const uniqueTools = Array.from(toolMap.values());
    console.log(`Updating with ${uniqueTools.length} tools...`);

    await openai.beta.assistants.update(assistantId, {
        tools: uniqueTools
    });

    console.log('✅ Assistant tools updated successfully!');
}

updateTools().catch(err => {
    console.error('❌ Error updating tools:', err);
    process.exit(1);
});
