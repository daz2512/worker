// Constants
const API_HOSTNAME = 'apis.cricut.com';
var PROXY_HOSTNAME = ""; // this is set dynamicly to support custom domains

const MACHINE_TYPE_MAP = { // Can we make this dynamiclly pulled?
  '22': 'Newt',
  '14': 'Scamander',
  '11': 'Maker',
  '19': 'Mars',
  '12': 'Cupid',
  '-111': 'Vulcan',
  '-119': 'Atmosphere',
  '-118': 'Atmosphere',
  '-117': 'Atmosphere',
  '-116': 'Atmosphere',
  '23': 'Riddle',
  '15': 'Voldemort',
  '-121': 'Brooklyn',
  '-120': 'Brooklyn',
  '7': 'Explore',
  '8': 'Explore',
  '9': 'Explore',
  '10': 'Explore',
  '-112': 'MugPress',
  '-110': 'MugPress',
  '13': 'Morpheus',
  '-107': 'EasyPress2',
  '-106': 'EasyPress2',
  '-104': 'EasyPress2',
  '-103': 'EasyPress2',
  '-105': 'EasyPressMini',
  '-102': 'EasyPressMini'
};

addEventListener('fetch', event => {  
   PROXY_HOSTNAME = new URL(event.request.url).host;
   event.respondWith(handleRequest(event.request));
});


// Helper: Return JSON Response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function matchPath(url, pathRegex) {
  return new RegExp(`^https://${PROXY_HOSTNAME}${pathRegex}`).test(url);
}

async function handleRequest(originalRequest) {

  const url = new URL(originalRequest.url);

  // Forwarding to the specific target
  url.hostname = 'apis.cricut.com';


  // Check specific GET request conditions
  if (originalRequest.method === 'GET' && MACHINE_TYPE_MAP[url.searchParams.get('machineTypeId')] != undefined && url.searchParams.has('updateLastSeen')) {
    const jsonResponse = JSON.stringify({
      machineId: 0,
      machineType: MACHINE_TYPE_MAP[url.searchParams.get('machineTypeId')] ,
      machineTypeId: url.searchParams.get('machineTypeId'),
      primaryUserSet: true
    });
    return new Response(jsonResponse, {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // Handle fake update check
  if (url.pathname.includes('/desktopdownload/UpdateJson')) {
    return jsonResponse({});
  }

  // Modify headers
  var modifiedHeaders = new Headers(originalRequest.headers);
  modifiedHeaders.set('Host', 'apis.cricut.com');
  modifiedHeaders.delete('Cookie'); // Assuming cookies are not needed for the API

  // Prepare and forward the new request
  const newRequest = new Request(url, { 
    body: originalRequest.body,
    headers: modifiedHeaders,
    method: originalRequest.method,
    redirect: 'manual'
  });

  try {
    const response = await fetch(newRequest);
    // Optionally modify the response
    var modifiedResponse = new Response(response.body, {
      status: response.status,
      headers: response.headers
    });


    // Example of modifying the response body, if needed
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      var data = await response.json();

    if (matchPath(originalRequest.url, '/machine/v2/Machines/machineinfo/.*$')) {
        data["isLocked"] = false;
      }

      modifiedResponse = new Response(JSON.stringify(data), {
        status: response.status,
        headers: response.headers
      });
    }

    return modifiedResponse;
  } catch (error) {
    return new Response('An error occurred', { status: 500 });
  }
}