import SpotifyWebApi from 'spotify-web-api-node';
import axios from 'axios';

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });

    this.tokenExpirationTime = null;
    this.initializeToken();
  }

  /**
   * Initialize and refresh Spotify access token
   */
  async initializeToken() {
    try {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.warn('⚠️  Spotify API credentials not configured');
        return;
      }

      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);
      this.tokenExpirationTime = Date.now() + data.body.expires_in * 1000;

      console.log('✅ Spotify API token initialized');

      // Refresh token before expiration
      setTimeout(() => this.initializeToken(), (data.body.expires_in - 60) * 1000);
    } catch (error) {
      console.error('❌ Spotify token initialization failed:', error.message);
    }
  }

  /**
   * Ensure token is valid
   */
  async ensureValidToken() {
    if (!this.tokenExpirationTime || Date.now() >= this.tokenExpirationTime - 60000) {
      await this.initializeToken();
    }
  }

  /**
   * Search tracks on Spotify
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} - Array of tracks
   */
  async searchTracks(query, limit = 20) {
    try {
      await this.ensureValidToken();

      const data = await this.spotifyApi.searchTracks(query, { limit });
      
      return data.body.tracks.items.map(track => ({
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        coverImage: track.album.images[0]?.url || null,
        duration: this.formatDuration(track.duration_ms),
        durationInSeconds: Math.floor(track.duration_ms / 1000),
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify,
        popularity: track.popularity,
        explicit: track.explicit,
        audioUrl: track.preview_url // 30-second preview
      }));
    } catch (error) {
      console.error('Spotify search error:', error);
      throw new Error('Failed to search Spotify tracks');
    }
  }

  /**
   * Get track by Spotify ID
   * @param {string} trackId - Spotify track ID
   * @returns {Promise<object>} - Track details
   */
  async getTrack(trackId) {
    try {
      await this.ensureValidToken();

      const data = await this.spotifyApi.getTrack(trackId);
      const track = data.body;

      return {
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        coverImage: track.album.images[0]?.url || null,
        duration: this.formatDuration(track.duration_ms),
        durationInSeconds: Math.floor(track.duration_ms / 1000),
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify,
        popularity: track.popularity,
        explicit: track.explicit,
        audioUrl: track.preview_url
      };
    } catch (error) {
      console.error('Spotify get track error:', error);
      throw new Error('Failed to get Spotify track');
    }
  }

  /**
   * Get multiple tracks by IDs
   * @param {Array<string>} trackIds - Array of Spotify track IDs
   * @returns {Promise<Array>} - Array of tracks
   */
  async getTracks(trackIds) {
    try {
      await this.ensureValidToken();

      const data = await this.spotifyApi.getTracks(trackIds);
      
      return data.body.tracks.map(track => ({
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        coverImage: track.album.images[0]?.url || null,
        duration: this.formatDuration(track.duration_ms),
        durationInSeconds: Math.floor(track.duration_ms / 1000),
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify,
        popularity: track.popularity,
        explicit: track.explicit,
        audioUrl: track.preview_url
      }));
    } catch (error) {
      console.error('Spotify get tracks error:', error);
      throw new Error('Failed to get Spotify tracks');
    }
  }

  /**
   * Get new releases
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} - Array of albums
   */
  async getNewReleases(limit = 20) {
    try {
      await this.ensureValidToken();

      const data = await this.spotifyApi.getNewReleases({ limit, country: 'US' });
      
      return data.body.albums.items.map(album => ({
        id: album.id,
        name: album.name,
        artist: album.artists.map(a => a.name).join(', '),
        coverImage: album.images[0]?.url || null,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        externalUrl: album.external_urls.spotify
      }));
    } catch (error) {
      console.error('Spotify new releases error:', error);
      throw new Error('Failed to get new releases');
    }
  }

  /**
   * Get featured playlists
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} - Array of playlists
   */
  async getFeaturedPlaylists(limit = 20) {
    try {
      await this.ensureValidToken();

      const data = await this.spotifyApi.getFeaturedPlaylists({ limit, country: 'US' });
      
      return data.body.playlists.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverImage: playlist.images[0]?.url || null,
        totalTracks: playlist.tracks.total,
        owner: playlist.owner.display_name,
        externalUrl: playlist.external_urls.spotify
      }));
    } catch (error) {
      console.error('Spotify featured playlists error:', error);
      throw new Error('Failed to get featured playlists');
    }
  }

  /**
   * Get recommendations based on seed tracks
   * @param {Array<string>} seedTracks - Array of track IDs
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} - Array of recommended tracks
   */
  async getRecommendations(seedTracks, limit = 20) {
    try {
      await this.ensureValidToken();

      const data = await this.spotifyApi.getRecommendations({
        seed_tracks: seedTracks.slice(0, 5), // Max 5 seeds
        limit
      });
      
      return data.body.tracks.map(track => ({
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        coverImage: track.album.images[0]?.url || null,
        duration: this.formatDuration(track.duration_ms),
        durationInSeconds: Math.floor(track.duration_ms / 1000),
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify,
        audioUrl: track.preview_url
      }));
    } catch (error) {
      console.error('Spotify recommendations error:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  /**
   * Format duration from milliseconds to MM:SS
   * @param {number} ms - Duration in milliseconds
   * @returns {string} - Formatted duration
   */
  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export default new SpotifyService();
