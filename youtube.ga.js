/*!
 * youtube.ga.js | v0.3
 * Copyright (c) 2012 Sander Heilbron (http://sanderheilbron.nl)
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

    // Messages for GA
    YT_GA.messages = {
        progress25: 'Video 25%',
        progress50: 'Video 50%',
        progress75: 'Video 75%',
        started: 'Video Start',
        paused: 'Video Paused',
        completed: 'Video Completed',
        quality1080: 'Video Quality: 1080p HD',
        quality720: 'Video Quality: 720p HD',
        quality480: 'Video Quality: 480p',
        quality360: 'Video Quality: 360p',
        quality240: 'Video Quality: 240p'
    };

    for (var message in YT_GA.messages) {
        if (!YT_GA.messages.hasOwnProperty(message) || configYouTubePlayer.messages[message] === undefined) {
            continue;
        }

        YT_GA.messages[message] = configYouTubePlayer.messages[message];
    }

    // Create YouTube player
    YT_GA.player = new YT.Player('ytplayer', playerOptions);
}

function onPlayerReady(event) {
    // Check video status every 500ms
    setInterval(onPlayerProgressChange, 500);

    YT_GA.progress25 = false;
    YT_GA.progress50 = false;
    YT_GA.progress75 = false;
    YT_GA.videoPlayed = false;
    YT_GA.videoCompleted = false;

    // Set Event Tracking Parameters

    // The general event category (e.g. "Videos").
    YT_GA.category = configYouTubePlayer.category !== undefined ? configYouTubePlayer.category : 'YouTube';

    // An optional descriptor for the event.
    YT_GA.opt_label = configYouTubePlayer.opt_label !== undefined ? configYouTubePlayer.opt_label : YT_GA.player.getVideoUrl();

    // An optional value associated with the event. You can see your event values in the Overview, Categories,
    // and Actions reports, where they are listed by event or aggregated across events, depending upon your report view.
    YT_GA.opt_value = configYouTubePlayer.opt_value !== undefined ? configYouTubePlayer.opt_value : undefined;

    // Default value is false. By default, the event hit sent by _trackEvent() will impact a visitor's bounce rate.
    // By setting this parameter to true, this event hit will not be used in bounce rate calculations.
    YT_GA.opt_noninteraction = configYouTubePlayer.opt_noninteraction !== undefined ? configYouTubePlayer.opt_noninteraction : true;

}

function onPlayerProgressChange() {
    if (!configYouTubePlayer.trackProgress || !_gaq) {
        return;
    }

     // Calculate percent complete
    YT_GA.timePercentComplete = Math.round(YT_GA.player.getCurrentTime() / YT_GA.player.getDuration() * 100);

    var action;

    if (YT_GA.timePercentComplete > 24 && !YT_GA.progress25) {
        action = YT_GA.messages.progress25;
        YT_GA.progress25 = true;
    }

    if (YT_GA.timePercentComplete > 49 && !YT_GA.progress50) {
        action = YT_GA.messages.progress50;
        YT_GA.progress50 = true;
    }

    if (YT_GA.timePercentComplete > 74 && !YT_GA.progress75) {
        action = YT_GA.messages.progress75;
        YT_GA.progress75 = true;
    }

    if (action) {
        _gaq.push(['_trackEvent', YT_GA.category, action, YT_GA.opt_label, YT_GA.opt_value, YT_GA.opt_noninteraction]);
    }
}

function onPlayerPlaybackQualityChange(event) {
    if (!configYouTubePlayer.trackPlaybackQuality || !_gaq) {
        return;
    }

    var action;

    switch (event.data) {
        case 'hd1080':
            action = YT_GA.messages.quality1080;
            break;
        case 'hd720':
            action = YT_GA.messages.quality720;
            break;
        case 'large':
            action = YT_GA.messages.quality480;
            break;
        case 'medium':
            action = YT_GA.messages.quality360;
            break;
        case 'small':
            action = YT_GA.messages.quality240;
            break;
    }

    if (action) {
        _gaq.push(['_trackEvent', YT_GA.category, action, YT_GA.opt_label, YT_GA.opt_value, YT_GA.opt_noninteraction]);
    }
}

function onPlayerStateChange(event) {
    if (!_gaq) {
        return;
    }

    var action;
    if (event.data === YT.PlayerState.PLAYING && !YT_GA.videoPlayed) {

        action = YT_GA.messages.started;
        YT_GA.videoPaused = false;
        YT_GA.videoPlayed = true; //  Avoid subsequent play trackings

    } else if (event.data === YT.PlayerState.PAUSED && (YT_GA.timePercentComplete < 92 && !YT_GA.videoPaused)) {

        action = YT_GA.messages.paused;
        YT_GA.videoPaused = true; // Avoid subsequent pause trackings

    } else if (event.data === YT.PlayerState.ENDED && !YT_GA.videoCompleted) {

        action = YT_GA.messages.completed;
        YT_GA.videoCompleted = true; // Avoid subsequent finish trackings

    }

    if (action) {
        _gaq.push(['_trackEvent', YT_GA.category, action, YT_GA.opt_label, YT_GA.opt_value, YT_GA.opt_noninteraction]);
    }
}
