// emby list page

(function () {
    "use strict";

    var OS_current, viewnode, paly_mutation;
    OS_current = getOS();
    document.addEventListener("viewbeforeshow", function (e) {
        paly_mutation?.disconnect();
        if (OS_current != 'windows') return;
        if (e.detail.contextPath.startsWith("/list/") || e.detail.contextPath.startsWith("/videos?")) {
            if (!e.detail.isRestored) {             
                const mutation = new MutationObserver(function () {
                    viewnode = e.target;
                    const itemsContainer = viewnode?.querySelector("div[is='emby-scroller']:not(.hide) .virtualItemsContainer");
                    if (itemsContainer) {
                        mutation.disconnect();
                        // Start observing itemsContainer for new cards
                        paly_mutation = new MutationObserver(function (mutationsList) {
                            mutationsList.forEach(mutation => {
                                if (mutation.addedNodes.length > 0) {
                                    mutation.addedNodes.forEach(node => {
                                        // Check if the added node is a card
                                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('virtualScrollItem')) {
                                            console.log('New card added:', node);
                                            // Perform actions on the new card
                                            addTrailer(node);
                                        }
                                    });
                                }
                            });
                        });

                        // Observe itemsContainer for child additions
                        paly_mutation.observe(itemsContainer, {
                            childList: true, // Observe direct children
                            subtree: false,  // Do not observe descendants
                        });
                    }
                });

                mutation.observe(document.body, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });

            }
        }
    });


    async function addTrailer(node) {
        const cardBox = node.querySelector('.cardBox');
        const imgContainer = cardBox?.querySelector('.cardImageContainer');
        const img = imgContainer?.querySelector('.cardImage');
        if (!img) return;
        const itemId = getItemIdFromUrl(img.src);
        if (!itemId || itemId.length == 0) return;
        const localTrailers = await ApiClient.getLocalTrailers(ApiClient.getCurrentUserId(), itemId);

        if (!localTrailers || localTrailers.length == 0) return;
        const trailerItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localTrailers[0].Id);
        if (!trailerItem) return

        const trailerUrl = getTrailerUrl(trailerItem);

        //let isHovered = false; // Flag to track hover status

        node.addEventListener('mouseenter', () => {
            //isHovered = true; 
            let videoElement = document.createElement('video');
            videoElement.src = trailerUrl; // Video URL
            videoElement.autoplay = true; // Ensure video plays automatically
            videoElement.muted = true; // Mute the video (to avoid autoplay restrictions)
            videoElement.style.position = 'absolute'; // Position the video on top
            videoElement.style.top = '50%'; // Align the video to the top of the container
            videoElement.style.left = '0'; // Align the video to the left of the container
            videoElement.style.transform = 'translate(0, -50%)';
            videoElement.style.width = '100%'; // Make the video fill the container width
            videoElement.style.height = 'auto'; // Make the video fill the container height
            videoElement.style.maxheight = '100%';
            videoElement.style.zIndex = '3'; // Ensure the video appears above the image
            videoElement.style.pointerEvents = 'auto'; // Allow interaction with the video

            imgContainer.appendChild(videoElement); // Add video to the container
            img.style.filter = 'blur(5px)';

            videoElement.addEventListener('ended', () => {
                videoElement.style.display = 'none'; // Remove the video element
                img.style.filter = 'none'; // Remove blur effect
            });

        });

        node.addEventListener('mouseleave', () => {
            //isHovered = false;
            img.style.filter = 'none';
            const allVideos = imgContainer.querySelectorAll('video');
            allVideos.forEach(video => {
                video.remove(); // Remove each video element
            });

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
