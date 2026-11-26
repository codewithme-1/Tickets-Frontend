// api.js - FastAPI Backend Connection
// Switch between Render (live) and local dev in one place:
const API_ROOT = 'https://tickets-backend-uyj6.onrender.com/api';
// const API_ROOT = 'http://127.0.0.1:8000/api';

const API_BASE_URL = `${API_ROOT}/events`;

// Function to save a ticket from the Admin Dashboard
async function saveTicketToDB(ticketData) {
    // Format the payload to match the FastAPI EventCreate Pydantic schema
    const payload = {
        marketplace_id: ticketData.marketplace_id,
        title: ticketData.title,
        venue: ticketData.venue,
        event_date: ticketData.event_date,
        event_time: ticketData.event_time,
        poster_url: ticketData.poster_url,
        status: "published",
        tickets: [
            {
                category: ticketData.category,
                price: ticketData.price,
                status: ticketData.status,
                quantity: ticketData.quantity,
                section: ticketData.section || "General",
                row: ticketData.row || "1",
                seat_start: ticketData.seat_start || 1,
                order_number: ticketData.order_number || ""
            }
        ]
    };

    try {
        const response = await fetch(`${API_BASE_URL}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error) {
        console.error("Error saving ticket to backend:", error);
        return null;
    }
}

// Function to update an existing event & its tickets
async function updateEventInDB(eventId, ticketData) {
    const payload = {
        marketplace_id: ticketData.marketplace_id,
        title: ticketData.title,
        venue: ticketData.venue,
        event_date: ticketData.event_date,
        event_time: ticketData.event_time,
        poster_url: ticketData.poster_url || null,
        status: "published",
        tickets: [
            {
                category: ticketData.category,
                price: ticketData.price,
                status: ticketData.status,
                quantity: ticketData.quantity,
                section: ticketData.section || "General",
                row: ticketData.row || "1",
                seat_start: ticketData.seat_start || 1,
                order_number: ticketData.order_number || ""
            }
        ]
    };

    try {
        const response = await fetch(`${API_BASE_URL}/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Error updating event:", error);
        return null;
    }
}

// Function to fetch tickets for a specific marketplace
async function fetchMarketplaceEvents(marketplaceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/marketplace/${marketplaceId}`);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching events from backend:", error);
        return [];
    }
}

// Function to fetch all inventory for the Admin Dashboard
async function fetchAllEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Error fetching all events:", error);
        return [];
    }
}

// Function to delete an event from the database
async function deleteEventFromDB(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${eventId}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error("Error deleting event:", error);
        return false;
    }
}
