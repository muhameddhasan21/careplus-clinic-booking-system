// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = "https://haersavpmyjsjwjpmikc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fSG_l9T7eE2gFNHWhO7MKw_h3ha-K3m";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ==========================================
// 2. DOM ELEMENTS
// ==========================================

const appointmentForm = document.querySelector(".appointment-form");
const formMessage = document.querySelector("#form-message");

const dateInput = document.querySelector("#date");
const timeInput = document.querySelector("#time");
const timeSlotsContainer = document.querySelector("#time-slots");


// ==========================================
// 3. GLOBAL VARIABLES
// ==========================================

let bookedSlots = [];
let currentWorkingHours = null;


// ==========================================
// 4. SET MINIMUM DATE
// ==========================================

function getLocalDateString(date = new Date()) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.min = getLocalDateString();


// ==========================================
// 5. LOAD BOOKED APPOINTMENTS
// ==========================================

async function loadBookedSlots() {

    const { data, error } = await supabaseClient.rpc(
        "get_booked_slots"
    );

    if (error) {

        console.error("Error loading booked slots:", error);

        showMessage(
            "Unable to load available appointments. Please try again.",
            "error"
        );

        return false;
    }

    bookedSlots = data || [];

    console.log("Booked slots loaded:", bookedSlots);

    return true;
}


// ==========================================
// 6. LOAD WORKING HOURS FOR SELECTED DATE
// ==========================================

async function loadWorkingHours(selectedDate) {

    // Convert selected date into JavaScript Date
    // and get its day of week.
    // Sunday = 0, Monday = 1, ..., Saturday = 6.

    const date = new Date(`${selectedDate}T12:00:00`);

    const dayOfWeek = date.getDay();

    const { data, error } = await supabaseClient
        .from("working_hours")
        .select("day_of_week, is_open, start_time, end_time, slot_duration")
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

    if (error) {

        console.error("Error loading working hours:", error);

        return {
            success: false,
            data: null
        };
    }

    if (!data) {

        console.error("No working hours found for day:", dayOfWeek);

        return {
            success: false,
            data: null
        };
    }

    return {
        success: true,
        data: data
    };
}


// ==========================================
// 7. GENERATE AVAILABLE TIMES
// ==========================================

async function generateAvailableTimes() {

    timeSlotsContainer.innerHTML =
        '<p class="time-placeholder">Loading times...</p>';

    timeInput.value = "";

    currentWorkingHours = null;

    const selectedDate = dateInput.value;

    if (!selectedDate) {

        timeSlotsContainer.innerHTML =
            '<p class="time-placeholder">Select a date first</p>';

        return;
    }


    // --------------------------------------
    // Load Working Hours
    // --------------------------------------

    const workingHoursResult = await loadWorkingHours(selectedDate);

    if (!workingHoursResult.success) {

        timeSlotsContainer.innerHTML =
            '<p class="time-placeholder">Unable to load working hours. Please try again.</p>';

        return;
    }

    const workingHours = workingHoursResult.data;

    currentWorkingHours = workingHours;


    // --------------------------------------
    // Check if Clinic is Closed
    // --------------------------------------

    if (!workingHours.is_open) {

        timeSlotsContainer.innerHTML =
            '<p class="time-placeholder">The clinic is closed on this day.</p>';

        return;
    }


    // --------------------------------------
    // Validate Working Hours
    // --------------------------------------

    const startTime = workingHours.start_time.substring(0, 5);
    const endTime = workingHours.end_time.substring(0, 5);

    const slotDuration = Number(workingHours.slot_duration);

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (
        !Number.isInteger(slotDuration) ||
        slotDuration <= 0 ||
        startMinutes >= endMinutes
    ) {

        console.error("Invalid working hours configuration:", workingHours);

        timeSlotsContainer.innerHTML =
            '<p class="time-placeholder">Invalid working hours configuration.</p>';

        return;
    }


    // --------------------------------------
    // Load Booked Appointments
    // --------------------------------------

    const success = await loadBookedSlots();

    if (!success) {

        timeSlotsContainer.innerHTML =
            '<p class="time-placeholder">Unable to load available times.</p>';

        return;
    }


    // --------------------------------------
    // Generate Time Slots
    // --------------------------------------

    timeSlotsContainer.innerHTML = "";

    const now = new Date();

    let availableSlotCount = 0;

    for (
        let currentMinutes = startMinutes;
        currentMinutes + slotDuration <= endMinutes;
        currentMinutes += slotDuration
    ) {

        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;

        const time =
            `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;


        // ----------------------------------
        // Check if Slot is Booked
        // ----------------------------------

        const isBooked = bookedSlots.some(function (slot) {

            return (
                slot.appointment_date === selectedDate &&
                slot.appointment_time.substring(0, 5) === time
            );

        });


        // ----------------------------------
        // Check if Slot is in the Past
        // ----------------------------------

        const selectedDateTime = new Date(
            `${selectedDate}T${time}:00`
        );

        const isPast = selectedDateTime <= now;


        // ----------------------------------
        // Format Display Time
        // ----------------------------------

        const period = hours >= 12 ? "PM" : "AM";

        const displayHour = hours % 12 || 12;

        const displayTime = `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;


        // ----------------------------------
        // Create Slot Element
        // ----------------------------------

        const slotElement = document.createElement("button");

        slotElement.type = "button";
        slotElement.classList.add("time-slot");

        const timeLabel = document.createElement("span");

        timeLabel.classList.add("slot-time");
        timeLabel.textContent = displayTime;

        const statusLabel = document.createElement("span");

        statusLabel.classList.add("slot-status");


        // ----------------------------------
        // Determine Slot Status
        // ----------------------------------

        if (isBooked) {

            slotElement.classList.add("booked");
            slotElement.disabled = true;

            statusLabel.textContent = "Booked";

        } else if (isPast) {

            slotElement.classList.add("booked");
            slotElement.disabled = true;

            statusLabel.textContent = "Unavailable";

        } else {

            slotElement.classList.add("available");

            statusLabel.textContent = "Available";

            availableSlotCount++;

            slotElement.addEventListener("click", function () {

                // Remove Previous Selection

                document.querySelectorAll(".time-slot.selected")
                    .forEach(function (slot) {

                        slot.classList.remove("selected");

                    });


                // Select Current Slot

                slotElement.classList.add("selected");


                // Save Selected Time

                timeInput.value = time;

            });

        }


        slotElement.appendChild(timeLabel);
        slotElement.appendChild(statusLabel);

        timeSlotsContainer.appendChild(slotElement);

    }


    // --------------------------------------
    // No Available Slots
    // --------------------------------------

    if (availableSlotCount === 0) {

        const message = document.createElement("p");

        message.classList.add("time-placeholder");

        message.textContent =
            "No available appointment times for this day.";

        timeSlotsContainer.appendChild(message);

    }

}


// ==========================================
// 8. HANDLE DATE SELECTION
// ==========================================

dateInput.addEventListener("change", async function () {

    formMessage.textContent = "";

    formMessage.className = "form-message";

    // Clear Previously Selected Time

    timeInput.value = "";

    currentWorkingHours = null;

    if (!dateInput.value) {

        timeSlotsContainer.innerHTML =
            '<p class="time-placeholder">Select a date first</p>';

        return;
    }

    await generateAvailableTimes();

});


// ==========================================
// 9. HANDLE APPOINTMENT FORM SUBMISSION
// ==========================================

appointmentForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const submitButton = appointmentForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );


    if (submitButton && submitButton.disabled) {

        return;

    }


    // --------------------------------------
    // Get Patient Information
    // --------------------------------------

    const patientName = document.querySelector("#full-name").value.trim();

    const patientEmail = document.querySelector("#email").value.trim();

    const patientPhone = document.querySelector("#phone").value.trim();


    const selectedService = document.querySelector("#service").value;

    const appointmentDate = dateInput.value;

    const appointmentTime = timeInput.value;


    const patientMessage = document.querySelector("#message").value.trim();


    formMessage.textContent = "";

    formMessage.className = "form-message";


    // --------------------------------------
    // Validate Patient Name
    // --------------------------------------

    if (patientName.length < 3) {

        showMessage(
            "Please enter a valid name (at least 3 characters).",
            "error"
        );

        return;
    }


    // --------------------------------------
    // Validate Email
    // --------------------------------------

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {

        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }


    // --------------------------------------
    // Validate Phone
    // --------------------------------------

    if (!/^[0-9+\-\s()]{8,20}$/.test(patientPhone)) {

        showMessage(
            "Please enter a valid phone number.",
            "error"
        );

        return;
    }


    // --------------------------------------
    // Validate Service
    // --------------------------------------

    if (!selectedService) {

        showMessage(
            "Please select a medical service.",
            "error"
        );

        return;
    }


    // --------------------------------------
    // Validate Date
    // --------------------------------------

    if (
        !appointmentDate ||
        appointmentDate < getLocalDateString()
    ) {

        showMessage(
            "Please select a valid future date.",
            "error"
        );

        return;
    }


    // --------------------------------------
    // Validate Time
    // --------------------------------------

    if (!appointmentTime) {

        showMessage(
            "Please select an appointment time.",
            "error"
        );

        return;
    }


    const selectedDateTime = new Date(
        `${appointmentDate}T${appointmentTime}:00`
    );


    if (selectedDateTime <= new Date()) {

        showMessage(
            "Please select a future appointment time.",
            "error"
        );

        return;
    }


    if (submitButton) {

        submitButton.disabled = true;

    }


    try {


        // ----------------------------------
        // Verify Working Hours Again
        // ----------------------------------

        const workingHoursResult = await loadWorkingHours(appointmentDate);

        if (!workingHoursResult.success) {

            showMessage(
                "Unable to verify clinic working hours. Please try again.",
                "error"
            );

            return;
        }


        const workingHours = workingHoursResult.data;


        if (!workingHours.is_open) {

            showMessage(
                "The clinic is closed on the selected day.",
                "error"
            );

            await generateAvailableTimes();

            return;
        }


        // ----------------------------------
        // Verify Selected Time is Valid
        // ----------------------------------

        const startTime = workingHours.start_time.substring(0, 5);

        const endTime = workingHours.end_time.substring(0, 5);

        const slotDuration = Number(workingHours.slot_duration);


        const [startHour, startMinute] = startTime.split(":").map(Number);

        const [endHour, endMinute] = endTime.split(":").map(Number);


        const startMinutes = startHour * 60 + startMinute;

        const endMinutes = endHour * 60 + endMinute;


        const [selectedHour, selectedMinute] = appointmentTime
            .split(":")
            .map(Number);

        const selectedMinutes = selectedHour * 60 + selectedMinute;


        const isValidWorkingTime =
            Number.isInteger(slotDuration) &&
            slotDuration > 0 &&
            startMinutes < endMinutes &&
            selectedMinutes >= startMinutes &&
            selectedMinutes + slotDuration <= endMinutes &&
            (selectedMinutes - startMinutes) % slotDuration === 0;


        if (!isValidWorkingTime) {

            showMessage(
                "This appointment time is outside the clinic working schedule. Please choose another time.",
                "error"
            );

            await generateAvailableTimes();

            return;
        }


        // ----------------------------------
        // Refresh Booked Slots
        // ----------------------------------

        const slotsLoaded = await loadBookedSlots();


        if (!slotsLoaded) {

            showMessage(
                "Unable to verify availability. Please try again.",
                "error"
            );

            return;
        }


        // ----------------------------------
        // Check if Slot is Already Booked
        // ----------------------------------

        const isBooked = bookedSlots.some(function (slot) {

            return (
                slot.appointment_date === appointmentDate &&
                slot.appointment_time.substring(0, 5) === appointmentTime
            );

        });


        if (isBooked) {

            showMessage(
                "This appointment has already been booked. Please choose another time.",
                "error"
            );

            await generateAvailableTimes();

            return;
        }


        // ----------------------------------
        // Insert Appointment into Supabase
        // ----------------------------------

        const { error } = await supabaseClient
            .from("appointments")
            .insert({

                patient_name: patientName,

                patient_email: patientEmail,

                patient_phone: patientPhone,

                service: selectedService,

                appointment_date: appointmentDate,

                appointment_time: appointmentTime,

                status: "pending",

                message: patientMessage || null

            });


        if (error) {

            console.error("Booking error:", error);


            if (error.code === "23505") {

                showMessage(
                    "This time was just booked by someone else. Please choose another time.",
                    "error"
                );

                await generateAvailableTimes();

                return;
            }


            showMessage(
                "Something went wrong while booking. Please try again.",
                "error"
            );

            return;
        }


        // ----------------------------------
        // Booking Successful
        // ----------------------------------

        showMessage(
            "Your appointment request has been submitted successfully!",
            "success"
        );


        appointmentForm.reset();

        timeInput.value = "";

        currentWorkingHours = null;


        timeSlotsContainer.innerHTML =
            '<p class="time-placeholder">Select a date first</p>';


        dateInput.min = getLocalDateString();


        await loadBookedSlots();


        console.log("Appointment saved successfully!");


    } catch (error) {

        console.error("Unexpected booking error:", error);

        showMessage(
            "An unexpected error occurred. Please try again.",
            "error"
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

        }

    }

});


// ==========================================
// 10. DISPLAY FORM MESSAGES
// ==========================================

function showMessage(message, type) {

    formMessage.textContent = message;

    formMessage.className = `form-message ${type}`;

}
// ==========================================
// 11. LOAD PUBLIC WORKING HOURS
// ==========================================

async function loadPublicWorkingHours() {

    const container = document.querySelector("#public-working-hours");

    if (!container) return;

    try {

        const { data, error } = await supabaseClient
            .from("working_hours")
            .select("day_of_week, is_open, start_time, end_time")
            .order("day_of_week", { ascending: true });


        if (error) {
            throw error;
        }


        if (!data || data.length === 0) {

            container.textContent =
                "Working hours are currently unavailable.";

            return;
        }


        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];


        container.innerHTML = "";


        data.forEach(day => {

            const row = document.createElement("div");

            row.className = "working-day";


            const dayName = document.createElement("span");

            dayName.textContent = days[day.day_of_week];


            const hours = document.createElement("span");


            if (!day.is_open) {

                hours.textContent = "Closed";

            } else {

                const formatTime = (time) => {

                    const [hour, minute] = time.split(":");

                    const date = new Date();

                    date.setHours(Number(hour), Number(minute), 0, 0);

                    return date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    });

                };


                hours.textContent =
                    `${formatTime(day.start_time)} - ${formatTime(day.end_time)}`;

            }


            row.appendChild(dayName);

            row.appendChild(hours);

            container.appendChild(row);

        });


    } catch (error) {

        console.error("Error loading public working hours:", error);

        container.textContent =
            "Unable to load working hours. Please try again.";

    }

}


// Load working hours when the page opens

loadPublicWorkingHours();