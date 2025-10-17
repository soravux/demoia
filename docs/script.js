// InteractiveGPT - AI Vision Interface
class InteractiveGPT {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.selectedMedia = null;
        this.mediaFiles = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadMediaFiles();
        this.updateApiStatus();
    }

    initializeElements() {
        // Media gallery elements
        this.mediaGrid = document.getElementById('mediaGrid');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Chat interface elements
        this.selectedMediaDiv = document.getElementById('selectedMedia');
        this.promptInput = document.getElementById('promptInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatOutput = document.getElementById('chatOutput');
        this.clearChatBtn = document.getElementById('clearChat');
        
        // API key elements
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        
        // Status elements
        this.apiStatus = document.getElementById('apiStatus');
        this.apiStatusText = document.getElementById('apiStatusText');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Media gallery events
        this.refreshBtn.addEventListener('click', () => this.loadMediaFiles());
        
        // Chat interface events
        this.sendBtn.addEventListener('click', () => this.sendPrompt());
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendPrompt();
            }
        });
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // API key events
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.apiKeyInput.addEventListener('input', () => this.updateApiStatus());
        
        // Load saved API key
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
        }
    }

    async loadMediaFiles() {
        try {
            this.updateApiStatus('loading', 'Loading media files...');
            
            // In a real implementation, you would fetch from a server
            // For now, we'll simulate loading media files
            const response = await fetch('./data/');
            if (!response.ok) {
                throw new Error('Could not access data folder');
            }
            
            // Since we can't directly list files from client-side,
            // we'll provide a way to manually add files or use a server endpoint
            this.mediaFiles = await this.getMediaFilesFromServer();
            this.renderMediaGrid();
            
            this.updateApiStatus('ready', 'Ready');
        } catch (error) {
            console.error('Error loading media files:', error);
            this.updateApiStatus('error', 'Error loading media');
            this.showError('Could not load media files. Make sure the data folder exists and contains media files.');
        }
    }

    async getMediaFilesFromServer() {
        // Try to load files from the data folder
        try {
            const response = await fetch('./data/');
            if (response.ok) {
                const html = await response.text();
                // Parse the directory listing to extract file names
                const fileNames = this.parseDirectoryListing(html);
                return fileNames.map(fileName => ({
                    name: fileName,
                    type: this.getMediaType(fileName),
                    url: `./data/${fileName}`,
                    file: null // No File object for server files
                }));
            }
        } catch (error) {
            console.log('Could not load from data folder, using empty array');
        }
        return [];
    }

    parseDirectoryListing(html) {
        // Simple parser for Apache-style directory listings
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a[href]');
        const files = [];
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.endsWith('/') && this.isMediaFile(href)) {
                files.push(href);
            }
        });
        
        return files;
    }

    isMediaFile(fileName) {
        const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
        const lowerName = fileName.toLowerCase();
        return mediaExtensions.some(ext => lowerName.endsWith(ext));
    }

    getMediaType(fileName) {
        const lowerName = fileName.toLowerCase();
        if (lowerName.endsWith('.mp4') || lowerName.endsWith('.webm') || lowerName.endsWith('.mov')) {
            return 'video/mp4';
        } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
            return 'image/jpeg';
        } else if (lowerName.endsWith('.png')) {
            return 'image/png';
        } else if (lowerName.endsWith('.gif')) {
            return 'image/gif';
        } else if (lowerName.endsWith('.webp')) {
            return 'image/webp';
        }
        return 'image/jpeg'; // default
    }

    renderMediaGrid() {
        this.mediaGrid.innerHTML = '';
        
        if (this.mediaFiles.length === 0) {
            this.mediaGrid.innerHTML = `
                <div class="no-media">
                    <p>No media files found in ./data/ folder</p>
                    <p>Add images (.jpg, .png, .gif) or videos (.mp4, .webm) to get started</p>
                </div>
            `;
            return;
        }

        this.mediaFiles.forEach((file, index) => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            mediaItem.dataset.index = index;
            
            const isVideo = file.type.startsWith('video/');
            const mediaElement = isVideo ? 
                `<video src="${file.url}" preload="metadata"></video>` :
                `<img src="${file.url}" alt="${file.name}">`;
            
            mediaItem.innerHTML = `
                ${mediaElement}
                <div class="media-type">${isVideo ? 'VIDEO' : 'IMAGE'}</div>
            `;
            
            mediaItem.addEventListener('click', () => this.selectMedia(file, mediaItem));
            this.mediaGrid.appendChild(mediaItem);
        });
    }

    selectMedia(file, element) {
        // Remove previous selection
        document.querySelectorAll('.media-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        element.classList.add('selected');
        this.selectedMedia = file;
        
        // Update selected media display
        this.updateSelectedMediaDisplay();
        
        // Enable send button
        this.sendBtn.disabled = false;
    }

    updateSelectedMediaDisplay() {
        if (!this.selectedMedia) {
            this.selectedMediaDiv.innerHTML = '<p>Select an image or video from the gallery to start chatting</p>';
            return;
        }

        const isVideo = this.selectedMedia.type.startsWith('video/');
        const mediaElement = isVideo ? 
            `<video src="${this.selectedMedia.url}" controls></video>` :
            `<img src="${this.selectedMedia.url}" alt="${this.selectedMedia.name}">`;
        
        // Check if this is an image that might need resizing
        let resizeInfo = '';
        if (!isVideo) {
            resizeInfo = '<p style="margin-top: 5px; font-size: 0.8rem; color: #4facfe; font-style: italic;">📏 Large images will be automatically resized to 512px max dimension</p>';
        }
        
        this.selectedMediaDiv.innerHTML = `
            <div>
                ${mediaElement}
                <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    ${this.selectedMedia.name} (${isVideo ? 'Video' : 'Image'})
                </p>
                ${resizeInfo}
            </div>
        `;
    }

    async sendPrompt() {
        console.log('🎯 Starting sendPrompt function');
        console.log('📋 Selected Media:', this.selectedMedia);
        console.log('💭 Prompt Input:', this.promptInput.value);
        console.log('🔑 API Key Available:', !!this.apiKey);

        if (!this.selectedMedia || !this.promptInput.value.trim() || !this.apiKey) {
            const missing = [];
            if (!this.selectedMedia) missing.push('media selection');
            if (!this.promptInput.value.trim()) missing.push('prompt text');
            if (!this.apiKey) missing.push('API key');
            
            const errorMsg = `Please provide: ${missing.join(', ')}`;
            console.error('❌ Validation failed:', errorMsg);
            this.showError(errorMsg);
            return;
        }

        const prompt = this.promptInput.value.trim();
        console.log('✅ Validation passed, proceeding with prompt:', prompt);
        
        this.promptInput.value = '';
        this.sendBtn.disabled = true;
        this.showLoading(true);

        try {
            console.log('🔄 Step 1: Converting media to base64');
            console.log('📁 Media item details:', {
                name: this.selectedMedia.name,
                type: this.selectedMedia.type,
                hasFile: !!this.selectedMedia.file,
                hasUrl: !!this.selectedMedia.url
            });
            
            // Update loading message for image processing
            this.updateLoadingMessage('Processing image...');
            
            // Convert media to base64
            const base64Media = await this.convertMediaToBase64(this.selectedMedia);
            console.log('✅ Base64 conversion successful, length:', base64Media.length);
            console.log('📏 Base64 preview (first 100 chars):', base64Media.substring(0, 100) + '...');
            
            console.log('🔄 Step 2: Calling ChatGPT API');
            this.updateLoadingMessage('Sending to AI...');
            
            // Send to ChatGPT API - use JPEG for resized images, original type for others
            const apiMediaType = this.selectedMedia.type.startsWith('image/') ? 'image/jpeg' : this.selectedMedia.type;
            console.log('🔄 Using media type for API:', apiMediaType, '(original was:', this.selectedMedia.type + ')');
            const response = await this.callChatGPTAPI(prompt, base64Media, apiMediaType);
            console.log('✅ API call successful, response length:', response.length);
            
            console.log('🔄 Step 3: Displaying response');
            this.updateLoadingMessage('Processing response...');
            
            // Display response
            this.displayResponse(response);
            console.log('✅ Response displayed successfully');
            
        } catch (error) {
            console.error('❌ Error in sendPrompt:', error);
            console.error('❌ Error stack:', error.stack);
            this.showError('Error communicating with ChatGPT API: ' + error.message);
        } finally {
            console.log('🔄 Cleaning up: hiding loading, re-enabling button');
            this.showLoading(false);
            this.sendBtn.disabled = false;
        }
    }

    async convertMediaToBase64(mediaItem) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('🔄 convertMediaToBase64 called with:', mediaItem);
                
                // If it's a File object, use FileReader
                if (mediaItem.file && mediaItem.file instanceof File) {
                    console.log('📁 Processing File object:', {
                        name: mediaItem.file.name,
                        size: mediaItem.file.size,
                        type: mediaItem.file.type
                    });
                    
                    const reader = new FileReader();
                    reader.onload = async () => {
                        console.log('✅ FileReader onload triggered');
                        try {
                            const base64 = await this.processImageForAPI(reader.result, mediaItem.type);
                            console.log('📏 Generated base64 length:', base64.length);
                            resolve(base64);
                        } catch (error) {
                            console.error('❌ Error processing image:', error);
                            reject(error);
                        }
                    };
                    reader.onerror = (error) => {
                        console.error('❌ FileReader error:', error);
                        reject(error);
                    };
                    reader.readAsDataURL(mediaItem.file);
                } 
                // If it's a URL-based media, fetch and convert
                else if (mediaItem.url) {
                    console.log('🌐 Processing URL-based media:', mediaItem.url);
                    
                    const response = await fetch(mediaItem.url);
                    console.log('📡 Fetch response status:', response.status, response.statusText);
                    
                    if (!response.ok) {
                        throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
                    }
                    
                    const blob = await response.blob();
                    console.log('📦 Blob created:', {
                        size: blob.size,
                        type: blob.type
                    });
                    
                    const reader = new FileReader();
                    reader.onload = async () => {
                        console.log('✅ FileReader onload triggered for URL media');
                        try {
                            const base64 = await this.processImageForAPI(reader.result, mediaItem.type);
                            console.log('📏 Generated base64 length:', base64.length);
                            resolve(base64);
                        } catch (error) {
                            console.error('❌ Error processing image:', error);
                            reject(error);
                        }
                    };
                    reader.onerror = (error) => {
                        console.error('❌ FileReader error for URL media:', error);
                        reject(error);
                    };
                    reader.readAsDataURL(blob);
                } else {
                    console.error('❌ Invalid media item - no file or URL found');
                    reject(new Error('Invalid media item: no file or URL found'));
                }
            } catch (error) {
                console.error('❌ Error in convertMediaToBase64:', error);
                reject(error);
            }
        });
    }

    async processImageForAPI(dataUrl, mediaType) {
        return new Promise((resolve, reject) => {
            // Check if it's an image (not video)
            if (!mediaType.startsWith('image/')) {
                // For non-images, return the base64 directly
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
                return;
            }

            console.log('🖼️ Processing image for API optimization');
            
            const img = new Image();
            img.onload = () => {
                console.log('📐 Original image dimensions:', img.width, 'x', img.height);
                
                // Check if resizing is needed
                const maxDimension = 512;
                if (img.width <= maxDimension && img.height <= maxDimension) {
                    console.log('✅ Image is already within size limits, no resizing needed');
                    const base64 = dataUrl.split(',')[1];
                    resolve(base64);
                    return;
                }
                
                // Calculate new dimensions
                let newWidth, newHeight;
                if (img.width > img.height) {
                    // Landscape: width is the longest edge
                    newWidth = maxDimension;
                    newHeight = Math.round((img.height * maxDimension) / img.width);
                } else {
                    // Portrait or square: height is the longest edge
                    newHeight = maxDimension;
                    newWidth = Math.round((img.width * maxDimension) / img.height);
                }
                
                console.log('📏 Resizing to:', newWidth, 'x', newHeight);
                
                // Create canvas for resizing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Draw resized image
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Convert to base64 - force JPEG format for consistency and better compression
                const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const base64 = resizedDataUrl.split(',')[1];
                
                console.log('✅ Image resized successfully');
                console.log('🔄 Format converted to JPEG for optimal compression');
                console.log('📊 Size reduction:', {
                    original: `${img.width}x${img.height}`,
                    resized: `${newWidth}x${newHeight}`,
                    compression: `${Math.round((1 - (base64.length / (dataUrl.split(',')[1].length))) * 100)}%`
                });
                
                resolve(base64);
            };
            
            img.onerror = (error) => {
                console.error('❌ Error loading image for processing:', error);
                // Fallback to original data
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            
            img.src = dataUrl;
        });
    }

    async callChatGPTAPI(prompt, base64Media, mediaType) {
        const isVideo = mediaType.startsWith('video/');
        
        if (isVideo) {
            throw new Error('Video analysis is not supported by the current ChatGPT API. Please use images only.');
        }

        const requestBody = {
            model: 'gpt-5-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mediaType};base64,${base64Media}`
                            }
                        }
                    ]
                }
            ],
            reasoning_effort: "minimal",
            max_completion_tokens: 1000
        };

        console.log('🚀 Sending request to ChatGPT API:');
        console.log('📝 Prompt:', prompt);
        console.log('🖼️ Media Type:', mediaType);
        console.log('📏 Base64 Length:', base64Media.length);
        /* console.log('🔑 API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');*/
        console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Response Status:', response.status, response.statusText);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response Body:', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: { message: errorText } };
            }
            
            console.error('❌ Parsed Error Data:', errorData);
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('✅ Raw Response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('✅ Parsed Response Data:', data);
        } catch (e) {
            console.error('❌ Failed to parse response JSON:', e);
            throw new Error('Invalid JSON response from API');
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Unexpected response structure:', data);
            throw new Error('Unexpected response structure from API');
        }

        const content = data.choices[0].message.content;
        console.log('💬 Final Response Content:', content);
        
        return content;
    }

    displayResponse(response) {
        console.log('🔄 displayResponse called with:', response);
        console.log('📏 Response length:', response ? response.length : 'null/undefined');
        
        if (!response) {
            console.error('❌ No response to display');
            return;
        }
        
        const responseDiv = document.createElement('div');
        responseDiv.className = 'response-message';
        responseDiv.textContent = response;
        
        console.log('📝 Created response div:', responseDiv);
        
        // Remove placeholder if it exists
        const placeholder = this.chatOutput.querySelector('.placeholder');
        if (placeholder) {
            console.log('🗑️ Removing placeholder');
            placeholder.remove();
        }
        
        this.chatOutput.appendChild(responseDiv);
        console.log('✅ Response div appended to chat output');
        
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
        console.log('📜 Scrolled to bottom');
    }

    clearChat() {
        this.chatOutput.innerHTML = '<p class="placeholder">Your AI responses will appear here...</p>';
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            this.showError('Please enter a valid API key');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
        this.updateApiStatus();
        this.showSuccess('API key saved successfully');
    }

    updateApiStatus(status = 'ready', text = 'Ready') {
        this.apiStatus.className = `status-indicator ${status}`;
        this.apiStatusText.textContent = text;
        
        if (status === 'ready' && this.apiKey) {
            this.apiStatusText.textContent = 'API Key Configured';
        } else if (status === 'ready' && !this.apiKey) {
            this.apiStatusText.textContent = 'API Key Required';
        }
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    updateLoadingMessage(message) {
        const loadingText = this.loadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    showError(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'response-message';
        errorDiv.style.borderLeftColor = '#dc3545';
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.color = '#721c24';
        errorDiv.textContent = `Error: ${message}`;
        
        this.chatOutput.appendChild(errorDiv);
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
    }

    showSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'response-message';
        successDiv.style.borderLeftColor = '#28a745';
        successDiv.style.backgroundColor = '#d4edda';
        successDiv.style.color = '#155724';
        successDiv.textContent = `Success: ${message}`;
        
        this.chatOutput.appendChild(successDiv);
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

}

// File handling utilities for demo purposes
class FileHandler {
    static async loadFilesFromInput() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*,video/*';
            
            input.onchange = (e) => {
                const files = Array.from(e.target.files);
                const mediaFiles = files.map(file => ({
                    name: file.name,
                    type: file.type,
                    file: file,
                    url: URL.createObjectURL(file)
                }));
                resolve(mediaFiles);
            };
            
            input.click();
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.interactiveGPT = new InteractiveGPT();
    
    // Add a demo button to load files manually (for testing)
    const demoButton = document.createElement('button');
    demoButton.textContent = 'Load Demo Files';
    demoButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
    `;
    
    demoButton.addEventListener('click', async () => {
        try {
            const files = await FileHandler.loadFilesFromInput();
            window.interactiveGPT.mediaFiles = files;
            window.interactiveGPT.renderMediaGrid();
        } catch (error) {
            console.error('Error loading files:', error);
        }
    });
    
    document.body.appendChild(demoButton);
});

// Add some CSS for the no-media state
const style = document.createElement('style');
style.textContent = `
    .no-media {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .no-media p {
        margin-bottom: 10px;
    }
    
    .no-media p:first-child {
        font-weight: 600;
        color: #333;
    }
`;
document.head.appendChild(style);
