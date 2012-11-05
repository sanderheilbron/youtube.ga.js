/*!
 * youtube.ga.js | v0.1
 * Copyright (c) 2012 Sander Heilbron (http://sanderheilbron.nl)
 * MIT licensed
 */

// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "//youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Replace the 'ytplayer' element with an <iframe> and
// YouTube player after the API code downloads.
var player;

function onYouTubePlayerAPIReady() {
    // Replace the 'ytplayer' element with an <iframe> and
    // YouTube player after the API code downloads.
    var playerOptions = {
        height: configYouTubePlayer.height,
        width: configYouTubePlayer.width,
        videoId: configYouTubePlayer.videoID,
        playerVars: {},
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onPlaybackQualityChange': onPlayerPlaybackQualityChange
        }
    };

    for (var setting in configYouTubePlayer.playerVars) {
        if (!configYouTubePlayer.playerVars.hasOwnProperty(setting)) {
            continue;
        }

        playerOptions.playerVars[setting] = configYouTubePlayer.playerVars[setting];
    }

    player = new YT.Player('ytplayer', playerOptions);
}

function onPlayerReady(event) {
    // Check video status every 500ms
    setInterval(onPlayerProgressChange, 500);

    progress25 = false;
    progress50 = false;
    progress75 = false;
    url = player.getVideoUrl();
    videoPlayed = false;
    videoCompleted = false;
}

function onPlayerProgressChange() {
    if (!configYouTubePlayer.trackProgress || !_gaq) {
        return;
    }

     // Calculate percent complete
    timePercentComplete = Math.round(player.getCurrentTime() / player.getDuration() * 100);

    var progress;

    if (timePercentComplete > 24 && !progress25) {
        progress = '25%';
        progress25 = true;
    }

    if (timePercentComplete > 49 && !progress50) {
        progress = '50%';
        progress50 = true;
    }

    if (timePercentComplete > 74 && !progress75) {
        progress = '75%';
        progress75 = true;
    }

    if (progress) {
        _gaq.push(['_trackEvent', 'YouTube', 'Played video: ' + progress, url, undefined, true]);
    }
}

function onPlayerPlaybackQualityChange(event) {
    if (!configYouTubePlayer.trackPlaybackQuality || !_gaq) {
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
        _gaq.push(['_trackEvent', 'YouTube', 'Video quality: ' + quality, url, undefined, true]);
    }
}

function onPlayerStateChange(event) {
    if (!_gaq) {
        return;
    }

    if (event.data === YT.PlayerState.PLAYING && !videoPlayed) {

        _gaq.push(['_trackEvent', 'YouTube', 'Started video', url, undefined, true]);
        videoPaused = false;
        videoPlayed = true; //  Avoid subsequent play trackings

    } else if (event.data === YT.PlayerState.PAUSED && (timePercentComplete < 92 && !videoPaused)) {

        _gaq.push(['_trackEvent', 'YouTube', 'Paused video', url, undefined, true]);
        videoPaused = true; // Avoid subsequent pause trackings

    } else if (event.data === YT.PlayerState.ENDED && !videoCompleted) {

        _gaq.push(['_trackEvent', 'YouTube', 'Completed video', url, undefined, true]);
        videoCompleted = true; // Avoid subsequent finish trackings

    }

}
