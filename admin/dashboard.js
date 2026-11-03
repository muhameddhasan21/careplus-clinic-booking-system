
/* ========================================
   1. SUPABASE CONFIGURATION
======================================== */

const SUPABASE_URL =
    "https://haersavpmyjsjwjpmikc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_fSG_l9T7eE2gFNHWhO7MKw_h3ha-K3m";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* ========================================
   2. DASHBOARD ELEMENTS
======================================== */

const menuToggle = document.querySelector("#menu-toggle");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.querySelector("#sidebar-overlay");

const appointmentsTableBody = document.querySelector(
    "#appointments-table-body"
);


/* ========================================
   3. CONFIRMATION MODAL
======================================== */

const confirmationModal = document.getElementById("confirmation-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

let pendingAction = null;


function openConfirmationModal(title, message, confirmText, action) {

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalConfirmBtn.textContent = confirmText;

    pendingAction = action;

    confirmationModal.style.display = "flex";
}


function closeConfirmationModal() {

    confirmationModal.style.display = "none";

    pendingAction = null;

    modalConfirmBtn.disabled = false;
}


modalCancelBtn.addEventListener("click", closeConfirmationModal);


confirmationModal.addEventListener("click", (event) => {

    if (event.target === confirmationModal) {
        closeConfirmationModal();
    }

});


modalConfirmBtn.addEventListener("click", async () => {

    if (!pendingAction) return;

    modalConfirmBtn.disabled = true;

    try {

        await pendingAction();

        closeConfirmationModal();

    } catch (error) {

        console.error("Action failed:", error);

        alert("Something went wrong: " + error.message);

        modalConfirmBtn.disabled = false;

    }

});


/* ========================================
   4. ADMIN CANCELLATION MODAL
======================================== */

const adminCancelModal = document.getElementById("admin-cancel-modal");

const cancellationMessageOptions = document.querySelectorAll(
    'input[name="cancellation-message-type"]'
);

const customCancellationMessage = document.getElementById(
    "admin-cancellation-message"
);

const adminCancelCloseBtn = document.getElementById(
    "admin-cancel-close-btn"
);

const adminCancelSubmitBtn = document.getElementById(
    "admin-cancel-submit-btn"
);


// Handle Standard / Custom Message Selection

cancellationMessageOptions.forEach(option => {

    option.addEventListener("change", () => {

        if (option.value === "custom" && option.checked) {

            customCancellationMessage.disabled = false;
            customCancellationMessage.focus();

        } else if (option.value === "standard" && option.checked) {

            customCancellationMessage.disabled = true;

        }

    });

});


function closeAdminCancelModal() {

    adminCancelModal.style.display = "none";

    delete adminCancelModal.dataset.appointmentId;

    const standardOption = adminCancelModal.querySelector(
        'input[name="cancellation-message-type"][value="standard"]'
    );

    standardOption.checked = true;

    customCancellationMessage.value = "";
    customCancellationMessage.disabled = true;

}


// Go Back Button

adminCancelCloseBtn.addEventListener("click", () => {

    closeAdminCancelModal();

});


// Click Outside Modal

adminCancelModal.addEventListener("click", (event) => {

    if (
        event.target === adminCancelModal &&
        !adminCancelSubmitBtn.disabled
    ) {

        closeAdminCancelModal();

    }

});


/* ========================================
   5. PROTECT DASHBOARD
======================================== */

async function protectDashboard() {

    const { data: { session }, error } =
        await supabaseClient.auth.getSession();


    // Check Login Session

    if (error || !session) {

        window.location.href = "index.html";

        return;

    }


    // Check Admin Permission

    const { data: isAdmin, error: adminError } =
        await supabaseClient.rpc("is_admin");


    if (adminError || !isAdmin) {

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

        return;

    }


    console.log("Dashboard access granted!");


    // Load Dashboard Data

    await loadAppointments();

    await loadWorkingHours();

}


/* ========================================
   6. LOAD APPOINTMENTS
======================================== */

async function loadAppointments() {

    appointmentsTableBody.innerHTML = `
        <tr>
            <td colspan="6">Loading appointments...</td>
        </tr>
    `;


    try {

        const { data: appointments, error } = await supabaseClient

            .from("appointments")

            .select(`
                id,
                patient_name,
                service,
                appointment_date,
                appointment_time,
                status
            `)

            .order("created_at", { ascending: false });


        if (error) throw error;


        // Calculate Statistics

        const totalCount = appointments.length;

        const pendingCount = appointments.filter(
            appointment => appointment.status === "pending"
        ).length;

        const confirmedCount = appointments.filter(
            appointment => appointment.status === "confirmed"
        ).length;

        const cancelledCount = appointments.filter(
            appointment => appointment.status === "cancelled"
        ).length;

        const rejectedCount = appointments.filter(
            appointment => appointment.status === "rejected"
        ).length;


        // Update Statistics Cards

        document.querySelector("#total-appointments").textContent =
            totalCount;

        document.querySelector("#pending-appointments").textContent =
            pendingCount;

        document.querySelector("#confirmed-appointments").textContent =
            confirmedCount;

        document.querySelector("#cancelled-appointments").textContent =
            cancelledCount;

        document.querySelector("#rejected-appointments").textContent =
            rejectedCount;


        // Handle Empty Appointments

        if (appointments.length === 0) {

            appointmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6">No appointments found.</td>
                </tr>
            `;

            return;

        }


        appointmentsTableBody.innerHTML = "";


        // Display Appointments

        appointments.forEach(appointment => {

            const row = document.createElement("tr");


            const date = new Date(
                appointment.appointment_date + "T12:00:00"
            ).toLocaleDateString("en-US", {

                year: "numeric",
                month: "short",
                day: "numeric"

            });


            const time = appointment.appointment_time.slice(0, 5);

            const status = appointment.status;


            row.innerHTML = `

                <td></td>

                <td></td>

                <td>${date}</td>

                <td>${time}</td>

                <td>
                    <span class="status-badge status-${status}">
                        ${status}
                    </span>
                </td>

                <td>

                    ${
                        status === "pending"

                            ? `

                                <div class="action-buttons">

                                    <button
                                        class="confirm-btn"
                                        data-id="${appointment.id}">
                                        Confirm
                                    </button>

                                    <button
                                        class="reject-btn"
                                        data-id="${appointment.id}">
                                        Reject
                                    </button>

                                </div>

                            `

                            : status === "confirmed"

                                ? `

                                    <div class="action-buttons">

                                        <button
                                            class="admin-cancel-btn"
                                            data-id="${appointment.id}">
                                            Cancel
                                        </button>

                                    </div>

                                `

                                : `<span class="no-action">—</span>`

                    }

                </td>

            `;


            // Insert Patient Data Safely

            row.cells[0].textContent = appointment.patient_name;

            row.cells[1].textContent = appointment.service;


            appointmentsTableBody.appendChild(row);

        });


    } catch (error) {

        console.error("Error loading appointments:", error);

        appointmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Failed to load appointments.
                </td>
            </tr>
        `;

    }

}


/* ========================================
   7. UPDATE APPOINTMENT STATUS
======================================== */

async function updateAppointmentStatus(appointmentId, newStatus) {

    console.log("Updating appointment:", appointmentId);

    console.log("New status:", newStatus);


    const { data, error } = await supabaseClient

        .from("appointments")

        .update({ status: newStatus })

        .eq("id", appointmentId)

        .select("id, status");


    if (error) throw error;


    if (!data || data.length === 0) {

        throw new Error(
            "No appointment was updated. Check your UPDATE RLS policy."
        );

    }


    console.log("Appointment updated successfully:", data);


    await loadAppointments();

}


/* ========================================
   8. MOBILE SIDEBAR
======================================== */

// Open / Close Menu

menuToggle.addEventListener("click", () => {

    sidebar.classList.toggle("active");

    sidebarOverlay.classList.toggle("active");

});


// Close Menu When Clicking Outside

sidebarOverlay.addEventListener("click", () => {

    sidebar.classList.remove("active");

    sidebarOverlay.classList.remove("active");

});


// Sidebar Navigation Links

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        sidebar.classList.remove("active");

        sidebarOverlay.classList.remove("active");


        const target = link.getAttribute("href");


        if (target && target !== "#") {

            navLinks.forEach(navLink => {

                navLink.classList.remove("active");

            });

            link.classList.add("active");

        }

    });

});


/* ========================================
   9. APPOINTMENT ACTION BUTTONS
======================================== */

appointmentsTableBody.addEventListener("click", (event) => {

    const button = event.target.closest("button");

    if (!button) return;


    const appointmentId = button.dataset.id;

    if (!appointmentId) return;


    // Confirm Appointment

    if (button.classList.contains("confirm-btn")) {

        openConfirmationModal(

            "Confirm Appointment",

            "Are you sure you want to confirm this appointment?",

            "Confirm",

            async () => {

                await updateAppointmentStatus(
                    appointmentId,
                    "confirmed"
                );

            }

        );

    }


    // Reject Appointment

    else if (button.classList.contains("reject-btn")) {

        openConfirmationModal(

            "Reject Appointment",

            "Are you sure you want to reject this appointment?",

            "Reject",

            async () => {

                await updateAppointmentStatus(
                    appointmentId,
                    "rejected"
                );

            }

        );

    }


    // Admin Cancel Appointment

    else if (button.classList.contains("admin-cancel-btn")) {

        adminCancelModal.dataset.appointmentId = appointmentId;


        const cancelDetails = adminCancelModal.querySelector(
            "#admin-cancel-details"
        );


        cancelDetails.textContent =
            "You are about to cancel this confirmed appointment. Choose the cancellation message.";


        const standardOption = adminCancelModal.querySelector(
            'input[name="cancellation-message-type"][value="standard"]'
        );


        standardOption.checked = true;

        customCancellationMessage.value = "";

        customCancellationMessage.disabled = true;


        adminCancelModal.style.display = "flex";

    }

});


/* ========================================
   10. ADMIN CANCELLATION SUBMISSION
======================================== */

adminCancelSubmitBtn.addEventListener("click", async () => {

    const appointmentId = adminCancelModal.dataset.appointmentId;

    if (!appointmentId) return;


    // Get Selected Message Type

    const selectedOption = adminCancelModal.querySelector(
        'input[name="cancellation-message-type"]:checked'
    );

    if (!selectedOption) return;


    const messageType = selectedOption.value;

    const customMessage = customCancellationMessage.value.trim();


    // Validate Custom Message

    if (messageType === "custom" && !customMessage) {

        alert("Please write a cancellation message.");

        customCancellationMessage.focus();

        return;

    }


    // Prepare Cancellation Data

    const cancellationData = {

        status: "cancelled",

        cancelled_by: "admin",

        cancelled_at: new Date().toISOString(),

        cancellation_message_type: messageType,

        cancellation_message:
            messageType === "custom" ? customMessage : null

    };


    try {

        adminCancelSubmitBtn.disabled = true;

        adminCancelCloseBtn.disabled = true;

        adminCancelSubmitBtn.textContent = "Cancelling...";


        const { data, error } = await supabaseClient

            .from("appointments")

            .update(cancellationData)

            .eq("id", appointmentId)

            .eq("status", "confirmed")

            .select("id, status");


        if (error) throw error;


        if (!data || data.length === 0) {

            throw new Error(
                "Appointment was not cancelled. It may no longer be confirmed."
            );

        }


        console.log("Appointment cancelled successfully!");


        closeAdminCancelModal();


        await loadAppointments();


    } catch (error) {

        console.error("Admin cancellation failed:", error);

        alert("Unable to cancel appointment: " + error.message);


    } finally {

        adminCancelSubmitBtn.disabled = false;

        adminCancelCloseBtn.disabled = false;

        adminCancelSubmitBtn.textContent = "Confirm Cancellation";

    }

});


/* ========================================
   11. WORKING HOURS ELEMENTS
======================================== */

const workingHoursContainer = document.getElementById(
    "working-hours-container"
);

const saveWorkingHoursBtn = document.getElementById(
    "save-working-hours-btn"
);

const workingHoursMessage = document.getElementById(
    "working-hours-message"
);


const dayNames = [

    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"

];


/* ========================================
   12. LOAD WORKING HOURS
======================================== */

async function loadWorkingHours() {

    workingHoursContainer.innerHTML =
        "<p>Loading working hours...</p>";

    workingHoursMessage.textContent = "";


    try {

        const { data: workingHours, error } = await supabaseClient

            .from("working_hours")

            .select(`
                id,
                day_of_week,
                is_open,
                start_time,
                end_time,
                slot_duration
            `)

            .order("day_of_week", { ascending: true });


        if (error) throw error;


        if (!workingHours || workingHours.length !== 7) {

            throw new Error(
                "Working hours settings must contain all seven days."
            );

        }


        workingHoursContainer.innerHTML = "";


        // Create Cards for Each Day

        workingHours.forEach(day => {

            const dayCard = document.createElement("div");

            dayCard.className = "working-day-card";

            if (!day.is_open) {

                dayCard.classList.add("is-closed");

            }


            dayCard.dataset.id = day.id;

            dayCard.dataset.day = day.day_of_week;


            const startTime = day.start_time.slice(0, 5);

            const endTime = day.end_time.slice(0, 5);


            dayCard.innerHTML = `

                <div class="working-day-header">

                    <h3>${dayNames[day.day_of_week]}</h3>

                    <label class="working-day-toggle">

                        <input
                            type="checkbox"
                            class="working-day-open"
                            ${day.is_open ? "checked" : ""}
                        >

                        <span>Open</span>

                    </label>

                </div>


                <div class="working-day-fields">

                    <label>

                        Start Time

                        <input
                            type="time"
                            class="working-start-time"
                            value="${startTime}"
                            ${day.is_open ? "" : "disabled"}
                        >

                    </label>


                    <label>

                        End Time

                        <input
                            type="time"
                            class="working-end-time"
                            value="${endTime}"
                            ${day.is_open ? "" : "disabled"}
                        >

                    </label>


                    <label>

                        Slot Duration (minutes)

                        <input
                            type="number"
                            class="working-slot-duration"
                            min="5"
                            step="5"
                            value="${day.slot_duration}"
                            ${day.is_open ? "" : "disabled"}
                        >

                    </label>

                </div>

            `;


            workingHoursContainer.appendChild(dayCard);

        });


    } catch (error) {

        console.error("Error loading working hours:", error);

        workingHoursContainer.innerHTML =
            "<p>Unable to load working hours. Please refresh the page.</p>";

    }

}


/* ========================================
   13. OPEN / CLOSE WORKING DAYS
======================================== */

workingHoursContainer.addEventListener("change", (event) => {

    if (!event.target.classList.contains("working-day-open")) {

        return;

    }


    const dayCard = event.target.closest(".working-day-card");

    const isOpen = event.target.checked;


    dayCard.classList.toggle("is-closed", !isOpen);


    const timeInputs = dayCard.querySelectorAll(

        ".working-start-time, " +
        ".working-end-time, " +
        ".working-slot-duration"

    );


    timeInputs.forEach(input => {

        input.disabled = !isOpen;

    });

});


/* ========================================
   14. SAVE WORKING HOURS
======================================== */

saveWorkingHoursBtn.addEventListener("click", async () => {

    const dayCards = workingHoursContainer.querySelectorAll(
        ".working-day-card"
    );


    if (dayCards.length !== 7) {

        showWorkingHoursMessage(
            "Working hours data is incomplete. Please refresh the page.",
            "error"
        );

        return;

    }


    const updates = [];


    // Validate All Days Before Saving

    for (const card of dayCards) {

        const day = Number(card.dataset.day);


        const isOpen = card.querySelector(
            ".working-day-open"
        ).checked;


        const startTime = card.querySelector(
            ".working-start-time"
        ).value;


        const endTime = card.querySelector(
            ".working-end-time"
        ).value;


        const slotDuration = Number(
            card.querySelector(".working-slot-duration").value
        );


        if (isOpen) {

            if (!startTime || !endTime) {

                showWorkingHoursMessage(
                    `Please enter working times for ${dayNames[day]}.`,
                    "error"
                );

                return;

            }


            if (startTime >= endTime) {

                showWorkingHoursMessage(
                    `End time must be later than start time on ${dayNames[day]}.`,
                    "error"
                );

                return;

            }


            if (
                !Number.isInteger(slotDuration) ||
                slotDuration < 5 ||
                slotDuration % 5 !== 0
            ) {

                showWorkingHoursMessage(
                    `Slot duration on ${dayNames[day]} must be a multiple of 5 minutes.`,
                    "error"
                );

                return;

            }

        }


        updates.push({

            day_of_week: day,

            is_open: isOpen,

            start_time: startTime || "09:00",

            end_time: endTime || "17:00",

            slot_duration: slotDuration || 30

        });

    }


    try {

        saveWorkingHoursBtn.disabled = true;

        saveWorkingHoursBtn.textContent = "Saving...";

        workingHoursMessage.textContent = "";


        // Update Each Day in Supabase

        for (const dayUpdate of updates) {

            const { error } = await supabaseClient

                .from("working_hours")

                .update({

                    is_open: dayUpdate.is_open,

                    start_time: dayUpdate.start_time,

                    end_time: dayUpdate.end_time,

                    slot_duration: dayUpdate.slot_duration

                })

                .eq("day_of_week", dayUpdate.day_of_week);


            if (error) throw error;

        }


        showWorkingHoursMessage(
            "Working hours have been saved successfully.",
            "success"
        );


        await loadWorkingHours();


    } catch (error) {

        console.error("Error saving working hours:", error);

        showWorkingHoursMessage(
            "Failed to save working hours: " + error.message,
            "error"
        );

    } finally {

        saveWorkingHoursBtn.disabled = false;

        saveWorkingHoursBtn.textContent = "Save Changes";

    }

});


/* ========================================
   15. WORKING HOURS MESSAGE
======================================== */

function showWorkingHoursMessage(message, type) {

    workingHoursMessage.textContent = message;

    workingHoursMessage.className = type;

}
// Start Dashboard
protectDashboard();
// ==========================================
// ADMIN LOGOUT
// ==========================================

const logoutButton = document.getElementById("logout-btn");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            alert("Unable to log out. Please try again.");
            return;
        }

        window.location.href = "index.html";
    });
}