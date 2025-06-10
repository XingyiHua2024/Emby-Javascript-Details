// emby list page

(function () {
    "use strict";

    class CommonUtils {
        static loadExtastyle(content, id) {
            let style = document.createElement("style");
            style.type = "text/css";
            style.id = id;
            style.innerHTML = content;
            document.head.appendChild(style);
        }
    }

    var paly_mutation, adminUserId = '';
    const OS_current = getOS();

    const embyDetailCss = `.has-trailer{position:relative;box-shadow:0 0 10px 3px rgb(255 255 255 / .8);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.has-trailer:hover{box-shadow:0 0 10px 3px rgb(255 0 150 / .3);transition:box-shadow 0.2s ease-in-out}.injectJavdb{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.injectJavdb:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.injectJavdb .button-text,.injectJavdb .button-icon{color:pink;transition:color 0.3s,filter 0.3s}.injectJavdb:hover .button-text,.injectJavdb:hover .button-icon{color:black!important}.injectJavbus .button-text,.injectJavbus .button-icon{color:#ff8181!important}.noUncensored{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.noUncensored .button-text,.noUncensored .button-icon{color:grey!important}.melt-away{animation:sandMeltAnimation 1s ease-out forwards}@keyframes sandMeltAnimation{0%{opacity:1}100%{opacity:0}}.my-fanart-image{display:inline-block;margin:8px 10px 8px 10px;vertical-align:top;border-radius:8px;height:27vh;transition:transform 0.3s ease,filter 0.3s ease;min-height:180px}.my-fanart-image-slider{height:20vh!important}.my-fanart-image:hover{transform:scale(1.03);filter:brightness(80%)}.modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0}@media (max-width:768px){.modal-content{max-width:80%;max-height:80%}}.modal-closing .modal-content{animation-name:shrinkAndRotate;animation-duration:0.3s;animation-timing-function:ease-out}.close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.prev,.next{position:absolute;width:40px;height:40px;line-height:40px;justify-content:center;align-items:center;display:flex;top:50%;background-color:rgb(0 0 0 / .5);color:#fff;border:none;cursor:pointer;font-size:35px;font-weight:700;transform:translateY(-50%) translateX(-50%);transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:35px}.prev{left:80px}.next{right:20px}.prev:hover,.next:hover{background-color:rgb(255 255 255 / .3);padding:35px}.close:hover{background-color:rgb(255 255 255 / .3);padding:10px}@keyframes shrinkAndRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.click-smaller{transform:scale(.9) translate(-50%,-50%);transition:transform 0.2s}.prev.disabled,.next.disabled{color:grey!important;cursor:default}@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-10px)}100%{transform:translateX(0)}}.modal-caption{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.modal-caption{bottom:100px}}.video-element{position:absolute;width:100%;height:100%;object-fit:contain;z-index:3;pointer-events:auto;transition:opacity 0.5s ease}.copy-link{color:lightblue;cursor:pointer;display:inline-block;transition:transform 0.1s ease}.copy-link:active{transform:scale(.95)}.media-info-item{display:block;width:100%;margin-top:10px;text-align:left}.media-info-item a{padding:5px 10px;background:rgb(255 255 255 / .15);margin-bottom:5px;margin-right:5px;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);font-weight:600;font-family:'Poppins',sans-serif;transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease;text-decoration:none;color:#fff}.media-info-item a:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.pageButton{cursor:pointer;padding:6px 16px;background:rgb(255 255 255 / 15%);border-radius:5px;box-shadow:0 2px 4px rgb(0 0 0 / .2);transition:background-color 0.3s ease,box-shadow 0.3s ease}.pageButton:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#pageInput-actorPage::-webkit-inner-spin-button,#pageInput-actorPage::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-actorPage{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:5px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit}#filterDropdown{width:auto;backdrop-filter:blur(5px);color:#fff;transition:background-color 0.3s ease,box-shadow 0.3s ease;margin-left:20px;font-family:inherit;padding:6px 16px;font-weight:inherit;line-height:inherit;border:none}#filterDropdown:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#filterDropdown:focus{outline:none;box-shadow:0 0 4px 2px rgb(255 255 255 / .8)}#filterDropdown option{font-family:inherit;color:#000;background:#fff;border:none;padding:5px;font-weight:inherit}#filterDropdown option:hover{background:#c8c8c8}.myCardImage{transition:filter 0.2s ease}.myCardImage:hover{filter:brightness(70%)}#toggleFanart{padding:10px 20px;font-size:18px;background:rgb(255 255 255 / .15);margin-top:15px;margin-bottom:15px;border:none;border-radius:8px;font-weight:700;font-family:'Poppins',sans-serif;color:#fff;text-decoration:none;cursor:pointer;display:block;margin-left:auto;margin-right:auto;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease}#toggleFanart:hover{transform:scale(1.1);background:linear-gradient(135deg,rgb(255 0 150 / .4),rgb(0 150 255 / .4));box-shadow:0 6px 20px rgb(0 0 0 / .3),0 0 15px rgb(0 150 255 / .6);color:#fff}#toggleFanart:active{transform:scale(.95);box-shadow:0 3px 12px rgb(0 0 0 / .3)}.bg-style{background:linear-gradient(to right top,rgb(0 0 0 / .98),rgb(0 0 0 / .2)),url(https://assets.nflxext.com/ffe/siteui/vlv3/058eee37-6c24-403a-95bd-7d85d3260ae1/5030300f-ed0c-473a-9795-a5123d1dd81d/US-en-20240422-POP_SIGNUP_TWO_WEEKS-perspective_WEB_0941c399-f3c4-4352-8c6d-0a3281e37aa0_large.jpg);background-attachment:fixed;background-repeat:no-repeat;background-position:center;background-size:cover}@media (max-width:50em){.swiper-thumbs{display:none!important}}`;
    
    document.addEventListener("viewbeforeshow", function (e) {
        paly_mutation?.disconnect(); // Disconnect previous observer if exists

        // Filter specific context paths
        if (e.detail.contextPath.startsWith("/list/") ||
            e.detail.contextPath.startsWith("/videos?") ||
            e.detail.contextPath.startsWith("/tv?") &&
            !e.detail.contextPath.includes("type=Person")) {
            !document.getElementById("embyDetailCss") && CommonUtils.loadExtastyle(embyDetailCss, 'embyDetailCss');

            applyBackgroundStyle();

            //const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
            //if (isTouchDevice) return;
            if (OS_current === 'ipad' || OS_current === 'iphone') return

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

    async function loadConfig() {
        const response = await fetch('./config.json');
        if (!response.ok) {
            console.error(`Failed to fetch config.json: ${response.status} ${response.statusText}`);
            return; // Exit the function if the file is not found or another error occurs
        }
        const config = await response.json();
        if (config) {
            adminUserId = config.adminUserId || adminUserId;
        }     
    }

    async function applyBackgroundStyle() {
        
        const viewList = document.querySelector('.view-list-list');
        if (!viewList) return;

        await loadConfig();

        const isAdmin = ApiClient.getCurrentUserId() === adminUserId;

        if (isAdmin) {
            viewList.classList.add('bg-style');
        }
    }


    async function addTrailer(node) {
        const cardBox = node.querySelector('.cardBox');
        const imgContainer = cardBox?.querySelector('.cardImageContainer');
        const img = imgContainer?.querySelector('.cardImage');
        if (!img) return;
        const itemId = getItemIdFromUrl(img.src);
        if (!itemId || itemId.length === 0) return;
        let cacheKey = `trailerUrl_${itemId}`;
        let trailerUrl = localStorage.getItem(cacheKey);

        if (!trailerUrl) {
            const item = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemId);

            if (item.LocalTrailerCount > 0) {
                const localTrailers = await ApiClient.getLocalTrailers(ApiClient.getCurrentUserId(), itemId);
                const trailerItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localTrailers[0].Id);
                trailerUrl = await getTrailerUrl(trailerItem);
                //trailerUrl = await ApiClient.getItemDownloadUrl(trailerItem.Id, trailerItem.MediaSources[0].Id, trailerItem.serverId);
            } else if (item.Type === 'Trailer') {
                trailerUrl = await getTrailerUrl(item);
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
        }
       

        localStorage.setItem(cacheKey, trailerUrl);

        imgContainer.classList.add('has-trailer');
        const cardOverlay = cardBox.querySelector('.cardOverlayContainer');

        

        let isHovered = false; // Flag to track hover status

        node.addEventListener('mouseleave', () => {
            if (!isHovered) return; // Exit if not hovered
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
                allVideos.forEach(video => video.remove());
            }
        });

        node.addEventListener('mouseenter', () => {
            if (isHovered) return; // Prevent duplicate mouseenter logic
            isHovered = true;
            imgContainer.classList.remove('has-trailer');

            // Check if the trailer is a YouTube URL
            if (trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')) {
                const embedUrl = trailerUrl.includes('watch')
                    ? trailerUrl.replace('watch?v=', 'embed/')
                    : trailerUrl.replace('youtu.be/', 'youtube.com/embed/');

                const playerContainer = document.createElement('div');
                playerContainer.classList.add('video-element');
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
            //videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;
            videourl = await ApiClient.getItemDownloadUrl(item.Id, item.MediaSources[0].Id, item.serverId);

        } else if (trailerurl.Protocol == "Http") {
            videourl = trailerurl.Path;
        }
        return videourl;
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
