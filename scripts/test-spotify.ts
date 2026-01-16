import { spotifyIntegrationService } from '../src/features/spotify-integration';

async function test() {
    console.log('Testing Spotify Service Configuration...');
    
    try {
        console.log('Attempting to get Access Token...');
        const token = await spotifyIntegrationService.getAccessToken();
        console.log('✅ Access Token retrieved:', token.substring(0, 20) + '...');

        console.log('Fetching Player State...');
        const state = await spotifyIntegrationService.getPlayerState();
        if (state) {
            console.log('✅ Player State:', state.item ? state.item.name : 'Unknown');
            console.log('   Is Playing:', state.is_playing);
        } else {
            console.log('ℹ️ No music playing or empty state.');
        }

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   API Response:', error.response.data);
        }
    }
}

test();
