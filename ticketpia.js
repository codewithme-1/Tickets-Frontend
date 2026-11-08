document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("ticket-container") || document.getElementById("pia-ticket-container");
    
    if (!container) {
        console.error("Could not find the container element in HTML!");
        return;
    }

    // Format date to Japanese style: 2026/11/7(土)
    function formatJapaneseDate(dateString) {
        const dateObj = new Date(dateString);
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        const dayName = days[dateObj.getDay()];
        return `${year}/${month}/${day}(${dayName})`;
    }

    function formatYen(amount) {
        return new Intl.NumberFormat('ja-JP').format(amount) + '円';
    }

    async function loadTickets() {
        try {
            const liveEvents = await fetchMarketplaceEvents('ticketpia');
            
            if (!liveEvents || liveEvents.length === 0) {
                container.innerHTML = `<div class="loading-text">有効なチケットがありません。<br>(No tickets found for Ticket Pia in database.)</div>`;
                return;
            }

            // 1. Generate the Top Navigation (Sticky) & Page Title ONCE
            let completeHTML = `
                <div class="header-top" style="position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div class="logo-area" style="color: #0071ce; font-size: 1.2rem; font-weight: bold; line-height: 1.1;">
                        <span style="display: block; font-size: 0.7rem;">チケット</span>ぴあ
                    </div>
                    <div class="nav-icons" style="display: flex; gap: 15px;">
                        <div class="nav-item" style="display: flex; flex-direction: column; align-items: center; font-size: 0.65rem; color: #666;"><i class="fa-regular fa-user" style="font-size: 1.2rem; margin-bottom: 3px; color: #333;"></i>マイページ</div>
                        <div class="nav-item" style="display: flex; flex-direction: column; align-items: center; font-size: 0.65rem; color: #666;"><i class="fa-solid fa-ticket" style="font-size: 1.2rem; margin-bottom: 3px; color: #333;"></i>Myチケット</div>
                        <div class="nav-item" style="display: flex; flex-direction: column; align-items: center; font-size: 0.65rem; color: #666;"><i class="fa-solid fa-inbox" style="font-size: 1.2rem; margin-bottom: 3px; color: #333;"></i>抽選履歴</div>
                        <div class="nav-item" style="display: flex; flex-direction: column; align-items: center; font-size: 0.65rem; color: #666;"><i class="fa-solid fa-globe" style="font-size: 1.2rem; margin-bottom: 3px; color: #333;"></i>Language</div>
                    </div>
                </div>
                <div class="page-title" style="font-size: 1.1rem; font-weight: bold; padding: 15px; border-bottom: 4px solid #f5f5f5; background: white;">
                    チケット詳細
                </div>
            `;

            // 2. Reverse the array so the newest tickets are at the top, then loop through all of them
            liveEvents.reverse().forEach(event => {
                const mainTicket = (event.tickets && event.tickets.length > 0) ? event.tickets[0] : { quantity: 1, price: 0, category: '全席指定' }; 
                const formattedDate = formatJapaneseDate(event.event_date);
                
                const eventTime = (event.event_time || "18:00").substring(0, 5); 
                let doorsOpenTime = "15:00"; 
                try {
                    let [hours, mins] = eventTime.split(':');
                    hours = parseInt(hours) - 2;
                    if(hours < 0) hours = 0;
                    doorsOpenTime = `${hours.toString().padStart(2, '0')}:${mins}`;
                } catch(e) {}

                const ticketPrice = mainTicket.price || 0;
                const fees = 1995; 
                const basePrice = ticketPrice - fees > 0 ? ticketPrice - fees : ticketPrice;

                let imageBlock = "";
                if (event.poster_url && event.poster_url.trim() !== "" && event.poster_url !== "EMPTY") {
                    imageBlock = `
                        <div style="text-align: center; margin-bottom: 15px;">
                            <img src="${event.poster_url}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" alt="${event.title}">
                        </div>
                    `;
                }

                // Append each ticket block wrapped in a bottom border for visual separation
                completeHTML += `
                    <div class="ticket-wrapper" style="border-bottom: 8px solid #f5f5f5; padding-bottom: 20px; background: white;">
                        <div class="event-section" style="padding: 20px 15px; border-bottom: 4px solid #f5f5f5;">
                            ${imageBlock}
                            <div class="artist-name" style="font-size: 1.5rem; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px;">${event.title}</div>
                            
                            <div class="detail-row" style="display: flex; align-items: flex-start; margin-bottom: 8px; font-size: 0.95rem;">
                                <i class="fa-regular fa-calendar" style="width: 24px; color: #666; margin-top: 3px;"></i>
                                <div>${formattedDate} ${eventTime} 開演</div>
                            </div>
                            <div class="detail-row" style="display: flex; align-items: flex-start; margin-bottom: 8px; font-size: 0.95rem; color: #666;">
                                <i class="fa-regular fa-clock" style="width: 24px; color: #666; margin-top: 3px;"></i>
                                <div>${formattedDate} ${doorsOpenTime} 開場</div>
                            </div>
                            <div class="detail-row" style="display: flex; align-items: flex-start; margin-bottom: 8px; font-size: 0.95rem;">
                                <i class="fa-solid fa-location-dot" style="width: 24px; margin-top: 3px; color: #0071ce;"></i>
                                <div><span style="color: #0071ce; text-decoration: none;">${event.venue}</span></div>
                            </div>

                            <div class="contact-number" style="background: #000; color: #fff; padding: 3px 8px; font-size: 0.8rem; display: inline-block; margin-top: 10px; border-radius: 2px;">
                                お問い合わせの際にご利用いただく番号 ${event.id.substring(0,8).toUpperCase()}
                            </div>
                        </div>

                        <div class="info-blocks" style="padding: 15px;">
                            <div class="info-box" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; margin-bottom: 15px;">
                                <div class="info-title" style="font-weight: bold; font-size: 0.9rem; margin-bottom: 5px;">発券開始日時</div>
                                <div class="info-date" style="font-size: 1rem; margin-bottom: 5px;">2026/11/4(水) 10:00～</div>
                                <div class="info-note" style="color: #333; margin-top: 5px; font-size: 0.8rem;">
                                    MOALAにて発券してください。
                                </div>
                            </div>

                            <div class="info-box" style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px;">
                                <div class="info-title" style="font-weight: bold; font-size: 0.9rem; margin-bottom: 5px;">分配開始日時</div>
                                <div class="info-date" style="font-size: 1rem; margin-bottom: 5px;">2026/11/4(水) 10:00～</div>
                                <div class="info-note" style="color: #666; font-size: 0.8rem; margin-top: 10px;">
                                    <i class="fa-solid fa-circle-exclamation"></i> 本公演は同行者への分配必須です。
                                </div>
                            </div>
                        </div>

                        <div class="ticket-header" style="display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: bold; padding: 15px 15px 0;">
                            <i class="fa-solid fa-ticket"></i> チケット
                        </div>
                        <div style="padding: 0 15px; font-size: 0.9rem;">
                            あなたの所持チケット <span style="font-size: 1.3rem; font-weight: bold;">${mainTicket.quantity}枚</span>
                        </div>

                        <div class="ticket-box" style="margin: 15px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <div class="seat-type" style="font-weight: bold; font-size: 1rem; margin-bottom: 5px;">${mainTicket.category || '全席指定'}</div>
                            <div class="ticket-price" style="font-size: 1.1rem; font-weight: bold; margin-bottom: 5px;">${formatYen(ticketPrice)}</div>
                            <div class="price-breakdown" style="font-size: 0.75rem; color: #666;">
                                チケット券面金額${formatYen(basePrice)} ＋ 券面以外の金額${formatYen(fees)}
                            </div>
                        </div>
                    </div>
                `;
            });

            // 3. Add the Floating Action Button fixed to the bottom right of the screen
            completeHTML += `
                <div style="position: fixed; bottom: 20px; right: 20px; z-index: 999;">
                    <div style="width: 60px; height: 60px; background: white; border: 2px solid #ff6600; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ff6600; font-size: 0.7rem; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.15); cursor: pointer;">
                        <i class="fa-solid fa-bars" style="font-size: 1.5rem; margin-bottom: 2px;"></i>
                        発券詳細
                    </div>
                </div>
            `;

            container.innerHTML = completeHTML;
            
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="loading-text" style="color: red; padding: 20px;">Error loading ticket data: ${error.message}</div>`;
        }
    }

    loadTickets();
});
