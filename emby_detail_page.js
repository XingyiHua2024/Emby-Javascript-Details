(function () {
    "use strict";

    /******************** user config ********************/
    var openaiApiKey = ''; //OpenAI API Key
    var nameMap = {};
    var fetchJavDbFlag = true; //enable javdb scrap
    var getTrailerFromCache = true; //enable reading from cache
    var enableJavdbReviews = true; // 启用 JavDB 短评功能（需登录）
    var javdbSecretKey = ''; // JavDB 密钥，也可在 config.json 中配置
    /*****************************************************/

    var javdbClient;

    const show_pages = ["Movie", "Series", "Season", "BoxSet", "Person", "Trailer"];

    const googleTranslateLanguage = 'ja';
    // put language to translate from (ja for Japanese) to Chinese. Leave '' to support any language

    var item, actorName, directorName, viewnode;
    var prefixDic = {}, mountMatch = {}, deviceProfile = {};
    //var adminUserId = ''; //Emby User ID

    

    var isResizeListenerAdded = false, isFanartResizeListenerAdded = false, videoVolume = 0.5, fanartModal = null;

    function isStillCurrentItem(savedItemId) {
        return item && item.Id === savedItemId;
    }

    const VISIBLE_SCROLLER = "div[is='emby-scroller']:not(.hide)";

    function qsVisible(selector, node = viewnode) {
        return node.querySelector(`${VISIBLE_SCROLLER} ${selector}`);
    }

    function qsaVisible(selector, node = viewnode) {
        return node.querySelectorAll(`${VISIBLE_SCROLLER} ${selector}`);
    }

    const OS_current = getOS();

    // Observer管理器：统一管理所有MutationObserver的生命周期
    const observerManager = {
        observers: new Map(),
        timeouts: new Map(),

        cleanup() {
            this.observers.forEach(obs => obs.disconnect());
            this.observers.clear();
            this.timeouts.forEach(t => clearTimeout(t));
            this.timeouts.clear();
        },

        waitForElement(name, root, selector, callback, timeout = 10000) {
            if (!root) return;
            const existing = root.querySelector(selector);
            if (existing) {
                callback(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const el = root.querySelector(selector);
                if (el) {
                    this.remove(name);
                    callback(el);
                }
            });

            this.observers.set(name, observer);
            observer.observe(root, { childList: true, subtree: true });

            if (timeout > 0) {
                const timer = setTimeout(() => this.remove(name), timeout);
                this.timeouts.set(name, timer);
            }
        },

        waitForCondition(name, root, conditionFn, callback, options = {}) {
            if (!root) return;

            const observer = new MutationObserver(() => {
                const result = conditionFn();
                if (result) {
                    this.remove(name);
                    callback(result);
                }
            });

            this.observers.set(name, observer);
            observer.observe(root, { childList: true, subtree: true, characterData: true, ...options });
        },

        watchChanges(name, root, callback, options = {}) {
            if (!root) return;

            const observer = new MutationObserver((mutations) => {
                callback(mutations, () => this.remove(name));
            });

            this.observers.set(name, observer);
            observer.observe(root, { childList: true, subtree: false, ...options });
        },

        remove(name) {
            this.observers.get(name)?.disconnect();
            this.observers.delete(name);
            const timer = this.timeouts.get(name);
            if (timer) clearTimeout(timer);
            this.timeouts.delete(name);
        }
    };

    // 检测是否为 iPhone
    const isIPhone = /iPhone/i.test(navigator.userAgent);

    // 评分区域优化样式（iPhone 不加载）
    const ratingCss = isIPhone ? '' : `
.starRatingContainer{background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,180,0,0.1))!important;padding:6px 12px!important;border-radius:20px!important;border:1px solid rgba(255,215,0,0.3)!important}.starRatingContainer .starIcon{color:#ffd700!important;text-shadow:0 0 8px rgba(255,215,0,0.5)}.mediaInfoCriticRating{background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(109,40,217,0.1))!important;padding:6px 12px!important;border-radius:20px!important;border:1px solid rgba(139,92,246,0.3)!important}.mediaInfoCriticRatingFresh{filter:drop-shadow(0 0 4px rgba(139,92,246,0.5))}.detail-mediaInfoPrimary .mediaInfoItem:not(.media-info-item){padding:4px 12px!important;border-radius:15px!important;background:rgba(139,92,246,0.08)!important;margin:3px!important;transition:all 0.2s ease;font-size:0.85em}.detail-mediaInfoPrimary .mediaInfoItem:not(.media-info-item):hover{background:rgba(139,92,246,0.18)!important;transform:scale(1.02)}.detail-mediaInfoPrimary .mediaInfoItem-border{border:1.5px solid rgba(255,255,255,0.6)!important;background:transparent!important;border-radius:4px!important;padding:2px 8px!important}
`;

    const edpCss = `${ratingCss}
.edp-has-trailer{position:relative;box-shadow:0 0 8px 2px rgba(59,130,246,0.35);transition:box-shadow 0.3s ease-in-out;border-radius:8px}.cardBox:hover .edp-has-trailer,.edp-has-trailer:hover{box-shadow:0 0 10px 3px rgba(96,165,250,0.5);transition:box-shadow 0.2s ease-in-out}
@keyframes edpCardFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.edp-card-enter{animation:edpCardFadeUp 0.4s ease both}.edp-slider-bg .cardBox{transition:transform 0.3s ease,box-shadow 0.3s ease}.edp-slider-bg .cardBox:hover{transform:translateY(-6px);box-shadow:0 8px 24px rgba(0,0,0,0.35)}
.edp-card-meta{display:flex;justify-content:space-between;align-items:center}.edp-card-date{opacity:0.7}.edp-score-badge{padding:1px 8px;border-radius:10px;font-size:0.85em;font-weight:600;line-height:1.5}.edp-score-gold{background:linear-gradient(135deg,#ffd700,#ffb300);color:#1a1a1a}.edp-score-high{background:linear-gradient(135deg,#00c8ff,#0090ff);color:#fff}.edp-score-mid{background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.8)}.edp-score-low{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5)}.edp-score-none{display:none}.noUncensored{opacity:1;transition:color 0.3s,transform 0.3s,box-shadow 0.3s,filter 0.3s}.noUncensored .button-text,.noUncensored .button-icon{color:grey!important}.melt-away{animation:sandMeltAnimation 1s ease-out forwards}@keyframes sandMeltAnimation{0%{opacity:1}100%{opacity:0}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.btn-status{display:inline-block;vertical-align:middle;margin-left:4px}.btn-spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle}.btn-check{display:inline-block;width:18px;height:18px;vertical-align:middle}.my-fanart-image{display:inline-block;margin:8px 10px 20px 10px;vertical-align:top;border-radius:8px;height:27vh;transition:transform 0.3s ease,filter 0.3s ease;min-height:180px}.my-fanart-image-slider{height:20vh!important}.my-fanart-image:hover{transform:scale(1.03);filter:brightness(80%)}.edp-modal{display:none;position:fixed;z-index:1;left:0;top:0;width:100%;height:100%;overflow:hidden;background-color:rgb(0 0 0 / .8);justify-content:center;align-items:center}.edp-modal-content{margin:auto;max-width:70%;max-height:70%;overflow:hidden;opacity:0;transition:opacity 0.3s ease}@media (max-width:768px){.edp-modal-content{max-width:80%;max-height:80%}}.edp-modal-closing .edp-modal-content{animation-name:edpShrinkRotate;animation-duration:0.3s;animation-timing-function:ease-out}.edp-close{color:#fff;position:absolute;width:45px;height:45px;display:flex;justify-content:center;align-items:center;top:30px;right:30px;font-size:30px;font-weight:700;cursor:pointer;transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:0;background-color:rgb(0 0 0 / .5);user-select:none;caret-color:#fff0}.prev,.next{position:absolute;width:40px;height:40px;line-height:40px;justify-content:center;align-items:center;display:flex;top:50%;background-color:rgb(0 0 0 / .5);color:#fff;border:none;cursor:pointer;font-size:35px;font-weight:700;transform:translateY(-50%) translateX(-50%);transition:background-color 0.3s,transform 0.3s,padding 0.3s;border-radius:50%;padding:35px}.prev{left:80px}.next{right:20px}.prev:hover,.next:hover{background-color:rgb(255 255 255 / .3);padding:35px}.edp-close:hover{background-color:rgb(255 255 255 / .3)}@keyframes edpShrinkRotate{0%{transform:scale(1)}100%{transform:scale(0)}}.click-smaller{transform:scale(.9) translate(-50%,-50%);transition:transform 0.2s}.prev.disabled,.next.disabled{color:grey!important;cursor:default}@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-10px)}50%{transform:translateX(10px)}75%{transform:translateX(-10px)}100%{transform:translateX(0)}}.edp-modal-caption{position:fixed;bottom:110px;left:50%;transform:translateX(-50%);text-align:center;font-size:16px;color:#fff;background-color:rgb(0 0 0 / .6);padding:5px 10px;border-radius:5px}@media screen and (max-width:480px){.edp-modal-caption{bottom:160px}}.modal-thumbs{position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:6px;padding:6px 12px;max-width:80vw;overflow-x:auto;overflow-y:hidden;background:rgb(0 0 0/.6);border-radius:10px;scrollbar-width:none}.modal-thumbs::-webkit-scrollbar{display:none}.modal-thumbs img{height:50px;border-radius:4px;cursor:pointer;opacity:.5;transition:opacity .2s,border-color .2s;border:2px solid transparent;flex-shrink:0}.modal-thumbs img.thumb-active{opacity:1;border-color:#fff}.modal-thumbs img:hover{opacity:.8}.edp-video{position:absolute;width:100%;height:100%;object-fit:contain;z-index:1;pointer-events:auto;transition:opacity 0.5s ease}.cardOverlayContainer>.fab,.cardOverlayContainer>.chkItemSelectContainer,.cardOverlayContainer>.cardOverlayButton-br{z-index:2}.copy-link{color:lightblue;cursor:pointer;display:inline-block;transition:transform 0.1s ease}.copy-link:active{transform:scale(.95)}.media-info-item{display:block;width:100%;margin-top:10px;text-align:left}.media-info-item a{padding:5px 10px;background:rgb(255 255 255 / .15);margin-bottom:5px;margin-right:5px;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);font-weight:600;font-family:'Poppins',sans-serif;transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease;text-decoration:none;color:#fff;border-radius: 20px}.media-info-item a:hover{transform:scale(1.05);background:linear-gradient(135deg,rgb(255 0 150 / .3),rgb(0 150 255 / .3));box-shadow:0 4px 15px rgb(0 0 0 / .2),0 0 10px rgb(0 150 255 / .5)}.pageButton{cursor:pointer;padding:6px 14px;background:rgb(255 255 255 / .15);border-radius:15px;box-shadow:0 2px 6px rgba(0,0,0,0.2);transition:all 0.3s ease;backdrop-filter:blur(10px);border:1px solid rgb(255 255 255 / .2)}.pageButton:hover{background:rgb(255 255 255 / .25);box-shadow:0 4px 12px rgba(0,0,0,0.3);transform:scale(1.03)}#pageInput-actorPage::-webkit-inner-spin-button,#pageInput-actorPage::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-actorPage{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:6px 10px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;background:rgb(255 255 255 / .1);border:1px solid rgb(255 255 255 / .2);border-radius:10px;color:#fff;width:50px;transition:all 0.3s ease}#pageInput-actorPage:focus{outline:none;border-color:rgb(255 255 255 / .4);box-shadow:0 0 8px rgba(255,255,255,0.2)}#filterDropdown{width:auto;backdrop-filter:blur(10px);color:#fff;transition:all 0.3s ease;margin-left:10px;font-family:inherit;padding:6px 12px;font-weight:inherit;line-height:inherit;border:1px solid rgba(139,92,246,0.3);background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(109,40,217,0.15));border-radius:15px}#filterDropdown:hover{background:linear-gradient(135deg,rgba(139,92,246,0.5),rgba(109,40,217,0.4));box-shadow:0 4px 15px rgba(139,92,246,0.4)}#filterDropdown:focus{outline:none;box-shadow:0 0 8px 3px rgba(139,92,246,0.5)}#filterDropdown option{font-family:inherit;color:#000;background:#fff;border:none;padding:5px;font-weight:inherit}#filterDropdown option:hover{background:#c8c8c8}.edp-card-img{transition:filter 0.2s ease}.edp-card-img:hover{filter:brightness(70%)}#toggleFanart{padding:10px 20px;font-size:18px;background:rgb(255 255 255 / .15);margin-top:15px;margin-bottom:15px;border:none;border-radius:8px;font-weight:700;font-family:'Poppins',sans-serif;color:#fff;text-decoration:none;cursor:pointer;display:block;margin-left:auto;margin-right:auto;-webkit-backdrop-filter:blur(5em);backdrop-filter:blur(5em);transition:transform 0.2s ease,background-color 0.3s ease,box-shadow 0.3s ease,color 0.3s ease}#toggleFanart:hover{transform:scale(1.1);background:linear-gradient(135deg,rgb(255 0 150 / .4),rgb(0 150 255 / .4));box-shadow:0 6px 20px rgb(0 0 0 / .3),0 0 15px rgb(0 150 255 / .6);color:#fff}#toggleFanart:active{transform:scale(.95);box-shadow:0 3px 12px rgb(0 0 0 / .3)}.edp-slider-bg{background:linear-gradient(145deg,rgba(59,130,246,0.06),rgba(30,64,175,0.03));border-radius:12px;margin:15px 0;padding:15px 0;box-shadow:0 4px 15px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.1);border:1px solid rgba(59,130,246,0.12)}
.edp-section-header{display:flex;align-items:center}.edp-count-badge{margin-left:auto;font-size:0.85em;padding:3px 14px;border-radius:20px;background:rgba(255,255,255,0.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.55);font-weight:500;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.08);transition:all 0.3s ease}.edp-count-badge:hover{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.75);border-color:rgba(255,255,255,0.18)}
.jv-reviews-modal{position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s ease}.jv-reviews-modal.visible{opacity:1}.jv-reviews-modal.closing{opacity:0}.jv-reviews-backdrop{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.75);backdrop-filter:blur(8px)}.jv-reviews-content{position:relative;width:90%;max-width:600px;max-height:85vh;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden;transform:scale(.9);transition:transform .2s ease}.jv-reviews-modal.visible .jv-reviews-content{transform:scale(1)}.jv-reviews-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(90deg,rgba(139,92,246,.2),rgba(109,40,217,.15));border-bottom:1px solid rgba(255,255,255,.1)}.jv-reviews-title-wrapper{display:flex;flex-direction:column;gap:4px}.jv-reviews-title{margin:0;font-size:1.2em;font-weight:600;color:#fff}.jv-reviews-subtitle{font-size:.85em;color:rgba(255,255,255,.6)}.jv-reviews-close{background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;padding:8px;border-radius:50%;transition:all .2s}.jv-reviews-close:hover{background:rgba(255,255,255,.1);color:#fff}.jv-reviews-sort-hint{padding:8px 20px;font-size:.8em;color:rgba(255,255,255,.5);border-bottom:1px solid rgba(255,255,255,.05)}.jv-reviews-list{flex:1;overflow-y:auto;padding:12px 16px}.jv-reviews-loading,.jv-reviews-empty{text-align:center;padding:40px;color:rgba(255,255,255,.6)}.jv-review-item{padding:14px;margin-bottom:10px;background:rgba(255,255,255,.03);border-radius:12px;border:1px solid rgba(255,255,255,.05);transition:all .2s}.jv-review-item:hover{background:rgba(255,255,255,.06);border-color:rgba(139,92,246,.2)}.jv-review-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}.jv-review-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#333}.jv-review-user-info{flex:1}.jv-review-username{font-size:.9em;font-weight:500;color:#fff;display:flex;align-items:center;gap:6px}.jv-review-tag{font-size:.7em;padding:2px 6px;border-radius:4px;font-weight:500}.jv-review-tag.vip{background:linear-gradient(135deg,#ffd700,#ff8c00);color:#000}.jv-review-tag.contributor{background:linear-gradient(135deg,#00bcd4,#009688);color:#fff}.jv-review-meta{font-size:.8em;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:8px;margin-top:2px}.jv-review-score{color:#ffc107;font-weight:500}.jv-review-content{font-size:.9em;line-height:1.6;color:rgba(255,255,255,.85);word-break:break-word}.jv-review-footer{display:flex;justify-content:flex-end;margin-top:8px}.jv-review-likes{display:flex;align-items:center;gap:4px;font-size:.8em;color:rgba(255,255,255,.4)}.jv-reviews-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:rgba(0,0,0,.2);border-top:1px solid rgba(255,255,255,.05)}.jv-reviews-page-info{font-size:.85em;color:rgba(255,255,255,.6)}.jv-reviews-page-btns{display:flex;gap:8px}.jv-page-btn{padding:6px 14px;border:none;border-radius:8px;background:rgba(139,92,246,.2);color:#fff;cursor:pointer;font-size:.85em;transition:all .2s}.jv-page-btn:hover:not(:disabled){background:rgba(139,92,246,.4)}.jv-page-btn:disabled{opacity:.4;cursor:not-allowed}.jv-credentials-content{position:relative;width:90%;max-width:400px;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden;transform:scale(.9);transition:transform .2s ease}.jv-reviews-modal.visible .jv-credentials-content{transform:scale(1)}.jv-credentials-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(90deg,rgba(139,92,246,.2),rgba(109,40,217,.15));border-bottom:1px solid rgba(255,255,255,.1)}.jv-credentials-title{margin:0;font-size:1.1em;font-weight:600;color:#fff}.jv-credentials-body{padding:20px}.jv-credentials-desc{margin:0 0 20px;font-size:.9em;color:rgba(255,255,255,.7);line-height:1.5}.jv-credentials-desc small{color:rgba(255,255,255,.5)}.jv-credentials-form{display:flex;flex-direction:column;gap:16px}.jv-form-group{display:flex;flex-direction:column;gap:6px}.jv-form-group label{font-size:.85em;color:rgba(255,255,255,.7)}.jv-form-group input{padding:10px 14px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:rgba(255,255,255,.05);color:#fff;font-size:.95em;transition:all .2s}.jv-form-group input:focus{outline:none;border-color:rgba(139,92,246,.5);box-shadow:0 0 0 3px rgba(139,92,246,.15)}.jv-form-group input::placeholder{color:rgba(255,255,255,.3)}.jv-credentials-error{margin-top:12px;padding:10px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#ef4444;font-size:.85em}.jv-credentials-footer{padding:16px 20px;background:rgba(0,0,0,.2);border-top:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;gap:12px}.jv-credentials-actions{display:flex;justify-content:flex-end;gap:10px}.jv-btn{padding:8px 18px;border:none;border-radius:8px;font-size:.9em;cursor:pointer;transition:all .2s}.jv-btn-primary{background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff}.jv-btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(139,92,246,.4)}.jv-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}.jv-btn-secondary{background:rgba(255,255,255,.1);color:rgba(255,255,255,.8)}.jv-btn-secondary:hover{background:rgba(255,255,255,.15)}.jv-btn-danger{background:rgba(239,68,68,.15);color:#ef4444;font-size:.8em}.jv-btn-danger:hover{background:rgba(239,68,68,.25)}#myitemsContainer-series{transition:opacity 0.3s ease}.edp-fading{opacity:0}#pageInput-series::-webkit-inner-spin-button,#pageInput-series::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#pageInput-series{-moz-appearance:textfield;appearance:none;height:auto;text-align:center;padding:6px 10px;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;background:rgb(255 255 255 / .1);border:1px solid rgb(255 255 255 / .2);border-radius:10px;color:#fff;width:50px;transition:all 0.3s ease}#pageInput-series:focus{outline:none;border-color:rgb(255 255 255 / .4);box-shadow:0 0 8px rgba(255,255,255,0.2)}.edp-btn-disabled{opacity:0.35;pointer-events:none}#myDbSeriesSlider .itemsViewSettingsContainer{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:8px 16px}${OS_current === 'ipad' ? '.my-fanart-image{height:18vh}.my-fanart-image-slider{height:14vh!important}.edp-modal{padding-bottom:5vh;box-sizing:border-box}' : ''}${OS_current === 'iphone' ? '.modal-thumbs{bottom:100px}.edp-modal-caption{bottom:160px}.edp-modal{padding-bottom:15vh;box-sizing:border-box}' : ''}
.edp-add-modal{display:none;position:fixed;z-index:999999;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.85);justify-content:center;align-items:center;backdrop-filter:blur(8px)}.edp-add-modal-content{background:#1a1a2e;border-radius:16px;width:min(90vw,700px);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);overflow:hidden}.edp-add-modal-header{padding:20px 24px;display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);gap:12px;flex-shrink:0}.edp-add-modal-header input{flex:1;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:10px;color:#fff;padding:10px 16px;font-size:1em;outline:none;transition:border-color 0.3s}.edp-add-modal-header input:focus{border-color:rgba(59,130,246,0.6);box-shadow:0 0 8px rgba(59,130,246,0.3)}.edp-add-search-btn{padding:10px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;font-weight:600;cursor:pointer;transition:all 0.3s ease;white-space:nowrap}.edp-add-search-btn:hover{transform:scale(1.05);box-shadow:0 4px 12px rgba(59,130,246,0.4)}.edp-add-search-btn:disabled{opacity:0.5;pointer-events:none}.edp-add-modal-results{padding:16px 24px;overflow-y:auto;flex:1;display:flex;flex-wrap:wrap;gap:12px;align-content:flex-start}.edp-add-result-card{width:calc(33.33% - 8px);cursor:pointer;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);transition:all 0.3s ease}.edp-add-result-card:hover{transform:translateY(-4px);box-shadow:0 8px 20px rgba(0,0,0,0.3);border-color:rgba(59,130,246,0.4)}.edp-add-result-card.edp-added{opacity:0.5;pointer-events:none;border-color:rgba(0,200,0,0.4)}.edp-add-result-card img{width:100%;aspect-ratio:2/3;object-fit:cover}.edp-add-card-info{padding:8px;font-size:0.85em}.edp-add-card-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}.edp-add-card-year{color:rgba(255,255,255,0.5);font-size:0.85em}.edp-add-modal-close{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s;flex-shrink:0}.edp-add-modal-close:hover{background:rgba(255,255,255,0.2);transform:scale(1.1)}.edp-add-modal-msg{text-align:center;color:rgba(255,255,255,0.5);padding:40px;font-size:1.1em;width:100%}@media(max-width:600px){.edp-add-result-card{width:calc(50% - 6px)}.edp-add-modal-content{width:95vw;max-height:90vh}}`;

    loadConfig().then(() => {
        // monitor dom changements
        document.addEventListener("viewbeforeshow", function (e) {
            // 清理之前页面的所有observer
            observerManager.cleanup();

            if (e.detail.contextPath.startsWith("/item?id=")) {
                if (!e.detail.isRestored) {
                    !document.getElementById("edpStyle") && loadExtraStyle(edpCss, 'edpStyle');

                    observerManager.waitForCondition(
                        'itemReady',
                        document.body,
                        () => {
                            viewnode = e.target;
                            item = viewnode.controller?.currentItem;
                            return item;
                        },
                        () => {
                            if (showFlag()) {
                                if (item.Type === 'BoxSet') {
                                    boxSetInit();
                                } else {
                                    init();
                                }
                            }
                        }
                    );
                } else {
                    viewnode = e.target;
                    item = viewnode.controller.currentItem;
                    if (item && showFlag() && item.Type != 'BoxSet' && item.Type != "Person") {
                        actorName = getActorName();
                        directorName = getActorName(true);
                        setTimeout(() => {
                            injectLinks();
                            javdbTitle();
                            remoteTrailerInject();
                            adjustCardOffsets();
                            adjustSliderWidth();
                        }, 1000);
                    }
                }
            }
        });
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
        let config = null;
        if (window.cachedConfig) {
            config = window.cachedConfig;
        } else {
            const response = await fetch('./config.json');
            if (!response.ok) {
                console.error(`Failed to fetch config.json: ${response.status} ${response.statusText}`);
                return; // Exit the function if the file is not found or another error occurs
            }
            config = await response.json();
            window.cachedConfig = config;
        }
        if (config) {
            //adminUserId = config.adminUserId || adminUserId;
            //googleApiKey = config.googleApiKey || googleApiKey;
            openaiApiKey = config.openaiApiKey || openaiApiKey;
            nameMap = config.nameMap || nameMap;
            prefixDic = config.prefixDic || prefixDic;
            mountMatch = config.mountMatch || mountMatch;
            javdbSecretKey = config.javdbSecretKey || javdbSecretKey;
        }
    }

    function loadExtraStyle(content, id) {
        let style = document.createElement("style");
        style.id = id; // Set the ID for the style element
        style.innerHTML = content; // Set the CSS content
        document.head.appendChild(style); // Append the style element to the document head
    }

    // 把没有图片的 person 排到后面
    function sortPeopleByImage() {
        if (!item?.People?.length) return;
        item.People.sort((a, b) => {
            const aHasImage = !!a.PrimaryImageTag;
            const bHasImage = !!b.PrimaryImageTag;
            return bHasImage - aHasImage;
        });
    }

    function init() {
        sortPeopleByImage();
        clearExpiredCache();
        handleAddition();
        updateSimilarFetch();
        injectLinks();
        javdbTitle();
        buttonInit();
        
        reviewButtonInit();

        previewInject().then(() => {
            if (!fanartModal) fanartModal = new FanartModal();
            fanartModal.init();
        });

        actorMoreInject().then(excludeIds => actorMoreInject(true, excludeIds));

        translateInject();
        javdbButtonInit();
        embyButtonInit();
        remoteTrailerInject();
    }

    function boxSetInit() {
        translateInject();
        seriesInject();
        addBoxsetTrailer();

        // 添加影片按钮（仅 BoxSet）
        const mainDetailButtons = qsVisible(".mainDetailButtons");
        if (mainDetailButtons && !qsVisible("#addMovieBtn")) {
            mainDetailButtons.insertAdjacentHTML('beforeend',
                createButtonHtml('addMovieBtn', '向合集添加影片', 'add_circle', '添加影片')
            );
            const addModal = new AddMovieModal(item.Id);
            qsVisible("#addMovieBtn").addEventListener('click', () => addModal.open());
        }
    }


    function showFlag() {
        for (let show_page of show_pages) {
            if (item.Type === show_page) {
                return true;
            }
        }
        return false;
    }

    function isPreferThumb() {
        return !isTouchDevice() && isJP18();
    }

    function changePreferThumb(view) {
        const originalGetListOptions = view.getListOptions;

        view.getListOptions = function (items) {
            const result = originalGetListOptions(items);
            result.options.preferThumb = !0;
            return result;
        };
    } 

    function handleAddition() {
        if (item.Type === 'BoxSet' || item.Type === 'Person') return;
        const view = qsVisible(".additionalPartsSection .itemsContainer");
        if (!view) return;
        changePreferThumb(view);
    }

    function updateSimilarFetch() {
        if (item.Type === 'BoxSet' || item.Type === 'Person') return;

        const similarSection = qsVisible(".similarSection");
        const view = similarSection?.querySelector(".similarItemsContainer");
        if (!view) return;

        if (isPreferThumb()) {
            changePreferThumb(view);
        }

        if (OS_current != "iphone" && item.Type === 'Movie') {
            let debounceTimer = null;

            observerManager.watchChanges('similarSection', view, (mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => {
                            addHoverEffect();
                        }, 150);
                        break;
                    }
                }
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

                const weightFactor = -0.1; // Adjust this to control how biased toward the front it is

                // Assign biased score and sort
                const shuffled = items
                    .map((item, index) => ({
                        item,
                        sortKey: Math.random() + index * weightFactor
                    }))
                    .sort((a, b) => a.sortKey - b.sortKey)
                    .map(entry => entry.item);

                return {
                    Items: shuffled.slice(0, 12),
                    TotalRecordCount: Math.min(items.length, 12)
                };
            });
        };

        let title = similarSection.querySelector('.sectionTitle');
        title = updateH2(title);

        title.addEventListener('click', () => {
            view.fetchData()
                .then(view.bound_onDataFetchedInitial, view.bound_onGetItemsFailed);
            // addHoverEffect 由 similarSection observer 自动触发
        });

        function updateH2(oldH2) {
            // Clone the h2 to move it safely
            const clonedH2 = oldH2.cloneNode(true);
            clonedH2.className = 'sectionTitle sectionTitle-cards'; // remove extra padding classes

            // Create the <a> element
            const a = document.createElement('a');
            a.className = 'noautofocus button-link button-link-color-inherit sectionTitleTextButton sectionTitleTextButton-link sectionTitleTextButton-more emby-button emby-button-backdropfilter';
            a.setAttribute('is', 'emby-sectiontitle');
            a.appendChild(clonedH2);

            // Create the wrapper div
            const wrapper = document.createElement('div');
            wrapper.className = 'sectionTitleContainer sectionTitleContainer-cards padded-left padded-left-page padded-right';

            wrapper.appendChild(a);
            wrapper.title = "刷新数据";

            // Replace old h2 with the new wrapper
            oldH2.replaceWith(wrapper);
            return wrapper;
        }

    }


    function addBoxsetTrailer() {
        if (isTouchDevice()) return;

        const sliderSelector = `${VISIBLE_SCROLLER} .linkedItems .itemsContainer`;

        observerManager.waitForElement('boxsetSlider', viewnode, sliderSelector, (slider) => {
            changePreferThumb(slider);

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

            observerManager.watchChanges('boxsetSliderItems', slider, (mutationsList, disconnect) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        addHoverEffect(slider);
                        disconnect();
                        break;
                    }
                }
            });
        });
    }

    function javdbTitle() {
        if (!isJP18() || !fetchJavDbFlag || item.Type === 'BoxSet' || item.Type === 'Person') return

        //const topContainer = qsVisible(".topDetailsContainer");

        const detailMainContainer = qsVisible(".detailMainContainerParent");
        if (!detailMainContainer) return;

        const titleElement = detailMainContainer.querySelector(".itemName-primary");
        if (!titleElement) return;

        // 如果已经修改过，跳过
        if (titleElement.querySelector('.copy-link')) return;

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

        // 监听标题区域变化，当被重置时重新应用
        observerManager.remove('javdbTitle'); // 移除旧的监听器
        observerManager.watchChanges('javdbTitle', titleElement, (mutations, stop) => {
            // 检查是否被重置（copy-link 消失了）
            if (!titleElement.querySelector('.copy-link')) {
                stop(); // 停止当前监听
                setTimeout(() => javdbTitle(), 100); // 重新应用
            }
        }, { childList: true, subtree: true });

        if (OS_current === 'iphone' || OS_current === 'android') return

        const newLinks = createLinks(code, item, viewnode);

        let itemsContainer = detailMainContainer.querySelector(".detailTextContainer .mediaInfoItems:not(.hide)");
        if (itemsContainer) {
            handleMediaInfo(itemsContainer, newLinks, viewnode, item);
        } else {
            const detailTextContainer = viewnode.querySelector(".detailTextContainer");
            observerManager.waitForElement(
                'mediaInfoItems',
                detailTextContainer,
                '.mediaInfoItems:not(.hide)',
                (updatedContainer) => handleMediaInfo(updatedContainer, newLinks, viewnode, item)
            );
        }

    }

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
                icon: "",
                secondaryText: text
            });
        });

        return link;
    }

    function createLinks(code, item, viewnode) {
        const code_lower = code.toLowerCase();
        const noNumCode = code.replace(/^\d+(?=[A-Za-z])/, '');
        const baseCode = getPartBefore(noNumCode, '-');

        const newLinks = [];

        newLinks.push(createNewLinkElement('搜索 javdb.com', 'pink', getUrl(item.Overview, "===== 外部链接 =====", "JavDb") || `https://javdb.com/search?q=${noNumCode}&f=all`, 'javdb'));
        newLinks.push(createNewLinkElement('搜索 javbus.com', 'red', `https://www.javbus.com/${code}`, 'javbus'));
        newLinks.push(createNewLinkElement('搜索 javlibrary.com', 'rgb(191, 96, 166)', `https://www.javlibrary.com/cn/vl_searchbyid.php?keyword=${code}`, 'javlibrary'));

        if (item.Genres.includes("无码")) {
            newLinks.push(createNewLinkElement('搜索 7mmtv.sx', 'rgb(225, 125, 190)', `https://7mmtv.sx/zh/searchform_search/all/index.html?search_keyword=${code}&search_type=searchall&op=search`, '7mmtv'));
            newLinks.push(createNewLinkElement('搜索 missav.ws', 'rgb(238, 152, 215)', `https://missav.ws/cn/search/${code}`, 'missav'));
            if (/^n\d{4}$/.test(code_lower)) {
                newLinks.push(createNewLinkElement('搜索 tokyohot', 'red', 'https://my.tokyo-hot.com/product/?q=' + code_lower + '&x=0&y=0', 'tokyohot'));
            } else if (/^\d+-\d+$/.test(code)) {
                newLinks.push(createNewLinkElement('搜索 caribbean', 'green', 'https://www.caribbeancom.com/moviepages/' + code_lower + '/index.html', 'caribbean'));
            } else if (/^\d+_\d+$/.test(code)) {
                if (item.ProviderIds?.MetaTube?.includes('CaribbeancomPR')) {
                    newLinks.push(createNewLinkElement('搜索 caribbeancompr', 'orange', 'https://www.caribbeancompr.com/moviepages/' + code_lower + '/index.html', 'caribbeancompr'));
                } else {
                    newLinks.push(createNewLinkElement('搜索 1pondo', 'rgb(230, 95, 167)', 'https://www.1pondo.tv/movies/' + code_lower + '/', '1pondo'));
                }
            } else if (code_lower.includes('heyzo')) {
                const heyzoNum = getPartAfter(code, "-");
                newLinks.push(createNewLinkElement('搜索 heyzo', 'pink', 'https://www.heyzo.com/moviepages/' + heyzoNum + '/index.html', 'heyzo'));
            } else {
                newLinks.push(createNewLinkElement('搜索 ave', 'red', 'https://www.aventertainments.com/ppv/search?lang=2&v=1&culture=ja-JP&keyword=' + code + '&searchby=keyword', 'ave'));
            }

        } else if (item.Genres.includes("VR")) {
            newLinks.push(createNewLinkElement('搜索 dmm.co.jp', 'red', 'https://www.dmm.co.jp/digital/videoa/-/list/search/=/device=vr/?searchstr=' + updateDmmCode(noNumCode), 'dmm'));
            const modifyCode = (noNumCode.startsWith("DSVR") && /^\D+-\d{1,3}$/.test(code)) ? "3" + code : code;
            newLinks.push(createNewLinkElement('搜索 jvrlibrary.com', 'lightyellow', `https://jvrlibrary.com/jvr?id=` + modifyCode, 'jvrlibrary'));
            if (code_lower.includes('prvrss')) {
                newLinks.push(createNewLinkElement('搜索 mgstage.com', 'red', `https://www.mgstage.com/product/product_detail/${code}`, 'prestige'));
            }
        } else {
            //newLinks.push(createNewLinkElement('搜索 7mmtv.sx', 'rgb(225, 125, 190)', `https://7mmtv.sx/zh/searchform_search/all/index.html?search_keyword=${code}&search_type=searchall&op=search`, '7mmtv'));
            newLinks.push(createNewLinkElement('搜索 missav.ws', 'rgb(238, 152, 215)', `https://missav.ws/cn/search/${code}`, 'missav'));
            //newLinks.push(createNewLinkElement('搜索 tktube.com', 'blue', `https://tktube.com/search/${code.replace(/-/g, "--")}/`, 'tktube'));
            newLinks.push(createNewLinkElement('搜索 dmm.co.jp', 'red', 'https://www.dmm.co.jp/mono/-/search/=/searchstr=' + code_lower + '/', 'dmm'));
            if (noNumCode != code) {
                newLinks.push(createNewLinkElement('搜索 mgstage.com', 'red', `https://www.mgstage.com/search/cSearch.php?search_word=${code}&x=0&y=0&search_shop_id=&type=top`, 'prestige'));
            }
            //newLinks.push(createNewLinkElement('搜索 javsubtitled.com', 'rgb(149, 221, 49)', 'https://javsubtitled.com/zh/search?keywords=' + code, 'javsubtitled'));
        }

        if (!qsVisible(".btnPlayTrailer:not(.hide)", viewnode)) {
            newLinks.push(createNewLinkElement('搜索 javtrailers', 'red', 'https://javtrailers.com/search/' + noNumCode, 'javtrailers'));
        }

        newLinks.push(createNewLinkElement('搜索 subtitlecat.com', 'rgb(255, 191, 54)', `https://www.subtitlecat.com/index.php?search=` + noNumCode, 'subtitlecat'));

        if (!/\d/.test(baseCode)) {
            newLinks.push(createNewLinkElement('javdb 番号', '#ADD8E6', `https://javdb.com/video_codes/${baseCode}`, baseCode));
        }

        return newLinks;
    }

    function updateDmmCode(code) {
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

    function handleMediaInfo(container, newLinks, viewnode, item) {
        // Look for an existing mediaInfoItem with white-space: normal
        let mediaInfoItem = container.querySelector('.mediaInfoItem[style="white-space:normal;"]');

        if (!mediaInfoItem) {
            // Create a new one
            mediaInfoItem = document.createElement("div");
            mediaInfoItem.className = "mediaInfoItem";
            mediaInfoItem.style.whiteSpace = "normal";

            container.appendChild(mediaInfoItem);
        }

        // Now apply functions on it
        if (mediaInfoItem) {
            mediaInfoStyle(mediaInfoItem);
            formatMediaInfo(viewnode, item);
            tagInsert(mediaInfoItem, viewnode);
            addNewLinks(mediaInfoItem, newLinks);
            moveTopDown(viewnode);
        }
    }

    function formatMediaInfo(viewnode, item) {
        // Select all visible div elements with the class "mediaInfoItem" inside a specific container
        const mediaInfoItems = qsaVisible(".mediaInfoItem", viewnode);

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

            if (trimmedText === 'JP-18+' || trimmedText === 'NC-17') {
                mediaItem.style.fontWeight = 'bold';
                mediaItem.style.fontFamily = "'Georgia', serif";
            } else if (timeRegexWithHoursAndMinutes.test(trimmedText) || timeRegexHoursOnly.test(trimmedText) || timeRegexMinutesOnly.test(trimmedText)) {
                const ticks = item.RunTimeTicks;

                if (ticks) {
                    // convert ticks → seconds
                    const totalSeconds = Math.floor(ticks / 10000000);

                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);

                    if (hours > 0 && minutes > 0) {
                        mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${hours}小时${minutes}分`;
                    } else if (hours > 0) {
                        mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${hours}小时`;
                    } else {
                        mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${minutes}分`;
                    }

                    // optionally add a border
                    // mediaItem.classList.add('mediaInfoItem-border');
                } else {
                    if (timeRegexWithHoursAndMinutes.test(trimmedText)) {
                        const match = trimmedText.match(timeRegexWithHoursAndMinutes);
                        const hours = match[1];
                        const minutes = match[2];

                        // Change the text to the desired format with hours and minutes
                        mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${hours}小时${minutes}分`;
                        //mediaItem.classList.add('mediaInfoItem-border');

                    } else if (timeRegexHoursOnly.test(trimmedText)) {
                        const match = trimmedText.match(timeRegexHoursOnly);
                        const hours = match[1];

                        // Change the text to the desired format with only hours
                        mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${hours}小时`;
                        //mediaItem.classList.add('mediaInfoItem-border');

                    } else if (timeRegexMinutesOnly.test(trimmedText)) {
                        const match = trimmedText.match(timeRegexMinutesOnly);
                        const minutes = match[1];

                        // Change the text to the desired format with only minutes
                        mediaItem.innerHTML = `<span style="font-weight: bold;">时长</span>: ${minutes}分`;
                        //mediaItem.classList.add('mediaInfoItem-border');
                    }
                }

            } else if (['endsAt', 'mediaInfoCriticRating'].some(className => mediaItem.classList.contains(className))) {
                mediaItem.style.display = 'none';
            } else if (/^\d{4}$/.test(trimmedText) && item.Height) {
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

                    // Calculate full stars and half star
                    let fullStars = Math.min(Math.floor(rating), 5);
                    let decimal = rating - Math.floor(rating);
                    let hasHalfStar = decimal >= 0.25 && decimal < 0.75 && fullStars < 5;
                    // If decimal >= 0.75, round up to full star
                    if (decimal >= 0.75 && fullStars < 5) {
                        fullStars++;
                    }

                    // Generate the stars with reduced space
                    let starsHTML = '';
                    let totalStars = fullStars + (hasHalfStar ? 1 : 0);
                    for (let i = 0; i < fullStars; i++) {
                        let margin = (i < totalStars - 1) ? '-5px' : '0';
                        starsHTML += `<i class="md-icon md-icon-fill starIcon" style="margin-right: ${margin};"></i>`;
                    }
                    // Add half star if needed
                    if (hasHalfStar) {
                        starsHTML += `<i class="md-icon starIcon" style="margin-right: 0;">star_half</i>`;
                    }

                    // Replace the content with the new format
                    mediaItem.innerHTML = `<span style="font-weight: bold;">评分</span>:${starsHTML} ${rating}分`;
                } else {
                    console.warn('No valid rating number found in the mediaItem.');
                }
            }
        });
    }

    function tagInsert(mediaInfoItem, viewnode) {
        const tagItems = qsVisible(".itemTags", viewnode);
        if (!tagItems) return;
        const tagClones = tagItems.cloneNode(true);
        // Remove the existing classes
        tagClones.className = 'mediaInfoItem';
        tagClones.style.marginTop = '';
        tagClones.style.marginBottom = '';
        // Tag 添加淡色背景
        tagClones.style.background = 'rgba(100,200,255,0.08)';
        tagClones.style.padding = '4px 8px';
        tagClones.style.borderRadius = '6px';

        // 添加 "标签: " 前缀
        const label = document.createElement('span');
        label.textContent = '标签: ';
        label.style.cssText = 'font-weight: 600; margin-right: 4px; color: rgba(255,255,255,0.7);';
        tagClones.insertBefore(label, tagClones.firstChild);

        // Set the desired inline styles
        //tagClones.style.whiteSpace = 'normal';
        mediaInfoItem.insertAdjacentElement('afterend', tagClones);
        mediaInfoStyle(tagClones);

        // Genre 添加 "类型: " 前缀
        if (!mediaInfoItem.querySelector('.genre-label')) {
            const genreLabel = document.createElement('span');
            genreLabel.className = 'genre-label';
            genreLabel.textContent = '类型: ';
            genreLabel.style.cssText = 'font-weight: 600; margin-right: 4px; color: rgba(255,255,255,0.7);';
            mediaInfoItem.insertBefore(genreLabel, mediaInfoItem.firstChild);
        }
    }

    function moveTopDown(viewnode) {
        const topMain = qsVisible(".topDetailsMain", viewnode);

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
        if (item.Type === 'BoxSet') return;
        if (newLinks.length === 0) return;

        const container = mediaInfoItem.parentNode;

        // Check if an external links container already exists
        let externalLinksItem = container.querySelector('#custom-external-links');

        if (externalLinksItem) {
            // Append to existing external links container
            newLinks.forEach(link => {
                externalLinksItem.appendChild(document.createTextNode(', '));
                externalLinksItem.appendChild(link);
            });
        } else {
            // Create a new container for external links
            externalLinksItem = document.createElement('div');
            externalLinksItem.id = 'custom-external-links';
            externalLinksItem.className = 'mediaInfoItem media-info-item';
            externalLinksItem.style.cssText = 'white-space: normal; background: rgba(255,182,193,0.08); padding: 4px 8px; border-radius: 6px;';

            // Add "外部链接: " label
            const label = document.createElement('span');
            label.textContent = '外部链接: ';
            label.style.cssText = 'font-weight: 600; margin-right: 4px; color: rgba(255,255,255,0.7);';
            externalLinksItem.appendChild(label);

            // Add all links
            newLinks.forEach((link, index) => {
                if (index > 0) {
                    externalLinksItem.appendChild(document.createTextNode(', '));
                }
                externalLinksItem.appendChild(link);
            });

            // Insert at the end of container (after all existing mediaInfoItems including tags)
            container.appendChild(externalLinksItem);
        }

        mediaInfoStyle(externalLinksItem);
    }

    function createNewLinkElement(title, color, url, text) {
        if (item.Type === 'BoxSet') return null;
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
        if (OS_current != 'windows' || item.Type === 'Person' || Object.keys(mountMatch).length === 0) return;
        const itemPath = translatePath(item.Path);
        const itemFolderPath = itemPath.substring(0, itemPath.lastIndexOf('\\'));

        const mainDetailButtons = qsVisible(".mainDetailButtons");

        const buttonhtml = createButtonHtml('embyCopyUrl', `复制所在文件夹路径: ${itemFolderPath}`, `<span class="material-symbols-outlined">folder_copy</span>`, '复制路径');
        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        qsVisible("#embyCopyUrl").onclick = embyCopyUrl;

        function embyCopyUrl() {
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

    function embyButtonInit() {
        if (OS_current != 'ipad' || item.Type != 'Movie') return;
        const url = `emby://items?serverId=${ApiClient.serverId()}&itemId=${item.Id}`;
        const embyIcon = `<img height="24" src="${ApiClient._serverAddress}/favicon.ico" />`;
        const buttonhtml = createButtonHtml('jumpEmby', '跳转Emby', embyIcon, 'Emby');
        const mainDetailButtons = qsVisible(".mainDetailButtons");

        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);

        const embyButton = qsVisible("#jumpEmby");
        if (embyButton) {
            embyButton.addEventListener("click", function () {
                // This will attempt to open the Emby app on iPad
                window.location.href = url;
            });
        }
    }


    function javdbButtonInit() {
        if (!isJP18() || !fetchJavDbFlag || item.Type === 'Person') return;

        const mainDetailButtons = qsVisible(".mainDetailButtons");

        const iconJavDb = `<svg width="70.5" height="24" viewBox="0 0 326 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="166" y="11" width="160" height="93" fill="#2F80ED"></rect>
                        <path d="M196.781 27.0078H213.41C217.736 27.0078 221.445 27.4089 224.539 28.2109C227.633 29.013 230.44 30.5169 232.961 32.7227C239.521 38.3372 242.801 46.8737 242.801 58.332C242.801 62.1133 242.471 65.5651 241.812 68.6875C241.154 71.8099 240.137 74.6315 238.762 77.1523C237.387 79.6445 235.625 81.8789 233.477 83.8555C231.786 85.3737 229.939 86.5911 227.934 87.5078C225.928 88.4245 223.766 89.069 221.445 89.4414C219.154 89.8138 216.561 90 213.668 90H197.039C194.719 90 192.971 89.6562 191.797 88.9688C190.622 88.2526 189.849 87.2643 189.477 86.0039C189.133 84.7148 188.961 83.0534 188.961 81.0195V34.8281C188.961 32.0781 189.577 30.0872 190.809 28.8555C192.04 27.6237 194.031 27.0078 196.781 27.0078ZM201.723 37.1055V79.8594H211.391C213.51 79.8594 215.172 79.8021 216.375 79.6875C217.578 79.5729 218.824 79.2865 220.113 78.8281C221.402 78.3698 222.52 77.7253 223.465 76.8945C227.733 73.2852 229.867 67.069 229.867 58.2461C229.867 52.0299 228.922 47.375 227.031 44.2812C225.169 41.1875 222.863 39.2253 220.113 38.3945C217.363 37.5352 214.04 37.1055 210.145 37.1055H201.723ZM280.914 90H261.664C258.885 90 256.895 89.3841 255.691 88.1523C254.517 86.8919 253.93 84.901 253.93 82.1797V34.8281C253.93 32.0495 254.531 30.0586 255.734 28.8555C256.966 27.6237 258.943 27.0078 261.664 27.0078H282.074C285.082 27.0078 287.689 27.194 289.895 27.5664C292.1 27.9388 294.077 28.6549 295.824 29.7148C297.314 30.6029 298.632 31.7344 299.777 33.1094C300.923 34.4557 301.797 35.9596 302.398 37.6211C303 39.2539 303.301 40.987 303.301 42.8203C303.301 49.1224 300.15 53.7344 293.848 56.6562C302.126 59.2917 306.266 64.4193 306.266 72.0391C306.266 75.5625 305.363 78.7422 303.559 81.5781C301.754 84.3854 299.319 86.4622 296.254 87.8086C294.335 88.6107 292.129 89.1836 289.637 89.5273C287.145 89.8424 284.237 90 280.914 90ZM279.969 62.0273H266.691V80.418H280.398C289.021 80.418 293.332 77.3099 293.332 71.0938C293.332 67.9141 292.215 65.6081 289.98 64.1758C287.746 62.7435 284.409 62.0273 279.969 62.0273ZM266.691 36.5898V52.875H278.379C281.559 52.875 284.008 52.5742 285.727 51.9727C287.474 51.3711 288.806 50.2253 289.723 48.5352C290.439 47.332 290.797 45.9857 290.797 44.4961C290.797 41.3164 289.665 39.2109 287.402 38.1797C285.139 37.1198 281.688 36.5898 277.047 36.5898H266.691Z" fill="white"></path>
                        <path d="M47.4375 29.5469V65.5469C47.4375 68.6719 47.2969 71.3281 47.0156 73.5156C46.7656 75.7031 46.1719 77.9219 45.2344 80.1719C43.6719 83.9531 41.0938 86.9062 37.5 89.0312C33.9062 91.125 29.5312 92.1719 24.375 92.1719C19.7188 92.1719 15.8281 91.4375 12.7031 89.9688C9.60938 88.5 7.10938 86.125 5.20312 82.8438C4.20312 81.0938 3.39062 79.0781 2.76562 76.7969C2.14062 74.5156 1.82812 72.3438 1.82812 70.2812C1.82812 68.0938 2.4375 66.4219 3.65625 65.2656C4.875 64.1094 6.4375 63.5312 8.34375 63.5312C10.1875 63.5312 11.5781 64.0625 12.5156 65.125C13.4531 66.1875 14.1719 67.8438 14.6719 70.0938C15.2031 72.5 15.7344 74.4219 16.2656 75.8594C16.7969 77.2969 17.6875 78.5312 18.9375 79.5625C20.1875 80.5938 21.9688 81.1094 24.2812 81.1094C30.4375 81.1094 33.5156 76.5938 33.5156 67.5625V29.5469C33.5156 26.7344 34.125 24.625 35.3438 23.2188C36.5938 21.8125 38.2812 21.1094 40.4062 21.1094C42.5625 21.1094 44.2656 21.8125 45.5156 23.2188C46.7969 24.625 47.4375 26.7344 47.4375 29.5469ZM93.9844 84.9531C90.8906 87.3594 87.8906 89.1719 84.9844 90.3906C82.1094 91.5781 78.875 92.1719 75.2812 92.1719C72 92.1719 69.1094 91.5312 66.6094 90.25C64.1406 88.9375 62.2344 87.1719 60.8906 84.9531C59.5469 82.7344 58.875 80.3281 58.875 77.7344C58.875 74.2344 59.9844 71.25 62.2031 68.7812C64.4219 66.3125 67.4688 64.6562 71.3438 63.8125C72.1562 63.625 74.1719 63.2031 77.3906 62.5469C80.6094 61.8906 83.3594 61.2969 85.6406 60.7656C87.9531 60.2031 90.4531 59.5312 93.1406 58.75C92.9844 55.375 92.2969 52.9062 91.0781 51.3438C89.8906 49.75 87.4062 48.9531 83.625 48.9531C80.375 48.9531 77.9219 49.4062 76.2656 50.3125C74.6406 51.2188 73.2344 52.5781 72.0469 54.3906C70.8906 56.2031 70.0625 57.4062 69.5625 58C69.0938 58.5625 68.0625 58.8438 66.4688 58.8438C65.0312 58.8438 63.7812 58.3906 62.7188 57.4844C61.6875 56.5469 61.1719 55.3594 61.1719 53.9219C61.1719 51.6719 61.9688 49.4844 63.5625 47.3594C65.1562 45.2344 67.6406 43.4844 71.0156 42.1094C74.3906 40.7344 78.5938 40.0469 83.625 40.0469C89.25 40.0469 93.6719 40.7188 96.8906 42.0625C100.109 43.375 102.375 45.4688 103.688 48.3438C105.031 51.2188 105.703 55.0312 105.703 59.7812C105.703 62.7812 105.688 65.3281 105.656 67.4219C105.656 69.5156 105.641 71.8438 105.609 74.4062C105.609 76.8125 106 79.3281 106.781 81.9531C107.594 84.5469 108 86.2188 108 86.9688C108 88.2812 107.375 89.4844 106.125 90.5781C104.906 91.6406 103.516 92.1719 101.953 92.1719C100.641 92.1719 99.3438 91.5625 98.0625 90.3438C96.7812 89.0938 95.4219 87.2969 93.9844 84.9531ZM93.1406 66.4375C91.2656 67.125 88.5312 67.8594 84.9375 68.6406C81.375 69.3906 78.9062 69.9531 77.5312 70.3281C76.1562 70.6719 74.8438 71.375 73.5938 72.4375C72.3438 73.4688 71.7188 74.9219 71.7188 76.7969C71.7188 78.7344 72.4531 80.3906 73.9219 81.7656C75.3906 83.1094 77.3125 83.7812 79.6875 83.7812C82.2188 83.7812 84.5469 83.2344 86.6719 82.1406C88.8281 81.0156 90.4062 79.5781 91.4062 77.8281C92.5625 75.8906 93.1406 72.7031 93.1406 68.2656V66.4375ZM125.344 48.1094L135.703 77.1719L146.859 46.8438C147.734 44.4062 148.594 42.6875 149.438 41.6875C150.281 40.6562 151.562 40.1406 153.281 40.1406C154.906 40.1406 156.281 40.6875 157.406 41.7812C158.562 42.875 159.141 44.1406 159.141 45.5781C159.141 46.1406 159.031 46.7969 158.812 47.5469C158.625 48.2969 158.391 49 158.109 49.6562C157.859 50.3125 157.562 51.0625 157.219 51.9062L144.938 82.375C144.594 83.25 144.141 84.3594 143.578 85.7031C143.047 87.0469 142.438 88.2031 141.75 89.1719C141.094 90.1094 140.266 90.8438 139.266 91.375C138.297 91.9062 137.109 92.1719 135.703 92.1719C133.891 92.1719 132.438 91.7656 131.344 90.9531C130.281 90.1094 129.484 89.2031 128.953 88.2344C128.453 87.2344 127.594 85.2812 126.375 82.375L114.188 52.2344C113.906 51.4844 113.609 50.7344 113.297 49.9844C113.016 49.2344 112.766 48.4688 112.547 47.6875C112.359 46.9062 112.266 46.2344 112.266 45.6719C112.266 44.7969 112.531 43.9375 113.062 43.0938C113.594 42.2188 114.328 41.5156 115.266 40.9844C116.203 40.4219 117.219 40.1406 118.312 40.1406C120.438 40.1406 121.891 40.75 122.672 41.9688C123.484 43.1875 124.375 45.2344 125.344 48.1094Z" fill="currentColor"></path>
                        </svg>`;

        const buttonhtml = createButtonHtml('injectJavdb', '加载javdb.com数据', iconJavDb, '', false);

        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        const javInjectButton = qsVisible("#injectJavdb");
        //javInjectButton.classList.add('injectJavdb');

        javInjectButton.addEventListener('click', async () => {
            if (javInjectButton.disabled) return;
            javInjectButton.disabled = true;
            const statusSpan = document.createElement('span');
            statusSpan.className = 'btn-status';
            statusSpan.innerHTML = `<span class="btn-spinner"></span>`;
            javInjectButton.appendChild(statusSpan);
            javInjectButton.style.opacity = '0.6';

            try {
                showToast({
                    text: 'javdb资源=>搜索中。。。',
                    icon: `<span class="material-symbols-outlined">mystery</span>`
                });
                await javdbActorInject();
                await javdbActorInject(true);
                await seriesInject();
                statusSpan.innerHTML = `<svg class="btn-check" viewBox="0 0 24 24" fill="#4CAF50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
                javInjectButton.style.opacity = '1';
            } catch (error) {
                console.error('[JavDB] 加载失败:', error);
                showToast({
                    text: 'javdb加载失败，可重试',
                    icon: `<span class="material-symbols-outlined">error</span>`
                });
                statusSpan.remove();
                javInjectButton.style.opacity = '1';
                javInjectButton.disabled = false;
            }
        });
    }

    async function reviewButtonInit() {
        if (!isJP18() || !fetchJavDbFlag || item.Type === 'Person') return;

        const mainDetailButtons = qsVisible(".mainDetailButtons");

        const iconJavDB = `<img height="24" src="data:image/x-icon;base64,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zf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs2pZgDMD3sA6Tp7AOjvegDn/3kA5/94AOb/dwDm/3YA5f91AOX/dADk/3MA5P9yAOT/cgDj/3EA4/9wAOP/bwDi/24A4v9uAOH/bQDh/20A4P9sAOD/agDe/2gA3P9nAdn/ZgHX/2UB1f9lAtL/ZQLQ/2QCzv9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs7zZQDORHwA6Yx8AOj/ewDo/3oA5/95AOf/eADm/3cA5v92AOb/dQDl/3UA5f9zAOT/cwDk/3IA5P9xAOP/cADj/3AA4v9vAOL/bgDh/24A4f9tAOD/bADg/2oA3/9pAN3/ZwHa/2cB1/9mAdX/ZQLT/2UC0P9kAs7/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALMnH4A6ch9AOj/fADo/3sA6P96AOf/eQDn/3gA5/93AOb/dgDm/3UA5f91AOX/cwDk/3MA5P9yAOP/cQDj/3AA4/9wAOL/bwDi/24A4f9tAOH/bQDg/2wA4P9rAN//aQDc/2gB2v9mAdf/ZgHV/2UC0/9lAtD/ZALO/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/YwHM2IAA6t9+AOn/fgDo/3wA6P97AOj/ewDn/3kA5/94AOf/eADm/3YA5v91AOX/dQDl/3MA5P9zAOT/cgDj/3AD3f97Htr/hTPb/4k72/+MQdz/jkbc/5BI3P+PSdv/j0nb/41J2f+MSdf/i0nW/4lG1P+GQtH/gjzP/341zf9xIMn/YwXI/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZALN/2QCzf9kAs3/ZAHN8IEA6uJ/AOr/fwDp/34A6f98AOj/fADo/3sA6P95AOf/eQDn/3gA5v92AOb/dgDl/3UA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" />`;

        const buttonhtml = createButtonHtml('injectReviews', '加载javdb.com短评', iconJavDB, '短评');

        mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
        const reviewButton = qsVisible("#injectReviews");

        reviewButton.addEventListener('click', handleReviewButtonClick);

        async function handleReviewButtonClick() {
            const reviewBtn = qsVisible("#injectReviews");
            if (reviewBtn.disabled) return;

            let statusSpan = null;
            function setLoading() {
                reviewBtn.disabled = true;
                statusSpan = document.createElement('span');
                statusSpan.className = 'btn-status';
                statusSpan.innerHTML = `<span class="btn-spinner"></span>`;
                reviewBtn.appendChild(statusSpan);
                reviewBtn.style.opacity = '0.6';
            }
            function setSuccess() {
                if (statusSpan) statusSpan.innerHTML = `<svg class="btn-check" viewBox="0 0 24 24" fill="#4CAF50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
                reviewBtn.style.opacity = '1';
            }
            function setReady() {
                if (statusSpan) { statusSpan.remove(); statusSpan = null; }
                reviewBtn.style.opacity = '1';
                reviewBtn.disabled = false;
            }

            // 启用 API 短评且有密钥配置时，使用 API 方式
            if (enableJavdbReviews && javdbClient.hasSecretKey()) {
                setLoading();
                try {
                    // 获取番号
                    const code = getPartBefore(item.Name, " ");
                    const noNumCode = code.replace(/^\d+(?=[A-Za-z])/, '');

                    // 搜索影片
                    const movieInfo = await javdbClient.searchMovie(noNumCode);
                    if (!movieInfo) {
                        showToast({
                            text: '未找到匹配的影片',
                            icon: `<span class="material-symbols-outlined">search_off</span>`,
                        });
                        setReady();
                        return;
                    }

                    // 检查是否需要登录
                    if (!javdbClient.hasCredentials()) {
                        setReady();
                        javdbClient.showCredentialsModal(async () => {
                            await loadAndShowReviews(movieInfo);
                        });
                        return;
                    }

                    // 尝试登录并获取短评
                    const token = await javdbClient.login();
                    if (!token) {
                        setReady();
                        javdbClient.showCredentialsModal(async () => {
                            await loadAndShowReviews(movieInfo);
                        });
                        return;
                    }

                    await loadAndShowReviews(movieInfo);
                    setSuccess();
                } catch (error) {
                    console.error('[JavDB] 短评加载失败:', error);
                    showToast({
                        text: '短评加载失败，可重试',
                        icon: `<span class="material-symbols-outlined">error</span>`
                    });
                    setReady();
                }
            } else {
                // 使用旧的 HTML 抓取方式
                const reviewBtn = qsVisible("#injectReviews");
                if (reviewBtn.disabled) return;
                reviewBtn.disabled = true;
                const statusSpan2 = document.createElement('span');
                statusSpan2.className = 'btn-status';
                statusSpan2.innerHTML = `<span class="btn-spinner"></span>`;
                reviewBtn.appendChild(statusSpan2);
                reviewBtn.style.opacity = '0.6';

                showToast({
                    text: 'javdb短评=>搜索中。。。',
                    icon: `<span class="material-symbols-outlined">mystery</span>`
                });

                try {
                    const result = await fetchDbReviews();
                    if (result) {
                        addReviews(result.reviews, result.reviewUrl);
                        statusSpan2.innerHTML = `<svg class="btn-check" viewBox="0 0 24 24" fill="#4CAF50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
                    } else {
                        statusSpan2.remove();
                        reviewBtn.disabled = false;
                    }
                } catch (error) {
                    console.error('[JavDB] 短评加载失败:', error);
                    showToast({
                        text: '短评加载失败，可重试',
                        icon: `<span class="material-symbols-outlined">error</span>`
                    });
                    statusSpan2.remove();
                    reviewBtn.disabled = false;
                }
                reviewBtn.style.opacity = '1';
            }
        }

        async function loadAndShowReviews(movieInfo) {
            // 如果没有评分，获取详情补充评分和短评数
            if (!movieInfo.score) {
                const detail = await javdbClient.getMovieDetail(movieInfo.movieId);
                if (detail) {
                    movieInfo.score = detail.score;
                    movieInfo.commentsCount = detail.commentsCount;
                    javdbClient._cacheMovie(movieInfo.number, movieInfo);
                }
            }

            const reviewsData = await javdbClient.getReviews(movieInfo.movieId, 1, 'hotly');
            if (!reviewsData || !reviewsData.reviews || reviewsData.reviews.length === 0) {
                showToast({
                    text: '暂无短评',
                    icon: `<span class="material-symbols-outlined">comments_disabled</span>`,
                });
                return;
            }
            javdbClient.showReviewsModal(movieInfo, reviewsData);
        }

        function addReviews(reviews, reviewUrl) {
            if (reviews.length === 0) {
                showToast({
                    text: `暂无短评`,
                    icon: `<span class="material-symbols-outlined">comments_disabled</span>`,
                });
                return;
            }

            // 移除已存在的短评区域
            const existingReview = viewnode.querySelector('#javdb-review-section');
            if (existingReview) existingReview.remove();

            // HTML 转义
            const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

            // 构建短评 HTML
            const reviewHtml = `
                <div id="javdb-review-section" class="verticalFieldItem detail-lineItem" style="margin-top: 15px; padding: 12px 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span class="readOnlyContent" style="font-weight: 600;">短评（来自JavDB，共${reviews.length}条）</span>
                        <a href="javascript:void(0)" id="javdb-review-more" class="button-link secondaryText" style="font-size: 0.9em;">在JavDB查看更多</a>
                    </div>
                    <div class="secondaryText readOnlyContent" style="line-height: 1.5; max-height: 300px; overflow-y: auto;">
                        ${reviews.map((review, i) => `<div style="padding: 6px 8px; background: ${i % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'transparent'}; border-radius: 4px; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(review)}</div>`).join('')}
                    </div>
                </div>
            `;

            // 插入到 detailTextContainer 最下方
            const detailTextContainer = qsVisible(".detailTextContainer");
            if (detailTextContainer) {
                detailTextContainer.insertAdjacentHTML('beforeend', reviewHtml);

                // 绑定"查看更多"点击事件
                const moreLink = viewnode.querySelector('#javdb-review-more');
                if (moreLink) {
                    moreLink.onclick = () => openReviewWindow(reviewUrl);
                }
            }
        }

        function openReviewWindow(url) {
            const width = 500;
            const height = 700;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            window.open(url, 'javdb_reviews', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
        }

        async function fetchDbReviews() {
            let movieUrl = getUrl(item.Overview, "===== 外部链接 =====", "JavDb");

            if (!movieUrl) {
                const code = getPartBefore(item.Name, " ");
                const noNumCode = code.replace(/^\d+(?=[A-Za-z])/, '').toLowerCase();
                const HOST = "https://javdb.com";
                const url = `${HOST}/search?q=${noNumCode}&f=all`;

                let searchData = await request(url);
                if (searchData.length === 0) return null;

                const parser = new DOMParser();
                let parsedHtml = parser.parseFromString(searchData, 'text/html');
                const firstItem = parsedHtml.querySelector(".movie-list .item");

                if (!firstItem) return null;

                const href = firstItem.querySelector("a.box")?.getAttribute("href");
                const titleElement = firstItem.querySelector(".video-title strong");
                const title = titleElement ? titleElement.textContent.trim().toLowerCase() : null;

                if (title && (title.includes(noNumCode) || noNumCode.includes(title))) {
                    movieUrl = `${HOST}${href}`;
                    if (addLink(item.Overview || '', "===== 外部链接 =====", "JavDb", movieUrl)) {
                        ApiClient.updateItem(item);
                        setTimeout(() => javdbTitle(), 1000);
                    }

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

                    return { reviews, reviewUrl };
                } catch (error) {
                    console.error("Error fetching reviews:", error);
                    return null;
                }
            } else {
                showToast({
                    text: `短评加载失败`,
                    icon: `<span class="material-symbols-outlined">search_off</span>`,
                });
                return null;
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
            //localStorage.setItem(cacheKey, JSON.stringify(moreItems));
            displayMoreItems(moreItems);
        }

        function displayMoreItems(moreItems) {
            let imgHtml = '';
            for (let i = 0; i < moreItems.length; i++) {
                imgHtml += createDbContainer(moreItems[i], i);
            }

            const sliderElement = createSlider({ text: '更多类似', html: imgHtml, layout: 'actor', count: moreItems.length });
            const sliderId = "mySimilarSlider";
            sliderElement.id = sliderId;
            // javdb section 添加悬浮背景
            sliderElement.classList.add('edp-slider-bg');
            const similarSection = qsVisible(".similarSection");
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
                <div is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right scrollX hiddenScrollX scrollFrameX" data-mousewheel="false" data-focusscroll="true" data-horizontal="true">
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

    /**
     * Creates a slider section element.
     * @param {Object} opts
     * @param {string} opts.text - Section title text
     * @param {string} opts.html - Inner HTML content (card elements)
     * @param {string} [opts.linkUrl] - If set, title becomes a clickable external link
     * @param {boolean} [opts.isActor=true] - For actor sliders: appends "其他作品" suffix to title
     * @param {'actor'|'normal'|'boxset'} [opts.layout='normal'] - Layout variant
     * @param {number} [opts.count] - Item count shown as badge in top-right
     */
    function createSlider({ text, html, linkUrl, isActor = true, layout = 'normal', count }) {
        const titleText = layout === 'actor'
            ? (isActor ? `${text} 其他作品` : `${text}（导演） 其他作品`)
            : text;

        const titleLink = linkUrl
            ? `<a href="${linkUrl}" target="_blank" is="emby-sectiontitle" class="noautofocus button-link button-link-color-inherit sectionTitleTextButton sectionTitleTextButton-link sectionTitleTextButton-more emby-button emby-button-backdropfilter">`
            : `<a is="emby-sectiontitle" class="noautofocus button-link button-link-color-inherit sectionTitleTextButton sectionTitleTextButton-link sectionTitleTextButton-more emby-button emby-button-backdropfilter">`;

        const badgeHtml = count != null ? `<span class="edp-count-badge">来自JavDB，共<b>${count}</b>部</span>` : '';
        const headerClass = count != null ? ' edp-section-header' : '';

        let sliderHtml;

        if (layout === 'boxset') {
            sliderHtml = `
            <div class="linked-Movie-section verticalSection verticalSection-cards">
                <div class="sectionTitleContainer padded-left padded-left-page padded-right sectionTitleContainer-cards focusable${headerClass}" data-focusabletype="nearest">
                    ${titleLink}
                        <h2 class="sectionTitle sectionTitle-cards sectionTitleText-withseeall">${titleText}</h2>
                    </a>
                    ${badgeHtml}
                </div>
                <div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-left-page padded-right vertical-wrap">
                    ${html}
                </div>
            </div>`;
        } else {
            const isActorLayout = layout === 'actor';
            const sectionClass = `verticalSection verticalSection-cards${isActorLayout ? ' actorMoreSection' : ''} emby-scrollbuttons-scroller`;
            const containerClass = isActorLayout
                ? 'scrollSlider focuscontainer-x itemsContainer focusable actorMoreItemsContainer scrollSliderX emby-scrollbuttons-scrollSlider virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller'
                : 'focusable focuscontainer-x itemsContainer scrollSlider scrollSliderX emby-scrollbuttons-scrollSlider virtualItemsContainer virtual-scroller-overflowvisible virtual-scroller';
            const containerStyle = isActorLayout
                ? 'white-space: nowrap; min-width: 2412px; height: 351px;'
                : 'white-space: nowrap; min-width: 2400px; height: 265px;';

            sliderHtml = `
            <div class="${sectionClass}">
                <div class="sectionTitleContainer sectionTitleContainer-cards padded-left padded-left-page padded-right${headerClass}">
                    ${titleLink}
                        <h2 class="sectionTitle sectionTitle-cards">${titleText}</h2>
                    </a>
                    ${badgeHtml}
                </div>
                <div is="emby-scroller" class="emby-scroller padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right scrollX hiddenScrollX scrollFrameX" data-mousewheel="false" data-focusscroll="true" data-horizontal="true">
                    <div is="emby-itemscontainer" class="${containerClass}" data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid" style="${containerStyle}" data-minoverhang="1" layout="horizontal-grid">
                        ${html}
                    </div>
                </div>
            </div>`;
        }

        const wrapper = document.createElement('div');
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
            <div data-id="${itemInfo.Id}" data-localtrailer-count="${itemInfo.LocalTrailerCount || 0}" data-remotetrailer-count="${itemInfo.RemoteTrailers?.length || 0}" class="virtualScrollItem card ${typeWord}Card card-horiz ${typeWord}Card-horiz card-hoverable card-autoactive" tabindex="0" draggable="false" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded">
                    <button onclick="Emby.Page.showItem('${itemInfo.Id}')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-${typeWord} edp-card-img">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded">
                        <span title="${name}">${name}</span>
                    </div>
                    <div class="cardText cardText-secondary">
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
            <div  class="virtualScrollItem card portraitCard card-horiz portraitCard-horiz card-hoverable card-autoactive" tabindex="0" draggable="false" style="inset: 0px auto auto ${distance * increment}px;">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-portrait edp-card-img">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded">
                        <span title="${name}">${name}</span>
                    </div>
                    <div class="cardText cardText-secondary">
                        ${code}
                    </div>
                </div>
            </div>
        `;

        return itemContainer;
    }

    function getScoreTier(scoreNum) {
        if (scoreNum === null) return 'edp-score-none';
        if (scoreNum >= 4.5) return 'edp-score-gold';
        if (scoreNum >= 4.0) return 'edp-score-high';
        if (scoreNum >= 3.0) return 'edp-score-mid';
        return 'edp-score-low';
    }

    function createItemContainerLarge(itemInfo, increment) {
        let distance = OS_current === 'ipad' ? 260 : OS_current === 'iphone' ? 300 : 350;
        const imgUrl = itemInfo.ImgSrc;
        const title = `${itemInfo.Code} ${itemInfo.Name}`;
        const link = `https://javdb.com${itemInfo.Link}?locale=zh`;
        const score = OS_current === 'iphone' ? itemInfo.Score.replace(' users', '') : itemInfo.Score;
        const scoreStr = score.match(/^(\d+(\.\d+)?)/);
        const scoreNum = scoreStr ? parseFloat(scoreStr[0]) : null;
        const scoreHighlight = scoreNum && scoreNum > 4.4 ? " edp-has-trailer" : "";
        const time = itemInfo.Time;
        let itemContainer;
        if (item.Type != 'BoxSet') {
            itemContainer = `
            <div class="virtualScrollItem card backdropCard card-horiz backdropCard-horiz card-hoverable card-autoactive edp-card-enter" tabindex="0" draggable="true" style="inset: 0px auto auto ${distance * increment}px; animation-delay:${increment * 0.05}s">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop edp-card-img${scoreHighlight}">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded">
                        <span title="${title}">${title}</span>
                    </div>
                    <div class="cardText cardText-secondary edp-card-meta">
                        <span class="edp-card-date">${time}</span>
                        <span class="edp-score-badge ${getScoreTier(scoreNum)}">${score}</span>
                    </div>
                </div>
            </div>
            `;
        } else {
            itemContainer = `
            <div class="card backdropCard card-horiz card-hoverable card-autoactive edp-card-enter" tabindex="0" draggable="true" style="animation-delay:${increment * 0.05}s">
                <div class="cardBox cardBox-touchzoom cardBox-bottompadded">
                    <button onclick="window.open('${link}', '_blank')" tabindex="-1" class="itemAction cardContent-button cardContent cardImageContainer cardContent-background cardContent-bxsborder-fv coveredImage coveredImage-noScale cardPadder-backdrop edp-card-img${scoreHighlight}">
                        <img draggable="false" alt=" " class="cardImage cardImage-bxsborder-fv coveredImage coveredImage-noScale" loading="lazy" decoding="async" src="${imgUrl}">
                    </button>
                    <div class="cardText cardText-first cardText-first-padded">
                        <span title="${title}">${title}</span>
                    </div>
                    <div class="cardText cardText-secondary edp-card-meta">
                        <span class="edp-card-date">${time}</span>
                        <span class="edp-score-badge ${getScoreTier(scoreNum)}">${score}</span>
                    </div>
                </div>
            </div>
            `;
        }
        return itemContainer;
    }

    async function previewInject(isSlider = false) {
        const savedItemId = item.Id;

        let addSlider = false;
        if (!isJP18() || isTouchDevice() || window.innerHeight > window.innerWidth || isSlider) addSlider = true;


        if (item.BackdropImageTags.length === 0 || viewnode.querySelector("#myFanart")) return;

        const images = await ApiClient.getItemImageInfos(item.Id);
        if (!isStillCurrentItem(savedItemId)) return;
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

        const peopleSection = qsVisible(".peopleSection");
        if (!peopleSection) return;

        let isCollapsed = uniqueBackdrops.length > 30;

        if (!isCollapsed) { addSlider = true };

        let html = '';
        if (addSlider) {
            html = `<div id="myFanart" is="emby-itemscontainer" class="imageSection itemsContainer virtualItemsContainer focusable focuscontainer-x scrollSlider scrollSliderX emby-scrollbuttons-scrollSlider"  data-focusabletype="nearest" data-virtualscrolllayout="horizontal-grid" style="white-space: nowrap; min-width: 2412px;" data-minoverhang="1" layout="horizontal-grid">`;
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

        const banner = createBanner(item.Type === "Person"? "照片" : "剧照", html, addSlider);
        peopleSection.insertAdjacentHTML("afterend", banner);

        if (addSlider) {
            adjustSliderWidth();

            if (!isFanartResizeListenerAdded) {
                window.addEventListener('resize', function () {
                    if (viewnode && document.contains(viewnode)) adjustSliderWidth();
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

        const fanartSection = qsVisible(".imageSection");
        if (!fanartSection || !fanartSection.classList.contains('scrollSlider')) return

        const fanartImages = fanartSection.querySelectorAll(".my-fanart-image");
        if (!fanartImages || fanartImages.length === 0) return;


        const vhRatio = OS_current === 'ipad' ? 0.14 : 0.2;
        const height = Math.max(vhRatio * window.innerHeight, 180);

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

    class FanartModal {
        constructor() {
            this.isTouch = isTouchDevice();

            this.modal = document.createElement('div');
            this.modal.id = 'myModal';
            this.modal.classList.add('edp-modal');
            this.modal.innerHTML = `
                <span class="edp-close">&#10006;</span>
                <img class="edp-modal-content" id="modalImg">
                <div class="modal-thumbs" id="modalThumbs"></div>
                <div class="edp-modal-caption" id="modalCaption"></div>
                <button class="prev">&#10094;</button>
                <button class="next">&#10095;</button>
            `;
            document.body.appendChild(this.modal);

            this.modalImg = this.modal.querySelector('.edp-modal-content');
            this.modalCaption = this.modal.querySelector('.edp-modal-caption');
            this.thumbsContainer = this.modal.querySelector('.modal-thumbs');
            this.prevBtn = this.modal.querySelector('.prev');
            this.nextBtn = this.modal.querySelector('.next');
            this.currentIndex = 0;

            this._attachEventListeners();
        }

        init() {
            const fanartSection = qsVisible(".imageSection");
            if (!fanartSection) return;
            const images = fanartSection.querySelectorAll('.my-fanart-image');
            if (!images.length) return;

            // Remove old listener to prevent duplicates on re-navigation
            if (this._fanartClickHandler) {
                this._boundFanartSection?.removeEventListener('click', this._fanartClickHandler);
            }
            this._fanartClickHandler = (e) => this._handleTapOrClick(e, fanartSection);
            this._boundFanartSection = fanartSection;
            fanartSection.addEventListener('click', this._fanartClickHandler);
        }

        // ===== 事件绑定 =====

        _attachEventListeners() {
            const closeBtn = this.modal.querySelector('.edp-close');

            if (this.isTouch) {
                this.prevBtn.style.display = 'none';
                this.nextBtn.style.display = 'none';
                closeBtn.style.display = 'none';
                this._attachTouchSwipe();
            } else {
                this.prevBtn.addEventListener('mousedown', () => this.prevBtn.classList.add('click-smaller'));
                this.prevBtn.addEventListener('mouseup', () => this.prevBtn.classList.remove('click-smaller'));
                this.prevBtn.addEventListener('click', () => this._prevImage());

                this.nextBtn.addEventListener('mousedown', () => this.nextBtn.classList.add('click-smaller'));
                this.nextBtn.addEventListener('mouseup', () => this.nextBtn.classList.remove('click-smaller'));
                this.nextBtn.addEventListener('click', () => this._nextImage());

                closeBtn.addEventListener('click', () => this._close());
                this.modalImg.addEventListener('wheel', (e) => this._handleWheelZoom(e));
            }

            window.addEventListener('popstate', () => this._close());

            document.addEventListener('keydown', (e) => {
                if (this.modal.style.display !== 'flex') return;
                if (e.key === 'ArrowLeft') { e.preventDefault(); this._prevImage(); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); this._nextImage(); }
                else if (e.key === 'Escape') { e.preventDefault(); this._close(); }
            });
        }

        _attachTouchSwipe() {
            let startX = 0, startY = 0, endX = 0, endY = 0;
            let isSwipingX = false, isSwipingY = false, directionLocked = false;

            this.modal.addEventListener('touchstart', (e) => {
                const touch = e.changedTouches[0];
                this.modalImg.style.transition = 'none';
                startX = touch.screenX;
                startY = touch.screenY;
                isSwipingX = isSwipingY = directionLocked = false;
            });

            this.modal.addEventListener('touchmove', (e) => {
                const touch = e.changedTouches[0];
                const deltaX = touch.screenX - startX;
                const deltaY = touch.screenY - startY;

                if (!directionLocked) {
                    isSwipingX = Math.abs(deltaX) > Math.abs(deltaY);
                    isSwipingY = !isSwipingX;
                    directionLocked = true;
                }

                const maxDelta = 300;
                let distance = 0;
                if (isSwipingX) {
                    distance = Math.abs(deltaX);
                    this.modalImg.style.transform = `translateX(${deltaX}px)`;
                } else if (isSwipingY) {
                    distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    this.modalImg.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                }
                this.modalImg.style.opacity = 1 - 0.7 * Math.min(distance / maxDelta, 1);
                e.preventDefault();
            });

            this.modal.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                endX = touch.screenX;
                endY = touch.screenY;

                const deltaX = endX - startX;
                const deltaY = startY - endY;
                if (isSwipingX && Math.abs(deltaX) > 80) {
                    deltaX < 0 ? this._nextImage() : this._prevImage();
                } else if (isSwipingY && Math.abs(deltaY) > 100) {
                    this._closeSwipe();
                } else {
                    this._resetImageStyles();
                }
            });
        }

        // ===== 图片点击 =====

        _handleTapOrClick(event, fanartSection) {
            const target = event.target;
            if (!target.classList.contains('my-fanart-image')) return;

            const index = Array.from(fanartSection.querySelectorAll('.my-fanart-image')).indexOf(target);
            this._showImage(index);
        }

        // ===== 图片显示 =====

        _getFanartImages() {
            return qsaVisible(".imageSection .my-fanart-image");
        }

        _showImage(index) {
            const images = this._getFanartImages();
            const img = images[index];
            if (!img) return;

            this.modalImg.style.opacity = '0';
            this.modalImg.src = img.src;
            this.currentIndex = index;
            this.modalCaption.textContent = `${img.dataset.filename} (${index + 1}/${images.length})`;
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.modalImg.style.transform = 'scale(1)';
            this.modal.classList.remove('edp-modal-closing');
            this._updateButtonStates(index, images.length);
            this._buildThumbs(images, index);
            fadeIn(this.modalImg, 300);
        }

        _updateImage(index) {
            const images = this._getFanartImages();
            const img = images[index];
            if (!img) return;

            this.modalImg.src = img.src;
            this.currentIndex = index;
            this.modalCaption.textContent = `${img.dataset.filename} (${index + 1}/${images.length})`;
            this._updateButtonStates(index, images.length);
            this._updateActiveThumb(index);
        }

        _updateButtonStates(index, total) {
            this.prevBtn.classList.toggle('disabled', index === 0);
            this.nextBtn.classList.toggle('disabled', index === total - 1);
        }

        // ===== 缩略图 =====

        _buildThumbs(images, activeIndex) {
            this.thumbsContainer.innerHTML = '';
            images.forEach((img, i) => {
                const thumb = document.createElement('img');
                thumb.src = img.src;
                if (i === activeIndex) thumb.classList.add('thumb-active');
                thumb.addEventListener('click', () => this._showImage(i));
                this.thumbsContainer.appendChild(thumb);
            });
            this._scrollThumbIntoView(activeIndex);
        }

        _updateActiveThumb(index) {
            const prev = this.thumbsContainer.querySelector('.thumb-active');
            if (prev) prev.classList.remove('thumb-active');
            const thumbs = this.thumbsContainer.children;
            if (thumbs[index]) {
                thumbs[index].classList.add('thumb-active');
                this._scrollThumbIntoView(index);
            }
        }

        _scrollThumbIntoView(index) {
            const thumbs = this.thumbsContainer.children;
            if (thumbs[index]) {
                thumbs[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }

        // ===== 导航 =====

        _nextImage() {
            const index = this.currentIndex;
            const images = this._getFanartImages();
            if (index + 1 >= images.length) {
                this.modalImg.style.animation = 'shake 0.3s ease';
                setTimeout(() => { this.modalImg.style.animation = ''; }, 300);
                showToast({ text: '已到最后', icon: '<span class="material-symbols-outlined">last_page</span>' });
                this._resetImageStyles();
                return;
            }
            this._slideTransition(index + 1, 'left');
        }

        _prevImage() {
            const index = this.currentIndex;
            if (index - 1 < 0) {
                this.modalImg.style.animation = 'shake 0.3s ease';
                setTimeout(() => { this.modalImg.style.animation = ''; }, 300);
                showToast({ text: '已到最前', icon: '<span class="material-symbols-outlined">first_page</span>' });
                this._resetImageStyles();
                return;
            }
            this._slideTransition(index - 1, 'right');
        }

        _slideTransition(newIndex, direction) {
            const outDir = direction === 'left' ? '-100%' : '100%';
            const inDir = direction === 'left' ? '100%' : '-100%';

            this.modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            this.modalImg.style.transform = `translateX(${outDir})`;
            this.modalImg.style.opacity = '0';

            setTimeout(() => {
                this._updateImage(newIndex);
                this.modalImg.style.transition = 'none';
                this.modalImg.style.transform = `translateX(${inDir})`;
                this.modalImg.style.opacity = '0';
                void this.modalImg.offsetHeight;
                this.modalImg.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                this.modalImg.style.transform = 'translateX(0) scale(1)';
                this.modalImg.style.opacity = '1';
            }, 200);
        }

        // ===== 关闭 =====

        _close() {
            this.modal.classList.add('edp-modal-closing');
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.modal.classList.remove('edp-modal-closing');
                document.body.style.overflow = '';
            }, 300);
        }

        _closeSwipe() {
            const currentTransform = this.modalImg.style.transform || '';
            this.modalImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            this.modalImg.style.transform = currentTransform + ' scale(0)';
            this.modalImg.style.opacity = '0';
            this.modal.style.transition = 'background-color 0.3s ease';
            this.modal.style.backgroundColor = 'transparent';
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.modalImg.style.transition = '';
                this.modalImg.style.transform = '';
                this.modalImg.style.opacity = '';
                this.modal.style.transition = '';
                this.modal.style.backgroundColor = '';
                document.body.style.overflow = '';
            }, 300);
        }

        // ===== 辅助 =====

        _resetImageStyles() {
            this.modalImg.style.transform = 'translateX(0)';
            this.modalImg.style.opacity = 1;
        }

        _handleWheelZoom(event) {
            event.preventDefault();
            const zoomStep = 0.1;
            let currentZoom = parseFloat(getComputedStyle(this.modalImg).getPropertyValue('transform').split(' ')[3]) || 1;
            currentZoom += event.deltaY < 0 ? zoomStep : -zoomStep;
            currentZoom = Math.max(zoomStep, currentZoom);
            this.modalImg.style.transform = `scale(${currentZoom})`;
        }
    }

    class AddMovieModal {
        constructor(collectionId) {
            this.collectionId = collectionId;
            this.existingIds = new Set();
            this.modal = document.createElement('div');
            this.modal.classList.add('edp-add-modal');
            this.modal.innerHTML = `
                <div class="edp-add-modal-content">
                    <div class="edp-add-modal-header">
                        <input type="text" placeholder="输入番号搜索，如 ABP-123" id="addMovieInput">
                        <button class="edp-add-search-btn" id="addMovieSearchBtn">搜索</button>
                        <button class="edp-add-modal-close" id="addMovieCloseBtn">✕</button>
                    </div>
                    <div class="edp-add-modal-results" id="addMovieResults">
                        <div class="edp-add-modal-msg">输入番号后点击搜索</div>
                    </div>
                </div>
            `;
            document.body.appendChild(this.modal);

            this.input = this.modal.querySelector('#addMovieInput');
            this.searchBtn = this.modal.querySelector('#addMovieSearchBtn');
            this.closeBtn = this.modal.querySelector('#addMovieCloseBtn');
            this.resultsContainer = this.modal.querySelector('#addMovieResults');
            this._bindEvents();
        }

        _bindEvents() {
            this.closeBtn.addEventListener('click', () => this.close());
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
            this.searchBtn.addEventListener('click', () => this._search());
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this._search();
            });
            this._escHandler = (e) => {
                if (e.key === 'Escape' && this.modal.style.display === 'flex') this.close();
            };
            document.addEventListener('keydown', this._escHandler);
        }

        async open() {
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.input.value = '';
            this.resultsContainer.innerHTML = '<div class="edp-add-modal-msg">输入番号后点击搜索</div>';
            this.input.focus();

            try {
                const movies = await ApiClient.getItems(ApiClient.getCurrentUserId(), {
                    Recursive: true, IncludeItemTypes: 'Movie,Video', ParentId: this.collectionId
                });
                this.existingIds = new Set((movies.Items || []).map(m => m.Id));
            } catch (e) { /* ignore */ }
        }

        close() {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        async _search() {
            const raw = this.input.value.trim();
            if (!raw) return;

            this.searchBtn.disabled = true;
            this.searchBtn.textContent = '搜索中...';
            this.resultsContainer.innerHTML = '<div class="edp-add-modal-msg">搜索中...</div>';

            try {
                const searchTerm = addPrefix(raw);
                const result = await ApiClient.getItems(ApiClient.getCurrentUserId(), {
                    Recursive: true,
                    IncludeItemTypes: 'Movie',
                    SearchTerm: searchTerm,
                    Limit: 20,
                    Fields: 'PrimaryImageAspectRatio,ProductionYear',
                    EnableImageTypes: 'Primary',
                    ImageTypeLimit: 1,
                });

                if (!result.Items || result.Items.length === 0) {
                    this.resultsContainer.innerHTML = '<div class="edp-add-modal-msg">未找到匹配影片</div>';
                    return;
                }

                this.resultsContainer.innerHTML = '';
                result.Items.forEach(movie => {
                    const card = this._createCard(movie);
                    this.resultsContainer.appendChild(card);
                });
            } catch (err) {
                this.resultsContainer.innerHTML = '<div class="edp-add-modal-msg">搜索失败，请重试</div>';
            } finally {
                this.searchBtn.disabled = false;
                this.searchBtn.textContent = '搜索';
            }
        }

        _createCard(movie) {
            const card = document.createElement('div');
            card.className = 'edp-add-result-card';
            const isExisting = this.existingIds.has(movie.Id);
            if (isExisting) card.classList.add('edp-added');

            const imgUrl = movie.ImageTags?.Primary
                ? ApiClient.getScaledImageUrl(movie.Id, { type: 'Primary', maxWidth: 300, tag: movie.ImageTags.Primary })
                : '';

            card.innerHTML = `
                ${imgUrl ? `<img loading="lazy" src="${imgUrl}" alt="">` : ''}
                <div class="edp-add-card-info">
                    <div class="edp-add-card-title" title="${movie.Name}">${movie.Name}</div>
                    <div class="edp-add-card-year">${movie.ProductionYear || ''} ${isExisting ? '✓ 已在合集中' : ''}</div>
                </div>
            `;

            if (!isExisting) {
                card.addEventListener('click', () => this._addToCollection(movie, card));
            }
            return card;
        }

        async _addToCollection(movie, card) {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.6';

            try {
                await ApiClient.addToList(
                    ApiClient.getCurrentUserId(), 'BoxSet',
                    this.collectionId, [movie.Id], null
                );
                card.classList.add('edp-added');
                this.existingIds.add(movie.Id);
                const yearEl = card.querySelector('.edp-add-card-year');
                if (yearEl) yearEl.textContent = (movie.ProductionYear || '') + ' ✓ 已添加';
                showToast({ text: `已添加: ${movie.Name}`, icon: `<span class="material-symbols-outlined">check_circle</span>` });
            } catch (err) {
                card.style.pointerEvents = '';
                card.style.opacity = '';
                showToast({ text: '添加失败', icon: `<span class="material-symbols-outlined">error</span>` });
            }
        }

        destroy() {
            document.removeEventListener('keydown', this._escHandler);
            this.modal.remove();
        }
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

    function createVideoModal() {
        const modalHTML = `
             <span class="edp-close">&#10006;</span>
             <video class="edp-modal-content" id="modalVideo"></video>
             <iframe class="edp-modal-content" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" id="modalYT"></iframe>
             <div class="edp-modal-caption" id="modalVideoCaption">title</div>
        `;

        const modal = document.createElement('div');
        modal.id = 'myVideoModal';
        modal.classList.add('edp-modal');
        modal.innerHTML = modalHTML;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector(".edp-close");
        const modalVideo = modal.querySelector("#modalVideo");
        const modalYT = modal.querySelector("#modalYT");
        modalVideo.style.opacity = '0';
        modalYT.style.opacity = '0';

        function closeVideoModal() {
            modal.classList.add("edp-modal-closing");
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
                modal.classList.remove("edp-modal-closing");
                document.body.style.overflow = "auto";
            }, 200);
        }

        closeBtn.addEventListener('click', closeVideoModal);
        window.addEventListener('popstate', closeVideoModal);

        return modal;
    }

    function openVideoInModal(videoSrc, title) {
        // Detect YouTube URLs
        const isYouTube = videoSrc.includes("youtube.com");

        let modal = document.getElementById("myVideoModal");
        if (!modal) {
            modal = createVideoModal();
        }

        const modalVideo = modal.querySelector("#modalVideo");
        //const closeBtn = modal.querySelector(".edp-close");
        const modalYT = modal.querySelector("#modalYT");
        const modalCaption = modal.querySelector("#modalVideoCaption");

        modalCaption.textContent = title;

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
        modal.classList.remove("edp-modal-closing");
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


    function showToast(options) {
        //options can be added: text, icon, iconStrikeThrough, secondaryText
        Emby.importModule("./modules/toast/toast.js").then(function (toast) {
            return toast(options)
        })
    }

    function addResizeListener() {
        if (!isResizeListenerAdded) {
            window.addEventListener('resize', function () {
                if (viewnode && document.contains(viewnode)) adjustCardOffsets();
            });
            isResizeListenerAdded = true; // Set the flag to true after adding the listener
        }
    }

    async function actorMoreInject(isDirector = false, excludeIds = []) {
        const savedItemId = item.Id;
        if (item.Type === 'Person') return [];
        try {
            let name = getActorName(isDirector);

            if (name.length === 0) return [];

            isDirector ? (directorName = name) : (actorName = name);

            let moreItems = await getActorMovies(name, excludeIds);
            if (!isStillCurrentItem(savedItemId)) return [];

            const maxRetries = item.People?.length || 5;
            let attempts = 1;

            while (moreItems.length === 0 && !isDirector && attempts < maxRetries) {
                name = getActorName(isDirector);
                actorName = name; // update global actorName
                moreItems = await getActorMovies(name, excludeIds);
                if (!isStillCurrentItem(savedItemId)) return [];
                attempts++;
            }

            const aboutSection = qsVisible(".aboutSection");

            if (moreItems.length > 0 && aboutSection) {

                const sliderElement = createSlider({ text: name, html: actorMoreHtml(moreItems), isActor: !isDirector, layout: 'actor' });

                const sliderId = isDirector ? "myDirectorMoreSlider" : "myActorMoreSlider";
                sliderElement.id = sliderId;

                aboutSection.insertAdjacentElement('beforebegin', sliderElement);

                addResizeListener();

                adjustCardOffset(`#${sliderId}`, '.actorMoreItemsContainer', '.virtualScrollItem');

                addHoverEffect(sliderElement.querySelector(".itemsContainer"));

                if (!(isDirector && moreItems.length === 1)) {
                    const title = sliderElement.querySelector(".sectionTitleTextButton");
                    title.title = "刷新数据";
                    title.addEventListener('click', () => {
                        refreshActorMore(isDirector);
                    });
                }

                return moreItems.map(moreItem => moreItem.Id);

            }
            return [];
        } catch (error) {
            console.error(`[Emby] ${isDirector ? '导演' : '演员'}作品加载失败:`, error);
            return [];
        }
    }

    async function refreshActorMore(isDirector) {
        const savedItemId = item.Id;
        const sliderId = isDirector ? "myDirectorMoreSlider" : "myActorMoreSlider";

        const slider = qsVisible(`#${sliderId}`);

        if (!slider) return;

        let name = isDirector ? directorName : refreshActorName();
        let moreItems = await getActorMovies(name);
        if (!isStillCurrentItem(savedItemId)) return;


        const maxRetries = item.People?.length || 5; // Fallback to 5 if undefined
        let attempts = 1;

        while (moreItems.length === 0 && !isDirector && attempts < maxRetries) {
            name = refreshActorName();
            moreItems = await getActorMovies(name);
            if (!isStillCurrentItem(savedItemId)) return;
            attempts++;
        }

        if (moreItems.length === 0) {
            showToast({
                text: `${name} 更多作品加载失败`,
                icon: `<span class="material-symbols-outlined">search_off</span>`,
            });
            return;
        }

        if (!isDirector) {
            actorName = name;
            const title = slider.querySelector(".sectionTitle");
            title.textContent = `${name} 其他作品`;
        } 

        const itemsContainer = slider.querySelector(".actorMoreItemsContainer");
        itemsContainer.innerHTML = '';

        const html = actorMoreHtml(moreItems);
        itemsContainer.innerHTML = html;
        adjustCardOffset(`#${sliderId}`, '.actorMoreItemsContainer', '.virtualScrollItem');
        addHoverEffect(itemsContainer);
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

    function addHoverEffect(slider = qsVisible(".similarItemsContainer")) {

        if (OS_current === 'iphone' || !slider) return;

        const portraitCards = slider.children;
        if (portraitCards.length === 0) return;

        for (let card of portraitCards) {
            const imageContainer = card.querySelector('.cardImageContainer');

            if (imageContainer.classList.contains("edp-has-trailer")) continue;

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

            let remoteTrailers = getRemoteTrailer(card._dataItemIndex, slider._itemSource);

            if (localTrailerCount === 0
                && getItemType(card._dataItemIndex, slider._itemSource) != 'Trailer'
                && !remoteTrailers && Number(card.dataset.remotetrailerCount || 0) === 0) {
                continue;
            }

            
            const cardOverlay = OS_current === 'ipad'? null : card.querySelector('.cardOverlayContainer');
            imageContainer.classList.remove('edp-card-img');
            const img = imageContainer.querySelector('.cardImage');

            let isHovered = true;

            setTimeout(() => {
                isHovered = false;
            }, 1000);

            imageContainer.classList.add('edp-has-trailer');

            // Add mouseenter event to change image, width, and layering immediately
            card.addEventListener('mouseenter', () => {
                if (isHovered) return;
                isHovered = true;
            
                img.style.filter = 'blur(5px)';
            
                // Pre-create the video element but don't append it yet
                let videoElement;
            
                // Async fetch the trailer URL and insert the video when ready
                getTrailerUrl(itemId).then(trailerUrl => {
                    if (!isHovered || !trailerUrl) return; // Exit if hover already ended
            
                    videoElement = createVideoElement(trailerUrl);
                    const expandBtn = createExpandBtn();
                    (cardOverlay || imageContainer).appendChild(videoElement);
                    (cardOverlay || imageContainer).appendChild(expandBtn);
            
                    if (isHovered) {
                        videoElement.style.opacity = '1';
                        setTimeout(() => {
                            if (isHovered) {
                                expandBtn.style.opacity = '1';
                            }
                        }, 300);
                    }
                });
            });

            // Add mouseleave event to reset the image, width, and layering immediately
            card.addEventListener('mouseleave', () => {
                if (!isHovered) return;
                isHovered = false;
                img.style.filter = ''; // Remove blur effect
                // Remove both video and iframe elements
                const allPreviewElements = (cardOverlay || imageContainer).querySelectorAll('.edp-video');
                allPreviewElements.forEach(el => el.remove());
                (cardOverlay || imageContainer).querySelector('.jv-expand-btn')?.remove();
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

        const trailers = items[index]?.RemoteTrailers;
        return Array.isArray(trailers) && trailers.length > 0 ? trailers : null;
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
        if (!videourl || videourl === 'null') {
            const thisItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), itemId);
            if (thisItem.LocalTrailerCount > 0) {
                const localTrailers = await ApiClient.getLocalTrailers(ApiClient.getCurrentUserId(), itemId);
                const trailerItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localTrailers[0].Id);
                videourl = await getStreamUrl(trailerItem);
            } else if (thisItem.Type === 'Trailer') {
                videourl = await getStreamUrl(thisItem);
            } else if (thisItem.RemoteTrailers && thisItem.RemoteTrailers.length > 0) {
                videourl = thisItem.RemoteTrailers[0].Url;
            }
            if (videourl && videourl != 'null' && videourl != '') {
                try {
                    localStorage.setItem(cacheKey, videourl);
                } catch (e) {
                    console.warn("Failed to cache", e);
                }
            }        
        }

        return videourl;
    }

    async function getStreamUrl(thisItem = item) {

        let videourl = null;

        if (Object.keys(deviceProfile).length === 0) {
            deviceProfile = await getDeviceProfile(thisItem);
        }

        if (!deviceProfile || Object.keys(deviceProfile).length === 0) {
            deviceProfile = { "MaxStaticBitrate": 140000000, "MaxStreamingBitrate": 140000000, "MusicStreamingTranscodingBitrate": 192000, "DirectPlayProfiles": [{ "Container": "mp4,m4v", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "mkv", "Type": "Video", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "flv", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "aac,mp3" }, { "Container": "mov", "Type": "Video", "VideoCodec": "h264", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis" }, { "Container": "opus", "Type": "Audio" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3" }, { "Container": "mp2,mp3", "Type": "Audio", "AudioCodec": "mp2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac" }, { "Container": "m4a", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "mp4", "AudioCodec": "aac", "Type": "Audio" }, { "Container": "flac", "Type": "Audio" }, { "Container": "webma,webm", "Type": "Audio" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "PCM_S16LE,PCM_S24LE" }, { "Container": "ogg", "Type": "Audio" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis,opus", "VideoCodec": "av1,VP8,VP9" }], "TranscodingProfiles": [{ "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "opus", "Type": "Audio", "AudioCodec": "opus", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp3", "Type": "Audio", "AudioCodec": "mp3", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "aac", "Type": "Audio", "AudioCodec": "aac", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "wav", "Type": "Audio", "AudioCodec": "wav", "Context": "Static", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mkv", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264,h265,hevc,av1,vp8,vp9", "Context": "Static", "MaxAudioChannels": "2", "CopyTimestamps": true }, { "Container": "m4s,ts", "Type": "Video", "AudioCodec": "ac3,mp3,aac", "VideoCodec": "h264,h265,hevc", "Context": "Streaming", "Protocol": "hls", "MaxAudioChannels": "2", "MinSegments": "1", "BreakOnNonKeyFrames": true, "ManifestSubtitles": "vtt" }, { "Container": "webm", "Type": "Video", "AudioCodec": "vorbis", "VideoCodec": "vpx", "Context": "Streaming", "Protocol": "http", "MaxAudioChannels": "2" }, { "Container": "mp4", "Type": "Video", "AudioCodec": "ac3,eac3,mp3,aac,opus,flac,vorbis", "VideoCodec": "h264", "Context": "Static", "Protocol": "http" }], "ContainerProfiles": [], "CodecProfiles": [{ "Type": "VideoAudio", "Codec": "aac", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "VideoAudio", "Conditions": [{ "Condition": "Equals", "Property": "IsSecondaryAudio", "Value": "false", "IsRequired": "false" }] }, { "Type": "Video", "Codec": "h264", "Conditions": [{ "Condition": "EqualsAny", "Property": "VideoProfile", "Value": "high|main|baseline|constrained baseline|high 10", "IsRequired": false }, { "Condition": "LessThanEqual", "Property": "VideoLevel", "Value": "62", "IsRequired": false }] }, { "Type": "Video", "Codec": "hevc", "Conditions": [] }], "SubtitleProfiles": [{ "Format": "vtt", "Method": "Hls" }, { "Format": "eia_608", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "eia_708", "Method": "VideoSideData", "Protocol": "hls" }, { "Format": "vtt", "Method": "External" }, { "Format": "ass", "Method": "External" }, { "Format": "ssa", "Method": "External" }], "ResponseProfiles": [{ "Type": "Video", "Container": "m4v", "MimeType": "video/mp4" }] };
        }

        const streamUrls = await ApiClient.getPlaybackInfo(thisItem.Id, {}, deviceProfile);
        let streamUrl = streamUrls.MediaSources.find(ms => ms.Protocol === "File");
        if (!streamUrl) {
            streamUrl = streamUrls.MediaSources.find(ms => ms.Protocol === "Http");
        }

        if (!streamUrl) {
            console.warn("No valid MediaSource found.");
            return null;
        }
        if (streamUrl.Protocol === "File") {
            /*
            if (OS_current === 'windows') {
                videourl = await ApiClient.getItemDownloadUrl(trailerItem.Id, trailerItem.MediaSources[0].Id, trailerItem.serverId);
            } else {
                videourl = `${ApiClient.serverAddress()}/emby${trailerurl.DirectStreamUrl}`;
            }
            */

            videourl = `${ApiClient.serverAddress()}/emby${streamUrl.DirectStreamUrl}`;
            if (videourl.includes('.m3u8') && OS_current === 'windows') {
                //videourl = await ApiClient.getItemDownloadUrl(trailerItem.Id, trailerItem.MediaSources[0].Id, trailerItem.serverId);
                videourl = `${ApiClient._serverAddress}/emby/videos/${thisItem.Id}/original.${thisItem.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${thisItem.MediaSources[0].Id}&PlaySessionId=${streamUrls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;
            }
            //videourl = `${ApiClient._serverAddress}/emby/videos/${thisItem.Id}/original.${thisItem.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${thisItem.MediaSources[0].Id}&PlaySessionId=${streamUrls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;
            //videourl = `${ApiClient._serverAddress}/emby/videos/${trailerItem.Id}/original.${trailerItem.MediaSources[0].Container}?DeviceId=${ApiClient._deviceId}&MediaSourceId=${trailerItem.MediaSources[0].Id}&PlaySessionId=${trailerurls.PlaySessionId}&api_key=${ApiClient.accessToken()}`;
        } else if (streamUrl.Protocol === "Http") {
            videourl = streamUrl.Path;
        }
        return videourl;
    }


    async function getDeviceProfile(trailerItem) {
        const playbackManager = await Emby.importModule("./modules/common/playback/playbackmanager.js");
        const player = playbackManager.getPlayers().find(p => p.id === "htmlvideoplayer");
        //const playbackMediaSources = await playbackManager.getPlaybackMediaSources(item, {});
        return await player.getDeviceProfile(trailerItem);
    }

    function createVideoElement(trailerUrl) {
        // --- 1. Check if it's a YouTube URL ---
        const isYouTube =
            trailerUrl.includes('youtube.com') ||
            trailerUrl.includes('youtu.be');

        if (isYouTube) {
            // Extract YouTube video ID safely
            let videoId = null;

            if (trailerUrl.includes('watch')) {
                videoId = new URL(trailerUrl).searchParams.get('v');
            } else {
                const parts = trailerUrl.split('/');
                videoId = parts[parts.length - 1] || parts[parts.length - 2];
            }

            // --- 2. Create iframe for YouTube ---
            const iframe = document.createElement('iframe');
            iframe.classList.add('edp-video');
            iframe.style.pointerEvents = 'none';
            iframe.style.opacity = '0';

            iframe.src =
                `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;

            iframe.allow = "autoplay; encrypted-media";
            iframe.frameBorder = "0";

            return iframe;
        }

        // --- 3. Non-YouTube → create <video> element ---
        const videoElement = document.createElement('video');
        videoElement.src = trailerUrl;
        videoElement.controls = false;
        videoElement.autoplay = true;
        videoElement.muted = true;

        videoElement.classList.add('edp-video');
        videoElement.style.pointerEvents = 'none';
        videoElement.style.opacity = '0';

        return videoElement;
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
            const video = parent.querySelector('video') || parent.querySelector('iframe');
            if (!video) return;

            const title = grandParent.querySelector('.cardText-first span')?.title || grandParent.querySelector('.cardText-first button')?.title || '';
            openVideoInModal(video.src, title);

        };
        return expandBtn
    }

    function remoteTrailerInject() {
        if (!item.RemoteTrailers || item.RemoteTrailers.length === 0) return
        const detailImageContainer = qsVisible(".detailMainContainer .detailImageContainer");
        if (!detailImageContainer) return

        if (detailImageContainer.querySelector("#myRemoteTrailerBtn")) return

        let cardOverlay = detailImageContainer.querySelector(".cardOverlayContainer");

        if (!cardOverlay) {
            observerManager.waitForElement(
                'remoteTrailer',
                detailImageContainer,
                '.cardOverlayContainer',
                remoteTrailerInit,
                10000
            );
        } else {
            remoteTrailerInit(cardOverlay);
        }

        function remoteTrailerInit(card) {
            const btn = card.querySelector("button");
            if (!btn || btn.dataset.action === "none") return
            btn.dataset.action = "none";
            btn.style.display = 'none';
            const videoUrl = normalizeTrailerUrl(item.RemoteTrailers[0].Url);
            const btnNew = createPlayOverlayButton();
            btnNew.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();   // prevent Emby default play behavior

                openVideoInModal(videoUrl, item.Name);
            });
            detailImageContainer.appendChild(btnNew);
        }

        function createPlayOverlayButton() {
            const btn = document.createElement("button");

            btn.type = "button";

            btn.className =
                "fab cardOverlayButton-fab buttonItems-item " +
                "cardOverlayFab-primary button-hoveraccent md-icon " +
                "md-icon-fill autortl emby-button button-hoverable";

            btn.dataset.action = "none";
            btn.title = "播放预告片";
            btn.id = "myRemoteTrailerBtn"
            // Icon content (Emby uses special unicode)
            btn.textContent = ""; 

            return btn;
        }
    }
    function normalizeTrailerUrl(videoUrl) {

        if (!videoUrl) return null
        let url = videoUrl.trim();

        // --- 1. Handle DMM domain ---
        if (url.includes("https://cc3001.dmm.co.jp")) {
            return url;
        }

        // --- 2. Handle YouTube ---
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            let videoId = "";

            // Case A: youtu.be/VIDEOID
            const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
            if (shortMatch) {
                videoId = shortMatch[1];
            }

            // Case B: youtube.com/watch?v=VIDEOID
            const longMatch = url.match(/[?&]v=([^&]+)/);
            if (longMatch) {
                videoId = longMatch[1];
            }

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&modestbranding=1&playsinline=1`;
            }
        }

        // Otherwise return original
        return url;
    }

    async function javdbActorInject(isDirector = false) {
        const savedItemId = item.Id;
        const personName = isDirector ? directorName : actorName;
        if (isJP18() && fetchJavDbFlag && personName.length > 0) {
            const personTypeText = isDirector ? '导演' : '演员';
            try {
                let insertSection = qsVisible(".aboutSection");

                let isCensored = item.Genres.includes("无码") ? false : true;

                // search actor name from javdb
                let [javDbMovies, actorUrl] = await fetchDbActor(personName, isCensored, isDirector);
                if (!isStillCurrentItem(savedItemId)) return;
                if (javDbMovies && javDbMovies.length > 0) {
                    javDbMovies = await filterDbMovies(javDbMovies);
                    if (!isStillCurrentItem(savedItemId)) return;
                    if (javDbMovies.length === 0) return

                    javDbMovies.sort(() => Math.random() - 0.5);

                    let imgHtml2 = dbActorMoreHtml(javDbMovies);

                    const directorText = isDirector ? ' (导演)' : '';

                    const sliderElement2 = createSlider({ text: `${personName}${directorText} 更多作品`, html: imgHtml2, linkUrl: actorUrl, layout: item.Type === 'BoxSet' ? 'boxset' : 'normal', count: javDbMovies.length });
                    const sectionId = isDirector ? 'myDbDirectorSlider' : 'myDbActorSlider'
                    sliderElement2.id = sectionId;
                    // javdb section 添加悬浮背景
                    sliderElement2.classList.add('edp-slider-bg');
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
                    text: `${personTypeText}更多作品=>未找到`,
                    icon: `<span class="material-symbols-outlined">search_off</span>`,
                    secondaryText: personName
                });
            } catch (error) {
                console.error(`[JavDB] ${personTypeText}作品加载失败:`, error);
                throw error; // re-throw so javdbButtonInit catch can handle it
            }
        }

    }

    async function filterDbMovies(javDbMovies) {
        const results = await Promise.all(
            javDbMovies.map(movie => checkEmbyExist(movie.Code).then(exists => exists ? null : movie))
        );
        return results.filter(Boolean);
    }

    function adjustCardOffset(sectionStr, containerStr, cardStr) {
        const scrollerContainer = qsVisible(`${sectionStr} ${containerStr}`);
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
        const rating = item.CustomRating ?? item.OfficialRating;
        return rating === 'JP-18+' || rating === 'NC-17';
    }

    async function seriesInject() {
        const savedItemId = item.Id;
        if (!fetchJavDbFlag || (item.Type != 'BoxSet' && !isJP18())) return;
        try {
        let seriesName, tagMovies, tagMovieIds, series;
        if (item.Type != 'BoxSet') {
            if (!isJP18()) return;
            const seriesAll = item.TagItems.filter(tag => tag.Name.startsWith("系列:"));
            if (seriesAll.length === 0) return;
            series = seriesAll[0];
            seriesName = getPartAfter(series.Name, ":").trim();
            [tagMovies, tagMovieIds] = await getTagMovies(series.Name);
            if (!isStillCurrentItem(savedItemId)) return;
        }
        else {
            seriesName = item.Name;
            tagMovies = await getCollectionMovies(item.Id);
            if (!isStillCurrentItem(savedItemId)) return;
        }

        let seriesName_jp = translateJP(seriesName, 'cn', 'jp');

        await waitForRandomTime();
        let [javDbMovies, seriesUrl, javdbSeries] = await fetchDbSeries(seriesName_jp.replace("%", ""));
        if (!isStillCurrentItem(savedItemId)) return;
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
        if (javDbMovies.length === 0) return

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
                if (collectionId.length === 0) {
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
        if (javDbMovies.length === 0) {
            showToast({
                text: `javdb系列已全部下载`,
                icon: `<span class="material-symbols-outlined">download_done</span>`
            });
            return
        }

        item.Type !== 'BoxSet' && javDbMovies.sort(() => Math.random() - 0.5);
        const PAGE_SIZE = 35;
        const displayMovies = [];
        let currentPage = 0;
        const isBoxSet = item.Type === 'BoxSet';
        const buildSeriesPageHtml = (movies) => movies.map((m, i) => createItemContainerLarge(m, i)).join('');
        const getPageCount = () => Math.ceil(displayMovies.length / PAGE_SIZE);
        const getPage = (idx) => displayMovies.slice(idx * PAGE_SIZE, (idx + 1) * PAGE_SIZE);

        const handleLocalItem = async (localItem) => {
            if (!isBoxSet) {
                const fullItem = await ApiClient.getItem(ApiClient.getCurrentUserId(), localItem.Id);
                fullItem.TagItems.push(series);
                ApiClient.updateItem(fullItem);
            } else {
                await ApiClient.addToList(ApiClient.getCurrentUserId(), 'BoxSet', item.Id, [localItem.Id], null);
                showToast({
                    text: "新作品加入合集",
                    icon: `<span class="material-symbols-outlined">docs_add_on</span>`,
                    secondaryText: localItem.Name
                });
            }
        };

        // Phase 1: scan until first page fills or all items exhausted
        let scanIndex = 0;
        for (; scanIndex < javDbMovies.length; scanIndex++) {
            const insertItem = await checkEmbyExist(javDbMovies[scanIndex].Code);
            if (insertItem) {
                await handleLocalItem(insertItem);
                continue;
            }
            displayMovies.push(javDbMovies[scanIndex]);
            if (displayMovies.length >= PAGE_SIZE && scanIndex < javDbMovies.length - 1) {
                scanIndex++;
                break;
            }
        }
        if (!isStillCurrentItem(savedItemId)) return;

        if (displayMovies.length === 0) {
            showToast({
                text: `javdb系列已全部下载`,
                icon: `<span class="material-symbols-outlined">download_done</span>`
            });
            return;
        }

        const hasMore = scanIndex < javDbMovies.length;
        const firstPageHtml = buildSeriesPageHtml(getPage(0));
        const sliderElement2 = createSlider({ text: `系列: ${seriesName} 更多作品`, html: firstPageHtml, linkUrl: seriesUrl, layout: isBoxSet ? 'boxset' : 'normal', count: displayMovies.length });
        sliderElement2.id = 'myDbSeriesSlider';
        sliderElement2.classList.add('edp-slider-bg');

        let insertSection = qsVisible(".aboutSection");
        insertSection.insertAdjacentElement('beforebegin', sliderElement2);

        const seriesItemsContainer = sliderElement2.querySelector('.itemsContainer');
        if (seriesItemsContainer) seriesItemsContainer.id = 'myitemsContainer-series';

        const badge = sliderElement2.querySelector('.edp-count-badge');
        if (hasMore && badge) {
            badge.innerHTML = `来自JavDB，已加载<b>${displayMovies.length}</b>部 <span class="btn-spinner" style="width:12px;height:12px;border-width:1.5px"></span>`;
        }

        const updatePaginationUI = () => {
            const totalPages = getPageCount();
            const input = sliderElement2.querySelector('#pageInput-series');
            const pageNumSpan = sliderElement2.querySelector('#pageNumber-series');
            if (input) input.max = totalPages;
            if (pageNumSpan) {
                const textNode = pageNumSpan.lastChild;
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = `/${totalPages}页`;
                }
            }
            const prev = sliderElement2.querySelector('#prevPage-series');
            const next = sliderElement2.querySelector('#nextPage-series');
            if (prev) prev.classList.toggle('edp-btn-disabled', currentPage <= 0);
            if (next) next.classList.toggle('edp-btn-disabled', currentPage >= totalPages - 1);
        };

        const changePage = async (newPage) => {
            const totalPages = getPageCount();
            if (newPage < 0 || newPage >= totalPages) return;
            currentPage = newPage;
            const container = sliderElement2.querySelector('#myitemsContainer-series');
            container.classList.add('edp-fading');
            await new Promise(r => setTimeout(r, 300));
            container.innerHTML = buildSeriesPageHtml(getPage(currentPage));
            void container.offsetHeight;
            container.classList.remove('edp-fading');
            const input = sliderElement2.querySelector('#pageInput-series');
            if (input) input.value = currentPage + 1;
            updatePaginationUI();
        };

        if (getPageCount() > 1 || hasMore) {
            const totalPages = getPageCount();
            const paginationHtml = `
                <h3 class="flex sectionTitle aline-items-center itemsViewSettingsContainer">
                    <span id="prevPage-series" class="pageButton edp-btn-disabled">上一页</span>
                    <span id="pageNumber-series" class="pageNumber" style="padding: 0 20px;">
                        第<input id="pageInput-series" type="number" min="1" max="${totalPages}" value="1">/${totalPages}页
                    </span>
                    <span id="nextPage-series" class="pageButton">下一页</span>
                </h3>`;

            sliderElement2.insertAdjacentHTML('beforeend', paginationHtml);

            sliderElement2.querySelector('#prevPage-series').addEventListener('click', () => {
                if (currentPage > 0) changePage(currentPage - 1);
            });
            sliderElement2.querySelector('#nextPage-series').addEventListener('click', () => {
                if (currentPage < getPageCount() - 1) changePage(currentPage + 1);
            });
            sliderElement2.querySelector('#pageInput-series').addEventListener('change', (e) => {
                let val = parseInt(e.target.value, 10);
                const tp = getPageCount();
                if (val < 1) val = 1;
                if (val > tp) val = tp;
                changePage(val - 1);
            });
            updatePaginationUI();
        }

        showToast({
            text: "系列更多作品=>加载成功",
            icon: `<span class="material-symbols-outlined">check_circle</span>`,
            secondaryText: `系列: ${seriesName}`
        });

        if (!isBoxSet) {
            adjustCardOffset('#myDbSeriesSlider', '.itemsContainer', '.backdropCard');
            addResizeListener();
        }

        // Phase 2: continue scanning remaining items in background
        if (hasMore) {
            (async () => {
                try {
                    let prevPageCount = getPageCount();
                    for (; scanIndex < javDbMovies.length; scanIndex++) {
                        if (!isStillCurrentItem(savedItemId)) return;
                        const insertItem = await checkEmbyExist(javDbMovies[scanIndex].Code);
                        if (insertItem) {
                            await handleLocalItem(insertItem);
                            continue;
                        }
                        displayMovies.push(javDbMovies[scanIndex]);
                        const newPageCount = getPageCount();
                        if (newPageCount > prevPageCount) {
                            prevPageCount = newPageCount;
                            updatePaginationUI();
                            if (badge) badge.innerHTML = `来自JavDB，已加载<b>${displayMovies.length}</b>部 <span class="btn-spinner" style="width:12px;height:12px;border-width:1.5px"></span>`;
                        }
                    }
                    if (!isStillCurrentItem(savedItemId)) return;
                    updatePaginationUI();
                    if (badge) badge.innerHTML = `来自JavDB，共<b>${displayMovies.length}</b>部`;
                } catch (error) {
                    console.error('[JavDB] 系列后台扫描失败:', error);
                    if (badge) badge.innerHTML = `来自JavDB，共<b>${displayMovies.length}</b>部`;
                }
            })();
        }
        } catch (error) {
            console.error('[JavDB] 系列加载失败:', error);
            throw error;
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
        const h2Element = qsVisible(`${isDirector ? "#myDirectorMoreSlider" : "#myActorMoreSlider"} .sectionTitle-cards`);

        if (h2Element) return getPartBefore(h2Element.textContent, " ");

        const personType = isDirector ? 'Director' : 'Actor';
        const actorNames = item.People?.filter(person => person.Type === personType).map(person => person.Name) || [];

        return actorNames.length ? pickRandomLink(actorNames) : '';
    }

    function refreshActorName() {
        const actorNames = item.People?.filter(person => person.Type === 'Actor').map(person => person.Name) || [];
        return actorNames.length > 1 ? pickRandomLink(actorNames.filter(name => name !== actorName)) : actorName;
    }

    async function getActorMovies(name = actorName, excludeIds = []) {
        const actorMoreMovies = await ApiClient.getItems(
            ApiClient.getCurrentUserId(),
            {
                Recursive: true,
                IncludeItemTypes: 'Movie, Trailer, Series',
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

    // ===== JavDB 短评系统 =====

    class JavdbClient {
        static CREDENTIALS_KEY = 'javdb_credentials';
        static CACHE_KEY = 'javdb_cache';
        static CACHE_MAX_SIZE = 500 * 1024;
        static CACHE_MAX_ITEMS = 50;
        static CACHE_EXPIRY_HOURS = 24;
        static API_HOST = 'https://jdforrepam.com';
        static DEFAULT_HEADERS = { 'User-Agent': 'Dart/3.5 (dart:io)', 'Accept-Language': 'zh-TW' };

        constructor() {
            this.token = localStorage.getItem('javdb_token') || null;
            this.tokenExpiry = localStorage.getItem('javdb_token_expiry') || null;
            this.cache = this._loadCache();
            this.reviewsModal = null;
            this.credentialsModal = null;
        }

        // ---- Cache (private) ----

        _loadCache() {
            try {
                const cacheStr = localStorage.getItem(JavdbClient.CACHE_KEY);
                if (!cacheStr) return { movies: {}, reviews: {} };
                const cache = JSON.parse(cacheStr);
                this._cleanExpired(cache);
                return cache;
            } catch (error) {
                console.error('[JavDB] 加载缓存失败:', error);
                return { movies: {}, reviews: {} };
            }
        }

        _saveCache() {
            try {
                this._ensureCacheSize();
                localStorage.setItem(JavdbClient.CACHE_KEY, JSON.stringify(this.cache));
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    this._clearOldest(10);
                    try { localStorage.setItem(JavdbClient.CACHE_KEY, JSON.stringify(this.cache)); } catch (e) {}
                }
            }
        }

        _cleanExpired(cache) {
            const now = Date.now();
            const expiryMs = JavdbClient.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
            for (const type of ['movies', 'reviews']) {
                if (cache[type]) {
                    for (const key of Object.keys(cache[type])) {
                        if (now - cache[type][key].timestamp > expiryMs) delete cache[type][key];
                    }
                }
            }
        }

        _ensureCacheSize() {
            const cacheStr = JSON.stringify(this.cache);
            if (cacheStr.length > JavdbClient.CACHE_MAX_SIZE) this._clearOldest(10);
            const movieCount = Object.keys(this.cache.movies || {}).length;
            const reviewCount = Object.keys(this.cache.reviews || {}).length;
            if (movieCount + reviewCount > JavdbClient.CACHE_MAX_ITEMS) this._clearOldest(10);
        }

        _clearOldest(count) {
            const items = [];
            for (const type of ['movies', 'reviews']) {
                if (this.cache[type]) {
                    for (const [key, value] of Object.entries(this.cache[type])) {
                        items.push({ type, key, timestamp: value.timestamp });
                    }
                }
            }
            items.sort((a, b) => a.timestamp - b.timestamp);
            items.slice(0, count).forEach(item => delete this.cache[item.type][item.key]);
        }

        _cacheMovie(code, movieInfo) {
            if (!this.cache.movies) this.cache.movies = {};
            this.cache.movies[code.toUpperCase()] = { data: movieInfo, timestamp: Date.now() };
            this._saveCache();
        }

        _getCachedMovie(code) {
            if (!this.cache.movies) return null;
            const cached = this.cache.movies[code.toUpperCase()];
            if (!cached) return null;
            const expiryMs = JavdbClient.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
            if (Date.now() - cached.timestamp > expiryMs) {
                delete this.cache.movies[code.toUpperCase()];
                return null;
            }
            return cached.data;
        }

        _cacheReviews(movieId, page, sortBy, reviewsData) {
            if (!this.cache.reviews) this.cache.reviews = {};
            const cacheKey = `${movieId}_${page}_${sortBy}`;
            this.cache.reviews[cacheKey] = { data: reviewsData, timestamp: Date.now() };
            this._saveCache();
        }

        _getCachedReviews(movieId, page, sortBy) {
            if (!this.cache.reviews) return null;
            const cacheKey = `${movieId}_${page}_${sortBy}`;
            const cached = this.cache.reviews[cacheKey];
            if (!cached) return null;
            const expiryMs = JavdbClient.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
            if (Date.now() - cached.timestamp > expiryMs) {
                delete this.cache.reviews[cacheKey];
                return null;
            }
            return cached.data;
        }

        // ---- Auth ----

        _encrypt(username, password) {
            const data = JSON.stringify({ u: username, p: password, t: Date.now() });
            const shifted = data.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) + (i % 7) + 3)).join('');
            return btoa(encodeURIComponent(shifted));
        }

        _decrypt(encrypted) {
            try {
                const shifted = decodeURIComponent(atob(encrypted));
                const data = shifted.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) - (i % 7) - 3)).join('');
                const parsed = JSON.parse(data);
                return { username: parsed.u, password: parsed.p };
            } catch (error) {
                return null;
            }
        }

        saveCredentials(username, password) {
            localStorage.setItem(JavdbClient.CREDENTIALS_KEY, this._encrypt(username, password));
        }

        _getCredentials() {
            const encrypted = localStorage.getItem(JavdbClient.CREDENTIALS_KEY);
            if (!encrypted) return null;
            return this._decrypt(encrypted);
        }

        clearCredentials() {
            localStorage.removeItem(JavdbClient.CREDENTIALS_KEY);
            localStorage.removeItem('javdb_token');
            localStorage.removeItem('javdb_token_expiry');
            this.token = null;
            this.tokenExpiry = null;
        }

        hasCredentials() {
            return !!localStorage.getItem(JavdbClient.CREDENTIALS_KEY);
        }

        hasSecretKey() {
            return !!(javdbSecretKey || (window.cachedConfig && window.cachedConfig.javdbSecretKey));
        }

        static _md5(string) {
            function md5cycle(x, k) {
                var a = x[0], b = x[1], c = x[2], d = x[3];
                a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
                c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
                a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
                c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
                a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
                c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
                a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
                c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
                a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
                c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
                a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
                c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
                a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
                c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
                a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
                c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
                a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
                c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
                a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
                c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
                a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
                c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
                a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
                c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
                a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
                c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
                a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
                c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
                a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
                c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
                a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
                c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
                x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
            }
            function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
            function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
            function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
            function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
            function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
            function md5blk(s) {
                var md5blks = [], i;
                for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
                return md5blks;
            }
            function md51(s) {
                var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;
                for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
                s = s.substring(i - 64); length = s.length; tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                for (i = 0; i < length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
                tail[i >> 2] |= 0x80 << ((i % 4) << 3);
                if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
                tmp = n * 8; tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
                lo = parseInt(tmp[2], 16); hi = parseInt(tmp[1], 16) || 0;
                tail[14] = lo; tail[15] = hi; md5cycle(state, tail); return state;
            }
            function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
            function hex(x) {
                var hex_chr = '0123456789abcdef'.split('');
                for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
                return x.join('');
            }
            function rhex(n) {
                var hex_chr = '0123456789abcdef'.split(''), s = '', j;
                for (j = 0; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
                return s;
            }
            return hex(md51(string));
        }

        _generateSignature() {
            const timestamp = Math.floor(Date.now() / 1000);
            const secretKey = javdbSecretKey || (window.cachedConfig && window.cachedConfig.javdbSecretKey) || '';
            return `${timestamp}.lpw6vgqzsp.${JavdbClient._md5(timestamp + secretKey)}`;
        }

        async _loginWithCredentials(username, password) {
            try {
                const url = `${JavdbClient.API_HOST}/api/v1/sessions`;
                const params = new URLSearchParams({
                    username, password, device_uuid: '04b9534d-5118-53de-9f87-2ddded77111e',
                    device_name: 'Chrome', device_model: 'Browser', platform: 'web',
                    system_version: '1.0', app_version: 'official', app_version_number: '1.9.29', app_channel: 'official'
                });
                const response = await fetch(`${url}?${params.toString()}`, {
                    method: 'POST',
                    headers: { ...JavdbClient.DEFAULT_HEADERS, 'jdSignature': this._generateSignature() }
                });
                if (!response.ok) return null;
                const data = await response.json();
                if (data.data && data.data.token) {
                    this.token = data.data.token;
                    const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
                    this.tokenExpiry = expiry.toISOString();
                    localStorage.setItem('javdb_token', this.token);
                    localStorage.setItem('javdb_token_expiry', this.tokenExpiry);
                    return this.token;
                }
                return null;
            } catch (error) {
                console.error('[JavDB] 登录失败:', error);
                return null;
            }
        }

        async login() {
            if (this.token && this.tokenExpiry) {
                const expiry = new Date(this.tokenExpiry);
                if (expiry > new Date()) return this.token;
            }
            const credentials = this._getCredentials();
            if (!credentials) return null;
            return await this._loginWithCredentials(credentials.username, credentials.password);
        }

        // ---- API (public) ----

        async searchMovie(code) {
            const cached = this._getCachedMovie(code);
            if (cached) return cached;
            try {
                const url = `${JavdbClient.API_HOST}/api/v2/search`;
                const params = new URLSearchParams({
                    q: code, page: 1, type: 'movie', limit: 1, movie_type: 'all',
                    from_recent: 'false', movie_filter_by: 'all', movie_sort_by: 'relevance'
                });
                const response = await fetch(`${url}?${params.toString()}`, {
                    method: 'GET',
                    headers: { ...JavdbClient.DEFAULT_HEADERS, 'Host': 'jdforrepam.com', 'jdSignature': this._generateSignature() }
                });
                if (!response.ok) throw new Error(`搜索失败: ${response.status}`);
                const data = await response.json();
                if (data.data && data.data.movies && data.data.movies.length > 0) {
                    const movie = data.data.movies[0];
                    const movieInfo = { movieId: movie.id, number: movie.number, title: movie.title, score: movie.score, reviewsCount: movie.watched_count };
                    this._cacheMovie(code, movieInfo);
                    return movieInfo;
                }
                return null;
            } catch (error) {
                console.error('[JavDB] 搜索失败:', error);
                return null;
            }
        }

        async getMovieDetail(movieId) {
            try {
                const url = `${JavdbClient.API_HOST}/api/v4/movies/${movieId}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { ...JavdbClient.DEFAULT_HEADERS, 'Host': 'jdforrepam.com', 'jdSignature': this._generateSignature() }
                });
                if (!response.ok) throw new Error(`获取详情失败: ${response.status}`);
                const data = await response.json();
                if (data.data && data.data.movie) {
                    const movie = data.data.movie;
                    return { movieId: movie.id, number: movie.number, title: movie.origin_title || movie.title, score: movie.score, reviewsCount: movie.watched_count, commentsCount: movie.comments_count };
                }
                return null;
            } catch (error) {
                console.error('[JavDB] 获取详情失败:', error);
                return null;
            }
        }

        async getReviews(movieId, page = 1, sortBy = 'hotly') {
            const cached = this._getCachedReviews(movieId, page, sortBy);
            if (cached) return cached;
            try {
                const url = `${JavdbClient.API_HOST}/api/v1/movies/${movieId}/reviews`;
                const params = new URLSearchParams({ page, sort_by: sortBy, limit: 20 });
                const headers = { ...JavdbClient.DEFAULT_HEADERS, 'Host': 'jdforrepam.com', 'jdSignature': this._generateSignature() };
                if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
                const response = await fetch(`${url}?${params.toString()}`, { method: 'GET', headers });
                if (!response.ok) throw new Error(`获取短评失败: ${response.status}`);
                const data = await response.json();
                if (data.data) this._cacheReviews(movieId, page, sortBy, data.data);
                return data.data;
            } catch (error) {
                console.error('[JavDB] 获取短评失败:', error);
                return null;
            }
        }

        // ---- UI ----

        static _formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                const diff = Date.now() - date;
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                if (minutes < 1) return '刚刚';
                if (minutes < 60) return `${minutes}分钟前`;
                if (hours < 24) return `${hours}小时前`;
                if (days < 30) return `${days}天前`;
                return date.toLocaleDateString('zh-CN');
            } catch { return dateStr; }
        }

        static _escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        _renderReviews(reviews) {
            if (!reviews || reviews.length === 0) return '<div class="jv-reviews-empty">暂无短评</div>';
            return reviews.map(review => {
                const user = review.user || {};
                const username = user.username || user.name || review.user_name || '匿名用户';
                const avatar = user.avatar_url || review.user_avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjNjY2Ij48cGF0aCBkPSJNMTIgMTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0wIDJjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+PC9zdmc+';
                const score = review.score ? `${review.score}分` : '';
                const content = review.content || '';
                const likes = review.likes_count || 0;
                const createdAt = JavdbClient._formatDate(review.created_at);
                const tags = [];
                if (user.is_vip || review.is_vip) tags.push('<span class="jv-review-tag vip">VIP</span>');
                if (user.is_contributor || review.is_contributor) tags.push('<span class="jv-review-tag contributor">贡献者</span>');
                return `<div class="jv-review-item">
                <div class="jv-review-header">
                    <img class="jv-review-avatar" src="${avatar}" alt="${JavdbClient._escapeHtml(username)}"/>
                    <div class="jv-review-user-info">
                        <div class="jv-review-username">${JavdbClient._escapeHtml(username)}${tags.join('')}</div>
                        <div class="jv-review-meta">${score ? `<span class="jv-review-score">${score}</span>` : ''}<span class="jv-review-date">${createdAt}</span></div>
                    </div>
                </div>
                <div class="jv-review-content">${JavdbClient._escapeHtml(content)}</div>
                <div class="jv-review-footer"><span class="jv-review-likes"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>${likes}</span></div>
            </div>`;
            }).join('');
        }

        showCredentialsModal(onSuccess) {
            if (this.credentialsModal) this.credentialsModal.remove();
            const hasExisting = this.hasCredentials();
            const modal = document.createElement('div');
            modal.className = 'jv-reviews-modal';
            modal.innerHTML = `
            <div class="jv-reviews-backdrop"></div>
            <div class="jv-credentials-content">
                <div class="jv-credentials-header">
                    <h3 class="jv-credentials-title">JavDB 账号登录</h3>
                    <button class="jv-reviews-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
                <div class="jv-credentials-body">
                    <p class="jv-credentials-desc">请输入你的 JavDB 账号和密码以获取短评功能。<br><small>凭据将加密存储在本地浏览器中。</small></p>
                    <div class="jv-credentials-form">
                        <div class="jv-form-group"><label>用户名/邮箱</label><input type="text" id="jv-username" placeholder="请输入用户名或邮箱"></div>
                        <div class="jv-form-group"><label>密码</label><input type="password" id="jv-password" placeholder="请输入密码"></div>
                    </div>
                    <div class="jv-credentials-error" style="display:none;"></div>
                </div>
                <div class="jv-credentials-footer">
                    ${hasExisting ? '<button class="jv-btn jv-btn-danger jv-clear-btn">清除已保存的账号</button>' : ''}
                    <div class="jv-credentials-actions"><button class="jv-btn jv-btn-secondary jv-cancel-btn">取消</button><button class="jv-btn jv-btn-primary jv-login-btn">登录并保存</button></div>
                </div>
            </div>`;
            document.body.appendChild(modal);
            this.credentialsModal = modal;
            const closeBtn = modal.querySelector('.jv-reviews-close');
            const backdrop = modal.querySelector('.jv-reviews-backdrop');
            const cancelBtn = modal.querySelector('.jv-cancel-btn');
            const loginBtn = modal.querySelector('.jv-login-btn');
            const clearBtn = modal.querySelector('.jv-clear-btn');
            const usernameInput = modal.querySelector('#jv-username');
            const passwordInput = modal.querySelector('#jv-password');
            const errorDiv = modal.querySelector('.jv-credentials-error');
            const closeModal = () => { modal.classList.add('closing'); setTimeout(() => { modal.remove(); this.credentialsModal = null; }, 200); };
            const showError = (msg) => { errorDiv.textContent = msg; errorDiv.style.display = 'block'; };
            closeBtn.onclick = closeModal; backdrop.onclick = closeModal; cancelBtn.onclick = closeModal;
            if (clearBtn) clearBtn.onclick = () => { if (confirm('确定要清除已保存的 JavDB 账号吗？')) { this.clearCredentials(); showToast({ text: '账号已清除' }); closeModal(); } };
            loginBtn.onclick = async () => {
                const username = usernameInput.value.trim();
                const password = passwordInput.value;
                if (!username || !password) { showError('请输入用户名和密码'); return; }
                loginBtn.textContent = '验证中...'; loginBtn.disabled = true; errorDiv.style.display = 'none';
                try {
                    const token = await this._loginWithCredentials(username, password);
                    if (token) { this.saveCredentials(username, password); showToast({ text: '登录成功' }); closeModal(); if (onSuccess) onSuccess(); }
                    else { showError('登录失败，请检查用户名和密码'); }
                } catch (error) { showError('登录失败: ' + (error.message || '网络错误')); }
                finally { loginBtn.textContent = '登录并保存'; loginBtn.disabled = false; }
            };
            passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });
            document.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } });
            requestAnimationFrame(() => { modal.classList.add('visible'); usernameInput.focus(); });
        }

        showReviewsModal(movieInfo, reviewsData) {
            if (this.reviewsModal) this.reviewsModal.remove();
            const sortedReviews = [...reviewsData.reviews].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
            const reviewLimit = 20;
            // 判断是否有更多页：本页返回满 reviewLimit 条则认为有下一页
            const hasMore = reviewsData.reviews.length >= reviewLimit;
            const totalReviews = reviewsData.pagination?.total || movieInfo.commentsCount || movieInfo.reviewsCount || reviewsData.reviews.length;
            const modal = document.createElement('div');
            modal.className = 'jv-reviews-modal';
            modal.innerHTML = `
            <div class="jv-reviews-backdrop"></div>
            <div class="jv-reviews-content">
                <div class="jv-reviews-header">
                    <div class="jv-reviews-title-wrapper"><h3 class="jv-reviews-title">JavDB 短评</h3><span class="jv-reviews-subtitle">${movieInfo.number} · 评分 ${movieInfo.score || '暂无'} · ${totalReviews} 条短评</span></div>
                    <button class="jv-reviews-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
                <div class="jv-reviews-sort-hint"><span>按点赞数排序</span></div>
                <div class="jv-reviews-list">${this._renderReviews(sortedReviews)}</div>
                <div class="jv-reviews-pagination">
                    <span class="jv-reviews-page-info">第 1 页</span>
                    <div class="jv-reviews-page-btns" ${hasMore ? '' : 'style="display:none"'}>
                        <button class="jv-page-btn jv-prev-page" disabled>上一页</button>
                        <button class="jv-page-btn jv-next-page">下一页</button>
                    </div>
                </div>
            </div>`;
            document.body.appendChild(modal);
            this.reviewsModal = modal;
            let currentPage = 1;
            const closeBtn = modal.querySelector('.jv-reviews-close');
            const backdrop = modal.querySelector('.jv-reviews-backdrop');
            const prevBtn = modal.querySelector('.jv-prev-page');
            const nextBtn = modal.querySelector('.jv-next-page');
            const pageBtns = modal.querySelector('.jv-reviews-page-btns');
            const pageInfo = modal.querySelector('.jv-reviews-page-info');
            const reviewsList = modal.querySelector('.jv-reviews-list');
            const closeModal = () => { modal.classList.add('closing'); setTimeout(() => { modal.remove(); this.reviewsModal = null; }, 200); };
            closeBtn.onclick = closeModal; backdrop.onclick = closeModal;
            document.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } });
            const loadPage = async (page) => {
                if (page < 1) return;
                currentPage = page;
                reviewsList.innerHTML = '<div class="jv-reviews-loading">加载中...</div>';
                const newData = await this.getReviews(movieInfo.movieId, currentPage, 'hotly');
                if (newData && newData.reviews) {
                    const sorted = [...newData.reviews].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
                    reviewsList.innerHTML = this._renderReviews(sorted);
                    pageInfo.textContent = `第 ${currentPage} 页`;
                    prevBtn.disabled = currentPage <= 1;
                    // 返回不足 reviewLimit 条说明是最后一页
                    nextBtn.disabled = newData.reviews.length < reviewLimit;
                    if (pageBtns) pageBtns.style.display = '';
                    reviewsList.scrollTop = 0;
                }
            };
            prevBtn.onclick = () => loadPage(currentPage - 1);
            nextBtn.onclick = () => loadPage(currentPage + 1);
            requestAnimationFrame(() => modal.classList.add('visible'));
        }

    }

    javdbClient = new JavdbClient();

    // ===== JavDB 短评系统结束 =====

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
        } else if (u.match(/Vision/i) || u.match(/visionOS/i)) {
            return 'visionOS'
        } else {
            return 'other'
        }
    }


    const request = (url, method = "GET", options = {}) => {
        method = method ? method.toUpperCase().trim() : "GET";
        if (!url || !["GET", "HEAD", "POST"].includes(method)) return;

        const { responseType, headers = {} } = options;

        return fetch(url, { method, headers }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return responseType === "json" ? response.json() : response.text();
        });
    };

    function javdbNameMap(name) {
        if (!name) return "";
        const localName = nameMap[name] || getPartBefore(name, "（");
        return localName.replace(/・/g, "･");
    }

    async function fetchDbActor(javdbActorName, isCensored, isDirector = false, savedItemId = item.Id) {
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
                /*
                if (actorUrl) {
                    //localStorage.setItem(urlCacheKey, actorUrl); // Cache actor URL
                    try {
                        localStorage.setItem(urlCacheKey, actorUrl);
                    } catch (e) {
                        console.warn("Failed to cache", e);
                    }
                }
                */
            }
        }

        if (!actorUrl) return [[], ''];

        // Wait for random time
        await waitForRandomTime();
        let javdbActorData = await request(actorUrl);
        if (!isStillCurrentItem(savedItemId)) return [[], ''];
        if (javdbActorData.length > 0) {
            const itemsContainer = qsVisible(".detailTextContainer .mediaInfoItems:not(.hide)");
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
        item.Overview = lines.join('<br>');
        return true;
    }

    function injectLinks() {
        if (!isJP18() || !fetchJavDbFlag || item.Type === 'Person') return;

        const aboutSection = qsVisible(".aboutSection");
        const linksSection = aboutSection.querySelector(".linksSection");
        if (!linksSection) return
        const itemLinks = linksSection.querySelector('.itemLinks');
        const existingKeys = Array.from(itemLinks.children).map(a =>
            a.textContent.trim().toLowerCase()
        );
        const links = extractLinks(item.Overview || '', '===== 外部链接 =====');
        if (Object.keys(links).length === 0) return
        const linkKeys = Object.keys(links);
        aboutSection.classList.remove('hide');
        linksSection.classList.remove('hide');
        linkKeys.forEach(function (key, index) {
            var value = links[key];
            const keyLower = key.toLowerCase();

            // Check if key is 'TheMovieDb' and if itemLinks already contains 'MovieDb'
            if (existingKeys.some(existing => existing.includes(keyLower) || keyLower.includes(existing))) {
                return; // Skip inserting 'TheMovieDb'
            }

            // Create the anchor element
            var linkButton = document.createElement("a");
            linkButton.setAttribute("is", "emby-linkbutton");
            linkButton.setAttribute("class", "button-link button-link-color-inherit button-link-fontweight-inherit nobackdropfilter emby-button");
            linkButton.setAttribute("href", value);
            linkButton.setAttribute("target", "_blank");
            //linkButton.style.color = 'yellow'; 
            if (index === 0 && (itemLinks.children.length === 0)) {
                linkButton.textContent = key;
            } else {
                linkButton.textContent = key + ',';
            }

            // Insert the anchor element at the beginning of itemLinks
            itemLinks.insertAdjacentElement('afterbegin', linkButton);
        });

        function extractLinks(text, startLine) {
            if (!text || text.length === 0 || !text.includes('===== 外部链接 =====')) {
                return {};
            }

            // Split the text into lines
            var lines = text.trim().split('<br>');
            lines = lines.filter(line => (line.includes(':') || line.includes(startLine)));

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

    async function fetchDbSeries(seriesName, savedItemId = item.Id) {
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
        /*
        if (item.Type !== 'BoxSet') {
            try {
                localStorage.setItem(`seriesUrl_${seriesName}`, seriesUrl);
            } catch (e) {
                console.warn("Failed to cache", e);
            }
        }
        */

        javdbData = await request(seriesUrl);
        if (javdbData.length === 0) return [movies, seriesUrl, javdbSeries];
        if (!isStillCurrentItem(savedItemId)) return [movies, seriesUrl, javdbSeries];


        const itemsContainer = qsVisible(".detailTextContainer .mediaInfoItems:not(.hide)");
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
        if ((OS_current === 'iphone') || openaiApiKey.length === 0 || item.Type === 'Person') return;

        // Select the element using document.querySelector
        const titleElement = qsVisible(".itemName-primary");
        const mainDetailButtons = qsVisible(".mainDetailButtons");

        // Check if the element is found
        if (titleElement) {
            if (containsJapanese(item.Name)) {
                const buttonhtml = createButtonHtml('myTranslate', '翻译标题', `<span class="material-symbols-outlined">language</span>`, '翻译标题');

                mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml);
                const myTranslate = qsVisible("#myTranslate");
                myTranslate.onclick = translateJapaneseToChinese;
            }
        } else {
            console.log('titleElement not found');
        }

        const divElement = qsVisible(".overview-text.readOnlyContent");

        if (divElement && item.Type != 'BoxSet') {
            if (containsJapanese(item.Overview)) {
                const buttonhtml2 = createButtonHtml('myTranslate2', '翻译详情', `<span class="material-symbols-outlined">language</span>`, '翻译详情');
                mainDetailButtons.insertAdjacentHTML('beforeend', buttonhtml2);
                const myTranslate2 = qsVisible("#myTranslate2");
                myTranslate2.onclick = translateJapaneseToChinese2;
            }
        }
    }


    async function translateOnlyWithOpenAI(text) {
        if (!openaiApiKey || openaiApiKey.length === 0) {
            return text;
        }

        const prompt = `你是一位专业的日本成人影片翻译专员，非常擅长将日本AV的日文标题或简介翻译成中文AV圈最色情、最地道的表达，熟悉各个AV演员的中文名字及AV专有名词的翻译方法。翻译及处理要求如下：
                1. 翻译原则：先理解语境，再优化表达并完成翻译。不能机械的直译，不能篡改寓意，不能大范围删改译后内容。确保语法流畅、符合中文阅读习惯，不故意隐去敏感词，翻译风格自然流畅，避免机械翻译或日式断句。英文部分（例如“SEX”）可保留。
                2. 输出要求：不进行解释或说明，回答必须有且仅有翻译后的中文文本本身。
                3. 目标受众：中文AV网站用户
                4. 风格：露骨、下流、直接，允许意译和增强色情张力
                5. 演员名也要翻译，包括昵称也翻译成中文昵称。
                请翻译以下内容：
            ${text}`;

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                temperature: 0.2,
                input: prompt
            })
        });

        const data = await response.json();

        try {
            return data.output[0].content[0].text;
        } catch (e) {
            throw new Error("OpenAI translation failed");
        }
    }


    async function translateJapaneseToChinese() {
        const savedItemId = item.Id;
        const titleElement = qsVisible(".itemName-primary");
        if (!titleElement) return
        // Get the text content of the element
        let text = item.Name;
        const isBoxSet = item.Type === 'BoxSet';
        const [code, titleText = ""] = isBoxSet ? ["", text] : text.split(/ (.+)/);

        const translatedText = await translateOnlyWithOpenAI(titleText);
        if (!isStillCurrentItem(savedItemId)) return;
        if (translatedText.length > 0) {
            titleElement.textContent = translatedText; // Replace titleElement text with translated text
            item.Name = isBoxSet ? translatedText : `${code} ${translatedText}`.trim();
            (item.Type != 'BoxSet') && ApiClient.updateItem(item);
            showToast({
                text: 'OpenAI翻译成功',
                icon: `<span class="material-symbols-outlined">fact_check</span>`
            });

            const myTranslate = qsVisible("#myTranslate");
            myTranslate.style.color = 'green';
            myTranslate.classList.add('melt-away');
            setTimeout(() => {
                myTranslate.style.display = 'none';
                javdbTitle();
            }, 1000);

        }
    }

    async function translateJapaneseToChinese2() {
        const savedItemId = item.Id;
        const divElement = qsVisible(".overview-text.readOnlyContent");

        if (!divElement) return
        let text = item.Overview;

        const translatedText = await translateOnlyWithOpenAI(text);
        if (!isStillCurrentItem(savedItemId)) return;

        if (translatedText.length > 0) {
            divElement.textContent = translatedText; // Replace titleElement text with translated text
            item.Overview = translatedText;
            ApiClient.updateItem(item);
            showToast({
                text: 'OpenAI翻译成功',
                icon: `<span class="material-symbols-outlined">fact_check</span>`
            });
            const myTranslate = qsVisible("#myTranslate2");
            myTranslate.style.color = 'green';
            myTranslate.classList.add('melt-away');
            setTimeout(() => {
                myTranslate.style.display = 'none';
                javdbTitle();
            }, 1000);
        }
    }

    function translateJP(text, lan1, lan2) {
        if (typeof OpenCC !== 'undefined' && typeof OpenCC.Converter === 'function') {
            const converter = OpenCC.Converter({ from: lan1, to: lan2 });
            return converter(text);
        } else {
            return text;
        }
    }

    function translatePath(linuxPath) {
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
