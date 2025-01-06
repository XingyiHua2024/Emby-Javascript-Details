// put common variables here

const adminUserId = "";
// put your own Emby UserId to enable javdb content

const googleApiKey = '';
// put your own googleApiKey for translate movie title and movie details

const nameMap = {
};

const OS_current = (() => {
    const u = navigator.userAgent;
    return !!u.match(/compatible/i) || u.match(/Windows/i) ? 'windows' :
        !!u.match(/Macintosh/i) || u.match(/MacIntel/i) ? 'macOS' :
            !!u.match(/iphone/i) ? 'iphone' :
                !!u.match(/Ipad/i) ? 'ipad' :
                    u.match(/android/i) ? 'android' :
                        u.match(/Ubuntu/i) ? 'Ubuntu' : 'other';
})();
