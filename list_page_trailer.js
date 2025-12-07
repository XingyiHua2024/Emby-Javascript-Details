// emby list page

(function () {
    "use strict";

    var paly_mutation, adminUserId = '', getTrailerFromCache = true, dmm_proxy = "https://cc3001.dmm.co.jp", videoVolume = 0.5;

    const OS_current = getOS();

    var deviceProfile = {};

    const embyDetailCss = `.has-trailer{position:relative;box-shadow:0 0 10px 3px rgb(255 255 255 / .8);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.has-trailer:hover{box-shadow:0 0 10px 3px rgb(255 0 150 / .3);transition:box-shadow 0.2s ease-in-out}.injectJavdb{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.injectJavdb:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.injectJavdb .button-text,.injectJavdb .button-icon{color:pink;transition:color 0.3s,filter 0.3s}.injectJavdb:hover .button-text,.injectJavdb:hover .button-icon{color:black!important}.injectJavbus .button-text,.injectJavbus .button-icon{color:#ff8181!important}.noUncensored{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.noUncensored .button-text,.noUncensored .button-icon{color:grey!important}.melt-away{animation:sandMeltAnimation 1s ease-out forwards}@keyframes sandMeltAnimation{0%{opacity:1}100%{opacity:0}}.my-fanart-image{display:inline-block;margin:8px 10px 20px 10px;vertical-align:top;border-radius:8px;height:27vh;transition:transform 0.3s ease,filter 0.3s ease;min-height:180px}.my-fanart-image-slider{height:20vh!important}.my-fanart-image:hover{transform:scale(1.03);filter:brightness(80%)}.modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0}@media (max-width:768px){.modal-content{max-width:80%;max-height:80%}}.modal-closing .modal-content{animation-name:shrinkAndRotate;animation-duration:0.3s;animation-timing-function:ease-out}.close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.prev,.next{position:absolute;width:40px;height:40px;line-height:40px;justify-content:center;align-items:center;display:flex;top:50%;background-color:rgb(0 0 0 / .5);color:#fff;border:none;cursor:pointer;font-size:35px;font-weight:700;transform:translateY(-50%) translateX(-50%);transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:35px}.prev{left:80px}.next{right:20px}.prev:hover,.next:hover{background-color:rgb(255 255 255 / .3);padding:35px}.close:hover{background-color:rgb(255 255 255 / .3);padding:10px}@keyframes shrinkAndRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.click-smaller{transform:scale(.9) translate(-50%,-50%);transition:transform 0.2s}.prev.disabled,.next.disabled{color:grey!important;cursor:default}@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-10px)}100%{transform:translateX(0)}}.modal-caption{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.modal-caption{bottom:100px}}.video-element{position:absolute;width:100%;height:100%;object-fit:contain;z-index:3;pointer-events:auto;transition:opacity 0.5s ease}.copy-link{color:lightblue;cursor:pointer;display:inline-block;transition:transform 0.1s ease}.copy-link:active{transform:scale(.95)}.media-info-item{display:block;width:100%;margin-top:10px;text-align:left}.media-info-item a{padding:5px 10px;background:rgb(255 255 255 / .15);margin-bottom:5px;margin-right:5px;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);font-weight:600;font-family:'Poppins',sans-serif;transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease;text-decoration:none;color:#fff;border-radius: 20px}.media-info-item a:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.pageButton{cursor:pointer;padding:6px 16px;background:rgb(255 255 255 / 15%);border-radius:5px;box-shadow:0 2px 4px rgb(0 0 0 / .2);transition:background-color 0.3s ease,box-shadow 0.3s ease}.pageButton:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#pageInput-actorPage::-webkit-inner-spin-button,#pageInput-actorPage::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-actorPage{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:5px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit}#filterDropdown{width:auto;backdrop-filter:blur(5px);color:#fff;transition:background-color 0.3s ease,box-shadow 0.3s ease;margin-left:20px;font-family:inherit;padding:6px 16px;font-weight:inherit;line-height:inherit;border:none}#filterDropdown:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#filterDropdown:focus{outline:none;box-shadow:0 0 4px 2px rgb(255 255 255 / .8)}#filterDropdown option{font-family:inherit;color:#000;background:#fff;border:none;padding:5px;font-weight:inherit}#filterDropdown option:hover{background:#c8c8c8}.myCardImage{transition:filter 0.2s ease}.myCardImage:hover{filter:brightness(70%)}#toggleFanart{padding:10px 20px;font-size:18px;background:rgb(255 255 255 / .15);margin-top:15px;margin-bottom:15px;border:none;border-radius:8px;font-weight:700;font-family:'Poppins',sans-serif;color:#fff;text-decoration:none;cursor:pointer;display:block;margin-left:auto;margin-right:auto;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease}#toggleFanart:hover{transform:scale(1.1);background:linear-gradient(135deg,rgb(255 0 150 / .4),rgb(0 150 255 / .4));box-shadow:0 6px 20px rgb(0 0 0 / .3),0 0 15px rgb(0 150 255 / .6);color:#fff}#toggleFanart:active{transform:scale(.95);box-shadow:0 3px 12px rgb(0 0 0 / .3)}.bg-style{background:linear-gradient(to right top,rgb(0 0 0 / .98),rgb(0 0 0 / .2)),url(https://assets.nflxext.com/ffe/siteui/vlv3/058eee37-6c24-403a-95bd-7d85d3260ae1/5030300f-ed0c-473a-9795-a5123d1dd81d/US-en-20240422-POP_SIGNUP_TWO_WEEKS-perspective_WEB_0941c399-f3c4-4352-8c6d-0a3281e37aa0_large.jpg);background-attachment:fixed;background-repeat:no-repeat;background-position:center;background-size:cover}@media (max-width:50em){.swiper-thumbs{display:none!important}}`;

    document.addEventListener("viewbeforeshow", function (e) {
        
        // Filter specific context paths
        if (e.detail.contextPath.startsWith("/list/") ||
            e.detail.contextPath.startsWith("/videos?") ||
            e.detail.contextPath.startsWith("/tv?") &&
            !e.detail.contextPath.includes("type=Person")) {
            !document.getElementById("embyDetailCss") && loadExtraStyle(embyDetailCss, 'embyDetailCss');

            paly_mutation?.disconnect(); // Disconnect previous observer if exists

            clearExpiredCache();

            applyBackgroundStyle();

            const selectorStr = e.detail.contextPath.startsWith("/videos?") ? `[data-index="1"].itemsTab .virtualItemsContainer` : "div[is='emby-scroller']:not(.hide) .virtualItemsContainer";
            //const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
            //if (isTouchDevice) return;
            if (OS_current === 'iphone' || OS_current === 'ipad') return


            const setupObserver = (itemsContainer) => {
                if (!itemsContainer) return;

                let currentCancelToken = null;

                paly_mutation = new MutationObserver((mutationsList) => {
                    for (let mutation of mutationsList) {
                        if (mutation.type === 'childList' || mutation.type === 'attributes') {

                            const refresh = mutation.type === 'attributes';
                            const delay = refresh ? 1000 : 0;

                            setTimeout(() => {
                                // Cancel previous run
                                if (currentCancelToken) currentCancelToken.cancelled = true;

                                const token = { cancelled: false };
                                currentCancelToken = token;
                                processAllChildren(itemsContainer, token, refresh);
                            }, delay);

                           /*
                            if (typeof itemsContainer.updateElement === 'function') {
                                paly_mutation.disconnect();

                                const originalUpdateElement = itemsContainer.updateElement;

                                itemsContainer.updateElement = function (...args) {
                                    const result = originalUpdateElement.apply(this, args);

                                    // If original is sync, wrap it into a Promise
                                    return Promise.resolve(result).then(() => {
                                        addHoverEffect(itemsContainer);
                                    });
                                };


                                setTimeout(() => {
                                    addHoverEffect(itemsContainer);
                                }, 1000);
                            }
                            */
                            break;
                        }
                    }
                });

                paly_mutation.observe(itemsContainer, {
                    childList: true,
                    attributes: true,         // enable if relevant
                    subtree: false,            // or true if children’s children matter
                });

                async function processAllChildren(container, token, refresh) {
                    const children = Array.from(container.children);
                    for (let node of children) {
                        if (token.cancelled) return; // Stop if cancelled
                        if (node.classList.contains('virtualScrollItem')) {
                            const itemSource = container._itemSource || container.itemParts;
                            const itemId = itemSource[node._dataItemIndex]?.Id;
                            if (itemId) {
                                await addTrailer(node, refresh, itemId);
                            }
                        }
                    }
                }
            };

            const mutation = new MutationObserver(() => {
                const viewnode = e.target;
                const itemsContainer = viewnode?.querySelector(selectorStr);
                if (itemsContainer) {
                    mutation.disconnect(); // Stop observing once the container is found
                    //itemsContainer.updateElement();
                    //itemsContainer.fetchData();
                    //itemsContainer.fetchItems();
                    
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
                const itemsContainer = viewnode?.querySelector(selectorStr);
                setupObserver(itemsContainer); // Reattach observer for restored views
            }
        }
    });

    function clearExpiredCache() {
        const CACHE_PREFIX = "trailerUrl";
        const EXPIRY_KEY = "trailerUrl_cacheExpiry";
        const expiry = localStorage.getItem(EXPIRY_KEY);
        const now = Date.now();

        if (!expiry || now > Number(expiry)) {
            // Time to clear cached items with prefix
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });

            // Set next expiry time (24h from now)
            const nextExpiry = now + 24 * 60 * 60 * 1000; // 24 hours in ms
            localStorage.setItem(EXPIRY_KEY, nextExpiry.toString());
        }
    }

    async function loadConfig() {
        let config = null;
        if (window.cachedConfig) {
            config = window.cachedConfig;
        } else {
            const response = await fetch('./config.json');
            if (!response.ok) {
                console.error(`Failed to fetch config.json: ${response.status} ${response.statusText}`);
                return; // Exit the function if the file is not found or another error occurs
            }
            config = await response.json();
            window.cachedConfig = config;
        }

        if (config) {
            adminUserId = config.adminUserId || adminUserId;
            dmm_proxy = config.dmm_proxy || dmm_proxy;
        }     
    }

    function loadExtraStyle(content, id) {
        let style = document.createElement("style");
        style.id = id; // Set the ID for the style element
        style.innerHTML = content; // Set the CSS content
        document.head.appendChild(style); // Append the style element to the document head
    }

    async function applyBackgroundStyle() {
        
        const viewLists = document.querySelectorAll(".view-list-list");
        if (!viewLists || viewLists.length === 0) return;

        await loadConfig();

        const isAdmin = true;

        if (isAdmin) {
            viewLists.forEach(viewList => {
                viewList.classList.add('bg-style');
            });
        }
    }

    /*
    async function addHoverEffect(itemsContainer, refresh = true) {
        if (!itemsContainer) return;

        const portraitCards = itemsContainer.children;
        if (!portraitCards) return;

        for (let card of portraitCards) {
            await addTrailer(card, refresh);
        }
    }
    */

    async function addTrailer(node, refresh = false, Id = null) {
        const cardBox = node.querySelector('.cardBox');
        const imgContainer = cardBox?.querySelector('.cardImageContainer');
        if (imgContainer?.classList.contains("has-trailer") && !refresh) return;
        const img = imgContainer?.querySelector('.cardImage');
        if (!img) return;
        const itemId = Id || getItemIdFromUrl(img.src);
        if (!itemId || itemId.length === 0) return;
        let cacheKey = `trailerUrl_${itemId}`;
        //let trailerUrl = localStorage.getItem(cacheKey);
        let trailerUrl = getTrailerFromCache? localStorage.getItem(cacheKey) : null;

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
                 
            } else {
                return;
            }
        }

        if (!trailerUrl || trailerUrl === '' || trailerUrl === 'null') return;

        try {
            localStorage.setItem(cacheKey, trailerUrl);
        } catch (e) {
            console.warn("Failed to cache trailerUrl", e);
        }

        if (trailerUrl.includes('https://cc3001.dmm.co.jp')) {
            trailerUrl = trailerUrl.replace(
                "https://cc3001.dmm.co.jp",
                dmm_proxy
            );
        }

        imgContainer.classList.add('has-trailer');
        const cardOverlay = cardBox.querySelector('.cardOverlayContainer');


        let isHovered = false; // Flag to track hover status



        if (refresh) {
            ['mouseenter', 'mouseleave'].forEach(type => {
                const key = `_${type}Handler`;
                if (node[key]) {
                    node.removeEventListener(type, node[key]);
                    node[key] = null;
                }
            });
        }

        const mouseenterHandler = () => {
            if (isHovered) return;
            isHovered = true;
            imgContainer.classList.remove('has-trailer');
            const expandBtn = createExpandBtn();

            if (trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')) {
                let videoId = null;

                if (trailerUrl.includes('watch')) {
                    videoId = new URL(trailerUrl).searchParams.get('v');
                } else {
                    const parts = trailerUrl.split('/');
                    videoId = parts[parts.length - 1] || parts[parts.length - 2];
                }

                const iframe = document.createElement('iframe');
                iframe.classList.add('video-element');

                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
                iframe.allow = "autoplay; encrypted-media";
                iframe.frameBorder = "0";

                imgContainer.appendChild(iframe);
            } else {
                const videoElement = document.createElement('video');
                videoElement.src = trailerUrl;
                videoElement.autoplay = true;
                videoElement.muted = true;
                videoElement.classList.add('video-element');

                cardOverlay.appendChild(videoElement);
                img.style.filter = 'blur(5px)';
            }

            cardOverlay.appendChild(expandBtn);
            setTimeout(() => {
                if (isHovered) {
                    expandBtn.style.opacity = '1';
                }
            }, 300);
        };

        const mouseleaveHandler = () => {
            if (!isHovered) return;
            isHovered = false;
            imgContainer.classList.add('has-trailer');
            img.style.filter = '';

            const iframe = imgContainer.querySelector('iframe.video-element');
            if (iframe) {
                iframe.remove();
            } else {
                const allVideos = cardOverlay.querySelectorAll('video');
                allVideos.forEach(video => video.remove());
            }
            cardOverlay.querySelector('.jv-expand-btn')?.remove();
        };

        if (OS_current === 'visionOS') {
            node.addEventListener('focus', mouseenterHandler);
            node._focusHandler = mouseenterHandler;

            node.addEventListener('blur', mouseleaveHandler);
            node._blurHandler = mouseleaveHandler;
        } else {
            // Add and store the new handler
            node.addEventListener('mouseenter', mouseenterHandler);
            node._mouseenterHandler = mouseenterHandler;
            node.addEventListener('mouseleave', mouseleaveHandler);
            node._mouseleaveHandler = mouseleaveHandler;
        }    
    }

    function createExpandBtn() {
        const expandBtn = document.createElement('button');
        expandBtn.className = 'jv-expand-btn';
        expandBtn.innerHTML = `
						<svg viewBox="0 0 24 24" width="20" height="20" fill="white">
							<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
						</svg>
					`;
        expandBtn.style.cssText = `
						position: absolute;
						top: 8px;
						right: 8px;
						width: 32px;
						height: 32px;
						background: rgba(0, 0, 0, 0.6);
						border: 1px solid rgba(255, 255, 255, 0.3);
						border-radius: 4px;
						cursor: pointer;
						display: flex;
						align-items: center;
						justify-content: center;
						z-index: 100;
						opacity: 0;
						transition: all 0.2s ease;
						backdrop-filter: blur(4px);
					`;
        expandBtn.title = '全屏播放';

        expandBtn.onmouseenter = () => {
            expandBtn.style.background = 'rgba(0, 0, 0, 0.8)';
            expandBtn.style.transform = 'scale(1.1)';
        };

        expandBtn.onmouseleave = () => {
            expandBtn.style.background = 'rgba(0, 0, 0, 0.6)';
            expandBtn.style.transform = 'scale(1)';
        };

        expandBtn.onclick = async (e) => {
            e.stopPropagation();

            const parent = expandBtn.parentElement;
            if (!parent) return;
            const grandParent = parent.parentElement;
            if (!grandParent) return;

            // Find closest <video> in same container
            const video = parent.querySelector('video') || grandParent.querySelector('.cardImageContainer iframe');
            if (!video) return;

            const title = grandParent.querySelector('.cardText-first button')?.title || '';
            openVideoInModal(video.src, title);

        };
        return expandBtn
    }

    function createVideoModal() {
        const modalHTML = `
             <span class="close">&#10006;</span>
             <video class="modal-content" id="modalVideo"></video>
             <iframe class="modal-content" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" id="modalYT"></iframe>
             <div class="modal-caption" id="modalVideoCaption">title</div>
        `;

        const modal = document.createElement('div');
        modal.id = 'myVideoModal';
        modal.classList.add('modal');
        modal.innerHTML = modalHTML;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector(".close");
        const modalVideo = modal.querySelector("#modalVideo");
        const modalYT = modal.querySelector("#modalYT");
        modalVideo.style.opacity = '0';
        modalYT.style.opacity = '0';

        function closeVideoModal() {
            modal.classList.add("modal-closing");
            // Save volume if video
            if (modalVideo.style.display !== "none") {
                videoVolume = modalVideo.volume;
                modalVideo.style.opacity = '0';
                modalVideo.pause();
                modalVideo.src = "";
            }

            // Stop YouTube iframe by removing src
            if (modalYT.style.display !== "none") {
                modalYT.style.opacity = '0';
                modalYT.src = "";
            }

            setTimeout(() => {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }, 200);
        }

        closeBtn.addEventListener('click', closeVideoModal);
        window.addEventListener('popstate', closeVideoModal);

        return modal;
    }

    function openVideoInModal(videoSrc, title) {
        let modal = document.getElementById("myVideoModal");
        if (!modal) {
            modal = createVideoModal();
        }

        const modalVideo = modal.querySelector("#modalVideo");
        //const closeBtn = modal.querySelector(".close");
        const modalYT = modal.querySelector("#modalYT");
        const modalCaption = modal.querySelector("#modalVideoCaption");

        modalCaption.textContent = title;

        // Detect YouTube URLs
        const isYouTube = videoSrc.includes("youtube.com");

        if (isYouTube) {
            // Hide video element
            modalVideo.style.display = "none";

            // Show iframe
            modalYT.style.display = "block";
            //modalYT.style.position = "absolute";
            modalYT.style.width = "100%";
            modalYT.style.height = "100%";
            modalYT.src = getFullscreenYTUrl(videoSrc);
            fadeIn(modalYT, 300);
        } else {
            // Hide iframe
            modalYT.style.display = "none";

            // Show video element
            modalVideo.style.display = "block";
            modalVideo.src = videoSrc;
            modalVideo.controls = true;
            modalVideo.autoplay = true;
            modalVideo.muted = false;
            modalVideo.volume = videoVolume;
            modalVideo.style.width = "100%";
            modalVideo.style.height = "100%";
            fadeIn(modalVideo, 300);
        }


        // Show modal
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        modal.classList.remove("modal-closing");
    }

    function getFullscreenYTUrl(videoSrc) {
        const url = new URL(videoSrc);

        // Ensure autoplay
        url.searchParams.set("autoplay", "1");

        // Unmute
        url.searchParams.set("mute", "0");

        // Show controls
        url.searchParams.set("controls", "1");

        // Plays inline off is okay; fullscreen will use modal size
        url.searchParams.set("playsinline", "0");

        // Optional: modest branding
        url.searchParams.set("modestbranding", "1");

        return url.toString();
    }

    function fadeIn(element, duration) {
        let opacity = 0;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            opacity = Math.min(elapsed / duration, 1);
            element.style.opacity = opacity;

            if (opacity < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }

    function getItemIdFromUrl(url) {
        const match = url.match(/\/Items\/(\d+)\//);
        return match ? match[1] : null; // Return the ID if found, otherwise null
    }

    async function getTrailerUrl(item) {
       
        //return `${ApiClient._serverAddress}/emby/videos/${item.Id}/original.${item.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${item.MediaSources[0].Id}&api_key=${ApiClient.accessToken()}`;

        let videourl = '';
        if (Object.keys(deviceProfile).length === 0) {
            deviceProfile = await getDeviceProfile(item);
        }

        if (!deviceProfile || Object.keys(deviceProfile).length === 0) {
            deviceProfile = { "MaxStaticBitrate": 140000000, "MaxStreamingBitrate": 140000000, "MusicStreamingTranscodingBitrate": 192000, "DirectPlayProfiles": [{ "Container": "mp4,m4v", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "mkv", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "flv", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "aac,mp3" }, { "Container": "mov", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "opus", "Type": "Audio" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3" }, { "Container": "mp2,mp3", "Type": "Audio", "AudioCodec": "mp2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac" }, { "Container": "m4a", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "mp4", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "flac", "Type": "Audio" }, { "Container": "webma,webm", "Type": "Audio" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "PCM_S16LE,PCM_S24LE" }, { "Container": "ogg", "Type": "Audio" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis,opus", "VideoCodec": "av1,VP8,VP9" }], "TranscodingProfiles": [{ "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mkv", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "Context": "Static", "MaxAudioChannels": "2", "CopyTimestamps": true }, { "Container": "m4s,ts", "Type": "Video", "AudioCodec": "ac3,mp3,aac", "VideoCodec": "h264,h265,hevc", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true, "ManifestSubtitles": "vtt" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis", "VideoCodec": "vpx", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp4", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264", "Context": "Static", "Protocol": "http" }], "ContainerProfiles": [], "CodecProfiles": [{ "Type": "VideoAudio", "Codec": "aac", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "VideoAudio", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "Video", "Codec": "h264", "Conditions": [{ "Condition": "EqualsAny", "Property": "VideoProfile", "Value": "high|main|baseline|constrained baseline|high 10", "IsRequired": false }, { "Condition": "LessThanEqual", "Property": "VideoLevel", "Value": "62", "IsRequired": false }] }, { "Type": "Video", "Codec": "hevc", "Conditions": [] }], "SubtitleProfiles": [{ "Format": "vtt", "Method": "Hls" }, { "Format": "eia_608", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "eia_708", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "vtt", "Method": "External" }, { "Format": "ass", "Method": "External" }, { "Format": "ssa", "Method": "External" }], "ResponseProfiles": [{ "Type": "Video", "Container": "m4v", "MimeType": "video/mp4" }] };
        }

        const trailerurls = await ApiClient.getPlaybackInfo(item.Id, {}, deviceProfile);
        let trailerurl = trailerurls.MediaSources.find(ms => ms.Protocol === "File");

        if (!trailerurl) {
            trailerurl = trailerurls.MediaSources.find(ms => ms.Protocol === "Http");
        }

        if (!trailerurl) {
            console.warn("No valid MediaSource found.");
            return '';
        }


        if (trailerurl.Protocol === "File") {
            /*
            if (OS_current === 'windows') {
                videourl = await ApiClient.getItemDownloadUrl(item.Id, item.MediaSources[0].Id, item.serverId);
            } else {
                videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;
            }
            */
            videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;
            if (videourl.includes('.m3u8') && OS_current === 'windows') {
                //videourl = await ApiClient.getItemDownloadUrl(item.Id, item.MediaSources[0].Id, item.serverId);
                videourl = `${ApiClient._serverAddress}/emby/videos/${item.Id}/original.${item.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${item.MediaSources[0].Id}&PlaySessionId=${trailerurls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;
            }

            //videourl = `${ApiClient._serverAddress}/emby/videos/${item.Id}/original.${item.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${item.MediaSources[0].Id}&PlaySessionId=${trailerurls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;

        } else if (trailerurl.Protocol === "Http") {
            videourl = trailerurl.Path;
        }
        return videourl;
    }

    async function getDeviceProfile(item) {
        const playbackManager = await Emby.importModule("./modules/common/playback/playbackmanager.js");
        const player = playbackManager.getPlayers().find(p => p.id === "htmlvideoplayer");
        //const playbackMediaSources = await playbackManager.getPlaybackMediaSources(item, {});
        return await player.getDeviceProfile(item);
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
        } else if (u.match(/visionos/i)) {
            return 'visionOS'
        } else {
            return 'other'
        }
    }
    
})();
