// emby detail page

(function () {
    "use strict";

    

    //config
    const show_pages = ["Movie"];
    /* page item.Type "Person" "Movie" "Series" "Season" "Episode" "BoxSet" so. */

    const javDbFlag = true;
    // fetch data form Javdb.com and display in detail page. Only support movies that has CustomRating === 'JP-18+' or OfficialRating === 'JP-18+'

    const googleTranslateLanguage = 'ja';
    // put language to translate from (ja for Japanese) to Chinese. Leave '' to support any language


    var item, actorName, directorName, actorMovieNames, viewnode, paly_mutation;

    var fetchJavDbFlag = javDbFlag;
    // monitor dom changements
    document.addEventListener("viewbeforeshow", function (e) {
        paly_mutation?.disconnect();
        if (e.detail.contextPath.startsWith("/item?id=")) {
            if (!e.detail.isRestored) {
                const mutation = new MutationObserver(async function () {
                    viewnode = e.target;
                    item = viewnode.controller?.currentItem;
                    if (item) {
                        mutation.disconnect();

                        fetchJavDbFlag = (ApiClient.getCurrentUserId() === adminUserId) ? javDbFlag : false;
                        
                        if (showFlag()) {
                            init();
                        } else if (item.Type == 'BoxSet') {
                            translateInject();
                            seriesInject();
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
                if (showFlag()) {
                    actorName = getActorName();
                    directorName = getDirectorName();
                    fetchJavDbFlag = (ApiClient.getCurrentUserId() === adminUserId) ? javDbFlag : false;
                    setTimeout(() => {
                        javdbTitle();
                        adjustCardOffsets();
                    }, 500);
                }
            }
        }
    });

    function moveTopDown() {
        const topMain = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .topDetailsMain");
        if (topMain) {
            const distanceFromTop = topMain.getBoundingClientRect().top + window.scrollY;
            const height = topMain.offsetHeight;
            const moveDownBy = window.innerHeight - height - distanceFromTop;

            topMain.style.paddingTop = `${moveDownBy}px`;
            /*
            const topDetailsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .topDetailsContainer");
            
            // Add double-click event listener
            topDetailsContainer.addEventListener('dblclick', () => {

                // Set initial paddingTop with transition
                topMain.style.transition = 'padding-top 0.5s ease';
                // Parse current paddingTop as a float for comparison
                const currentPadding = parseFloat(topMain.style.paddingTop) || 0;

                // Toggle between `moveDownBy` and `moveDownBy + height`
                if (Math.abs(currentPadding - moveDownBy) < 0.1) { // Allow for small floating-point differences
                    topMain.style.paddingTop = `${moveDownBy + height}px`;
                } else {
                    topMain.style.paddingTop = `${moveDownBy}px`;
                }
            });
            */
        }
    }

    async function init() {
        javdbTitle();
        //buttonInit();

        await previewInject();
        modalInject();

        const excludeIds = await actorMoreInject();
        directorMoreInject(excludeIds);

        translateInject();
        javdbButtonInit();
    }


    function showFlag() {
        for (let show_page of show_pages) {
            if (item.Type == show_page) {
                return true;
            }
        }
        return false;
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

    function javdbTitle() {
        const showJavDbFlag = (item.CustomRating && item.CustomRating === 'JP-18+') || (item.OfficialRating && item.OfficialRating === 'JP-18+');
        if (!showJavDbFlag || !fetchJavDbFlag || item.Type == 'BoxSet') return

        const titleElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .itemName-primary");
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
                    secondaryText: code
                });
            });

            return link;
        }

        if (OS_current == 'iphone') return

        const noNumCode = code.replace(/^\d+(?=[A-Za-z])/, '');

        const newLinks = [];

        newLinks.push(createNewLinkElement('搜索 javdb.com', 'pink', `https://javdb.com/search?q=${code}&f=all`, 'javdb'));
        newLinks.push(createNewLinkElement('搜索 javbus.com', 'red', `https://www.javbus.com/${code}`, 'javbus'));
        newLinks.push(createNewLinkElement('搜索 javlibrary.com', 'rgb(191, 96, 166)', `https://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${code}`, 'javlibrary'));


        if (item.Genres.includes("无码")) {
            if (/^n\d{4}$/.test(code)) {
                newLinks.push(createNewLinkElement('搜索 tokyohot', 'red', 'https://my.tokyo-hot.com/product/?q=' + code.toLowerCase() + '&x=0&y=0', 'tokyohot'));
            } else if (/^\d+-\d+$/.test(code)) {
                newLinks.push(createNewLinkElement('搜索 caribbean', 'green', 'https://www.caribbeancom.com/moviepages/' + code.toLowerCase() + '/index.html', 'caribbean'));
            } else if (/^\d+_\d+$/.test(code)) {
                newLinks.push(createNewLinkElement('搜索 1pondo', 'rgb(230, 95, 167)', 'https://www.1pondo.tv/movies/' + code.toLowerCase() + '/', '1pondo'));
            } else if (code.toLowerCase().includes('heyzo')) {
                const extractBetweenTildes = str => str ? (str.match(/～(.*?)～/) || [str, str])[1] : null;
                const originalTitle = getPartAfter(item.OriginalTitle, ' ');
                const heyzoTitle = extractBetweenTildes(originalTitle);
                newLinks.push(createNewLinkElement('搜索 heyzo', 'pink', 'https://m.heyzo.com/search/' + heyzoTitle + '/1.html', 'heyzo'));
            } else {
                newLinks.push(createNewLinkElement('搜索 ave', 'red', 'https://www.aventertainments.com/search_Products.aspx?languageID=1&dept_id=29&keyword=' + code + '&searchby=keyword', 'ave'));
            }

        } else if (item.Genres.includes("VR")) {
            newLinks.push(createNewLinkElement('搜索 dmm.co.jp', 'red', 'https://www.dmm.co.jp/digital/videoa/-/list/search/=/device=vr/?searchstr=' + code.toLowerCase().replace("-", "00"), 'dmm'));
            const modifyCode = (noNumCode.startsWith("DSVR") && /^\D+-\d{1,3}$/.test(code)) ? "3" + code : code;
            newLinks.push(createNewLinkElement('搜索 jvrlibrary.com', 'lightyellow', `https://jvrlibrary.com/jvr?id=` + modifyCode, 'jvrlibrary'));
        } else {
            newLinks.push(createNewLinkElement('搜索 7mmtv.sx', 'rgb(225, 125, 190)', `https://7mmtv.sx/zh/searchform_search/all/index.html?search_keyword=${code}&search_type=searchall&op=search`, '7mmtv'));
            newLinks.push(createNewLinkElement('搜索 dmm.co.jp', 'red', 'https://www.dmm.co.jp/mono/-/search/=/searchstr=' + code.toLowerCase() + '/', 'dmm'));
            newLinks.push(createNewLinkElement('搜索 javsubtitled.com', 'rgb(149, 221, 49)', 'https://javsubtitled.com/zh/search?keywords=' + code, 'javsubtitled'));
        }

        if (!viewnode.querySelector("div[is='emby-scroller']:not(.hide) .btnPlayTrailer:not(.hide)")) {
            newLinks.push(createNewLinkElement('搜索 javtrailers', 'red', 'https://javtrailers.com/search/' + noNumCode, 'javtrailers'));
        }

        newLinks.push(createNewLinkElement('搜索 subtitlecat.com', 'rgb(255, 191, 54)', `https://www.subtitlecat.com/index.php?search=` + noNumCode, 'subtitlecat'));

        let itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailTextContainer .mediaInfoItems:not(.hide)");
        if (itemsContainer) {
            let mediaInfoItem = itemsContainer.querySelector('.mediaInfoItem[style="white-space:normal;"]');
            if (mediaInfoItem) {
                addNewLinks(mediaInfoItem, newLinks);
                mediaInfoStyle(mediaInfoItem);
                timeLength();
                tagInsert(mediaInfoItem);
            }
        } else {
            paly_mutation = new MutationObserver(function () {
                let itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailTextContainer .mediaInfoItems:not(.hide)");
                if (itemsContainer) {
                    let mediaInfoItem = itemsContainer.querySelector('.mediaInfoItem[style="white-space:normal;"]');
                    if (mediaInfoItem) {
                        paly_mutation.disconnect();
                        addNewLinks(mediaInfoItem, newLinks);
                        mediaInfoStyle(mediaInfoItem);
                        timeLength();
                        tagInsert(mediaInfoItem);
                        moveTopDown();
                    }
                }
            });
            paly_mutation.observe(viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailTextContainer"), {
                childList: true,
                characterData: true,
                subtree: true,
            });
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

    function createButtonHtml(id, title, icon, text) {
        return `
            <button id="${id}" is="emby-button" type="button" class="detailButton raised emby-button detailButton-stacked" title="${title}">              
                <i class="md-icon md-icon-fill button-icon button-icon-left autortl icon-Copy">${icon}</i>
                <span class="button-text">${text}</span>
            </button>
        `;
    }

    function buttonInit() {
        //removeExisting('embyCopyUrl');
        if (OS_current != 'windows') return;
        const itemPath = translatePath(item.Path);
        const itemFolderPath = itemPath.substring(0, itemPath.lastIndexOf('\\'));

        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");

        const buttonhtml = createButtonHtml('embyCopyUrl', `复制所在文件夹路径: ${itemFolderPath}`, '\uf0c5', '复制路径');
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
        const showJavDbFlag = (item.CustomRating && item.CustomRating === 'JP-18+') || (item.OfficialRating && item.OfficialRating === 'JP-18+');
        if (!showJavDbFlag || !fetchJavDbFlag) return;

        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        const buttonhtml = createButtonHtml('injectJavdb', '加载javdb.com数据', `<i class="fa-solid fa-magnifying-glass"></i>`, 'javdb');

        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        const javInjectButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #injectJavdb");
        javInjectButton.classList.add('injectJavdb');

        javInjectButton.addEventListener('click', async () => {
            showToast({
                text: 'javdb资源=>搜索中。。。',
                icon: `<i class="fa-solid fa-magnifying-glass"></i>`
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

    // Function to fetch JSON data from a URL
    /*
    async function fetchJsonData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const jsonData = await response.json();
            return jsonData;
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            return null;
        }
    }
    */


    // Function to copy text to clipboard
    function copyTextToClipboard(text) {
        // Create a temporary textarea element
        let textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px'; // Move the textarea off-screen

        // Append the textarea to the body
        document.body.appendChild(textarea);

        // Select and copy the text
        textarea.select();
        let success = document.execCommand('copy');

        // Clean up: remove the textarea from the DOM
        document.body.removeChild(textarea);

        // Handle success or failure
        if (success) {
            console.log(`Copied to clipboard: ${text}`);
        } else {
            console.error('Failed to copy to clipboard');
        }
    }


    function createBanner(text, html) {
        const margin = window.innerWidth * 0.035;
        const banner = `
		    <div class="verticalSection verticalSection-cards">
			    <div class="sectionTitleContainer padded-left padded-left-page padded-right sectionTitleContainer-cards focusable" data-focusabletype="nearest">
                    <h2 class="sectionTitle sectionTitle-cards">
                        <span>${text}</span>
                    </h2>
                </div>
			    ${html}
		    </div>`;
        return banner
    }

    function createSlider(text, html, isActor = 1) {
        const titleText = isActor ? `${text} 其他作品` : `${text}（导演） 其他作品`;
        const slider = `
            <div class="verticalSection verticalSection-cards actorMoreSection emby-scrollbuttons-scroller" bis_skin_checked = "1" >
                <div is="emby-scrollbuttons" class="emby-scrollbuttons" bis_skin_checked="1">
                    <div class="scrollbuttoncontainer scrollbuttoncontainer-backwards hide" bis_skin_checked="1">
                        <button id="myBackScrollButton" tabindex="-1" type="button" is="paper-icon-button-light" data-ripple="false" data-direction="backwards" class="emby-scrollbuttons-scrollbutton paper-icon-button-light">
                            <i class="md-icon autortl"></i>
                        </button>
                    </div>
                    <div class="scrollbuttoncontainer scrollbuttoncontainer-forwards hide" bis_skin_checked="1">
                        <button id="myForwardScrollButton" tabindex="-1" type="button" is="paper-icon-button-light" data-ripple="false" data-direction="forwards" class="emby-scrollbuttons-scrollbutton paper-icon-button-light">
                            <i class="md-icon autortl"></i>
                        </button>
                    </div>
                </div>
                <h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">${titleText}</h2>
                <div is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right scrollX hiddenScrollX scrollFrameX" data-mousewheel="false" data-focusscroll="true" data-horizontal="true" bis_skin_checked="1">

                    <div is="emby-itemscontainer" class="scrollSlider focuscontainer-x itemsContainer focusable actorMoreItemsContainer scrollSliderX emby-scrollbuttons-scrollSlider virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller" data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid" bis_skin_checked="1" style="white-space: nowrap; min-width: 2412px; height: 351px;" data-minoverhang="1" layout="horizontal-grid">
                        ${html}
                    </div>
                </div>
            </div>
        `;

        return slider;
    }

    function createSliderLarge(text, html, linkUrl) {
        let slider;
        if (item.Type != 'BoxSet') {
            slider = `
            <div class="verticalSection verticalSection-cards section1 emby-scrollbuttons-scroller" bis_skin_checked="1">
                <div is="emby-scrollbuttons" class="emby-scrollbuttons" bis_skin_checked="1">
                    <div class="scrollbuttoncontainer scrollbuttoncontainer-backwards hide" bis_skin_checked="1">
                        <button tabindex="-1" type="button" is="paper-icon-button-light" data-ripple="false" data-direction="backwards" class="emby-scrollbuttons-scrollbutton paper-icon-button-light">
                            <i class="md-icon autortl"></i>
                        </button>
                    </div>
                    <div class="scrollbuttoncontainer scrollbuttoncontainer-forwards hide" bis_skin_checked="1">
                        <button tabindex="-1" type="button" is="paper-icon-button-light" data-ripple="false" data-direction="forwards" class="emby-scrollbuttons-scrollbutton paper-icon-button-light">
                            <i class="md-icon autortl"></i>
                        </button>
                    </div>
                </div>
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
            slider = `
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

        return slider
    }

    function createItemContainer(itemInfo, increment) {
        let distance, imgUrl, typeWord;
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || ApiClient.getCurrentUserId() != adminUserId) {
            distance = OS_current === 'ipad' ? 182 : OS_current === 'iphone' ? 120 : 200;
            imgUrl = ApiClient.getImageUrl(itemInfo.Id, { type: "Primary", tag: itemInfo.ImageTags.Primary, maxHeight: 330, maxWidth: 220 });
            typeWord = 'portrait';

        } else {
            distance = OS_current === 'ipad' ? 260 : OS_current === 'iphone' ? 300 : 350;
            imgUrl = ApiClient.getImageUrl(itemInfo.Id, { type: "Thumb", tag: itemInfo.ImageTags.Thumb, maxHeight: 360, maxWidth: 640 });
            typeWord = 'backdrop';
        }

        let code = itemInfo.ProductionYear;
        let name = itemInfo.Name;

        const itemContainer = `
            <div data-id="${itemInfo.Id}" class="virtualScrollItem card ${typeWord}Card card-horiz ${typeWord}Card-horiz card-hoverable card-autoactive" tabindex="0" draggable="false" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
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

    function createItemContainerLarge(itemInfo, increment) {
        let distance = OS_current === 'ipad' ? 260 : OS_current === 'iphone' ? 300 : 350;
        const imgUrl = itemInfo.ImgSrc;
        const title = `${itemInfo.Code} ${itemInfo.Name}`;
        const link = `https://javdb.com${itemInfo.Link}?locale=zh`;
        const score = itemInfo.Score;
        const time = itemInfo.Time;
        let itemContainer;
        if (item.Type != 'BoxSet') {
            itemContainer = `
            <div class="virtualScrollItem card backdropCard card-horiz backdropCard-horiz card-hoverable card-autoactive" tabindex="0" draggable="true" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded" bis_skin_checked="1">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop myCardImage">
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
            <div class="card backdropCard card-horiz backdropCard-horiz card-hoverable card-autoactive" tabindex="0" draggable="true">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop myCardImage">  
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

    async function previewInject() {
        if ((OS_current === 'iphone') || (OS_current === 'android')) return;

        if (item.BackdropImageTags.length === 0) return;

        const images = await ApiClient.getItemImageInfos(item.Id);
        const backdrops = images.filter(image => image.ImageType === "Backdrop");

        const uniqueBackdrops = [];
        const seenFilenames = new Set();

        backdrops.forEach((backdrop) => {
            // Check for duplicate filenames
            if (!seenFilenames.has(backdrop.Filename)) {
                seenFilenames.add(backdrop.Filename);
                uniqueBackdrops.push(backdrop);
            }
        });

        uniqueBackdrops.sort((a, b) => {
            // Always prioritize the item with ImageIndex = 0
            if (a.ImageIndex === 0) return -1;
            if (b.ImageIndex === 0) return 1;
        
            // Function to extract the numeric part from the filename
            const extractNumber = (filename) => {
                const match = filename.match(/\d+/); // Find the first number in the filename
                return match ? parseInt(match[0], 10) : 0; // Convert to number or default to 0
            };
        
            const numA = extractNumber(a.Filename);
            const numB = extractNumber(b.Filename);
        
            // Sort based on the extracted number
            if (numA !== numB) {
                return numA - numB;
            }
        
            // Fallback to lexicographical order for filenames
            return a.Filename.localeCompare(b.Filename);
        });

        const peopleSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .peopleSection");
        if (!peopleSection) return;

        let isCollapsed = uniqueBackdrops.length > 20;
        let html = `<div id="myFanart" class="imageSection itemsContainer focuscontainer-x padded-left padded-left-page padded-right vertical-wrap" 
                    style="${isCollapsed ? `max-height: ${0.81 * window.innerHeight + 56}px; overflow: hidden;` : ''}">`;

        for (let index = 0; index < uniqueBackdrops.length; index++) {
            let tagIndex = uniqueBackdrops[index].ImageIndex;
            let filename = uniqueBackdrops[index].Filename; // Get the filename
            let url = ApiClient.getImageUrl(item.Id, { type: "Backdrop", index: tagIndex, tag: item.BackdropImageTags[tagIndex] });
        
            // Add the filename as a data attribute
            html += `<img class='my-fanart-image' src="${url}" alt="${index}" loading="lazy" data-filename="${filename}" />`;
        }
        html += `</div>`;

        // Add the toggle button if images exceed 30
        if (isCollapsed) {
            html += `
                <button id="toggleFanart" style="margin-top: 10px; display: block;">
                    ▼ 显示剧照(共${uniqueBackdrops.length}张) ▼
                </button>
            `;
        }

        const banner = createBanner("剧照", html);
        peopleSection.insertAdjacentHTML("afterend", banner);

        // Add event listener for the toggle button
        if (isCollapsed) {
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

    function modalInject() {
        //removeExisting('myModal');
        if ((OS_current === 'iphone') || (OS_current === 'android')) return
        // Detect if the device is touch-enabled
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
        var fanartSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .imageSection");
        if (!fanartSection) return

        var fanartImages = fanartSection.querySelectorAll(".my-fanart-image");
        if (!fanartImages) return

        let modal = document.getElementById('myModal');
        if (!modal) {
            modal = createModal();
            attachEventListeners(isTouchDevice);
        }

        const modalImg = modal.querySelector('.modal-content');
        const modalCaption = modal.querySelector('.modal-caption');
        const closeButton = modal.querySelector('.close');
        const prevButton = modal.querySelector('.prev');
        const nextButton = modal.querySelector('.next');


        // Add a single event listener for all images
        fanartSection.addEventListener(isTouchDevice ? 'touchstart' : 'click', handleTapOrClick);

        let tapTimeout = null;  // Timeout for double-tap detection
        let lastTapTime = 0;    // Time of the last tap

        function handleTapOrClick(event) {
            const target = event.target;
            const triggerTime = 500;

            // Check if the tapped/clicked element is a fanart image
            if (target.classList.contains('my-fanart-image')) {
                const index = Array.from(fanartSection.querySelectorAll('.my-fanart-image')).indexOf(target);

                if (isTouchDevice) {
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
                    icon: "&#10095;",
                    iconStrikeThrough: true
                })
                resetImageStyles();
                return
            }
            modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            modalImg.style.transform = 'translateX(-100%)';
            modalImg.style.opacity = '0';
            setTimeout(() => {
                myShowImage(newIndex);
                modalImg.style.transition = 'transform 0s ease, opacity 0s ease'; // Remove transition temporarily
                modalImg.style.transform = 'translateX(100%)'; // Jump to the right
                setTimeout(() => {
                    modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                    modalImg.style.transform = 'translateX(0)'; // Swipe back to the middle
                    modalImg.style.opacity = '1';
                    modalImg.style.transform = `scale(1)`;
                }, 10); // Delay to ensure transition reset
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
                    icon: "&#10094;",
                    iconStrikeThrough: true
                })
                resetImageStyles();
                return
            }
            modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            modalImg.style.transform = 'translateX(100%)';
            modalImg.style.opacity = '0';
            setTimeout(() => {
                myShowImage(newIndex);
                modalImg.style.transition = 'transform 0s ease, opacity 0s ease'; // Remove transition temporarily
                modalImg.style.transform = 'translateX(-100%)'; // Jump to the left
                setTimeout(() => {
                    modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                    modalImg.style.transform = 'translateX(0)'; // Swipe back to the middle
                    modalImg.style.opacity = '1';
                    modalImg.style.transform = `scale(1)`;
                }, 10); // Delay to ensure transition reset
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

        function attachEventListeners(isTouchDevice) {
            const modalImg = modal.querySelector('.modal-content');
            const closeButton = modal.querySelector('.close');
            const prevButton = modal.querySelector('.prev');
            const nextButton = modal.querySelector('.next');

            if (isTouchDevice) {
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
        <span class="close"><i class="fa-solid fa-xmark"></i></span>
        <img class="modal-content" id="modalImg">
        <div class="modal-caption" id="modalCaption">example.jpg (1/10)</div>
        <button class="prev" ><i class="fa-solid fa-angle-left"></i></button>
        <button class="next" ><i class="fa-solid fa-angle-right"></i></button>
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


    async function actorMoreInject() {

        actorName = getActorName();
        if (actorName.length > 0) {
            const moreItems = await getActorMovies();
            const similarSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .similarSection");


            if (moreItems.length > 0) {
                // Create an HTML structure to display all images
                let imgHtml = '';
                for (let i = 0; i < moreItems.length; i++) {
                    imgHtml += createItemContainer(moreItems[i], i);
                };

                const slider = createSlider(actorName, imgHtml);
                const sliderElement = document.createElement('div');
                sliderElement.id = "myActorMoreSlider";
                sliderElement.innerHTML = slider;
                similarSection.insertAdjacentElement('afterend', sliderElement);

                const actorMoreSections = document.querySelectorAll('.actorMoreItemsContainer');
                if (actorMoreSections.length == 1) {
                    window.addEventListener('resize', function () {
                        adjustCardOffsets();
                    });
                }

                adjustCardOffset('#myActorMoreSlider', '.actorMoreItemsContainer', '.virtualScrollItem');

                addHoverEffect(sliderElement);

                return moreItems.map(moreItem => moreItem.Id);

            }
        }
        return [];
    }


    async function addHoverEffect(slider) {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice || ApiClient.getCurrentUserId() != adminUserId) return

        const portraitCards = slider.querySelectorAll('.virtualScrollItem');
        if (!portraitCards) return;

        for (let card of portraitCards) {
            let itemId = card.dataset.id;

            const localTrailers = await ApiClient.getLocalTrailers(ApiClient.getCurrentUserId(), itemId);

            if (!localTrailers || localTrailers.length == 0) continue;

            const trailerItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localTrailers[0].Id);
            const trailerUrl = `${ApiClient._serverAddress}/emby/videos/${trailerItem.Id}/original.${trailerItem.MediaSources[0].Container}?MediaSourceId=${trailerItem.MediaSources[0].Id}&api_key=${ApiClient.accessToken()}`;

            const imageContainer = card.querySelector('.cardImageContainer');
            const img = imageContainer.querySelector('.cardImage');
            let isHovered = false;

            imageContainer.classList.add('has-trailer');

            // Add mouseenter event to change image, width, and layering immediately
            card.addEventListener('mouseenter', async () => {
                isHovered = true; 
                // Create video element
                let videoElement = createVideoElement(trailerUrl);

                imageContainer.appendChild(videoElement); // Add video to the container
                img.style.filter = 'blur(5px)';

                setTimeout(() => {
                    if (isHovered) {
                        videoElement.style.opacity = '1';
                    }
                }, 50);

                videoElement.addEventListener('ended', () => {
                    videoElement.style.opacity = '0'; // Remove the video element
                    img.style.filter = ''; // Remove blur effect
                });                      
                 
            });

            // Add mouseleave event to reset the image, width, and layering immediately
            card.addEventListener('mouseleave', () => {
                isHovered = false;
                img.style.filter = ''; // Remove blur effect
                const allVideos = imageContainer.querySelectorAll('video');
                allVideos.forEach(video => {
                    video.remove(); // Remove each video element
                });
            });
        }
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


    async function directorMoreInject(excludeIds) {

        directorName = getDirectorName();
        if (directorName.length > 0) {
            const moreItems = await getActorMovies(directorName, excludeIds);
            const aboutSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection");


            if (moreItems.length > 0) {
                // Create an HTML structure to display all images
                let imgHtml = '';
                for (let i = 0; i < moreItems.length; i++) {
                    imgHtml += createItemContainer(moreItems[i], i);
                };

                const slider = createSlider(directorName, imgHtml, 0);
                const sliderElement = document.createElement('div');
                sliderElement.id = "myDirectorMoreSlider";
                sliderElement.innerHTML = slider;
                aboutSection.insertAdjacentElement('beforebegin', sliderElement);

                const actorMoreSections = document.querySelectorAll('.actorMoreItemsContainer');
                if (actorMoreSections.length == 1) {
                    window.addEventListener('resize', function () {
                        adjustCardOffsets();
                    });
                }
                
                adjustCardOffset('#myDirectorMoreSlider', '.actorMoreItemsContainer', '.virtualScrollItem');
                addHoverEffect(sliderElement);
            }
        }
    }

    async function javdbActorInject(isDirector = false) { 
        const showJavDbFlag = (item.CustomRating && item.CustomRating === 'JP-18+') || (item.OfficialRating && item.OfficialRating === 'JP-18+');
        const personName = isDirector ? directorName : actorName;
        if (showJavDbFlag && fetchJavDbFlag && personName.length > 0) {
            let insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection");

            let isCensored = item.Genres.includes("无码")? false : true;

            // search actor name from javdb
            let [javDbMovies, actorUrl] = await fetchDbActor(nameMap[personName] || personName.split('（')[0], isCensored, isDirector);
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
                let imgHtml2 = '';
                for (let i = 0; i < javDbMovies.length; i++) {
                    imgHtml2 += createItemContainerLarge(javDbMovies[i], i);
                };
                const directorText = isDirector ? ' (导演)' : '';
                const slider2 = createSliderLarge(`${personName}${directorText} 更多作品（来自JavDB，共${javDbMovies.length}部）`, imgHtml2, actorUrl);
                const sliderElement2 = document.createElement('div');
                const sectionId = isDirector ? 'myDbDirectorSlider' : 'myDbActorSlider'
                sliderElement2.id = sectionId;
                sliderElement2.innerHTML = slider2;
                insertSection.insertAdjacentElement('beforebegin', sliderElement2);

                adjustCardOffset(`#${sectionId}`, '.itemsContainer', '.backdropCard');

                showToast({
                    text: `${personTypeText}更多作品=>加载成功`,
                    icon: "&#10004;",
                    secondaryText: personName
                });

                return
            }
            showToast({
                text: `${personTypeText}更多作品=>加载失败`,
                icon: "&#10006;",
                secondaryText: personName
            });
        }
        
    }

    async function filterDbMovies(javDbMovies) {
        let filteredMovies;
        if (actorMovieNames.length > 0) {
            filteredMovies = javDbMovies.filter(movie =>
                !actorMovieNames.some(actorMovieName =>
                    actorMovieName.includes(movie.Code) || movie.Code.includes(actorMovieName)
                )
            );
        }

        if (filteredMovies.length == 0) {
            return {};
        }

        filteredMovies = await Promise.all(
            filteredMovies.map(async (movie) => {
                const exists = await checkEmbyExist(movie.Code);
                return exists ? null : movie;  // Exclude the movie if it exists in Emby
            })
        );
        return filteredMovies.filter(movie => movie !== null);;
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
            
        } else {
            console.warn("No children with the portraitCard class found in scrollerContainer!");
        }
    }

    function adjustCardOffsets() {
        adjustCardOffset('#myActorMoreSlider', '.actorMoreItemsContainer', '.virtualScrollItem');
        adjustCardOffset('#myDirectorMoreSlider', '.actorMoreItemsContainer', '.virtualScrollItem');
        adjustCardOffset('#myDbActorSlider', '.itemsContainer', '.virtualScrollItem');
        adjustCardOffset('#myDbDirectorSlider', '.itemsContainer', '.virtualScrollItem');
        adjustCardOffset('#myDbSeriesSlider', '.itemsContainer', '.virtualScrollItem');
    }


    async function seriesInject() {
        if (!fetchJavDbFlag) return
        let seriesName, similarSection, tagMovies, tagMovieIdStr;
        if (item.Type != 'BoxSet') {
            const showJavDbFlag = (item.CustomRating && item.CustomRating === 'JP-18+') || (item.OfficialRating && item.OfficialRating === 'JP-18+');
            if (!showJavDbFlag) return
            const series = item.TagItems
                .filter(item => item.Name.includes('系列'))
                .map(item => item.Name);
            if (!series || series.length == 0) return
            const parts = series[0].split(':');
            // Extract the string after "系列:"
            seriesName = parts.length > 1 ? parts[1].trim() : '';
            similarSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .similarSection");
            [tagMovies, tagMovieIdStr] = await getTagMovies(series[0]);
        }
        else {
            seriesName = item.Name;
            similarSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .linkedItems");
            tagMovies = await getCollectionMovies(item.Id);
        }

        //const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });
        const converter2 = OpenCC.Converter({ from: 'cn', to: 'jp' });
        //const seriesName_tw = converter(seriesName);
        const seriesName_jp = converter2(seriesName);
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
                if (item.Name != javdbSeries) {
                    item.Name = javdbSeries;
                    showToast({
                        text: "javdb系列名与本地不匹配",
                        icon: "&#10006;",
                        secondaryText: javdbSeries
                    });
                    //ApiClient.updateItem(item);
                }  
            } else if (tagMovies.length >= 4) {
                const collectionId = await getCollectionId(javdbSeries);
                if (collectionId.length == 0) {
                    const newCollectionId = collectionCreate(javdbSeries, tagMovieIdStr);
                    if (newCollectionId.length > 0) {
                        showToast({
                            text: "合集创建成功",
                            icon: "&#10004;",
                            secondaryText: javdbSeries
                        });
                    }    
                }
            }
        }

        tagMovies.length > 0 && (javDbMovies = javDbMovies.filter(movie => !tagMovies.some(tagMovie => tagMovie.includes(movie.Code))));
        if (javDbMovies.length == 0) {
            showToast({
                text: `javdb系列已全部下载`,
                icon: "&#10004;"
            });
            return
        }

        item.Type !== 'BoxSet' && javDbMovies.sort(() => Math.random() - 0.5);
        let imgHtml2 = '';
        for (let i = 0; i < javDbMovies.length; i++) {
            imgHtml2 += createItemContainerLarge(javDbMovies[i], i);
        };
        const seriesName_trans = await translateOnly(seriesName_jp);
        const slider2 = createSliderLarge(`系列: ${seriesName} （${seriesName_trans}） 更多作品（来自JavDB，共${javDbMovies.length}部）`, imgHtml2, seriesUrl);
        const sliderElement2 = document.createElement('div');
        sliderElement2.id = 'myDbSeriesSlider';
        sliderElement2.innerHTML = slider2;

        let insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection"); 
        //!insertSection && (insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myActorMoreSlider"));
        //!insertSection && (insertSection = similarSection);

        insertSection.insertAdjacentElement('beforebegin', sliderElement2);
        showToast({
            text: "系列更多作品=>加载成功",
            icon: "&#10004;",
            secondaryText: `系列: ${seriesName}`
        });

        if (item.Type != 'BoxSet') {
            adjustCardOffset('#myDbSeriesSlider', '.itemsContainer', '.backdropCard');
        } else {
            for (let movie of javDbMovies) {
                let insertItem = await checkEmbyExist(movie.Code);
                if (insertItem) {
                    insertItemToCollection(insertItem.Id, item.Id);
                    showToast({
                        text: "新作品加入合集",
                        icon: "&#xf0c2;",
                        secondaryText: insertItem.Name
                    })
                }
            }
        }        
    }

    async function collectionCreate(collectionName, idsToAdd) {
        const encodedCollectionName = encodeURIComponent(collectionName);
        const urlSearch = `${ApiClient._serverAddress}/emby/Collections?IsLocked=false&Name=${encodedCollectionName}&Ids=${idsToAdd}&api_key=${ApiClient.accessToken() }`;
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(urlSearch, { method: 'POST', headers });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (data.Id) {
                console.log(`Collection successfully created: ${data.Id}`);
                return data.Id;
            } else {
                console.error('Collection creation failed.');
                return '';
            }
        } catch (error) {
            console.error(`Error occurred during request: ${error}`);
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

        if (collections && collections.Items.length > 0) {
            return collections.Items[0].Id;
        }
        else {
            return '';
        }
    }
    

    async function checkEmbyExist(movie) {
        const movies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: "true",
                IncludeItemTypes: "Movie",
                SearchTerm: `${movie}`,
            }
        );
        if (movies && movies.Items.length > 0) return movies.Items[0];
        else return null;
    }

    async function insertItemToCollection(itemId, collectionId) {
        const insert_url = `${ApiClient._serverAddress}/emby/Collections/${collectionId}/Items?Ids=${itemId}&api_key=${ApiClient.accessToken()}`;
        const headers = { "accept": "*/*" };
        try {
            const response = await fetch(insert_url, {
                method: 'POST',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('Failed to add movie to collection');
            }

            return response.status === 204;
        } catch (error) {
            console.error('Error adding movie to collection:', error);
            return false;
        }
    }

   

    function getActorName() {
        const people = item.People;
        const actorNames = people.filter(person => person.Type === 'Actor').map(person => person.Name);
        return actorNames.length > 0 ? pickRandomLink(actorNames) : '';
    }

    function getDirectorName() {
        const people = item.People;
        const directorNames = people.filter(person => person.Type === 'Director').map(person => person.Name);
        return directorNames.length > 0 ? pickRandomLink(directorNames) : '';
    }


    async function getActorMovies(name = actorName, excludeIds = []) {
        const actorMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie',
                Fields: 'ProductionYear', 
                Person: name
            }
        );

        if (actorMoreMovies.Items.length > 0) {
            let moreItems = Array.from(actorMoreMovies.Items);
            if (name === actorName) {
                actorMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' ')); // for future use
            } else if (excludeIds && excludeIds.length > 0) {
                moreItems = moreItems.filter(movie => !excludeIds.some(excludeId => movie.Id === excludeId));
            }

            moreItems = moreItems.filter(moreItem => moreItem.Id != item.Id);
            moreItems.sort(() => Math.random() - 0.5);
            if (moreItems.length > 12) {
                moreItems = moreItems.slice(0, 12);
            }
            return moreItems;
        } else {
            return null; // Return null or handle the failure case accordingly
        }
    }

    async function getTagMovies(tagName) {
        let tagMovieIdStr = '';
        const tagMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie',
                Tags: tagName
            }
        );

        if (tagMoreMovies && tagMoreMovies.Items.length > 0) {
            let moreItems = Array.from(tagMoreMovies.Items);
            const tagMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' '));
            const tagMovieIds = moreItems.map(movie => movie.Id);
            tagMovieIdStr = tagMovieIds.join(',');
            return [tagMovieNames, tagMovieIdStr];
        } else {
            return [null, tagMovieIdStr]; // Return null or handle the failure case accordingly
        }
    }

    async function getCollectionMovies(collectionId) {
        const tagMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie',
                ParentId: collectionId
            }
        );
        if (tagMoreMovies && tagMoreMovies.Items.length > 0) {
            let moreItems = Array.from(tagMoreMovies.Items);
            const tagMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' '));
            return tagMovieNames;
        } else {
            return null; // Return null or handle the failure case accordingly
        }
    }


    function getPartBefore(str, char) {
        return str.split(char)[0];
    }
    function getPartAfter(str, char) {
        const parts = str.split(char);
        return parts[parts.length - 1];
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

    async function fetchDbActor(actorName, isCensored, isDirector = false) {
        const HOST = "https://javdb.com";
        const personType = isDirector ? 'director' : 'actor';
        const personName = isDirector ? directorName : actorName;
        const url = `${HOST}/search?f=${personType}&locale=zh&q=${personName}`;
        let javdbActorData = await request(url);
        if (javdbActorData.length > 0) {
            // Create a new DOMParser instance
            const parser = new DOMParser();

            // Parse the HTML data string
            let parsedHtml = parser.parseFromString(javdbActorData, 'text/html');
            let actorLink = null;

            if (isDirector) {           
                const directorBoxes = parsedHtml.querySelectorAll('#directors .box');
                if (directorBoxes.length > 0) {
                    for (let directorBox of directorBoxes) {
                        if (directorBox.getAttribute('title') && directorBox.getAttribute('title').split(', ').includes(directorName)) {
                            actorLink = directorBox;
                            break;
                        }
                    }
                }
            } else {
                // Get the href attribute from the parsed HTML
                actorLink = parsedHtml.querySelector('.box.actor-box a:first-of-type');
                if (actorLink && !actorLink.getAttribute('title').split(', ').includes(actorName)) {
                    let actorBoxs = parsedHtml.querySelectorAll('.box.actor-box');
                    for (let actorBox of actorBoxs) {
                        let actorLink_temp = actorBox.querySelector('a');
                        if (actorLink_temp.getAttribute('title').split(', ').includes(actorName)) {
                            actorLink = actorLink_temp;
                            break;
                        }
                    }
                }

                //Get uncensored href
                if (!isCensored) {
                    let actorLink_temp = null;
                    const infoElements = parsedHtml.querySelectorAll('.actors .box.actor-box .info');
                    if (infoElements.length > 0) {
                        for (let infoElement of infoElements) {
                            if (infoElement.textContent.includes("Uncensored") && infoElement.closest("a").getAttribute('title').includes(actorName)) {
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
            
            if (actorLink) {
                const hrefValue = actorLink.getAttribute('href');
                const actorUrl = `${HOST}${hrefValue}`;

                //wait for random time
                await waitForRandomTime();
                javdbActorData = await request(actorUrl);
                if (javdbActorData.length > 0) {

                    const itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailTextContainer .mediaInfoItems:not(.hide)");
                    if (itemsContainer && OS_current != 'iphone') {
                        const mediaInfoItem = itemsContainer.querySelectorAll('.mediaInfoItem:has(a)')[0];
                        if (mediaInfoItem) {
                            addNewLinks(mediaInfoItem, [createNewLinkElement(`跳转至javdb ${personName}`, 'pink', actorUrl, personName)]);
                            mediaInfoStyle(mediaInfoItem);
                        }
                    }

                    parsedHtml = parser.parseFromString(javdbActorData, 'text/html');
                    const paginationList = parsedHtml.querySelector('.pagination-list');
                    if (paginationList) {
                        // Initialize an array to store page links
                        const pageLinks = [];

                        // Find all the page links within the pagination list
                        const links = paginationList.querySelectorAll('a.pagination-link');

                        // Iterate over each page link and extract the href attribute
                        links.forEach(link => {
                            const href = `${HOST}${link.getAttribute('href')}`;
                            // Add the href to the pageLinks array
                            pageLinks.push(href);
                        });

                        const pickLink = pickRandomLink(pageLinks);
                        if (pickLink != actorUrl) {
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
                
            } else {
                console.error('Actor link not found');
            }
        }
        return [[], ''];
    }

    function waitForRandomTime() {
        const minWaitTime = 500;
        const maxWaitTime = 1500;

        const randomWaitTime = Math.random() * (maxWaitTime - minWaitTime) + minWaitTime;

        return new Promise(resolve => {
            setTimeout(() => {
                console.log("Waited for", randomWaitTime / 1000, "seconds");
                resolve(); // Signal that the promise is completed
            }, randomWaitTime);
        });
    }

    async function fetchDbSeries(seriesName) {
        const movies = [];
        let seriesUrl = '';
        let javdbSeries = '';
        const HOST = "https://javdb.com";
        const url = `${HOST}/search?q=${seriesName}&f=series`;
        let javdbData = await request(url);
        if (javdbData.length > 0) {
            const parser = new DOMParser();

            // Parse the HTML data string
            let parsedHtml = parser.parseFromString(javdbData, 'text/html');
            const seriesContainer = parsedHtml.getElementById('series');

            // Check if the container exists
            if (seriesContainer) {
                // Find the first anchor tag within the container
                const seriesLinks = seriesContainer.querySelectorAll('a');
                let firstAnchor;
                for (const link of seriesLinks) {
                    const movieCountText = link.querySelector('span').textContent; // Get the text content of the <span> element
                    const movieCount = parseInt(movieCountText.match(/\((\d+)\)/)[1]);

                    if (movieCount > 0) {
                        let seriesTitle = link.querySelector('strong').textContent;
                        if (!firstAnchor || seriesTitle === seriesName) firstAnchor = link;
                    }
                }

                // Check if the anchor tag exists
                if (firstAnchor) {
                    javdbSeries = firstAnchor.querySelector('strong').textContent;
                    // Get the href attribute of the anchor tag
                    const firstHref = firstAnchor.getAttribute('href');
                    seriesUrl = `${HOST}${firstHref}`;
                    await waitForRandomTime();
                    javdbData = await request(seriesUrl);

                    if (javdbData) {
                        const itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .detailTextContainer .mediaInfoItems:not(.hide)");
                        if (itemsContainer && OS_current != 'iphone') {
                            const mediaInfoItem = itemsContainer.querySelectorAll('.mediaInfoItem:has(a)')[0];
                            if (mediaInfoItem) {
                                if (item.Type != 'BoxSet') {
                                    addNewLinks(mediaInfoItem, [createNewLinkElement(`跳转至javdb ${seriesName}`, 'pink', seriesUrl, seriesName)]);
                                } 
                                mediaInfoStyle(mediaInfoItem);
                            }
                        }

                        parsedHtml = parser.parseFromString(javdbData, 'text/html');

                        const paginationList = parsedHtml.querySelector('.pagination-list');
                        if (paginationList && item.Type === 'BoxSet') {
                            // Initialize an array to store page links
                            const pageLinks = [];

                            // Find all the page links within the pagination list
                            const links = paginationList.querySelectorAll('a.pagination-link');

                            // Iterate over each page link and extract the href attribute
                            links.forEach(link => {
                                const href = `${HOST}${link.getAttribute('href')}`;
                                // Add the href to the pageLinks array
                                pageLinks.push(href);
                            });
                            //seriesPageLinks = pageLinks;

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
                        // Iterate over each item within the "movie-list"
                        const DBitems = parsedHtml.querySelectorAll('.movie-list .item');
                        arrangeDBitems(DBitems, movies);
                    }

                }
            }
        }
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
        if ((OS_current === 'iphone') || (OS_current === 'android') || (googleApiKey.length == 0)) return;

        // Select the element using document.querySelector
        const titleElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .itemName-primary");
        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");

        // Check if the element is found
        if (titleElement) {
            if (containsJapanese(item.Name)) {
                const buttonhtml = createButtonHtml('myTranslate', '翻译标题', `<i class="fa-solid fa-language"></i>`, '翻译标题');

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
                const buttonhtml2 = createButtonHtml('myTranslate2', '翻译详情', `<i class="fa-solid fa-language"></i>`, '翻译详情');
                mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml2);
                const myTranslate2 = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myTranslate2");
                myTranslate2.onclick = translateJapaneseToChinese2;
            }
        }
    }


    async function translateOnly(text) {
        const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
        let text_jp = googleTranslateLanguage === 'ja' ? OpenCC.Converter({ from: 'cn', to: 'jp' })(text) : text;
        
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
                icon: "&#xf0c2;"
            })

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
                icon: "&#xf0c2;"
            })
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
        const mountMatch = {
        };
        // Iterate through the mountMatch dictionary
        for (const [linuxPrefix, windowsPrefix] of Object.entries(mountMatch)) {
            if (linuxPath.startsWith(linuxPrefix)) {
                // Replace the Linux prefix with the Windows prefix
                const relativePath = linuxPath.slice(linuxPrefix.length);
                return windowsPrefix + relativePath.replace(/\//g, '\\');
            }
        }
        // Return the original path if no match is found
        return linuxPath;
    }

})();

