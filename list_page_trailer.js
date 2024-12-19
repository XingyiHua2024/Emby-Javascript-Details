// emby list page

(function () {
    "use strict";

    var paly_mutation;
    const OS_current = getOS();
    if (OS_current != 'windows') return;
    document.addEventListener("viewbeforeshow", function (e) {
        paly_mutation?.disconnect(); // Disconnect previous observer if exists

        // Filter specific context paths
        if (e.detail.contextPath.startsWith("/list/") ||
            e.detail.contextPath.startsWith("/videos?") ||
            e.detail.contextPath.startsWith("/tv?")) {

            const setupObserver = (itemsContainer) => {
                if (!itemsContainer) return;

                paly_mutation = new MutationObserver((mutationsList) => {
                    mutationsList.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('virtualScrollItem')) {
                                addTrailer(node); // Perform actions on the new card
                            }
                        });
                    });
                });

                // Start observing for child additions
                paly_mutation.observe(itemsContainer, {
                    childList: true,
                    subtree: false,
                });
            };

            const mutation = new MutationObserver(() => {
                const viewnode = e.target;
                const itemsContainer = viewnode?.querySelector("div[is='emby-scroller']:not(.hide) .virtualItemsContainer");
                if (itemsContainer) {
                    mutation.disconnect(); // Stop observing once the container is found
                    setupObserver(itemsContainer);
                }
            });

            if (!e.detail.isRestored) {
                mutation.observe(document.body, {
                    childList: true,
                    subtree: true, // Observe all descendants for better detection
                });
            } else {
                const viewnode = e.target;
                const itemsContainer = viewnode?.querySelector("div[is='emby-scroller']:not(.hide) .virtualItemsContainer");
                setupObserver(itemsContainer); // Reattach observer for restored views
            }
        }
    });


    async function addTrailer(node) {
        const cardBox = node.querySelector('.cardBox');
        const imgContainer = cardBox?.querySelector('.cardImageContainer');
        const img = imgContainer?.querySelector('.cardImage');
        if (!img) return;
        const itemId = getItemIdFromUrl(img.src);
        if (!itemId || itemId.length === 0) return;

        const item = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemId);
        let trailerUrl;

        if (item.LocalTrailerCount > 0) {
            const localTrailers = await ApiClient.getLocalTrailers(ApiClient.getCurrentUserId(), itemId);
            const trailerItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localTrailers[0].Id);
            trailerUrl = getTrailerUrl(trailerItem);
        } else if (item.RemoteTrailers && item.RemoteTrailers.length > 0) {
            trailerUrl = item.RemoteTrailers[0].Url;
        } else {
            return;
        }

        // Load YouTube IFrame API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Wait for API to load
        await new Promise((resolve) => {
            const checkYT = () => {
                if (window.YT && window.YT.Player) resolve();
                else setTimeout(checkYT, 50);
            };
            checkYT();
        });

        let isHovered = false; // Flag to track hover status

        node.addEventListener('mouseenter', () => {
            isHovered = true;

            // Check if the trailer is a YouTube URL
            if (trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')) {
                const embedUrl = trailerUrl.includes('watch')
                    ? trailerUrl.replace('watch?v=', 'embed/')
                    : trailerUrl.replace('youtu.be/', 'youtube.com/embed/');

                // Create a container for the YouTube player
                const playerContainer = document.createElement('div');
                playerContainer.style.position = 'absolute';
                playerContainer.style.top = '50%';
                playerContainer.style.left = '0';
                playerContainer.style.transform = 'translate(0, -50%)';
                playerContainer.style.width = '100%';
                playerContainer.style.height = '100%';
                playerContainer.style.zIndex = '3';
                playerContainer.id = `player-${itemId}`;
                imgContainer.appendChild(playerContainer);

                // Initialize the YouTube player
                const player = new YT.Player(playerContainer.id, {
                    videoId: new URL(embedUrl).pathname.split('/').pop(),
                    playerVars: {
                        autoplay: 1,
                        mute: 1, // Mute the video
                        controls: 0, // Hide player controls
                        modestbranding: 1, // Remove YouTube logo
                    },
                    events: {
                        onReady: (event) => {
                            event.target.playVideo();
                        },
                    },
                });

                node.addEventListener('mouseleave', () => {
                    isHovered = false;
                    player.destroy(); // Clean up the player instance
                    playerContainer.remove(); // Remove the container
                    img.style.filter = 'none'; // Remove blur effect
                });
            } else {
                // Handle local video trailers as before
                const videoElement = document.createElement('video');
                videoElement.src = trailerUrl;
                videoElement.autoplay = true;
                videoElement.muted = true;
                videoElement.style.position = 'absolute';
                videoElement.style.top = '50%';
                videoElement.style.left = '0';
                videoElement.style.transform = 'translate(0, -50%)';
                videoElement.style.width = '100%';
                videoElement.style.height = 'auto';
                videoElement.style.zIndex = '3';
                videoElement.style.pointerEvents = 'none';
                imgContainer.appendChild(videoElement);
                img.style.filter = 'blur(5px)';

                node.addEventListener('mouseleave', () => {
                    isHovered = false;
                    videoElement.remove();
                    img.style.filter = 'none';
                });
            }
        });
    }


    function getItemIdFromUrl(url) {
        const match = url.match(/\/Items\/(\d+)\/Images\//);
        return match ? match[1] : null; // Return the ID if found, otherwise null
    }

    function getTrailerUrl(item) {
        return `${ApiClient._serverAddress}/emby/videos/${item.Id}/original.${item.MediaSources[0].Container}?MediaSourceId=${item.MediaSources[0].Id}&api_key=${ApiClient.accessToken()}`;
    }

    function getOS() {
        let u = navigator.userAgent
        if (!!u.match(/compatible/i) || u.match(/Windows/i)) {
            return 'windows'
        } else if (!!u.match(/Macintosh/i) || u.match(/MacIntel/i)) {
            return 'macOS'
        } else if (!!u.match(/iphone/i)) {
            return 'iphone'
        } else if (!!u.match(/Ipad/i)) {
            return 'ipad'
        } else if (u.match(/android/i)) {
            return 'android'
        } else if (u.match(/Ubuntu/i)) {
            return 'Ubuntu'
        } else {
            return 'other'
        }
    }


})();
