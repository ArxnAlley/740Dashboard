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

    if (!settings || typeof settings !== 'object') { return; }

    /* ── Business Information ── */

    if (settings.businessName !== undefined && settings.businessName !== null)
    {
        const el = document.getElementById('settBusinessName');
        if (el) { el.value = settings.businessName; }

        const brandEl = document.getElementById('sidebarBusinessName');
        if (brandEl) { brandEl.textContent = settings.businessName; }

        BAKERY_CONFIG.businessName = settings.businessName;
    }

    if (settings.ownerFullName !== undefined && settings.ownerFullName !== null)
    {
        const el = document.getElementById('settOwnerName');
        if (el) { el.value = settings.ownerFullName; }
        BAKERY_CONFIG.ownerFullName = settings.ownerFullName;
        BAKERY_CONFIG.ownerName     = settings.ownerFullName.split(' ')[0];
    }

    if (settings.phone !== undefined && settings.phone !== null)
    {
        const el = document.getElementById('settPhone');
        if (el) { el.value = settings.phone; }
        BAKERY_CONFIG.phone = settings.phone;
    }

    if (settings.address !== undefined && settings.address !== null)
    {
        const el = document.getElementById('settAddress');
        if (el) { el.value = settings.address; }
        BAKERY_CONFIG.address = settings.address;
    }

    /* ── Production Schedule ── */

    if (Array.isArray(settings.productionDays))
    {
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
    }

    if (settings.dailyCapacity && typeof settings.dailyCapacity === 'object' && !Array.isArray(settings.dailyCapacity))
    {
        BAKERY_CONFIG.dailyCapacity = settings.dailyCapacity;

        document.querySelectorAll('.capacityInput').forEach(function(input)
        {
            const day = input.dataset.day;

            if (settings.dailyCapacity[day] !== undefined)
            {
                input.value = settings.dailyCapacity[day];
            }
        });
    }

    /* ── Social & Website ── */

    if (settings.googleReviewUrl !== undefined && settings.googleReviewUrl !== null)
    {
        const el = document.getElementById('settGoogleReview');
        if (el) { el.value = settings.googleReviewUrl; }
        BAKERY_CONFIG.googleReviewLink = settings.googleReviewUrl;
    }

    if (settings.facebookUrl !== undefined && settings.facebookUrl !== null)
    {
        const el = document.getElementById('settFacebook');
        if (el) { el.value = settings.facebookUrl; }
        BAKERY_CONFIG.social.facebook = settings.facebookUrl;
    }

    if (settings.tiktokUrl !== undefined && settings.tiktokUrl !== null)
    {
        const el = document.getElementById('settTiktok');
        if (el) { el.value = settings.tiktokUrl; }
        BAKERY_CONFIG.social.tiktok = settings.tiktokUrl;
    }

    if (settings.instagramUrl !== undefined && settings.instagramUrl !== null)
    {
        const el = document.getElementById('settInstagram');
        if (el) { el.value = settings.instagramUrl; }
        BAKERY_CONFIG.social.instagram = settings.instagramUrl;
    }

    if (settings.websiteUrl !== undefined && settings.websiteUrl !== null)
    {
        const el = document.getElementById('settWebsite');
        if (el) { el.value = settings.websiteUrl; }
        BAKERY_CONFIG.website = settings.websiteUrl;
    }

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

    try
    {
        const settings = await fetchSettings();
        removeSettingsApiBanner();
        populateSettingsForm(settings);
    }
    catch (err)
    {
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
