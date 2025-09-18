let apiKey = '';
const chatDiv = document.getElementById('chat');
const inputField = document.getElementById('input');
const sendButton = document.getElementById('send');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyButton = document.getElementById('saveKey');
const keyStatus = document.getElementById('keyStatus');

const messages = [{ role: 'system', content: 'You are a helpful assistant.' }];

// Function to validate API key format
function isValidApiKey(key) {
    return key && key.startsWith('sk-') && key.length > 20;
}

// Function to update UI based on API key status
function updateKeyStatus(message, type) {
    keyStatus.textContent = message;
    keyStatus.className = `key-status ${type}`;
    keyStatus.style.display = 'block';
    
    const hasValidKey = type === 'success';
    inputField.disabled = !hasValidKey;
    sendButton.disabled = !hasValidKey;
    
    if (hasValidKey) {
        inputField.focus();
    }
}

// Save API key
function saveApiKey() {
    const key = apiKeyInput.value.trim();
    
    if (!key) {
        updateKeyStatus('Please enter an API key', 'error');
        return;
    }
    
    if (!isValidApiKey(key)) {
        updateKeyStatus('Invalid API key format. OpenAI keys start with "sk-"', 'error');
        return;
    }
    
    apiKey = key;
    updateKeyStatus('API key saved successfully! You can now start chatting.', 'success');
    
    // Clear the input for security
    apiKeyInput.value = '';
}

// Send message function
async function sendMessage() {
    const userInput = inputField.value.trim();
    if (!userInput || !apiKey) return;

    // Display user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.innerHTML = `<strong>You:</strong>${userInput}`;
    chatDiv.appendChild(userMessageDiv);
    
    messages.push({ role: 'user', content: userInput });
    inputField.value = '';
    
    // Disable send button while processing
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini', // Fixed the model name
            messages: messages,
            max_tokens: 200
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const reply = response.data.choices[0].message.content.trim();
        
        const assistantMessageDiv = document.createElement('div');
        assistantMessageDiv.className = 'message assistant-message';
        assistantMessageDiv.innerHTML = `<strong>Assistant:</strong>${reply}`;
        chatDiv.appendChild(assistantMessageDiv);
        
        messages.push({ role: 'assistant', content: reply });
        chatDiv.scrollTop = chatDiv.scrollHeight;
        
    } catch (error) {
        console.error('Error:', error);
        
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'message error-message';
        
        let errorMessage = 'An error occurred';
        if (error.response?.status === 401) {
            errorMessage = 'Invalid API key. Please check your key and try again.';
        } else if (error.response?.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.response?.data?.error?.message) {
            errorMessage = error.response.data.error.message;
        }
        
        errorMessageDiv.innerHTML = `<strong>Error:</strong>${errorMessage}`;
        chatDiv.appendChild(errorMessageDiv);
        chatDiv.scrollTop = chatDiv.scrollHeight;
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
        inputField.focus();
    }
}

// Event listeners
saveKeyButton.addEventListener('click', saveApiKey);
sendButton.addEventListener('click', sendMessage);

inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});

apiKeyInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        saveApiKey();
    }
});

// Initialize
updateKeyStatus('Please enter your OpenAI API key to start chatting', 'warning');