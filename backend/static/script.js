document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("message-input"); 
    const sendBtn = document.getElementById("sendBtn");
    const voiceBtn = document.getElementById("voiceBtn");
    const historyList = document.getElementById("history-list");

    const queryHistory = [];

    if (!chatBox || !userInput || !sendBtn || !voiceBtn || !historyList) {
        console.error("One or more elements are missing in the DOM.");
        return;
    }

    // Function to display messages in chatbox
    function displayMessage(message, sender = "bot") {
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message", sender);

        const messageText = document.createElement("p");
        messageText.textContent = message;

        const timestamp = document.createElement("span");
        timestamp.classList.add("timestamp");
        timestamp.textContent = new Date().toLocaleTimeString();

        messageContainer.appendChild(messageText);
        messageContainer.appendChild(timestamp);

        chatBox.appendChild(messageContainer);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Function to add queries to history
    function addToHistory(query, response) {
        queryHistory.push({ query, response });

        const listItem = document.createElement("li");
        listItem.textContent = query;
        listItem.style.animationDelay = `${queryHistory.length * 0.1}s`;
        listItem.addEventListener("click", () => {
            displayMessage(query, "user");
            displayMessage(response, "bot");
        });
        historyList.appendChild(listItem);
    }

    // Function to send query to the backend and fetch response
    async function processInput(input) {
        if (!input) {
            console.error("Input is empty.");
            return "Please enter a query.";
        }

        try {
            const response = await fetch("/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response || "Sorry, I couldn't find relevant information.";
        } catch (error) {
            console.error("Error querying backend:", error);
            return "An error occurred while processing your request.";
        }
    }

    // Function to handle user query
    async function processQuery(query) {
        displayMessage(query, "user");

        const typingIndicator = showTypingIndicator();

        try {
            const response = await processInput(query);
            removeTypingIndicator(typingIndicator);
            displayMessage(response, "bot");
            addToHistory(query, response);
        } catch (error) {
            removeTypingIndicator(typingIndicator);
            displayMessage("An error occurred. Please try again.", "bot");
        }

        userInput.value = "";
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement("div");
        typingIndicator.className = "typing-indicator";
        typingIndicator.innerHTML = `<span></span><span></span><span></span>`;
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        return typingIndicator;
    }

    // Function to remove typing indicator
    function removeTypingIndicator(indicator) {
        if (indicator) {
            chatBox.removeChild(indicator);
        }
    }

    sendBtn.addEventListener("click", () => {
        console.log("Send button clicked!"); // Debugging
        const query = userInput.value.trim();
        if (query) {
            processQuery(query);
        } else {
            console.warn("Empty query ignored.");
        }
    });
    

    // ✅ FIXED: Pressing Enter sends message, Shift+Enter creates new line
    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            if (!event.shiftKey) {
                event.preventDefault(); // Prevents new line
                sendBtn.click(); // Simulate button click
            }
        }
    });

    // ✅ FIXED: Voice button now works
    voiceBtn.addEventListener("click", () => {
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            displayMessage("Voice input is not supported on your browser.", "bot");
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const voiceText = event.results[0][0].transcript;
            processQuery(voiceText);
        };

        recognition.onerror = () => {
            displayMessage("Sorry, I couldn't process your voice input. Try again.", "bot");
        };

        recognition.start();
    });
});
