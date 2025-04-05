document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const voiceBtn = document.getElementById("voice-btn");
    const historyList = document.getElementById("history-list");
    const header = document.getElementById("header"); 
    const chatContainer = document.getElementById("chat-container"); 
    const historyPanel = document.getElementById("history-panel"); // Ensure this exists
    let lastScrollTop = 0;
  
    const queryHistory = [];
  
    if (!chatBox || !userInput || !sendBtn || !voiceBtn || !historyList || !header || !chatContainer || !historyPanel) {
      console.error("One or more elements are missing in the DOM.");
      return;
    }
  
    
    // Function to adjust chat box and history panel position based on scroll
    document.addEventListener("scroll", () => {
      let currentScroll = window.scrollY;
  
      if (currentScroll > lastScrollTop) {
        // Scrolling down: Move both chat container and history panel down
        chatContainer.style.transform = translateY(${header.offsetHeight}px);
        historyPanel.style.transform = translateY(${header.offsetHeight}px);
      } else {
        // Scrolling up: Move both chat container and history panel back up
        chatContainer.style.transform = "translateY(0)";
        historyPanel.style.transform = "translateY(0)";
      }
  
      chatContainer.style.transition = "transform 0.3s ease-in-out";
      historyPanel.style.transition = "transform 0.3s ease-in-out";
  
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // Prevent negative values
    });
  
    // Hide scrollbar but allow scrolling
    chatBox.style.overflowY = "auto"; 
    chatBox.style.scrollbarWidth = "none"; // Hide scrollbar (Firefox)
    chatBox.style.msOverflowStyle = "none"; // Hide scrollbar (IE/Edge)
    chatBox.style.cssText += ::-webkit-scrollbar { display: none; }; // Hide scrollbar (Chrome, Safari)
  
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
  
    function addToHistory(query, response) {
      queryHistory.push({ query, response });
  
      const listItem = document.createElement("li");
      listItem.textContent = query;
      listItem.style.animationDelay = ${queryHistory.length * 0.1}s;
      listItem.addEventListener("click", () => {
        displayMessage(query, "user");
        displayMessage(response, "bot");
      });
      historyList.appendChild(listItem);
    }
  
    async function processInput(input) {
      if (!input) {
        console.error("Input is empty. Please provide a query.");
        return "Please enter a query.";
      }
  
      try {
        const response = await fetch("/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input }),
        });
  
        if (!response.ok) {
          throw new Error(HTTP error! status: ${response.status});
        }
  
        const data = await response.json();
        return data.response || "Sorry, I couldn't find relevant information.";
      } catch (error) {
        console.error("Error querying backend:", error);
        return "An error occurred while processing your request.";
      }
    }
  
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
  
    function showTypingIndicator() {
      const typingIndicator = document.createElement("div");
      typingIndicator.className = "typing-indicator";
      typingIndicator.innerHTML = `
        <span></span><span></span><span></span>
      `;
      chatBox.appendChild(typingIndicator);
      chatBox.scrollTop = chatBox.scrollHeight;
  
      return typingIndicator;
    }
  
    function removeTypingIndicator(indicator) {
      if (indicator) {
        chatBox.removeChild(indicator);
      }
    }
  
    sendBtn.addEventListener("click", () => {
      const query = userInput.value.trim();
      if (query) {
        processQuery(query);
      }
    });
  
    userInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendBtn.click(); 
      }
    });
  
    voiceBtn.addEventListener("click", () => {
      if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        displayMessage("Voice input is not supported on your browser.", "bot");
        return;
      }
  
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "en-US";
  
      recognition.onresult = async (event) => {
        const voiceText = event.results[0][0].transcript;
        processQuery(voiceText);
      };
  
      recognition.onerror = () => {
        displayMessage("Sorry, I couldn't process your voice input. Try again.", "bot");
      };
  
      recognition.start();
    });
  });