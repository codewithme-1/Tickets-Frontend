document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const navAdd = document.getElementById("nav-add");
    const navInventory = document.getElementById("nav-inventory");
    const sectionAdd = document.getElementById("section-add");
    const sectionInventory = document.getElementById("section-inventory");
    const pageTitle = document.getElementById("page-title");
    const form = document.getElementById("add-ticket-form");
    const tbody = document.querySelector("#inventory-table tbody");
    const marketplaceSelect = document.getElementById("marketplace");
    const tmSeatFields = document.getElementById("tm-seat-fields");
    const piaExtraFields = document.getElementById("pia-extra-fields");
    const submitBtn = form.querySelector('button[type="submit"]');
    const cancelEditBtn = document.getElementById("btn-cancel-edit");

    // Modal Elements
    const modal = document.getElementById("custom-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalIcon = document.getElementById("modal-icon");
    const modalActions = document.getElementById("modal-actions");

    let cachedEvents = [];
    let editingEventId = null;

    // Toggle marketplace-specific inputs
    function toggleMarketplaceFields() {
        const val = marketplaceSelect.value;
        if (tmSeatFields) tmSeatFields.classList.toggle("visible", val === "ticketmaster");
        if (piaExtraFields) piaExtraFields.classList.toggle("visible", val === "ticketpia");
    }
    marketplaceSelect.addEventListener("change", toggleMarketplaceFields);
    toggleMarketplaceFields();

    function resetEditMode() {
        editingEventId = null;
        form.reset();
        toggleMarketplaceFields();
        pageTitle.innerText = "Create Listing";
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish to Showcase';
        if (cancelEditBtn) cancelEditBtn.style.display = "none";
    }

    // Initialize Dashboard
    updateDashboardStats();

    // Custom Modal Function
    function showModal(title, message, type = "success", onConfirm = null) {
        modalTitle.innerText = title;
        modalMessage.innerText = message;

        if (type === "success") {
            modalIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            modalIcon.style.color = "var(--accent)";
            modalActions.innerHTML = '<button class="btn-submit" id="modal-btn-ok">OK</button>';
            document.getElementById("modal-btn-ok").addEventListener("click", () => modal.classList.remove("active"));
        } else if (type === "confirm") {
            modalIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
            modalIcon.style.color = "#ef4444";
            modalActions.innerHTML = `
                <button class="btn-cancel" id="modal-btn-cancel">Cancel</button>
                <button class="btn-submit" id="modal-btn-yes" style="background: #ef4444; color: white; border: none;">Delete</button>
            `;
            document.getElementById("modal-btn-cancel").addEventListener("click", () => modal.classList.remove("active"));
            document.getElementById("modal-btn-yes").addEventListener("click", () => {
                if (onConfirm) onConfirm();
                modal.classList.remove("active");
            });
        }

        modal.classList.add("active");
    }

    // Tab Switching Logic
    navAdd.addEventListener("click", () => {
        resetEditMode();
        navAdd.classList.add("active"); navInventory.classList.remove("active");
        sectionAdd.classList.add("active"); sectionInventory.classList.remove("active");
    });

    navInventory.addEventListener("click", () => {
        editingEventId = null;
        if (cancelEditBtn) cancelEditBtn.style.display = "none";
        navInventory.classList.add("active"); navAdd.classList.remove("active");
        sectionInventory.classList.add("active"); sectionAdd.classList.remove("active");
        pageTitle.innerText = "Inventory List";
        renderInventoryTable();
    });

    // Form Submission with Image Processing
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const fileInput = document.getElementById("poster");
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                processTicketSave(event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            processTicketSave("");
        }
    });

    async function processTicketSave(posterUrl) {
        const marketplace = marketplaceSelect.value;
        const ticketData = {
            marketplace_id: marketplace,
            title: document.getElementById("title").value,
            venue: document.getElementById("venue").value,
            event_date: document.getElementById("date").value,
            event_time: document.getElementById("time").value,
            category: document.getElementById("category").value,
            price: parseFloat(document.getElementById("price").value),
            quantity: parseInt(document.getElementById("quantity").value, 10) || 1,
            status: document.getElementById("status").value,
            poster_url: posterUrl
        };

        if (marketplace === "ticketmaster") {
            ticketData.section = document.getElementById("tm-section")?.value.trim() || "General";
            ticketData.row = document.getElementById("tm-row")?.value.trim() || "1";
            ticketData.seat_start = parseInt(document.getElementById("tm-seat-start")?.value, 10) || 1;
            ticketData.order_number = document.getElementById("tm-order-num")?.value.trim() || "";
        }

        if (marketplace === "ticketpia") {
            ticketData.ticketing_start = document.getElementById("pia-ticketing-start")?.value.trim() || "";
            ticketData.distribution_start = document.getElementById("pia-distribution-start")?.value.trim() || "";
        }

        if (editingEventId) {
            const res = await updateEventInDB(editingEventId, ticketData);
            if (!res) {
                showModal("Error", "Failed to update listing.", "success");
                return;
            }
            resetEditMode();
            updateDashboardStats();
            showModal("Updated", `Successfully updated "${ticketData.title}"!`, "success");
            navInventory.click();
        } else {
            await saveTicketToDB(ticketData);
            updateDashboardStats();
            showModal("Success", `Successfully published ticket to ${ticketData.marketplace_id}!`, "success");
            resetEditMode();
        }
    }

    // Edit Item
    window.editEvent = function(id) {
        const ev = cachedEvents.find(e => e.id === id);
        if (!ev) return;

        editingEventId = ev.id;
        const slug = ev.marketplaces?.slug || "ticketmaster";
        const availTickets = (ev.tickets || []).filter(t => t.status !== "transferred");
        const firstTicket = availTickets[0] || ev.tickets?.[0] || {};

        marketplaceSelect.value = slug;
        toggleMarketplaceFields();

        document.getElementById("title").value = ev.title || "";
        document.getElementById("venue").value = ev.venue || "";
        document.getElementById("date").value = ev.event_date || "";
        document.getElementById("time").value = (ev.event_time || "19:00").substring(0, 5);
        document.getElementById("category").value = firstTicket.category || "";
        document.getElementById("price").value = firstTicket.price ?? 0;
        document.getElementById("quantity").value = slug === "ticketmaster" ? (availTickets.length || 1) : (firstTicket.quantity || 1);
        document.getElementById("status").value = firstTicket.status || "available";

        if (slug === "ticketmaster") {
            const secEl = document.getElementById("tm-section");
            const rowEl = document.getElementById("tm-row");
            const seatEl = document.getElementById("tm-seat-start");
            const orderEl = document.getElementById("tm-order-num");
            if (secEl) secEl.value = firstTicket.section || "";
            if (rowEl) rowEl.value = firstTicket.row || "";
            if (seatEl) seatEl.value = parseInt(firstTicket.seat_number, 10) || 1;
            if (orderEl) orderEl.value = firstTicket.order_number || "";
        }

        if (slug === "ticketpia") {
            const tsEl = document.getElementById("pia-ticketing-start");
            const dsEl = document.getElementById("pia-distribution-start");
            if (tsEl) tsEl.value = ev.ticketing_start || "";
            if (dsEl) dsEl.value = ev.distribution_start || "";
        }

        navAdd.classList.add("active"); navInventory.classList.remove("active");
        sectionAdd.classList.add("active"); sectionInventory.classList.remove("active");
        pageTitle.innerText = "Edit Listing";
        submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
        if (cancelEditBtn) cancelEditBtn.style.display = "inline-flex";
    };

    // Render Inventory Table
    async function renderInventoryTable() {
        cachedEvents = await fetchAllEvents();
        tbody.innerHTML = "";

        cachedEvents.forEach((event) => {
            const firstTicket = (event.tickets && event.tickets.length > 0) ? event.tickets[0] : { price: 0, status: "available" };
            const marketLabel = event.marketplaces?.name || event.marketplaces?.slug || event.marketplace_id;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="badge">${marketLabel}</span></td>
                <td>${event.title}</td>
                <td>${event.event_date}</td>
                <td>${firstTicket.price}</td>
                <td><span class="badge">${firstTicket.status}</span></td>
                <td style="display:flex;gap:8px;align-items:center;">
                    <button class="btn-edit" onclick="editEvent('${event.id}')" style="background:#3b82f6;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-delete" onclick="deleteEvent('${event.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Delete Item
    window.deleteEvent = function(id) {
        showModal("Confirm Deletion", "Are you sure you want to delete this listing?", "confirm", async () => {
            const success = await deleteEventFromDB(id);
            if (success) {
                renderInventoryTable();
                updateDashboardStats();
                showModal("Deleted", "Listing removed successfully.", "success");
            } else {
                showModal("Error", "Failed to delete the listing from the database.", "confirm");
            }
        });
    };

    // Update Statistics
    async function updateDashboardStats() {
        const db = await fetchAllEvents();
        cachedEvents = db;
        document.getElementById("stat-total").innerText = db.length;

        let avail = 0; let sold = 0;
        db.forEach(ev => {
            const status = ev.tickets?.[0]?.status || "available";
            if (status === "available") avail++;
            else sold++;
        });

        document.getElementById("stat-avail").innerText = avail;
        document.getElementById("stat-sold").innerText = sold;
    }
});
