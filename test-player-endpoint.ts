import axios from 'axios';

async function testEndpoint() {
    try {
        const response = await axios.get('http://localhost:3000/api/spotify/player');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Error calling endpoint:', error.message);
    }
}

testEndpoint();
