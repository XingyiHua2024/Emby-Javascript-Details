(function () {
    "use strict";
    var item, viewnode, parentItem, paly_mutation1, isUpdatingImageUrls = false;
    var paly_mutation2;
    document.addEventListener("viewbeforeshow", function (e) {
        paly_mutation1?.disconnect();
        paly_mutation2?.disconnect();
        isUpdatingImageUrls = false;
        if (e.detail.type === "video-osd") {
            viewnode = e.target;
            if (!e.detail.isRestored) {
                const mutation = new MutationObserver(async function () {
                    item = viewnode.controller?.osdController?.currentItem || viewnode.controller?.currentPlayer?.streamInfo?.item;
                    if (item) {
                        mutation.disconnect();
                        (item.Type === 'Trailer') && insertMoreButton();
                    }
                });
                mutation.observe(document.body, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            }
            else {
                item = viewnode.controller.osdController.currentItem;
            }

        }
    });


    async function getParentItem() {
        const userId = ApiClient.getCurrentUserId();
        const itemId = item.Id || item.ParentThumbItemId;

        if (!itemId) return;

        // Try to load from localStorage
        const cacheKey = `parentItem-${itemId}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                parentItem = JSON.parse(cached);
                return;
            } catch (e) {
                console.warn("Failed to parse cached parentItem", e);
            }
        }

        // Fetch and cache if not cached
        if (item.Id) {
            if (!item.Name.includes('trailer')) {
                parentItem = item;
            } else {
                if (!item.ParentId) {
                    item = await ApiClient.getItem(userId, item.Id);
                }
                parentItem = await ApiClient.getItem(userId, item.ParentId);
            }
        } else {
            parentItem = await ApiClient.getItem(userId, item.ParentThumbItemId);
        }

        // Save to localStorage
        if (parentItem) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(parentItem));
            } catch (e) {
                console.warn("Failed to cache parentItem", e);
            }
        }
    }

    async function insertMoreButton() {
        const bottomSection = viewnode.querySelector('.videoOsdBottom');
        if (!bottomSection) return

        await getParentItem();

        let videoElement = document.querySelector(".htmlVideoPlayerContainer video");

        videoElement && videoElement.addEventListener('play', handleStreamInfoChange);

        updateTitle();

        //setTimeout(() => {
        //    unhidePeople();
        //}, 500);

        const tabContainers = bottomSection.querySelector('.videoosd-tabcontainers');

        const videoosdTab0 = tabContainers.querySelector('[data-index="0"].videoosd-tab');
        const videoosdTab3 = tabContainers.querySelector('[data-index="3"].videoosd-tab');

        paly_mutation1 = new MutationObserver(function () {
            let itemsContainer = videoosdTab0.querySelector('.itemsContainer');
            if (itemsContainer) {
                paly_mutation1.disconnect();
                itemsContainer.fetchData = fetchItem;
            }
        });
        paly_mutation1.observe(videoosdTab0, {
            childList: true,
            characterData: true,
            subtree: true,
        });

        paly_mutation2 = new MutationObserver(function () {
            (async () => {
                let itemsContainer = videoosdTab3.querySelector('.itemsContainer');
                if (itemsContainer) {
                   
                    const parentImages = await updateImageUrls(itemsContainer);
                    if (parentImages) {
                        paly_mutation2.disconnect();

                        if (parentImages.length > 0) {
                            setTimeout(() => {
                                updateNextImage(itemsContainer, parentImages);
                            }, 50);
                            
                            const originalFetchData = itemsContainer.fetchData;
                            itemsContainer.fetchData = function (query) {
                                const result = originalFetchData.call(this, query);
                                setTimeout(() => {
                                    updateNextImage(itemsContainer, parentImages);
                                }, 50);
                                return result;
                            };
                        }
                    }
                }
            })();
        });
        paly_mutation2.observe(videoosdTab3, {
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    async function updateImageUrls(itemsContainer) {
        if (isUpdatingImageUrls) return null; // Already running — skip
        isUpdatingImageUrls = true;

        let parentImages = [];

        const data = await itemsContainer.fetchData({Limit: 12});
        const trailerItems = data.Items.filter(thisItem => (thisItem.Type === "Trailer" && thisItem.Name.includes('trailer')));

        for (const trailerItem of trailerItems) {
            const imageUrl = await getParentImageUrl(trailerItem.Id);
            if (imageUrl && !parentImages.includes(imageUrl)) {
                parentImages.push(imageUrl);
            }
        }

        return parentImages;
    }

    async function getParentImageUrl(trailerId) {
        const userId = ApiClient.getCurrentUserId();
        const tItem = await ApiClient.getItem(userId, trailerId);
        if (tItem.ParentId) {
            const pItem = await ApiClient.getItem(userId, tItem.ParentId);
            return ApiClient.getImageUrl(pItem.Id, { type: "Primary", tag: pItem.ImageTags.Primary, maxHeight: 330, maxWidth: 220 });
        } else {
            return null
        }
    }

    function updateNextImage(itemsContainer = viewnode.querySelector('[data-index="0"].videoosd-tab'), parentImages) {

        let runCount = 0;

        function runUpdate() {
            const trailerCards = Array.from(itemsContainer.querySelectorAll('.cardBox')).filter(cardBox => {
                const textEl = cardBox.querySelector('.cardText');
                const icon = cardBox.querySelector('.cardImageIcon');
                return textEl && textEl.textContent.trim() === 'trailer' && icon;
            });

            const count = trailerCards.length;

            if (count === parentImages.length) {
                for (let i = 0; i < count; i++) {
                    const cardBox = trailerCards[i];
                    const imageUrl = parentImages[i];

                    const icon = cardBox.querySelector('.cardImageIcon');
                    if (icon) {
                        icon.outerHTML = `
                            <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale"
                                 loading="lazy" decoding="async" src="${imageUrl}">
                        `;
                    }
                }
            }

            runCount++;
            if (runCount < 3) {
                setTimeout(runUpdate, 500);
            }
        }

        runUpdate();
    }


    async function updateTitle() {

        if (viewnode.controller.osdController.currentDisplayItem) {
            viewnode.controller.osdController.currentDisplayItem.Name = 'trailer: ' + parentItem.Name;
        }  

        if (viewnode.controller.osdController.currentDisplayItem) {
            viewnode.controller.osdController.currentDisplayItem.People = parentItem.People;
        }  

        //viewnode.controller.osdController.currentDisplayItem.Id = parentItem.Id;
        //viewnode.controller.osdController.currentDisplayItem.ImageTags = parentItem.ImageTags;

        const titleElement = viewnode.querySelectorAll('.videoOsdBottom .videoOsdParentTitleContainer .videoOsdParentTitle')[0];
        if (titleElement) {
            titleElement.textContent = `trailer: ${parentItem.Name}`;
        }

    }

    /*
    function unhidePeople() {
        if (parentItem.People.length == 0) return
        const peopleButton = viewnode.querySelector('[data-index="2"].videoosd-tab-button')
        let count = 0;
        const intervalId = setInterval(() => {
            if (peopleButton.classList.contains('hide')) {
                peopleButton.classList.remove('hide');
            }
            count++;
            if (count >= 3) {
                clearInterval(intervalId);
            }
        }, 500);
    }
    */

    function updateAttribute() {
        let count = 0;
        const intervalId = setInterval(() => {
            let card = viewnode.querySelector('[data-index="0"].videoosd-tab .itemsContainer .card .cardOverlayContainer');
            let cardImage = viewnode.querySelector('[data-index="0"].videoosd-tab .itemsContainer .card .cardImageContainer');
            if (card && card.getAttribute('data-action') === 'none') {
                card.setAttribute('data-action', 'link');
            }
            if (cardImage && cardImage.getAttribute('data-action') === 'none') {
                cardImage.setAttribute('data-action', 'link');
            }
            count++;
            if (count >= 3) {
                clearInterval(intervalId);
            }
        }, 500);
    }

    async function handleStreamInfoChange() {
        item = viewnode.controller.osdController.currentItem || viewnode.controller.currentPlayer.streamInfo.item;
        if (item.Type === 'Trailer') {
            await getParentItem();
            updateTitle();
            /*
            if (parentImages.length > 0) { 
                setTimeout(() => {
                    updateNextImage();
                }, 500);
            }
            */
        } else {
            parentItem = item;
            paly_mutation1?.disconnect();
            //paly_mutation2?.disconnect();   
        }
    }

    function fetchItem() {
        setTimeout(() => {
            updateAttribute();
        }, 500);

        return Promise.resolve({
            Items: [parentItem],
            TotalRecordCount: 1
        });
    }
    /*
    function fetchPeople(query) {
        var itemThis = parentItem
            , serverId = itemThis.ServerId
            , totalRecordCount = (itemThis = (itemThis.People || []).map(function (p) {
                return (p = Object.assign({}, p)).ServerId = serverId,
                    "Person" !== p.Type && (p.PersonType = p.Type,
                        p.Type = "Person"),
                    p
            })).length;
        return query && (itemThis = itemThis.slice(query.StartIndex || 0),
            query.Limit) && itemThis.length > query.Limit && (itemThis.length = query.Limit),
            Promise.resolve({
                Items: itemThis,
                TotalRecordCount: totalRecordCount
            })
    }
    */

})();
