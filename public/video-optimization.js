// Optimized video loading with lazy thumbnails
(function() {
    // Override the fixVideoSectionOnce function with optimized version
    window.fixVideoSectionOnce = function() {
        const aboutGrid = document.getElementById('aboutVideosGrid');
        const compGrid  = document.getElementById('composingVideosGrid');
        const unrelGrid = document.getElementById('unreleasedVideosGrid');

        if (!aboutGrid || !compGrid || !unrelGrid) return;
        if (aboutGrid.dataset.fixApplied === 'true') return;
        if (!window.youtubeVideos) return;

        let iframeCounter = 0;

        function createCard(videoId) {
            const iframeId = 'yt-player-' + (iframeCounter++);
            const wrapper = document.createElement('div');
            wrapper.className = 'content-card';
            wrapper.style.position = 'relative';
            wrapper.style.cursor = 'pointer';
            
            // Use medium quality thumbnail for faster loading
            const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            wrapper.innerHTML = `
                <div class="video-thumbnail" data-video-id="${videoId}" data-iframe-id="${iframeId}" 
                     style="position: relative; width: 100%; aspect-ratio: 16/9; 
                            background: #000 url('${thumbnail}') center/cover no-repeat; 
                            border-radius: 10px; transition: transform 0.2s;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                width: 68px; height: 48px; background: rgba(255,0,0,0.8); 
                                border-radius: 12px; display: flex; align-items: center; 
                                justify-content: center; transition: background 0.2s;">
                        <div style="width: 0; height: 0; border-left: 20px solid white; 
                                    border-top: 12px solid transparent; border-bottom: 12px solid transparent; 
                                    margin-left: 5px;"></div>
                    </div>
                </div>
            `;
            
            // Load iframe only when clicked
            wrapper.addEventListener('click', function() {
                const thumbDiv = wrapper.querySelector('.video-thumbnail');
                if (thumbDiv) {
                    const vid = thumbDiv.dataset.videoId;
                    const iid = thumbDiv.dataset.iframeId;
                    wrapper.innerHTML = `<iframe id="${iid}" class="video-embed" 
                        src="https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>`;
                    wrapper.style.cursor = 'default';
                }
            });
            
            return wrapper;
        }

        // Use DocumentFragment for batch DOM insertion (faster)
        const fragment1 = document.createDocumentFragment();
        youtubeVideos.about.forEach(id => fragment1.appendChild(createCard(id)));
        aboutGrid.appendChild(fragment1);

        const fragment2 = document.createDocumentFragment();
        youtubeVideos.composing.forEach(id => fragment2.appendChild(createCard(id)));
        compGrid.appendChild(fragment2);

        const fragment3 = document.createDocumentFragment();
        youtubeVideos.unreleased.forEach(id => fragment3.appendChild(createCard(id)));
        unrelGrid.appendChild(fragment3);

        const aboutPanel = document.getElementById('about-videos');
        const compPanel  = document.getElementById('composing-videos');
        const unrelPanel = document.getElementById('unreleased-videos');
        if (aboutPanel) aboutPanel.dataset.loaded = 'true';
        if (compPanel)  compPanel.dataset.loaded  = 'true';
        if (unrelPanel) unrelPanel.dataset.loaded = 'true';

        aboutGrid.dataset.fixApplied = 'true';
    };

    // Also override the loadVideos function
    window.loadVideos = function() {
        const aboutGrid = document.getElementById('aboutVideosGrid');
        const compGrid = document.getElementById('composingVideosGrid');
        const unrelGrid = document.getElementById('unreleasedVideosGrid');
        if (!aboutGrid || !compGrid || !unrelGrid) return;

        let iframeCounter = 0;

        function createCard(videoId) {
            const iframeId = 'yt-player-' + (iframeCounter++);
            const wrapper = document.createElement('div');
            wrapper.className = 'content-card';
            wrapper.style.position = 'relative';
            wrapper.style.cursor = 'pointer';
            
            const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            wrapper.innerHTML = `
                <div class="video-thumbnail" data-video-id="${videoId}" data-iframe-id="${iframeId}" 
                     style="position: relative; width: 100%; aspect-ratio: 16/9; 
                            background: #000 url('${thumbnail}') center/cover no-repeat; 
                            border-radius: 10px; transition: transform 0.2s;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                width: 68px; height: 48px; background: rgba(255,0,0,0.8); 
                                border-radius: 12px; display: flex; align-items: center; 
                                justify-content: center; transition: background 0.2s;">
                        <div style="width: 0; height: 0; border-left: 20px solid white; 
                                    border-top: 12px solid transparent; border-bottom: 12px solid transparent; 
                                    margin-left: 5px;"></div>
                    </div>
                </div>
            `;
            
            wrapper.addEventListener('click', function() {
                const thumbDiv = wrapper.querySelector('.video-thumbnail');
                if (thumbDiv) {
                    const vid = thumbDiv.dataset.videoId;
                    const iid = thumbDiv.dataset.iframeId;
                    wrapper.innerHTML = `<iframe id="${iid}" class="video-embed" 
                        src="https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>`;
                    wrapper.style.cursor = 'default';
                }
            });
            
            return wrapper;
        }

        const fragment1 = document.createDocumentFragment();
        youtubeVideos.about.forEach(id => fragment1.appendChild(createCard(id)));
        aboutGrid.appendChild(fragment1);

        const fragment2 = document.createDocumentFragment();
        youtubeVideos.composing.forEach(id => fragment2.appendChild(createCard(id)));
        compGrid.appendChild(fragment2);

        const fragment3 = document.createDocumentFragment();
        youtubeVideos.unreleased.forEach(id => fragment3.appendChild(createCard(id)));
        unrelGrid.appendChild(fragment3);

        document.getElementById('about-videos').dataset.loaded = 'true';
        document.getElementById('composing-videos').dataset.loaded = 'true';
        document.getElementById('unreleased-videos').dataset.loaded = 'true';
    };
})();
