document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const navAdd = document.getElementById("nav-add");
    const navInventory = document.getElementById("nav-inventory");
    const sectionAdd = document.getElementById("section-add");
    const sectionInventory = document.getElementById("section-inventory");
    const pageTitle = document.getElementById("page-title");
    const form = document.getElementById("add-ticket-form");
    const tbody = document.querySelector("#inventory-table tbody");
    
    // Modal Elements
    const modal = document.getElementById("custom-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalIcon = document.getElementById("modal-icon");
    const modalActions = document.getElementById("modal-actions");

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
        navAdd.classList.add("active"); navInventory.classList.remove("active");
        sectionAdd.classList.add("active"); sectionInventory.classList.remove("active");
        pageTitle.innerText = "Create Listing";
    });

    navInventory.addEventListener("click", () => {
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
                const base64Image = event.target.result;
                processTicketSave(base64Image);
            };
            reader.readAsDataURL(file);
        } else {
            processTicketSave(""); 
        }
    });

    async function processTicketSave(posterUrl) {
        const ticketData = {
            marketplace_id: document.getElementById("marketplace").value,
            title: document.getElementById("title").value,
            venue: document.getElementById("venue").value,
            event_date: document.getElementById("date").value,
            event_time: document.getElementById("time").value,
            category: document.getElementById("category").value,
            price: parseFloat(document.getElementById("price").value),
            quantity: parseInt(document.getElementById("quantity").value),
            status: document.getElementById("status").value,
            poster_url: posterUrl
        };

        await saveTicketToDB(ticketData); 
        updateDashboardStats();
        
        showModal("Success", `Successfully published ticket to ${ticketData.marketplace_id}!`, "success");
        form.reset();
    }

    // Render Inventory Table
    async function renderInventoryTable() {
        const db = await fetchAllEvents(); 
        tbody.innerHTML = "";

        db.forEach((event) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="badge">${event.marketplace_id}</span></td>
                <td>${event.title}</td>
                <td>${event.event_date}</td>
                <td>${event.tickets[0].price}</td>
                <td><span class="badge">${event.tickets[0].status}</span></td>
                <td><button class="btn-delete" onclick="deleteEvent('${event.id}')"><i class="fa-solid fa-trash"></i></button></td>
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
    }

    // Update Statistics
    async function updateDashboardStats() {
        const db = await fetchAllEvents(); 
        document.getElementById("stat-total").innerText = db.length;
        
        let avail = 0; let sold = 0;
        db.forEach(ev => {
            if(ev.tickets[0].status === 'available') avail++;
            else sold++;
        });
        
        document.getElementById("stat-avail").innerText = avail;
        document.getElementById("stat-sold").innerText = sold;
    }
});