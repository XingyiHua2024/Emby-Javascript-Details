// emby list page

(function () {
    "use strict";

    var paly_mutation;


    document.addEventListener("viewbeforeshow", function (e) {
        paly_mutation?.disconnect(); // Disconnect previous observer if exists

        // Filter specific context paths
        if (e.detail.contextPath.startsWith("/list/") ||
            e.detail.contextPath.startsWith("/videos?") ||
            e.detail.contextPath.startsWith("/tv?") &&
            !e.detail.contextPath.includes("type=Person")) {

            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
            if (isTouchDevice) return;

            const setupObserver = (itemsContainer) => {
                if (!itemsContainer) return;

                paly_mutation = new MutationObserver(async (mutationsList) => {
                    for (let mutation of mutationsList) {
                        for (let node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('virtualScrollItem')) {
                                await addTrailer(node); // Wait for addTrailer to finish before moving on to the next one
                            }
                        }
                    }
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
                //loadCSSFile('./style.css');
                mutation.observe(document.body, {
                    childList: true,
                    subtree: true, // Observe all descendants for better detection
                });
            } else {
                //loadCSSFile('./style.css');
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
            //trailerUrl = await getTrailerUrl(trailerItem);
            trailerUrl = await ApiClient.getItemDownloadUrl(trailerItem.Id, trailerItem.MediaSources[0].Id, trailerItem.serverId);
        } else if (item.RemoteTrailers && item.RemoteTrailers.length > 0) {
            trailerUrl = item.RemoteTrailers[0].Url;
            if (trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')) {
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
            } else {
                return;
            }            
        } else {
            return;
        }

        imgContainer.classList.add('has-trailer');
        const cardOverlay = cardBox.querySelector('.cardOverlayContainer');

        

        let isHovered = false; // Flag to track hover status

        const handleMouseLeave = () => {
            isHovered = false;
            imgContainer.classList.add('has-trailer');
            img.style.filter = ''; // Remove blur effect

            const playerContainer = imgContainer.querySelector(`#player-${itemId}`);
            if (playerContainer) {
                const player = window.YT.get(playerContainer.id);
                if (player) player.destroy();
                playerContainer.remove();
            } else {
                const allVideos = cardOverlay.querySelectorAll('video');
                allVideos.forEach(video => {
                    video.remove(); // Remove each video element
                });
            }
        };

        node.addEventListener('mouseenter', () => {
            if (isHovered) return; // Prevent duplicate mouseenter logic
            isHovered = true;
            imgContainer.classList.remove('has-trailer');

            // Add the mouseleave listener only once
            if (!node.hasMouseLeaveListener) {
                node.addEventListener('mouseleave', handleMouseLeave);
                node.hasMouseLeaveListener = true;
            }

            // Check if the trailer is a YouTube URL
            if (item.LocalTrailerCount == 0 && trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')) {
                const embedUrl = trailerUrl.includes('watch')
                    ? trailerUrl.replace('watch?v=', 'embed/')
                    : trailerUrl.replace('youtu.be/', 'youtube.com/embed/');

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
            } else {
                const videoElement = document.createElement('video');
                videoElement.src = trailerUrl;
                videoElement.autoplay = true;
                videoElement.muted = true;
                videoElement.classList.add('video-element');

                cardOverlay.appendChild(videoElement);
                img.style.filter = 'blur(5px)';
            }
        });
    }


    function getItemIdFromUrl(url) {
        const match = url.match(/\/Items\/(\d+)\//);
        return match ? match[1] : null; // Return the ID if found, otherwise null
    }

    async function getTrailerUrl(item) {
       
        //return `${ApiClient._serverAddress}/emby/videos/${item.Id}/original.${item.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${item.MediaSources[0].Id}&api_key=${ApiClient.accessToken()}`;

        let videourl = '';
        const trailerurl = (await ApiClient.getPlaybackInfo(item.Id, {},
            { "MaxStaticBitrate": 140000000, "MaxStreamingBitrate": 140000000, "MusicStreamingTranscodingBitrate": 192000, "DirectPlayProfiles": [{ "Container": "mp4,m4v", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "mkv", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "flv", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "aac,mp3" }, { "Container": "mov", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "opus", "Type": "Audio" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3" }, { "Container": "mp2,mp3", "Type": "Audio", "AudioCodec": "mp2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac" }, { "Container": "m4a", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "mp4", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "flac", "Type": "Audio" }, { "Container": "webma,webm", "Type": "Audio" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "PCM_S16LE,PCM_S24LE" }, { "Container": "ogg", "Type": "Audio" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis,opus", "VideoCodec": "av1,VP8,VP9" }], "TranscodingProfiles": [{ "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mkv", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "Context": "Static", "MaxAudioChannels": "2", "CopyTimestamps": true }, { "Container": "m4s,ts", "Type": "Video", "AudioCodec": "ac3,mp3,aac", "VideoCodec": "h264,h265,hevc", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true, "ManifestSubtitles": "vtt" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis", "VideoCodec": "vpx", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp4", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264", "Context": "Static", "Protocol": "http" }], "ContainerProfiles": [], "CodecProfiles": [{ "Type": "VideoAudio", "Codec": "aac", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "VideoAudio", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "Video", "Codec": "h264", "Conditions": [{ "Condition": "EqualsAny", "Property": "VideoProfile", "Value": "high|main|baseline|constrained baseline|high 10", "IsRequired": false }, { "Condition": "LessThanEqual", "Property": "VideoLevel", "Value": "62", "IsRequired": false }] }, { "Type": "Video", "Codec": "hevc", "Conditions": [] }], "SubtitleProfiles": [{ "Format": "vtt", "Method": "Hls" }, { "Format": "eia_608", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "eia_708", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "vtt", "Method": "External" }, { "Format": "ass", "Method": "External" }, { "Format": "ssa", "Method": "External" }], "ResponseProfiles": [{ "Type": "Video", "Container": "m4v", "MimeType": "video/mp4" }] }
        )).MediaSources[0];

        if (trailerurl.Protocol == "File") {
            videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;

        } else if (trailerurl.Protocol == "Http") {
            videourl = trailerurl.Path;
        }
        return videourl;

    }

    /*   
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
    */

})();
