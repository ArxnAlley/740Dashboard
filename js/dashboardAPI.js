/* ============================================================
   DASHBOARD API — SETTINGS INTEGRATION
   dashboardAPI.js

   All communication between the dashboard and the 740Eatz
   Apps Script API lives here. Networking is fully isolated
   from page rendering and business logic.

   API.baseUrl is the single configuration point for this file.
   No other file needs to know the API URL.
============================================================ */


/* ============================================================
   API CONFIGURATION
============================================================ */

// Future migration: replace baseUrl with https://api.740eatz.com or
// https://api.nuloedge.com when a Cloudflare Worker is introduced.
const API =
{
    baseUrl: 'https://script.google.com/macros/s/AKfycbwy-rI7WNwFmBqVzJGpdqqKsswJdSCIyWhXb0_Ztua0As62BIEL7l_N2AHWwspd0LEF/exec'
};


/* ============================================================
   HTTP HELPERS
============================================================ */

/*
    Sends a GET request to the API.
    Throws if the request fails or the API returns success: false.
*/
async function apiGet(action)
{

    const response = await fetch(`${API.baseUrl}?action=${encodeURIComponent(action)}`);

    if (!response.ok)
    {
        throw new Error('HTTP ' + response.status + ' on GET ' + action);
    }

    const json = await response.json();

    if (!json.success)
    {
        const msg = json.error && json.error.message ? json.error.message : 'API returned failure.';
        throw new Error(msg);
    }

    return json.data;

}


/*
    Sends a POST request to the API with a JSON-encoded body.
    Uses Content-Type: text/plain to avoid CORS preflight — the body
    is still valid JSON and is parsed correctly by the Apps Script handler.
    Throws if the request fails or the API returns success: false.
*/
async function apiPost(action, body)
{

    const response = await fetch(`${API.baseUrl}?action=${encodeURIComponent(action)}`,
    {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(body)
    });

    if (!response.ok)
    {
        throw new Error('HTTP ' + response.status + ' on POST ' + action);
    }

    const json = await response.json();

    if (!json.success)
    {
        const msg = json.error && json.error.message ? json.error.message : 'API returned failure.';
        throw new Error(msg);
    }

    return json.data;

}


/* ============================================================
   SETTINGS API
============================================================ */

async function fetchSettings()
{
    return await apiGet('settings.get');
}

async function updateSettings(payload)
{
    return await apiPost('settings.update', payload);
}


/* ============================================================
   SETTINGS FORM POPULATION

   Reads API response keys and writes them into existing DOM fields.
   Also updates BAKERY_CONFIG in memory so the rest of the dashboard
   (greetings, order modal pickup days, etc.) stays consistent.

   Only writes a field when the API returned a non-null value.
   Missing or null fields leave the current default intact.

   Field name mapping (API key → BAKERY_CONFIG key):
       googleReviewUrl → googleReviewLink
       facebookUrl     → social.facebook
       tiktokUrl       → social.tiktok
       instagramUrl    → social.instagram
       websiteUrl      → website
============================================================ */

function populateSettingsForm(settings)
{

    console.log("✅ populateSettingsForm()");

    if (!settings || typeof settings !== 'object') { return; }

    /* ── Business Information ── */

    if (settings.businessName !== undefined && settings.businessName !== null)
    {
        console.log("businessName:", settings.businessName);
        console.log(document.getElementById("settBusinessName"));
        const el = document.getElementById('settBusinessName');
        if (el) { el.value = settings.businessName; }
        console.log("DOM businessName:", document.getElementById("settBusinessName").value);
        BAKERY_CONFIG.businessName = settings.businessName;
    }

    if (settings.ownerFullName !== undefined && settings.ownerFullName !== null)
    {
        console.log("ownerFullName:", settings.ownerFullName);
        console.log(document.getElementById("settOwnerName"));
        const el = document.getElementById('settOwnerName');
        if (el) { el.value = settings.ownerFullName; }
        console.log("DOM ownerFullName:", document.getElementById("settOwnerName").value);
        BAKERY_CONFIG.ownerFullName = settings.ownerFullName;
        BAKERY_CONFIG.ownerName     = settings.ownerFullName.split(' ')[0];
    }

    if (settings.phone !== undefined && settings.phone !== null)
    {
        console.log("phone:", settings.phone);
        console.log(document.getElementById("settPhone"));
        const el = document.getElementById('settPhone');
        if (el) { el.value = settings.phone; }
        console.log("DOM phone:", document.getElementById("settPhone").value);
        BAKERY_CONFIG.phone = settings.phone;
    }

    if (settings.address !== undefined && settings.address !== null)
    {
        console.log("address:", settings.address);
        console.log(document.getElementById("settAddress"));
        const el = document.getElementById('settAddress');
        if (el) { el.value = settings.address; }
        console.log("DOM address:", document.getElementById("settAddress").value);
        BAKERY_CONFIG.address = settings.address;
    }

    /* ── Production Schedule ── */

    if (Array.isArray(settings.productionDays))
    {
        console.log("productionDays:", settings.productionDays);
        console.log(document.querySelectorAll('.dayToggle'));
        BAKERY_CONFIG.productionDays = settings.productionDays;
        BAKERY_CONFIG.pickupDays     = settings.productionDays.slice();

        document.querySelectorAll('.dayToggle').forEach(function(toggle)
        {
            const day      = toggle.dataset.day;
            const isActive = settings.productionDays.includes(day);

            toggle.classList.toggle('isActive', isActive);

            const capacityRow   = document.querySelector('.capacityRow[data-day="' + day + '"]');
            const capacityInput = document.querySelector('.capacityInput[data-day="' + day + '"]');

            if (capacityRow)   { capacityRow.classList.toggle('isInactive', !isActive); }
            if (capacityInput) { capacityInput.disabled = !isActive; }
        });
        console.log("DOM productionDays:", BAKERY_CONFIG.productionDays);
    }

    if (settings.dailyCapacity && typeof settings.dailyCapacity === 'object' && !Array.isArray(settings.dailyCapacity))
    {
        console.log("dailyCapacity:", settings.dailyCapacity);
        console.log(document.querySelectorAll('.capacityInput'));
        BAKERY_CONFIG.dailyCapacity = settings.dailyCapacity;

        document.querySelectorAll('.capacityInput').forEach(function(input)
        {
            const day = input.dataset.day;

            if (settings.dailyCapacity[day] !== undefined)
            {
                input.value = settings.dailyCapacity[day];
            }
        });
        console.log("DOM dailyCapacity:", BAKERY_CONFIG.dailyCapacity);
    }

    /* ── Social & Website ── */

    if (settings.googleReviewUrl !== undefined && settings.googleReviewUrl !== null)
    {
        console.log("googleReviewUrl:", settings.googleReviewUrl);
        console.log(document.getElementById("settGoogleReview"));
        const el = document.getElementById('settGoogleReview');
        if (el) { el.value = settings.googleReviewUrl; }
        console.log("DOM googleReviewUrl:", document.getElementById("settGoogleReview").value);
        BAKERY_CONFIG.googleReviewLink = settings.googleReviewUrl;
    }

    if (settings.facebookUrl !== undefined && settings.facebookUrl !== null)
    {
        console.log("facebookUrl:", settings.facebookUrl);
        console.log(document.getElementById("settFacebook"));
        const el = document.getElementById('settFacebook');
        if (el) { el.value = settings.facebookUrl; }
        console.log("DOM facebookUrl:", document.getElementById("settFacebook").value);
        BAKERY_CONFIG.social.facebook = settings.facebookUrl;
    }

    if (settings.tiktokUrl !== undefined && settings.tiktokUrl !== null)
    {
        console.log("tiktokUrl:", settings.tiktokUrl);
        console.log(document.getElementById("settTiktok"));
        const el = document.getElementById('settTiktok');
        if (el) { el.value = settings.tiktokUrl; }
        console.log("DOM tiktokUrl:", document.getElementById("settTiktok").value);
        BAKERY_CONFIG.social.tiktok = settings.tiktokUrl;
    }

    if (settings.instagramUrl !== undefined && settings.instagramUrl !== null)
    {
        console.log("instagramUrl:", settings.instagramUrl);
        console.log(document.getElementById("settInstagram"));
        const el = document.getElementById('settInstagram');
        if (el) { el.value = settings.instagramUrl; }
        console.log("DOM instagramUrl:", document.getElementById("settInstagram").value);
        BAKERY_CONFIG.social.instagram = settings.instagramUrl;
    }

    if (settings.websiteUrl !== undefined && settings.websiteUrl !== null)
    {
        console.log("websiteUrl:", settings.websiteUrl);
        console.log(document.getElementById("settWebsite"));
        const el = document.getElementById('settWebsite');
        if (el) { el.value = settings.websiteUrl; }
        console.log("DOM websiteUrl:", document.getElementById("settWebsite").value);
        BAKERY_CONFIG.website = settings.websiteUrl;
    }

    console.log("✅ Settings population complete.");

}


/* ============================================================
   SETTINGS PAGE LOADER

   Called by initializeSettingsInteractions() after the Settings
   page renders. All DOM fields exist by the time this runs.

   On success: removes any existing warning banner, populates fields.
   On failure: shows a non-blocking warning banner, leaves current values intact.
============================================================ */

async function loadSettingsFromAPI()
{

    console.log("⬇️ Loading Settings from API...");

    try
    {
        const settings = await fetchSettings();
        console.log("✅ API Response:", settings);
        removeSettingsApiBanner();
        console.log("➡️ Calling populateSettingsForm()");
        populateSettingsForm(settings);
    }
    catch (err)
    {
        console.error("❌ Settings API failed:", err);
        console.error("Stack:", err.stack);
        showSettingsApiBanner('Could not load settings from the server. Showing local defaults. Your changes will save when the connection is restored.');
    }

}


/* ============================================================
   SAVE BUTTON LOADING STATE
============================================================ */

function setButtonLoading(btn, isLoading)
{

    if (!btn) { return; }

    if (isLoading)
    {
        btn.disabled              = true;
        btn.dataset.originalHtml  = btn.innerHTML;
        btn.innerHTML             = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    }
    else
    {
        btn.disabled  = false;
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    }

}


/* ============================================================
   SETTINGS API WARNING BANNER

   Non-blocking banner inserted above the settings cards.
   Styled to match the existing warning banner pattern used in Reviews.
   Removed automatically when the next API request succeeds.
============================================================ */

function showSettingsApiBanner(message)
{

    const existing = document.getElementById('settingsApiBanner');
    if (existing) { existing.remove(); }

    const settingsGrid = document.querySelector('.settingsGrid');
    if (!settingsGrid) { return; }

    const banner = document.createElement('div');

    banner.id           = 'settingsApiBanner';
    banner.style.cssText = `
        background: var(--clrAmberBg);
        border: 1px solid var(--clrAmberBorder);
        border-radius: var(--radiusSm);
        padding: 0.65rem 1rem;
        margin-bottom: 1.25rem;
        font-size: 0.8rem;
        color: var(--clrAmber);
    `;

    banner.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="margin-right: 0.4rem;"></i>' + message;

    settingsGrid.parentNode.insertBefore(banner, settingsGrid);

}

function removeSettingsApiBanner()
{

    const banner = document.getElementById('settingsApiBanner');
    if (banner) { banner.remove(); }

}
