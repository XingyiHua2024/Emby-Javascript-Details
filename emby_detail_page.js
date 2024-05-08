// emby detail page

(function () {
    "use strict";

    //config
    const show_pages = ["Movie", "Series", "Episode", "Season"];
    /* page item.Type "Person" "Movie" "Series" "Season" "Episode" "BoxSet" so. */
    const fetchJavDbFlag = false;
    // fetch data form Javdb.com and display in detail page. Only support moves that has CustomRating === 'JP-18+' or OfficialRating === 'JP-18+'
    const googleApiKey = '';
    // put your own googleApiKey for translate movie title and movie details
    const googleTranslateLanguage = 'ja';
    // put language to translate from (ja for Japanese) to Chinese. Leave '' to support any language


    var item, OS_current, actorName, actorMovieNames, viewnode, seriesUrl, actorUrl;
    OS_current = getOS();
    // monitor dom changements
    document.addEventListener("viewbeforeshow", function (e) {
        if (e.detail.contextPath.startsWith("/item?id=")) {
            if (!e.detail.isRestored) {
                const mutation = new MutationObserver(async function () {
                    viewnode = e.target;
                    item = viewnode.controller?.currentItem;
                    if (item) {
                        mutation.disconnect();
                        if (showFlag()) {
                            viewnode.querySelector("div[is='emby-scroller']:not(.hide) div.flex-grow.topDetailsMain.flex.flex-direction-column").style.paddingTop = '28%';
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
                    viewnode.querySelector("div[is='emby-scroller']:not(.hide) div.flex-grow.topDetailsMain.flex.flex-direction-column").style.paddingTop = '28%';
                    adjustCardOffsets();
                }
            }
        }
    });


    function init() {
        buttonInit();
        previewInject();
        modalInject();

        actorMoreInject()

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



    function buttonInit() {
        //removeExisting('embyCopyUrl');
        if (OS_current != 'windows') return;

        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        const buttonhtml = `
                <button id="embyCopyUrl" is="emby-button" type="button" class="detailButton raised emby-button emby-button-backdropfilter raised-backdropfilter detailButton-primary detailButton-stacked" title="复制所在文件夹路径">              
                    <i class="md-icon md-icon-fill button-icon button-icon-left autortl icon-Copy">\uf0c5</i>
                    <span class="button-text">复制路径</span>
                </button>
            `;
        mainDetailButtons.insertAdjacentHTML('afterbegin', buttonhtml);
        viewnode.querySelector("div[is='emby-scroller']:not(.hide) #embyCopyUrl").onclick = embyCopyUrl;         
    }

    function javdbButtonInit() {
        const showJavDbFlag = (item.CustomRating && item.CustomRating === 'JP-18+') || (item.OfficialRating && item.OfficialRating === 'JP-18+');
        if (OS_current === 'iphone' || !showJavDbFlag || !fetchJavDbFlag) return
        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        const buttonhtml = `
            <button id="injectJavdb" is="emby-button" type="button" class="detailButton raised emby-button emby-button-backdropfilter raised-backdropfilter detailButton-primary detailButton-stacked" title="加载javdb.com数据">              
                <i class="md-icon md-icon-fill button-icon button-icon-left autortl icon-injectJavdb"><i class="fa-solid fa-magnifying-glass"></i></i>
                <span class="button-text">javdb</span>
            </button>
        `;

        const style = `
            @keyframes sandMeltAnimation {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
                    
            /* Apply styles to the button */
            #injectJavdb {
                opacity: 1;
            }

            .melt-away {
                animation: sandMeltAnimation 1s ease-out forwards; /* Apply the animation */
            }
        `;

        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        const styleElement = document.createElement('style');
        styleElement.innerHTML = style;
        const javInjectButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #injectJavdb");
        javInjectButton.appendChild(styleElement);
        
        javInjectButton.addEventListener('click', () => {
            javdbActorInject();
            seriesInject();
            showToast({
                text: 'javdb资源=>搜索中。。。',
                icon: `<i class="fa-solid fa-magnifying-glass"></i>`
            });
            javInjectButton.style.color = 'green';
            javInjectButton.classList.add('melt-away');
            setTimeout(() => {
                javInjectButton.style.display = 'none';
            }, 1000); 
        });
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
        buttonTextElement.style.color = 'green';
        setTimeout(() => {
            buttonTextElement.style.color = 'white';
        }, 1000);
        showToast({
            text: `复制成功`,
            icon: "\uf0c5"
        })
    }

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
		    <div class="verticalSection">
			    <h2 class="sectionTitle sectionTitle-cards padded-left padded-right">${text}</h2>
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
                    <div class="scrollbuttoncontainer scrollbuttoncontainer-forwards hide" bis_skin_checked="1">
                        <button id="myForwardScrollButton" tabindex="-1" type="button" is="paper-icon-button-light" data-ripple="false" data-direction="forwards" class="emby-scrollbuttons-scrollbutton paper-icon-button-light">
                            <i class="md-icon autortl"></i>
                        </button>
                    </div>
                </div>
                <h2 class="sectionTitle sectionTitle-cards padded-left padded-left-page padded-right">${text} 其他作品</h2>
                <div id="myScrollContainer" is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right scrollX hiddenScrollX scrollFrameX" data-mousewheel="false" data-focusscroll="true" data-horizontal="true" bis_skin_checked="1">

                    <div id="myitemsContainer" is="emby-itemscontainer" class="scrollSlider focuscontainer-x itemsContainer focusable actorMoreItemsContainer scrollSliderX emby-scrollbuttons-scrollSlider virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller" data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid" bis_skin_checked="1" style="white-space: nowrap; min-width: 2412px; height: 351px;" data-minoverhang="1" layout="horizontal-grid">
                        ${html}
                    </div>
                </div>
            </div>
        `;

        return slider;
    }

    function createSliderLarge(text, html, sectionId, scrollerId, itemsContainerId, linkUrl) {
        let slider;
        if (item.Type != 'BoxSet') {
            slider = `
            <div id=${sectionId} class="verticalSection verticalSection-cards section1 emby-scrollbuttons-scroller" bis_skin_checked="1">
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
                <div id=${scrollerId} is="emby-scroller" data-mousewheel="false" data-focusscroll="true" class="padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right emby-scroller scrollX hiddenScrollX scrollFrameX" bis_skin_checked="1">
                    <div id=${itemsContainerId} is="emby-itemscontainer" data-focusabletype="nearest" class="focusable focuscontainer-x itemsContainer scrollSlider scrollSliderX emby-scrollbuttons-scrollSlider virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller" data-virtualscrolllayout="horizontal-grid" data-minoverhang="1" layout="horizontal-grid" bis_skin_checked="1" style="white-space: nowrap; min-width: 2400px; height: 265px;">
                       ${html}
                    </div>
                </div>
            </div>
            `;
        } else {
            slider = `
                <div class="linked-Movie-section verticalSection verticalSection-cards">
                    <div class="sectionTitleContainer padded-left padded-left-page padded-right sectionTitleContainer-cards focusable" data-focusabletype="nearest">
                        <a onclick="window.open('${seriesUrl}', '_blank')" is="emby-sectiontitle" class="noautofocus button-link button-link-color-inherit sectionTitleTextButton sectionTitleTextButton-link sectionTitleTextButton-more emby-button emby-button-backdropfilter">
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
        
        let code = itemInfo.ProductionYear;
        let name = itemInfo.Name;
        /*
        const title = itemInfo.Name.split(' ');
        if (title.length <= 1) {
            name = title;
            code = itemInfo.ProductionYear;
        }
        else {
            code = title[0];
            if (title.length > 2) {
                name = title.slice(1).join(' ');
            } else {
                name = title[1];
            }
        }
        */
        //const link = `http://${window.location.host}/web/index.html#!/item?id=${itemInfo.Id}&serverId=${itemInfo.ServerId}`;
        const itemContainer = `
            <div class="virtualScrollItem card portraitCard card-horiz portraitCard-horiz card-hoverable card-autoactive" tabindex="0" draggable="false" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded" bis_skin_checked="1">
                    <button onclick="Emby.Page.showItem('${itemInfo.Id}')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-portrait">
                         <style>
                            .cardImage {
                                transition: filter 0.2s ease; /* Smooth transition for the blur effect */
                            }

                            .cardImage:hover {
                                filter: brightness(70%); /* Apply a blur effect on hover */
                            }
                        </style>
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded" bis_skin_checked="1">
                        ${name}
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
        const link = `https://javdb.com${itemInfo.Link}`;
        const score = itemInfo.Score;
        const time = itemInfo.Time;
        let itemContainer;
        if (item.Type != 'BoxSet') {
            itemContainer = `
            <div class="virtualScrollItem card backdropCard card-horiz backdropCard-horiz card-hoverable card-autoactive" tabindex="0" draggable="true" bis_skin_checked="1" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded" bis_skin_checked="1">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded" bis_skin_checked="1">
                        <span>${title}</span>
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
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded">
                        <span>${title}</span>
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

    function previewInject() {

        //removeExisting('myFanart');
        if ((OS_current === 'iphone') || (OS_current === 'android')) return
        let fanartHeight = window.innerHeight * 0.3;
        let Style = `
            .my-fanart-image {
                display: inline-block;
                margin: 8px 16px 8px 0;
                vertical-align: top;
                border-radius: 10px;
                height: ${fanartHeight}px;
                transition: transform 0.3s ease, filter 0.3s ease;
            }

            .my-fanart-image:hover {
                transform: scale(1.05);
                filter: brightness(80%);   
            }

            .auto-height {
                height: auto !important;
            }
        `;

        const { BackdropImageTags = [], Id } = item;
        if (BackdropImageTags.length == 0) return;
        const peopleSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .peopleSection");
        if (!peopleSection) return;

        const leftMargin = window.innerHeight * 0.077;
        let altIndex = 0;
        let html = `<div id="myFanart" class="imageSection" style="margin: 0px 0 0 ${leftMargin}px;">`;
        for (let index = 0; index < BackdropImageTags.length; index++) {
            if (index > 0 && BackdropImageTags[index] === BackdropImageTags[index - 1]) {
                continue;
            } else {
                let url = `http://${window.location.host}/emby/Items/${Id}/Images/Backdrop/${index}?tag=${BackdropImageTags[index]}`;
                html += `<img class='my-fanart-image' src="${url}" alt="${altIndex}" />`;
                altIndex++;
            }
        }
        html += `</div>`;
        // Apply the styles from Style_ipad to .my-fanart-image class
        html = `<style>${Style}</style>${html}`;

        const banner = createBanner("剧照", html)
        peopleSection.insertAdjacentHTML("afterend", banner);
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

        const modalHTML = `
            <span class="close"><i class="fa-solid fa-xmark"></i></i></span>
            <img class="modal-content" id="modalImg">
            <button class="prev" ><i class="fa-solid fa-angle-left"></i></button>
            <button class="next" ><i class="fa-solid fa-angle-right"></i></button>
        `;

        const style = `
        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.8); /* Semi-transparent black background */
            justify-content: center;
            align-items: center;
            }

            .modal-content {
                margin: auto;
                max-width: 100%;
                max-height: 100%;
                overflow: hidden; /* Ensure image does not overflow modal */
                opacity: 0; /* Initially set opacity to 0 */
            }

            .modal-closing .modal-content {
               /* Animation styles when modal is closing */
              animation-name: shrinkAndRotate;
              animation-duration: 0.3s; /* Adjust duration as needed */
              animation-timing-function: ease-out;
              transform-origin: center center; /* Set the transform origin to the center */
            }

            .close {
                color: white;
                position: absolute;
                width: 45px; /* Fixed width */
                height: 45px; /* Fixed height */
                line-height: 40px;
                justify-content: center;
                align-items: center;
                display: flex;
                top: 30px;
                right: 30px;
                font-size: 30px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s, transform 0.3s, padding 0.3s; /* Added transform and padding to the transition */
                border-radius: 50%; /* Makes the background a circle */
                padding: 10px;
            }

            .prev,
            .next {
                position: absolute;
                width: 40px; /* Fixed width */
                height: 40px; /* Fixed height */
                line-height: 40px;
                justify-content: center;
                align-items: center;
                display: flex;
                top: 50%;
                background-color: rgba(0, 0, 0, 0.5);
                color: white;
                border: none;
                cursor: pointer;
                font-size: 35px;
                font-weight: bold;
                transform: translateY(-50%) translateX(-50%);
                transition: background-color 0.3s, transform 0.3s, padding 0.3s; /* Added transform and padding to the transition */
                border-radius: 50%; /* Makes the background a circle */
                padding: 35px;
            }

            .prev {
                left: 80px;
            }

            .next {
                right: 20px;
            }

            .prev:hover,
            .next:hover {
                background-color: rgba(255, 255, 255, 0.3);
                padding: 35px; /* Increases padding on hover */
            }

            .close:hover {
                background-color: rgba(255, 255, 255, 0.3);
                padding: 10px; /* Increases padding on hover */
            }

            @keyframes shrinkAndRotate {
              0% {
                //transform: scale(1) rotateY(0deg); /* Initial scale and rotation */
                transform: scale(1);
              }
              //50% {
                //transform: scale(0.5) rotateY(180deg); /* Halfway shrink and rotate */
              //  ransform: scale(0.5);
              //}
              100% {
                //transform: scale(0) rotateY(360deg); /* Fully shrink and rotate */
                transform: scale(0);
              }
            }

            .click-smaller {
                transform: scale(0.9) translate(-50%, -50%);
                transition: transform 0.2s; /* Smooth transition for the size change */
            }
        `;
        const preModal = document.querySelector("#myModal");
        let modal;

        if (!preModal) {
            const modalContainer = document.createElement('div');
            modalContainer.id = 'myModal';
            modalContainer.classList.add('modal');
            modalContainer.innerHTML = modalHTML;

            document.body.appendChild(modalContainer);

            const styleElement = document.createElement('style');
            styleElement.innerHTML = style;

            modal = document.querySelector("#myModal");

            modal.appendChild(styleElement);
        }
        else {
            modal = preModal;
        }
        const modalImg = modal.querySelector('.modal-content');
        const closeButton = modal.querySelector('.close');
        const prevButton = modal.querySelector('.prev');
        const nextButton = modal.querySelector('.next');

        if (!preModal) {
            prevButton.addEventListener('click', prevImage);
            nextButton.addEventListener('click', nextImage);
            closeButton.addEventListener('click', closeModal);
            modalImg.addEventListener('wheel', function (event) {
                event.preventDefault(); // Prevent default scrolling behavior

                const zoomStep = 0.1; // Zoom step factor
                let currentZoom = parseFloat(getComputedStyle(modalImg).getPropertyValue('transform').split(' ')[3]) || 1;

                const deltaY = event.deltaY;
                if (deltaY < 0) {
                    currentZoom += zoomStep; // Zoom in
                } else if (deltaY > 0 && currentZoom > zoomStep) {
                    currentZoom -= zoomStep; // Zoom out (with minimum zoom step check)
                }

                modalImg.style.transform = `scale(${currentZoom})`; // Apply zoom using scale transform
            });

            if (isTouchDevice) {
                prevButton.addEventListener('touchstart', () => setButtonSize(prevButton, true));
                prevButton.addEventListener('touchend', () => setButtonSize(prevButton, false));
                nextButton.addEventListener('touchstart', () => setButtonSize(nextButton, true));
                nextButton.addEventListener('touchend', () => setButtonSize(nextButton, false));
            } else {
                prevButton.addEventListener('mousedown', () => setButtonSize(prevButton, true));
                prevButton.addEventListener('mouseup', () => setButtonSize(prevButton, false));
                nextButton.addEventListener('mousedown', () => setButtonSize(nextButton, true));
                nextButton.addEventListener('mouseup', () => setButtonSize(nextButton, false));
            }
        }
        
        fanartImages.forEach((image) => {
            if (isTouchDevice) {
                // For touch devices, use double-tap event
                let tapCount = 0;
                const tapDelay = 1000; // Adjust this value as needed for double-tap detection
        
                image.addEventListener('touchstart', function (event) {
                    tapCount++;
        
                    if (tapCount === 1) {
                        setTimeout(() => {
                            tapCount = 0;
                        }, tapDelay);
                    } else if (tapCount === 2) {
                        tapCount = 0; // Reset tap count for next double-tap
        
                        // Handle double-tap event
                        clickShowImage(parseInt(image.alt, 10));
                    }
                });
            } else {
                // For non-touch devices, use single click event
                image.addEventListener('click', () => clickShowImage(parseInt(image.alt, 10)));
            }
        });


        function clickShowImage(index) {
            fanartImages = viewnode.querySelectorAll("div[is='emby-scroller']:not(.hide) .imageSection .my-fanart-image");
            const selectedImage = fanartImages[index];
            if (selectedImage) {
                modalImg.style.opacity = '0';
                modalImg.src = selectedImage.src;
                modalImg.alt = selectedImage.alt;
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                modalImg.style.transform = `scale(1)`;
                modal.classList.remove('modal-closing'); // Remove closing animation class if previously applied

                // Fade in the modal image
                fadeIn(modalImg, 500); // 500ms duration for fade-in effect
            }
        }

        function myShowImage(index) {
            fanartImages = viewnode.querySelectorAll("div[is='emby-scroller']:not(.hide) .imageSection .my-fanart-image");
            if (index >= fanartImages.length) {
                showToast({
                    text: '已到最后',
                    icon: "&#10095;"
                })
                return
            }
            const selectedImage = fanartImages[index];
        
            if (selectedImage) {
                modalImg.style.opacity = '0';
                modalImg.src = selectedImage.src;
                modalImg.alt = selectedImage.alt;
                modalImg.style.transform = `scale(1)`;
                // Fade in the modal image
                fadeIn(modalImg, 500); // 500ms duration for fade-in effect
            }
        }

        function nextImage() {  
            const index = parseInt(modalImg.alt, 10);
            let newIndex = index + 1;
            myShowImage(newIndex);
        }
    
        function prevImage() {
            const index = parseInt(modalImg.alt, 10);
            let newIndex = index - 1;
            if (newIndex < 0) {
                newIndex = 0;
                showToast({
                    text: '已到最前',
                    icon: "&#10094;"
                })
            } else {
                myShowImage(newIndex);
            }
        }

        function closeModal() {
            modal.classList.add('modal-closing'); // Apply closing animation class
            setTimeout(() => {
                modal.style.display = 'none'; // Hide the modal after animation completes
                modal.classList.remove('modal-closing'); // Remove closing animation class
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
    }


    function showToast(options) {
        Emby.importModule("./modules/toast/toast.js").then(function(toast) {
            return toast(options)
        })
    }


    async function actorMoreInject() {
        //removeExisting('myActorMoreSlider');     
        //removeExisting('myDbActorSlider')

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

                // adjust item card distance with different window size
                const actorMoreSections = document.querySelectorAll('.actorMoreSection');
                if (actorMoreSections.length == 1) {
                    window.addEventListener('resize', function () {
                        adjustCardOffset('.actorMoreSection', '.actorMoreItemsContainer', '.portraitCard');
                    });
                }
                adjustCardOffset('.actorMoreSection', '.actorMoreItemsContainer', '.portraitCard');
            }
        }
    }

    async function javdbActorInject() { 
        const showJavDbFlag = (item.CustomRating && item.CustomRating === 'JP-18+') || (item.OfficialRating && item.OfficialRating === 'JP-18+');
        if (OS_current != 'iphone' && showJavDbFlag && fetchJavDbFlag && actorName.length > 0) {
            let insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myActorMoreSlider");
            if (!insertSection) {
                insertSection = similarSection;
            }
            let isCensored = true;
            if (item.Genres.includes("无码")) { isCensored = false; }
            // search actor name from javdb
            let javDbMovies = await fetchDbActor(actorName, isCensored);
            if (javDbMovies) {
                if (actorMovieNames.length > 0) {
                    javDbMovies = javDbMovies.filter(movie => !actorMovieNames.includes(movie.Code));
                }
                if (javDbMovies.length ==0) return
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

                const slider2 = createSliderLarge(`${actorName} 更多作品（来自JavDB，共${javDbMovies.length}部）`, imgHtml2, "actorMoreSection2", "myScrollContainer2", "myitemsContainer2", actorUrl);
                const sliderElement2 = document.createElement('div');
                sliderElement2.id = 'myDbActorSlider';
                sliderElement2.innerHTML = slider2;
                insertSection.insertAdjacentElement('afterend', sliderElement2);

                // adjust item card distance with different window size
                const actorMoreSections2 = document.querySelectorAll('#actorMoreSection2');
                if (actorMoreSections2.length == 1) {
                    window.addEventListener('resize', function () {
                        adjustCardOffset('#actorMoreSection2', '#myitemsContainer2', '.backdropCard');
                    });
                }
                adjustCardOffset('#actorMoreSection2', '#myitemsContainer2', '.backdropCard');

                showToast({
                    text: `${actorName} 更多作品=>加载成功`,
                    icon: "&#10004;"
                });

                return
            }
            showToast({
                text: `${actorName} 更多作品=>加载失败`,
                icon: "&#10006;"
            });
        }
        
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
        setTimeout(() => {
            adjustCardOffset('.actorMoreSection', '.actorMoreItemsContainer', '.portraitCard');
            adjustCardOffset('#actorMoreSection2', '#myitemsContainer2', '.backdropCard');
            adjustCardOffset('#seriesMoreSection', '#myitemsContainer3', '.backdropCard');
        }, 500);
    }


    async function seriesInject() {
        if (OS_current === 'iphone' || !fetchJavDbFlag) return
        let seriesName, similarSection, tagMovies;
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
            tagMovies = await getTagMovies(series[0]);
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
        let javDbMovies = await fetchDbSeries(seriesName_jp);
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

        tagMovies.length > 0 && (javDbMovies = javDbMovies.filter(movie => !tagMovies.includes(movie.Code)));
        if (javDbMovies.length == 0) return

        javDbMovies.sort(() => Math.random() - 0.5);
        let imgHtml2 = '';
        for (let i = 0; i < javDbMovies.length; i++) {
            imgHtml2 += createItemContainerLarge(javDbMovies[i], i);
        };
        const seriesName_trans = await translateOnly(seriesName_jp);
        const slider2 = createSliderLarge(`系列: ${seriesName} （${seriesName_trans}） 更多作品（来自JavDB，共${javDbMovies.length}部）`, imgHtml2, "seriesMoreSection", "myScrollContainer3", "myitemsContainer3", seriesUrl);
        const sliderElement2 = document.createElement('div');
        sliderElement2.id = 'myDbSeriesSlider';
        sliderElement2.innerHTML = slider2;

        let insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myDbActorSlider"); 
        !insertSection && (insertSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myActorMoreSlider"));
        !insertSection && (insertSection = similarSection);

        insertSection.insertAdjacentElement('afterend', sliderElement2);

        showToast({
            text: `系列: ${seriesName} 更多作品=>加载成功`,
            icon: "&#10004;"
        });

        if (item.Type != 'BoxSet') {
            // adjust item card distance with different window size
            const seriesMoreSections = viewnode.querySelectorAll('#seriesMoreSection');
            if (seriesMoreSections.length == 1) {
                window.addEventListener('resize', function () {
                    adjustCardOffset('#seriesMoreSection', '#myitemsContainer3', '.backdropCard');
                });
            }
            adjustCardOffset('#seriesMoreSection', '#myitemsContainer3', '.backdropCard');
        } else {
            for (let movie of javDbMovies) {
                let insertItem = await checkEmbyExist(movie.Code);
                if (insertItem) {
                    insertItemToCollection(insertItem.Id, item.Id);
                    showToast({
                        text: `${insertItem.Name} added to the collection`,
                        icon: "&#xf0c2;"
                    })
                }
            }
        }

        
        
    }

    async function checkEmbyExist(movie) {
        const search_url = `${ApiClient._serverAddress}/emby/Items?api_key=${ApiClient.accessToken()}&Recursive=true&IncludeItemTypes=Movie&SearchTerm=${movie}`;
        try {
            const movies = await fetchJsonData(search_url);
            if (movies.Items.length > 0) return movies.Items[0];
            else return null;
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            return null; // Return null or handle the error case accordingly
        }
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
        return actorNames.length > 0 ? pickRandomLink(actorNames) : null;
    }


    async function getActorMovies() {
        try {
            const search_url = `${ApiClient._serverAddress}/emby/Items?api_key=${ApiClient.accessToken()}&Recursive=true&IncludeItemTypes=Movie&Fields=ProductionYear&Person=${actorName}`;
            const actorMoreMovies = await fetchJsonData(search_url);
            //const jsonData = JSON.stringify(await ApiClient.getItems(ApiClient.getCurrentUserId(), { 'Recursive': true ,'IncludeItemTypes': 'Movies', 'Person': actorName, 'api_key': ApiClient.accessToken() } ));

            if (actorMoreMovies.Items.length > 0) {
                let moreItems = Array.from(actorMoreMovies.Items);
                actorMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' ')); // for future use
                moreItems = moreItems.filter(moreItem => moreItem.Id != item.Id);
                if (actorMoreMovies.Items.length > 12) {
                    moreItems.sort(() => Math.random() - 0.5);
                    moreItems = moreItems.slice(0, 12);
                }
                return moreItems;
            } else {
                console.log('Failed to fetch JSON data.');
                return null; // Return null or handle the failure case accordingly
            }
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            return null; // Return null or handle the error case accordingly
        }
    }

    async function getTagMovies(tagName) {
        try {
            const search_url = `${ApiClient._serverAddress}/emby/Items?api_key=${ApiClient.accessToken()}&Recursive=true&IncludeItemTypes=Movie&Tags=${tagName}`;
            const tagMoreMovies = await fetchJsonData(search_url);
            //const jsonData = JSON.stringify(await ApiClient.getItems(ApiClient.getCurrentUserId(), { 'Recursive': true ,'IncludeItemTypes': 'Movies', 'Person': actorName, 'api_key': ApiClient.accessToken() } ));

            if (tagMoreMovies.Items.length > 0) {
                let moreItems = Array.from(tagMoreMovies.Items);
                const tagMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' '));
                return tagMovieNames;
            } else {
                console.log('Failed to fetch JSON data.');
                return null; // Return null or handle the failure case accordingly
            }
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            return null; // Return null or handle the error case accordingly
        }
    }

    async function getCollectionMovies(collectionId) {
        try {
            const search_url = `${ApiClient._serverAddress}/emby/Items?api_key=${ApiClient.accessToken()}&Recursive=true&IncludeItemTypes=Movie&ParentId=${collectionId}`;
            const tagMoreMovies = await fetchJsonData(search_url);
            //const jsonData = JSON.stringify(await ApiClient.getItems(ApiClient.getCurrentUserId(), { 'Recursive': true ,'IncludeItemTypes': 'Movies', 'Person': actorName, 'api_key': ApiClient.accessToken() } ));

            if (tagMoreMovies.Items.length > 0) {
                let moreItems = Array.from(tagMoreMovies.Items);
                const tagMovieNames = moreItems.map(movie => getPartBefore(movie.Name, ' '));
                return tagMovieNames;
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

    async function fetchDbActor(actorName, isCensored) {
        const HOST = "https://javdb.com";
        const url = `${HOST}/search?f=actor&locale=en&q=${actorName}`;
        let javdbActorData = await request(url);
        if (javdbActorData.length > 0) {
            // Create a new DOMParser instance
            const parser = new DOMParser();

            // Parse the HTML data string
            let parsedHtml = parser.parseFromString(javdbActorData, 'text/html');

            // Get the href attribute from the parsed HTML
            let actorLink = parsedHtml.querySelector('.box.actor-box a:first-of-type');
            if (actorLink && !actorLink.getAttribute('title').includes(actorName)) {
                let actorBoxs = parsedHtml.querySelectorAll('.box.actor-box');
                for (let actorBox of actorBoxs) {
                    let actorLink_temp = actorBox.querySelector('a');
                    if (actorLink_temp.getAttribute('title').includes(actorName)) {
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
            if (actorLink) {
                const hrefValue = actorLink.getAttribute('href');
                actorUrl = `${HOST}${hrefValue}`;

                //wait for random time
                await waitForRandomTime();
                javdbActorData = await request(actorUrl);
                if (javdbActorData.length > 0) {
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
                    return movies;
                }
                
            } else {
                console.error('Actor link not found');
            }
        }
        return null;
    }

    function waitForRandomTime() {
        const minWaitTime = 1000;
        const maxWaitTime = 2500;

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
                        firstAnchor = link;
                        break; // Stop the loop once we find the first link with more than 0 movies
                    }
                }

                // Check if the anchor tag exists
                if (firstAnchor) {
                    // Get the href attribute of the anchor tag
                    const firstHref = firstAnchor.getAttribute('href');
                    seriesUrl = `${HOST}${firstHref}`;
                    await waitForRandomTime();
                    javdbData = await request(seriesUrl);

                    if (javdbData) {
                        parsedHtml = parser.parseFromString(javdbData, 'text/html');

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
                            if (pickLink != seriesUrl) {
                                await waitForRandomTime();
                                javdbData = await request(pickLink);
                                if (javdbData.length > 0) {
                                    parsedHtml = parser.parseFromString(javdbData, 'text/html');
                                }
                            }
                        }
                        // Iterate over each item within the "movie-list"
                        const DBitems = parsedHtml.querySelectorAll('.movie-list .item');
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

                }
            }
        }
        return movies  
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
        //removeExisting('myTranslateBtn')
        //removeExisting('myTranslateBtn2')
        if ((OS_current === 'iphone') || (OS_current === 'android') || (googleApiKey.length == 0)) return

        // Select the element using document.querySelector
        const titleElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .itemName-primary")
        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");

        // Check if the element is found
        if (titleElement) {
            // Get the text content of the element
            //const text = titleElement.textContent.trim();
            if (containsJapanese(item.Name)) {
                
                const buttonhtml = `
                    <div id="myTranslateBtn" class="detailButton flex align-items-flex-start flex-wrap-wrap">
                        <button id="myTranslate" type="button" class="detailButton emby-button emby-button-backdropfilter raised-backdropfilter detailButton-primary" title="翻译标题">
                            <i class="md-icon md-icon-fill button-icon button-icon-left autortl icon-Translate"><i class="fa-solid fa-language"></i></i>
                            <span class="button-text">翻译标题</span>
                        </button>
                    </div>
                `;

                const style = `
                    @keyframes sandMeltAnimation {
                        0% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    
                    /* Apply styles to the button */
                    #myTranslateBtn {
                        opacity: 1;
                    }

                    .melt-away {
                        animation: sandMeltAnimation 1s ease-out forwards; /* Apply the animation */
                    }
                `;
                mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
                const styleElement = document.createElement('style');
                styleElement.innerHTML = style;
                const myTranslate = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myTranslate");
                myTranslate.onclick = translateJapaneseToChinese;
                myTranslate.appendChild(styleElement);
            }
        } else {
            console.log('titleElement not found');
        }
        const divElement = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .overview-text.readOnlyContent");

        if (divElement && item.Type != 'BoxSet') {
            //const text2 = divElement.textContent.trim();
            if (containsJapanese(item.Overview)) {
                const buttonhtml2 = `
                <div id="myTranslateBtn2" class="detailButton flex align-items-flex-start flex-wrap-wrap">
                    <button id="myTranslate2" type="button" class="detailButton emby-button emby-button-backdropfilter raised-backdropfilter detailButton-primary" title="翻译详情">
                        <i class="md-icon md-icon-fill button-icon button-icon-left autortl icon-Translate"><i class="fa-solid fa-language"></i></i>
                        <span class="button-text">翻译详情</span>
                    </button>
                </div>
                `;
                const style2 = `
                    @keyframes sandMeltAnimation {
                        0% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    
                    /* Apply styles to the button */
                    #myTranslateBtn2 {
                        opacity: 1;
                    }

                    .melt-away {
                        animation: sandMeltAnimation 1s ease-out forwards; /* Apply the animation */
                    }
                `;
                mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml2);
                const styleElement2 = document.createElement('style');
                styleElement2.innerHTML = style2;
                const myTranslate2 = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myTranslate2");
                myTranslate2.onclick = translateJapaneseToChinese2;
                myTranslate2.appendChild(styleElement);
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
            }, 1000); 
        } 
    }


})();
