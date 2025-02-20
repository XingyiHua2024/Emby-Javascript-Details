// add more movies for actor page
(async function () {
    "use strict";

    /******************** user config ********************/
    var adminUserId = ''; //Emby User ID
    var nameMap = {};
    const javDbFlag = true; //enable javdb scrap
    /*****************************************************/

    var item, viewnode, pageLinks;
    var currentPage = 0;
    var isCensored = true;
    var hasUncensored = false;
    var noCensored = false;
    var personType = 'actor';
    var fetchJavDbFlag = javDbFlag;
    var prefixDic = {};

    const OS_current = getOS();

    const embyDetailCss = `.has-trailer{position:relative;box-shadow:0 0 10px 3px rgb(255 255 255 / .8);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.has-trailer:hover{box-shadow:0 0 10px 3px rgb(255 0 150 / .3);transition:box-shadow 0.2s ease-in-out}.injectJavdb{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.injectJavdb:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.injectJavdb .button-text,.injectJavdb .button-icon{color:pink;transition:color 0.3s,filter 0.3s}.injectJavdb:hover .button-text,.injectJavdb:hover .button-icon{color:black!important}.injectJavbus .button-text,.injectJavbus .button-icon{color:#ff8181!important}.noUncensored{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.noUncensored .button-text,.noUncensored .button-icon{color:grey!important}.melt-away{animation:sandMeltAnimation 1s ease-out forwards}@keyframes sandMeltAnimation{0%{opacity:1}100%{opacity:0}}.my-fanart-image{display:inline-block;margin:8px 10px 8px 10px;vertical-align:top;border-radius:8px;height:27vh;transition:transform 0.3s ease,filter 0.3s ease;min-height:180px}.my-fanart-image-slider{height:20vh!important}.my-fanart-image:hover{transform:scale(1.03);filter:brightness(80%)}.modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0}@media (max-width:768px){.modal-content{max-width:80%;max-height:80%}}.modal-closing .modal-content{animation-name:shrinkAndRotate;animation-duration:0.3s;animation-timing-function:ease-out}.close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.prev,.next{position:absolute;width:40px;height:40px;line-height:40px;justify-content:center;align-items:center;display:flex;top:50%;background-color:rgb(0 0 0 / .5);color:#fff;border:none;cursor:pointer;font-size:35px;font-weight:700;transform:translateY(-50%) translateX(-50%);transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:35px}.prev{left:80px}.next{right:20px}.prev:hover,.next:hover{background-color:rgb(255 255 255 / .3);padding:35px}.close:hover{background-color:rgb(255 255 255 / .3);padding:10px}@keyframes shrinkAndRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.click-smaller{transform:scale(.9) translate(-50%,-50%);transition:transform 0.2s}.prev.disabled,.next.disabled{color:grey!important;cursor:default}@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-10px)}100%{transform:translateX(0)}}.modal-caption{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.modal-caption{bottom:100px}}.video-element{position:absolute;width:100%;height:100%;object-fit:contain;z-index:3;pointer-events:auto;transition:opacity 0.5s ease}.copy-link{color:lightblue;cursor:pointer;display:inline-block;transition:transform 0.1s ease}.copy-link:active{transform:scale(.95)}.media-info-item{display:block;width:100%;margin-top:10px;text-align:left}.media-info-item a{padding:5px 10px;background:rgb(255 255 255 / .15);margin-bottom:5px;margin-right:5px;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);font-weight:600;font-family:'Poppins',sans-serif;transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease;text-decoration:none;color:#fff}.media-info-item a:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.pageButton{cursor:pointer;padding:6px 16px;background:rgb(255 255 255 / 15%);border-radius:5px;box-shadow:0 2px 4px rgb(0 0 0 / .2);transition:background-color 0.3s ease,box-shadow 0.3s ease}.pageButton:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#pageInput-actorPage::-webkit-inner-spin-button,#pageInput-actorPage::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-actorPage{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:5px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit}#filterDropdown{width:auto;backdrop-filter:blur(5px);color:#fff;transition:background-color 0.3s ease,box-shadow 0.3s ease;margin-left:20px;font-family:inherit;padding:6px 16px;font-weight:inherit;line-height:inherit;border:none}#filterDropdown:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#filterDropdown:focus{outline:none;box-shadow:0 0 4px 2px rgb(255 255 255 / .8)}#filterDropdown option{font-family:inherit;color:#000;background:#fff;border:none;padding:5px;font-weight:inherit}#filterDropdown option:hover{background:#c8c8c8}.myCardImage{transition:filter 0.2s ease}.myCardImage:hover{filter:brightness(70%)}#toggleFanart{padding:10px 20px;font-size:18px;background:rgb(255 255 255 / .15);margin-top:15px;margin-bottom:15px;border:none;border-radius:8px;font-weight:700;font-family:'Poppins',sans-serif;color:#fff;text-decoration:none;cursor:pointer;display:block;margin-left:auto;margin-right:auto;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease}#toggleFanart:hover{transform:scale(1.1);background:linear-gradient(135deg,rgb(255 0 150 / .4),rgb(0 150 255 / .4));box-shadow:0 6px 20px rgb(0 0 0 / .3),0 0 15px rgb(0 150 255 / .6);color:#fff}#toggleFanart:active{transform:scale(.95);box-shadow:0 3px 12px rgb(0 0 0 / .3)}.bg-style{background:linear-gradient(to right top,rgb(0 0 0 / .98),rgb(0 0 0 / .2)),url(https://assets.nflxext.com/ffe/siteui/vlv3/058eee37-6c24-403a-95bd-7d85d3260ae1/5030300f-ed0c-473a-9795-a5123d1dd81d/US-en-20240422-POP_SIGNUP_TWO_WEEKS-perspective_WEB_0941c399-f3c4-4352-8c6d-0a3281e37aa0_large.jpg);background-attachment:fixed;background-repeat:no-repeat;background-position:center;background-size:cover}@media (max-width:50em){.swiper-thumbs{display:none!important}}`;

    await loadConfig();


    document.addEventListener("viewbeforeshow", function (e) {
        if (e.detail.contextPath.startsWith("/item?id=")) {
            if (!e.detail.isRestored) {
                !document.getElementById("embyDetailCss") && loadExtraStyle(embyDetailCss, 'embyDetailCss');
                const mutation = new MutationObserver(function () {
                    viewnode = e.target;
                    item = viewnode.controller?.currentItem;
                    if (item) {
                        mutation.disconnect();   
                        if (item.Type === 'Person') {
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
                viewnode = e.target;
                item = viewnode.controller.currentItem;
                if (item && item.Type === 'Person') {
                    setTimeout(() => {
                        injectLinks();
                    }, 500);
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
            adminUserId = config.adminUserId || adminUserId;
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
        fetchJavDbFlag = (ApiClient.getCurrentUserId() === adminUserId) ? javDbFlag : false;
        isDirector();
        await javDbInit();
        injectLinks();
    }

    function isDirector() {
        if (item.Taglines && item.Taglines.length > 0 && item.Taglines[0].includes('导演')) {
            personType = 'director';
        } else {
            const itemViews = viewnode.parentNode.querySelectorAll('div.itemView');
            for (let itemView of itemViews) {
                let people = itemView.controller.currentItem.People;
                if (people) {
                    let person = people.find(p => p.Name === item.Name);
                    if (person) {
                        personType = person.Type === 'Director' ? 'director' : 'actor';
                        if (personType === 'director' && (!item.Taglines || item.Taglines.length == 0)) {
                            item.Taglines.push('导演');
                            ApiClient.updateItem(item);
                        }
                        break
                    }
                }
            }
        }
    }

    function createButtonHtml(id, title, icon, text) {
        return `
            <button id="${id}" is="emby-button" type="button" class="detailButton raised emby-button detailButton-stacked" title="${title}">              
                <i class="md-icon md-icon-fill button-icon button-icon-left autortl">${icon}</i>
                <span class="button-text">${text}</span>
            </button>
        `;
    }


    function javdbButtonInit(actorUrl) {
        if (!fetchJavDbFlag || personType === 'director') return
        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        //const buttonHtml = createButtonHtml('javActorButton', '跳转至javdb.com', `<i class="fa-solid fa-magnifying-glass"></i>`, 'javdb');

        const iconJavDB = `<img height="24" src="data:image/x-icon;base64,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zf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs2pZgDMD3sA6Tp7AOjvegDn/3kA5/94AOb/dwDm/3YA5f91AOX/dADk/3MA5P9yAOT/cgDj/3EA4/9wAOP/bwDi/24A4v9uAOH/bQDh/20A4P9sAOD/agDe/2gA3P9nAdn/ZgHX/2UB1f9lAtL/ZQLQ/2QCzv9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs7zZQDORHwA6Yx8AOj/ewDo/3oA5/95AOf/eADm/3cA5v92AOb/dQDl/3UA5f9zAOT/cwDk/3IA5P9xAOP/cADj/3AA4v9vAOL/bgDh/24A4f9tAOD/bADg/2oA3/9pAN3/ZwHa/2cB1/9mAdX/ZQLT/2UC0P9kAs7/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALMnH4A6ch9AOj/fADo/3sA6P96AOf/eQDn/3gA5/93AOb/dgDm/3UA5f91AOX/cwDk/3MA5P9yAOP/cQDj/3AA4/9wAOL/bwDi/24A4f9tAOH/bQDg/2wA4P9rAN//aQDc/2gB2v9mAdf/ZgHV/2UC0/9lAtD/ZALO/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/YwHM2IAA6t9+AOn/fgDo/3wA6P97AOj/ewDn/3kA5/94AOf/eADm/3YA5v91AOX/dQDl/3MA5P9zAOT/cgDj/3AD3f97Htr/hTPb/4k72/+MQdz/jkbc/5BI3P+PSdv/j0nb/41J2f+MSdf/i0nW/4lG1P+GQtH/gjzP/341zf9xIMn/YwXI/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZAHN8IEA6uJ/AOr/fwDp/34A6f98AOj/fADo/3sA6P95AOf/eQDn/3gA5v92AOb/dgDl/3UA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" />`;


        const buttonHtml = createButtonHtml('javActorButton', '跳转至javdb.com', iconJavDB, 'javdb');

        mainDetailButtons.insertAdjacentHTML('afterbegin', buttonHtml);

        // Add event listener after the button is added to the DOM
        const button = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #javActorButton");
        //button.classList.add('detailButton-primary', 'injectJavdb');
        button.addEventListener('click', () => {
            window.open(actorUrl, '_blank');
        });

    }

    function javbusButtonInit() {
        if (!fetchJavDbFlag || (OS_current != 'windows' && OS_current != 'macOS') || personType === 'director') return
        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        const link = `https://www.javbus.com/search/${item.Name}&type=&parent=ce`;
        //const buttonhtml = createButtonHtml('javbusActorButton', '跳转至javbus.com', `<i class="fa-solid fa-magnifying-glass"></i>`, 'javbus');

        const iconJavBus = `<img height="24" src="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAMxWAADM2wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzNsAAMxWAADM2wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM2wAAzP8AAMz/AADM/wAAzP8AAMz/AADL/wAAzP8BAcz/AADL/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/BATN/0VF2v+Jief/kZHp/15e3/8PD8//AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADL/0hI2v/q6vv//Pz+//b2/f/6+v7/iIjn/wUFzf8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wEBzP+YmOr//////4uL6P9LS9v/4eH5/9zc+P8dHdL/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8CAsz/Skrb/39/5v8oKNT/DAzO/7+/8v/t7fv/Li7V/wAAy/8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAy/8AAMz/AADM/w0Nz/++vvL/7e38/zAw1v8AAMv/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8NDc//vr7y/+3t+/8wMNb/AADL/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/DQ3P/76+8v/t7fv/MDDW/wAAy/8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/w0Nz/++vvL/7e37/zAw1v8AAMv/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8NDc//urrx/+jo+v8vL9X/AADL/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/BATN/0BA2f9QUNz/EBDP/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMv/AADL/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzNsAAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzNsAAMxWAADM2wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzP8AAMz/AADM/wAAzNsAAMxWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==" />`;


        const buttonhtml = createButtonHtml('javbusActorButton', '跳转至javbus.com', iconJavBus, 'javbus');

        mainDetailButtons.insertAdjacentHTML('afterbegin', buttonhtml);
        const button = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #javbusActorButton");
        //button.classList.add('injectJavdb', 'injectJavbus');

        button.addEventListener('click', () => {
            window.open(link, '_blank');
        });
    }

    function censorButtonInit() {
        if (!fetchJavDbFlag || personType === 'director') return
        const buttonText = isCensored ? '有码' : '无码';
        //const buttonIcon = isCensored ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
        const buttonIcon = isCensored ? `<span class="material-symbols-outlined">visibility_lock</span>` : `<span class="material-symbols-outlined">visibility</span>`;

        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        const buttonhtml = createButtonHtml('isCensored-actorPage', '有码/无码', buttonIcon, buttonText);

        mainDetailButtons.insertAdjacentHTML('afterbegin', buttonhtml);
    }

    function toggleCensorButton(delay = 0) {
        isCensored = !isCensored;
        const toggleButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #isCensored-actorPage");
        if (toggleButton) {
            const toggleIcon = toggleButton.querySelector(".button-icon");
            setTimeout(() => {
                toggleButton.querySelector('.button-text').innerText = isCensored ? '有码' : '无码';
                //toggleIcon.innerHTML = isCensored ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
                toggleIcon.innerHTML = isCensored ? `<span class="material-symbols-outlined">visibility_lock</span>` : `<span class="material-symbols-outlined">visibility</span>`;
            }, delay);
        }
    }


    async function researchJav() {
        currentPage = 0;
        showToast({
            text: `${isCensored ? '有码' : '无码'}资源=>搜索中。。。`,
            //icon: `<i class="fa-solid fa-magnifying-glass"></i>`
            icon: `<span class="material-symbols-outlined">mystery</span>`
        });
        let javDbMovies = await fetchDbActor(item.Name, false);

        if (javDbMovies.length > 0) {
            javDbMovies = await filterDbMovies(javDbMovies);
            if (javDbMovies.length == 0) {
                showToast({
                    text: '没有找到相关资源',
                    icon: `<span class="material-symbols-outlined">search_off</span>`
                });
                return
            } else {
                showToast({
                    text: `${isCensored ? '有码' : '无码'}资源=>加载成功`,
                    icon: `<span class="material-symbols-outlined">check_circle</span>`
                });
            }
            changePage(currentPage);

        }
    }


    async function javDbInit() {
        if (!fetchJavDbFlag) return;
        if (!containsJapanese(item.Name) && (item.Name.includes(' ') || item.Name.includes('·'))) return;
        if (personType != 'director' && !isAVIdol()) return;
         
        pageLinks = [];
        isCensored = true;
        const linkedItems = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .linkedItems");

        let javDbMovies = await fetchDbActor(item.Name);
        if (javDbMovies) {
            javDbMovies = await filterDbMovies(javDbMovies);
            if (javDbMovies.length == 0) return

            let imgHtml = '';
            for (let i = 0; i < javDbMovies.length; i++) {
                imgHtml += createItemContainerLarge(javDbMovies[i], i);
            }

            const slider = createSliderLarge(`更多作品（来自JavDB，共${javDbMovies.length}部）`, imgHtml, "actorMoreSection-actorPage", "myitemsContainer-actorPage");
            const sliderElement = document.createElement('div');
            sliderElement.id = 'myDbActorSlider-actorPage';
            sliderElement.innerHTML = slider;
            linkedItems.insertAdjacentElement('afterend', sliderElement);

            const prevPageButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #prevPage-actorPage");
            const nextPageButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #nextPage-actorPage");
            //const checkBoxNextPage = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #checkBoxNextPage");
            const filterDropdown = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #filterDropdown");
            const inputPageNum = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #pageInput-actorPage");
            currentPage = 0;

            prevPageButton.addEventListener('click', function () {
                if (currentPage <= 0) {
                    currentPage = 0;
                    showToast({
                        text: '已到最前',
                        icon: `<span class="material-symbols-outlined">first_page</span>`
                    });
                    return;
                }
                currentPage--;
                changePage(currentPage);
            });

            nextPageButton.addEventListener('click', function () {
                if (currentPage >= pageLinks.length - 1) {
                    currentPage = pageLinks.length - 1;
                    showToast({
                        text: '已到最后',
                        icon: `<span class="material-symbols-outlined">last_page</span>`
                    });
                    return;
                }
                currentPage++;
                changePage(currentPage);
            });

            inputPageNum.addEventListener('change', (event) => {
                const pageNumber = parseInt(event.target.value, 10);
                if (pageNumber < 1) {
                    currentPage = 0;
                } else if (pageNumber > pageLinks.length) {
                    currentPage = pageLinks.length - 1;
                } else {
                    currentPage = pageNumber - 1;
                }
                changePage(currentPage);
            });

            filterDropdown.addEventListener('change', filterVR);
        } else if (personType === 'actor') {
            showToast({
                text: 'javdb加载失败',
                icon: `<span class="material-symbols-outlined">search_off</span>`
            });
        }

        let h2Element = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .linkedItems .sectionTitle-cards");
        if (h2Element && h2Element.textContent === '电影') {
            const actorMovieNames = await getActorMovies(item.Name);
            h2Element.textContent += `（共${actorMovieNames.length}部）`;
        }
    }

    async function filterDbMovies(javDbMovies) {
        const results = await Promise.all(
            javDbMovies.map(movie => checkEmbyExist(movie.Code).then(exists => exists ? null : movie))
        );
        return results.filter(Boolean);
    }


    async function changePage(index) {
        if (index >= pageLinks.length) return
        const javdbActorData = await request(pageLinks[index]);
        if (javdbActorData.length > 0) {
            const parser = new DOMParser();
            const parsedHtml = parser.parseFromString(javdbActorData, 'text/html');

            const paginationList = parsedHtml.querySelector('.pagination-list');
            if (paginationList) {
                const links = paginationList.querySelectorAll('a.pagination-link');
                updatePageLinks(links);
            }
            const DBitems = parsedHtml.querySelectorAll('.movie-list .item');
            let javDbMovies = arrangeDBitems(DBitems);
            if (javDbMovies) {
                
                javDbMovies = await filterDbMovies(javDbMovies);
                if (javDbMovies.length == 0) return

                let imgHtml = '';
                for (let i = 0; i < javDbMovies.length; i++) {
                    imgHtml += createItemContainerLarge(javDbMovies[i], i);
                };
                const itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myitemsContainer-actorPage");
                itemsContainer.innerHTML = imgHtml;
                updatePageLinksText(index+1, pageLinks.length);
                viewnode.querySelector("div[is='emby-scroller']:not(.hide) #text-actorPage").textContent = `更多作品（来自JavDB，共${javDbMovies.length}部）`;
                //const checkBoxNextPage = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #checkBoxNextPage");
                //checkBoxNextPage.checked = false;
                const filterDropdown = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #filterDropdown");
                filterDropdown.value = 'all';
            }
        }
    }

    function updatePageLinksText(inputValue, newLength) {
        const pageNumberSpan = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #pageNumber-actorPage");
        if (pageNumberSpan) {
            const textNode = pageNumberSpan.lastChild; // Get the last child (text node)
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                // Update the text content without affecting other elements
                textNode.textContent = `/${newLength}页`;
            }
            const inputBox = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #pageInput-actorPage");
            if (inputBox) {
                inputBox.max = newLength;
                inputBox.value = inputValue;
            }
        }
    }

    function updatePageLinks(links) {
        const HOST = "https://javdb.com";
        links.forEach(link => {
            const pageNumber = getPageNumber(link.textContent);
            const href = `${HOST}${link.getAttribute('href')}`;

            if (pageNumber > pageLinks.length) {
                pageLinks.push(href);
            }
        });
        function getPageNumber(text) {
            return parseInt(text.trim(), 10);
        }
    }


    function createSliderLarge(text, html, sectionId, itemsContainerId) {
        const slider = `
            <div id=${sectionId} class="linked-Movie-section verticalSection verticalSection-cards">
                <div class="sectionTitleContainer padded-left padded-left-page padded-right sectionTitleContainer-cards focusable" data-focusabletype="nearest">
                    <h2 class="sectionTitle sectionTitle-cards">
                        <span id="text-actorPage">${text}</span>
                    </h2>
                </div>
                <div id=${itemsContainerId} is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-left-page padded-right vertical-wrap">
                    ${html}
                </div>
                <h3 class="flex sectionTitle aline-items-center itemsViewSettingsContainer">
                    <span id="prevPage-actorPage" class="pageButton">上一页</span>
                    <span id="pageNumber-actorPage" class="pageNumber" style="padding: 0 20px;">
                        第<input 
                            id="pageInput-actorPage" 
                            type="number" 
                            min="1" 
                            max="${pageLinks.length}" 
                            value="1" 
                          >/${pageLinks.length}页
                    </span>
                    <span id="nextPage-actorPage" class="pageButton">下一页</span>
                    <select id="filterDropdown" class="emby-select-wrapper emby-select-wrapper-inline pageButton" name="filterDropdown">
                        <option value="all">All</option>
                        <option value="vr">VR Only</option>
                        <option value="non-vr">Non-VR</option>
                    </select>
                </h3>
            </div>
        `;
        return slider
    }

    function createItemContainerLarge(itemInfo, increment) {
        const imgUrl = itemInfo.ImgSrc;
        const title = `${itemInfo.Code} ${itemInfo.Name}`;
        const link = `https://javdb.com${itemInfo.Link}?locale=zh`;
        const score = itemInfo.Score;
        const scoreStr = score.match(/^(\d+(\.\d+)?)/);
        const scoreNum = scoreStr ? parseFloat(scoreStr[0]) : null;
        const scoreHighlight = scoreNum && scoreNum > 4.4 ? " has-trailer" : "";
        const time = itemInfo.Time;
        const itemContainer = `
            <div class="card backdropCard card-horiz card-hoverable card-autoactive" tabindex="0" draggable="true">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop myCardImage${scoreHighlight}">
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
        return itemContainer;
    }


    async function getActorMovies(actorName) {
        const actorMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie',
                Person: actorName
            }
        );

        if (actorMoreMovies.Items.length > 0) {
            let moreItems = Array.from(actorMoreMovies.Items);
            const movieNames = moreItems.map(movie => getPartBefore(movie.Name, ' '));

            return movieNames;
        } else {
            return null;
        }   
    }

    function javdbNameMap(name) {
        if (!name) return "";
        const localName = nameMap[name] || getPartBefore(name, "（");
        return localName.replace(/・/g, "･");
    }

    async function fetchDbActor(name, insertFlag = true) {
        const actorName = javdbNameMap(name);
        if (insertFlag) {
            isCensored = true;
            hasUncensored = false;        
        }

        pageLinks = [];
        const HOST = "https://javdb.com";
        const url = `${HOST}/search?f=${personType}&locale=zh&q=${actorName}`;

        let actorLink = null;
        let actorUrl = getUrl(item.Overview, "===== 外部链接 =====", "JavDb");

        let javdbActorData = (!actorUrl || personType != 'director') ? await request(url) : '';
        if (javdbActorData.length > 0) {
            // Create a new DOMParser instance
            const parser = new DOMParser();

            // Parse the HTML data string
            let parsedHtml = parser.parseFromString(javdbActorData, 'text/html');

            if (personType === 'director') {
                const directorBoxes = parsedHtml.querySelectorAll('#directors .box');
                actorLink = Array.from(directorBoxes).find(box =>
                    box.getAttribute('title')?.split(', ').includes(actorName)
                ) || null;
            } else {
                if (!isCensored) {
                    let actorLink_temp = null;
                    const infoElements = parsedHtml.querySelectorAll('.actors .box.actor-box .info');
                    if (infoElements.length > 0) {
                        for (let infoElement of infoElements) {
                            if (infoElement.textContent.includes("無碼") && infoElement.closest("a").getAttribute('title').split(' ').includes(actorName)) {
                                actorLink_temp = infoElement.closest("a");
                                break;
                            }
                        }
                        if (!actorLink_temp && infoElements[0].textContent.includes("無碼")) {
                            actorLink_temp = infoElements[0].closest("a");
                        }
                    }
                    if (actorLink_temp) {
                        actorLink = actorLink_temp;
                    } else {
                        showToast({
                            text: '未找到无码影片',
                            icon: `<span class="material-symbols-outlined">search_off</span>`
                        });
                        toggleCensorButton(1000);
                    }
                }

                if (isCensored) {
                    let actorBoxs = parsedHtml.querySelectorAll('.actors .box.actor-box');
                    let actorLink_censored = null;
                    let actorLink_uncensored = null;
                    if (actorBoxs.length > 0) {
                        for (let actorBox of actorBoxs) {
                            let infoElement = actorBox.querySelector('.info');
                            let actorLink_temp = actorBox.querySelector('a');
                            if (infoElement && infoElement.textContent.includes('無碼')) {
                                hasUncensored = true;
                                if (actorLink_temp.getAttribute('title').split(' ').includes(actorName) && !actorLink_uncensored) {
                                    actorLink_uncensored = actorLink_temp;
                                }
                            }
                            if (!infoElement && actorLink_temp && actorLink_temp.getAttribute('title').split(', ').includes(actorName) && !actorLink_censored) {
                                actorLink_censored = actorLink_temp;
                            }
                        }
                        if (actorLink_censored) {
                            actorLink = actorLink_censored;
                        } else if (actorLink_uncensored) {
                            actorLink = actorLink_uncensored;
                            if (!insertFlag) {
                                showToast({
                                    text: '未找到有码影片',
                                    icon: `<span class="material-symbols-outlined">search_off</span>`
                                });
                            }
                            noCensored = true;
                            toggleCensorButton(1000);
                        }
                    }
                }
            }
            if (insertFlag && personType != 'director') {
                censorButtonInit();
                javbusButtonInit();
                 // Get the button element
                const toggleButton = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #isCensored-actorPage");

                if (!hasUncensored || noCensored) {
                    toggleButton.classList.add('noUncensored');
                    const buttonIcon = toggleButton.querySelector('.button-icon');
                    //buttonIcon.classList.add('icon_circle_strike');
                    toggleButton.addEventListener('click', () => {
                        showToast({
                            text: `${isCensored ? '无码' : '有码'}作品=>加载失败`,
                            icon: `<span class="material-symbols-outlined">search_off</span>`
                        });
                    });
                } else {
                    toggleButton.addEventListener('click', () => {
                        toggleCensorButton();
                        researchJav();
                    });
                }
            }
        }

        if (actorLink) {
            const hrefValue = actorLink.getAttribute('href');
            actorUrl = `${HOST}${hrefValue}`;
            insertFlag && addLink(item.Overview || '', "===== 外部链接 =====", "JavDb", actorUrl);        
        }

        if (!actorUrl) {
            console.error('Actor link not found');
            insertFlag && javdbButtonInit(url);
            return null
        }

        insertFlag && javdbButtonInit(actorUrl);      

        //wait for random time
        await waitForRandomTime();
        javdbActorData = await request(actorUrl);
        if (javdbActorData.length > 0) {
            const parser = new DOMParser();
            let parsedHtml = parser.parseFromString(javdbActorData, 'text/html');
            const paginationList = parsedHtml.querySelector('.pagination-list');
            if (paginationList) {
                pageLinks = [...paginationList.querySelectorAll('a.pagination-link')].map(link => `${HOST}${link.getAttribute('href')}`);
            }
            else {
                pageLinks.push(actorUrl);
            }
            // Iterate over each item within the "movie-list"
            const DBitems = parsedHtml.querySelectorAll('.movie-list .item');
            const movies = arrangeDBitems(DBitems);
            return movies;
        }
        return null;          
    }

    function arrangeDBitems(DBitems) {
        if (!DBitems) return null;
        const movies = [];
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


    function getPartBefore(str, char) {
        return str.split(char)[0];
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
                    return responseType === "json" ? response.json() : response.text();
                })
                .then(parsedResponse => {
                    resolve(parsedResponse);
                })
                .catch(error => {
                    reject(error);
                });
        });
    };

    function showToast(options) {
        Emby.importModule("./modules/toast/toast.js").then(function (toast) {
            return toast(options)
        })
    }


    function filterVR() {
        const itemsContainer = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #myitemsContainer-actorPage");
        if (!itemsContainer) return;
        const itemCards = itemsContainer.querySelectorAll('.backdropCard');
        if (itemCards.length === 0) return;

        // Get the selected filter value from the dropdown
        const filterDropdown = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #filterDropdown");
        const filterValue = filterDropdown ? filterDropdown.value : 'all';

        for (let itemCard of itemCards) {
            const cardText = itemCard.querySelector('.cardText').textContent;

            if (filterValue === 'vr') {
                if (!cardText.includes('VR')) {
                    itemCard.style.opacity = '0.5';
                } else {
                    itemCard.style.opacity = '1';
                }
            } else if (filterValue === 'non-vr') {
                if (cardText.includes('VR')) {
                    itemCard.style.opacity = '0.5';
                } else {
                    itemCard.style.opacity = '1';
                }
            } else {
                // Show all items if the filter value is 'all'
                itemCard.style.opacity = '1';
            }
        }
    }

    function extractLinks(text, startLine) {
        if (text && text.length > 0 && !text.includes('===== 个人资料 =====') && !text.includes('===== 外部链接 =====') && personType === 'actor') {
            item.Overview = '';
            //ApiClient.updateItem(item);
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

    function addLink(text, startLine, newKey, newValue) {
        if (!startLine || !newKey || !newValue) {
            console.error("Invalid input. Make sure text, startLine, newKey, and newValue are provided.");
            return;
        }

        if (!text && personType === 'actor') return;
    
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
    }


    function getUrl(text, sectionHeader, key) {
        if (!text || !sectionHeader || !key) {
            //console.error("Invalid input. Make sure text, sectionHeader, and key are provided.");
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

    

    function injectLinks() {
        if (!fetchJavDbFlag) return;
        if (!containsJapanese(item.Name) && (item.Name.includes(' ') || item.Name.includes('·'))) return;
        if (personType != 'director' && !isAVIdol()) return;

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
    }


    async function checkEmbyExist(movie) {
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

    function isAVIdol() {
        return (
            item.Taglines?.[0]?.includes('AV女优') || item.Taglines?.[0]?.includes('AV女優') ||
            item.ExternalUrls?.some(url => url.Name === "MetaTube") ||
            item.Overview?.includes('AV女优') || item.Overview?.includes('===== 外部链接 =====')
        );
    }

    function containsJapanese(text) {
        // Regular expression to match Japanese characters
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;

        return japaneseRegex.test(text);
    }


})();


