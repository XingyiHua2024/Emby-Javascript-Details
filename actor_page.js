// add more movies for actor page
(async function () {
    "use strict";

    class CommonUtils {
        static loadExtastyle(content, id) {
            let style = document.createElement("style");
            style.id = id; // Set the ID for the style element
            style.innerHTML = content; // Set the CSS content
            document.head.appendChild(style); // Append the style element to the document head
        }
    }

    // config: enable javdb scrap
    const javDbFlag = true;

    var item, viewnode, pageLinks;
    var currentPage = 0;
    var isCensored = true;
    var hasUncensored = false;
    var noCensored = false;
    var personType = 'actor';
    var fetchJavDbFlag = javDbFlag;

    var adminUserId = '', nameMap = {};

    const OS_current = getOS();

    const embyDetailCss = `.has-trailer{position:relative;box-shadow:0 0 10px 3px rgb(255 255 255 / .8);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.has-trailer:hover{box-shadow:0 0 10px 3px rgb(255 0 150 / .3);transition:box-shadow 0.2s ease-in-out}.injectJavdb{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.injectJavdb:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.injectJavdb .button-text,.injectJavdb .button-icon{color:pink;transition:color 0.3s,filter 0.3s}.injectJavdb:hover .button-text,.injectJavdb:hover .button-icon{color:black!important}.injectJavbus .button-text,.injectJavbus .button-icon{color:#ff8181!important}.noUncensored{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.noUncensored .button-text,.noUncensored .button-icon{color:grey!important}.melt-away{animation:sandMeltAnimation 1s ease-out forwards}@keyframes sandMeltAnimation{0%{opacity:1}100%{opacity:0}}.my-fanart-image{display:inline-block;margin:8px 10px 8px 10px;vertical-align:top;border-radius:8px;height:27vh;transition:transform 0.3s ease,filter 0.3s ease;min-height:180px}.my-fanart-image-slider{height:20vh!important}.my-fanart-image:hover{transform:scale(1.03);filter:brightness(80%)}.modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0}@media (max-width:768px){.modal-content{max-width:80%;max-height:80%}}.modal-closing .modal-content{animation-name:shrinkAndRotate;animation-duration:0.3s;animation-timing-function:ease-out}.close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.prev,.next{position:absolute;width:40px;height:40px;line-height:40px;justify-content:center;align-items:center;display:flex;top:50%;background-color:rgb(0 0 0 / .5);color:#fff;border:none;cursor:pointer;font-size:35px;font-weight:700;transform:translateY(-50%) translateX(-50%);transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:35px}.prev{left:80px}.next{right:20px}.prev:hover,.next:hover{background-color:rgb(255 255 255 / .3);padding:35px}.close:hover{background-color:rgb(255 255 255 / .3);padding:10px}@keyframes shrinkAndRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.click-smaller{transform:scale(.9) translate(-50%,-50%);transition:transform 0.2s}.prev.disabled,.next.disabled{color:grey!important;cursor:default}@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-10px)}100%{transform:translateX(0)}}.modal-caption{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.modal-caption{bottom:100px}}.video-element{position:absolute;width:100%;height:100%;object-fit:contain;z-index:3;pointer-events:auto;transition:opacity 0.5s ease}.copy-link{color:lightblue;cursor:pointer;display:inline-block;transition:transform 0.1s ease}.copy-link:active{transform:scale(.95)}.media-info-item{display:block;width:100%;margin-top:10px;text-align:left}.media-info-item a{padding:5px 10px;background:rgb(255 255 255 / .15);margin-bottom:5px;margin-right:5px;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);font-weight:600;font-family:'Poppins',sans-serif;transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease;text-decoration:none;color:#fff}.media-info-item a:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.pageButton{cursor:pointer;padding:6px 16px;background:rgb(255 255 255 / 15%);border-radius:5px;box-shadow:0 2px 4px rgb(0 0 0 / .2);transition:background-color 0.3s ease,box-shadow 0.3s ease}.pageButton:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#pageInput-actorPage::-webkit-inner-spin-button,#pageInput-actorPage::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-actorPage{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:5px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit}#filterDropdown{width:auto;backdrop-filter:blur(5px);color:#fff;transition:background-color 0.3s ease,box-shadow 0.3s ease;margin-left:20px;font-family:inherit;padding:6px 16px;font-weight:inherit;line-height:inherit;border:none}#filterDropdown:hover{background:rgb(255 255 255 / 85%);color:#000;box-shadow:0 4px 8px rgb(0 0 0 / .4)}#filterDropdown:focus{outline:none;box-shadow:0 0 4px 2px rgb(255 255 255 / .8)}#filterDropdown option{font-family:inherit;color:#000;background:#fff;border:none;padding:5px;font-weight:inherit}#filterDropdown option:hover{background:#c8c8c8}.myCardImage{transition:filter 0.2s ease}.myCardImage:hover{filter:brightness(70%)}#toggleFanart{padding:10px 20px;font-size:18px;background:rgb(255 255 255 / .15);margin-top:15px;margin-bottom:15px;border:none;border-radius:8px;font-weight:700;font-family:'Poppins',sans-serif;color:#fff;text-decoration:none;cursor:pointer;display:block;margin-left:auto;margin-right:auto;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease}#toggleFanart:hover{transform:scale(1.1);background:linear-gradient(135deg,rgb(255 0 150 / .4),rgb(0 150 255 / .4));box-shadow:0 6px 20px rgb(0 0 0 / .3),0 0 15px rgb(0 150 255 / .6);color:#fff}#toggleFanart:active{transform:scale(.95);box-shadow:0 3px 12px rgb(0 0 0 / .3)}.bg-style{background:linear-gradient(to right top,rgb(0 0 0 / .98),rgb(0 0 0 / .2)),url(https://assets.nflxext.com/ffe/siteui/vlv3/058eee37-6c24-403a-95bd-7d85d3260ae1/5030300f-ed0c-473a-9795-a5123d1dd81d/US-en-20240422-POP_SIGNUP_TWO_WEEKS-perspective_WEB_0941c399-f3c4-4352-8c6d-0a3281e37aa0_large.jpg);background-attachment:fixed;background-repeat:no-repeat;background-position:center;background-size:cover}@media (max-width:50em){.swiper-thumbs{display:none!important}}`;

    await loadConfig();


    document.addEventListener("viewbeforeshow", function (e) {
        if (e.detail.contextPath.startsWith("/item?id=")) {
            if (!e.detail.isRestored) {
                !document.getElementById("embyDetailCss") && CommonUtils.loadExtastyle(embyDetailCss, 'embyDetailCss');
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
        }
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

        const iconJavDb = `<svg width="70.5" height="24" viewBox="0 0 326 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="166" y="11" width="160" height="93" fill="#2F80ED"></rect>
                        <path d="M196.781 27.0078H213.41C217.736 27.0078 221.445 27.4089 224.539 28.2109C227.633 29.013 230.44 30.5169 232.961 32.7227C239.521 38.3372 242.801 46.8737 242.801 58.332C242.801 62.1133 242.471 65.5651 241.812 68.6875C241.154 71.8099 240.137 74.6315 238.762 77.1523C237.387 79.6445 235.625 81.8789 233.477 83.8555C231.786 85.3737 229.939 86.5911 227.934 87.5078C225.928 88.4245 223.766 89.069 221.445 89.4414C219.154 89.8138 216.561 90 213.668 90H197.039C194.719 90 192.971 89.6562 191.797 88.9688C190.622 88.2526 189.849 87.2643 189.477 86.0039C189.133 84.7148 188.961 83.0534 188.961 81.0195V34.8281C188.961 32.0781 189.577 30.0872 190.809 28.8555C192.04 27.6237 194.031 27.0078 196.781 27.0078ZM201.723 37.1055V79.8594H211.391C213.51 79.8594 215.172 79.8021 216.375 79.6875C217.578 79.5729 218.824 79.2865 220.113 78.8281C221.402 78.3698 222.52 77.7253 223.465 76.8945C227.733 73.2852 229.867 67.069 229.867 58.2461C229.867 52.0299 228.922 47.375 227.031 44.2812C225.169 41.1875 222.863 39.2253 220.113 38.3945C217.363 37.5352 214.04 37.1055 210.145 37.1055H201.723ZM280.914 90H261.664C258.885 90 256.895 89.3841 255.691 88.1523C254.517 86.8919 253.93 84.901 253.93 82.1797V34.8281C253.93 32.0495 254.531 30.0586 255.734 28.8555C256.966 27.6237 258.943 27.0078 261.664 27.0078H282.074C285.082 27.0078 287.689 27.194 289.895 27.5664C292.1 27.9388 294.077 28.6549 295.824 29.7148C297.314 30.6029 298.632 31.7344 299.777 33.1094C300.923 34.4557 301.797 35.9596 302.398 37.6211C303 39.2539 303.301 40.987 303.301 42.8203C303.301 49.1224 300.15 53.7344 293.848 56.6562C302.126 59.2917 306.266 64.4193 306.266 72.0391C306.266 75.5625 305.363 78.7422 303.559 81.5781C301.754 84.3854 299.319 86.4622 296.254 87.8086C294.335 88.6107 292.129 89.1836 289.637 89.5273C287.145 89.8424 284.237 90 280.914 90ZM279.969 62.0273H266.691V80.418H280.398C289.021 80.418 293.332 77.3099 293.332 71.0938C293.332 67.9141 292.215 65.6081 289.98 64.1758C287.746 62.7435 284.409 62.0273 279.969 62.0273ZM266.691 36.5898V52.875H278.379C281.559 52.875 284.008 52.5742 285.727 51.9727C287.474 51.3711 288.806 50.2253 289.723 48.5352C290.439 47.332 290.797 45.9857 290.797 44.4961C290.797 41.3164 289.665 39.2109 287.402 38.1797C285.139 37.1198 281.688 36.5898 277.047 36.5898H266.691Z" fill="white"></path>
                        <path d="M47.4375 29.5469V65.5469C47.4375 68.6719 47.2969 71.3281 47.0156 73.5156C46.7656 75.7031 46.1719 77.9219 45.2344 80.1719C43.6719 83.9531 41.0938 86.9062 37.5 89.0312C33.9062 91.125 29.5312 92.1719 24.375 92.1719C19.7188 92.1719 15.8281 91.4375 12.7031 89.9688C9.60938 88.5 7.10938 86.125 5.20312 82.8438C4.20312 81.0938 3.39062 79.0781 2.76562 76.7969C2.14062 74.5156 1.82812 72.3438 1.82812 70.2812C1.82812 68.0938 2.4375 66.4219 3.65625 65.2656C4.875 64.1094 6.4375 63.5312 8.34375 63.5312C10.1875 63.5312 11.5781 64.0625 12.5156 65.125C13.4531 66.1875 14.1719 67.8438 14.6719 70.0938C15.2031 72.5 15.7344 74.4219 16.2656 75.8594C16.7969 77.2969 17.6875 78.5312 18.9375 79.5625C20.1875 80.5938 21.9688 81.1094 24.2812 81.1094C30.4375 81.1094 33.5156 76.5938 33.5156 67.5625V29.5469C33.5156 26.7344 34.125 24.625 35.3438 23.2188C36.5938 21.8125 38.2812 21.1094 40.4062 21.1094C42.5625 21.1094 44.2656 21.8125 45.5156 23.2188C46.7969 24.625 47.4375 26.7344 47.4375 29.5469ZM93.9844 84.9531C90.8906 87.3594 87.8906 89.1719 84.9844 90.3906C82.1094 91.5781 78.875 92.1719 75.2812 92.1719C72 92.1719 69.1094 91.5312 66.6094 90.25C64.1406 88.9375 62.2344 87.1719 60.8906 84.9531C59.5469 82.7344 58.875 80.3281 58.875 77.7344C58.875 74.2344 59.9844 71.25 62.2031 68.7812C64.4219 66.3125 67.4688 64.6562 71.3438 63.8125C72.1562 63.625 74.1719 63.2031 77.3906 62.5469C80.6094 61.8906 83.3594 61.2969 85.6406 60.7656C87.9531 60.2031 90.4531 59.5312 93.1406 58.75C92.9844 55.375 92.2969 52.9062 91.0781 51.3438C89.8906 49.75 87.4062 48.9531 83.625 48.9531C80.375 48.9531 77.9219 49.4062 76.2656 50.3125C74.6406 51.2188 73.2344 52.5781 72.0469 54.3906C70.8906 56.2031 70.0625 57.4062 69.5625 58C69.0938 58.5625 68.0625 58.8438 66.4688 58.8438C65.0312 58.8438 63.7812 58.3906 62.7188 57.4844C61.6875 56.5469 61.1719 55.3594 61.1719 53.9219C61.1719 51.6719 61.9688 49.4844 63.5625 47.3594C65.1562 45.2344 67.6406 43.4844 71.0156 42.1094C74.3906 40.7344 78.5938 40.0469 83.625 40.0469C89.25 40.0469 93.6719 40.7188 96.8906 42.0625C100.109 43.375 102.375 45.4688 103.688 48.3438C105.031 51.2188 105.703 55.0312 105.703 59.7812C105.703 62.7812 105.688 65.3281 105.656 67.4219C105.656 69.5156 105.641 71.8438 105.609 74.4062C105.609 76.8125 106 79.3281 106.781 81.9531C107.594 84.5469 108 86.2188 108 86.9688C108 88.2812 107.375 89.4844 106.125 90.5781C104.906 91.6406 103.516 92.1719 101.953 92.1719C100.641 92.1719 99.3438 91.5625 98.0625 90.3438C96.7812 89.0938 95.4219 87.2969 93.9844 84.9531ZM93.1406 66.4375C91.2656 67.125 88.5312 67.8594 84.9375 68.6406C81.375 69.3906 78.9062 69.9531 77.5312 70.3281C76.1562 70.6719 74.8438 71.375 73.5938 72.4375C72.3438 73.4688 71.7188 74.9219 71.7188 76.7969C71.7188 78.7344 72.4531 80.3906 73.9219 81.7656C75.3906 83.1094 77.3125 83.7812 79.6875 83.7812C82.2188 83.7812 84.5469 83.2344 86.6719 82.1406C88.8281 81.0156 90.4062 79.5781 91.4062 77.8281C92.5625 75.8906 93.1406 72.7031 93.1406 68.2656V66.4375ZM125.344 48.1094L135.703 77.1719L146.859 46.8438C147.734 44.4062 148.594 42.6875 149.438 41.6875C150.281 40.6562 151.562 40.1406 153.281 40.1406C154.906 40.1406 156.281 40.6875 157.406 41.7812C158.562 42.875 159.141 44.1406 159.141 45.5781C159.141 46.1406 159.031 46.7969 158.812 47.5469C158.625 48.2969 158.391 49 158.109 49.6562C157.859 50.3125 157.562 51.0625 157.219 51.9062L144.938 82.375C144.594 83.25 144.141 84.3594 143.578 85.7031C143.047 87.0469 142.438 88.2031 141.75 89.1719C141.094 90.1094 140.266 90.8438 139.266 91.375C138.297 91.9062 137.109 92.1719 135.703 92.1719C133.891 92.1719 132.438 91.7656 131.344 90.9531C130.281 90.1094 129.484 89.2031 128.953 88.2344C128.453 87.2344 127.594 85.2812 126.375 82.375L114.188 52.2344C113.906 51.4844 113.609 50.7344 113.297 49.9844C113.016 49.2344 112.766 48.4688 112.547 47.6875C112.359 46.9062 112.266 46.2344 112.266 45.6719C112.266 44.7969 112.531 43.9375 113.062 43.0938C113.594 42.2188 114.328 41.5156 115.266 40.9844C116.203 40.4219 117.219 40.1406 118.312 40.1406C120.438 40.1406 121.891 40.75 122.672 41.9688C123.484 43.1875 124.375 45.2344 125.344 48.1094Z" fill="currentColor"></path>
                      </svg>`;

        const buttonHtml = createButtonHtml('javActorButton', '跳转至javdb.com', iconJavDb, '');

        mainDetailButtons.insertAdjacentHTML('afterbegin', buttonHtml);

        // Add event listener after the button is added to the DOM
        const button = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #javActorButton");
        //button.classList.add('detailButton-primary', 'injectJavdb');
        button.addEventListener('click', () => {
            window.open(actorUrl, '_blank');
        });

    }

    function javbusButtonInit() {
        if (!fetchJavDbFlag || OS_current != 'windows' || personType === 'director') return
        const mainDetailButtons = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .mainDetailButtons");
        const link = `https://www.javbus.com/search/${item.Name}&type=&parent=ce`;
        //const buttonhtml = createButtonHtml('javbusActorButton', '跳转至javbus.com', `<i class="fa-solid fa-magnifying-glass"></i>`, 'javbus');
        const buttonhtml = createButtonHtml('javbusActorButton', '跳转至javbus.com', `<span class="material-symbols-outlined">mystery</span>`, 'javbus');

        mainDetailButtons.insertAdjacentHTML('afterbegin', buttonhtml);
        const button = viewnode.querySelector("div[is='emby-scroller']:not(.hide) #javbusActorButton");
        button.classList.add('injectJavdb', 'injectJavbus');

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

    

    function injectLinks() {
        if (!fetchJavDbFlag) return;
        if (!containsJapanese(item.Name) && (item.Name.includes(' ') || item.Name.includes('·'))) return;
        if (personType != 'director' && !isAVIdol()) return;

        const aboutSection = viewnode.querySelector("div[is='emby-scroller']:not(.hide) .aboutSection");
        const linksSection = aboutSection.querySelector(".linksSection");
        if (!linksSection) return
        const itemLinks = linksSection.querySelector('.itemLinks');
        const links = extractLinks(item.Overview || '', '===== 外部链接 =====');
        if (links.length == 0) return
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
        const prefixDic = { 
            "KIWVR": "408",
            "MAAN": "300",
            "DANDY": "104",
            "STCV": "529",
            "LUXU": "259",
            "SUKE": "428",
            "PAK": "483",
            "MIUM": "300",
            "NTK": "300",
            "JAC": "390",
            "SUKE": "428",
            "TEN": "459",
            "INSTV": "413"
        };

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


