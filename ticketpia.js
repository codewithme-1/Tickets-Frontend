document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("pia-ticket-container");

    function renderTickets(events) {
        container.innerHTML = ""; // Clear loading state

        if (events.length === 0) {
            container.innerHTML = "<p>現在、販売中のチケットはありません。</p>";
            return;
        }

        events.forEach(event => {
            // Parse date for Japanese format
            const dateObj = new Date(event.event_date);
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();

            // Only display the first ticket category for the main card list
            const mainTicket = event.tickets[0]; 
            
            // Format price with comma
            const formattedPrice = new Intl.NumberFormat('ja-JP').format(mainTicket.price);

            // Status label logic
            const statusLabel = mainTicket.status === 'available' ? '発売中' : '予定枚数終了';
            const statusColor = mainTicket.status === 'available' ? 'var(--pia-blue)' : '#999';
            const statusBg = mainTicket.status === 'available' ? 'var(--pia-light-blue)' : '#eee';

            // Construct HTML string
            const cardHTML = `
                <div class="ticket-card">
                    <div class="date-block">
                        <div class="date-month">${month}月</div>
                        <div class="date-day">${day}</div>
                        <div class="date-time">${event.event_time} 開演</div>
                    </div>
                    
                    <img src="${event.poster_url}" class="event-poster" alt="${event.title}">
                    
                    <div class="event-info">
                        <div>
                            <span class="status-badge" style="color: ${statusColor}; background: ${statusBg};">${statusLabel}</span>
                        </div>
                        <h3 class="event-title">${event.title}</h3>
                        <div class="event-venue">
                            <i class="fa-solid fa-location-dot"></i> ${event.venue}
                        </div>
                    </div>

                    <div class="ticket-details">
                        <div class="ticket-category">${mainTicket.category}</div>
                        <div class="ticket-price">¥${formattedPrice}</div>
                        <button class="buy-btn" style="background: ${mainTicket.status === 'available' ? 'var(--pia-blue)' : '#ccc'};">
                            詳細へ
                        </button>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // Fetch dynamic data from the live FastAPI backend via api.js
    const liveEvents = await fetchMarketplaceEvents('ticketpia');
    renderTickets(liveEvents);
});