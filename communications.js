document.addEventListener('DOMContentLoaded', function() {
    // --- TAB SWITCHING LOGIC ---
    const tabsContainer = document.getElementById('communications-tabs');
    const tabContents = document.querySelectorAll('.chat-window .tab-content');
    const messageInputForm = document.getElementById('message-input-form');

    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-link');
            if (!clickedTab) return;

            // Remove active state from all tabs and content
            tabsContainer.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active state to the clicked tab
            clickedTab.classList.add('active');
            
            // Show the corresponding content
            const tabId = clickedTab.dataset.tab;
            const activeContent = document.getElementById(`${tabId}-content`);
            if (activeContent) {
                activeContent.classList.add('active');
            }

            // Show/Hide the message input bar
            if (tabId === 'active-chats') {
                messageInputForm.style.display = 'flex';
            } else {
                messageInputForm.style.display = 'none';
            }
        });
    }

    // --- GLOBAL STATE & DOM ELEMENTS ---
    
    // Conversation Elements
    let conversationsData = [];
    let activeConversationId = null;
    const conversationListContainer = document.getElementById('conversation-list-container');
    const messageArea = document.getElementById('message-area');
    const emptyChatMessage = document.getElementById('empty-chat-message');
    const messageInput = document.getElementById('message-input');
    const convoCountSpan = document.getElementById('convo-count');

    // Broadcast Elements
    const sendBroadcastBtn = document.querySelector('.send-broadcast-btn');
    const broadcastMessageInput = document.getElementById('broadcast-message');
    const broadcastTypeInput = document.getElementById('broadcast-type');
    const broadcastTargetInput = document.getElementById('broadcast-target');
    const broadcastPriorityInput = document.getElementById('broadcast-priority');
    const recentBroadcastsList = document.getElementById('recent-broadcasts-list');
    
    // Emergency Contacts Elements
    const contactsContainer = document.getElementById('contacts-content');

    // Translation Elements
    const translatorGridContainer = document.getElementById('translator-grid-container');
    const quickTranslateFrom = document.getElementById('quick-translate-from');
    const quickTranslateTo = document.getElementById('quick-translate-to');
    const quickTranslateInput = document.getElementById('quick-translate-input');
    const quickTranslateOutput = document.getElementById('quick-translate-output');
    const quickTranslateBtn = document.getElementById('quick-translate-btn');


    // --- NEW: New Conversation Modal Elements & Logic ---
    const newConvoBtn = document.querySelector('.new-conversation-btn');
    const newConvoModal = document.getElementById('new-convo-modal');
    const newConvoCloseBtn = document.getElementById('new-convo-close-btn');
    const newConvoForm = document.getElementById('new-convo-form');

    if (newConvoBtn) {
        newConvoBtn.addEventListener('click', () => {
            newConvoModal.classList.add('show');
        });
    }

    if (newConvoCloseBtn) {
        newConvoCloseBtn.addEventListener('click', () => {
            newConvoModal.classList.remove('show');
        });
    }
    
    if (newConvoForm) {
        newConvoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('New conversation sent! (Note: Creating a NEW conversation endpoint is the next step.)');
            // In a real app, this would POST to '/api/conversations' (not /:id/messages)
            // For now, we just show it's interactive and close the modal.
            newConvoModal.classList.remove('show');
            // Clear the form
            document.getElementById('new-convo-to').value = '';
            document.getElementById('new-convo-message').value = '';
        });
    }

    
    // --- RENDER FUNCTIONS ---

    // Renders the list of conversations on the left
    function renderConversations() {
        if (!conversationListContainer) return;
        conversationListContainer.innerHTML = '';
        conversationsData.forEach(convo => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (convo.id === activeConversationId) {
                item.classList.add('active');
            }
            item.dataset.id = convo.id;

            const priorityTag = convo.notificationCount > 0 
                ? `<span class="priority-tag ${convo.priority}">${convo.priority} ${convo.notificationCount}</span>`
                : `<span class="status-tag ${convo.status}">${convo.status}</span>`;

            item.innerHTML = `
                <span class="material-icons-outlined convo-icon">${convo.icon}</span>
                <div class="convo-details">
                    <p class="name">${convo.name}</p>
                    <p class="preview">${convo.preview}</p>
                </div>
                <div class="convo-meta">
                    <p class="time">${convo.time}</p>
                    ${priorityTag}
                </div>
            `;
            conversationListContainer.appendChild(item);
        });
        if(convoCountSpan) convoCountSpan.textContent = conversationsData.length;
    }
    
    // Renders the messages for the active conversation
    function renderMessages(conversation) {
        if (!messageArea) return;
        if (!conversation || !conversation.messages || conversation.messages.length === 0) {
            emptyChatMessage.style.display = 'flex';
            messageArea.innerHTML = '';
            messageArea.appendChild(emptyChatMessage);
            return;
        }
        emptyChatMessage.style.display = 'none';
        messageArea.innerHTML = ''; // Clear previous messages
        conversation.messages.forEach(msg => {
            const messageBubble = document.createElement('div');
            messageBubble.className = `message ${msg.type}`;
            messageBubble.innerHTML = `
                <p>${msg.text}</p>
                <div class="message-meta">${msg.sender}</div>
            `;
            messageArea.appendChild(messageBubble);
        });
        messageArea.scrollTop = messageArea.scrollHeight; // Auto-scroll to bottom
    }

    // Renders the Emergency Contacts groups and cards
    function renderContacts(contactGroups) {
        if (!contactsContainer) return;
        contactsContainer.innerHTML = ''; // Clear any placeholders

        contactGroups.forEach(group => {
            const groupWidget = document.createElement('div');
            groupWidget.className = 'widget contacts-group'; 
            const title = document.createElement('h3');
            title.textContent = group.group;
            groupWidget.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'contacts-grid';

            group.contacts.forEach(contact => {
                const card = document.createElement('div');
                card.className = 'contact-card';
                const statusClass = contact.status.toLowerCase();

                card.innerHTML = `
                    <div class="contact-info">
                        <strong>${contact.name}</strong>
                        <span>${contact.number}</span>
                    </div>
                    <div class="contact-actions">
                        <span class="team-status ${statusClass}">${contact.status}</span>
                        <span class="material-icons-outlined call-icon" data-phone="${contact.number}">call</span>
                    </div>
                `;
                grid.appendChild(card);
            });

            groupWidget.appendChild(grid);
            contactsContainer.appendChild(groupWidget);
        });
    }

    // Creates the HTML for a single broadcast card
    function createBroadcastCardHTML(item) {
        const status = item.status || 'delivered';
        const reached = item.reached || 'N/A';
        return `
            <div class="broadcast-card-header">
                <span class="broadcast-card-title">${item.type}</span>
                <span class="delivered-tag">${status}</span>
            </div>
            <p>${item.message}</p>
            <div class="broadcast-card-footer">
                <span>${item.timestamp}</span> • <span>Reached: ${reached}</span>
            </div>
        `;
    }

    // Renders the full list of broadcasts from scratch
    function renderBroadcasts(broadcasts) {
        if (!recentBroadcastsList) return;
        recentBroadcastsList.innerHTML = '';
        for (const item of broadcasts) {
            const card = document.createElement('div');
            const typeClass = item.type.toLowerCase().replace(/[\s/]+/g, '-');
            card.className = `broadcast-card broadcast-${typeClass}`;
            card.innerHTML = createBroadcastCardHTML(item);
            recentBroadcastsList.appendChild(card);
        }
    }

    // Adds a single new broadcast to the top of the list
    function prependBroadcast(item) {
        if (!recentBroadcastsList) return;
        const card = document.createElement('div');
        const typeClass = item.type.toLowerCase().replace(/[\s/]+/g, '-');
        card.className = `broadcast-card broadcast-${typeClass}`;
        card.innerHTML = createBroadcastCardHTML(item);
        recentBroadcastsList.prepend(card);
    }

    // Renders the translators grid and populates dropdowns
    function renderTranslators(translators) {
        if (!translatorGridContainer) return;
        translatorGridContainer.innerHTML = '';
        quickTranslateFrom.innerHTML = '<option value="">Select language...</option>';
        quickTranslateTo.innerHTML = '<option value="">Select language...</option>';

        translators.forEach(translator => {
            // 1. Populate the Grid
            const card = document.createElement('div');
            card.className = 'translator-card';
            card.innerHTML = `
                <div class="translator-card-header">
                    <span class="translator-language">
                        <span class="material-icons-outlined">language</span>
                        ${translator.language}
                    </span>
                    <span class="status-tag ${translator.status}">${translator.status}</span>
                </div>
                <p class="translator-name">${translator.name}</p>
                <button class="export-btn connect-btn" data-name="${translator.name}">
                    <span class="material-icons-outlined">call</span> Connect
                </button>
            `;
            translatorGridContainer.appendChild(card);

            // 2. Populate the Dropdowns
            const option = document.createElement('option');
            option.value = translator.language.toLowerCase();
            option.textContent = translator.language;
            quickTranslateFrom.appendChild(option.cloneNode(true));
            quickTranslateTo.appendChild(option.cloneNode(true));
        });
    }


    // --- EVENT LISTENERS ---

    // Conversation list click
    if (conversationListContainer) {
        conversationListContainer.addEventListener('click', function(event) {
            const clickedItem = event.target.closest('.conversation-item');
            if (!clickedItem) return;
            activeConversationId = parseInt(clickedItem.dataset.id);
            const selectedConvo = conversationsData.find(c => c.id === activeConversationId);
            
            if (tabsContainer) {
                const activeChatTab = tabsContainer.querySelector('[data-tab="active-chats"]');
                if (activeChatTab && !activeChatTab.classList.contains('active')) {
                    activeChatTab.click(); 
                }
            }

            renderMessages(selectedConvo);
            renderConversations(); 
        });
    }

    // Message input form submit
    if (messageInputForm) {
        messageInputForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const text = messageInput.value.trim();
            if (!text || !activeConversationId) return;
            const newMessage = { sender: 'Control Center - Just now', text: text, type: 'outgoing' };
            fetch(`http://localhost:4000/api/conversations/${activeConversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage)
            });
            messageInput.value = '';
        });
    }

    // Emergency Contact "Call" button click
    if (contactsContainer) {
        contactsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('call-icon')) {
                const phone = e.target.dataset.phone;
                if (phone) {
                    window.location.href = 'tel:' + phone;
                }
            }
        });
    }

    // Send Broadcast Button
    if (sendBroadcastBtn) {
        sendBroadcastBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const message = broadcastMessageInput.value;
            const type = broadcastTypeInput.options[broadcastTypeInput.selectedIndex].text;
            const target = broadcastTargetInput.options[broadcastTargetInput.selectedIndex].text;
            const priority = broadcastPriorityInput.value;
            if (!message || !type || !target || !priority) {
                alert('Please fill out all fields in the broadcast form.');
                return;
            }
            const newBroadcast = { type, message, priority, target };
            try {
                await fetch('http://localhost:4000/api/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBroadcast)
                });
                broadcastMessageInput.value = ''; 
            } catch (error) {
                console.error('Failed to send broadcast:', error);
                alert('Failed to send broadcast.');
            }
        });
    }

    // Translator "Connect" button click
    if (translatorGridContainer) {
        translatorGridContainer.addEventListener('click', (e) => {
            const connectBtn = e.target.closest('.connect-btn');
            if (connectBtn) {
                const name = connectBtn.dataset.name;
                alert(`Connecting to translator: ${name}...\n(This would trigger a call in a real app)`);
            }
        });
    }

    // Quick Translate button click
    if (quickTranslateBtn) {
        quickTranslateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const text = quickTranslateInput.value;
            const fromLang = quickTranslateFrom.value;
            const toLang = quickTranslateTo.value;
            if (!text || !fromLang || !toLang) {
                alert('Please select From/To languages and enter text.');
                return;
            }
            // --- FAKE TRANSLATION ---
            quickTranslateOutput.value = `(Translated from ${fromLang} to ${toLang}):\n\n"${text}"`;
        });
    }


    // --- DATA FETCHING FUNCTIONS ---

    async function initialLoadConversations() {
        try {
            const response = await fetch('http://localhost:4000/api/conversations');
            if (!response.ok) { throw new Error('Network response was not ok'); }
            conversationsData = await response.json();
            renderConversations();
        } catch (error) { 
            console.error("Failed to load conversations:", error); 
            if (conversationListContainer) {
                conversationListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">Error loading conversations. Is the backend running?</p>';
            }
        }
    }

    async function fetchBroadcasts() {
        try {
            const response = await fetch('http://localhost:4000/api/broadcasts');
            const broadcasts = await response.json();
            renderBroadcasts(broadcasts);
        } catch (error) {
            console.error('Failed to fetch broadcasts:', error);
            if(recentBroadcastsList) recentBroadcastsList.innerHTML = '<p>Error loading broadcasts.</p>';
        }
    }

    async function fetchRegions() {
        if (!broadcastTargetInput) return;
        try {
            const response = await fetch('http://localhost:4000/api/regions');
            const regions = await response.json();
            broadcastTargetInput.innerHTML = '<option value="">Select target...</option>';
            regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region.id;
                option.textContent = region.name;
                broadcastTargetInput.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to fetch regions:', error);
            broadcastTargetInput.innerHTML = '<option value="">Error loading</option>';
        }
    }

    async function fetchContacts() {
        if (!contactsContainer) return;
        try {
            const response = await fetch('http://localhost:4000/api/contacts');
            const contactGroups = await response.json();
            renderContacts(contactGroups);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
            contactsContainer.innerHTML = '<p>Error loading contacts.</p>';
        }
    }

    async function fetchTranslators() {
        if (!translatorGridContainer) return;
        try {
            const response = await fetch('http://localhost:4000/api/translators');
            const translators = await response.json();
            renderTranslators(translators);
        } catch (error) {
            console.error('Failed to fetch translators:', error);
            translatorGridContainer.innerHTML = '<p>Error loading translators.</p>';
        }
    }


    // --- SOCKET.IO LISTENERS ---
    const socket = io('http://localhost:4000');

    socket.on('new-message', (data) => {
        const { conversationId, message, preview } = data;
        const convo = conversationsData.find(c => c.id === conversationId);
        if (convo) {
            if (!convo.messages) convo.messages = [];
            convo.messages.push(message);
            convo.preview = preview;
            convo.time = "Just now";
            if (convo.id === activeConversationId) {
                renderMessages(convo);
            }
            renderConversations();
        }
    });

    socket.on('new-broadcast', (newBroadcast) => {
        prependBroadcast(newBroadcast);
    });

    
    // --- INITIATE ALL DATA FETCHING ---
    initialLoadConversations(); // Load conversation list
    fetchBroadcasts();          // Load recent broadcasts
    fetchRegions();             // Load broadcast regions
    fetchContacts();            // Load emergency contacts
    fetchTranslators();         // Load translators
});