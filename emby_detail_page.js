(async function () {
    "use strict";

    /******************** user config ********************/
    var googleApiKey = ''; //Google API Key
    var nameMap = {};
    var fetchJavDbFlag = true; //enable javdb scrap 
    var getTrailerFromCache = false; //enable reading from cache
    /*****************************************************/

    const show_pages = ["Movie", "Series", "Season", "BoxSet", "Person"];

    const googleTranslateLanguage = 'ja';
    // put language to translate from (ja for Japanese) to Chinese. Leave '' to support any language

    var item, actorName, directorName, viewnode;
    var prefixDic = {};
    //var adminUserId = ''; //Emby User ID

    await loadConfig();

    var isResizeListenerAdded = false, isFanartResizeListenerAdded = false;
    

    const OS_current = getOS();

    const embyDetailCss = `.has-trailer{position:relative;box-shadow:0 0 10px 3px rgb(255 255 255 / .8);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.has-trailer:hover{box-shadow:0 0 10px 3px rgb(255 0 150 / .3);transition:box-shadow 0.2s ease-in-out}.injectJavdb{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.injectJavdb:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.injectJavdb .button-text,.injectJavdb .button-icon{color:pink;transition:color 0.3s,filter 0.3s}.injectJavdb:hover .button-text,.injectJavdb:hover .button-icon{color:black!important}.injectJavbus .button-text,.injectJavbus .button-icon{color:#ff8181!important}.noUncensored{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.noUncensored .button-text,.noUncensored .button-icon{color:grey!important}.melt-away{animation:sandMeltAnimation 1s ease-out forwards}@keyframes sandMeltAnimation{0%{opacity:1}100%{opacity:0}}.my-fanart-image{display:inline-block;margin:8px 10px 8px 10px;vertical-align:top;border-radius:8px;height:27vh;transition:transform 0.3s ease,filter 0.3s ease;min-height:180px}.my-fanart-image-slider{height:20vh!important}.my-fanart-image:hover{transform:scale(1.03);filter:brightness(80%)}.modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0}@media (max-width:768px){.modal-content{max-width:80%;max-height:80%}}.modal-closing .modal-content{animation-name:shrinkAndRotate;animation-duration:0.3s;animation-timing-function:ease-out}.close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.prev,.next{position:absolute;width:40px;height:40px;line-height:40px;justify-content:center;align-items:center;display:flex;top:50%;background-color:rgb(0 0 0 / .5);color:#fff;border:none;cursor:pointer;font-size:35px;font-weight:700;transform:translateY(-50%) translateX(-50%);transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:35px}.prev{left:80px}.next{right:20px}.prev:hover,.next:hover{background-color:rgb(255 255 255 / .3);padding:35px}.close:hover{background-color:rgb(255 255 255 / .3);padding:10px}@keyframes shrinkAndRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.click-smaller{transform:scale(.9) translate(-50%,-50%);transition:transform 0.2s}.prev.disabled,.next.disabled{color:grey!important;cursor:default}@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-10px)}100%{transform:translateX(0)}}.modal-caption{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.modal-caption{bottom:100px}}.video-element{position:absolute;width:100%;height:100%;object-fit:contain;z-index:3;pointer-events:auto;transition:opacity 0.5s ease}.copy-link{color:lightblue;cursor:pointer;display:inline-block;transition:transform 0.1s ease}.copy-link:active{transform:scale(.95)}.media-info-item{display:block;width:100%;margin-top:10px;text-align:left}.media-info-item a{padding:5px 10px;background:rgb(255 255 255 / .15);margin-bottom:5px;margin-right:5px;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);font-weight:600;font-family:'Poppins',sans-serif;transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease;text-decoration:none;color:#fff}.media-info-item a:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.pageButton{cursor:pointer;padding:6px 16px;background:rgb(255 255 255 / 15%);border-radius:5px;box-shadow:0 2px 4px rgb(0 0 0 / .2);transition:background-color 0.3s ease,box-shadow 0.3s ease}.pageButton:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#pageInput-actorPage::-webkit-inner-spin-button,#pageInput-actorPage::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-actorPage{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:5px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit}#filterDropdown{width:auto;backdrop-filter:blur(5px);color:#fff;transition:background-color 0.3s ease,box-shadow 0.3s ease;margin-left:20px;font-family:inherit;padding:6px 16px;font-weight:inherit;line-height:inherit;border:none}#filterDropdown:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#filterDropdown:focus{outline:none;box-shadow:0 0 4px 2px rgb(255 255 255 / .8)}#filterDropdown option{font-family:inherit;color:#000;background:#fff;border:none;padding:5px;font-weight:inherit}#filterDropdown option:hover{background:#c8c8c8}.myCardImage{transition:filter 0.2s ease}.myCardImage:hover{filter:brightness(70%)}#toggleFanart{padding:10px 20px;font-size:18px;background:rgb(255 255 255 / .15);margin-top:15px;margin-bottom:15px;border:none;border-radius:8px;font-weight:700;font-family:'Poppins',sans-serif;color:#fff;text-decoration:none;cursor:pointer;display:block;margin-left:auto;margin-right:auto;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease}#toggleFanart:hover{transform:scale(1.1);background:linear-gradient(135deg,rgb(255 0 150 / .4),rgb(0 150 255 / .4));box-shadow:0 6px 20px rgb(0 0 0 / .3),0 0 15px rgb(0 150 255 / .6);color:#fff}#toggleFanart:active{transform:scale(.95);box-shadow:0 3px 12px rgb(0 0 0 / .3)}.bg-style{background:linear-gradient(to right top,rgb(0 0 0 / .98),rgb(0 0 0 / .2)),url(https://assets.nflxext.com/ffe/siteui/vlv3/058eee37-6c24-403a-95bd-7d85d3260ae1/5030300f-ed0c-473a-9795-a5123d1dd81d/US-en-20240422-POP_SIGNUP_TWO_WEEKS-perspective_WEB_0941c399-f3c4-4352-8c6d-0a3281e37aa0_large.jpg);background-attachment:fixed;background-repeat:no-repeat;background-position:center;background-size:cover}@media (max-width:50em){.swiper-thumbs{display:none!important}}`;

       // monitor dom changements
    document.addEventListener("viewbeforeshow", function (e) {
        if (e.detail.contextPath.startsWith("/item?id=")) {
            if (!e.detail.isRestored) {
                !document.getElementById("embyDetailCss") && loadExtraStyle(embyDetailCss, 'embyDetailCss');
                const mutation = new MutationObserver(function () {
                    viewnode = e.target;
                    item = viewnode.controller?.currentItem;
                    if (item) {
                        mutation.disconnect();
                        if (showFlag()) {

                            if (item.Type === 'BoxSet') {  
                                boxSetInit();
                            } else {
                                init();
                            }
                        }
                    }
                });
                mutation.observe(document.body, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            } else {
                viewnode = e.target;
                item = viewnode.controller.currentItem;
                if (item && showFlag() && item.Type != 'BoxSet' && item.Type != "Person") {
                    actorName = getActorName();
                    directorName = getActorName(true);
                    setTimeout(() => {
                        injectLinks();
                        javdbTitle();
                        adjustCardOffsets();
                        adjustSliderWidth();
                    }, 1000);
                }
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
            //adminUserId = config.adminUserId || adminUserId;
            googleApiKey = config.googleApiKey || googleApiKey;
            nameMap = config.nameMap || nameMap;
            prefixDic = config.prefixDic || prefixDic;
        }
    }

    function loadExtraStyle(content, id) {
        let style = document.createElement("style");
        style.id = id; // Set the ID for the style element
        style.innerHTML = content; // Set the CSS content
        document.head.appendChild(style); // Append the style element to the document head
    }

    async function init() {
        updateSimilarFetch();
        injectLinks();
        javdbTitle();
        //buttonInit();
        reviewButtonInit();

        await previewInject();
        modalInject();

        const excludeIds = await actorMoreInject();
        actorMoreInject(true, excludeIds);

        translateInject();
        javdbButtonInit();
    }

    function boxSetInit() {
        translateInject();
        seriesInject();
        addBoxsetTrailer();
    }


    function showFlag() {
        for (let show_page of show_pages) {
            if (item.Type == show_page) {
                return true;
            }
        }
        return false;
    }

    function isPreferThumb() {
        return !isTouchDevice() && isJP18();
    }

    function updateSimilarFetch() {
        if (item.Type == 'BoxSet' || item.Type == 'Person') return;
        const view = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .similarItemsContainer");
        if (!view) return;

        if (isPreferThumb()) {
            const originalGetListOptions = view.getListOptions;

            view.getListOptions = function (item) {
                const result = originalGetListOptions(item);
                result.options.preferThumb = !0;
                return result;
            };
        }

        if (!isTouchDevice() && item.Type === 'Movie') {

            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && (mutation.addedNodes.length || mutation.removedNodes.length)) {
                        addHoverEffect();
                        (view.children.length == 12) && observer.disconnect(); 
                        /*
                        addHoverEffect();

                        // Create a wrapper function that preserves bound arguments and behavior
                        if (!view._updateElementWrapped) {
                            const originalUpdateElement = view.updateElement;

                            view.updateElement = function (...args) {
                                const result = originalUpdateElement.apply(this, args);

                                addHoverEffect();
                                return result;
                            };

                            view._updateElementWrapped = true; // mark as wrapped
                        }

                        observer.disconnect(); 
                        */

                        break; // Only need to run once per mutation batch
                    }
                }
            });

            observer.observe(view, {
                childList: true,   // Watch for additions
                subtree: false     // Only watch direct children of slider
            });
        }

        view.fetchData = () => {
            const options = {
                    Limit: 50,
                    UserId: ApiClient.getCurrentUserId(),
                    ImageTypeLimit: 1,
                    Fields: "BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,Status,EndDate,LocalTrailerCount,RemoteTrailers",
                    EnableTotalRecordCount: !1
            };

            return ApiClient.getSimilarItems(item.Id, options).then(result => {
                const items = result.Items || [];

                if (items.length > 12) {
                    // Fisher–Yates shuffle
                    for (let i = items.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [items[i], items[j]] = [items[j], items[i]];
                    }

                    // Return 12 random items
                    return {
                        Items: items.slice(0, 12),
                        TotalRecordCount: 12
                    };
                }

                // Return original if 12 or fewer
                return {
                    Items: items,
                    TotalRecordCount: items.length
                };
            });
        };
    }

    function addBoxsetTrailer() {
        if (isTouchDevice()) return
        const targetNode = viewnode; // The parent element to observe

        const observer = new MutationObserver((mutationsList, observer) => {
            const slider = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .linkedItems .itemsContainer");

            if (slider) {
                //console.log("Slider found:", slider);
                observer.disconnect(); // Stop observing once found

                const originalGetListOptions = slider.getListOptions;

                slider.getListOptions = function () {
                    const result = originalGetListOptions();
                    result.options.preferThumb = !0;
                    return result;
                };

                slider.fetchData = () => {
                    const query = {
                        "ParentId": item.Id,
                        "ImageTypeLimit": 1,
                        "Fields": "BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,Status,EndDate,localTrailerCount",
                        "EnableTotalRecordCount": false,
                        "sortBy": "DisplayOrder",
                        "sortOrder": "Ascending",
                        "IncludeItemTypes": "Movie"
                    };

                    return ApiClient.getItems(ApiClient.getCurrentUserId(), query).then(function (result) {
                        for (var i = 0, length = result.Items.length; i < length; i++)
                            result.Items[i].CollectionId = item.Id;
                        return result
                    })
                };

                const observerSlider = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length) {
                            addHoverEffect(slider);
                            observerSlider.disconnect();

                            break; // Only need to run once per mutation batch
                        }
                    }
                });

                observerSlider.observe(slider, {
                    childList: true,   // Watch for additions
                    subtree: false     // Only watch direct children of slider
                });
            }
        });

        // Configure the observer to watch for child elements being added or removed
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }

    function javdbTitle() {
        if (!isJP18() || !fetchJavDbFlag || item.Type == 'BoxSet' || item.Type == 'Person') return

        const detailMainContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailMainContainerParent");

        const titleElement = detailMainContainer.querySelector(".itemName-primary");
        const titleText = titleElement.textContent;
        const code = getPartBefore(titleText, ' ');


        // Create the copy element with the copy-to-clipboard functionality
        const link = createCopyElement(code, '复制番号');

        // Replace the code part in the title with the hyperlink
        const remainingText = titleText.slice(code.length) + ' ';

        // Clear the current content and append the new content
        titleElement.innerHTML = ''; // Clear current content
        titleElement.appendChild(link);
        titleElement.appendChild(document.createTextNode(remainingText));

        function createCopyElement(text, title) {
            const link = document.createElement("a");
            link.textContent = text;
            link.title = title;

            // Add the CSS class to the link element
            link.classList.add('copy-link');

            // Add event listener to copy text to clipboard
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent the default link behavior
                copyTextToClipboard(text); // Copy the text to clipboard
                showToast({
                    text: "番号复制成功",
                    icon: "\uf0c5",
                    secondaryText: text
                });
            });

            return link;
        }

        if (OS_current == 'iphone' || OS_current == 'android') return

        const newLinks = createLinks(code);

        let itemsContainer = detailMainContainer.querySelector(".detailTextContainer .mediaInfoItems:not(.hide)");
        if (itemsContainer) {
            handleMediaInfo(itemsContainer, newLinks);
        } else {
            let playMutation = new MutationObserver((mutations, observer) => {
                let updatedContainer = detailMainContainer.querySelector(".detailTextContainer .mediaInfoItems:not(.hide)");

                if (updatedContainer) {
                    observer.disconnect();
                    handleMediaInfo(updatedContainer, newLinks);
                }
            });

            playMutation.observe(viewnode.querySelector(".detailTextContainer"), {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }

        function handleMediaInfo(container, newLinks) {
            const mediaInfoItem = container.querySelector('.mediaInfoItem[style="white-space:normal;"]');
            if (mediaInfoItem) {
                addNewLinks(mediaInfoItem, newLinks);
                mediaInfoStyle(mediaInfoItem);
                timeLength();
                tagInsert(mediaInfoItem);
                moveTopDown();
            }
        }

        function createLinks(code) {
            const noNumCode = code.replace(/^\d+(?=[A-Za-z])/, '');
            const baseCode = getPartBefore(noNumCode, '-');

            const newLinks = [];

            newLinks.push(createNewLinkElement('搜索 javdb.com', 'pink', getUrl(item.Overview, "===== 外部链接 =====", "JavDb") || `https://javdb.com/search?q=${noNumCode}&f=all`, 'javdb'));
            newLinks.push(createNewLinkElement('搜索 javbus.com', 'red', `https://www.javbus.com/${code}`, 'javbus'));
            newLinks.push(createNewLinkElement('搜索 javlibrary.com', 'rgb(191, 96, 166)', `https://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${code}`, 'javlibrary'));
            newLinks.push(createNewLinkElement('搜索 missav.ws', 'rgb(238, 152, 215)', `https://missav.ws/cn/search/${code}`, 'missav'));


            if (item.Genres.includes("无码")) {
                if (/^n\d{4}$/.test(code)) {
                    newLinks.push(createNewLinkElement('搜索 tokyohot', 'red', 'https://my.tokyo-hot.com/product/?q=' + code.toLowerCase() + '&x=0&y=0', 'tokyohot'));
                } else if (/^\d+-\d+$/.test(code)) {
                    newLinks.push(createNewLinkElement('搜索 caribbean', 'green', 'https://www.caribbeancom.com/moviepages/' + code.toLowerCase() + '/index.html', 'caribbean'));
                } else if (/^\d+_\d+$/.test(code)) {
                    newLinks.push(createNewLinkElement('搜索 1pondo', 'rgb(230, 95, 167)', 'https://www.1pondo.tv/movies/' + code.toLowerCase() + '/', '1pondo'));
                } else if (code.toLowerCase().includes('heyzo')) {
                    const heyzoNum = getPartAfter(code, "-");
                    newLinks.push(createNewLinkElement('搜索 heyzo', 'pink', 'https://www.heyzo.com/moviepages/' + heyzoNum + '/index.html', 'heyzo'));
                } else {
                    newLinks.push(createNewLinkElement('搜索 ave', 'red', 'https://www.aventertainments.com/search_Products.aspx?languageID=1&dept_id=29&keyword=' + code + '&searchby=keyword', 'ave'));
                }

            } else if (item.Genres.includes("VR")) {
                newLinks.push(createNewLinkElement('搜索 dmm.co.jp', 'red', 'https://www.dmm.co.jp/digital/videoa/-/list/search/=/device=vr/?searchstr=' + updateCode(noNumCode), 'dmm'));
                const modifyCode = (noNumCode.startsWith("DSVR") && /^\D+-\d{1,3}$/.test(code)) ? "3" + code : code;
                newLinks.push(createNewLinkElement('搜索 jvrlibrary.com', 'lightyellow', `https://jvrlibrary.com/jvr?id=` + modifyCode, 'jvrlibrary'));
            } else {
                newLinks.push(createNewLinkElement('搜索 tktube.com', 'blue', `https://tktube.com/search/${code.replace(/-/g, "--")}/`, 'tktube'));
                newLinks.push(createNewLinkElement('搜索 7mmtv.sx', 'rgb(225, 125, 190)', `https://7mmtv.sx/zh/searchform_search/all/index.html?search_keyword=${code}&search_type=searchall&op=search`, '7mmtv'));
                newLinks.push(createNewLinkElement('搜索 dmm.co.jp', 'red', 'https://www.dmm.co.jp/mono/-/search/=/searchstr=' + code.toLowerCase() + '/', 'dmm'));
                if (noNumCode != code) {
                    newLinks.push(createNewLinkElement('搜索 mgstage.com', 'red', `https://www.mgstage.com/search/cSearch.php?search_word=${code}&x=0&y=0&search_shop_id=&type=top`, 'prestige'));
                }
                newLinks.push(createNewLinkElement('搜索 javsubtitled.com', 'rgb(149, 221, 49)', 'https://javsubtitled.com/zh/search?keywords=' + code, 'javsubtitled'));
            }

            if (!viewnode.querySelector("div[is='emby-scroller']:not(.hide) .btnPlayTrailer:not(.hide)")) {
                newLinks.push(createNewLinkElement('搜索 javtrailers', 'red', 'https://javtrailers.com/search/' + noNumCode, 'javtrailers'));
            }

            newLinks.push(createNewLinkElement('搜索 subtitlecat.com', 'rgb(255, 191, 54)', `https://www.subtitlecat.com/index.php?search=` + noNumCode, 'subtitlecat'));

            if (!/\d/.test(baseCode)) {
                newLinks.push(createNewLinkElement('javdb 番号', '#ADD8E6', `https://javdb.com/video_codes/${baseCode}`, baseCode));
            }

            return newLinks;
        }

        function moveTopDown() {
            const topMain = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .topDetailsMain");

            if (topMain) {
                // Check if already adjusted
                if (topMain.dataset.movedDown === "true") {
                    return; // Exit if already moved
                }

                const distanceFromTop = topMain.getBoundingClientRect().top + window.scrollY;
                const height = topMain.offsetHeight;
                const moveDownBy = window.innerHeight - height - distanceFromTop;

                topMain.style.paddingTop = `${moveDownBy}px`;

                // Mark as adjusted
                topMain.dataset.movedDown = "true";
            }
        }

        function tagInsert(mediaInfoItem) {
            const tagItems = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .itemTags");
            const tagClones = tagItems.cloneNode(true);
            // Remove the existing classes
            tagClones.className = 'mediaInfoItem';
            tagClones.style.marginTop = '';
            tagClones.style.marginBottom = '';


            // Set the desired inline styles
            //tagClones.style.whiteSpace = 'normal';
            mediaInfoItem.insertAdjacentElement('afterend', tagClones);
            mediaInfoStyle(tagClones);
        }

        function timeLength() {
            // Select all visible div elements with the class "mediaInfoItem" inside a specific container
            const mediaInfoItems = viewnode.querySelectorAll("div[is='emby-scroller']:not(.hide) .mediaInfoItem");

            // Regular expressions to match "xxh xxm", "xxh", and "xxm"
            const timeRegexWithHoursAndMinutes = /\b(\d{1,2})h\s*(\d{1,2})m\b/;
            const timeRegexHoursOnly = /\b(\d{1,2})h\b/;
            const timeRegexMinutesOnly = /\b(\d{1,2})m\b/;

            // Loop through the elements to find the one that matches any of the regex patterns
            mediaInfoItems.forEach((mediaItem) => {
                if (mediaItem.querySelector('a')) {
                    // Skip this mediaItem and continue to the next
                    return;
                }

                const trimmedText = mediaItem.textContent.trim();

                if (trimmedText === 'JP-18+') {
                    mediaItem.style.fontWeight = 'bold';
                    mediaItem.style.fontFamily = "'Georgia', serif";
                } else if (timeRegexWithHoursAndMinutes.test(trimmedText)) {
                    const match = trimmedText.match(timeRegexWithHoursAndMinutes);
                    const hours = match[1];
                    const minutes = match[2];

                    // Change the text to the desired format with hours and minutes
                    mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${hours}小时${minutes}分  •`;
                    //mediaItem.classList.add('mediaInfoItem-border');

                } else if (timeRegexHoursOnly.test(trimmedText)) {
                    const match = trimmedText.match(timeRegexHoursOnly);
                    const hours = match[1];

                    // Change the text to the desired format with only hours
                    mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${hours}小时  •`;
                    //mediaItem.classList.add('mediaInfoItem-border');

                } else if (timeRegexMinutesOnly.test(trimmedText)) {
                    const match = trimmedText.match(timeRegexMinutesOnly);
                    const minutes = match[1];

                    // Change the text to the desired format with only minutes
                    mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${minutes}分  •`;
                    //mediaItem.classList.add('mediaInfoItem-border');
                } else if (['endsAt', 'mediaInfoCriticRating'].some(className => mediaItem.classList.contains(className))) {
                    mediaItem.style.display = 'none';
                } else if (/^\d{4}$/.test(trimmedText)) {
                    let resolutionLabel;

                    if (item.Height >= 4096) {
                        resolutionLabel = "8K";
                    } else if (item.Height >= 2048) {
                        resolutionLabel = "4K";
                    } else if (item.Height >= 1440) {
                        resolutionLabel = "2K";
                    } else if (item.Height >= 1080) {
                        resolutionLabel = "FHD";
                    } else if (item.Height >= 720) {
                        resolutionLabel = "HD";
                    } else {
                        resolutionLabel = item.Height + 'p'; // Default to the height in 'p'
                    }

                    mediaItem.textContent = resolutionLabel;

                    // Apply some font styling to the mediaItem element
                    mediaItem.style.fontFamily = "'Georgia', serif";  // Nicer font family
                    mediaItem.style.fontWeight = "bold";                 // Bold text

                    mediaItem.classList.add('mediaInfoItem-border');

                    let nextSibling = mediaItem.nextElementSibling; // Get the next sibling element

                    if (nextSibling && nextSibling.nextElementSibling) {
                        // Insert mediaItem after its next sibling
                        mediaItem.parentNode.insertBefore(mediaItem, nextSibling.nextElementSibling);
                    } else {
                        // If there's no further sibling, append mediaItem to the end
                        mediaItem.parentNode.appendChild(mediaItem);
                    }

                } else if (mediaItem.classList.contains('starRatingContainer')) {

                    // Extract the rating number
                    let match = trimmedText.match(/\d+(\.\d+)?/);
                    if (match) {
                        let rating = parseFloat(match[0]);

                        // Adjust the rating if it's greater than 5
                        if (rating > 5) {
                            rating = rating / 2;
                        }

                        // Ensure the number of stars does not exceed 5
                        let fullStars = Math.min(Math.floor(rating), 5);

                        // Generate the stars with reduced space
                        let starsHTML = '';
                        for (let i = 0; i < fullStars; i++) {
                            // Apply negative margin-right only to stars that are not the last one
                            let margin = (i < fullStars - 1) ? '-5px' : '0';
                            starsHTML += `<i class="md-icon md-icon-fill starIcon" style="margin-right: ${margin};"></i>`;
                        }

                        // Replace the content with the new format
                        mediaItem.innerHTML = `<span style="font-weight: bold;">评分</span>:${starsHTML} ${rating}分  •`;
                    } else {
                        console.warn('No valid rating number found in the mediaItem.');
                    }
                }
            });
        }

        function updateCode(code) {
            // Convert the code to lowercase
            code = code.toLowerCase();

            // Use a regular expression to match the pattern: "-" followed by digits
            const regex = /-(\d+)/;
            const match = code.match(regex);

            if (match) {
                // Extract the digits after the "-"
                const digits = match[1];

                // Check the number of digits
                if (digits.length === 4) {
                    // If 4 digits, replace "-" with "0"
                    code = code.replace(regex, `0${digits}`);
                } else if (digits.length >= 1 && digits.length <= 3) {
                    // If 1-3 digits, replace "-" with "00"
                    code = code.replace(regex, `00${digits}`);
                }
            }

            return code;
        }
    }


    function mediaInfoStyle(mediaInfoItem) {
        // Apply the CSS class to the mediaInfoItem
        mediaInfoItem.classList.add('media-info-item');
        mediaInfoItem.style.whiteSpace = 'normal';

        // Remove commas before <a> tags
        mediaInfoItem.innerHTML = mediaInfoItem.innerHTML.replace(/,\s*(?=<a)/g, '');

        // Select all <a> elements inside the selected mediaInfoItem
        let links = mediaInfoItem.querySelectorAll('a');

        // Remove any trailing commas from the <a> text
        links.forEach(link => {
            link.textContent = link.textContent.replace(/,$/, '');
            link.classList.remove('button-link', 'button-link-fontweight-inherit', 'nobackdropfilter');
            if (link.style.fontWeight === 'inherit') {
                link.style.fontWeight = '';
            }
            //link.removeAttribute('style');
        });
    }


    function addNewLinks(mediaInfoItem, newLinks) {
        if (item.Type == 'BoxSet') return;
        newLinks.forEach((link, index) => {
            mediaInfoItem.appendChild(document.createTextNode(', '));
            mediaInfoItem.appendChild(link);
        });
    }

    function createNewLinkElement(title, color, url, text) {
        if (item.Type == 'BoxSet') return null;
        const newLink = document.createElement('a');
        //newLink.className = 'button-link button-link-color-inherit emby-button';
        newLink.className = 'button-link-color-inherit emby-button';
        newLink.style.fontWeight = 'inherit';
        newLink.classList.add('code-link');
        newLink.target = '_blank';
        newLink.title = title;
        newLink.style.color = color;
        newLink.href = url;
        newLink.textContent = text;
        return newLink;
    }

    function createButtonHtml(id, title, icon, text, includeText = true) {
        return `
            <button id="${id}" is="emby-button" type="button" class="detailButton raised emby-button detailButton-stacked" title="${title}">              
                <i class="md-icon button-icon button-icon-left">${icon}</i>
                ${includeText ? `<span class="button-text">${text}</span>` : ''}
            </button>
        `;
    }

    function buttonInit() {
        //removeExisting('embyCopyUrl');
        if (OS_current != 'windows' || item.Type == 'Person') return;
        const itemPath = translatePath(item.Path);
        const itemFolderPath = itemPath.substring(0, itemPath.lastIndexOf('\\'));

        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");

        const buttonhtml = createButtonHtml('embyCopyUrl', `复制所在文件夹路径: ${itemFolderPath}`, `<span class="material-symbols-outlined">folder_copy</span>`, '复制路径');
        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        viewnode.querySelector("div[is='emby-scroller']:not(.hide) #embyCopyUrl").onclick = embyCopyUrl;

        async function embyCopyUrl() {
            const itemPath = translatePath(item.Path);
            const folderPath = itemPath.substring(0, itemPath.lastIndexOf('\\'));
            copyTextToClipboard(folderPath);
            const buttonTextElement = this.querySelector('.button-text');
            const originalColor = buttonTextElement.style.color;
            buttonTextElement.style.color = 'green';
            setTimeout(() => {
                buttonTextElement.style.color = originalColor;
            }, 1000);
            showToast({
                text: "路径复制成功",
                icon: "\uf0c5",
                secondaryText: itemFolderPath
            });
        }
    }

    function javdbButtonInit() {
        if (!isJP18() || !fetchJavDbFlag || item.Type == 'Person') return;

        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");

        const iconJavDb = `<svg width="70.5" height="24" viewBox="0 0 326 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="166" y="11" width="160" height="93" fill="#2F80ED"></rect>
                        <path d="M196.781 27.0078H213.41C217.736 27.0078 221.445 27.4089 224.539 28.2109C227.633 29.013 230.44 30.5169 232.961 32.7227C239.521 38.3372 242.801 46.8737 242.801 58.332C242.801 62.1133 242.471 65.5651 241.812 68.6875C241.154 71.8099 240.137 74.6315 238.762 77.1523C237.387 79.6445 235.625 81.8789 233.477 83.8555C231.786 85.3737 229.939 86.5911 227.934 87.5078C225.928 88.4245 223.766 89.069 221.445 89.4414C219.154 89.8138 216.561 90 213.668 90H197.039C194.719 90 192.971 89.6562 191.797 88.9688C190.622 88.2526 189.849 87.2643 189.477 86.0039C189.133 84.7148 188.961 83.0534 188.961 81.0195V34.8281C188.961 32.0781 189.577 30.0872 190.809 28.8555C192.04 27.6237 194.031 27.0078 196.781 27.0078ZM201.723 37.1055V79.8594H211.391C213.51 79.8594 215.172 79.8021 216.375 79.6875C217.578 79.5729 218.824 79.2865 220.113 78.8281C221.402 78.3698 222.52 77.7253 223.465 76.8945C227.733 73.2852 229.867 67.069 229.867 58.2461C229.867 52.0299 228.922 47.375 227.031 44.2812C225.169 41.1875 222.863 39.2253 220.113 38.3945C217.363 37.5352 214.04 37.1055 210.145 37.1055H201.723ZM280.914 90H261.664C258.885 90 256.895 89.3841 255.691 88.1523C254.517 86.8919 253.93 84.901 253.93 82.1797V34.8281C253.93 32.0495 254.531 30.0586 255.734 28.8555C256.966 27.6237 258.943 27.0078 261.664 27.0078H282.074C285.082 27.0078 287.689 27.194 289.895 27.5664C292.1 27.9388 294.077 28.6549 295.824 29.7148C297.314 30.6029 298.632 31.7344 299.777 33.1094C300.923 34.4557 301.797 35.9596 302.398 37.6211C303 39.2539 303.301 40.987 303.301 42.8203C303.301 49.1224 300.15 53.7344 293.848 56.6562C302.126 59.2917 306.266 64.4193 306.266 72.0391C306.266 75.5625 305.363 78.7422 303.559 81.5781C301.754 84.3854 299.319 86.4622 296.254 87.8086C294.335 88.6107 292.129 89.1836 289.637 89.5273C287.145 89.8424 284.237 90 280.914 90ZM279.969 62.0273H266.691V80.418H280.398C289.021 80.418 293.332 77.3099 293.332 71.0938C293.332 67.9141 292.215 65.6081 289.98 64.1758C287.746 62.7435 284.409 62.0273 279.969 62.0273ZM266.691 36.5898V52.875H278.379C281.559 52.875 284.008 52.5742 285.727 51.9727C287.474 51.3711 288.806 50.2253 289.723 48.5352C290.439 47.332 290.797 45.9857 290.797 44.4961C290.797 41.3164 289.665 39.2109 287.402 38.1797C285.139 37.1198 281.688 36.5898 277.047 36.5898H266.691Z" fill="white"></path>
                        <path d="M47.4375 29.5469V65.5469C47.4375 68.6719 47.2969 71.3281 47.0156 73.5156C46.7656 75.7031 46.1719 77.9219 45.2344 80.1719C43.6719 83.9531 41.0938 86.9062 37.5 89.0312C33.9062 91.125 29.5312 92.1719 24.375 92.1719C19.7188 92.1719 15.8281 91.4375 12.7031 89.9688C9.60938 88.5 7.10938 86.125 5.20312 82.8438C4.20312 81.0938 3.39062 79.0781 2.76562 76.7969C2.14062 74.5156 1.82812 72.3438 1.82812 70.2812C1.82812 68.0938 2.4375 66.4219 3.65625 65.2656C4.875 64.1094 6.4375 63.5312 8.34375 63.5312C10.1875 63.5312 11.5781 64.0625 12.5156 65.125C13.4531 66.1875 14.1719 67.8438 14.6719 70.0938C15.2031 72.5 15.7344 74.4219 16.2656 75.8594C16.7969 77.2969 17.6875 78.5312 18.9375 79.5625C20.1875 80.5938 21.9688 81.1094 24.2812 81.1094C30.4375 81.1094 33.5156 76.5938 33.5156 67.5625V29.5469C33.5156 26.7344 34.125 24.625 35.3438 23.2188C36.5938 21.8125 38.2812 21.1094 40.4062 21.1094C42.5625 21.1094 44.2656 21.8125 45.5156 23.2188C46.7969 24.625 47.4375 26.7344 47.4375 29.5469ZM93.9844 84.9531C90.8906 87.3594 87.8906 89.1719 84.9844 90.3906C82.1094 91.5781 78.875 92.1719 75.2812 92.1719C72 92.1719 69.1094 91.5312 66.6094 90.25C64.1406 88.9375 62.2344 87.1719 60.8906 84.9531C59.5469 82.7344 58.875 80.3281 58.875 77.7344C58.875 74.2344 59.9844 71.25 62.2031 68.7812C64.4219 66.3125 67.4688 64.6562 71.3438 63.8125C72.1562 63.625 74.1719 63.2031 77.3906 62.5469C80.6094 61.8906 83.3594 61.2969 85.6406 60.7656C87.9531 60.2031 90.4531 59.5312 93.1406 58.75C92.9844 55.375 92.2969 52.9062 91.0781 51.3438C89.8906 49.75 87.4062 48.9531 83.625 48.9531C80.375 48.9531 77.9219 49.4062 76.2656 50.3125C74.6406 51.2188 73.2344 52.5781 72.0469 54.3906C70.8906 56.2031 70.0625 57.4062 69.5625 58C69.0938 58.5625 68.0625 58.8438 66.4688 58.8438C65.0312 58.8438 63.7812 58.3906 62.7188 57.4844C61.6875 56.5469 61.1719 55.3594 61.1719 53.9219C61.1719 51.6719 61.9688 49.4844 63.5625 47.3594C65.1562 45.2344 67.6406 43.4844 71.0156 42.1094C74.3906 40.7344 78.5938 40.0469 83.625 40.0469C89.25 40.0469 93.6719 40.7188 96.8906 42.0625C100.109 43.375 102.375 45.4688 103.688 48.3438C105.031 51.2188 105.703 55.0312 105.703 59.7812C105.703 62.7812 105.688 65.3281 105.656 67.4219C105.656 69.5156 105.641 71.8438 105.609 74.4062C105.609 76.8125 106 79.3281 106.781 81.9531C107.594 84.5469 108 86.2188 108 86.9688C108 88.2812 107.375 89.4844 106.125 90.5781C104.906 91.6406 103.516 92.1719 101.953 92.1719C100.641 92.1719 99.3438 91.5625 98.0625 90.3438C96.7812 89.0938 95.4219 87.2969 93.9844 84.9531ZM93.1406 66.4375C91.2656 67.125 88.5312 67.8594 84.9375 68.6406C81.375 69.3906 78.9062 69.9531 77.5312 70.3281C76.1562 70.6719 74.8438 71.375 73.5938 72.4375C72.3438 73.4688 71.7188 74.9219 71.7188 76.7969C71.7188 78.7344 72.4531 80.3906 73.9219 81.7656C75.3906 83.1094 77.3125 83.7812 79.6875 83.7812C82.2188 83.7812 84.5469 83.2344 86.6719 82.1406C88.8281 81.0156 90.4062 79.5781 91.4062 77.8281C92.5625 75.8906 93.1406 72.7031 93.1406 68.2656V66.4375ZM125.344 48.1094L135.703 77.1719L146.859 46.8438C147.734 44.4062 148.594 42.6875 149.438 41.6875C150.281 40.6562 151.562 40.1406 153.281 40.1406C154.906 40.1406 156.281 40.6875 157.406 41.7812C158.562 42.875 159.141 44.1406 159.141 45.5781C159.141 46.1406 159.031 46.7969 158.812 47.5469C158.625 48.2969 158.391 49 158.109 49.6562C157.859 50.3125 157.562 51.0625 157.219 51.9062L144.938 82.375C144.594 83.25 144.141 84.3594 143.578 85.7031C143.047 87.0469 142.438 88.2031 141.75 89.1719C141.094 90.1094 140.266 90.8438 139.266 91.375C138.297 91.9062 137.109 92.1719 135.703 92.1719C133.891 92.1719 132.438 91.7656 131.344 90.9531C130.281 90.1094 129.484 89.2031 128.953 88.2344C128.453 87.2344 127.594 85.2812 126.375 82.375L114.188 52.2344C113.906 51.4844 113.609 50.7344 113.297 49.9844C113.016 49.2344 112.766 48.4688 112.547 47.6875C112.359 46.9062 112.266 46.2344 112.266 45.6719C112.266 44.7969 112.531 43.9375 113.062 43.0938C113.594 42.2188 114.328 41.5156 115.266 40.9844C116.203 40.4219 117.219 40.1406 118.312 40.1406C120.438 40.1406 121.891 40.75 122.672 41.9688C123.484 43.1875 124.375 45.2344 125.344 48.1094Z" fill="currentColor"></path>
                        </svg>`;

        const buttonhtml = createButtonHtml('injectJavdb', '加载javdb.com数据', iconJavDb, '', false);

        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        const javInjectButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #injectJavdb");
        //javInjectButton.classList.add('injectJavdb');

        javInjectButton.addEventListener('click', async () => {
            showToast({
                text: 'javdb资源=>搜索中。。。',
                icon: `<span class="material-symbols-outlined">mystery</span>`
            });
            javInjectButton.style.color = 'green';
            javInjectButton.classList.add('melt-away');
            setTimeout(() => {
                javInjectButton.style.display = 'none';
            }, 1000);

            await javdbActorInject();
            await javdbActorInject(true);
            seriesInject();
        });
    }

    async function reviewButtonInit() {
        if (!isJP18() || !fetchJavDbFlag || item.Type === 'Person') return;

        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");

        const iconJavDB = `<img height="24" src="data:image/x-icon;base64,AAABAAMAEBAAAAEAIABoBAAANgAAACAgAAABACAAKBEAAJ4EAAAwMAAAAQAgAGgmAADGFQAAKAAAABAAAAAgAAAAAQAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHYA7Rx1AOS8cgDj+HAA4/tuAOL7awDe+2cA2PtlAdH7ZAHN+2QBzftkAc37ZAHN+2QBzftkAc74YwHMvmMAzh97AOi5eADm/3UA5f9yAOT/cADi/24A4f9rAN//ZwHZ/2UC0v9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9jAcy+fgDp83sA6P94AOf/dQDl/3QE4/+TR+L/nlzi/55h4f+cYd7/mF3Z/4tI0/9lBcz/ZALN/2QCzf9kAs3/ZAHO+IIA6vZ/AOn/fADo/3kA5/+paOf/3s7u/7N96f/Vvuz/0Ljr/7F/5//czu3/o2/a/2QCzf9kAs3/ZALN/2QBzfuFAOz2ggDr/4AA6f98AOj/tXnq/9S86/+vd+X/1L3q/8+26f+rd+T/0bzp/7WN4/9lAs//ZALN/2QCzf9kAc37iQDt9oYA7P+DAOv/gADq/7Z56v/Qsez/oVPp/82u7P/Hpev/nFPm/8yv6/+1ieb/ZgHY/2UC0f9kAs3/ZAHN+4sA7vaJAO3/rFzp/8if6f+3fef/5t7u/8ur6f/f0ez/3M3s/8ip5//l3e3/qXLj/6x64/+IPtr/ZQLS/2UBzfuOAO/2jADu/5Yf7f/Fje7/6+Xw/82s6f+XOOf/uIHn/7N75/+OM+X/v5nm/+3r7//YxO3/kUTj/2gA2v9mAdP7kADv9o4A7/+MAO7/igDu/48T7P/Fke7/4dLt/9K06//Nrer/3czs/8ih7P+LMOb/cADj/24A4v9tAOD/aQDb+5AA7/aQAPD/nSft/8WQ6v/DjOr/v4fq/9vG7P/x8fH/8fHx/9a/6v+5h+f/u4zn/7yQ5v+ILuP/bwDi/20A4fuQAO/2kADw/5kZ7/+4aO//t2ju/+TW7v/Tru//1bXu/9Kw7f/Opu3/4dPt/61n6v+saOr/ghzl/3EA4/9wAOP7kADv9pAA8P+QAPD/kQTu/6pN6f/l2u7/mSro/8aU6//Ah+v/jRjq/+zn8P+JGuf/egDn/3cA5v91AOX/cgDk+5AA7/aQAPD/kADw/6Mz7v/l1PD/59vw/+rj8P/v7vH/7uvv/+HU6//Xv+r/q2Do/34A6f97AOj/eADm/3UA5vuQAPDzkADw/5AA8P+QAPD/kADw/5AA8P+PAO//jgHu/5IP7f+aJ+3/pkbt/5ox7P+BAOr/fgDp/3sA6P94AOb4kADwt5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+OAO//jADv/4oA7v+IAO3/hQDs/4IA6/9/AOn/ewDovJMA9RqQAPC3kADw85AA7/aQAO/2kADv9pAA7/aQAO/2kADv9o8A7/aNAO72iwDt9ogA7faFAOzzggDquYAA7RwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAACAAAABAAAAAAQAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdQDnP3MA5LNyAOTrcQDj928A4/duAOL3bQDh92wA4fdqAN/3aADc92YA2PdlAdX3ZQHR92QBzvdkAc33ZAHN92QBzfdkAc33ZAHN92QBzfdkAc33ZAHN92QBzfdkAc33ZAHN92QBzO1jAc22YgDLRAAAAAAAAAAAAAAAAHcA5nJ1AOX+dQDl/3MA5P9yAOT/cQDj/3AA4v9vAOL/bgDh/20A4P9rAN//aQDc/2cB2P9mAdX/ZQLR/2QCzv9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3+ZALNewAAAAB5AOk7eQDn/XgA5v92AOb/dQDl/3MA5P9yAOT/cQDj/3AA4v9vAOL/bgDh/20A4f9sAOD/aQDd/2cB2f9mAdX/ZQLS/2UCzv9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3+YgDORH0A6ax7AOj/eQDn/3gA5v92AOb/dQDl/3QA5f9yAOT/cQDj/3AA4/9vAOL/bgDh/20A4f9sAOD/aQDe/2cB2v9mAdb/ZQLS/2UCz/9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9jAc22fgDp430A6P97AOj/egDn/3gA5/93AOb/dQDl/3QA5f9zAOT/cQDj/3AA4/9vAOL/bgDh/20A4P9sAN//aQDd/2cA2f9lAdX/ZQLS/2QCz/9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QBzO2AAOvtfgDp/30A6f97AOj/egDn/3gA5/93AOb/dgDl/3QA5f94D9//q3fg/8Sn4//MteT/0L3l/9LB5f/SwuX/0sLl/9HB5P/PveL/yrXg/8Kp3v+jddX/aA3K/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZAHN94IA6+2AAOr/fwDp/30A6f98AOj/egDn/3kA5/93AOb/dQDl/8yx5//x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/Js+H/YwLM/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAc33gwDs7YIA6/+AAOr/fwDp/30A6f98AOj/egDo/3kA5/91AOL/7+7w//Hx8f+nZ+b/ehDj/3ID4f+AJt7/8fHx//Hx8f9vDNv/bwje/3IS3f+fZuD/8fHx//Hx8f9uF8z/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QBzfeFAO3thADr/4IA6/+BAOr/gADp/34A6f98AOj/ewDo/3cA4v/x8PH/8fHx/38g2v9vANv/bgDb/30k2P/x8fH/8fHx/2wJ1P9oANj/ZwDX/3Ue1P/x8fH/8fHx/3gn0v9lAs//ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZAHN94YA7e2FAOz/hADr/4IA6/+BAOr/gADq/34A6f99AOj/egTj//Hx8f/x8fH/8O/w/+/v8P/v7/D/8O/w//Hx8f/x8fH/7+/w/+/v8P/v7/D/7+/w//Hx8f/x8fH/fCvX/2UC0/9lAs//ZALN/2QCzf9kAs3/ZALN/2QCzf9kAc33iQDu7YcA7P+GAOz/hADr/4MA6/+BAOr/gADq/34A6f97A+P/8fHx//Hx8f/Qs+v/yqfs/8qn6//Psuv/8fHx//Hx8f/Jqur/yKfr/8in6v/Nser/8fHx//Hx8f97Jtr/ZgHX/2UB1P9lAtD/ZALO/2QCzf9kAs3/ZALN/2QBzfeKAO7tiQDt/4cA7f+GAOz/hADs/4MA6/+CAOr/gADq/3wA5f/w7/D/8fHx/44v4/95AOf/dwDm/4Uk4v/x8fH/8fHx/3MJ3/9xAOP/cADi/4Ip3//x8fH/8fHx/3gb3f9oANz/ZgHY/2UB1P9lAtH/ZALO/2QCzf9kAs3/ZAHN94wA7+2KAO7/iQDt/4cA7f+FAOr/rGbj/7R44/+MI+H/fwDn/+Xa7v/x8fH/y63n/6ho4f+jYeD/qXDf//Hx8f/x8fH/nmDc/5xb3v+iZt7/xafk//Hx8f/t6/D/bwje/2oB2/96KNb/bA/U/2YB1f9lAtH/ZALO/2QCzf9kAc33jQDv7YsA7v+KAO7/iQDt/5AZ6P/x8fH/8fHx//Dv8P/Ho+X/snjh/+zo8P/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/7uzw/6Zv4P+iaN7/3NDp//Hx8f/i2uv/bA7W/2YB1v9lAtL/ZQLP/2QBzfeOAO/tjQDv/4wA7v+KAO7/iQDt/7x77P/p4PD/8fHx//Hx8f/v7fD/wpvj/6FQ5P+iTOr/pFXq/6ZZ6P+9lOH/uIzh/6Ra6P+hV+j/m03n/5RG4v+ncd7/4djr//Hx8f/x8fH/8fHx/+rl7/90FN3/aAHa/2YB1v9lAtP/ZQHQ948A8O2OAO//jQDv/4wA7v+LAO7/iQDt/4sI7P+uWuz/3cbu//Hx8f/x8fH/4dbs/5hA4f9+AOj/jCXk//Hx8f/w7/D/gBbi/3cA5v+FJ97/0bvn//Hx8f/x8fH/8fHx/9fC7P+obef/ehjh/2wA4P9qAN7/aADb/2YB1/9lAdT3kADw7Y8A8P+OAO//jQDv/4wA7v+LAO7/igDu/4gA7f+HAez/p03r/+DO7//x8fH/8O/w/7N74/+QL+L/8fHx//Hx8f+FHuH/p2jg/+zq7//x8fH/7erw/76S6v+ILeT/cADj/28A4v9uAOL/bQDh/20A4P9rAN//aADc/2YA2PeQAPDtkADw/48A8P+OAO//jQDv/4wA7v+LAO7/igDu/4kA7f+HAO3/iAfr/7x97P/v7vH/8fHx/9bB5//x8fH/8fHx/8615f/x8fH/7+7x/7+R6v+CGeX/dQDl/3MA5P9yAOT/cQDj/3AA4v9vAOL/bgDh/20A4f9rAN//aQDd95AA8O2QAPD/kADw/48A8P+OAO//jgjq/5ox5P+YLuT/lyzk/5Ik4/+PH+P/jRzj/6JR4P/p5O3/8fHx//Hx8f/x8fH/8fHx/+DU6v+XSN3/gh3f/4If3f+DJN3/hyzd/4Yu3P+HMtz/dQ3e/3AA4/9vAOL/bgDh/20A4f9rAOD3kADw7ZAA8P+QAPD/kADw/48A8P/Ilur/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/KrOf/cQDj/3AA4/9vAOL/bgDh/20A4feQAPDtkADw/5AA8P+QAPD/kADw/7Vj7f/i0O//49Hv/+LQ7//hzu//49Xt//Hx8f/x8fH/4tHv/97J7v/x8fH/8fHx/9zG7f/gz+7/8fHx//Hx8f/i1e3/387u/+DQ7v/g0e7/4NHu/6xw5/9zAOT/cQDj/3AA4/9vAOL/bgDi95AA8O2QAPD/kADw/5AA8P+QAPD/kADw/48A8P+OAO//jQDu/4wC7P/Koej/8fHx/+rj8P+QFev/linp//Hx8f/x8fH/ihfm/4QI6f/i0u7/8fHx/8CV5f97AOb/egDn/3gA5v93AOX/dgDl/3QA5f9zAOT/cgDk/3EA4/9vAOP3kADw7ZAA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+PAPD/smLp//Hx8f/w8PH/q1Lr/4oA7v+ZLen/8fHx//Hx8f+PHOj/gwDr/6la6v/x8fH/8fHx/5Q45P98AOj/egDn/3kA5/93AOb/dgDm/3UA5f9zAOT/cgDk/3EA4/eQAPDtkADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kxHq/61X5v+6feT/8O/w/8WX5f+aMeT/lCTk/55A4v/x8fH/8fHx/48e5P+EAOr/hAXp/+HS7v/s6PD/lTLo/34A6f98AOj/ewDo/3kA5/94AOb/dgDm/3UA5f9zAOT/cwDk95AA8O2QAPD/kADw/5AA8P+QAPD/kADw/5AA8P/Fj+v/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f/x8fH/5Nrr/9fC5//Mq+X/w5vj/7aB4v+dSuL/fwHn/34A6f98AOj/ewDo/3kA5/94AOb/dgDm/3UA5f90AOX3kADw7ZAA8P+QAPD/kADw/5AA8P+QAPD/kADw/6Y87v/Xs+//273v/93B7//fyO//4tDv/+ba7//s5vD/8PDx//Hx8f/x8fH/8fHx//Hx8f/x8fH/8fHx//Hx8f+eRub/gADq/34A6f99AOj/ewDo/3oA5/94AOf/dwDm/3YA5feQAPDtkADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+PAO//jgDv/40A7v+OBO3/kxTt/5so7P+kQO3/r1zs/7x77f/Ln+3/0Krt/40Z6v+BAOr/gADq/34A6f99AOn/ewDo/3oA5/94AOf/dwDm95AA7+KQAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/jwDw/44A7/+NAO//jADu/4sA7v+KAO7/iQDt/4cA7f+GAOz/hQDs/4MA6/+CAOr/gADq/38A6f99AOn/fADo/3oA5/94AOfrjwDwqZAA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/jwDw/44A7/+NAO//jADv/4sA7v+KAO7/iQDt/4gA7f+GAOz/hQDs/4MA6/+CAOv/gADq/38A6f99AOn/fADo/3sA6LOQAOw3kADw/JAA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/jwDw/44A7/+NAO//jQDv/4sA7v+KAO7/iQDt/4gA7f+GAOz/hQDs/4QA6/+CAOv/gQDq/38A6f99AOn+eQDrPwAAAACPAPBpkADw/JAA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/kADw/5AA8P+QAPD/jwDw/48A7/+OAO//jQDv/4wA7v+LAO7/iQDt/4gA7f+HAOz/hQDs/4QA6/+CAOv/gQDr/YAA63IAAAAAAAAAAAAAAACQAOw3jwDwqZAA7+KQAPDtkADw7ZAA8O2QAPDtkADw7ZAA8O2QAPDtkADw7ZAA8O2QAPDtkADw7ZAA8O2QAPDtjwDw7Y8A8O2OAO/tjQDv7YwA7+2LAO7tigDu7YkA7u2GAO3thgDs44QA6qyCAOk7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAADAAAABgAAAAAQAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHYA6w10AONAcwDkl3EA4tZxAOPvcADk8nAA4/JvAOPybgDh8m4A4fJtAOHyawDg8moA3/JpAN3yZwDb8mYA2PJmAdXyZQHT8mUB0fJlAdDyZAHN8mQBzfJkAc3yZAHN8mQBzfJkAc3yZAHN8mQBzfJkAc3yZAHN8mQBzfJkAc3yZAHN8mQBzfJkAc3yZAHN8mQBzfJkAc3wYwHM2GQCzJxlAM5EZgDMDwAAAAAAAAAAAAAAAAAAAAAAAAAAdwDnK3UA5aR0AOXxdADk/3IA5P9yAOT/cQDj/3AA4/9wAOL/bwDi/24A4f9tAOH/bQDg/2wA4P9rAN//aQDd/2gB2/9mAdj/ZgHV/2UC0/9lAtH/ZQLP/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3zZALNqWMA0DEAAAAAAAAAAAAAAAB5AOcqeADmzHYA5v51AOX/dQDl/3QA5f9zAOT/cgDk/3EA4/9wAOP/cADi/28A4v9uAOH/bgDh/20A4f9sAOD/bADg/2oA3f9oAdv/ZwHZ/2YB1v9lAtT/ZQLR/2UCz/9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzdJjANAxAAAAAIAA6gx5AOegeADn/ngA5v93AOb/dgDl/3UA5f90AOT/cwDk/3IA5P9yAOP/cADj/3AA4v9vAOL/bgDi/24A4f9tAOH/bADg/2wA4P9qAN7/aADc/2cB2f9mAdb/ZQHU/2UC0f9lAs//ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs2pZgDMD3sA6Tp7AOjvegDn/3kA5/94AOb/dwDm/3YA5f91AOX/dADk/3MA5P9yAOT/cgDj/3EA4/9wAOP/bwDi/24A4v9uAOH/bQDh/20A4P9sAOD/agDe/2gA3P9nAdn/ZgHX/2UB1f9lAtL/ZQLQ/2QCzv9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs7zZQDORHwA6Yx8AOj/ewDo/3oA5/95AOf/eADm/3cA5v92AOb/dQDl/3UA5f9zAOT/cwDk/3IA5P9xAOP/cADj/3AA4v9vAOL/bgDh/24A4f9tAOD/bADg/2oA3/9pAN3/ZwHa/2cB1/9mAdX/ZQLT/2UC0P9kAs7/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALMnH4A6ch9AOj/fADo/3sA6P96AOf/eQDn/3gA5/93AOb/dgDm/3UA5f91AOX/cwDk/3MA5P9yAOP/cQDj/3AA4/9wAOL/bwDi/24A4f9tAOH/bQDg/2wA4P9rAN//aQDc/2gB2v9mAdf/ZgHV/2UC0/9lAtD/ZALO/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/YwHM2IAA6t9+AOn/fgDo/3wA6P97AOj/ewDn/3kA5/94AOf/eADm/3YA5v91AOX/dQDl/3MA5P9zAOT/cgDj/3AD3f97Htr/hTPb/4k72/+MQdz/jkbc/5BI3P+PSdv/j0nb/41J2f+MSdf/i0nW/4lG1P+GQtH/gjzP/341zf9xIMn/YwXI/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZAHN8IEA6uJ/AOr/fwDp/34A6f98AOj/fADo/3sA6P95AOf/eQDn/3gA5v92AOb/dgDl/3UA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" />`;

        const buttonhtml = createButtonHtml('injectReviews', '加载javdb.com短评', iconJavDB, '短评');

        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        const reviewButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #injectReviews");

        reviewButton.addEventListener('click', handleReviewButtonClick);

        async function handleReviewButtonClick() {
            showToast({
                text: 'javdb短评=>搜索中。。。',
                icon: `<span class="material-symbols-outlined">mystery</span>`
            });
            const reviewButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #injectReviews");

            reviewButton.style.color = 'green';
            reviewButton.classList.add('melt-away');

            setTimeout(() => {
                reviewButton.style.display = 'none';
            }, 1000);

            const reviews = await fetchDbReviews();
            addReviews(reviews);
        }

        async function addReviews(reviews) {
            if (reviews.length == 0) {
                showToast({
                    text: `暂无短评`,
                    icon: `<span class="material-symbols-outlined">comments_disabled</span>`,
                });
                return;
            }
            const detailContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailMainContainer .detailTextContainer");

            const reviewhtml = `<div class="verticalFieldItem">
                                    <h3 class="readOnlyContent">短评（来自JavDB）</h3>
                                    ${createReviewContent(reviews)}
                                </div>`;

            detailContainer.insertAdjacentHTML('beforeend', reviewhtml);

            function createReviewContent(reviews) {
                return reviews.map(review =>
                    `<h4 class="secondaryText readOnlyContent">- ${review}</h4>`
                ).join('');
            }
        }

        async function fetchDbReviews() {
            const cacheKey = `reviews_${item.Id}`;
            const cachedData = localStorage.getItem(cacheKey);
            const urlCacheKey = `movieUrl_${item.Id}`;
            let movieUrl = localStorage.getItem(urlCacheKey);


            if (cachedData && movieUrl) {
                fetchDbMore(movieUrl);
                return JSON.parse(cachedData);
            }

            movieUrl = getUrl(item.Overview, "===== 外部链接 =====", "JavDb");

            if (!movieUrl) {
                const code = getPartBefore(item.Name, " ");
                const noNumCode = code.replace(/^\d+(?=[A-Za-z])/, '').toLowerCase();
                const HOST = "https://javdb.com";
                const url = `${HOST}/search?q=${noNumCode}&f=all`;

                let searchData = await request(url);
                if (searchData.length === 0) return [];

                const parser = new DOMParser();

                let parsedHtml = parser.parseFromString(searchData, 'text/html');
                const firstItem = parsedHtml.querySelector(".movie-list .item");

                if (!firstItem) return [];

                const href = firstItem.querySelector("a.box")?.getAttribute("href"); // Get href attribute

                const titleElement = firstItem.querySelector(".video-title strong"); // Get the strong tag inside video-title
                const title = titleElement ? titleElement.textContent.trim().toLowerCase() : null; // Extract text content
                if (title.includes(noNumCode) || noNumCode.includes(title)) {
                    movieUrl = `${HOST}${href}`;
                    addLink(item.Overview || '', "===== 外部链接 =====", "JavDb", movieUrl);
                    localStorage.setItem(urlCacheKey, JSON.stringify(movieUrl));
                    const tagElement = firstItem.querySelector(".tags .tag");
                    const tagText = tagElement ? tagElement.textContent.trim() : null;
                    if (tagText === '含中字磁鏈' || tagText === 'CnSub DL' && !item.Genres.includes("中文字幕")) {
                        showToast({
                            text: 'javdb含有中文字幕磁链',
                            icon: `<span class="material-symbols-outlined">subtitles</span>`
                        });
                    }
                }
            }

            if (movieUrl) {
                fetchDbMore(movieUrl);
                const reviewUrl = `${movieUrl}/reviews/lastest`;

                try {
                    let searchData = await request(reviewUrl);
                    const parser = new DOMParser();
                    let parsedHtml = parser.parseFromString(searchData, 'text/html');

                    let reviews = [];
                    parsedHtml.querySelectorAll('.review-item p').forEach(p => {
                        reviews.push(p.textContent.trim());
                    });

                    // Save the result in localStorage
                    localStorage.setItem(cacheKey, JSON.stringify(reviews));

                    return reviews;
                } catch (error) {
                    console.error("Error fetching reviews:", error);
                    return [];
                }
            } else {
                showToast({
                    text: `短评加载失败`,
                    icon: `<span class="material-symbols-outlined">search_off</span>`,
                });
                return [];
            }
        }
    }

    async function fetchDbMore(url) {
        const cacheKey = `moreItems_${item.Id}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            return displayMoreItems(JSON.parse(cachedData));
        }

        const searchData = await request(url);
        if (searchData.length === 0) return;

        const parser = new DOMParser();
        const parsedHtml = parser.parseFromString(searchData, 'text/html');
        const moreSections = parsedHtml.querySelectorAll('.tile-small');
        let moreItems = [];

        moreSections.forEach(section => {
            section.querySelectorAll('.tile-item').forEach(moreItem => {
                const img = moreItem.querySelector('img');
                const code = moreItem.querySelector('.video-number');
                const name = moreItem.querySelector('.video-title');

                if (code) {
                    const codeText = code.textContent.trim();
                    if (!moreItems.some(dbitem => dbitem.Code === codeText)) {
                        moreItems.push({
                            ImgSrc: img ? img.src : '',
                            Code: codeText,
                            Name: name ? name.textContent.trim() : '',
                            Link: moreItem.getAttribute('href')
                        });
                    }
                }
            });
        });

        moreItems = await filterDbMovies(moreItems);

        if (moreItems.length > 0) {
            // Save the filtered items in localStorage
            localStorage.setItem(cacheKey, JSON.stringify(moreItems));
            displayMoreItems(moreItems);
        }

        function displayMoreItems(moreItems) {
            let imgHtml = '';
            for (let i = 0; i < moreItems.length; i++) {
                imgHtml += createDbContainer(moreItems[i], i);
            }

            const sliderElement = createSlider(`更多类似（来自JavDB，共${moreItems.length}部）`, imgHtml);
            const sliderId = "mySimilarSlider";
            sliderElement.id = sliderId;
            const similarSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .similarSection");
            similarSection.insertAdjacentElement('beforebegin', sliderElement);

            addResizeListener();
            adjustCardOffset(`#${sliderId}`, '.actorMoreItemsContainer', '.virtualScrollItem');
        }
    }





    // Function to copy text to clipboard
    async function copyTextToClipboard(text) {
        try {
            // Check if the Clipboard API is available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                // Use the Clipboard API
                await navigator.clipboard.writeText(text);
                console.log(`Copied to clipboard: ${text}`);
            } else {
                // Fallback to the deprecated execCommand method
                throw new Error('Clipboard API not available');
            }
        } catch (err) {
            console.warn('Clipboard API failed, falling back to execCommand');

            // Fallback to execCommand
            let textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px'; // Move the textarea off-screen

            document.body.appendChild(textarea);
            textarea.select();

            try {
                let success = document.execCommand('copy');
                if (!success) throw new Error('execCommand failed');
                console.log(`Copied to clipboard: ${text}`);
            } catch (execErr) {
                console.error('Failed to copy to clipboard:', execErr);
            } finally {
                document.body.removeChild(textarea); // Clean up
            }
        }
    }


    function createBanner(text, html, addSlider = false) {
        let banner;

        if (addSlider) {
            banner = `
		    <div class="verticalSection verticalSection-cards emby-scrollbuttons-scroller">
              
			    <h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">${text}</h2>
                <div is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right scrollX hiddenScrollX scrollFrameX" data-mousewheel="false" data-focusscroll="true" data-horizontal="true" bis_skin_checked="1">
			        ${html}
                </div>
		    </div>`;
        } else {
            banner = `
		    <div class="verticalSection verticalSection-cards">
			    <h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">${text}</h2>
			    ${html}
		    </div>`;
        }

        return banner
    }

    function createSlider(text, html, isActor = 1) {
        const titleText = isActor ? `${text} 其他作品` : `${text}（导演） 其他作品`;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="verticalSection verticalSection-cards actorMoreSection emby-scrollbuttons-scroller" bis_skin_checked="1">
                <h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">${titleText}</h2>
                <div is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right scrollX hiddenScrollX scrollFrameX" data-mousewheel="false" data-focusscroll="true" data-horizontal="true" bis_skin_checked="1">
                    <div is="emby-itemscontainer" class="scrollSlider focuscontainer-x itemsContainer focusable actorMoreItemsContainer scrollSliderX emby-scrollbuttons-scrollSlider virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller" data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid" bis_skin_checked="1" style="white-space: nowrap; min-width: 2412px; height: 351px;" data-minoverhang="1" layout="horizontal-grid">
                        ${html}
                    </div>
                </div>
            </div>
        `.trim();

        return wrapper.firstElementChild;
    }

    function createSliderLarge(text, html, linkUrl) {
        let wrapper = document.createElement('div');
        let sliderHtml;

        if (item.Type !== 'BoxSet') {
            sliderHtml = `
            <div class="verticalSection verticalSection-cards emby-scrollbuttons-scroller" bis_skin_checked="1">
                <div class="sectionTitleContainer sectionTitleContainer-cards padded-left padded-left-page padded-right" bis_skin_checked="1">
                    <a onclick="window.open('${linkUrl}', '_blank')" is="emby-sectiontitle" class="noautofocus button-link button-link-color-inherit sectionTitleTextButton sectionTitleTextButton-link sectionTitleTextButton-more emby-button emby-button-backdropfilter">
                        <h2 class="sectionTitle sectionTitle-cards">${text}</h2>
                        <i class="md-icon sectionTitleMoreIcon secondaryText"></i>
                    </a>
                </div>
                <div is="emby-scroller" data-mousewheel="false" data-focusscroll="true" class="padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right emby-scroller scrollX hiddenScrollX scrollFrameX" bis_skin_checked="1">
                    <div is="emby-itemscontainer" data-focusabletype="nearest" class="focusable focuscontainer-x itemsContainer scrollSlider scrollSliderX emby-scrollbuttons-scrollSlider virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller" data-virtualscrolllayout="horizontal-grid" data-minoverhang="1" layout="horizontal-grid" bis_skin_checked="1" style="white-space: nowrap; min-width: 2400px; height: 265px;">
                        ${html}
                    </div>
                </div>
            </div>
        `;
        } else {
            sliderHtml = `
            <div class="linked-Movie-section verticalSection verticalSection-cards">
                <div class="sectionTitleContainer padded-left padded-left-page padded-right sectionTitleContainer-cards focusable" data-focusabletype="nearest">
                    <a onclick="window.open('${linkUrl}', '_blank')" is="emby-sectiontitle" class="noautofocus button-link button-link-color-inherit sectionTitleTextButton sectionTitleTextButton-link sectionTitleTextButton-more emby-button emby-button-backdropfilter">
                        <h2 class="sectionTitle sectionTitle-cards sectionTitleText-withseeall">${text}</h2>
                        <i class="md-icon sectionTitleMoreIcon secondaryText"></i>
                    </a>
                </div>
                <div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-left-page padded-right vertical-wrap">
                    ${html}
                </div>
            </div>
        `;
        }

        wrapper.innerHTML = sliderHtml.trim();
        return wrapper.firstElementChild;
    }

    function createItemContainer(itemInfo, increment) {
        let distance, imgUrl, typeWord;
        if (isPreferThumb()) {
            distance = OS_current === 'ipad' ? 260 : OS_current === 'iphone' ? 300 : 350;
            imgUrl = ApiClient.getImageUrl(itemInfo.Id, { type: "Thumb", tag: itemInfo.ImageTags.Thumb, maxHeight: 360, maxWidth: 640 });
            typeWord = 'backdrop';
        } else {
            distance = OS_current === 'ipad' ? 182 : OS_current === 'iphone' ? 120 : 200;
            imgUrl = ApiClient.getImageUrl(itemInfo.Id, { type: "Primary", tag: itemInfo.ImageTags.Primary, maxHeight: 330, maxWidth: 220 });
            typeWord = 'portrait';
        }

        let code = itemInfo.ProductionYear;
        let name = itemInfo.Name;

        const itemContainer = `
            <div data-id="${itemInfo.Id}" data-localtrailer-count="${itemInfo.LocalTrailerCount || 0}" class="virtualScrollItem card ${typeWord}Card card-horiz ${typeWord}Card-horiz card-hoverable card-autoactive" tabindex="0" draggable="false" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded" bis_skin_checked="1">
                    <button onclick="Emby.Page.showItem('${itemInfo.Id}')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-${typeWord} myCardImage">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded" bis_skin_checked="1">
                        <span title="${name}">${name}</span>
                    </div>
                    <div class="cardText cardText-secondary" bis_skin_checked="1">
                        ${code}
                    </div>
                </div>
            </div>
        `;

        return itemContainer;
    }

    function createDbContainer(itemInfo, increment) {
        const distance = OS_current === 'ipad' ? 182 : OS_current === 'iphone' ? 120 : 200;
        const imgUrl = itemInfo.ImgSrc;
        const code = itemInfo.Code;
        const name = itemInfo.Name;
        const link = `https://javdb.com${itemInfo.Link}?locale=zh`;

        const itemContainer = `
            <div  class="virtualScrollItem card portraitCard card-horiz portraitCard-horiz card-hoverable card-autoactive" tabindex="0" draggable="false" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded" bis_skin_checked="1">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-portrait myCardImage">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded" bis_skin_checked="1">
                        <span title="${name}">${name}</span>
                    </div>
                    <div class="cardText cardText-secondary" bis_skin_checked="1">
                        ${code}
                    </div>
                </div>
            </div>
        `;

        return itemContainer;
    }

    function createItemContainerLarge(itemInfo, increment) {
        let distance = OS_current === 'ipad' ? 260 : OS_current === 'iphone' ? 300 : 350;
        const imgUrl = itemInfo.ImgSrc;
        const title = `${itemInfo.Code} ${itemInfo.Name}`;
        const link = `https://javdb.com${itemInfo.Link}?locale=zh`;
        const score = itemInfo.Score;
        const scoreStr = score.match(/^(\d+(\.\d+)?)/);
        const scoreNum = scoreStr ? parseFloat(scoreStr[0]) : null;
        const scoreHighlight = scoreNum && scoreNum > 4.4 ? " has-trailer" : "";
        const time = itemInfo.Time;
        let itemContainer;
        if (item.Type != 'BoxSet') {
            itemContainer = `
            <div class="virtualScrollItem card backdropCard card-horiz backdropCard-horiz card-hoverable card-autoactive" tabindex="0" draggable="true" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded" bis_skin_checked="1">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop myCardImage${scoreHighlight}">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded" bis_skin_checked="1">
                        <span title="${title}">${title}</span>
                    </div>
                    <div class="cardText cardText-secondary" bis_skin_checked="1">${time} || 评分：${score}
                    </div>
                </div>
            </div>
            `;
        } else {
            itemContainer = `
            <div class="card backdropCard card-horiz card-hoverable card-autoactive" tabindex="0" draggable="true">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop myCardImage${scoreHighlight}">  
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded">
                        <span title="${title}">${title}</span>
                    </div>
                    <div class="cardText cardText-secondary">
                        ${time} || 评分：${score}
                    </div>
                </div>
            </div>
            `;
        }
        return itemContainer;
    }

    async function previewInject(isSlider = false) {

        let addSlider = false;
        if (!isJP18() || isTouchDevice() || window.innerHeight > window.innerWidth || isSlider) addSlider = true;


        if (item.BackdropImageTags.length === 0) return;

        const images = await ApiClient.getItemImageInfos(item.Id);
        const backdrops = images.filter(image => image.ImageType === "Backdrop");

        const seenPaths = new Map();
        const uniqueBackdrops = [];

        for (let i = 0; i < backdrops.length; i++) {
            const backdrop = backdrops[i];
            if (!seenPaths.has(backdrop.Path)) {
                seenPaths.set(backdrop.Path, true);
                uniqueBackdrops.push(backdrop);
            }
        }

        const extractNumber = (filename) => {
            if (!filename) return null; // Return null for undefined or null filenames
            const matches = filename.match(/(\d+)/g); // Match all numbers in the filename
            return matches ? parseInt(matches[matches.length - 1], 10) : null; // Use the last number or return null if no numbers
        };

        uniqueBackdrops.sort((a, b) => {
            // Always prioritize the item with ImageIndex = 0
            if (a.ImageIndex === 0) return -1;
            if (b.ImageIndex === 0) return 1;

            // Handle undefined or null filenames (move them to the end)
            if (!a.Filename && !b.Filename) return 0; // Both are undefined/null, keep order
            if (!a.Filename) return 1; // Move a to the end
            if (!b.Filename) return -1; // Move b to the end

            // Extract numbers from filenames
            const numA = extractNumber(a.Filename);
            const numB = extractNumber(b.Filename);

            // Check if filenames are non-numeric (string names)
            const isStringNameA = numA === null; // True if filename is non-numeric
            const isStringNameB = numB === null; // True if filename is non-numeric

            // Move string names to the beginning (after ImageIndex = 0)
            if (isStringNameA && !isStringNameB) return -1; // a is string name, b is numeric
            if (!isStringNameA && isStringNameB) return 1; // a is numeric, b is string name
            if (isStringNameA && isStringNameB) {
                // Both are string names, sort lexicographically
                return a.Filename.localeCompare(b.Filename);
            }

            // Both are numeric filenames, sort by extracted number
            return numA - numB;
        });

        const peopleSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .peopleSection");
        if (!peopleSection) return;

        let isCollapsed = uniqueBackdrops.length > 30;

        if (!isCollapsed) { addSlider = true };

        let html = '';
        if (addSlider) {
            html = `<div id="myFanart" is="emby-itemscontainer" class="imageSection itemsContainer virtualItemsContainer focusable focuscontainer-x scrollSlider scrollSliderX emby-scrollbuttons-scrollSlider"  data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid" bis_skin_checked="1" style="white-space: nowrap; min-width: 2412px;" data-minoverhang="1" layout="horizontal-grid">`;
        } else {
            html = `<div id="myFanart" is="emby-itemscontainer" class="imageSection itemsContainer focuscontainer-x padded-left padded-left-page padded-right vertical-wrap" 
                    style="${isCollapsed ? `max-height: ${0.81 * window.innerHeight + 56}px; overflow: hidden;` : ''}">`;
        }


        for (let index = 0; index < uniqueBackdrops.length; index++) {
            let tagIndex = uniqueBackdrops[index].ImageIndex;
            let filename = uniqueBackdrops[index].Filename; // Get the filename
            let url = ApiClient.getImageUrl(item.Id, { type: "Backdrop", index: tagIndex, tag: item.BackdropImageTags[tagIndex] });
            let width = uniqueBackdrops[index].Width;
            let height = uniqueBackdrops[index].Height;

            // Check if width or height is undefined, null, or 0
            let ratio = (width && height) ? (width / height).toFixed(2) : (16 / 9).toFixed(2);

            // Add the filename as a data attribute
            html += `<img class='my-fanart-image ${addSlider ? 'my-fanart-image-slider' : ''}' src="${url}" alt="${index}" loading="lazy" data-filename="${filename || ''}" data-ratio="${ratio}"/>`;
        }
        html += `</div>`;

        // Add the toggle button if images exceed 30
        if (isCollapsed && !addSlider) {
            html += `
                <button id="toggleFanart" style="margin-top: 10px; display: block;">
                    ▼ 显示剧照(共${uniqueBackdrops.length}张) ▼
                </button>
            `;
        }

        const banner = createBanner("剧照", html, addSlider);
        peopleSection.insertAdjacentHTML("afterend", banner);

        if (addSlider) {
            adjustSliderWidth();

            if (!isFanartResizeListenerAdded) {
                window.addEventListener('resize', function () {
                    adjustSliderWidth();
                });
                isFanartResizeListenerAdded = true;
            }
        } else if (isCollapsed) {
            const button = viewnode.querySelector("#toggleFanart");
            button.addEventListener("click", () => {
                const fanartSection = viewnode.querySelector("#myFanart");

                if (fanartSection.style.maxHeight === "none") {
                    fanartSection.style.maxHeight = `${0.81 * window.innerHeight + 56}px`;
                    fanartSection.style.overflow = "hidden";
                    button.textContent = `▼ 显示剧照(共${uniqueBackdrops.length}张) ▼`;
                } else {
                    fanartSection.style.maxHeight = "none";
                    fanartSection.style.overflow = "visible";
                    button.textContent = "▲ 隐藏剧照 ▲";
                }
            });
        }
    }

    function adjustSliderWidth() {

        const fanartSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .imageSection");
        if (!fanartSection || !fanartSection.classList.contains('scrollSlider')) return

        const fanartImages = fanartSection.querySelectorAll(".my-fanart-image");
        if (!fanartImages || fanartImages.length === 0) return;


        const height = Math.max(0.2 * window.innerHeight, 180);

        // Initialize total width
        let totalWidth = 0;

        // Iterate through each fanart image
        fanartImages.forEach(image => {

            // Read the ratio from the dataset or default to 16/9 if not present
            const ratio = parseFloat(image.dataset.ratio) || (16 / 9);

            // Calculate the width of the current image
            const imageWidth = height * ratio + 20; // Add 20 as padding

            // Add the image width to the total width
            totalWidth += imageWidth;
        });

        // Apply the total width to the fanart section
        fanartSection.style.minWidth = `${totalWidth}px`;
    }

    function modalInject() {

        // Detect if the device is touch-enabled
        const isTouch = isTouchDevice();
        var fanartSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .imageSection");
        if (!fanartSection) return

        var fanartImages = fanartSection.querySelectorAll(".my-fanart-image");
        if (!fanartImages) return

        let modal = document.getElementById('myModal');
        if (!modal) {
            modal = createModal();
            attachEventListeners(isTouch);
        }

        const modalImg = modal.querySelector('.modal-content');
        const modalCaption = modal.querySelector('.modal-caption');
        const closeButton = modal.querySelector('.close');
        const prevButton = modal.querySelector('.prev');
        const nextButton = modal.querySelector('.next');


        // Add a single event listener for all images
        fanartSection.addEventListener(isTouch ? 'touchstart' : 'click', handleTapOrClick);

        let tapTimeout = null;  // Timeout for double-tap detection
        let lastTapTime = 0;    // Time of the last tap

        function handleTapOrClick(event) {
            const target = event.target;
            const triggerTime = 500;

            // Check if the tapped/clicked element is a fanart image
            if (target.classList.contains('my-fanart-image')) {
                const index = Array.from(fanartSection.querySelectorAll('.my-fanart-image')).indexOf(target);

                if (isTouch) {
                    const currentTime = new Date().getTime();
                    const tapInterval = currentTime - lastTapTime;

                    if (tapInterval < triggerTime && tapInterval > 0) {
                        // If it's a double-tap within 500ms, show the image
                        clearTimeout(tapTimeout); // Clear the single tap timeout
                        showImage(index); // Show image on double-tap
                        lastTapTime = 0;  // Reset tap time
                    } else {
                        // Update last tap time, set a timeout for the next tap
                        lastTapTime = currentTime;

                        tapTimeout = setTimeout(() => {
                            // Reset tap after timeout (do nothing on single tap)
                            lastTapTime = 0;
                        }, triggerTime); // 500ms delay for double-tap detection
                    }
                } else {
                    // For non-touch devices, show image immediately on a single click
                    showImage(index);
                }
            }
        }

        function showImage(index) {
            fanartImages = viewnode.querySelectorAll("div[is='emby-scroller']:not(.hide) .imageSection .my-fanart-image");

            const selectedImage = fanartImages[index];
            if (selectedImage) {
                modalImg.style.opacity = '0';
                modalImg.src = selectedImage.src;
                modalImg.alt = selectedImage.alt;
                modalCaption.textContent = `${selectedImage.dataset.filename} (${index + 1}/${fanartImages.length})`;
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                modalImg.style.transform = `scale(1)`;
                modal.classList.remove('modal-closing'); // Remove closing animation class if previously applied

                const prevButton = document.querySelector('.prev');
                const nextButton = document.querySelector('.next');
                // Check if the image is the first or the last
                if (index === 0) {
                    prevButton.classList.add('disabled');
                } else {
                    prevButton.classList.remove('disabled');
                }

                if (index === fanartImages.length - 1) {
                    nextButton.classList.add('disabled');
                } else {
                    nextButton.classList.remove('disabled');
                }

                // Fade in the modal image
                fadeIn(modalImg, 300); // 500ms duration for fade-in effect
            }
        }

        function myShowImage(index) {
            fanartImages = viewnode.querySelectorAll("div[is='emby-scroller']:not(.hide) .imageSection .my-fanart-image");
            const selectedImage = fanartImages[index];
            const prevButton = document.querySelector('.prev');
            const nextButton = document.querySelector('.next');

            if (selectedImage) {
                modalImg.src = selectedImage.src;
                modalImg.alt = selectedImage.alt;
                modalCaption.textContent = `${selectedImage.dataset.filename} (${index + 1}/${fanartImages.length})`;

                // Check if the image is the first or the last
                if (index === 0) {
                    prevButton.classList.add('disabled');
                } else {
                    prevButton.classList.remove('disabled');
                }

                if (index === fanartImages.length - 1) {
                    nextButton.classList.add('disabled');
                } else {
                    nextButton.classList.remove('disabled');
                }
            }
        }

        function nextImage() {
            const index = parseInt(modalImg.alt, 10);
            let newIndex = index + 1;
            fanartImages = viewnode.querySelectorAll("div[is='emby-scroller']:not(.hide) .imageSection .my-fanart-image");
            if (newIndex >= fanartImages.length) {
                newIndex = index;
                // Trigger the shake animation when at the last image
                modalImg.style.animation = 'shake 0.3s ease';
                setTimeout(() => {
                    modalImg.style.animation = ''; // Remove the animation after it plays
                }, 300);
                showToast({
                    text: '已到最后',
                    icon: `<span class="material-symbols-outlined">last_page</span>`,
                });
                resetImageStyles();
                return
            }
            modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            modalImg.style.transform = 'translateX(-100%)';
            modalImg.style.opacity = '0';
            setTimeout(() => {
                myShowImage(newIndex);

                // Immediately jump to the right (offscreen)
                modalImg.style.transition = 'none';
                modalImg.style.transform = 'translateX(100%)';
                modalImg.style.opacity = '0';

                // Force reflow to make sure the browser registers the new style
                void modalImg.offsetHeight;

                // Now animate it back into view
                modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                modalImg.style.transform = 'translateX(0)';
                modalImg.style.opacity = '1';
                modalImg.style.transform += ' scale(1)';
            }, 200);
        }

        function prevImage() {
            const index = parseInt(modalImg.alt, 10);
            let newIndex = index - 1;
            if (newIndex < 0) {
                newIndex = 0;
                // Trigger the shake animation when at the first image
                modalImg.style.animation = 'shake 0.3s ease';
                setTimeout(() => {
                    modalImg.style.animation = ''; // Remove the animation after it plays
                }, 300);
                showToast({
                    text: '已到最前',
                    icon: `<span class="material-symbols-outlined">first_page</span>`
                });
                resetImageStyles();
                return
            }
            modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            modalImg.style.transform = 'translateX(100%)';
            modalImg.style.opacity = '0';
            setTimeout(() => {
                myShowImage(newIndex);

                // Immediately jump to the left (offscreen)
                modalImg.style.transition = 'none';
                modalImg.style.transform = 'translateX(-100%)';
                modalImg.style.opacity = '0';

                // Force reflow to apply the style immediately
                void modalImg.offsetHeight;

                // Animate it back into view
                modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                modalImg.style.transform = 'translateX(0) scale(1)';
                modalImg.style.opacity = '1';
            }, 200);
        }

        function closeModal() {
            modal.classList.add('modal-closing'); // Apply closing animation class
            setTimeout(() => {
                modal.style.display = 'none'; // Hide the modal after animation completes
                modal.classList.remove('modal-closing'); // Remove closing animation class
                document.body.style.overflow = ''; // Restore scrolling
            }, 300); // Adjust the delay to match the animation duration
        }

        function closeModalSwipe() {
            const imgRect = modalImg.getBoundingClientRect(); // Get the image position relative to the viewport
            const windowWidth = window.innerWidth; // Get the viewport width
            const windowHeight = window.innerHeight; // Get the viewport height

            // Calculate the transform origin as a percentage relative to the viewport (screen)
            const transformOriginXPercent = ((imgRect.left + imgRect.width / 2) / windowWidth) * 100;
            const transformOriginYPercent = ((imgRect.top + imgRect.height / 2) / windowHeight) * 100;

            // Apply the transform-origin in percentage relative to the viewport
            modalImg.style.transformOrigin = `${transformOriginXPercent}% ${transformOriginYPercent}%`;

            modal.classList.add('modal-closing'); // Apply closing animation class
            setTimeout(() => {
                modal.style.display = 'none'; // Hide the modal after animation completes
                modal.classList.remove('modal-closing'); // Remove closing animation class
                modalImg.style.transformOrigin = ''; // Reset transform-origin
                document.body.style.overflow = ''; // Restore scrolling
            }, 300); // Adjust the delay to match the animation duration
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


        function setButtonSize(button, isSmaller) {
            if (isSmaller) {
                button.classList.add('click-smaller'); // Add smaller class when clicked
            } else {
                button.classList.remove('click-smaller'); // Remove smaller class on release
            }
        }

        function attachEventListeners(isTouch) {
            const modalImg = modal.querySelector('.modal-content');
            const closeButton = modal.querySelector('.close');
            const prevButton = modal.querySelector('.prev');
            const nextButton = modal.querySelector('.next');

            if (isTouch) {
                prevButton.style.display = 'none';
                nextButton.style.display = 'none';
                closeButton.style.display = 'none';
                handleTouchSwipe();
            } else {
                const buttonEvent = 'mousedown';
                const buttonReleaseEvent = 'mouseup';

                prevButton.addEventListener(buttonEvent, () => setButtonSize(prevButton, true));
                prevButton.addEventListener(buttonReleaseEvent, () => setButtonSize(prevButton, false));
                prevButton.addEventListener('click', prevImage);

                nextButton.addEventListener(buttonEvent, () => setButtonSize(nextButton, true));
                nextButton.addEventListener(buttonReleaseEvent, () => setButtonSize(nextButton, false));
                nextButton.addEventListener('click', nextImage);

                closeButton.addEventListener('click', closeModal);
                modalImg.addEventListener('wheel', handleWheelZoom);
            }
        }

        function handleTouchSwipe() {
            let touchstartX = 0;
            let touchendX = 0;
            let touchstartY = 0;
            let touchendY = 0;
            let isSwipingX = false;
            let isSwipingY = false;
            let directionLocked = false;

            modal.addEventListener('touchstart', (event) => {
                const touch = event.changedTouches[0];
                modalImg.style.transition = 'none';
                touchstartX = touch.screenX;
                touchstartY = touch.screenY;
                isSwipingX = false;
                isSwipingY = false;
                directionLocked = false; // Reset direction lock
            });

            modal.addEventListener('touchmove', (event) => {
                const touch = event.changedTouches[0];
                const deltaX = touch.screenX - touchstartX;
                const deltaY = touch.screenY - touchstartY;

                // Determine direction of swipe
                if (!directionLocked) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        isSwipingX = true;
                    } else {
                        isSwipingY = true;
                    }
                    directionLocked = true; // Lock direction after the initial movement
                }

                const maxDelta = 300; // Maximum distance for full opacity reduction
                let distance = 0;

                if (isSwipingX) {
                    // Horizontal swipe - calculate distance and move the image
                    distance = Math.abs(deltaX);
                    modalImg.style.transform = `translateX(${deltaX}px)`; // Move horizontally
                } else if (isSwipingY) {
                    // Vertical swipe - calculate combined distance (Pythagorean distance)
                    distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); // Diagonal distance
                    modalImg.style.transform = `translate(${deltaX}px, ${deltaY}px)`; // Move both X and Y
                }

                // Calculate opacity based on distance (same logic for X and Y swiping)
                const opacity = 1 - 0.7 * Math.min(distance / maxDelta, 1);
                modalImg.style.opacity = opacity;

                // Prevent the background from moving (disable page scrolling)
                event.preventDefault();
            });

            modal.addEventListener('touchend', (event) => {
                const touch = event.changedTouches[0];
                touchendX = touch.screenX;
                touchendY = touch.screenY;
                handleSwipe();
            });

            function handleSwipe() {
                const thresholdX = 80; // Minimum horizontal distance for swipe
                const thresholdY = 100; // Minimum vertical distance for upward swipe

                const deltaX = touchendX - touchstartX;
                const deltaY = touchstartY - touchendY;

                if (isSwipingX && Math.abs(deltaX) > thresholdX) {
                    if (deltaX < 0) {
                        nextImage();
                    } else {
                        prevImage();
                    }
                } else if (isSwipingY && Math.abs(deltaY) > thresholdY) {
                    closeModalSwipe(); // Swipe up
                } else {
                    resetImageStyles();
                }
            }
        }


        function resetImageStyles() {
            modalImg.style.transform = 'translateX(0)';
            modalImg.style.opacity = 1;
        }

        function handleWheelZoom(event) {
            event.preventDefault();
            const zoomStep = 0.1;
            let currentZoom = parseFloat(getComputedStyle(modalImg).getPropertyValue('transform').split(' ')[3]) || 1;

            currentZoom += event.deltaY < 0 ? zoomStep : -zoomStep;
            currentZoom = Math.max(zoomStep, currentZoom); // Limit minimum zoom
            modalImg.style.transform = `scale(${currentZoom})`;
        }
    }

    function createModal() {
        const modalHTML = `
        <span class="close">&#10006;</span>
        <img class="modal-content" id="modalImg">
        <div class="modal-caption" id="modalCaption">example.jpg (1/10)</div>
        <button class="prev">&#10094;</button>
        <button class="next">&#10095;</button>
        `;

        const modal = document.createElement('div');
        modal.id = 'myModal';
        modal.classList.add('modal');
        modal.innerHTML = modalHTML;

        document.body.appendChild(modal);

        return modal;
    }


    function showToast(options) {
        //options can be added: text, icon, iconStrikeThrough, secondaryText
        Emby.importModule("./modules/toast/toast.js").then(function (toast) {
            return toast(options)
        })
    }

    function addResizeListener() {
        if (!isResizeListenerAdded) {
            window.addEventListener('resize', function () {
                adjustCardOffsets();
            });
            isResizeListenerAdded = true; // Set the flag to true after adding the listener
        }
    }

    async function actorMoreInject(isDirector = false, excludeIds = []) {
        if (item.Type == 'Person') return
        const name = getActorName(isDirector);
        isDirector ? (directorName = name) : (actorName = name);

        if (name.length > 0) {
            const moreItems = await getActorMovies(name, excludeIds);
            const aboutSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection");


            if (moreItems.length > 0) {

                const sliderElement = createSlider(name, actorMoreHtml(moreItems), !isDirector);

                const sliderId = isDirector ? "myDirectorMoreSlider" : "myActorMoreSlider";
                sliderElement.id = sliderId;

                aboutSection.insertAdjacentElement('beforebegin', sliderElement);

                addResizeListener();

                adjustCardOffset(`#${sliderId}`, '.actorMoreItemsContainer', '.virtualScrollItem');

                addHoverEffect(sliderElement.querySelector(".itemsContainer"));

                return moreItems.map(moreItem => moreItem.Id);

            }
        }
        return [];
    }

    function actorMoreHtml(moreItems) {
        let imgHtml = '';
        for (let i = 0; i < moreItems.length; i++) {
            imgHtml += createItemContainer(moreItems[i], i);
        };
        return imgHtml;
    }

    function dbActorMoreHtml(moreItems) {
        let imgHtml = '';
        for (let i = 0; i < moreItems.length; i++) {
            imgHtml += createItemContainerLarge(moreItems[i], i);
        };
        return imgHtml;
    }

    function isTouchDevice() {
        //return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        return ['iphone', 'ipad', 'android'].includes(OS_current);
    }

    async function addHoverEffect(slider = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .similarItemsContainer")) {

        if (isTouchDevice() || !slider) return;

        const portraitCards = slider.children;
        if (!portraitCards) return;

        for (let card of portraitCards) {
            const imageContainer = card.querySelector('.cardImageContainer');

            if (imageContainer.classList.contains("has-trailer")) continue;

            const index = Number(item.Type === 'BoxSet' ? card.dataset.index : card._dataItemIndex);
            const itemSource = item.Type === 'BoxSet' ? slider.items : slider._itemSource;

            let itemId = card.dataset.id ?? getItemIdFromSlider(index, slider._itemSourceMap) ?? getItemIdFromCard(card);

            let localTrailerCount = Number(card.dataset.localtrailerCount ?? getTrailerCount(index, itemSource) ?? 0);
            /*
            if (localTrailerCount === 0 && item.Type === "BoxSet") {
                const thisItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemId);
                localTrailerCount = thisItem.localTrailerCount;
            }
            */

            //let remoteTrailers = getRemoteTrailer(card._dataItemIndex, slider._itemSource);

            if (localTrailerCount === 0
                && getItemType(card._dataItemIndex, slider._itemSource) != 'Trailer') {
                continue;
            }

            
            const cardOverlay = card.querySelector('.cardOverlayContainer');
            imageContainer.classList.remove('myCardImage');
            const img = imageContainer.querySelector('.cardImage');

            let isHovered = true;

            setTimeout(() => {
                isHovered = false;
            }, 1000);

            imageContainer.classList.add('has-trailer');

            // Add mouseenter event to change image, width, and layering immediately
            card.addEventListener('mouseenter', () => {
                if (isHovered) return;
                isHovered = true;
            
                img.style.filter = 'blur(5px)';
            
                // Pre-create the video element but don't append it yet
                let videoElement;
            
                // Async fetch the trailer URL and insert the video when ready
                getTrailerUrl(itemId).then(trailerUrl => {
                    if (!isHovered) return; // Exit if hover already ended
            
                    videoElement = createVideoElement(trailerUrl);
                    (cardOverlay || imageContainer).appendChild(videoElement);
            
                    if (isHovered) {
                        videoElement.style.opacity = '1';
                    }
                });
            });

            // Add mouseleave event to reset the image, width, and layering immediately
            card.addEventListener('mouseleave', () => {
                if (!isHovered) return;
                isHovered = false;
                img.style.filter = ''; // Remove blur effect
                const allVideos = imageContainer.querySelectorAll('video');
                allVideos.forEach(video => video.remove());
            });
        }
    }

    function getTrailerCount(index, items) {
        if (typeof index !== 'number' || !Array.isArray(items) || !items[index]) {
            return 0;
        }

        return items[index].LocalTrailerCount;
    }

    function getRemoteTrailer(index, items) {
        if (typeof index !== 'number' || !Array.isArray(items) || !items[index]) {
            return null;
        }

        return items[index].RemoteTrailers;
    }

    function getItemType(index, items) {
        if (typeof index !== 'number' || !Array.isArray(items) || !items[index]) {
            return null;
        }

        return items[index].Type;
    }

    function getItemIdFromCard(card) {
        const imgContainer = card.querySelector('.cardImageContainer');
        const img = imgContainer?.querySelector('.cardImage');
        if (!img) return null;
        const match = img.src.match(/\/Items\/(\d+)\//);
        return match ? match[1] : null;
    }

    function getItemIdFromSlider(index, items) {
        if (typeof index !== 'number' || !Array.isArray(items) || !items[index]) {
            return undefined;
        }

        return items[index].Id;
    }

    async function getTrailerUrl(itemId) {

        let cacheKey = `trailerUrl_${itemId}`;

        //let videourl = localStorage.getItem(cacheKey);
        let videourl = getTrailerFromCache? localStorage.getItem(cacheKey) : null;
        if (!videourl) {
            let localTrailers = await ApiClient.getLocalTrailers(ApiClient.getCurrentUserId(), itemId);
            if (localTrailers && localTrailers.length === 0) {
                const thisItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemId);
                if (thisItem.Type === 'Trailer') {
                    localTrailers = [thisItem];
                } 
            }

            if (localTrailers && localTrailers.length > 0) {
                let trailerItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localTrailers[0].Id);

                const trailerurls = (await ApiClient.getPlaybackInfo(trailerItem.Id, {},
                    { "MaxStaticBitrate": 140000000, "MaxStreamingBitrate": 140000000, "MusicStreamingTranscodingBitrate": 192000, "DirectPlayProfiles": [{ "Container": "mp4,m4v", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "mkv", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "flv", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "aac,mp3" }, { "Container": "mov", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "opus", "Type": "Audio" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3" }, { "Container": "mp2,mp3", "Type": "Audio", "AudioCodec": "mp2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac" }, { "Container": "m4a", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "mp4", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "flac", "Type": "Audio" }, { "Container": "webma,webm", "Type": "Audio" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "PCM_S16LE,PCM_S24LE" }, { "Container": "ogg", "Type": "Audio" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis,opus", "VideoCodec": "av1,VP8,VP9" }], "TranscodingProfiles": [{ "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mkv", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "Context": "Static", "MaxAudioChannels": "2", "CopyTimestamps": true }, { "Container": "m4s,ts", "Type": "Video", "AudioCodec": "ac3,mp3,aac", "VideoCodec": "h264,h265,hevc", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true, "ManifestSubtitles": "vtt" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis", "VideoCodec": "vpx", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp4", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264", "Context": "Static", "Protocol": "http" }], "ContainerProfiles": [], "CodecProfiles": [{ "Type": "VideoAudio", "Codec": "aac", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "VideoAudio", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "Video", "Codec": "h264", "Conditions": [{ "Condition": "EqualsAny", "Property": "VideoProfile", "Value": "high|main|baseline|constrained baseline|high 10", "IsRequired": false }, { "Condition": "LessThanEqual", "Property": "VideoLevel", "Value": "62", "IsRequired": false }] }, { "Type": "Video", "Codec": "hevc", "Conditions": [] }], "SubtitleProfiles": [{ "Format": "vtt", "Method": "Hls" }, { "Format": "eia_608", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "eia_708", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "vtt", "Method": "External" }, { "Format": "ass", "Method": "External" }, { "Format": "ssa", "Method": "External" }], "ResponseProfiles": [{ "Type": "Video", "Container": "m4v", "MimeType": "video/mp4" }] }
                ));

                const trailerurl = trailerurls.MediaSources[0];

                if (trailerurl.Protocol == "File") {
                    /*
                    if (OS_current === 'windows') {
                        videourl = await ApiClient.getItemDownloadUrl(trailerItem.Id, trailerItem.MediaSources[0].Id, trailerItem.serverId);
                    } else {
                        videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;
                    }
                    */

                    videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;
                    if (videourl.includes('.m3u8') && OS_current === 'windows') {
                        //videourl = await ApiClient.getItemDownloadUrl(trailerItem.Id, trailerItem.MediaSources[0].Id, trailerItem.serverId);
                        videourl = `${ApiClient._serverAddress}/emby/videos/${trailerItem.Id}/original.${trailerItem.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${trailerItem.MediaSources[0].Id}&PlaySessionId=${trailerurls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;
                    }

                    //videourl = `${ApiClient._serverAddress}/emby/videos/${trailerItem.Id}/original.${trailerItem.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${trailerItem.MediaSources[0].Id}&PlaySessionId=${trailerurls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;
                } else if (trailerurl.Protocol == "Http") {
                    videourl = trailerurl.Path;
                }

                localStorage.setItem(cacheKey, videourl); // Store in localStorage
            }
        }

        return videourl;
    }

    function createVideoElement(trailerUrl) {
        let videoElement = document.createElement('video');
        videoElement.src = trailerUrl; // Video URL
        videoElement.controls = false; // Show controls like play/pause
        videoElement.autoplay = true; // Ensure video plays automatically
        videoElement.muted = true; // Mute the video (to avoid autoplay restrictions)

        // Add the CSS class to the video element
        videoElement.classList.add('video-element');
        videoElement.style.pointerEvents = 'none';
        videoElement.style.opacity = '0'; // Initially hidden

        return videoElement;
    }


    async function javdbActorInject(isDirector = false) {
        const personName = isDirector ? directorName : actorName;
        if (isJP18() && fetchJavDbFlag && personName.length > 0) {
            let insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection");

            let isCensored = item.Genres.includes("无码") ? false : true;

            // search actor name from javdb
            let [javDbMovies, actorUrl] = await fetchDbActor(personName, isCensored, isDirector);
            const personTypeText = isDirector ? '导演' : '演员';
            if (javDbMovies && javDbMovies.length > 0) {
                javDbMovies = await filterDbMovies(javDbMovies);
                if (javDbMovies.length == 0) return

                javDbMovies.sort(() => Math.random() - 0.5);
                /*
                if (javDbMovies.length > 10) {
                    javDbMovies = javDbMovies.slice(0, 10);
                }
                */
               /*
                let imgHtml2 = '';
                for (let i = 0; i < javDbMovies.length; i++) {
                    imgHtml2 += createItemContainerLarge(javDbMovies[i], i);
                };
                */
                let imgHtml2 = dbActorMoreHtml(javDbMovies);

                const directorText = isDirector ? ' (导演)' : '';

                const sliderElement2 = createSliderLarge(`${personName}${directorText} 更多作品（来自JavDB，共${javDbMovies.length}部）`, imgHtml2, actorUrl);
                const sectionId = isDirector ? 'myDbDirectorSlider' : 'myDbActorSlider'
                sliderElement2.id = sectionId;
                insertSection.insertAdjacentElement('beforebegin', sliderElement2);

                adjustCardOffset(`#${sectionId}`, '.itemsContainer', '.backdropCard');

                showToast({
                    text: `${personTypeText}更多作品=>加载成功`,
                    icon: `<span class="material-symbols-outlined">check_circle</span>`,
                    secondaryText: personName
                });

                return
            }
            showToast({
                text: `${personTypeText}更多作品=>加载失败`,
                icon: `<span class="material-symbols-outlined">search_off</span>`,
                secondaryText: personName
            });
        }

    }

    async function filterDbMovies(javDbMovies) {
        const results = await Promise.all(
            javDbMovies.map(movie => checkEmbyExist(movie.Code).then(exists => exists ? null : movie))
        );
        return results.filter(Boolean);
    }

    function adjustCardOffset(sectionStr, containerStr, cardStr) {
        const scrollerContainer = viewnode.querySelector(`div[is='emby-scroller']:not(.hide) ${sectionStr} ${containerStr}`);
        if (!scrollerContainer) return
        const portraitCards = scrollerContainer.querySelectorAll(cardStr);
        if (!scrollerContainer) return
        if (portraitCards.length > 0) {

            const cardWidth = portraitCards[0].offsetWidth; // Get width of the first card with padding and border
            const cardHeight = portraitCards[0].offsetHeight;
            const spacing = 0; // Spacing between cards (adjust as needed)
            const totalCardWidth = cardWidth + spacing;

            // Set min-width of scrollerContainer
            scrollerContainer.style.minWidth = `${portraitCards.length * totalCardWidth}px`;
            scrollerContainer.style.height = `${cardHeight}px`;

            for (let child of portraitCards) {
                child.style.left = `${child.previousElementSibling ? child.previousElementSibling.offsetLeft + totalCardWidth : 0}px`;
            }

        }
    }

    function adjustCardOffsets() {
        const sliders = [
            '#myActorMoreSlider',
            '#myDirectorMoreSlider',
            '#myDbActorSlider',
            '#myDbDirectorSlider',
            '#myDbSeriesSlider',
            '#mySimilarSlider'
        ];

        const container = '.itemsContainer';
        const item = '.virtualScrollItem';

        sliders.forEach(slider => {
            adjustCardOffset(slider, container, item);
        });
    }

    function isJP18() {
        return (item.CustomRating ?? item.OfficialRating) === 'JP-18+';
    }

    async function seriesInject() {
        if (!fetchJavDbFlag || !isJP18()) return;
        let seriesName, tagMovies, tagMovieIds, series;
        if (item.Type != 'BoxSet') {
            if (!isJP18()) return;
            const seriesAll = item.TagItems.filter(tag => tag.Name.startsWith("系列:"));
            if (seriesAll.length === 0) return;
            series = seriesAll[0];
            seriesName = getPartAfter(series.Name, ":").trim();
            [tagMovies, tagMovieIds] = await getTagMovies(series.Name);
        }
        else {
            seriesName = item.Name;
            tagMovies = await getCollectionMovies(item.Id);
        }

        let seriesName_jp;

        if (typeof OpenCC !== 'undefined' && typeof OpenCC.Converter === 'function') {
            const converter = OpenCC.Converter({ from: 'cn', to: 'jp' });
            seriesName_jp = converter(seriesName);
        } else {
            seriesName_jp = seriesName;
        }

        await waitForRandomTime();
        let [javDbMovies, seriesUrl, javdbSeries] = await fetchDbSeries(seriesName_jp.replace("%", ""));
        /*
        if (javDbMovies.length == 0) {
            await waitForRandomTime();
            javDbMovies = await fetchDbSeries(seriesName_tw);
        }
        if (javDbMovies.length == 0) {
            await waitForRandomTime();
            javDbMovies = await fetchDbSeries(seriesName);
        }
        */
        if (javDbMovies.length == 0) return

        if (javdbSeries.length > 0) {
            if (item.Type === 'BoxSet') {
                addLink(item.Overview || '', "===== 外部链接 =====", "JavDb", seriesUrl);
                if (item.Name != javdbSeries) {
                    item.Name = javdbSeries;
                    showToast({
                        text: "javdb系列名与本地不匹配",
                        icon: `<span class="material-symbols-outlined">rule</span>`,
                        secondaryText: javdbSeries
                    });
                    //ApiClient.updateItem(item);
                }
            } else if (tagMovies.length >= 4) {
                const collectionId = await getCollectionId(javdbSeries);
                if (collectionId.length == 0) {
                    const newCollectionId = await collectionCreate(javdbSeries, tagMovieIds);
                    if (newCollectionId.length > 0) {
                        showToast({
                            text: "合集创建成功",
                            icon: `<span class="material-symbols-outlined">add_notes</span>`,
                            secondaryText: javdbSeries
                        });
                    }
                } else {
                    const collectionMovies = await getCollectionMovies(collectionId);
                    if (tagMovies.length > collectionMovies.length) {
                        const extraMovies = tagMovies.filter(movie => !collectionMovies.includes(movie));
                        for (let extraMovie of extraMovies) {
                            let extraItem = await checkEmbyExist(extraMovie);
                            await ApiClient.addToList(ApiClient.getCurrentUserId(), 'BoxSet', collectionId, [extraItem.Id], null);
                            showToast({
                                text: "新作品加入合集",
                                icon: `<span class="material-symbols-outlined">docs_add_on</span>`,
                                secondaryText: extraItem.Name
                            });
                        }
                    }
                }
            }
        }

        tagMovies.length > 0 && (javDbMovies = javDbMovies.filter(movie => !tagMovies.some(tagMovie => tagMovie.includes(movie.Code))));
        if (javDbMovies.length == 0) {
            showToast({
                text: `javdb系列已全部下载`,
                icon: `<span class="material-symbols-outlined">download_done</span>`
            });
            return
        }

        item.Type !== 'BoxSet' && javDbMovies.sort(() => Math.random() - 0.5);
        let imgHtml2 = '';
        for (let i = 0; i < javDbMovies.length; i++) {
            let insertItem = await checkEmbyExist(javDbMovies[i].Code);
            if (insertItem) {
                if (item.Type != 'BoxSet') {
                    insertItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), insertItem.Id);
                    insertItem.TagItems.push(series);
                    ApiClient.updateItem(insertItem);
                } else {
                    //insertItemToCollection(insertItem.Id, item.Id);
                    await ApiClient.addToList(ApiClient.getCurrentUserId(), 'BoxSet', item.Id, [insertItem.Id], null);

                    showToast({
                        text: "新作品加入合集",
                        icon: `<span class="material-symbols-outlined">docs_add_on</span>`,
                        secondaryText: insertItem.Name
                    });
                }
                continue;
            }
            imgHtml2 += createItemContainerLarge(javDbMovies[i], i);
        };
        const seriesName_trans = await translateOnly(seriesName_jp);

        const sliderElement2 = createSliderLarge(`系列: ${seriesName} （${seriesName_trans}） 更多作品（来自JavDB，共${javDbMovies.length}部）`, imgHtml2, seriesUrl);
        sliderElement2.id = 'myDbSeriesSlider';

        let insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection");
        //!insertSection && (insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myActorMoreSlider"));
        //!insertSection && (insertSection = similarSection);

        insertSection.insertAdjacentElement('beforebegin', sliderElement2);
        showToast({
            text: "系列更多作品=>加载成功",
            icon: `<span class="material-symbols-outlined">check_circle</span>`,
            secondaryText: `系列: ${seriesName}`
        });

        if (item.Type != 'BoxSet') {
            adjustCardOffset('#myDbSeriesSlider', '.itemsContainer', '.backdropCard');
            addResizeListener();
        }
    }


    async function collectionCreate(collectionName, idsToAdd) {
        const data = await ApiClient.createList(ApiClient.getCurrentUserId(), 'BoxSet', collectionName, idsToAdd);
        if (data.Id) {
            console.log(`Collection successfully created: ${data.Id}`);
            return data.Id;
        } else {
            console.error('Collection creation failed.');
            return '';
        }
    }

    async function getCollectionId(collectionName) {
        const collections = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: "true",
                IncludeItemTypes: "BoxSet",
                SearchTerm: collectionName
            }
        );

        if (collections && Array.isArray(collections.Items)) {
            const matched = collections.Items.find(itemColl => itemColl.Name === collectionName);
            if (matched) {
                return matched.Id;
            }
        }
        return '';
    }


    async function checkEmbyExist(movie) {
        if (!movie) return null;
        const localMovie = addPrefix(movie);
        const movies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: "true",
                IncludeItemTypes: "Movie",
                SearchTerm: `${localMovie}`,
            }
        );
        if (movies && movies.Items.length > 0) return movies.Items[0];
        else return null;
    }

    function addPrefix(input) {

        // Iterate over the keys in the prefix dictionary
        for (const key in prefixDic) {
            // Check if the input starts with the current key
            if (input.startsWith(key)) {
                // Get the corresponding value from the dictionary
                const prefix = prefixDic[key];
                // Return the modified string
                return prefix + input;
            }
        }

        // If no key matches, return the original string
        return input;
    }


    function getActorName(isDirector = false) {
        const selector = `div[is='emby-scroller']:not(.hide) ${isDirector ? "#myDirectorMoreSlider" : "#myActorMoreSlider"} .sectionTitle-cards`;
        const h2Element = viewnode.querySelector(selector);

        if (h2Element) return getPartBefore(h2Element.textContent, " ");

        const personType = isDirector ? 'Director' : 'Actor';
        const actorNames = item.People?.filter(person => person.Type === personType).map(person => person.Name) || [];

        return actorNames.length ? pickRandomLink(actorNames) : '';
    }

    async function getActorMovies(name = actorName, excludeIds = []) {
        const actorMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie',
                Fields: 'ProductionYear,LocalTrailerCount,RemoteTrailers',
                Person: name,
            }
        );

        if (actorMoreMovies.Items.length > 0) {
            let moreItems = Array.from(actorMoreMovies.Items);
            if (name != actorName && excludeIds && excludeIds.length > 0) {
                moreItems = moreItems.filter(movie => !excludeIds.some(excludeId => movie.Id === excludeId));
            }

            moreItems = moreItems.filter(moreItem => moreItem.Id != item.Id);
            moreItems.sort(() => Math.random() - 0.5);
            if (moreItems.length > 12) {
                moreItems = moreItems.slice(0, 12);
            }
            return moreItems;
        } else {
            return []; // Return null or handle the failure case accordingly
        }
    }

    async function getTagMovies(tagName) {
        let tagMovieIds = [];
        const tagMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie',
                Tags: tagName
            }
        );

        if (tagMoreMovies?.Items?.length) {
            let moreItems = Array.from(tagMoreMovies.Items);
            const tagMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' '));
            tagMovieIds = moreItems.map(movie => movie.Id);
            //tagMovieIdStr = tagMovieIds.join(',');
            return [tagMovieNames, tagMovieIds];
        } else {
            return [null, tagMovieIds]; // Return null or handle the failure case accordingly
        }
    }

    async function getCollectionMovies(collectionId) {
        const tagMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie,Video',
                ParentId: collectionId
            }
        );
        if (tagMoreMovies?.Items?.length) {
            const { deleteVideos, keepMovies } = tagMoreMovies.Items.reduce((acc, movie) => {
                if (movie.Type === 'Video') acc.deleteVideos.push(movie);
                else if (movie.Type === 'Movie') acc.keepMovies.push(movie);
                return acc;
            }, { deleteVideos: [], keepMovies: [] });

            // Remove Videos from collection only if there are videos to delete
            if (deleteVideos.length) {
                await ApiClient.removeItemsFromCollection(collectionId, deleteVideos);
            }

            const tagMovieNames = keepMovies.map(movie => getPartBefore(movie.Name, ' '));

            return tagMovieNames.length ? tagMovieNames : null;
        }
        return null;
    }


    function getPartBefore(str, char) {
        return str.split(char)[0];
    }

    function getPartAfter(str, char) {
        const parts = str.split(char);
        return parts[parts.length - 1];
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


    const request = (url, method = "GET", options = {}) => {
        method = method ? method.toUpperCase().trim() : "GET";
        if (!url || !["GET", "HEAD", "POST"].includes(method)) return;

        const { responseType, headers = {} } = options;
        let requestOptions = { method, headers };

        return new Promise((resolve, reject) => {
            fetch(url, requestOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return responseType === "json" ? response.json() : response.text(); // Parse response based on responseType
                })
                .then(parsedResponse => {
                    resolve(parsedResponse);
                })
                .catch(error => {
                    reject(error);
                });
        });
    };

    function javdbNameMap(name) {
        if (!name) return "";
        const localName = nameMap[name] || getPartBefore(name, "（");
        return localName.replace(/・/g, "･");
    }

    async function fetchDbActor(javdbActorName, isCensored, isDirector = false) {
        const HOST = "https://javdb.com";
        const personType = isDirector ? 'director' : 'actor';
        const personName = javdbNameMap(javdbActorName);
        const urlCacheKey = `actorUrl_${javdbActorName}`;

        let actorUrl = localStorage.getItem(urlCacheKey);
        if (!actorUrl) {
            const url = `${HOST}/search?f=${personType}&locale=zh&q=${personName}`;
            let javdbActorData = await request(url);
            if (javdbActorData.length > 0) {
                const parser = new DOMParser();
                let parsedHtml = parser.parseFromString(javdbActorData, 'text/html');
                let actorLink = null;

                if (isDirector) {
                    const directorBoxes = parsedHtml.querySelectorAll('#directors .box');
                    actorLink = Array.from(directorBoxes).find(box =>
                        box.getAttribute('title')?.split(', ').includes(personName)
                    ) || null;
                } else {
                    actorLink = parsedHtml.querySelector('.box.actor-box a:first-of-type');
                    if (actorLink && !actorLink.getAttribute('title').split(', ').includes(personName)) {
                        let actorBoxs = parsedHtml.querySelectorAll('.box.actor-box');
                        for (let actorBox of actorBoxs) {
                            let actorLink_temp = actorBox.querySelector('a');
                            if (actorLink_temp.getAttribute('title').split(', ').includes(personName)) {
                                actorLink = actorLink_temp;
                                break;
                            }
                        }
                    }

                    // Get uncensored href
                    if (!isCensored) {
                        let actorLink_temp = null;
                        const infoElements = parsedHtml.querySelectorAll('.actors .box.actor-box .info');
                        if (infoElements.length > 0) {
                            for (let infoElement of infoElements) {
                                if (infoElement.textContent.includes("Uncensored") &&
                                    infoElement.closest("a").getAttribute('title').includes(personName)) {
                                    actorLink_temp = infoElement.closest("a");
                                    break;
                                }
                            }
                            if (!actorLink_temp && infoElements[0].textContent.includes("Uncensored")) {
                                actorLink_temp = infoElements[0].closest("a");
                            }
                        }
                        if (actorLink_temp) {
                            actorLink = actorLink_temp;
                        }
                    }
                }

                actorUrl = actorLink ? `${HOST}${actorLink.getAttribute('href')}` : null;

                if (!actorUrl) {
                    console.error(`${personType} link not found`);
                    const personInfo = await ApiClient.getPerson(javdbActorName, ApiClient.getCurrentUserId());
                    actorUrl = getUrl(personInfo.Overview, "===== 外部链接 =====", "JavDb");
                }

                if (actorUrl) {
                    localStorage.setItem(urlCacheKey, actorUrl); // Cache actor URL
                }
            }
        }

        if (!actorUrl) return [[], ''];

        // Wait for random time
        await waitForRandomTime();
        let javdbActorData = await request(actorUrl);
        if (javdbActorData.length > 0) {
            const itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailTextContainer .mediaInfoItems:not(.hide)");
            if (itemsContainer && OS_current != 'iphone' && OS_current != 'android') {
                const mediaInfoItem = itemsContainer.querySelectorAll('.mediaInfoItem:has(a)')[0];
                if (mediaInfoItem) {
                    addNewLinks(mediaInfoItem, [createNewLinkElement(`跳转至javdb ${personName}`, '#ADD8E6', actorUrl, personName)]);
                    mediaInfoStyle(mediaInfoItem);
                }
            }

            const parser = new DOMParser();
            let parsedHtml = parser.parseFromString(javdbActorData, 'text/html');

            const paginationList = parsedHtml.querySelector('.pagination-list');
            if (paginationList) {
                const pageLinks = [...paginationList.querySelectorAll('a.pagination-link')].map(link => `${HOST}${link.getAttribute('href')}`);

                const pickLink = pickRandomLink(pageLinks);
                if (pickLink !== actorUrl) {
                    await waitForRandomTime();
                    javdbActorData = await request(pickLink);
                    if (javdbActorData.length > 0) {
                        parsedHtml = parser.parseFromString(javdbActorData, 'text/html');
                    }
                }
            }
            const movies = [];

            // Iterate over each item within the "movie-list"
            const DBitems = parsedHtml.querySelectorAll('.movie-list .item');
            arrangeDBitems(DBitems, movies);
            return [movies, actorUrl];
        }

        return [[], ''];
    }

    function getUrl(text, sectionHeader, key) {
        if (!text || !sectionHeader || !key) {
            console.error("Invalid input. Make sure text, sectionHeader, and key are provided.");
            return null;
        }

        // Split the text into lines
        var lines = text.trim().split('<br>');

        // Find the start of the section header
        var startIndex = lines.findIndex(line => line.includes(sectionHeader));
        if (startIndex === -1) {
            console.log(`Section header "${sectionHeader}" not found.`);
            return null;
        }

        // Iterate through the lines after the section header to find the key
        for (let i = startIndex + 1; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line === '') {
                continue; // Skip empty lines
            }
            if (line.includes(key)) {
                // Split the line by ':' and return the URL (value)
                var parts = line.split(':');
                if (parts.length > 1) {
                    return parts.slice(1).join(':').trim(); // Return URL
                }
            }
        }

        // Return null if the key is not found
        console.log(`Key "${key}" not found after section "${sectionHeader}".`);
        return null;
    }

    function addLink(text, startLine, newKey, newValue) {
        if (!startLine || !newKey || !newValue) {
            console.error("Invalid input. Make sure text, startLine, newKey, and newValue are provided.");
            return;
        }

        // Split the text into lines
        var lines = text.trim().split('<br>');

        // Find the section header
        var startIndex = lines.findIndex(line => line.includes(startLine));

        if (startIndex === -1) {
            // Section header doesn't exist; add it at the bottom
            lines.push(startLine);
            startIndex = lines.length - 1; // Update the index to the new header position
        }

        // Check if the newKey already exists in the section
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i].trim() === '' || lines[i].includes('=====')) {
                break; // Stop checking at the end of the section
            }
            if (lines[i].startsWith(`${newKey}:`)) {
                console.log(`The key "${newKey}" already exists. Skipping addition.`);
                return; // Return original text without changes
            }
        }

        // Find the end of the section
        var insertIndex = startIndex + 1;
        while (insertIndex < lines.length && lines[insertIndex].trim() !== '' && !lines[insertIndex].includes('=====')) {
            insertIndex++;
        }

        // Insert the new link at the bottom of the section
        lines.splice(insertIndex, 0, `${newKey}: ${newValue}`);

        // Join the lines back together
        const newOverview = lines.join('<br>');
        item.Overview = newOverview;
        ApiClient.updateItem(item);
        setTimeout(() => {
            javdbTitle();
        }, 1000);

    }

    function injectLinks() {
        if (!isJP18() || !fetchJavDbFlag || item.Type === 'Person') return;

        const aboutSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection");
        const linksSection = aboutSection.querySelector(".linksSection");
        if (!linksSection) return
        const itemLinks = linksSection.querySelector('.itemLinks');
        const links = extractLinks(item.Overview || '', '===== 外部链接 =====');
        if (Object.keys(links).length === 0) return
        const linkKeys = Object.keys(links);
        aboutSection.classList.remove('hide');
        linksSection.classList.remove('hide');
        linkKeys.forEach(function (key, index) {
            var value = links[key];

            // Check if key is 'TheMovieDb' and if itemLinks already contains 'MovieDb'
            if (key === 'TheMovieDb' && Array.from(itemLinks.children).some(a => a.textContent.trim() === 'MovieDb')) {
                return; // Skip inserting 'TheMovieDb'
            }

            // Create the anchor element
            var linkButton = document.createElement("a");
            linkButton.setAttribute("is", "emby-linkbutton");
            linkButton.setAttribute("class", "button-link button-link-color-inherit button-link-fontweight-inherit nobackdropfilter emby-button");
            linkButton.setAttribute("href", value);
            linkButton.setAttribute("target", "_blank");
            //linkButton.style.color = 'yellow'; 
            if (index === 0 && (itemLinks.children.length == 0)) {
                linkButton.textContent = key;
            } else {
                linkButton.textContent = key + ',';
            }

            // Insert the anchor element at the beginning of itemLinks
            itemLinks.insertAdjacentElement('afterbegin', linkButton);
        });

        function extractLinks(text, startLine) {
            if (!text || text.length == 0 || !text.includes('===== 外部链接 =====')) {
                return {};
            }

            // Split the text into lines
            var lines = text.trim().split('<br>');

            // Object to store the links
            var links = {};

            // Flag to indicate when to start extracting links
            var canExtract = false;

            // Iterate through each line and extract the link if extraction is allowed
            lines.forEach(function (line) {
                if (canExtract) {
                    // Split the line by ":"
                    var parts = line.split(':');

                    // Extract the key and value (link)
                    var key = parts[0].trim();
                    var value = parts.slice(1).join(':').trim();

                    // Store the key-value pair in the links object
                    links[key] = value;
                } else if (line.includes(startLine)) {
                    // Set the flag to start extracting links from the next line
                    canExtract = true;
                }
            });

            return links;
        }
    }

    function waitForRandomTime() {
        const minWaitTime = 500;
        const maxWaitTime = 1500;

        const randomWaitTime = Math.random() * (maxWaitTime - minWaitTime) + minWaitTime;

        return new Promise(resolve => {
            setTimeout(() => {
                //console.log("Waited for", randomWaitTime / 1000, "seconds");
                resolve(); // Signal that the promise is completed
            }, randomWaitTime);
        });
    }

    async function fetchDbSeries(seriesName) {
        const movies = [];
        let seriesUrl = null;
        let javdbSeries = '';
        let javdbData = '', parsedHtml = '';
        const HOST = "https://javdb.com";
        const url = `${HOST}/search?q=${seriesName}&f=series`;
        const parser = new DOMParser();

        if (item.Type === 'BoxSet') {
            seriesUrl = getUrl(item.Overview, "===== 外部链接 =====", "JavDb");
        } else {
            seriesUrl = localStorage.getItem(`seriesUrl_${seriesName}`);
        }

        if (!seriesUrl) {
            javdbData = await request(url);
            if (javdbData.length === 0) return [movies, seriesUrl, javdbSeries];

            // Parse the HTML data string
            parsedHtml = parser.parseFromString(javdbData, 'text/html');
            const seriesContainer = parsedHtml.getElementById('series');

            // Check if the container exists
            if (seriesContainer) {
                // Find the first anchor tag within the container
                const seriesLinks = seriesContainer.querySelectorAll('a');
                let firstAnchor;
                for (const link of seriesLinks) {
                    const movieCountText = link.querySelector('span').textContent;
                    const movieCount = parseInt(movieCountText.match(/\((\d+)\)/)[1]);

                    if (movieCount > 0) {
                        let seriesTitle = link.querySelector('strong').textContent;
                        if (!firstAnchor || seriesTitle === seriesName) firstAnchor = link;
                    }
                }

                if (firstAnchor) {
                    //javdbSeries = firstAnchor.querySelector('strong').textContent;
                    seriesUrl = `${HOST}${firstAnchor.getAttribute('href')}`;
                    await waitForRandomTime();
                }
            }
        }

        if (!seriesUrl) return [movies, seriesUrl, javdbSeries];

        // Cache seriesUrl in localStorage if item.Type !== 'BoxSet'
        if (item.Type !== 'BoxSet') {
            localStorage.setItem(`seriesUrl_${seriesName}`, seriesUrl);
        }

        javdbData = await request(seriesUrl);
        if (javdbData.length === 0) return [movies, seriesUrl, javdbSeries];


        const itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailTextContainer .mediaInfoItems:not(.hide)");
        if (itemsContainer && OS_current !== 'iphone' && OS_current !== 'android') {
            const mediaInfoItem = itemsContainer.querySelectorAll('.mediaInfoItem:has(a)')[0];
            if (mediaInfoItem) {
                if (item.Type !== 'BoxSet') {
                    addNewLinks(mediaInfoItem, [createNewLinkElement(`跳转至javdb ${seriesName}`, '#ADD8E6', seriesUrl, seriesName)]);
                    mediaInfoStyle(mediaInfoItem);
                }
            }
        }

        parsedHtml = parser.parseFromString(javdbData, 'text/html');
        javdbSeries = parsedHtml.querySelector('.section-name').textContent;

        const paginationList = parsedHtml.querySelector('.pagination-list');
        if (paginationList && item.Type === 'BoxSet') {
            const pageLinks = [...paginationList.querySelectorAll('a.pagination-link')].map(link => `${HOST}${link.getAttribute('href')}`);

            for (const link of pageLinks) {
                if (link !== seriesUrl) {
                    await waitForRandomTime();
                    javdbData = await request(link);
                    if (javdbData.length > 0) {
                        let parsedHtmlTemp = parser.parseFromString(javdbData, 'text/html');
                        let DBitemsTemp = parsedHtmlTemp.querySelectorAll('.movie-list .item');
                        arrangeDBitems(DBitemsTemp, movies);
                    }
                }
            }
        }

        const DBitems = parsedHtml.querySelectorAll('.movie-list .item');
        arrangeDBitems(DBitems, movies);

        return [movies, seriesUrl, javdbSeries];
    }

    function arrangeDBitems(DBitems, movies) {
        if (!DBitems) return null;
        DBitems.forEach(DBitem => {
            const link = DBitem.querySelector('a').getAttribute('href');
            const name = DBitem.querySelector('a').getAttribute('title');
            const code = DBitem.querySelector('.video-title strong').textContent;
            const imgSrc = DBitem.querySelector('img').getAttribute('src');
            const time = DBitem.querySelector('.meta').textContent.trim(); // Extracts the time from the meta
            const score = DBitem.querySelector('.score .value').textContent.trim(); // Extracts the score from the score text

            // Add the movie information to the array
            movies.push({ Link: link, Name: name, Code: code, ImgSrc: imgSrc, Time: time, Score: score });
        });
    }


    // Function to randomly pick a link from the array
    function pickRandomLink(linksArray) {
        // Check if the array is not empty
        if (linksArray.length > 0) {
            // Generate a random index within the array length
            const randomIndex = Math.floor(Math.random() * linksArray.length);
            // Return the link at the random index
            return linksArray[randomIndex];
        } else {
            return null; // Return null if the array is empty
        }
    }

    function containsJapanese(text) {
        // Regular expression to match Japanese characters
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;

        return japaneseRegex.test(text);
    }

    async function translateInject() {
        if ((OS_current === 'iphone') || (OS_current === 'android') || (googleApiKey.length == 0) || item.Type === 'Person') return;

        // Select the element using document.querySelector
        const titleElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .itemName-primary");
        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");

        // Check if the element is found
        if (titleElement) {
            if (containsJapanese(item.Name)) {
                const buttonhtml = createButtonHtml('myTranslate', '翻译标题', `<span class="material-symbols-outlined">language</span>`, '翻译标题');

                mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
                const myTranslate = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myTranslate");
                myTranslate.onclick = translateJapaneseToChinese;
            }
        } else {
            console.log('titleElement not found');
        }

        const divElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .overview-text.readOnlyContent");

        if (divElement && item.Type != 'BoxSet') {
            if (containsJapanese(item.Overview)) {
                const buttonhtml2 = createButtonHtml('myTranslate2', '翻译详情', `<span class="material-symbols-outlined">language</span>`, '翻译详情');
                mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml2);
                const myTranslate2 = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myTranslate2");
                myTranslate2.onclick = translateJapaneseToChinese2;
            }
        }
    }


    async function translateOnly(text) {
        if (googleApiKey.length === 0) { return text; }
        const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
        let text_jp = (googleTranslateLanguage === 'ja' && typeof OpenCC !== 'undefined' && typeof OpenCC.Converter === 'function')
            ? OpenCC.Converter({ from: 'cn', to: 'jp' })(text)
            : text;

        let response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text_jp,
                source: googleTranslateLanguage,
                target: 'zh-CN', // Chinese (Simplified)
                format: 'text',
                profanityFilter: false, // Disable profanity filter
            }),
        });

        let data = await response.json();
        if (data && data.data && data.data.translations && data.data.translations.length > 0) {
            let translatedText = data.data.translations[0].translatedText;
            return translatedText
        } else {
            throw new Error('Translation failed');
        }

    }

    async function translateJapaneseToChinese() {
        const titleElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .itemName-primary");
        if (!titleElement) return
        // Get the text content of the element
        let text = item.Name;

        const translatedText = await translateOnly(text);
        if (translatedText.length > 0) {
            titleElement.textContent = translatedText; // Replace titleElement text with translated text
            item.Name = translatedText;
            (item.Type != 'BoxSet') && ApiClient.updateItem(item);
            showToast({
                text: '翻译成功',
                icon: `<span class="material-symbols-outlined">fact_check</span>`
            });

            const myTranslate = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myTranslate");
            myTranslate.style.color = 'green';
            myTranslate.classList.add('melt-away');
            setTimeout(() => {
                myTranslate.style.display = 'none';
                javdbTitle();
            }, 1000);

        }
    }

    async function translateJapaneseToChinese2() {
        const divElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .overview-text.readOnlyContent");

        if (!divElement) return
        let text = item.Overview;

        const translatedText = await translateOnly(text);

        if (translatedText.length > 0) {
            divElement.textContent = translatedText; // Replace titleElement text with translated text
            item.Overview = translatedText;
            ApiClient.updateItem(item);
            showToast({
                text: '翻译成功',
                icon: `<span class="material-symbols-outlined">fact_check</span>`
            });
            const myTranslate = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myTranslate2");
            myTranslate.style.color = 'green';
            myTranslate.classList.add('melt-away');
            setTimeout(() => {
                myTranslate.style.display = 'none';
                javdbTitle();
            }, 1000);
        }
    }


    function translatePath(linuxPath) {
        return linuxPath;
    }

})();
