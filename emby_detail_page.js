// emby detail page

(function () {
    "use strict";
    const show_pages = ["Movie", "Series", "Episode", "Season"];
    var item, OS_current, fanartDefaultRatio;
    fanartDefaultRatio = 1; // change default number from 0.5 to 1.5

    OS_current = getOS();
    // monitor dom changements
    document.addEventListener("viewbeforeshow", function (e) {
        if (e.detail.contextPath.startsWith("/item?id=")) {
            if (!e.detail.isRestored) {
                const mutation = new MutationObserver(async function () {
                    item = e.target.controller?.currentItem;
                    if (item) {
                        mutation.disconnect();
                        if (showFlag()) {
                            init();
                        }
                    }
                });
                mutation.observe(document.body, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            } else {
                item = e.target.controller.currentItem;
            }
            
        }
    });

    function init() {
        const is_OS_phone = ((OS_current === 'iphone') || (OS_current === 'android'));
        // add button
        if (OS_current === 'windows') {
            button_init();
        }
        // add fanart
        if (!is_OS_phone) {
            previewInject();
        }
        // add more movies from this actor
        actorMoreInject();

    }


    function showFlag() {
        for (let show_page of show_pages) {
            if (item.Type == show_page) {
                return true;
            }
        }
        return false;
    }

    async function button_init() {
        const mainDetailButtons = document.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        const buttonhtml = `
                <div id="ExternalPlayersBtns" class="detailButtons flex align-items-flex-start flex-wrap-wrap">
                    <button id="embyCopyUrl" type="button" class="detailButton emby-button emby-button-backdropfilter raised-backdropfilter detailButton-primary" title="copyFolder">
                        <div class="detailButton-content">
                            <i class="md-icon detailButton-icon button-icon button-icon-left icon-Copy">　</i>
                            <span class="button-text">复制地址</span>
                        </div>
                    </button>
                </div>
            `;
        mainDetailButtons.insertAdjacentHTML('afterend', buttonhtml);
        // Add hover effect using CSS
        const buttonStyle = document.createElement('style');
        buttonStyle.innerHTML = `
                #embyCopyUrl:hover {
                    background-color: #e6e6e6; /* Change background color on hover */
                    color: #333; /* Change text color on hover */
                }
            `;
        document.head.appendChild(buttonStyle);
        document.querySelector("div[is='emby-scroller']:not(.hide) #embyCopyUrl").onclick = embyCopyUrl;
        // Add icons
        document.querySelector("div[is='emby-scroller']:not(.hide) .icon-Copy").style.cssText += 'background: url(https://fastly.jsdelivr.net/gh/bpking1/embyExternalUrl@0.0.5/embyWebAddExternalUrl/icons/icon-Copy.webp) no-repeat; background-size: 100% 100%; font-size: 1.4em';
    }


    // Function to fetch JSON data from a URL
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

    async function embyCopyUrl() {
        const itemPath = item.Path;
        const folderPath = itemPath.substring(0, itemPath.lastIndexOf('\\'));
        copyTextToClipboard(folderPath);
        const buttonTextElement = this.querySelector('.button-text');
        buttonTextElement.innerText = '复制成功';
        buttonTextElement.style.color = 'green';
        console.log('Copied URL:', folderPath);
        setTimeout(() => {
            buttonTextElement.innerText = '复制地址';
            buttonTextElement.style.color = 'white';
        }, 1000);
    }

    // Function to copy text to clipboard
    function copyTextToClipboard(text) {
        let textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.style.position = 'absolute';
        textarea.style.clip = 'rect(0 0 0 0)';
        textarea.value = text;
        textarea.select();
        if (document.execCommand('copy', true)) {
            console.log(`Copied to clipboard: ${text}`);
            // Optionally, display a success message or perform other actions
        }
    }

    async function getItemInfo() {
        const userId = ApiClient._serverInfo.UserId;
        // const itemId = /\?id=(\d*)/.exec(window.location.hash)[1];
        const itemId = item.Id;
        let response = await ApiClient.getItem(userId, itemId);
        //继续播放当前剧集的下一集
        if (response.Type == "Series") {
            let seriesNextUpItems = await ApiClient.getNextUpEpisodes({ SeriesId: itemId, UserId: userId });
            console.log("nextUpItemId: " + seriesNextUpItems.Items[0].Id);
            return await ApiClient.getItem(userId, seriesNextUpItems.Items[0].Id);
        }
        //播放当前季season的第一集
        if (response.Type == "Season") {
            let seasonItems = await ApiClient.getItems(userId, { parentId: itemId });
            console.log("seasonItemId: " + seasonItems.Items[0].Id);
            return await ApiClient.getItem(userId, seasonItems.Items[0].Id);
        }
        //播放当前集或电影
        console.log("itemId:  " + itemId);
        return response;
    }


    function create_banner(text, html) {
        const margin = window.innerWidth * 0.035;
        const banner = `
		    <div class="verticalSection">
			    <h2 class="sectionTitle sectionTitle-cards padded-left padded-right">${text}</h2>
                    <div class="slider-container" style="margin-left: ${margin}px;">
                        <input type="range" min="0.5" max="${fanartDefaultRatio}" step="0.02" value="1" class="slider" id="mySlider">
                    </div>
			        ${html}
		    </div>`;
        return banner
    }

    function createSlider(text, html) {
        const slider = `
            <div class="verticalSection verticalSection-cards actorMoreSection emby-scrollbuttons-scroller" bis_skin_checked = "1" >
                <div is="emby-scrollbuttons" class="emby-scrollbuttons" bis_skin_checked="1">
                    <div class="scrollbuttoncontainer scrollbuttoncontainer-backwards hide" bis_skin_checked="1">
                        <button id="myBackScrollButton" tabindex="-1" type="button" is="paper-icon-button-light" data-ripple="false" data-direction="backwards" class="emby-scrollbuttons-scrollbutton paper-icon-button-light">
                            <i class="md-icon autortl"></i>
                        </button>
                    </div>
                    <div class="scrollbuttoncontainer scrollbuttoncontainer-forwards" bis_skin_checked="1">
                        <button id="myForwardScrollButton" tabindex="-1" type="button" is="paper-icon-button-light" data-ripple="false" data-direction="forwards" class="emby-scrollbuttons-scrollbutton paper-icon-button-light">
                            <i class="md-icon autortl"></i>
                        </button>
                    </div>
                </div>
                <h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">${text} 其他作品</h2>
                <div id="myScrollContainer" is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right scrollX hiddenScrollX scrollFrameX" data-mousewheel="false" data-focusscroll="true" data-horizontal="true" bis_skin_checked="1">

                    <div id="myitemsContainer" is="emby-itemscontainer" class="scrollSlider focuscontainer-x itemsContainer focusable actorMoreItemsContainer scrollSliderX emby-scrollbuttons-scrollSlider generalItemsContainer virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller" data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid" bis_skin_checked="1" style="white-space: nowrap; min-width: 2412px; height: 351px;" data-minoverhang="1" layout="horizontal-grid">
                        ${html}
                    </div>
                </div>
            </div>
        `;

        return slider;
    }



    function createItemContainer(itemInfo, increment) {
        let distance;
        if (OS_current === 'ipad') {
            distance = 182;
        } else if (OS_current === 'iphone') {
            distance = 120;
        }
        else {
            distance = 200;
        }

        const imgUrl = ApiClient.getImageUrl(itemInfo.Id, { type: "Primary", tag: itemInfo.ImageTags.Primary, maxHeight: 330, maxWidth: 220 });
        const title = itemInfo.Name;
        const link = `http://${window.location.host}/web/index.html#!/item?id=${itemInfo.Id}&serverId=${itemInfo.ServerId}`;
        const itemContainer = `
            <div class="virtualScrollItem card portraitCard card-horiz portraitCard-horiz" tabindex="0" draggable="false" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded" bis_skin_checked="1">
                    <button onclick="window.open('${link}', '_self')" type="button" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-portrait">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded" bis_skin_checked="1">
                        <button onclick="window.open('${link}', '_self')" tabindex="-1" title="${title}" type="button" class="cardMediaInfoItem textActionButton cardTextActionButton emby-button button-link">${title}</button>
                    </div>
                </div>
            </div>
        `;

        return itemContainer;
    }

 

    async function previewInject() {
        let fanartHeight = window.innerHeight * 0.3;
        let Style = `
            .my-fanart-image {
                display: inline-block;
                margin: 8px 16px 8px 0;
                vertical-align: top;
                border-radius: 10px;
                height: ${fanartHeight}px;
                transition: transform 0.3s ease;
            }

            .my-fanart-image:hover {
                transform: scale(1.2);
                z-index: 1;
            }
        `;

        const { BackdropImageTags = [], Id } = item;
        const peopleSection = document.querySelectorAll("div[is='emby-scroller']:not(.hide) .peopleSection")[0];
        if (!peopleSection) return;

        const leftMargin = window.innerHeight * 0.077;
        let html = `<div id="myFanart" class="imageSection" style="margin: 0px 0 0 ${leftMargin}px;">`;
        Array.from(new Set(BackdropImageTags)).forEach((img, index) => {
            if (index === 0) return;
            let url = `http://${window.location.host}/emby/Items/${Id}/Images/Backdrop/${index}?tag=${img}`;
            html += `<img class='my-fanart-image' src="${url}" alt="" />`;
        });
        html += `</div>`;
        // Apply the styles from Style_ipad to .my-fanart-image class
        html = `<style>${Style}</style>${html}`;

        const banner = create_banner("剧照", html)
        peopleSection.insertAdjacentHTML("afterend", banner);

        // Get the slider element and fanart element
        const slider = document.getElementById('mySlider');
        slider.addEventListener('input', function () {
            const sliderValue = parseFloat(slider.value);
            const newHeight = fanartHeight * sliderValue;
            const fanartImages = document.querySelectorAll('.my-fanart-image');
            fanartImages.forEach(image => {
                image.style.height = newHeight + 'px';
            });
        });

    }
   
    async function actorMoreInject() {
        const actorName = getActorName();
        const { moreItems, actorMovieNames } = await getActorMovies(actorName);
        const similarSection = document.querySelectorAll("div[is='emby-scroller']:not(.hide) .similarSection")[0];
        if (moreItems.length > 0) {
            // Create an HTML structure to display all images
            let imgHtml = '';
            for (let i = 0; i < moreItems.length; i++) {
                imgHtml += createItemContainer(moreItems[i], i);
            };
     
            const slider = createSlider(actorName, imgHtml);
            const sliderElement = document.createElement('div');
            sliderElement.innerHTML = slider;
            similarSection.insertAdjacentElement('afterend', sliderElement);

            const scrollContainer = document.getElementById('myScrollContainer');
            // Get all buttons within the container
            const buttons = scrollContainer.querySelectorAll('button');
            // Add event listener to each button
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    window.location.reload(); // Refresh the page on button click
                });
            });

            const backScrollButton = document.getElementById('myBackScrollButton');
            const forwardScrollButton = document.getElementById('myForwardScrollButton');
            // Smooth scrolling transition
            scrollContainer.style.scrollBehavior = 'smooth';
            //backScrollButton.addEventListener('click', () => {
            //    scrollContainer.scrollLeft -= 500; // Adjust the scroll amount as needed
            //});
            forwardScrollButton.addEventListener('click', () => {
                scrollContainer.scrollLeft += 0.8 * window.innerWidth;; // Adjust the scroll amount as needed
            });

            // adjust item card distance with different window size
            window.addEventListener('resize', adjustCardOffsets);
                adjustCardOffsets();
        }
    }

    function adjustCardOffsets() {
        const scrollerContainer = document.getElementById('myitemsContainer');

        // Find all children that contain the portraitCard class
        const portraitCards = scrollerContainer.querySelectorAll('.portraitCard');
        if (portraitCards.length > 0) {
            const cardWidth = portraitCards[0].offsetWidth; // Get width of the first card with padding and border
            const spacing = 0; // Spacing between cards (adjust as needed)
            const totalCardWidth = cardWidth + spacing;

            // Set min-width of scrollerContainer
            scrollerContainer.style.minWidth = `${portraitCards.length * totalCardWidth}px`;

            for (let child of portraitCards) {
                child.style.left = `${child.previousElementSibling ? child.previousElementSibling.offsetLeft + totalCardWidth : 0}px`;
            }
        } else {
            console.warn("No children with the portraitCard class found in scrollerContainer!");
        }
    }

    function adjustCardOffsetsLarge() {
        const scrollerContainer = document.getElementById('myitemsContainer2');

        // Find all children that contain the portraitCard class
        const backdropCards = scrollerContainer.querySelectorAll('.backdropCard');
        if (backdropCards.length > 0) {
            const cardWidth = backdropCards[0].offsetWidth; // Get width of the first card with padding and border
            const spacing = 0; // Spacing between cards (adjust as needed)
            const totalCardWidth = cardWidth + spacing;

            // Set min-width of scrollerContainer
            scrollerContainer.style.minWidth = `${backdropCards.length * totalCardWidth}px`;

            for (let child of backdropCards) {
                child.style.left = `${child.previousElementSibling ? child.previousElementSibling.offsetLeft + totalCardWidth : 0}px`;
            }
        } else {
            console.warn("No children with the portraitCard class found in scrollerContainer!");
        }
    }


   

    function getActorName() {
        const people = item.People;
        const actorNames = people.filter(person => person.Type === 'Actor').map(person => person.Name);
        if (actorNames.length > 0) {
            const randomIndex = Math.floor(Math.random() * actorNames.length);
            return actorNames[randomIndex]; // Return a random actor name from the filtered list
        } else {
            return null; // Return null if no actor names were found
        }
    }


    async function getActorMovies(actorName) {
        try {
            const search_url = `${ApiClient._serverAddress}/emby/Items?api_key=${ApiClient.accessToken()}&Recursive=true&IncludeItemTypes=Movie&Person=${actorName}`;
            const actorMoreMovies = await fetchJsonData(search_url);
            //const jsonData = JSON.stringify(await ApiClient.getItems(ApiClient.getCurrentUserId(), { 'Recursive': true ,'IncludeItemTypes': 'Movies', 'Person': actorName, 'api_key': ApiClient.accessToken() } ));

            if (actorMoreMovies.Items.length > 0) {
                let moreItems = Array.from(actorMoreMovies.Items);
                const actorMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' ')); // for future use
                moreItems = moreItems.filter(moreItem => moreItem.Id != item.Id);
                if (actorMoreMovies.Items.length > 12) {
                    moreItems.sort(() => Math.random() - 0.5);
                    moreItems = moreItems.slice(0, 12);
                }
                return { moreItems, actorMovieNames};
            } else {
                console.log('Failed to fetch JSON data.');
                return null; // Return null or handle the failure case accordingly
            }
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            return null; // Return null or handle the error case accordingly
        }
    }

    function getPartBefore(str, char) {
        return str.split(char)[0];
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


})();
