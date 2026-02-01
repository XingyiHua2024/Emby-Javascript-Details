// emby list page

(function () {
    "use strict";

    var adminUserId = '', getTrailerFromCache = true, videoVolume = 0.5;
    var configLoaded = false;

    const OS_current = getOS();

    var deviceProfile = null;

    // 默认deviceProfile（fallback）
    const DEFAULT_DEVICE_PROFILE = {"MaxStaticBitrate":140000000,"MaxStreamingBitrate":140000000,"MusicStreamingTranscodingBitrate":192000,"DirectPlayProfiles":[{"Container":"mp4,m4v","Type":"Video","VideoCodec":"h264,h265,hevc,av1,vp8,vp9","AudioCodec":"ac3,eac3,mp3,aac,opus,flac,vorbis"},{"Container":"mkv","Type":"Video","VideoCodec":"h264,h265,hevc,av1,vp8,vp9","AudioCodec":"ac3,eac3,mp3,aac,opus,flac,vorbis"},{"Container":"webm","Type":"Video","AudioCodec":"vorbis,opus","VideoCodec":"av1,VP8,VP9"}],"TranscodingProfiles":[{"Container":"m4s,ts","Type":"Video","AudioCodec":"ac3,mp3,aac","VideoCodec":"h264,h265,hevc","Context":"Streaming","Protocol":"hls","MaxAudioChannels":"2","MinSegments":"1","BreakOnNonKeyFrames":true}],"SubtitleProfiles":[{"Format":"vtt","Method":"External"}]};

    // YouTube URL解析工具
    function parseYouTubeUrl(url) {
        if (!url) return null;
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) return null;

        let videoId = null;
        try {
            if (url.includes('watch')) {
                videoId = new URL(url).searchParams.get('v');
            } else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else {
                const parts = url.split('/');
                videoId = parts[parts.length - 1] || parts[parts.length - 2];
            }
        } catch (e) {
            console.warn('Failed to parse YouTube URL:', url);
        }
        return videoId;
    }

    function isYouTubeUrl(url) {
        return url && (url.includes('youtube.com') || url.includes('youtu.be'));
    }

    // Observer管理器：统一管理所有MutationObserver的生命周期
    const observerManager = {
        containerObserver: null,  // 监听itemsContainer变化
        waitObserver: null,       // 等待itemsContainer出现
        debounceTimer: null,

        cleanup() {
            this.containerObserver?.disconnect();
            this.waitObserver?.disconnect();
            clearTimeout(this.debounceTimer);
            this.containerObserver = null;
            this.waitObserver = null;
        },

        setupContainerObserver(itemsContainer, processCallback) {
            if (!itemsContainer) return;

            const DEBOUNCE_DELAY = 300;

            this.containerObserver = new MutationObserver(() => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(processCallback, DEBOUNCE_DELAY);
            });

            this.containerObserver.observe(itemsContainer, {
                childList: true,
                attributes: true,
                subtree: false,
            });

            // 初始执行
            processCallback();
        },

        waitForContainer(root, selector, callback) {
            const container = root?.querySelector(selector);
            if (container) {
                callback(container);
                return;
            }

            this.waitObserver = new MutationObserver(() => {
                const container = root?.querySelector(selector);
                if (container) {
                    this.waitObserver.disconnect();
                    this.waitObserver = null;
                    callback(container);
                }
            });

            this.waitObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }
    };

    // 检测是否为 iPhone
    const isIPhone = /iPhone/i.test(navigator.userAgent);

    // 评分区域优化样式（iPhone 不加载）
    const ratingCss = isIPhone ? '' : `
/* ===== 2. 评分区域优化 ===== */
.starRatingContainer{background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,180,0,0.1))!important;padding:6px 12px!important;border-radius:20px!important;border:1px solid rgba(255,215,0,0.3)!important}.starRatingContainer .starIcon{color:#ffd700!important;text-shadow:0 0 8px rgba(255,215,0,0.5)}.mediaInfoCriticRating{background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(109,40,217,0.1))!important;padding:6px 12px!important;border-radius:20px!important;border:1px solid rgba(139,92,246,0.3)!important}.mediaInfoCriticRatingFresh{filter:drop-shadow(0 0 4px rgba(139,92,246,0.5))}
/* ===== 3. 信息布局优化 ===== */
.detail-mediaInfoPrimary .mediaInfoItem{padding:4px 12px!important;border-radius:15px!important;background:rgba(139,92,246,0.08)!important;margin:3px!important;transition:all 0.2s ease}.detail-mediaInfoPrimary .mediaInfoItem:hover{background:rgba(139,92,246,0.18)!important;transform:scale(1.02)}.detail-mediaInfoPrimary .mediaInfoItem-border{border:1px solid rgba(139,92,246,0.25)!important;background:rgba(139,92,246,0.1)!important}
`;

    const embyDetailCss = `${ratingCss}
/* ===== 原有样式 ===== */
.has-trailer{position:relative;box-shadow:0 0 10px 3px rgb(255 255 255 / .8);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.has-trailer:hover{box-shadow:0 0 10px 3px rgb(255 0 150 / .3);transition:box-shadow 0.2s ease-in-out}.injectJavdb{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.injectJavdb:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.injectJavdb .button-text,.injectJavdb .button-icon{color:pink;transition:color 0.3s,filter 0.3s}.injectJavdb:hover .button-text,.injectJavdb:hover .button-icon{color:black!important}.injectJavbus .button-text,.injectJavbus .button-icon{color:#ff8181!important}.noUncensored{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.noUncensored .button-text,.noUncensored .button-icon{color:grey!important}.melt-away{animation:sandMeltAnimation 1s ease-out forwards}@keyframes sandMeltAnimation{0%{opacity:1}100%{opacity:0}}.my-fanart-image{display:inline-block;margin:8px 10px 20px 10px;vertical-align:top;border-radius:8px;height:27vh;transition:transform 0.3s ease,filter 0.3s ease;min-height:180px}.my-fanart-image-slider{height:20vh!important}.my-fanart-image:hover{transform:scale(1.03);filter:brightness(80%)}.modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0}@media (max-width:768px){.modal-content{max-width:80%;max-height:80%}}.modal-closing .modal-content{animation-name:shrinkAndRotate;animation-duration:0.3s;animation-timing-function:ease-out}.close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.prev,.next{position:absolute;width:40px;height:40px;line-height:40px;justify-content:center;align-items:center;display:flex;top:50%;background-color:rgb(0 0 0 / .5);color:#fff;border:none;cursor:pointer;font-size:35px;font-weight:700;transform:translateY(-50%) translateX(-50%);transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:35px}.prev{left:80px}.next{right:20px}.prev:hover,.next:hover{background-color:rgb(255 255 255 / .3);padding:35px}.close:hover{background-color:rgb(255 255 255 / .3);padding:10px}@keyframes shrinkAndRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.click-smaller{transform:scale(.9) translate(-50%,-50%);transition:transform 0.2s}.prev.disabled,.next.disabled{color:grey!important;cursor:default}@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-10px)}100%{transform:translateX(0)}}.modal-caption{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.modal-caption{bottom:100px}}.video-element{position:absolute;width:100%;height:100%;object-fit:contain;z-index:3;pointer-events:auto;transition:opacity 0.5s ease}.copy-link{color:lightblue;cursor:pointer;display:inline-block;transition:transform 0.1s ease}.copy-link:active{transform:scale(.95)}.media-info-item{display:block;width:100%;margin-top:10px;text-align:left}.media-info-item a{padding:5px 10px;background:rgb(255 255 255 / .15);margin-bottom:5px;margin-right:5px;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);font-weight:600;font-family:'Poppins',sans-serif;transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease;text-decoration:none;color:#fff;border-radius: 20px}.media-info-item a:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.pageButton{cursor:pointer;padding:6px 14px;background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(109,40,217,0.15));border-radius:15px;box-shadow:0 2px 6px rgba(0,0,0,0.2);transition:all 0.3s ease;backdrop-filter:blur(10px);border:1px solid rgba(139,92,246,0.3)}.pageButton:hover{background:linear-gradient(135deg,rgba(139,92,246,0.5),rgba(109,40,217,0.4));box-shadow:0 4px 12px rgba(139,92,246,0.4);transform:scale(1.03)}#pageInput-actorPage::-webkit-inner-spin-button,#pageInput-actorPage::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-actorPage{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:6px 10px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;color:#fff;width:50px;transition:all 0.3s ease}#pageInput-actorPage:focus{outline:none;border-color:rgba(139,92,246,0.6);box-shadow:0 0 8px rgba(139,92,246,0.4)}#filterDropdown{width:auto;backdrop-filter:blur(10px);color:#fff;transition:all 0.3s ease;margin-left:10px;font-family:inherit;padding:6px 12px;font-weight:inherit;line-height:inherit;border:1px solid rgba(139,92,246,0.3);background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(109,40,217,0.15));border-radius:15px}#filterDropdown:hover{background:linear-gradient(135deg,rgba(139,92,246,0.5),rgba(109,40,217,0.4));box-shadow:0 4px 15px rgba(139,92,246,0.4)}#filterDropdown:focus{outline:none;box-shadow:0 0 8px 3px rgba(139,92,246,0.5)}#filterDropdown option{font-family:inherit;color:#000;background:#fff;border:none;padding:5px;font-weight:inherit}#filterDropdown option:hover{background:#c8c8c8}.myCardImage{transition:filter 0.2s ease}.myCardImage:hover{filter:brightness(70%)}#toggleFanart{padding:10px 20px;font-size:18px;background:rgb(255 255 255 / .15);margin-top:15px;margin-bottom:15px;border:none;border-radius:8px;font-weight:700;font-family:'Poppins',sans-serif;color:#fff;text-decoration:none;cursor:pointer;display:block;margin-left:auto;margin-right:auto;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease}#toggleFanart:hover{transform:scale(1.1);background:linear-gradient(135deg,rgb(255 0 150 / .4),rgb(0 150 255 / .4));box-shadow:0 6px 20px rgb(0 0 0 / .3),0 0 15px rgb(0 150 255 / .6);color:#fff}#toggleFanart:active{transform:scale(.95);box-shadow:0 3px 12px rgb(0 0 0 / .3)}.bg-style{background:linear-gradient(to right top,rgb(0 0 0 / .98),rgb(0 0 0 / .2)),url(https://assets.nflxext.com/ffe/siteui/vlv3/058eee37-6c24-403a-95bd-7d85d3260ae1/5030300f-ed0c-473a-9795-a5123d1dd81d/US-en-20240422-POP_SIGNUP_TWO_WEEKS-perspective_WEB_0941c399-f3c4-4352-8c6d-0a3281e37aa0_large.jpg);background-attachment:fixed;background-repeat:no-repeat;background-position:center;background-size:cover}@media (max-width:50em){.swiper-thumbs{display:none!important}}`;

    document.addEventListener("viewbeforeshow", function (e) {
        // Filter specific context paths
        const path = e.detail.contextPath;
        if (!(path.startsWith("/list/") ||
              path.startsWith("/videos?") ||
              (path.startsWith("/tv?") && !path.includes("type=Person")))) {
            return;
        }

        !document.getElementById("embyDetailCss") && loadExtraStyle(embyDetailCss, 'embyDetailCss');

        // 清理之前的observer
        observerManager.cleanup();

        clearExpiredCache();
        applyBackgroundStyle();

        // iPhone/iPad不启用trailer hover
        if (OS_current === 'iphone' || OS_current === 'ipad') return;

        const selectorStr = path.startsWith("/videos?")
            ? `[data-index="1"].itemsTab .virtualItemsContainer`
            : "div[is='emby-scroller']:not(.hide) .virtualItemsContainer";

        // 处理可见items的回调
        const processVisibleItems = (itemsContainer) => {
            const children = Array.from(itemsContainer.children);
            const itemSource = itemsContainer._itemSource || itemsContainer.itemParts;

            for (let node of children) {
                if (!node.classList.contains('virtualScrollItem')) continue;

                const itemId = itemSource?.[node._dataItemIndex]?.Id;
                if (!itemId) continue;

                const imgContainer = node.querySelector('.cardBox .cardImageContainer');
                if (imgContainer?.classList.contains('has-trailer') ||
                    imgContainer?.classList.contains('no-trailer')) continue;

                bindTrailerHover(node, itemId);
            }
        };

        // 设置container观察器
        const onContainerReady = (itemsContainer) => {
            observerManager.setupContainerObserver(
                itemsContainer,
                () => processVisibleItems(itemsContainer)
            );
        };

        if (e.detail.isRestored) {
            // 页面恢复时直接获取container
            const container = e.target?.querySelector(selectorStr);
            if (container) onContainerReady(container);
        } else {
            // 新页面等待container出现
            observerManager.waitForContainer(e.target, selectorStr, onContainerReady);
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
        // 已加载则跳过
        if (configLoaded) return;

        try {
            let config = window.cachedConfig;
            if (!config) {
                const response = await fetch('./config.json');
                if (response.ok) {
                    config = await response.json();
                    window.cachedConfig = config;
                }
            }

            if (config) {
                adminUserId = config.adminUserId || adminUserId;
                // 支持从config加载deviceProfile
                if (config.deviceProfile) {
                    deviceProfile = config.deviceProfile;
                }
            }
        } catch (e) {
            console.warn('Failed to load config:', e);
        }

        configLoaded = true;
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

    // 绑定hover事件，懒加载trailer
    function bindTrailerHover(node, itemId) {
        const cardBox = node.querySelector('.cardBox');
        const imgContainer = cardBox?.querySelector('.cardImageContainer');
        if (!imgContainer || imgContainer.classList.contains("has-trailer")) return;

        const img = imgContainer.querySelector('.cardImage');
        const cardOverlay = cardBox?.querySelector('.cardOverlayContainer');
        if (!img || !cardOverlay) return;

        imgContainer.classList.add('has-trailer');

        let isHovered = false;
        let trailerUrl = null;
        let isLoading = false;

        const mouseenterHandler = async () => {
            if (isHovered) return;
            isHovered = true;

            // 懒加载：hover时才获取trailer URL
            if (!trailerUrl && !isLoading) {
                isLoading = true;
                trailerUrl = await fetchTrailerUrl(itemId);
                isLoading = false;

                if (!trailerUrl) {
                    imgContainer.classList.remove('has-trailer');
                    imgContainer.classList.add('no-trailer');
                    return;
                }
            }

            if (!trailerUrl || !isHovered) return;

            imgContainer.classList.remove('has-trailer');
            const expandBtn = createExpandBtn();

            const youtubeId = parseYouTubeUrl(trailerUrl);
            if (youtubeId) {
                const iframe = document.createElement('iframe');
                iframe.classList.add('video-element');
                iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
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
                if (isHovered) expandBtn.style.opacity = '1';
            }, 300);
        };

        const mouseleaveHandler = () => {
            if (!isHovered) return;
            isHovered = false;

            if (trailerUrl) {
                imgContainer.classList.add('has-trailer');
            }
            img.style.filter = '';

            const iframe = imgContainer.querySelector('iframe.video-element');
            if (iframe) {
                iframe.remove();
            } else {
                cardOverlay.querySelectorAll('video').forEach(v => v.remove());
            }
            cardOverlay.querySelector('.jv-expand-btn')?.remove();
        };

        if (OS_current === 'visionOS') {
            node.addEventListener('focus', mouseenterHandler);
            node.addEventListener('blur', mouseleaveHandler);
        } else {
            node.addEventListener('mouseenter', mouseenterHandler);
            node.addEventListener('mouseleave', mouseleaveHandler);
        }
    }

    // 获取trailer URL（带缓存）
    async function fetchTrailerUrl(itemId) {
        const cacheKey = `trailerUrl_${itemId}`;
        let trailerUrl = getTrailerFromCache ? localStorage.getItem(cacheKey) : null;

        if (trailerUrl && trailerUrl !== 'null') {
            return trailerUrl;
        }

        try {
            const item = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemId);

            if (item.LocalTrailerCount > 0) {
                const localTrailers = await ApiClient.getLocalTrailers(ApiClient.getCurrentUserId(), itemId);
                const trailerItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localTrailers[0].Id);
                trailerUrl = await getTrailerUrl(trailerItem);
            } else if (item.Type === 'Trailer') {
                trailerUrl = await getTrailerUrl(item);
            } else if (item.RemoteTrailers?.length > 0) {
                trailerUrl = item.RemoteTrailers[0].Url;
            }

            if (trailerUrl) {
                try { localStorage.setItem(cacheKey, trailerUrl); } catch (e) {}
                return trailerUrl;
            }
        } catch (e) {
            console.warn("Failed to get trailer:", itemId, e);
        }
        return null;
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
        const isYouTube = isYouTubeUrl(videoSrc);

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
        if (!deviceProfile || Object.keys(deviceProfile).length === 0) {
            deviceProfile = await getDeviceProfile(item);
        }

        if (!deviceProfile || Object.keys(deviceProfile).length === 0) {
            deviceProfile = DEFAULT_DEVICE_PROFILE;
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
