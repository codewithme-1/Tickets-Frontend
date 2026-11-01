document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("tm-ticket-container");

    function formatTMDate(dateString) {
        // Formats "2026-11-08" to "Sat, Nov 8"
        const dateObj = new Date(dateString);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    }

    function renderTickets(events) {
        container.innerHTML = ""; 

        if (events.length === 0) {
            container.innerHTML = `<div class="no-events">No upcoming events currently available.</div>`;
            return;
        }

        events.forEach(event => {
            const mainTicket = event.tickets[0]; 
            const formattedDate = formatTMDate(event.event_date);
            const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(mainTicket.price);

            const isAvailable = mainTicket.status === 'available';
            const statusClass = isAvailable ? 'status-available' : 'status-sold';
            const statusText = isAvailable ? 'Available' : 'Sold Out';

            const cardHTML = `
                <div class="tm-card">
                    <img src="${event.poster_url}" class="tm-card-img" alt="${event.title}">
                    <div class="tm-card-content">
                        <div class="tm-event-title">${event.title}</div>
                        <div class="tm-event-meta">${formattedDate} &middot; ${event.venue}</div>
                        <div class="tm-card-bottom">
                            <span class="tm-status ${statusClass}">${statusText}</span>
                            <div class="price-block">
                                <button class="get-tickets-btn">Get Tickets</button>
                                <div class="tm-price-sub">${formattedPrice}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // Fetch dynamic data from the live FastAPI backend via api.js
    const liveEvents = await fetchMarketplaceEvents('ticketmaster');
    renderTickets(liveEvents);
});