/*!
 * youtube.ga.js | v0.3
 * Copyright (c) 2012 - 2013 Sander Heilbron (http://sanderheilbron.nl)
 * Edits by Ali Karbassi (http://karbassi.com)
 * MIT licensed
 */

// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "//youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var YT_GA = YT_GA || {};

function onYouTubePlayerAPIReady() {
    if (Object.prototype.toString.call(configYouTubePlayer) === '[object Array]') {
        YT_GA = []
        for (var i in configYouTubePlayer){
            YT_GA.push(new youtube_ga(configYouTubePlayer[i]));
        }
    }

    if (Object.prototype.toString.call(configYouTubePlayer) === '[object Object]') {
        YT_GA = new youtube_ga(configYouTubePlayer);
    }    
}

var youtube_ga = function _construct(configYouTubePlayer){
    this.configYouTubePlayer = configYouTubePlayer;

    var playerOptions = {
        height: configYouTubePlayer.height,
        width: configYouTubePlayer.width,
        videoId: configYouTubePlayer.videoID,
        playerVars: {},
        events: {
            'onReady': this.bind(this.onPlayerReady),
            'onStateChange': this.bind(this.onPlayerStateChange),
            'onPlaybackQualityChange': this.bind(this.onPlayerPlaybackQualityChange)
        }
    };

    for (var setting in configYouTubePlayer.playerVars) {
        if (!configYouTubePlayer.playerVars.hasOwnProperty(setting)) {
            continue;
        }

        playerOptions.playerVars[setting] = configYouTubePlayer.playerVars[setting];
    }

    this.player = new YT.Player(configYouTubePlayer.element || 'ytplayer', playerOptions);
}

youtube_ga.prototype.bind = function(f) {
    var self = this;
    return function(){
        f.apply(self, arguments);
    }
};

youtube_ga.prototype.onPlayerReady = function onPlayerReady(event) {
    // Check video status every 500ms
    setInterval(this.bind(this.onPlayerProgressChange), 500);

    this.progress25 = false;
    this.progress50 = false;
    this.progress75 = false;
    this.url = this.player.getVideoUrl();
    this.videoPlayed = false;
    this.videoCompleted = false;
}

youtube_ga.prototype.onPlayerProgressChange = function onPlayerProgressChange() {

    if (!this.configYouTubePlayer.trackProgress || typeof _gaq === 'undefined') {
        return;
    }

     // Calculate percent complete
    this.timePercentComplete = Math.round(this.player.getCurrentTime() / this.player.getDuration() * 100);

    var progress;

    if (this.timePercentComplete > 24 && !this.progress25) {
        progress = '25%';
        this.progress25 = true;
    }

    if (this.timePercentComplete > 49 && !this.progress50) {
        progress = '50%';
        this.progress50 = true;
    }

    if (this.timePercentComplete > 74 && !this.progress75) {
        progress = '75%';
        this.progress75 = true;
    }

    if (progress) {
        _gaq.push(['_trackEvent', 'YouTube', 'Played video: ' + progress, this.url, undefined, true]);
    }
}

youtube_ga.prototype.onPlayerPlaybackQualityChange = function onPlayerPlaybackQualityChange(event) {
    if (!this.configYouTubePlayer.trackPlaybackQuality || typeof _gaq === 'undefined') {
        return;
    }

    var quality;

    switch (event.data) {
        case 'hd1080':
            quality = '1080p HD';
            break;
        case 'hd720':
            quality = '720p HD';
            break;
        case 'large':
            quality = '480p';
            break;
        case 'medium':
            quality = '360p';
            break;
        case 'small':
            quality = '240p';
            break;
    }

    if (quality) {
        _gaq.push(['_trackEvent', 'YouTube', 'Video quality: ' + quality, this.url, undefined, true]);
    }
}

youtube_ga.prototype.onPlayerStateChange = function onPlayerStateChange(event) {
    if (typeof _gaq === 'undefined') {
        return;
    }
    
    // Calculate percent complete
    this.timePercentComplete = Math.round(this.player.getCurrentTime() / this.player.getDuration() * 100);

    if (event.data === YT.PlayerState.PLAYING && !this.videoPlayed) {

        _gaq.push(['_trackEvent', 'YouTube', 'Started video', YT_GA.url, undefined, true]);
        this.videoPaused = false;
        this.videoPlayed = true; //  Avoid subsequent play trackings

    } else if (event.data === YT.PlayerState.PAUSED && (this.timePercentComplete < 92 && !this.videoPaused)) {

        _gaq.push(['_trackEvent', 'YouTube', 'Paused video', this.url, undefined, true]);
        this.videoPaused = true; // Avoid subsequent pause trackings

    } else if (event.data === YT.PlayerState.ENDED && !this.videoCompleted) {

        _gaq.push(['_trackEvent', 'YouTube', 'Completed video', this.url, undefined, true]);
        this.videoCompleted = true; // Avoid subsequent finish trackings

        if (typeof this.configYouTubePlayer.videoEnd === 'function') { this.configYouTubePlayer.videoEnd()};
    }
}