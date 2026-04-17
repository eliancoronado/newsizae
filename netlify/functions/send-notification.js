// netlify/functions/send-notification.js
// netlify/functions/send-notification.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { toUserId, senderName, messageText, senderPhoto } = JSON.parse(event.body);
    
    const ONE_SIGNAL_APP_ID = "7ba3861c-4157-45d9-9c79-eb18942fa4b9";
    const ONE_SIGNAL_API_KEY ="os_v2_app_porymhcbk5c5thdz5mmjil5exg4s4recarreqtnoujjl7cflvlx752cggdamyw2b654i357lknzg5rofgdcpaegbeppmfwrm3lfq5zi";
    
    if (!ONE_SIGNAL_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API Key no configurada' })
      };
    }
    
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONE_SIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONE_SIGNAL_APP_ID,
        headings: { en: senderName },
        contents: { en: messageText },
        chrome_web_image: senderPhoto,
        data: {
          url: "/dashboard",
          friendId: toUserId
        },
        filters: [
          { field: "tag", key: "user_id", relation: "=", value: toUserId }
        ]
      })
    });
    
    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};