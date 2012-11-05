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
    setInterval(onPlayerProgressChange, 500); // Check video status every 500ms
    progress25 = progress50 = progress75 = false;
    url = player.getVideoUrl();
    videoPlayed = false;
    videoCompleted = false;
}

function onPlayerProgressChange() {
    trackProgress = configYouTubePlayer.trackProgress;
    duration = player.getDuration(); // Returns the duration in seconds of the currently playing video.
    currentTime = player.getCurrentTime(); // Returns the elapsed time in seconds since the video started playing.
    timePercentComplete = currentTime / duration * 100; // Calculate percent complete
    timePercentComplete = Math.round(timePercentComplete); // Round to a whole number

    if (trackProgress) {
        var progressTracked;

        if (timePercentComplete > 24 && !progress25) {
            progress = 'Played video: 25%';
            progress25 = true;
            progressTracked = true;
        }

        if (timePercentComplete > 49 && !progress50) {
            progress = 'Played video: 50%';
            progress50 = true;
            progressTracked = true;
        }

        if (timePercentComplete > 74 && !progress75) {
            progress = 'Played video: 75%';
            progress75 = true;
            progressTracked = true;
        }

        if (progressTracked) {
            _gaq.push(['_trackEvent', 'YouTube', progress, url, undefined, true]);
        }
    }
}

function onPlayerPlaybackQualityChange(event) {
    trackPlaybackQuality = configYouTubePlayer.trackPlaybackQuality;

    if (trackPlaybackQuality) {
        var qualityTracked;

        switch (event.data) {
        case 'hd1080':
            quality = 'Video quality: 1080p HD';
            qualityTracked = true;
            break;
        case 'hd720':
            quality = 'Video quality: 720p HD';
            qualityTracked = true;
            break;
        case 'large':
            quality = 'Video quality: 480p';
            qualityTracked = true;
            break;
        case 'medium':
            quality = 'Video quality: 360p';
            qualityTracked = true;
            break;
        case 'small':
            quality = 'Video quality: 240p';
            qualityTracked = true;
            break;
        }

        if (qualityTracked) {
            _gaq.push(['_trackEvent', 'YouTube', quality, url, undefined, true]);
        }
    }
}

function onPlayerStateChange(event) {
    switch (event.data) {
    case YT.PlayerState.PLAYING:
        if (!videoPlayed) {
            _gaq.push(['_trackEvent', 'YouTube', 'Started video', url, undefined, true]);
            videoPaused = false;
            videoPlayed = true; //  Avoid subsequent play trackings
        }
        break;

    case YT.PlayerState.PAUSED:
        if (timePercentComplete < 92 && !videoPaused) {
            _gaq.push(['_trackEvent', 'YouTube', 'Paused video', url, undefined, true]);
            videoPaused = true; // Avoid subsequent pause trackings
        }
        break;

    case YT.PlayerState.ENDED:
        if (!videoCompleted) {
            _gaq.push(['_trackEvent', 'YouTube', 'Completed video', url, undefined, true]);
            videoCompleted = true; // Avoid subsequent finish trackings
        }
        break;
    }
}
