// emby list page

(function () {
    "use strict";

    var adminUserId = '', getTrailerFromCache = true, videoVolume = 0.5;
    var configLoaded = false;
    var searchPollInterval = null;

    const OS_current = getOS();

    const VISIBLE_SCROLLER = "div[is='emby-scroller']:not(.hide)";
    const selectorStr = ".itemsContainer";

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

    const lptCss = `
.lpt-has-trailer{position:relative;box-shadow:0 0 8px 2px rgba(59,130,246,0.35);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.cardBox:hover .lpt-has-trailer,.lpt-has-trailer:hover{box-shadow:0 0 10px 3px rgba(96,165,250,0.5);transition:box-shadow 0.2s ease-in-out}.lpt-modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.lpt-modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0;transition:opacity 0.3s ease}@media (max-width:768px){.lpt-modal-content{max-width:80%;max-height:80%}}.lpt-modal-closing .lpt-modal-content{animation-name:lptShrinkRotate;animation-duration:0.3s;animation-timing-function:ease-out}.lpt-close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.lpt-close:hover{background-color:rgb(255 255 255 / .3)}@keyframes lptShrinkRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.lpt-modal-caption{position:fixed;bottom:110px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.lpt-modal-caption{bottom:160px}}.lpt-video{position:absolute;width:100%;height:100%;object-fit:contain;z-index:1;pointer-events:auto;transition:opacity 0.5s ease}.cardOverlayContainer>.fab,.cardOverlayContainer>.chkItemSelectContainer,.cardOverlayContainer>.cardOverlayButton-br{z-index:2}.bg-style{background:linear-gradient(to right top,rgb(0 0 0 / .98),rgb(0 0 0 / .2)),url(https://assets.nflxext.com/ffe/siteui/vlv3/058eee37-6c24-403a-95bd-7d85d3260ae1/5030300f-ed0c-473a-9795-a5123d1dd81d/US-en-20240422-POP_SIGNUP_TWO_WEEKS-perspective_WEB_0941c399-f3c4-4352-8c6d-0a3281e37aa0_large.jpg);background-attachment:fixed;background-repeat:no-repeat;background-position:center;background-size:cover}
#lpt-search-links-bar a.code-link{display:inline-block;padding:.25em .75em;border-radius:1.5em;border:1px solid currentColor;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);margin:2px;font-size:.9em;text-decoration:none;cursor:pointer}
#lpt-search-links-bar a.code-link:hover{background:rgba(255,255,255,0.12)}`;

    document.addEventListener("viewbeforeshow", function (e) {
        // Filter specific context paths
        const path = e.detail.contextPath;
        if (!(path.startsWith("/list/") ||
              path.startsWith("/videos?") ||
              (path.startsWith("/tv?") && !path.includes("type=Person")))) {
            return;
        }

        !document.getElementById("lptStyle") && loadExtraStyle(lptCss, 'lptStyle');

        // 清理之前的observer和搜索轮询
        observerManager.cleanup();
        searchPollInterval?.clear();
        searchPollInterval = null;

        clearExpiredCache();
        applyBackgroundStyle();

        const isSearchPage = path.includes('type=search');

        if (isSearchPage) {
            let renderTimer = null;
            let obs = null;
            const onInput = (input) => {
                clearTimeout(renderTimer);
                renderTimer = setTimeout(() => renderSearchLinks(input.value.trim(), input), 1000);
            };
            const selector = `${VISIBLE_SCROLLER} input.searchfields-txtSearch`;
            const bindInput = (input) => input.addEventListener('input', () => onInput(input));
            const existing = document.querySelector(selector);
            if (existing) {
                bindInput(existing);
            } else {
                obs = new MutationObserver(() => {
                    const input = document.querySelector(selector);
                    if (input) { obs.disconnect(); obs = null; bindInput(input); }
                });
                obs.observe(document.body, { childList: true, subtree: true });
            }
            searchPollInterval = { clear() { obs?.disconnect(); clearTimeout(renderTimer); } };
        }

        // iPhone/iPad不启用trailer hover
        if (OS_current === 'iphone' || OS_current === 'ipad') return;

        // 处理可见items的回调
        const processVisibleItems = (itemsContainer) => {
            const children = Array.from(itemsContainer.children);
            const itemSource = itemsContainer._itemSource || itemsContainer.itemParts;

            for (let node of children) {
                if (!node.classList.contains('virtualScrollItem')) continue;

                const item = itemSource?.[node._dataItemIndex];
                if (!item?.Id || item.Type !== 'Movie') continue;
                const itemId = item.Id;

                const imgContainer = node.querySelector('.cardBox .cardImageContainer');
                if (imgContainer?.classList.contains('lpt-has-trailer') ||
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

    function renderSearchLinks(query, inputEl) {
        if (!inputEl) return;

        MOVIE_CODE_PATTERN.lastIndex = 0;
        const match = MOVIE_CODE_PATTERN.exec(query);
        if (!match) {
            document.getElementById('lpt-search-links-bar')?.remove();
            return;
        }
        const code = match[0];

        const anchor = inputEl.closest('.searchFields')
                    ?? inputEl.closest('.searchFieldsInner')
                    ?? inputEl.parentElement;
        if (!anchor) return;

        // 找属于当前 anchor 所在 scroller 的 bar，避免操作隐藏页面的 bar
        let bar = anchor.parentElement?.querySelector('#lpt-search-links-bar')
                ?? document.querySelector(`${VISIBLE_SCROLLER} #lpt-search-links-bar`);
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'lpt-search-links-bar';
            bar.style.cssText = 'white-space:normal;padding:4px 8px;text-align:center;';
            anchor.insertAdjacentElement('afterend', bar);
        }

        const label = document.createElement('span');
        label.textContent = '外部链接: ';
        label.style.cssText = 'font-weight:600;margin-right:4px;color:rgba(255,255,255,0.7);';
        bar.innerHTML = '';
        bar.appendChild(label);

        buildSearchLinks(code).forEach(link => bar.appendChild(link));
    }

    const MOVIE_CODE_PATTERN = /\b((?=[A-Za-z\d]*[A-Za-z])[A-Za-z\d]+-[A-Za-z]?\d{2,5}|[A-Za-z]\d{3,5}|\d{4,}[-_]\d{2,})\b/gi;

    const VR_PREFIXES = new Set(["aquco","aqube","cbikmv","averv","gopj","aqubl","dlvss"]);

    function buildSearchLinks(code) {
        const codeLower = code.toLowerCase();
        const noNumCode = code.replace(/-?\d+$/, '').toUpperCase();
        const noNumLower = noNumCode.toLowerCase();
        const isVR = codeLower.includes('vr') || VR_PREFIXES.has(noNumLower);
        const links = [];

        function mkLink(title, color, url, text) {
            const a = document.createElement('a');
            a.className = 'button-link-color-inherit emby-button code-link';
            a.style.color = color;
            a.target = '_blank';
            a.rel = 'noopener';
            a.title = title;
            a.href = url;
            a.textContent = text;
            return a;
        }

        links.push(mkLink('搜索 javdb.com', 'pink',
            `https://javdb.com/search?q=${code.toUpperCase()}&f=all`, 'javdb'));

        if (isVR) {
            links.push(mkLink('搜索 javbus.com', 'red',
                `https://www.javbus.com/${code}`, 'javbus'));
            links.push(mkLink('搜索 javlibrary.com', 'rgb(191,96,166)',
                `https://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${code}`, 'javlibrary'));
            links.push(mkLink('搜索 jvrlibrary.com', 'lightyellow',
                `https://jvrlibrary.com/jvr?id=${code}`, 'jvrlibrary'));
            links.push(mkLink('搜索 dmm.co.jp (VR)', 'red',
                `https://www.dmm.co.jp/digital/videoa/-/list/search/=/device=vr/?searchstr=${noNumCode}`, 'dmm(VR)'));
        } else {
            links.push(mkLink('搜索 javbus.com', 'red',
                `https://www.javbus.com/${code}`, 'javbus'));
            links.push(mkLink('搜索 javlibrary.com', 'rgb(191,96,166)',
                `https://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${code}`, 'javlibrary'));
            links.push(mkLink('搜索 missav.ws', 'rgb(238,152,215)',
                `https://missav.ws/cn/search/${code}`, 'missav'));
            links.push(mkLink('搜索 dmm.co.jp', 'red',
                `https://www.dmm.co.jp/mono/-/search/=/searchstr=${codeLower}/`, 'dmm'));
        }

        if (/^n\d{4}$/.test(codeLower)) {
            links.push(mkLink('搜索 tokyohot', 'red',
                `https://my.tokyo-hot.com/product/?q=${codeLower}&x=0&y=0`, 'tokyohot'));
        } else if (/^\d+-\d+$/.test(code)) {
            links.push(mkLink('搜索 caribbean', 'green',
                `https://www.caribbeancom.com/moviepages/${codeLower}/index.html`, 'caribbean'));
        } else if (/^\d+_\d+$/.test(code)) {
            links.push(mkLink('搜索 1pondo', 'rgb(230,95,167)',
                `https://www.1pondo.tv/movies/${codeLower}/`, '1pondo'));
        } else if (codeLower.includes('heyzo')) {
            const heyzoNum = code.split('-')[1] ?? code;
            links.push(mkLink('搜索 heyzo', 'pink',
                `https://www.heyzo.com/moviepages/${heyzoNum}/index.html`, 'heyzo'));
        }

        links.push(mkLink('搜索 ave', 'red',
            `https://www.aventertainments.com/ppv/search?lang=2&v=1&culture=ja-JP&keyword=${code}&searchby=keyword`, 'ave'));
        links.push(mkLink('搜索 subtitlecat.com', 'rgb(255,191,54)',
            `https://www.subtitlecat.com/index.php?search=${noNumCode}`, 'subtitlecat'));

        return links;
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

    // 绑定hover事件，懒加载trailer
    function bindTrailerHover(node, itemId) {
        const cardBox = node.querySelector('.cardBox');
        const imgContainer = cardBox?.querySelector('.cardImageContainer');
        if (!imgContainer || imgContainer.classList.contains("lpt-has-trailer")) return;

        const img = imgContainer.querySelector('.cardImage');
        const cardOverlay = cardBox?.querySelector('.cardOverlayContainer');
        if (!img || !cardOverlay) return;

        imgContainer.classList.add('lpt-has-trailer');

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
                    imgContainer.classList.remove('lpt-has-trailer');
                    imgContainer.classList.add('no-trailer');
                    return;
                }
            }

            if (!trailerUrl || !isHovered) return;

            img.style.filter = 'blur(5px)';
            const expandBtn = createExpandBtn();
            let mediaEl;

            const youtubeId = parseYouTubeUrl(trailerUrl);
            if (youtubeId) {
                mediaEl = document.createElement('iframe');
                mediaEl.classList.add('lpt-video');
                mediaEl.style.opacity = '0';
                mediaEl.style.pointerEvents = 'none';
                mediaEl.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
                mediaEl.allow = "autoplay; encrypted-media";
                mediaEl.frameBorder = "0";
                imgContainer.appendChild(mediaEl);
            } else {
                mediaEl = document.createElement('video');
                mediaEl.src = trailerUrl;
                mediaEl.autoplay = true;
                mediaEl.muted = true;
                mediaEl.classList.add('lpt-video');
                mediaEl.style.opacity = '0';
                mediaEl.style.pointerEvents = 'none';
                cardOverlay.appendChild(mediaEl);
            }

            cardOverlay.appendChild(expandBtn);
            if (isHovered) {
                mediaEl.style.opacity = '1';
                setTimeout(() => {
                    if (isHovered) expandBtn.style.opacity = '1';
                }, 300);
            }
        };

        const mouseleaveHandler = () => {
            if (!isHovered) return;
            isHovered = false;
            img.style.filter = '';

            imgContainer.querySelector('iframe.lpt-video')?.remove();
            cardOverlay.querySelectorAll('video.lpt-video').forEach(v => v.remove());
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
             <span class="lpt-close">&#10006;</span>
             <video class="lpt-modal-content" id="modalVideo"></video>
             <iframe class="lpt-modal-content" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" id="modalYT"></iframe>
             <div class="lpt-modal-caption" id="modalVideoCaption">title</div>
        `;

        const modal = document.createElement('div');
        modal.id = 'myVideoModal';
        modal.classList.add('lpt-modal');
        modal.innerHTML = modalHTML;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector(".lpt-close");
        const modalVideo = modal.querySelector("#modalVideo");
        const modalYT = modal.querySelector("#modalYT");
        modalVideo.style.opacity = '0';
        modalYT.style.opacity = '0';

        function closeVideoModal() {
            modal.classList.add("lpt-modal-closing");
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
                modal.classList.remove("lpt-modal-closing");
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
            modalYT.style.width = "100%";
            modalYT.style.height = "100%";
            modalYT.src = getFullscreenYTUrl(videoSrc);
            requestAnimationFrame(() => { modalYT.style.opacity = '1'; });
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
            requestAnimationFrame(() => { modalVideo.style.opacity = '1'; });
        }


        // Show modal
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        modal.classList.remove("lpt-modal-closing");
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

    async function getTrailerUrl(item) {
        try {
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
                videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;
                if (videourl.includes('.m3u8') && OS_current === 'windows') {
                    videourl = `${ApiClient._serverAddress}/emby/videos/${item.Id}/original.${item.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${item.MediaSources[0].Id}&PlaySessionId=${trailerurls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;
                }
            } else if (trailerurl.Protocol === "Http") {
                videourl = trailerurl.Path;
            }
            return videourl;
        } catch (e) {
            console.error('getTrailerUrl failed:', e);
            return '';
        }
    }

    async function getDeviceProfile(item) {
        try {
            const playbackManager = await Emby.importModule("./modules/common/playback/playbackmanager.js");
            const player = playbackManager.getPlayers().find(p => p.id === "htmlvideoplayer");
            return await player.getDeviceProfile(item);
        } catch (e) {
            console.error('getDeviceProfile failed:', e);
            return null;
        }
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
