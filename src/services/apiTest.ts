// API Test Service to debug JSearch API connection
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string | undefined;
const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';
const RAPIDAPI_HOST = JSEARCH_API_HOST;

export const testAPI = async () => {
  console.log('🧪 Testing JSearch API...');

  if (!RAPIDAPI_KEY) {
    console.warn('⚠️ VITE_RAPIDAPI_KEY is missing. Configure it in .env to run API tests.');
    return;
  }

  console.log('🔑 API Key:', RAPIDAPI_KEY.substring(0, 20) + '...');
  console.log('🏠 API Host:', JSEARCH_API_HOST);

  // Test 1: Try the JSearch Job Search endpoint
  try {
    console.log('\n📡 Test 1: JSearch Job Search Endpoint');
    const jsearchUrl = `https://${JSEARCH_API_HOST}/search?query=developer jobs&page=1&num_pages=1&date_posted=all`;
    console.log('URL:', jsearchUrl);

    const response1 = await fetch(jsearchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': JSEARCH_API_HOST,
      },
    });

    console.log('Status:', response1.status);
    console.log('Headers:', Object.fromEntries(response1.headers.entries()));
    
    if (response1.ok) {
      const data = await response1.json();
      console.log('✅ JSearch Jobs Response:', data);
    } else {
      const errorText = await response1.text();
      console.log('❌ JSearch Jobs Error:', errorText);
    }
  } catch (error) {
    console.error('❌ JSearch Jobs Exception:', error);
  }

  // Test 2: Try general jobs endpoint
  try {
    console.log('\n📡 Test 2: General Jobs Endpoint');
    const generalJobsUrl = `https://${RAPIDAPI_HOST}/api/job`;
    console.log('URL:', generalJobsUrl);

    const response2 = await fetch(generalJobsUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    console.log('Status:', response2.status);
    console.log('Headers:', Object.fromEntries(response2.headers.entries()));
    
    if (response2.ok) {
      const data = await response2.json();
      console.log('✅ General Jobs Response:', data);
    } else {
      const errorText = await response2.text();
      console.log('❌ General Jobs Error:', errorText);
    }
  } catch (error) {
    console.error('❌ General Jobs Exception:', error);
  }

  // Test 3: Try with different headers
  try {
    console.log('\n📡 Test 3: With Additional Headers');
    const testUrl = `https://${RAPIDAPI_HOST}/api/job?id=1`;
    console.log('URL:', testUrl);

    const response3 = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Status:', response3.status);
    console.log('Headers:', Object.fromEntries(response3.headers.entries()));
    
    if (response3.ok) {
      const data = await response3.json();
      console.log('✅ Additional Headers Response:', data);
    } else {
      const errorText = await response3.text();
      console.log('❌ Additional Headers Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Additional Headers Exception:', error);
  }

  // Test 4: Check CORS preflight
  try {
    console.log('\n📡 Test 4: CORS Preflight Check');
    const testUrl = `https://${RAPIDAPI_HOST}/api/job?id=1`;
    
    const response4 = await fetch(testUrl, {
      method: 'OPTIONS',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    console.log('OPTIONS Status:', response4.status);
    console.log('CORS Headers:', {
      'access-control-allow-origin': response4.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response4.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response4.headers.get('access-control-allow-headers'),
    });
  } catch (error) {
    console.error('❌ CORS Check Exception:', error);
  }
};

// Export for use in browser console
(window as any).testAPI = testAPI;

