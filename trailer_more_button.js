(function () {
    "use strict";
    var item, viewnode, paly_mutation1, isUpdatingImageUrls = false, parentItems = {};
    var paly_mutation2;
    document.addEventListener("viewbeforeshow", function (e) {
        
        if (e.detail.type === "video-osd") {
            viewnode = e.target;
            if (!e.detail.isRestored) {
                const mutation = new MutationObserver(async function () {
                    item = viewnode.controller?.osdController?.currentItem || viewnode.controller?.currentPlayer?.streamInfo?.item;
                    if (item) {
                        isUpdatingImageUrls = false;
                        (item.Type === 'Trailer') && insertMoreButton();
                        mutation.disconnect();
                        paly_mutation1?.disconnect();
                        paly_mutation2?.disconnect();
                    }
                });
                mutation.observe(document.body, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            }
            else {
                item = viewnode.controller?.osdController?.currentItem;
            }

        }
    });


    async function getParentItem(itemThis) {
        
        let parentItem;
        if (itemThis.Id) {
            //parentItem = parentItems[itemThis.Id];
            //if (parentItem) return parentItem;

            if (!itemThis.Name.includes('trailer')) {
                parentItem = itemThis;
            } else {
                if (itemThis.ParentId || itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId) {
                    parentItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemThis.ParentId || itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId);
                    
                } else {
                    const userId = ApiClient.getCurrentUserId();
                    itemThis = await ApiClient.getItem(userId, itemThis.Id);
                    parentItem = await ApiClient.getItem(userId, itemThis.ParentId);
                    (itemThis.Id === item.Id) && (item = itemThis);
                } 
            }
        } else if (itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId) {
            //parentItem = parentItems[itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId];
            //if (parentItem) return parentItem;
            parentItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId);
        }
        return parentItem;
    }

    function getParentItemLite(itemThis) {
        let parentItem;
        if (itemThis.Id) {
            parentItem = parentItems[itemThis.Id];
        } else if (itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId) {
            parentItem = parentItems[itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId];
        }
        return parentItem;
    }

    function updateParentItems(parentItem, itemThis) {
        if (itemThis.Id) {
            if (!(itemThis.Id in parentItems)) {
                parentItems[itemThis.Id] = parentItem;
            }
        } else if (itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId) {
            const itemId = itemThis.ParentThumbItemId || itemThis.ParentBackdropItemId
            if (!(itemId in parentItems)) {
                parentItems[itemId] = parentItem;
            }
        }
    }

    function insertMoreButton() {
        parentItems = {};
        const bottomSection = viewnode.querySelector('.videoOsdBottom');
        if (!bottomSection) return;

        getParentItem(item).then(parentItem => {
            updateTitle(parentItem);

            //let videoElement = document.querySelector(".htmlVideoPlayerContainer video");
            //videoElement && videoElement.addEventListener('play', handleStreamInfoChange);

            const osdController = viewnode.controller.osdController;

            if (!osdController._updateFunctionWrapped) {
                osdController._updateFunctionWrapped = true;
                // Save reference to the original function
                const originalUpdateDisplayItem = osdController.updateDisplayItem;

                // Redefine with wrapper
                osdController.updateDisplayItem = function (state, item, displayItem) {
                    // Call the original function with correct context and arguments
                    const result = originalUpdateDisplayItem.apply(this, arguments);

                    // Run your extra logic after it
                    handleStreamInfoChange();

                    // Return whatever the original function returned (if anything)
                    return result;
                };
            }

            const tabContainers = bottomSection.querySelector('.videoosd-tabcontainers');

            const videoosdTab0 = tabContainers.querySelector('[data-index="0"].videoosd-tab');
            const videoosdTab3 = tabContainers.querySelector('[data-index="3"].videoosd-tab');

            paly_mutation1 = new MutationObserver(function () {
                let itemsContainer = videoosdTab0.querySelector('.itemsContainer');
                if (itemsContainer) {
                    paly_mutation1.disconnect();
                    itemsContainer.fetchData = function () {
                        let parentItem = getParentItemLite(item);
                        if (!parentItem) parentItem = item;

                        // schedule updateAttribute() to run later
                        Promise.resolve().then(() => updateAttribute());

                        return Promise.resolve({
                            Items: [parentItem],
                            TotalRecordCount: 1
                        });
                    };
                }
            });
            paly_mutation1.observe(videoosdTab0, {
                childList: true,
                characterData: true,
                subtree: true,
            });

            fetchPlaylist().then(playlist => {
                if (playlist?.TotalRecordCount > 1) {
                    updateParentItemsFromPlaylist(playlist.Items);

                    paly_mutation2 = new MutationObserver(function () {
                        let itemsContainer = videoosdTab3.querySelector('.itemsContainer');
                        if (itemsContainer && itemsContainer._itemSource && itemsContainer._itemSource.length > 0) {
                            paly_mutation2.disconnect();
                            updateImageUrls(itemsContainer).then(parentImages => {
                                if (parentImages) {

                                    if (parentImages.length > 0) {

                                        updateNextImage(itemsContainer, parentImages);


                                        if (!itemsContainer._fetchDataWrapped) {
                                            itemsContainer._fetchDataWrapped = true;

                                            const originalOnDataFetched = itemsContainer.bound_onDataFetched;

                                            itemsContainer.bound_onDataFetched = function (result) {
                                                // Call the original function first
                                                const promise = originalOnDataFetched.call(this, result);

                                                // Attach our own follow-up
                                                return Promise.resolve(promise).then(() => {
                                                    updateNextImage(itemsContainer, parentImages);
                                                });
                                            };
                                        }
                                    }
                                }
                            });
                        }
                    });

                    paly_mutation2.observe(videoosdTab3, {
                        childList: true,
                        characterData: true,
                        subtree: true,
                    });
                } else {
                    paly_mutation2?.disconnect();
                }
            });      
        });
    }

    function fetchPlaylist() {
        return Emby.importModule("./modules/common/playback/playbackmanager.js")
            .then(playbackManager =>
                playbackManager.getPlaylist({ Limit: 12 }, viewnode.controller.currentPlayer)
            );
    }

    async function updateParentItemsFromPlaylist(items) {
        const trailerItems = items.filter(thisItem => (thisItem.Type === "Trailer"));

        for (const trailerItem of trailerItems) {
            let parentItem = getParentItemLite(trailerItem);
            if (!parentItem) {
                parentItem = await getParentItem(trailerItem);
                updateParentItems(parentItem, trailerItem);
            }
        }
    }

    async function updateImageUrls(itemsContainer) {
        if (isUpdatingImageUrls) return null; // Already running — skip
        isUpdatingImageUrls = true;

        let parentImages = [];

        const trailerItems = itemsContainer._itemSource.filter(thisItem => (thisItem.Type === "Trailer"));

        for (const trailerItem of trailerItems) {
            let parentItem = getParentItemLite(trailerItem);
            if (!parentItem) {
                parentItem = await getParentItem(trailerItem);
                updateParentItems(parentItem, trailerItem);
            }
           
            const imageUrl = getImageUrl(parentItem);
            if (imageUrl && !parentImages.includes(imageUrl)) {
                parentImages.push(imageUrl);
            }
        }

        return parentImages;
    }

    /*
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
    */

    function getImageUrl(pItem) {
        if (!pItem) return null;
        return ApiClient.getImageUrl(pItem.Id, { type: "Primary", tag: pItem.ImageTags.Primary, maxHeight: 330, maxWidth: 220 });
    }

    function updateNextImage(itemsContainer, parentImages) {

        let runCount = 0;

        function runUpdate() {
            const trailerCards = Array.from(itemsContainer.querySelectorAll('.cardBox'))
                .filter((cardBox, i) => itemsContainer._itemSource[i]?.Type === "Trailer");

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
                    const title = cardBox.querySelector('.cardText-first');
                    if (title) {
                        const parentItem = getParentItemLite(itemsContainer._itemSource[i]);
                        title.textContent = 'trailer: ' + parentItem.Name;
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


    function updateTitle(parentItem) {

        if (viewnode.controller.osdController.currentDisplayItem) {
            viewnode.controller.osdController.currentDisplayItem.Name = 'trailer: ' + parentItem.Name;
            viewnode.controller.osdController.currentDisplayItem.People = viewnode.controller.osdController.currentDisplayItem.People || parentItem.People;
        }

        //viewnode.controller.osdController.currentDisplayItem.Id = parentItem.Id;
        //viewnode.controller.osdController.currentDisplayItem.ImageTags = parentItem.ImageTags;

        const titleElements = viewnode.querySelectorAll(
            '.videoOsdBottom .videoOsdParentTitleContainer .videoOsdParentTitle'
        );

        titleElements.forEach(el => {
            el.textContent = `trailer: ${parentItem.Name}`;
        });

        updateParentItems(parentItem, item);
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

    function handleStreamInfoChange() {
        item = viewnode.controller.osdController.currentItem || viewnode.controller.currentPlayer.streamInfo.item;
        if (item.Type === 'Trailer') {
            const parentItem = getParentItemLite(item);
            if (parentItem) {
                updateTitle(parentItem);
            } else {
                getParentItem(item).then(updateTitle);
            }
     
            /*
            if (parentImages.length > 0) { 
                setTimeout(() => {
                    updateNextImage();
                }, 500);
            }
            */
        } else {
            if (!(item.Id in parentItems)) {
                parentItems[item.Id] = item;
            }
            paly_mutation1?.disconnect();
            //paly_mutation2?.disconnect();   
        }
    }

    /*
    function fetchItem() {
        setTimeout(() => {
            updateAttribute();
        }, 500);

        return Promise.resolve({
            Items: [parentItems[item.Id]],
            TotalRecordCount: 1
        });
    }

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
