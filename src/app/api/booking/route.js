// app/api/bookings/route.js
// This proxies all requests to Google Apps Script server-side,
// solving the CORS issue completely.
//
// 🔧 Set your Apps Script URL in .env.local:
//    APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// GET /api/bookings?action=getBookings
export async function GET(request) {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getBookings`, {
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/bookings  (body: booking payload)
export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}