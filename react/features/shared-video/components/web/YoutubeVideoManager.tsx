/* eslint-disable no-invalid-this */
import React from 'react';
import { connect } from 'react-redux';
import YouTube from 'react-youtube';

import { PLAYBACK_STATUSES } from '../../constants';

import AbstractVideoManager, {
    IProps,
    _mapDispatchToProps,
    _mapStateToProps
} from './AbstractVideoManager';

import './youtube-player.css';

/**
 * Manager of shared video.
 *
 * @returns {void}
 */
class YoutubeVideoManager extends AbstractVideoManager {
    isPlayerAPILoaded: boolean;
    player?: any;

    /**
     * Initializes a new YoutubeVideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props: IProps) {
        super(props);

        this.isPlayerAPILoaded = false;
    }

    /**
     * Indicates the playback state of the video.
     *
     * @returns {string}
     */
    override getPlaybackStatus() {
        let status;

        if (!this.player) {
            return;
        }

        const playerState = this.player.getPlayerState();

        if (playerState === YouTube.PlayerState.PLAYING) {
            status = PLAYBACK_STATUSES.PLAYING;
        }

        if (playerState === YouTube.PlayerState.PAUSED) {
            status = PLAYBACK_STATUSES.PAUSED;
        }

        return status;
    }

    /**
     * Indicates whether the video is muted.
     *
     * @returns {boolean}
     */
    override isMuted() {
        return this.player?.isMuted();
    }

    /**
     * Retrieves current volume.
     *
     * @returns {number}
     */
    override getVolume() {
        return this.player?.getVolume();
    }

    /**
     * Retrieves current time.
     *
     * @returns {number}
     */
    override getTime() {
        return this.player?.getCurrentTime();
    }

    /**
     * Seeks video to provided time.
     *
     * @param {number} time - The time to seek to.
     *
     * @returns {void}
     */
    override seek(time: number) {
        return this.player?.seekTo(time);
    }

    /**
     * Plays video.
     *
     * @returns {void}
     */
    override play() {
        return this.player?.playVideo();
    }

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    override pause() {
        return this.player?.pauseVideo();
    }

    /**
     * Mutes video.
     *
     * @returns {void}
     */
    override mute() {
        return this.player?.mute();
    }

    /**
     * Unmutes video.
     *
     * @returns {void}
     */
    override unMute() {
        return this.player?.unMute();
    }

    /**
     * Disposes of the current video player.
     *
     * @returns {void}
     */
    override dispose() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
    }

    /**
     * Fired on play state toggle.
     *
     * @param {Object} event - The yt player stateChange event.
     *
     * @returns {void}
     */
    onPlayerStateChange = (event: any) => {
        if (event.data === YouTube.PlayerState.PLAYING) {
            this.onPlay();
        } else if (event.data === YouTube.PlayerState.PAUSED) {
            this.onPause();
        }
    };

    /**
     * Fired when youtube player is ready.
     *
     * @param {Object} event - The youtube player event.
     *
     * @returns {void}
     */
    onPlayerReady = (event: any) => {
        const { _isOwner } = this.props;

        this.player = event.target;

        this.player.addEventListener('onVolumeChange', () => {
            this.onVolumeChange();
        });

        if (_isOwner) {
            this.player.addEventListener('onVideoProgress', this.throttledFireUpdateSharedVideoEvent);
        }

        this.play();

        // sometimes youtube can get muted state from previous videos played in the browser
        // and as we are disabling controls we want to unmute it
        if (this.isMuted()) {
            this.unMute();
        }
    };

    getPlayerOptions = () => {
        const { _isOwner, videoId } = this.props;
        const showControls = _isOwner ? 1 : 0;

        const options = {
            id: 'sharedVideoPlayer',
            opts: {
                height: '100%',
                width: '100%',
                playerVars: {
                    'origin': location.origin,
                    'fs': '0',
                    'autoplay': 0,
                    'controls': showControls,
                    'rel': 0,
                    'modestbranding': 1, // Hide YouTube logo
                    'disablekb': 1 // Disable keyboard controls to prevent issues in PiP mode
                }
            },
            onError: (e: any) => this.onError(e),
            onReady: this.onPlayerReady,
            onStateChange: this.onPlayerStateChange,
            videoId
        };

        return options;
    };

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    override render() {
        return (
            <div className="youtube-player-container">
                <YouTube
                    className="youtube-player"
                    { ...this.getPlayerOptions() } />
            </div>
        );
    }
}

export default connect(_mapStateToProps, _mapDispatchToProps)(YoutubeVideoManager);
