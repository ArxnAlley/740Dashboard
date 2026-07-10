/* ============================================================
   NULOEDGE BAKERY MODULE — DASHBOARD APPLICATION
   dashboardJS.js

   Single-page application engine for the NuloEdge Bakery Module.

   Architecture:
   1. Workflow Constants & Utilities
   2. Navigation System
   3. Page Renderers (one per sidebar item)
   4. Order Detail Drawer
   5. Interactive Event Handlers
   6. Toast Notification System
   7. Initialization
============================================================ */


/* ============================================================
   WORKFLOW CONSTANTS
   These values are the permanent status contract for the
   NuloOS ecosystem. Use in all future integrations:
   Google Sheets, Apps Script, Supabase, Twilio, Calendar.
============================================================ */

const STATUS =
{
    NEW_REQUEST:      'NEW_REQUEST',
    AWAITING_PAYMENT: 'AWAITING_PAYMENT',
    CONFIRMED:        'CONFIRMED',
    IN_PRODUCTION:    'IN_PRODUCTION',
    PENDING_PICKUP:   'PENDING_PICKUP',
    COMPLETED:        'COMPLETED',
    CANCELLED:        'CANCELLED'
};

// User-facing labels — decoupled from internal status values
const STATUS_LABELS =
{
    NEW_REQUEST:      'New Request',
    AWAITING_PAYMENT: 'Awaiting Payment',
    CONFIRMED:        'Confirmed',
    IN_PRODUCTION:    'In Production',
    PENDING_PICKUP:   'Pending Pickup',
    COMPLETED:        'Completed',
    CANCELLED:        'Cancelled',
    paid:             'Paid',
    unpaid:           'Unpaid'
};

// Workflow color system — permanent design language
const STATUS_BADGE_MAP =
{
    NEW_REQUEST:      'statusNewRequest',
    AWAITING_PAYMENT: 'statusAwaitingPayment',
    CONFIRMED:        'statusConfirmed',
    IN_PRODUCTION:    'statusInProduction',
    PENDING_PICKUP:   'statusPendingPickup',
    COMPLETED:        'statusCompleted',
    CANCELLED:        'statusCancelled',
    paid:             'badgePaid',
    unpaid:           'badgeUnpaid'
};

// Full 6-stage workflow timeline — IN_PRODUCTION is a permanent manual status
const WORKFLOW_STEPS = ['NEW_REQUEST', 'AWAITING_PAYMENT', 'CONFIRMED', 'IN_PRODUCTION', 'PENDING_PICKUP', 'COMPLETED'];

// Maps each status to its position in the workflow timeline
const WORKFLOW_POSITION =
{
    NEW_REQUEST:      0,
    AWAITING_PAYMENT: 1,
    CONFIRMED:        2,
    IN_PRODUCTION:    3,
    PENDING_PICKUP:   4,
    COMPLETED:        5
};

const PAGE_TITLES =
{
    dashboard:  'Dashboard',
    orders:     'Orders',
    production: 'Production',
    customers:  'Customers',
    reviews:    'Reviews',
    reports:    'Reports',
    settings:   'Settings',
    help:       'Help & Support'
};

// Tab definitions — keys are decoupled from status values
// because confirmedQueue and todaysProduction share CONFIRMED status
const ORDER_TABS =
[
    { key: 'newRequest',       label: 'New Requests' },
    { key: 'awaitingPayment',  label: 'Awaiting Payment' },
    { key: 'confirmedQueue',   label: 'Confirmed Queue' },
    { key: 'todaysProduction', label: "Today's Production" },
    { key: 'pendingPickup',    label: 'Pending Pickup' },
    { key: 'completed',        label: 'Completed' },
    { key: 'cancelled',        label: 'Cancelled' }
];


/* ============================================================
   UTILITY FUNCTIONS
============================================================ */

function formatDate(dateStr)
{

    if (!dateStr)
    {
        return '—';
    }

    const date = new Date(dateStr + 'T12:00:00');

    return date.toLocaleDateString('en-US',
    {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

}

function formatDateShort(dateStr)
{

    if (!dateStr)
    {
        return '—';
    }

    const date = new Date(dateStr + 'T12:00:00');

    return date.toLocaleDateString('en-US',
    {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

}

function formatCurrency(amount)
{

    return '$' + Number(amount).toFixed(2).replace(/\.00$/, '');

}

/*
    Returns the digits-only form of a phone value, safe for building a
    tel: href. Coerces to string first — a phone cell can come back as
    a JS number if Google Sheets ever auto-typed it before the API's
    plain-text formatting took effect, and Number.prototype has no
    .replace(), which previously crashed the order drawer outright.
*/
function phoneDigits(value)
{

    if (!value) { return ''; }

    return String(value).replace(/\D/g, '');

}

/*
    Formats a 10-digit US phone number as "(740) 555-0111" for display.
    Customer numbers arrive as free-typed text from the Website and the
    New Order modal, so formats vary. A leading country code "1" on an
    11-digit number is dropped. Anything else (short codes, malformed
    input) passes through unchanged rather than being mangled.
*/
function formatPhone(value)
{

    if (!value) { return ''; }

    let digits = phoneDigits(value);

    if (digits.length === 11 && digits.charAt(0) === '1')
    {
        digits = digits.slice(1);
    }

    if (digits.length !== 10) { return value; }

    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);

}

/*
    Standard inline loading indicator (spinner + message) used inside
    an existing empty-state container while the Orders API request is
    still in flight. Callers wrap this in whatever container fits their
    context (emptyState div, productionEmpty div, or a table cell) —
    see ordersLoaded in dashboardAPI.js for when this applies.
*/
function buildLoadingIndicator(message)
{

    return `<i class="fa-solid fa-spinner fa-spin" style="margin-bottom:0.5rem;font-size:1.25rem;color:var(--clrTextMuted);display:block;"></i>${message || 'Loading…'}`;

}

function buildBadge(statusOrPayment)
{

    const cssClass = STATUS_BADGE_MAP[statusOrPayment] || 'statusCompleted';

    const label = STATUS_LABELS[statusOrPayment] || statusOrPayment;

    return `<span class="badge ${cssClass}">${label}</span>`;

}

function buildStars(rating)
{

    let stars = '';

    for (let i = 1; i <= 5; i++)
    {
        stars += i <= rating ? '★' : '☆';
    }

    return stars;

}

function getInitials(name)
{

    const parts = name.trim().split(' ');

    if (parts.length >= 2)
    {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return parts[0][0].toUpperCase();

}

function getTimeGreeting()
{

    const hour = new Date().getHours();

    if (hour < 12)
    {
        return 'Good morning';
    }

    if (hour < 17)
    {
        return 'Good afternoon';
    }

    return 'Good evening';

}


/*
    Escapes HTML special characters in a string before injecting into innerHTML.
    Required for any field that will eventually hold user-generated content:
    customer names, notes, product descriptions, contact info, admin-entered text.
*/
function esc(str)
{

    if (!str && str !== 0) { return ''; }

    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

}


// Filters the ORDERS array by tab key, driven entirely by order status.
function filterOrdersByTab(tab)
{

    if (tab === 'newRequest')
    {
        return ORDERS.filter(function(o) { return o.status === STATUS.NEW_REQUEST; });
    }

    if (tab === 'awaitingPayment')
    {
        return ORDERS.filter(function(o) { return o.status === STATUS.AWAITING_PAYMENT; });
    }

    if (tab === 'confirmedQueue')
    {
        return ORDERS.filter(function(o) { return o.status === STATUS.CONFIRMED; });
    }

    if (tab === 'todaysProduction')
    {
        return ORDERS.filter(function(o) { return o.status === STATUS.IN_PRODUCTION; });
    }

    if (tab === 'pendingPickup')
    {
        return ORDERS.filter(function(o) { return o.status === STATUS.PENDING_PICKUP; });
    }

    if (tab === 'completed')
    {
        return ORDERS.filter(function(o) { return o.status === STATUS.COMPLETED; });
    }

    if (tab === 'cancelled')
    {
        return ORDERS.filter(function(o) { return o.status === STATUS.CANCELLED; });
    }

    return [];

}


/* ============================================================
   NAVIGATION SYSTEM
============================================================ */

let currentPage = 'dashboard';

function updateNavBadge()
{

    const navBadge = document.getElementById('navBadgeRequests');

    if (navBadge)
    {
        navBadge.textContent = ORDERS.filter(function(o)
        {
            return o.status === STATUS.NEW_REQUEST;
        }).length;
    }

}

function navigateTo(page, opts)
{

    if (!PAGE_TITLES[page])
    {
        return;
    }

    currentPage = page;

    updateSidebarActiveState(page);

    updatePageTitle(page);

    renderPage(page, opts);

    closeMobileMenu();

}

function updateSidebarActiveState(page)
{

    const navItems = document.querySelectorAll('.navItem');

    navItems.forEach(function(item)
    {

        item.classList.remove('isActive');

        if (item.dataset.page === page)
        {
            item.classList.add('isActive');
        }

    });

}

function updatePageTitle(page)
{

    const title = PAGE_TITLES[page] || page;

    const mobileTitle = document.getElementById('mobilePageTitle');

    if (mobileTitle)
    {
        mobileTitle.textContent = title;
    }

    document.title = title + ' — 740Eatz Dashboard';

}

function renderPage(page, opts)
{

    closeOrderDrawer();

    const contentArea = document.getElementById('contentArea');

    if (!contentArea)
    {
        return;
    }

    const renderers =
    {
        dashboard:  renderDashboardPage,
        orders:     renderOrdersPage,
        production: renderProductionPage,
        customers:  renderCustomersPage,
        reviews:    renderReviewsPage,
        reports:    renderReportsPage,
        settings:   renderSettingsPage,
        help:       renderHelpPage
    };

    const renderer = renderers[page];

    if (renderer)
    {
        contentArea.innerHTML = renderer(opts);
        afterRender(page, opts);
    }

}

function afterRender(page, opts)
{

    if (page === 'dashboard')  { initializeDashboardActions(); }
    if (page === 'orders')     { initializeOrdersTabs(); initializeOrdersActions(); }
    if (page === 'production') { initializeProductionActions(); }
    if (page === 'reviews')    { initializeReviewsActions(); }
    if (page === 'settings')   { initializeSettingsInteractions(); }
    if (page === 'help')       { initializeHelpAccordion(); }

    updateNavBadge();

    // Persistent warning while the Orders API is unreachable —
    // renderPage() wipes contentArea, so the banner is re-inserted here
    maybeShowOrdersApiBanner();

}


/* ============================================================
   DASHBOARD PAGE
============================================================ */

function renderDashboardPage()
{

    const greeting       = getTimeGreeting();
    const ownerFirstName = BAKERY_CONFIG.ownerFullName
        ? BAKERY_CONFIG.ownerFullName.split(' ')[0]
        : BAKERY_CONFIG.ownerName;

    const greetingSection = `
        <div class="dashGreetingBlock">
            <h1 class="dashGreetingText">${greeting}, ${ownerFirstName}!</h1>
            <p class="dashGreetingSub">Here&rsquo;s what&rsquo;s happening with your bakery today.</p>
        </div>
    `;

    // ── Workflow KPI counts (mirror workflow stage labels exactly) ──

    const newRequestCount = ORDERS.filter(function(o)
    {
        return o.status === STATUS.NEW_REQUEST;
    }).length;

    const awaitingPaymentCount = ORDERS.filter(function(o)
    {
        return o.status === STATUS.AWAITING_PAYMENT;
    }).length;

    const confirmedQueueCount = ORDERS.filter(function(o)
    {
        return o.status === STATUS.CONFIRMED;
    }).length;

    const todaysProductionCount = ORDERS.filter(function(o)
    {
        return o.status === STATUS.IN_PRODUCTION;
    }).length;

    const pendingPickupCount = ORDERS.filter(function(o)
    {
        return o.status === STATUS.PENDING_PICKUP;
    }).length;

    const kpiCards = `
        <div class="kpiGrid">

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'newRequest'})">
                <div class="kpiTop">
                    <span class="kpiLabel">New Requests</span>
                    <span class="kpiIcon iconPurple"><i class="fa-solid fa-inbox"></i></span>
                </div>
                <div class="kpiValue">${newRequestCount}</div>
                <div class="kpiSub">Awaiting your response</div>
            </div>

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'awaitingPayment'})">
                <div class="kpiTop">
                    <span class="kpiLabel">Awaiting Payment</span>
                    <span class="kpiIcon iconRed"><i class="fa-solid fa-clock"></i></span>
                </div>
                <div class="kpiValue">${awaitingPaymentCount}</div>
                <div class="kpiSub">Contacted, payment pending</div>
            </div>

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'confirmedQueue'})">
                <div class="kpiTop">
                    <span class="kpiLabel">Confirmed Queue</span>
                    <span class="kpiIcon iconBlue"><i class="fa-solid fa-circle-check"></i></span>
                </div>
                <div class="kpiValue">${confirmedQueueCount}</div>
                <div class="kpiSub">Paid &amp; scheduled</div>
            </div>

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('production')">
                <div class="kpiTop">
                    <span class="kpiLabel">Today&rsquo;s Production</span>
                    <span class="kpiIcon iconAmber"><i class="fa-solid fa-fire-burner"></i></span>
                </div>
                <div class="kpiValue">${todaysProductionCount}</div>
                <div class="kpiSub">Orders to make today</div>
            </div>

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'pendingPickup'})">
                <div class="kpiTop">
                    <span class="kpiLabel">Pending Pickup</span>
                    <span class="kpiIcon iconGreen"><i class="fa-solid fa-bag-shopping"></i></span>
                </div>
                <div class="kpiValue">${pendingPickupCount}</div>
                <div class="kpiSub">Made &amp; waiting for customer</div>
            </div>

        </div>
    `;

    // ── Action Required ──

    const needsAttention = ORDERS.filter(function(o)
    {
        return o.status === STATUS.NEW_REQUEST || o.status === STATUS.AWAITING_PAYMENT;
    });

    const attentionItems = !ordersLoaded
        ? `<div class="emptyState">${buildLoadingIndicator('Loading orders…')}</div>`
        : needsAttention.length > 0
        ? needsAttention.map(function(order)
        {

            const tabKey = order.status === STATUS.NEW_REQUEST ? 'newRequest' : 'awaitingPayment';

            return `
                <div class="recentRequestItem" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'${tabKey}'})">
                    <div class="recentRequestInfo">
                        <div class="recentRequestName">${esc(order.customer)}</div>
                        <div class="recentRequestDetail">${esc(order.products)} · ${order.pickupDay} ${formatDate(order.pickupDate)}</div>
                    </div>
                    ${buildBadge(order.status)}
                </div>
            `;

        }).join('')
        : `<div class="emptyState"><i class="fa-solid fa-check-circle" style="margin-bottom:0.5rem;font-size:1.5rem;color:var(--clrGreen);"></i><div class="emptyStateTitle">All clear</div><div class="emptyStateSub">No requests need attention</div></div>`;

    // ── Pending Pickup widget ──

    const pendingPickupOrders = ORDERS.filter(function(o) { return o.status === STATUS.PENDING_PICKUP; });

    const pendingPickupItems = !ordersLoaded
        ? `<div class="emptyState">${buildLoadingIndicator('Loading orders…')}</div>`
        : pendingPickupOrders.length > 0
        ? pendingPickupOrders.map(function(order)
        {
            return `
                <div class="productionQueueItem">
                    <div class="pqiLeft">
                        <div class="pqiCustomer">${esc(order.customer)}</div>
                        <div class="pqiProducts">${esc(order.products)}</div>
                    </div>
                    <div class="pqiTime">${esc(order.pickupTime || order.pickupDay)}</div>
                    ${buildBadge(order.status)}
                </div>
            `;
        }).join('')
        : `<div class="emptyState"><i class="fa-solid fa-bag-shopping" style="margin-bottom:0.5rem;font-size:1.5rem;color:var(--clrTextDim);"></i><div class="emptyStateTitle">Nothing waiting for pickup</div><div class="emptyStateSub">Ready orders will appear here</div></div>`;

    // ── Upcoming Confirmed Queue ──

    const upcomingOrders = ORDERS
        .filter(function(o)
        {
            return o.status === STATUS.CONFIRMED && o.pickupDate >= TODAY_DATE;
        })
        .sort(function(a, b) { return a.pickupDate.localeCompare(b.pickupDate); })
        .slice(0, 5)
        .map(function(order)
        {
            return `
                <div class="pickupItem">
                    <div class="pickupDate">${order.pickupDay} · ${formatDateShort(order.pickupDate)}</div>
                    <div class="pickupCustomer">${esc(order.customer)}</div>
                    <div class="pickupProducts">${esc(order.products)}${order.pickupTime ? ' · ' + esc(order.pickupTime) : ''}</div>
                </div>
            `;
        }).join('');

    const upcomingOrdersHTML = !ordersLoaded
        ? `<div class="emptyState">${buildLoadingIndicator('Loading orders…')}</div>`
        : (upcomingOrders || '<div class="emptyState"><div class="emptyStateTitle">No upcoming orders</div></div>');

    // ── Activity Log ──

    const activityItems = ACTIVITY_LOG.length > 0
        ? ACTIVITY_LOG.map(function(item)
        {
            return `
                <div class="activityItem">
                    <div class="activityDot"><i class="fa-solid ${item.icon}"></i></div>
                    <div class="activityContent">
                        <div class="activityMessage">${item.message}</div>
                        <div class="activityDetail">${item.detail}</div>
                        <div class="activityTime">${item.time}</div>
                    </div>
                </div>
            `;
        }).join('')
        : `<div class="emptyState"><div class="emptyStateTitle">No recent activity</div><div class="emptyStateSub">Order events will appear here</div></div>`;

    return `

        ${greetingSection}

        ${kpiCards}

        <div class="dashGrid">

            <!-- Action Required -->
            <div class="widgetCard dashColSpan2">
                <div class="widgetHeader">
                    <span class="widgetTitle">Action Required</span>
                    <span class="widgetMeta">${needsAttention.length} item${needsAttention.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="widgetBody">
                    ${attentionItems}
                </div>
            </div>

            <!-- Pending Pickup -->
            <div class="widgetCard">
                <div class="widgetHeader">
                    <span class="widgetTitle">Pending Pickup</span>
                    <span class="widgetMeta">${pendingPickupOrders.length} ready</span>
                </div>
                <div class="widgetBody">
                    ${pendingPickupItems}
                </div>
            </div>

            <!-- Upcoming Confirmed Queue -->
            <div class="widgetCard">
                <div class="widgetHeader">
                    <span class="widgetTitle">Upcoming Orders</span>
                    <span class="widgetMeta">Confirmed Queue</span>
                </div>
                <div class="widgetBody">
                    ${upcomingOrdersHTML}
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="widgetCard dashColSpan2">
                <div class="widgetHeader">
                    <span class="widgetTitle">Recent Activity</span>
                    <span class="widgetMeta">Today</span>
                </div>
                <div class="widgetBody">
                    ${activityItems}
                </div>
            </div>

        </div>

    `;

}

function initializeDashboardActions()
{

    // Dashboard widget interactions wired here

}


/* ============================================================
   NEW ORDER REQUEST MODAL
============================================================ */

function showNewOrderRequestModal()
{

    const existing = document.getElementById('newOrderRequestModal');

    if (existing)
    {
        existing.remove();
    }

    const modal = document.createElement('div');

    modal.id = 'newOrderRequestModal';

    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.65);
        z-index: 300; display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(3px);
    `;

    modal.innerHTML = `
        <div style="
            background: var(--clrCard); border: 1px solid var(--clrBorderLight);
            border-radius: var(--radiusLg); padding: 2rem; width: 100%;
            max-width: 520px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); position: relative;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--clrText); letter-spacing: -0.01em;">New Order Request</div>
                    <div style="font-size: 0.8rem; color: var(--clrTextSub); margin-top: 2px;">Enter customer and order details below.</div>
                </div>
                <button id="closeNewOrderModal" style="
                    width: 32px; height: 32px; border-radius: var(--radiusSm);
                    background: var(--clrSurface); border: 1px solid var(--clrBorder);
                    color: var(--clrTextSub); font-size: 1.1rem; display: flex;
                    align-items: center; justify-content: center; cursor: pointer;
                ">&#x2715;</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1rem;">

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;">
                    <div class="formGroup">
                        <label class="formLabel">Customer Name</label>
                        <input class="formInput" type="text" id="nrCustomerName" placeholder="Full name">
                    </div>
                    <div class="formGroup">
                        <label class="formLabel">Phone Number</label>
                        <input class="formInput" type="tel" id="nrPhone" placeholder="(555) 000-0000">
                    </div>
                </div>

                <div class="formGroup">
                    <label class="formLabel">Products Requested</label>
                    <input class="formInput" type="text" id="nrProducts" placeholder="e.g. Large Tray, Chocolate Strawberries x2">
                </div>

                <div class="formGroup">
                    <label class="formLabel">Pickup Date</label>
                    <input class="formInput" type="date" id="nrPickupDate">
                    <p class="formHint">Pickup day is set automatically from the date.</p>
                </div>

                <div class="formGroup">
                    <label class="formLabel">Notes</label>
                    <textarea class="formInput formTextarea" id="nrNotes" rows="2" placeholder="Special requests, allergies, flavor preferences…"></textarea>
                </div>

            </div>

            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: flex-end;">
                <button id="cancelNewOrderModal" class="btn btnGhost">Cancel</button>
                <button id="submitNewOrderModal" class="btn btnPrimary">
                    <i class="fa-solid fa-paper-plane"></i> Submit Request
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);

    // Focus the first field so keyboard users land straight in the form
    const firstField = document.getElementById('nrCustomerName');
    if (firstField) { firstField.focus(); }

    function handleModalEsc(e)
    {
        if (e.key === 'Escape') { closeModal(); }
    }

    function closeModal()
    {
        modal.remove();
        document.removeEventListener('keydown', handleModalEsc);
    }

    document.addEventListener('keydown', handleModalEsc);

    document.getElementById('closeNewOrderModal').addEventListener('click', closeModal);

    document.getElementById('cancelNewOrderModal').addEventListener('click', closeModal);

    document.getElementById('submitNewOrderModal').addEventListener('click', async function()
    {

        const name       = document.getElementById('nrCustomerName').value.trim();
        const phone      = document.getElementById('nrPhone').value.trim();
        const products   = document.getElementById('nrProducts').value.trim();
        const pickupDate = document.getElementById('nrPickupDate').value;
        const notes      = document.getElementById('nrNotes').value.trim();

        if (!name)
        {
            showToast('warning', 'Please enter a customer name.');
            return;
        }

        if (!phone)
        {
            showToast('warning', 'Please enter a phone number.');
            return;
        }

        if (!products)
        {
            showToast('warning', 'Please enter the requested products.');
            return;
        }

        if (!pickupDate)
        {
            showToast('warning', 'Please select a preferred pickup date.');
            return;
        }

        // Order id, status, and pickup day are assigned by the API —
        // manual entries flow through the same orders.create endpoint
        // as website submissions.
        const nameParts = name.split(' ');

        const payload =
        {
            firstName:  nameParts[0],
            lastName:   nameParts.slice(1).join(' '),
            phone:      phone,
            product:    products,
            pickupDate: pickupDate,
            notes:      notes,
            source:     'Dashboard Manual Entry'
        };

        const submitBtn = document.getElementById('submitNewOrderModal');

        setButtonLoading(submitBtn, true);

        try
        {
            const order = await createOrder(payload);

            ORDERS.unshift(order);

            closeModal();

            // esc() — showToast renders via innerHTML and the name is user-typed
            showToast('success', 'Order request ' + esc(order.id) + ' from ' + esc(order.customer) + ' submitted.');

            // Refresh order views only — re-rendering Settings would
            // discard unsaved form edits
            if (currentPage === 'dashboard' || currentPage === 'orders' || currentPage === 'production')
            {
                renderPage(currentPage);
            }
            else
            {
                updateNavBadge();
            }
        }
        catch (err)
        {
            const message = err && err.message
                ? err.message
                : 'Could not submit the order request. Please try again.';

            showToast('warning', message);

            setButtonLoading(submitBtn, false);
        }

    });

    modal.addEventListener('click', function(e)
    {
        if (e.target === modal)
        {
            closeModal();
        }
    });

}


/* ============================================================
   ORDER STATUS CHANGES

   Single write path for every workflow action (orders table,
   order drawer, and production board). Persists the change
   through the Apps Script API (orders.updateStatus), then
   applies it to the in-memory order so the next render matches
   Google Sheets. The UI only advances when the write succeeds.

   opts.confirmMessage guards against accidental single-click
   mistakes (Mark Paid, Reject, Cancel, Mark Ready, Complete Pickup —
   every status change with no "undo" path in the UI). One native
   confirm() here replaces what used to be duplicated window.confirm
   + early-return boilerplate at each call site.
============================================================ */

async function applyOrderStatusChange(button, orderId, nextStatus, options)
{

    const order = ORDERS.find(function(o) { return o.id === orderId; });

    if (!order)
    {
        showToast('warning', 'Order ' + orderId + ' was not found. Please refresh the page.');
        return false;
    }

    const opts = options || {};

    if (opts.confirmMessage && !window.confirm(opts.confirmMessage))
    {
        return false;
    }

    setButtonLoading(button, true);

    try
    {

        const payload = { id: orderId, status: nextStatus };

        if (opts.paymentStatus) { payload.paymentStatus = opts.paymentStatus; }

        const updated = await updateOrderStatusAPI(payload);

        // Sync the in-memory row with the authoritative sheet record
        order.status = updated && updated.status ? updated.status : nextStatus;

        if (updated && updated.paymentStatus)
        {
            order.paymentStatus = updated.paymentStatus;
        }
        else if (opts.paymentStatus)
        {
            order.paymentStatus = opts.paymentStatus;
        }

        if (updated && updated.updatedAt) { order.updatedAt = updated.updatedAt; }

        return true;

    }
    catch (err)
    {
        showToast('warning', 'Could not update ' + orderId + '. Please try again.');
        return false;
    }
    finally
    {
        setButtonLoading(button, false);
    }

}


/* ============================================================
   ORDERS PAGE
============================================================ */

function renderOrdersPage(opts)
{

    const activeTab = (opts && opts.tab) ? opts.tab : 'newRequest';

    // Phone visible on tabs where calling the customer is the next action
    const showPhone = (activeTab === 'newRequest' || activeTab === 'awaitingPayment');

    const tabsHTML = ORDER_TABS.map(function(tab)
    {

        const count = filterOrdersByTab(tab.key).length;

        const badgeHTML = count > 0 ? `<span class="ordersTabBadge">${count}</span>` : '';

        return `<button class="ordersTab ${tab.key === activeTab ? 'isActive' : ''}" data-tab="${tab.key}">${tab.label}${badgeHTML}</button>`;

    }).join('');

    const filteredOrders = filterOrdersByTab(activeTab);

    // Confirmed Queue: sorted by pickup date — supports future calendar view
    if (activeTab === 'confirmedQueue')
    {
        filteredOrders.sort(function(a, b) { return a.pickupDate.localeCompare(b.pickupDate); });
    }

    const tableRows = !ordersLoaded
        ? `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--clrTextMuted); font-size: 0.84rem;">${buildLoadingIndicator('Loading orders…')}</td></tr>`
        : filteredOrders.length > 0
        ? filteredOrders.map(function(order)
        {
            return buildOrderTableRow(order, activeTab, showPhone);
        }).join('')
        : `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--clrTextMuted); font-size: 0.84rem;">No orders in this stage</td></tr>`;

    // ── Mobile card variant — same rows, stacked-card layout instead
    // of a table. Phone is always shown here (not tab-conditional like
    // the desktop table) since tap-to-call is useful at every stage. ──

    const cardsHTML = !ordersLoaded
        ? `<div class="productionEmpty">${buildLoadingIndicator('Loading orders…')}</div>`
        : filteredOrders.length > 0
        ? filteredOrders.map(function(order)
        {
            return buildOrderCardMobile(order, activeTab);
        }).join('')
        : `<div class="productionEmpty">No orders in this stage</div>`;

    const activeCount = ORDERS.filter(function(o)
    {
        return o.status !== STATUS.COMPLETED && o.status !== STATUS.CANCELLED;
    }).length;

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Orders</div>
                <div class="pageHeaderSub">${activeCount} active · ${ORDERS.length} total</div>
            </div>

        </div>

        <div class="ordersTabBar">
            ${tabsHTML}
        </div>

        <div class="tableWrapper ordersTableWrapper">

            <table class="dataTable">

                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Products</th>
                        <th>Pickup</th>
                        <th>Payment</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody id="ordersTableBody">
                    ${tableRows}
                </tbody>

            </table>

        </div>

        <div class="ordersCardList" id="ordersCardList">
            ${cardsHTML}
        </div>

    `;

}

function formatOrderPickupText(order)
{

    return order.pickupDate
        ? `${order.pickupDay} · ${formatDate(order.pickupDate)}${order.pickupTime ? ' · ' + esc(order.pickupTime) : ''}`
        : order.pickupDay;

}

function buildOrderTableRow(order, tab, showPhone)
{

    const customerCell = showPhone && order.phone
        ? `<td><div class="tdCustomer">${esc(order.customer)}</div><span class="orderPhone">${esc(formatPhone(order.phone))}</span></td>`
        : `<td class="tdCustomer">${esc(order.customer)}</td>`;

    const actions = buildOrderRowActions(order, tab);

    return `
        <tr class="orderTableRow" data-id="${order.id}">
            <td class="tdId">${order.id}</td>
            ${customerCell}
            <td class="tdMuted">${esc(order.products)}</td>
            <td class="tdMuted">${formatOrderPickupText(order)}</td>
            <td>${buildBadge(order.paymentStatus)}</td>
            <td>
                <div class="tdActions">
                    ${actions}
                </div>
            </td>
        </tr>
    `;

}

function buildOrderCardMobile(order, tab)
{

    const phoneHTML = order.phone
        ? `<a class="orderCardPhone phoneTel" href="tel:${phoneDigits(order.phone)}"><i class="fa-solid fa-phone"></i> ${esc(formatPhone(order.phone))}</a>`
        : '';

    const actions = buildOrderRowActions(order, tab);

    return `
        <div class="orderCard" data-id="${order.id}">
            <div class="orderCardHeader">
                <span class="orderCardId">${order.id}</span>
                ${buildBadge(order.status)}
            </div>
            <div class="orderCardCustomer">${esc(order.customer)}</div>
            ${phoneHTML}
            <div class="orderCardProducts">${esc(order.products)}</div>
            <div class="orderCardMeta">
                <span class="orderCardPickup"><i class="fa-solid fa-calendar-day"></i> ${formatOrderPickupText(order)}</span>
                ${buildBadge(order.paymentStatus)}
            </div>
            <div class="orderCardActions">
                ${actions}
            </div>
        </div>
    `;

}

function buildOrderRowActions(order, tab)
{

    // ── New Requests: Contact Customer, Mark Paid, Reject ──
    if (tab === 'newRequest')
    {
        return `
            <button class="btn btnGreen btnSm btnMarkPaid" data-id="${order.id}">Mark Paid</button>
            <button class="btn btnPrimary btnSm btnContactCustomer" data-id="${order.id}">Contact Customer</button>
            <button class="btn btnRed btnSm btnRejectOrder" data-id="${order.id}">Reject</button>
        `;
    }

    // ── Awaiting Payment: Mark Paid, Cancel ──
    if (tab === 'awaitingPayment')
    {
        return `
            <button class="btn btnGreen btnSm btnMarkPaid" data-id="${order.id}">Mark Paid</button>
            <button class="btn btnRed btnSm btnCancelOrder" data-id="${order.id}">Cancel</button>
        `;
    }

    // ── Confirmed Queue: read-only, awaiting Apps Script to move to IN_PRODUCTION ──
    if (tab === 'confirmedQueue')
    {
        return `<span style="font-size:0.75rem;color:var(--clrTextMuted);">Schedules on ${order.pickupDay}</span>`;
    }

    // ── Today's Production: Mark Ready for Pickup ──
    if (tab === 'todaysProduction')
    {
        return `<button class="btn btnGreen btnSm btnMarkReady" data-id="${order.id}">Mark Ready for Pickup</button>`;
    }

    // ── Pending Pickup: Complete Pickup ──
    if (tab === 'pendingPickup')
    {
        return `<button class="btn btnPrimary btnSm btnCompletePickup" data-id="${order.id}">Complete Pickup</button>`;
    }

    return '';

}

function initializeOrdersTabs()
{

    document.querySelectorAll('.ordersTab').forEach(function(tab)
    {

        tab.addEventListener('click', function()
        {
            navigateTo('orders', { tab: tab.dataset.tab });
        });

    });

    // Keeps the active tab visible in the scrollable mobile tab strip —
    // without this, navigating straight to a tab near the end (e.g. from
    // a KPI card deep link) can leave it scrolled off-screen.
    const activeTab = document.querySelector('.ordersTab.isActive');

    if (activeTab && typeof activeTab.scrollIntoView === 'function')
    {
        activeTab.scrollIntoView({ inline: 'center', block: 'nearest' });
    }

}

function initializeOrdersActions()
{

    // ── Contact Customer (NEW_REQUEST → AWAITING_PAYMENT) ──

    document.querySelectorAll('.btnContactCustomer').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });
            const ok    = await applyOrderStatusChange(btn, id, STATUS.AWAITING_PAYMENT);

            if (ok)
            {
                // [TWILIO HOOK: Log outbound contact attempt]

                // esc() — customer names originate from public website input
                showToast('info', 'Call or text ' + esc(order ? order.customer : id) + ' and share payment details.');

                renderPage('orders', { tab: 'awaitingPayment' });
            }

        });

    });

    // ── Mark Paid (→ CONFIRMED, from any pre-confirmation stage) ──

    document.querySelectorAll('.btnMarkPaid').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id = btn.dataset.id;
            const ok = await applyOrderStatusChange(btn, id, STATUS.CONFIRMED,
            {
                paymentStatus:  'paid',
                confirmMessage: 'Mark ' + id + ' as paid and confirmed?'
            });

            if (ok)
            {
                // [TWILIO HOOK: SMS confirmation to customer]
                // [CALENDAR HOOK: Create Google Calendar event for pickup date]

                showToast('success', id + ' paid and confirmed.');

                renderPage('orders', { tab: 'confirmedQueue' });
            }

        });

    });

    // ── Reject Order (NEW_REQUEST → CANCELLED) ──

    document.querySelectorAll('.btnRejectOrder').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (!order)
            {
                return;
            }

            const ok = await applyOrderStatusChange(btn, id, STATUS.CANCELLED,
            {
                confirmMessage: 'Reject order ' + id + ' from ' + order.customer + '?'
            });

            if (ok)
            {
                showToast('info', id + ' rejected.');

                renderPage('orders', { tab: 'newRequest' });
            }

        });

    });

    // ── Cancel Order (AWAITING_PAYMENT → CANCELLED) ──

    document.querySelectorAll('.btnCancelOrder').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (!order)
            {
                return;
            }

            const ok = await applyOrderStatusChange(btn, id, STATUS.CANCELLED,
            {
                confirmMessage: 'Cancel order ' + id + ' for ' + order.customer + '?'
            });

            if (ok)
            {
                showToast('info', id + ' cancelled.');

                renderPage('orders', { tab: 'cancelled' });
            }

        });

    });

    // ── Mark Ready for Pickup (IN_PRODUCTION → PENDING_PICKUP) ──

    document.querySelectorAll('.btnMarkReady').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id = btn.dataset.id;
            const ok = await applyOrderStatusChange(btn, id, STATUS.PENDING_PICKUP,
            {
                confirmMessage: 'Mark ' + id + ' ready for pickup?'
            });

            if (ok)
            {
                // [TWILIO HOOK: SMS to customer — order is ready]

                showToast('success', id + ' ready for pickup.');

                renderPage('orders', { tab: 'pendingPickup' });
            }

        });

    });

    // ── Complete Pickup (PENDING_PICKUP → COMPLETED) ──

    document.querySelectorAll('.btnCompletePickup').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id = btn.dataset.id;
            const ok = await applyOrderStatusChange(btn, id, STATUS.COMPLETED,
            {
                confirmMessage: 'Mark ' + id + ' as picked up?'
            });

            if (ok)
            {
                // [REVIEWS HOOK: Trigger post-pickup SMS feedback survey]

                showToast('success', id + ' — pickup completed.');

                renderPage('orders', { tab: 'completed' });
            }

        });

    });

    // ── Row Click → Order Detail Drawer (desktop table) ──

    const tbody = document.getElementById('ordersTableBody');

    if (tbody)
    {

        tbody.addEventListener('click', function(e)
        {

            if (e.target.closest('button'))
            {
                return;
            }

            const row = e.target.closest('.orderTableRow');

            if (row)
            {
                showOrderDrawer(row.dataset.id);
            }

        });

    }

    // ── Card Tap → Order Detail Drawer (mobile card list) ──

    const cardList = document.getElementById('ordersCardList');

    if (cardList)
    {

        cardList.addEventListener('click', function(e)
        {

            if (e.target.closest('button') || e.target.closest('a'))
            {
                return;
            }

            const card = e.target.closest('.orderCard');

            if (card)
            {
                showOrderDrawer(card.dataset.id);
            }

        });

    }

}


/* ============================================================
   ORDER DETAIL DRAWER
============================================================ */

function showOrderDrawer(orderId)
{

    const order = ORDERS.find(function(o) { return o.id === orderId; });

    if (!order)
    {
        return;
    }

    closeOrderDrawer();

    // ── Overlay ──

    const overlay = document.createElement('div');
    overlay.id        = 'orderDrawerOverlay';
    overlay.className = 'drawerOverlay';
    overlay.addEventListener('click', closeOrderDrawer);
    document.body.appendChild(overlay);

    // ── Status Timeline ──

    const isCancelled = order.status === STATUS.CANCELLED;
    const currentPos  = WORKFLOW_POSITION[order.status] !== undefined
        ? WORKFLOW_POSITION[order.status]
        : 0;

    const timelineHTML = isCancelled
        ? `<div style="font-size: 0.82rem; color: var(--clrRed); font-weight: 600;">Order cancelled.</div>`
        : WORKFLOW_STEPS.map(function(step, idx)
        {

            const isDone    = idx < currentPos;
            const isCurrent = idx === currentPos;
            const cssClass  = isCurrent
                ? 'timelineStepCurrent'
                : isDone
                    ? 'timelineStepDone'
                    : 'timelineStepPending';

            return `
                <div class="timelineStep ${cssClass}">
                    <div class="timelineStepDot"></div>
                    <div class="timelineStepLabel">${STATUS_LABELS[step]}</div>
                </div>
            `;

        }).join('');

    // ── Actions section (status-driven) ──

    let drawerActionsHTML = '';

    if (order.status === STATUS.NEW_REQUEST)
    {
        drawerActionsHTML = `
            <button class="btn btnPrimary btnSm btnDrawerContactCustomer" data-id="${order.id}">Contact Customer</button>
            <button class="btn btnGreen btnSm btnDrawerMarkPaid" data-id="${order.id}">Mark Paid</button>
            <button class="btn btnRed btnSm btnDrawerRejectOrder" data-id="${order.id}">Reject Order</button>
        `;
    }
    else if (order.status === STATUS.AWAITING_PAYMENT)
    {
        drawerActionsHTML = `
            <button class="btn btnGreen btnSm btnDrawerMarkPaid" data-id="${order.id}">Mark Paid</button>
            <button class="btn btnRed btnSm btnDrawerCancelOrder" data-id="${order.id}">Cancel Order</button>
        `;
    }
    else if (order.status === STATUS.CONFIRMED)
    {
        drawerActionsHTML = `<span class="drawerAwaitingNote">Awaiting production day</span>`;
    }
    else if (order.status === STATUS.IN_PRODUCTION)
    {
        drawerActionsHTML = `<button class="btn btnGreen btnSm btnDrawerReadyForPickup" data-id="${order.id}">Ready for Pickup</button>`;
    }
    else if (order.status === STATUS.PENDING_PICKUP)
    {
        drawerActionsHTML = `<button class="btn btnPrimary btnSm btnDrawerCompletePickup" data-id="${order.id}">Complete Pickup</button>`;
    }

    const drawerActionsSection = drawerActionsHTML
        ? `
            <div class="drawerSection">
                <div class="drawerLabel">Actions</div>
                <div class="drawerActions">
                    ${drawerActionsHTML}
                </div>
            </div>
        `
        : '';

    // ── Notes section ──

    const notesSection = order.notes
        ? `
            <div class="drawerSection">
                <div class="drawerLabel">Notes</div>
                <div class="drawerNotes">${esc(order.notes)}</div>
            </div>
        `
        : '';

    const submittedDate = order.submittedAt
        ? formatDate(order.submittedAt.split('T')[0])
        : '—';

    // ── Drawer Panel ──

    const drawer = document.createElement('div');
    drawer.id        = 'orderDrawer';
    drawer.className = 'orderDrawer';

    drawer.innerHTML = `

        <div class="drawerHeader">
            <div>
                <div class="drawerTitle">${order.id}</div>
                ${buildBadge(order.status)}
            </div>
            <button class="drawerCloseBtn" id="drawerCloseBtn" aria-label="Close drawer">&#x2715;</button>
        </div>

        <div class="drawerBody">

            <div class="drawerSection">
                <div class="drawerLabel">Customer</div>
                <div class="drawerValue">${esc(order.customer)}</div>
                ${order.phone ? `<a class="drawerPhoneLink" href="tel:${phoneDigits(order.phone)}">${esc(formatPhone(order.phone))}</a>` : ''}
            </div>

            <div class="drawerSection">
                <div class="drawerLabel">Products</div>
                <div class="drawerValue">${esc(order.products)}</div>
            </div>

            <div class="drawerSection">
                <div class="drawerLabel">Pickup</div>
                <div class="drawerValue">${order.pickupDay}${order.pickupDate ? ' · ' + formatDate(order.pickupDate) : ''}${order.pickupTime ? ' · ' + esc(order.pickupTime) : ''}</div>
            </div>

            ${notesSection}

            <div class="drawerSection">
                <div class="drawerLabel">Payment</div>
                <div class="drawerPaymentRow">
                    ${buildBadge(order.paymentStatus)}
                    ${order.productTotal > 0 ? `<span class="drawerValue">${formatCurrency(order.productTotal)}</span>` : ''}
                </div>
            </div>

            <div class="drawerSection">
                <div class="drawerLabel">Order Progress</div>
                <div class="drawerTimeline">
                    ${timelineHTML}
                </div>
            </div>

            ${drawerActionsSection}

            <div class="drawerSection drawerMetaSection">
                <div class="drawerLabel">Submitted</div>
                <div class="drawerValue">${submittedDate}</div>
            </div>

        </div>

    `;

    document.body.appendChild(drawer);

    requestAnimationFrame(function()
    {
        drawer.classList.add('isOpen');
        overlay.classList.add('isVisible');
    });

    document.getElementById('drawerCloseBtn').addEventListener('click', closeOrderDrawer);

    // ── Contact Customer (drawer) ──

    const drawerContactBtn = drawer.querySelector('.btnDrawerContactCustomer');

    if (drawerContactBtn)
    {

        drawerContactBtn.addEventListener('click', async function()
        {

            const id    = drawerContactBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });
            const ok    = await applyOrderStatusChange(drawerContactBtn, id, STATUS.AWAITING_PAYMENT);

            if (ok)
            {
                // [TWILIO HOOK: Log outbound contact attempt]

                // esc() — customer names originate from public website input
                showToast('info', 'Call or text ' + esc(found ? found.customer : id) + ' and share payment details.');

                closeOrderDrawer();

                renderPage('orders', { tab: 'awaitingPayment' });
            }

        });

    }

    // ── Mark Paid (drawer) ──

    const drawerMarkPaidBtn = drawer.querySelector('.btnDrawerMarkPaid');

    if (drawerMarkPaidBtn)
    {

        drawerMarkPaidBtn.addEventListener('click', async function()
        {

            const id = drawerMarkPaidBtn.dataset.id;
            const ok = await applyOrderStatusChange(drawerMarkPaidBtn, id, STATUS.CONFIRMED,
            {
                paymentStatus:  'paid',
                confirmMessage: 'Mark ' + id + ' as paid and confirmed?'
            });

            if (ok)
            {
                // [TWILIO HOOK: SMS confirmation to customer]
                // [CALENDAR HOOK: Create Google Calendar event for pickup date]

                showToast('success', id + ' paid and confirmed.');

                closeOrderDrawer();

                renderPage('orders', { tab: 'confirmedQueue' });
            }

        });

    }

    // ── Reject Order (drawer) ──

    const drawerRejectBtn = drawer.querySelector('.btnDrawerRejectOrder');

    if (drawerRejectBtn)
    {

        drawerRejectBtn.addEventListener('click', async function()
        {

            const id    = drawerRejectBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (!found) { return; }

            const ok = await applyOrderStatusChange(drawerRejectBtn, id, STATUS.CANCELLED,
            {
                confirmMessage: 'Reject order ' + id + ' from ' + found.customer + '?'
            });

            if (ok)
            {
                showToast('info', id + ' rejected.');

                closeOrderDrawer();

                renderPage('orders', { tab: 'newRequest' });
            }

        });

    }

    // ── Cancel Order (drawer) ──

    const drawerCancelBtn = drawer.querySelector('.btnDrawerCancelOrder');

    if (drawerCancelBtn)
    {

        drawerCancelBtn.addEventListener('click', async function()
        {

            const id    = drawerCancelBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (!found) { return; }

            const ok = await applyOrderStatusChange(drawerCancelBtn, id, STATUS.CANCELLED,
            {
                confirmMessage: 'Cancel order ' + id + ' for ' + found.customer + '?'
            });

            if (ok)
            {
                showToast('info', id + ' cancelled.');

                closeOrderDrawer();

                renderPage('orders', { tab: 'cancelled' });
            }

        });

    }

    // ── Ready for Pickup (drawer) ──

    const drawerReadyBtn = drawer.querySelector('.btnDrawerReadyForPickup');

    if (drawerReadyBtn)
    {

        drawerReadyBtn.addEventListener('click', async function()
        {

            const id = drawerReadyBtn.dataset.id;
            const ok = await applyOrderStatusChange(drawerReadyBtn, id, STATUS.PENDING_PICKUP,
            {
                confirmMessage: 'Mark ' + id + ' ready for pickup?'
            });

            if (ok)
            {
                // [TWILIO HOOK: SMS to customer — order is ready]

                showToast('success', id + ' ready for pickup.');

                closeOrderDrawer();

                renderPage('orders', { tab: 'pendingPickup' });
            }

        });

    }

    // ── Complete Pickup (drawer) ──

    const drawerCompleteBtn = drawer.querySelector('.btnDrawerCompletePickup');

    if (drawerCompleteBtn)
    {

        drawerCompleteBtn.addEventListener('click', async function()
        {

            const id = drawerCompleteBtn.dataset.id;
            const ok = await applyOrderStatusChange(drawerCompleteBtn, id, STATUS.COMPLETED,
            {
                confirmMessage: 'Mark ' + id + ' as picked up?'
            });

            if (ok)
            {
                // [REVIEWS HOOK: Trigger post-pickup SMS feedback survey]

                showToast('success', id + ' — pickup completed.');

                closeOrderDrawer();

                renderPage('orders', { tab: 'completed' });
            }

        });

    }

    document.addEventListener('keydown', handleDrawerEsc);

}

function handleDrawerEsc(e)
{

    if (e.key === 'Escape')
    {
        closeOrderDrawer();
    }

}

function closeOrderDrawer()
{

    const drawer  = document.getElementById('orderDrawer');
    const overlay = document.getElementById('orderDrawerOverlay');

    if (drawer)
    {
        drawer.classList.remove('isOpen');
        setTimeout(function() { drawer.remove(); }, 250);
    }

    if (overlay)
    {
        overlay.classList.remove('isVisible');
        setTimeout(function() { overlay.remove(); }, 250);
    }

    document.removeEventListener('keydown', handleDrawerEsc);

}


/* ============================================================
   PRODUCTION PAGE

   Three sections with single responsibility:

   1. Confirmed Queue — paid orders waiting for their production day.
      Sorted by pickup date ascending. Data structure is calendar-ready:
      a future Calendar page needs only to group these by pickupDate.

   2. Today's Production — status === IN_PRODUCTION only.
      Apps Script moves eligible CONFIRMED orders into IN_PRODUCTION.
      Production days are configured in Settings via BAKERY_CONFIG.productionDays.
      No date logic here. No manual movement required by the owner.

   3. Pending Pickup — orders made and waiting for customer arrival.
============================================================ */

function renderProductionPage()
{

    // Confirmed Queue — paid, awaiting Apps Script to move them to IN_PRODUCTION
    const confirmedQueueOrders = ORDERS
        .filter(function(o) { return o.status === STATUS.CONFIRMED; })
        .sort(function(a, b) { return a.pickupDate.localeCompare(b.pickupDate); });

    // Today's Production — orders Apps Script has moved to IN_PRODUCTION
    const todaysProductionOrders = ORDERS.filter(function(o)
    {
        return o.status === STATUS.IN_PRODUCTION;
    });

    // Pending Pickup — finished, waiting for customer
    const pendingPickupOrders = ORDERS.filter(function(o)
    {
        return o.status === STATUS.PENDING_PICKUP;
    });

    const totalActive = confirmedQueueOrders.length
        + todaysProductionOrders.length
        + pendingPickupOrders.length;

    // ── Section 1: Confirmed Queue ──

    const confirmedQueueHTML = !ordersLoaded
        ? `<div class="productionEmpty">${buildLoadingIndicator('Loading orders…')}</div>`
        : confirmedQueueOrders.length > 0
        ? confirmedQueueOrders.map(function(order)
        {

            return `
                <div class="productionQueueRow">
                    <div class="pqrId">${esc(order.id)}</div>
                    <div class="pqrCustomer">${esc(order.customer)}</div>
                    <div class="pqrProducts">${esc(order.products)}</div>
                    <div class="pqrPickup">${order.pickupDay} · ${formatDateShort(order.pickupDate)}</div>
                    <div class="pqrNote">Scheduled for ${order.pickupDay}</div>
                </div>
            `;

        }).join('')
        : `<div class="productionEmpty">No orders in the confirmed queue</div>`;

    // ── Section 1 (mobile card variant) — same data, card layout ──
    // Reuses .productionCard/.productionCardFooter exactly as Today's
    // Production does below, so no new CSS is needed for the cards
    // themselves — only the container toggle that shows this instead
    // of .productionQueueTable at phone/tablet widths.

    const confirmedQueueCardsHTML = !ordersLoaded
        ? `<div class="productionEmpty">${buildLoadingIndicator('Loading orders…')}</div>`
        : confirmedQueueOrders.length > 0
        ? confirmedQueueOrders.map(function(order)
        {

            return `
                <div class="productionCard">
                    <div class="productionCardId">${esc(order.id)}</div>
                    <div class="productionCardCustomer">${esc(order.customer)}</div>
                    <div class="productionCardProducts">${esc(order.products)}</div>
                    <div class="productionCardFooter">
                        ${buildBadge(order.status)}
                        <div class="productionCardTime">${order.pickupDay} · ${formatDateShort(order.pickupDate)}</div>
                    </div>
                </div>
            `;

        }).join('')
        : `<div class="productionEmpty">No orders in the confirmed queue</div>`;

    // ── Section 2: Today's Production ──

    const todaysProductionHTML = !ordersLoaded
        ? `<div class="productionEmpty">${buildLoadingIndicator('Loading orders…')}</div>`
        : todaysProductionOrders.length > 0
        ? todaysProductionOrders.map(function(order)
        {
            return `
                <div class="productionCard">
                    <div class="productionCardId">${esc(order.id)}</div>
                    <div class="productionCardCustomer">${esc(order.customer)}</div>
                    <div class="productionCardProducts">${esc(order.products)}</div>
                    ${order.notes ? `<div class="productionCardNotes">${esc(order.notes)}</div>` : ''}
                    <div class="productionCardFooter">
                        ${buildBadge(order.status)}
                        <div class="productionCardTime">${esc(order.pickupTime || '')}</div>
                        <button class="btn btnGreen btnSm btnAdvanceProduction" data-id="${order.id}" data-next="${STATUS.PENDING_PICKUP}">Mark Ready for Pickup</button>
                    </div>
                </div>
            `;
        }).join('')
        : `<div class="productionEmpty">No orders currently in production. Apps Script will move confirmed orders here when production begins.</div>`;

    // ── Section 3: Pending Pickup ──

    const pendingPickupHTML = !ordersLoaded
        ? `<div class="productionEmpty">${buildLoadingIndicator('Loading orders…')}</div>`
        : pendingPickupOrders.length > 0
        ? pendingPickupOrders.map(function(order)
        {

            return `
                <div class="pickupQueueRow">
                    <div class="pkrCustomer">${esc(order.customer)}</div>
                    <div class="pkrProducts">${esc(order.products)}</div>
                    <div class="pkrTime">${order.pickupDay}${order.pickupDate ? ' · ' + formatDateShort(order.pickupDate) : ''}${order.pickupTime ? ' · ' + esc(order.pickupTime) : ''}</div>
                    <button class="btn btnPrimary btnSm btnCompletePickupProduction" data-id="${order.id}">Complete Pickup</button>
                </div>
            `;

        }).join('')
        : `<div class="productionEmpty">No orders waiting for pickup</div>`;

    // ── Section 3 (mobile card variant) — same data, card layout ──
    // Reuses the exact .btnCompletePickupProduction class, so
    // initializeProductionActions() wires this button with no changes.

    const pendingPickupCardsHTML = !ordersLoaded
        ? `<div class="productionEmpty">${buildLoadingIndicator('Loading orders…')}</div>`
        : pendingPickupOrders.length > 0
        ? pendingPickupOrders.map(function(order)
        {

            return `
                <div class="productionCard">
                    <div class="productionCardId">${esc(order.id)}</div>
                    <div class="productionCardCustomer">${esc(order.customer)}</div>
                    <div class="productionCardProducts">${esc(order.products)}</div>
                    <div class="productionCardFooter">
                        ${buildBadge(STATUS.PENDING_PICKUP)}
                        <div class="productionCardTime">${order.pickupDay}${order.pickupDate ? ' · ' + formatDateShort(order.pickupDate) : ''}${order.pickupTime ? ' · ' + esc(order.pickupTime) : ''}</div>
                        <button class="btn btnPrimary btnSm btnCompletePickupProduction" data-id="${order.id}">Complete Pickup</button>
                    </div>
                </div>
            `;

        }).join('')
        : `<div class="productionEmpty">No orders waiting for pickup</div>`;

    return `

        <div class="pageHeader">
            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Production</div>
                <div class="pageHeaderSub">${totalActive} active order${totalActive !== 1 ? 's' : ''} · ${todaysProductionOrders.length} in today&rsquo;s production · ${pendingPickupOrders.length} pending pickup</div>
            </div>
        </div>

        <div class="productionSectionLabel">Confirmed Queue</div>
        <div class="productionSectionSub">Paid orders awaiting their production day, sorted by pickup date.</div>
        <div class="productionQueueTable" style="margin-bottom: 2rem;">
            ${confirmedQueueHTML}
        </div>
        <div class="productionCards productionMobileOnly" style="margin-bottom: 2rem;">
            ${confirmedQueueCardsHTML}
        </div>

        <div class="productionSectionLabel">Today&rsquo;s Production</div>
        <div class="productionSectionSub">Orders moved here by Apps Script when production begins. Mark each ready when complete.</div>
        <div class="productionCards" style="margin-bottom: 2rem;">
            ${todaysProductionHTML}
        </div>

        <div class="productionSectionLabel">Pending Pickup</div>
        <div class="productionSectionSub">Made and ready — waiting for customer arrival.</div>
        <div class="pickupQueueTable">
            ${pendingPickupHTML}
        </div>
        <div class="productionCards productionMobileOnly">
            ${pendingPickupCardsHTML}
        </div>

    `;

}

function initializeProductionActions()
{

    // ── Today's Production — Mark Ready for Pickup ──

    document.querySelectorAll('.btnAdvanceProduction').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id         = btn.dataset.id;
            const nextStatus = btn.dataset.next;
            const ok         = await applyOrderStatusChange(btn, id, nextStatus,
            {
                confirmMessage: 'Mark ' + id + ' ready for pickup?'
            });

            if (ok)
            {
                // [TWILIO HOOK: SMS to customer — order is ready for pickup]

                showToast('success', id + ' ready for pickup.');

                renderPage('production');
            }

        });

    });

    // ── Pending Pickup — Complete Pickup ──

    document.querySelectorAll('.btnCompletePickupProduction').forEach(function(btn)
    {

        btn.addEventListener('click', async function()
        {

            const id = btn.dataset.id;
            const ok = await applyOrderStatusChange(btn, id, STATUS.COMPLETED,
            {
                confirmMessage: 'Mark ' + id + ' as picked up?'
            });

            if (ok)
            {
                // [REVIEWS HOOK: Trigger post-pickup SMS feedback survey]

                showToast('success', id + ' — pickup completed.');

                renderPage('production');
            }

        });

    });

}


/* ============================================================
   CUSTOMERS PAGE
============================================================ */

function renderCustomersPage()
{

    const tableRows = CUSTOMERS.map(function(customer)
    {

        const phoneTel    = phoneDigits(customer.phone);
        const phoneDisplay = customer.phone
            ? `<a class="phoneTel" href="tel:${phoneTel}">${esc(formatPhone(customer.phone))}</a>`
            : '—';

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <div class="customerAvatar">${getInitials(customer.name)}</div>
                        <span class="tdCustomer">${esc(customer.name)}</span>
                    </div>
                </td>
                <td class="tdMuted">${phoneDisplay}</td>
                <td class="tdMuted">${esc(customer.email)}</td>
                <td style="font-weight: 700; color: var(--clrText);">${customer.lifetimeOrders}</td>
                <td style="font-weight: 700; color: var(--clrGreen);">${formatCurrency(customer.lifetimeSpend)}</td>
                <td class="tdMuted" style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${customer.notes ? esc(customer.notes) : '—'}</td>
            </tr>
        `;

    }).join('');

    // ── Mobile card variant — Avatar, Name, Phone, Email, Lifetime Orders ──

    const customerCards = CUSTOMERS.map(function(customer)
    {

        const phoneTel    = phoneDigits(customer.phone);
        const phoneDisplay = customer.phone
            ? `<a class="customerCardPhone phoneTel" href="tel:${phoneTel}"><i class="fa-solid fa-phone"></i> ${esc(formatPhone(customer.phone))}</a>`
            : '';

        return `
            <div class="customerCard">
                <div class="customerCardTop">
                    <div class="customerAvatar">${getInitials(customer.name)}</div>
                    <div class="customerCardName">${esc(customer.name)}</div>
                </div>
                ${phoneDisplay}
                <div class="customerCardEmail">${esc(customer.email)}</div>
                <div class="customerCardOrders"><strong>${customer.lifetimeOrders}</strong> lifetime order${customer.lifetimeOrders === 1 ? '' : 's'}</div>
            </div>
        `;

    }).join('');

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Customers</div>
                <div class="pageHeaderSub">${CUSTOMERS.length} customers on record</div>
            </div>

        </div>

        <div class="tableWrapper customersTableWrapper">

            <table class="dataTable">

                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Lifetime Orders</th>
                        <th>Lifetime Spend</th>
                        <th>Notes</th>
                    </tr>
                </thead>

                <tbody>
                    ${tableRows}
                </tbody>

            </table>

        </div>

        <div class="customersCardList">
            ${customerCards}
        </div>

    `;

}


/* ============================================================
   REVIEWS PAGE — Internal Customer Feedback
============================================================ */

function renderReviewsPage()
{

    const openCount     = REVIEWS_DATA.filter(function(r) { return r.resolutionStatus === 'open'; }).length;
    const resolvedCount = REVIEWS_DATA.filter(function(r) { return r.resolutionStatus === 'resolved'; }).length;

    const feedbackCards = REVIEWS_DATA.map(function(fb)
    {

        const isResolved = fb.resolutionStatus === 'resolved';

        const statusBadge = isResolved
            ? `<span class="badge badgeConfirmed">Resolved</span>`
            : `<span class="badge badgeContacted">Open</span>`;

        const resolveBtn = !isResolved
            ? `<button class="btn btnGreen btnSm btnMarkResolved" data-id="${fb.id}">Mark Resolved</button>`
            : '';

        const phoneTel = phoneDigits(fb.phone);

        return `
            <div class="feedbackCard ${isResolved ? 'isResolved' : 'isOpen'}">
                <div class="feedbackCardTop">
                    <div class="feedbackCardInfo">
                        <div class="feedbackCustomer">${esc(fb.customer)}</div>
                        <div class="feedbackMeta">
                            ${fb.phone ? `<a class="feedbackPhone phoneTel" href="tel:${phoneTel}">${esc(formatPhone(fb.phone))}</a>` : ''}
                            <span>·</span>
                            <span>${formatDate(fb.date)}</span>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0;">
                        <div class="feedbackRating">${buildStars(fb.rating)}</div>
                        ${statusBadge}
                    </div>
                </div>
                <div class="feedbackIssue">${esc(fb.issue)}</div>
                ${fb.notes ? `<div class="feedbackNotes">${esc(fb.notes)}</div>` : ''}
                ${resolveBtn ? `<div class="feedbackActions">${resolveBtn}</div>` : ''}
            </div>
        `;

    }).join('');

    const emptyState = REVIEWS_DATA.length === 0
        ? `<div class="emptyState"><i class="fa-solid fa-comment-dots" style="font-size:2rem;color:var(--clrPurpleLight);margin-bottom:0.75rem;"></i><div class="emptyStateTitle">No customer feedback yet</div><div class="emptyStateSub">When customers submit private feedback through your review system, it will appear here so you can resolve issues before they become public Google reviews.</div></div>`
        : '';

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Reviews</div>
                <div class="pageHeaderSub">Internal customer feedback · ${openCount} open · ${resolvedCount} resolved</div>
            </div>

        </div>

        <div style="background: var(--clrAmberBg); border: 1px solid var(--clrAmberBorder); border-radius: var(--radiusSm); padding: 0.65rem 1rem; margin-bottom: 1.25rem; font-size: 0.8rem; color: var(--clrAmber);">
            <i class="fa-solid fa-triangle-exclamation" style="margin-right: 0.4rem;"></i>
            This page tracks unhappy customers privately — not public Google reviews. Resolve issues before they post publicly.
        </div>

        <div class="feedbackList">
            ${feedbackCards}
            ${emptyState}
        </div>

    `;

}

function initializeReviewsActions()
{

    document.querySelectorAll('.btnMarkResolved').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id = btn.dataset.id;
            const fb = REVIEWS_DATA.find(function(r) { return r.id === id; });

            if (fb)
            {
                fb.resolutionStatus = 'resolved';

                // [SUPABASE HOOK: PATCH customer_feedback table]

                showToast('success', fb.customer + '\'s feedback marked resolved.');

                renderPage('reviews');
            }

        });

    });

}


/* ============================================================
   REPORTS PAGE
============================================================ */

function renderReportsPage()
{

    // [SUPABASE HOOK: Replace REPORTS_DATA with live aggregate queries on the orders table]

    const data     = REPORTS_DATA;
    const hasCharts = data.weeklyOrders.length > 0 || data.productPopularity.length > 0;

    const chartsOrEmptyState = hasCharts
        ? (function()
        {
            const maxOrderCount    = Math.max.apply(null, data.weeklyOrders.map(function(d) { return d.count; }));
            const maxProductOrders = Math.max.apply(null, data.productPopularity.map(function(d) { return d.orders; }));

            const orderBars = data.weeklyOrders.map(function(day)
            {
                const barPx = maxOrderCount > 0 ? Math.max(4, Math.round((day.count / maxOrderCount) * 88)) : 4;

                return `
                    <div class="barChartItem">
                        <div class="barChartFill colorPurple" style="height: ${barPx}px"></div>
                        <div class="barChartLabel">${day.label}<br>${day.count}</div>
                    </div>
                `;
            }).join('');

            const productBars = data.productPopularity.map(function(product)
            {
                const pct = maxProductOrders > 0 ? Math.round((product.orders / maxProductOrders) * 100) : 0;

                return `
                    <div class="hBarItem">
                        <div class="hBarName">${product.name}</div>
                        <div class="hBarTrack"><div class="hBarFill" style="width: ${pct}%"></div></div>
                        <div class="hBarCount">${product.orders}</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="reportsGrid">
                    <div class="reportCard">
                        <div class="reportCardTitle">Weekly Orders</div>
                        <div class="barChart">${orderBars}</div>
                    </div>
                    <div class="reportCard">
                        <div class="reportCardTitle">Popular Products</div>
                        <div class="hBarChart" style="margin-top: 0.5rem;">${productBars}</div>
                    </div>
                </div>
            `;
        })()
        : `<div class="emptyState"><i class="fa-solid fa-chart-line" style="font-size:2rem;color:var(--clrPurpleLight);margin-bottom:0.75rem;"></i><div class="emptyStateTitle">No reporting data yet</div><div class="emptyStateSub">As customers begin placing orders, your reports and business insights will automatically appear here.</div></div>`;

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Reports</div>
                <div class="pageHeaderSub">Business performance overview</div>
            </div>

        </div>

        <div class="reportsSumGrid">

            <div class="reportsSumCardNew">
                <div class="reportsSumCardNewValue">${data.weeklyRevenueSummary.orderCount}</div>
                <div class="reportsSumCardNewLabel">Orders This Week</div>
            </div>

            <div class="reportsSumCardNew">
                <div class="reportsSumCardNewValue">${formatCurrency(data.weeklyRevenueSummary.total)}</div>
                <div class="reportsSumCardNewLabel">Revenue</div>
            </div>

            <div class="reportsSumCardNew">
                <div class="reportsSumCardNewValue">${formatCurrency(data.weeklyRevenueSummary.avgOrderValue)}</div>
                <div class="reportsSumCardNewLabel">Average Order</div>
            </div>

            <div class="reportsSumCardNew">
                <div class="reportsSumCardNewValue">${data.repeatCustomers}</div>
                <div class="reportsSumCardNewLabel">Repeat Customers</div>
            </div>

        </div>

        ${chartsOrEmptyState}

    `;

}


/* ============================================================
   SETTINGS PAGE
============================================================ */


/* ── Time Conversion Helpers ── */

/*
    Converts a 12-hour time string ("11:00 AM", "6:00 PM") to the
    24-hour "HH:MM" format required by <input type="time">.
    If the value is already in 24-hour format (no AM/PM), returns as-is.
*/
function to24Hour(timeStr)
{

    if (!timeStr || !/AM|PM/i.test(timeStr)) { return timeStr || ''; }

    var parts     = timeStr.trim().split(' ');
    var period    = parts[1].toUpperCase();
    var timeParts = parts[0].split(':');
    var hours     = parseInt(timeParts[0], 10);
    var minutes   = timeParts[1] || '00';

    if (period === 'AM' && hours === 12) { hours = 0; }
    if (period === 'PM' && hours !== 12) { hours += 12; }

    return (hours < 10 ? '0' : '') + hours + ':' + minutes;

}


/*
    Converts a 24-hour "HH:MM" value from <input type="time"> to
    the 12-hour "H:MM AM/PM" format stored in pickupConfiguration.
*/
function to12Hour(timeStr)
{

    if (!timeStr) { return ''; }

    var timeParts = timeStr.split(':');
    var hours     = parseInt(timeParts[0], 10);
    var minutes   = (timeParts[1] || '00').substring(0, 2);
    var period    = hours >= 12 ? 'PM' : 'AM';
    var h12       = hours % 12 || 12;

    return h12 + ':' + minutes + ' ' + period;

}


/* ── Pickup Window Helpers ── */

/*
    Renders the HTML for a single pickup window row.
    win may be null when adding a new empty window.
    index is 0-based and used for the "Window N" label.
*/
function renderPickupWindowHTML(win, index)
{

    var allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var days    = win && Array.isArray(win.days) ? win.days : [];
    var start   = win && win.start ? to24Hour(win.start) : '';
    var end     = win && win.end   ? to24Hour(win.end)   : '';

    var dayButtons = allDays.map(function(day)
    {
        var isActive = days.indexOf(day) !== -1;
        return '<button class="pickupWindowDay ' + (isActive ? 'isActive' : '') + '" type="button" data-day="' + day + '">' + day + '</button>';
    }).join('');

    return `
        <div class="pickupWindowRow">

            <div class="pickupWindowHeader">
                <span class="pickupWindowLabel">Window ${index + 1}</span>
                <button class="btn btnRed btnSm pickupWindowRemoveBtn" type="button">
                    <i class="fa-solid fa-trash-can"></i> Remove
                </button>
            </div>

            <div class="pickupWindowDays">
                ${dayButtons}
            </div>

            <div class="pickupWindowTimes">
                <div class="pickupWindowTimeGroup">
                    <label class="formLabel">Start</label>
                    <input class="formInput pickupWindowStart" type="time" value="${start}">
                </div>
                <div class="pickupWindowTimeGroup">
                    <label class="formLabel">End</label>
                    <input class="formInput pickupWindowEnd" type="time" value="${end}">
                </div>
            </div>

        </div>
    `;

}


/*
    Wires day toggle clicks and remove buttons within a container.
    Called on initial render and on each newly appended window row.
*/
function initializePickupWindowInteractions(container)
{

    container.querySelectorAll('.pickupWindowDay').forEach(function(btn)
    {
        btn.addEventListener('click', function()
        {
            btn.classList.toggle('isActive');
        });
    });

    container.querySelectorAll('.pickupWindowRemoveBtn').forEach(function(btn)
    {
        btn.addEventListener('click', function()
        {
            var row = btn.closest('.pickupWindowRow');
            if (row) { row.remove(); }
            renumberPickupWindows();
        });
    });

    container.querySelectorAll('[type="time"]').forEach(function(input)
    {
        input.addEventListener('click', function()
        {
            try { input.showPicker(); }
            catch (e) {}
        });
    });

}


/*
    Updates "Window N" labels after a row is removed.
*/
function renumberPickupWindows()
{

    document.querySelectorAll('.pickupWindowRow').forEach(function(row, i)
    {
        var label = row.querySelector('.pickupWindowLabel');
        if (label) { label.textContent = 'Window ' + (i + 1); }
    });

}


function renderSettingsPage()
{

    const config  = BAKERY_CONFIG;
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const dayToggles = allDays.map(function(day)
    {

        const isActive = config.productionDays.includes(day);

        return `<button class="dayToggle ${isActive ? 'isActive' : ''}" data-day="${day}">${day}</button>`;

    }).join('');

    const capacityRows = allDays.map(function(day)
    {

        const isActive = config.productionDays.includes(day);
        const capacity = config.dailyCapacity[day] !== undefined ? config.dailyCapacity[day] : 0;

        return `
            <div class="capacityRow ${isActive ? '' : 'isInactive'}" data-day="${day}">
                <span class="capacityDayLabel">${day}</span>
                <input
                    class="formInput capacityInput"
                    type="number"
                    min="0"
                    max="999"
                    value="${capacity}"
                    data-day="${day}"
                    placeholder="0"
                    ${isActive ? '' : 'disabled'}
                >
            </div>
        `;

    }).join('');

    const pickupConfig      = config.pickupConfiguration || { message: '', windows: [] };
    const pickupWindows     = Array.isArray(pickupConfig.windows) && pickupConfig.windows.length > 0
        ? pickupConfig.windows
        : null;
    const pickupWindowsHTML = pickupWindows
        ? pickupWindows.map(function(win, i) { return renderPickupWindowHTML(win, i); }).join('')
        : renderPickupWindowHTML(null, 0);

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Settings</div>
                <div class="pageHeaderSub">Business details, schedule, and social links</div>
            </div>

        </div>

        <div class="settingsGrid">

            <!-- Business Information -->
            <div class="settingsCard">

                <div class="settingsCardHeader">
                    <i class="fa-solid fa-store" style="color: var(--clrPurpleLight); margin-right: 0.4rem;"></i>
                    Business Information
                </div>

                <div class="settingsCardBody">

                    <div class="formGroup">
                        <label class="formLabel">Business Name</label>
                        <input class="formInput" type="text" id="settBusinessName" value="${esc(config.businessName)}" placeholder="Business name">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Owner Name</label>
                        <input class="formInput" type="text" id="settOwnerName" value="${esc(config.ownerFullName)}" placeholder="Owner name">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Phone</label>
                        <input class="formInput" type="tel" id="settPhone" value="${esc(config.phone)}" placeholder="Phone number">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Address</label>
                        <input class="formInput" type="text" id="settAddress" value="${esc(config.address)}" placeholder="Business address">
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn settSaveBusinessInfo">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>

                </div>

            </div>

            <!-- Production Schedule -->
            <div class="settingsCard">

                <div class="settingsCardHeader">
                    <i class="fa-solid fa-fire-burner" style="color: var(--clrPurpleLight); margin-right: 0.4rem;"></i>
                    Production Schedule
                </div>

                <div class="settingsCardBody">

                    <div class="formGroup">
                        <label class="formLabel">Active Production Days</label>
                        <p class="formHint">Select the days you produce and fulfill orders each week. Today&rsquo;s Production updates automatically when you change this.</p>
                        <div class="pickupDaysGrid">
                            ${dayToggles}
                        </div>
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Daily Order Capacity</label>
                        <p class="formHint">Maximum orders you can fulfill per day. Inactive days are locked at zero.</p>
                        <div class="capacityGrid">
                            ${capacityRows}
                        </div>
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn settSaveProductionSchedule">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>

                </div>

            </div>

            <!-- Pickup Configuration -->
            <div class="settingsCard">

                <div class="settingsCardHeader">
                    <i class="fa-solid fa-bag-shopping" style="color: var(--clrPurpleLight); margin-right: 0.4rem;"></i>
                    Pickup Configuration
                </div>

                <div class="settingsCardBody">

                    <div class="formGroup">
                        <label class="formLabel">Pickup Instructions</label>
                        <p class="formHint">Customer-facing pickup message shown on the website.</p>
                        <textarea class="formInput formTextarea formTextareaLg" id="pickupConfigMessage" placeholder="Describe where and how customers should pick up their orders.">${esc(pickupConfig.message || '')}</textarea>
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Pickup Windows</label>
                        <p class="formHint">Set the days and hours available for order pickup.</p>
                        <div class="pickupWindowList" id="pickupWindowList">
                            ${pickupWindowsHTML}
                        </div>
                        <button class="btn btnGhost pickupWindowAddBtn" type="button" id="pickupWindowAddBtn">
                            <i class="fa-solid fa-plus"></i> Add Pickup Window
                        </button>
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn settSavePickupConfiguration">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>

                </div>

            </div>

            <!-- Order Availability -->
            <div class="settingsCard">

                <div class="settingsCardHeader">
                    <i class="fa-solid fa-circle-dot" style="color: var(--clrPurpleLight); margin-right: 0.4rem;"></i>
                    Order Availability
                </div>

                <div class="settingsCardBody">

                    <div class="formGroup">
                        <label class="formLabel">This Week's Status</label>
                        <p class="formHint">Controls whether customers can submit new order requests.</p>
                        <div class="availabilityToggle">
                            <button class="availabilityOption ${config.orderAvailability === 'accepting' ? 'isActive' : ''}" data-value="accepting">
                                <span class="availabilityDot availabilityDotGreen"></span>
                                Accepting Orders
                            </button>
                            <button class="availabilityOption ${config.orderAvailability === 'closed' ? 'isActive' : ''}" data-value="closed">
                                <span class="availabilityDot availabilityDotRed"></span>
                                Closed This Week
                            </button>
                        </div>
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn settSaveOrderAvailability">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>

                </div>

            </div>

            <!-- Social & Website -->
            <div class="settingsCard">

                <div class="settingsCardHeader">
                    <i class="fa-solid fa-link" style="color: var(--clrPurpleLight); margin-right: 0.4rem;"></i>
                    Social &amp; Website
                </div>

                <div class="settingsCardBody">

                    <div class="formGroup">
                        <label class="formLabel">Google Review Link</label>
                        <input class="formInput" type="url" id="settGoogleReview" value="${esc(config.googleReviewLink)}" placeholder="Google review URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Facebook</label>
                        <input class="formInput" type="url" id="settFacebook" value="${esc(config.social.facebook)}" placeholder="Facebook URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">TikTok</label>
                        <input class="formInput" type="url" id="settTiktok" value="${esc(config.social.tiktok)}" placeholder="TikTok URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Instagram</label>
                        <input class="formInput" type="url" id="settInstagram" value="${esc(config.social.instagram)}" placeholder="Instagram URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Website</label>
                        <input class="formInput" type="url" id="settWebsite" value="${esc(config.website)}" placeholder="https://yourwebsite.com">
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn settSaveSocialLinks">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>

                </div>

            </div>

        </div>

    `;

}

async function saveBusinessInfo()
{

    const nameInput  = document.getElementById('settBusinessName');
    const ownerInput = document.getElementById('settOwnerName');
    const phoneInput = document.getElementById('settPhone');
    const addrInput  = document.getElementById('settAddress');

    const payload =
    {
        businessName:  nameInput  ? nameInput.value.trim()  : BAKERY_CONFIG.businessName,
        ownerFullName: ownerInput ? ownerInput.value.trim() : BAKERY_CONFIG.ownerFullName,
        phone:         phoneInput ? phoneInput.value.trim() : BAKERY_CONFIG.phone,
        address:       addrInput  ? addrInput.value.trim()  : BAKERY_CONFIG.address
    };

    const btn = document.querySelector('.settSaveBusinessInfo');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);

        BAKERY_CONFIG.businessName  = payload.businessName;
        BAKERY_CONFIG.ownerFullName = payload.ownerFullName;
        BAKERY_CONFIG.ownerName     = payload.ownerFullName.split(' ')[0];
        BAKERY_CONFIG.phone         = payload.phone;
        BAKERY_CONFIG.address       = payload.address;

        const brandEl = document.getElementById('sidebarBusinessName');
        if (brandEl) { brandEl.textContent = BAKERY_CONFIG.businessName; }

        showToast('success', 'Business information saved.');
    }
    catch (err)
    {
        showToast('warning', 'Could not save business information. Please try again.');
    }
    finally
    {
        setButtonLoading(btn, false);
    }

}

async function saveProductionSchedule()
{

    const activeDays  = [];
    const newCapacity = {};

    document.querySelectorAll('.dayToggle.isActive').forEach(function(toggle)
    {
        activeDays.push(toggle.dataset.day);
    });

    document.querySelectorAll('.capacityInput').forEach(function(input)
    {
        const day = input.dataset.day;
        newCapacity[day] = input.disabled ? 0 : (parseInt(input.value, 10) || 0);
    });

    const payload =
    {
        productionDays: activeDays,
        pickupDays:     activeDays.slice(),
        dailyCapacity:  newCapacity
    };

    const btn = document.querySelector('.settSaveProductionSchedule');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);
        BAKERY_CONFIG.productionDays = payload.productionDays;
        BAKERY_CONFIG.pickupDays     = payload.pickupDays;
        BAKERY_CONFIG.dailyCapacity  = payload.dailyCapacity;
        showToast('success', 'Production schedule saved. Today\'s Production updates automatically.');
    }
    catch (err)
    {
        showToast('warning', 'Could not save production schedule. Please try again.');
    }
    finally
    {
        setButtonLoading(btn, false);
    }

}

async function saveSocialLinks()
{

    const googleInput    = document.getElementById('settGoogleReview');
    const facebookInput  = document.getElementById('settFacebook');
    const tiktokInput    = document.getElementById('settTiktok');
    const instagramInput = document.getElementById('settInstagram');
    const websiteInput   = document.getElementById('settWebsite');

    // API keys use "Url" suffix; BAKERY_CONFIG uses different names.
    // Mapping applied here at the API boundary.
    const payload =
    {
        googleReviewUrl: googleInput    ? googleInput.value.trim()    : BAKERY_CONFIG.googleReviewLink,
        facebookUrl:     facebookInput  ? facebookInput.value.trim()  : BAKERY_CONFIG.social.facebook,
        tiktokUrl:       tiktokInput    ? tiktokInput.value.trim()    : BAKERY_CONFIG.social.tiktok,
        instagramUrl:    instagramInput ? instagramInput.value.trim() : BAKERY_CONFIG.social.instagram,
        websiteUrl:      websiteInput   ? websiteInput.value.trim()   : BAKERY_CONFIG.website
    };

    const btn = document.querySelector('.settSaveSocialLinks');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);
        BAKERY_CONFIG.googleReviewLink = payload.googleReviewUrl;
        BAKERY_CONFIG.social.facebook  = payload.facebookUrl;
        BAKERY_CONFIG.social.tiktok    = payload.tiktokUrl;
        BAKERY_CONFIG.social.instagram = payload.instagramUrl;
        BAKERY_CONFIG.website          = payload.websiteUrl;
        showToast('success', 'Social links saved.');
    }
    catch (err)
    {
        showToast('warning', 'Could not save social links. Please try again.');
    }
    finally
    {
        setButtonLoading(btn, false);
    }

}

async function saveOrderAvailability()
{

    const activeBtn = document.querySelector('.availabilityOption.isActive');

    if (!activeBtn)
    {
        showToast('warning', 'Please select an availability option.');
        return;
    }

    const payload = { orderAvailability: activeBtn.dataset.value };

    const btn = document.querySelector('.settSaveOrderAvailability');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);
        BAKERY_CONFIG.orderAvailability = payload.orderAvailability;
        showToast('success', 'Order availability saved.');
    }
    catch (err)
    {
        showToast('warning', 'Could not save order availability. Please try again.');
    }
    finally
    {
        setButtonLoading(btn, false);
    }

}

async function savePickupConfiguration()
{

    const messageEl = document.getElementById('pickupConfigMessage');
    const message   = messageEl ? messageEl.value.trim() : '';

    const windows = [];

    document.querySelectorAll('.pickupWindowRow').forEach(function(row)
    {

        var days  = [];
        var start = '';
        var end   = '';

        row.querySelectorAll('.pickupWindowDay.isActive').forEach(function(btn)
        {
            days.push(btn.dataset.day);
        });

        var startInput = row.querySelector('.pickupWindowStart');
        var endInput   = row.querySelector('.pickupWindowEnd');

        if (startInput && startInput.value) { start = to12Hour(startInput.value); }
        if (endInput   && endInput.value)   { end   = to12Hour(endInput.value); }

        if (days.length > 0 && start !== '' && end !== '')
        {
            windows.push({ days: days, start: start, end: end });
        }

    });

    const newConfig = { message: message, windows: windows };
    const payload   = { pickupConfiguration: newConfig };

    const btn = document.querySelector('.settSavePickupConfiguration');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);
        BAKERY_CONFIG.pickupConfiguration = newConfig;
        showToast('success', 'Pickup configuration saved.');
    }
    catch (err)
    {
        showToast('warning', 'Could not save pickup configuration. Please try again.');
    }
    finally
    {
        setButtonLoading(btn, false);
    }

}

function initializeSettingsInteractions()
{

    // ── Day Toggles ──

    document.querySelectorAll('.dayToggle').forEach(function(toggle)
    {

        toggle.addEventListener('click', function()
        {

            toggle.classList.toggle('isActive');

            const day         = toggle.dataset.day;
            const isNowActive = toggle.classList.contains('isActive');

            const capacityRow   = document.querySelector('.capacityRow[data-day="' + day + '"]');
            const capacityInput = document.querySelector('.capacityInput[data-day="' + day + '"]');

            if (capacityRow)
            {
                capacityRow.classList.toggle('isInactive', !isNowActive);
            }

            if (capacityInput)
            {
                capacityInput.disabled = !isNowActive;

                if (!isNowActive)
                {
                    capacityInput.dataset.savedCapacity = capacityInput.value;
                    capacityInput.value                 = 0;
                }
                else if (capacityInput.dataset.savedCapacity !== undefined)
                {
                    capacityInput.value = capacityInput.dataset.savedCapacity;
                }
            }

        });

    });

    // ── Number Input Auto-Select ──

    document.querySelectorAll('.settingsGrid [type="number"]').forEach(function(input)
    {
        input.addEventListener('focus', function()
        {
            input.select();
        });
    });

    // ── Availability Toggle ──

    document.querySelectorAll('.availabilityOption').forEach(function(option)
    {

        option.addEventListener('click', function()
        {

            document.querySelectorAll('.availabilityOption').forEach(function(o)
            {
                o.classList.remove('isActive');
            });

            option.classList.add('isActive');

        });

    });

    // ── Save Buttons ──

    const saveBusinessInfoBtn = document.querySelector('.settSaveBusinessInfo');
    if (saveBusinessInfoBtn) { saveBusinessInfoBtn.addEventListener('click', saveBusinessInfo); }

    const saveScheduleBtn = document.querySelector('.settSaveProductionSchedule');
    if (saveScheduleBtn) { saveScheduleBtn.addEventListener('click', saveProductionSchedule); }

    const savePickupConfigBtn = document.querySelector('.settSavePickupConfiguration');
    if (savePickupConfigBtn) { savePickupConfigBtn.addEventListener('click', savePickupConfiguration); }

    const pickupWindowList = document.getElementById('pickupWindowList');
    if (pickupWindowList) { initializePickupWindowInteractions(pickupWindowList); }

    const addWindowBtn = document.getElementById('pickupWindowAddBtn');
    if (addWindowBtn)
    {
        addWindowBtn.addEventListener('click', function()
        {
            const list  = document.getElementById('pickupWindowList');
            const count = list ? list.querySelectorAll('.pickupWindowRow').length : 0;
            const html  = renderPickupWindowHTML(null, count);
            const temp  = document.createElement('div');
            temp.innerHTML = html;
            const newRow = temp.firstElementChild;
            if (list) { list.appendChild(newRow); }
            initializePickupWindowInteractions(newRow);
        });
    }

    const saveOrderAvailabilityBtn = document.querySelector('.settSaveOrderAvailability');
    if (saveOrderAvailabilityBtn) { saveOrderAvailabilityBtn.addEventListener('click', saveOrderAvailability); }

    const saveSocialBtn = document.querySelector('.settSaveSocialLinks');
    if (saveSocialBtn) { saveSocialBtn.addEventListener('click', saveSocialLinks); }

    // Load live settings from API and populate form fields
    loadSettingsFromAPI();

}


/* ============================================================
   HELP PAGE
============================================================ */

/*
    Getting Started workflow — the seven steps every order passes
    through, in the order an owner actually works them day to day.
    Purely informational (no data binding); intended to be read in
    under a minute by someone who has never opened the dashboard.
*/
const GETTING_STARTED_STEPS =
[
    'Review New Orders',
    'Contact Customer',
    'Receive Payment',
    'Confirm Order',
    'Prepare Order',
    'Mark Ready for Pickup',
    'Complete Pickup'
];

/*
    FAQ content — written for Brigitte's first day using the system.
    Each answer describes exactly what happens in this build (button
    names, tab names, and automatic transitions all match the real
    Orders/Production workflow) so nothing here goes stale on its own.
*/
const HELP_FAQ_ITEMS =
[
    {
        question: 'How do I confirm an order?',
        answer: 'Open the order from New Requests and click "Mark Paid" once you’ve received payment. It moves to your Confirmed Queue automatically — there’s no separate "confirm" button.'
    },
    {
        question: 'How do I contact the customer?',
        answer: 'On any order in New Requests, click "Contact Customer." This records that you’ve reached out and moves the order to Awaiting Payment so you know where things stand.'
    },
    {
        question: 'How do I mark an order as Awaiting Payment?',
        answer: 'You don’t need to set this directly — clicking "Contact Customer" on a New Request moves it to Awaiting Payment for you.'
    },
    {
        question: 'How do I mark an order as Confirmed?',
        answer: 'Click "Mark Paid" on the order, whether it’s sitting in New Requests or Awaiting Payment. Confirmed means paid and scheduled for production.'
    },
    {
        question: 'How do I move an order into Production?',
        answer: 'This happens automatically on the order’s scheduled production day — you don’t move it yourself. Confirmed orders appear under Today’s Production on the Production page when their day arrives.'
    },
    {
        question: 'How do I mark Ready for Pickup?',
        answer: 'On the Production page, find the order under Today’s Production and click "Mark Ready for Pickup." It moves to Pending Pickup.'
    },
    {
        question: 'How do I complete a pickup?',
        answer: 'When the customer arrives, open the order from Orders or Production and click "Complete Pickup." You’ll be asked to confirm before it’s marked done.'
    },
    {
        question: 'How do I change production days?',
        answer: 'Go to Settings → Production Schedule and toggle the days you produce and fulfill orders. Today’s Production updates automatically to match.'
    },
    {
        question: 'How do I update pickup hours?',
        answer: 'Go to Settings → Pickup Configuration to set your pickup windows (days and times) and the pickup message shown to customers on your Website.'
    },
    {
        question: 'How do I change my bakery settings?',
        answer: 'The Settings page covers your business info, phone, address, social links, and order availability. Each card saves independently when you click its own "Save Changes" button.'
    },
    {
        question: 'How do I add an order manually?',
        answer: 'Click "New Order Request" in the sidebar to enter a phone order or walk-in request yourself. It’s added the exact same way as an order submitted through your Website.'
    },
    {
        question: 'How does the Reviews page work?',
        answer: 'Reviews is private feedback from your customers — not public Google reviews. When a customer flags an issue, it appears there so you can reach out and resolve it directly. Click "Mark Resolved" once you\'ve taken care of it.'
    }
];

function renderHelpPage()
{

    const workflowHTML = GETTING_STARTED_STEPS.map(function(label, i)
    {

        const step = `
            <div class="helpWorkflowStep">
                <div class="helpWorkflowNumber">${i + 1}</div>
                <div class="helpWorkflowLabel">${esc(label)}</div>
            </div>
        `;

        const arrow = i < GETTING_STARTED_STEPS.length - 1
            ? `<div class="helpWorkflowArrow"><i class="fa-solid fa-arrow-down"></i></div>`
            : '';

        return step + arrow;

    }).join('');

    const faqHTML = HELP_FAQ_ITEMS.map(function(item, i)
    {
        return `
            <div class="helpFaqItem" data-index="${i}">
                <div class="helpFaqQuestion">
                    <span class="helpFaqQ">${esc(item.question)}</span>
                    <i class="fa-solid fa-chevron-down helpFaqIcon"></i>
                </div>
                <div class="helpFaqAnswer">
                    <p class="helpFaqAnswerText">${esc(item.answer)}</p>
                </div>
            </div>
        `;
    }).join('');

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Help &amp; Support</div>
                <div class="pageHeaderSub">NuloEdge Bakery Module documentation</div>
            </div>

        </div>

        <div class="helpGrid">

            <div class="helpCard">
                <div class="helpCardIcon"><i class="fa-solid fa-book-open"></i></div>
                <div class="helpCardTitle">Getting Started Guide</div>
                <div class="helpCardDesc">Learn how to navigate the dashboard, manage orders, and set up your bakery profile.</div>
            </div>

            <div class="helpCard">
                <div class="helpCardIcon"><i class="fa-solid fa-inbox"></i></div>
                <div class="helpCardTitle">Managing Orders</div>
                <div class="helpCardDesc">How to review incoming requests, confirm orders, and update order status through the workflow.</div>
            </div>

            <div class="helpCard">
                <div class="helpCardIcon"><i class="fa-solid fa-layer-group"></i></div>
                <div class="helpCardTitle">Production</div>
                <div class="helpCardDesc">How to use the production view to track orders from confirmed through pickup.</div>
            </div>

            <div class="helpCard">
                <div class="helpCardIcon"><i class="fa-solid fa-star"></i></div>
                <div class="helpCardTitle">Customer Feedback</div>
                <div class="helpCardDesc">How to log and resolve customer feedback before it becomes a negative review.</div>
            </div>

        </div>

        <div style="margin-top: 1.5rem; font-size: 0.75rem; font-weight: 700; color: var(--clrTextMuted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.5rem;">
            Getting Started — Your Order Workflow
        </div>

        <div class="helpCard helpWorkflowCard">
            ${workflowHTML}
        </div>

        <div style="margin-top: 1.5rem; font-size: 0.75rem; font-weight: 700; color: var(--clrTextMuted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.5rem;">
            Frequently Asked Questions
        </div>

        <div class="helpFaqList">
            ${faqHTML}
        </div>

        <div class="helpContactBox">
            <div class="helpContactTitle">Need Help?</div>
            <div class="helpContactSub">If you ever have questions or run into an issue, we're here to help.</div>
            <div class="helpContactActions">
                <a class="btn btnPrimary btnSm" href="mailto:support@nulostudio.com">
                    <i class="fa-solid fa-envelope"></i> Email Support
                </a>
                <a class="btn btnGhost btnSm" href="sms:+18005550100">
                    <i class="fa-solid fa-comment-sms"></i> Text Support
                </a>
                <button class="btn btnGhost btnSm" id="helpScheduleCallBtn" type="button">
                    <i class="fa-solid fa-phone"></i> Schedule a Call
                </button>
            </div>
        </div>

    `;

}

function initializeHelpAccordion()
{

    // ── FAQ Accordion — single-open, smooth expand/collapse ──

    document.querySelectorAll('.helpFaqItem').forEach(function(item)
    {

        const question = item.querySelector('.helpFaqQuestion');

        if (!question) { return; }

        question.addEventListener('click', function()
        {

            const isOpen = item.classList.contains('isOpen');

            document.querySelectorAll('.helpFaqItem').forEach(function(other)
            {
                other.classList.remove('isOpen');
            });

            if (!isOpen)
            {
                item.classList.add('isOpen');
            }

        });

    });

    // ── Schedule a Call — no scheduling link yet for Version 1 ──

    const scheduleBtn = document.getElementById('helpScheduleCallBtn');

    if (scheduleBtn)
    {
        scheduleBtn.addEventListener('click', function()
        {
            showToast('info', 'Scheduling isn\'t set up yet — for now, please email or text support.');
        });
    }

}


/* ============================================================
   THEME TOGGLE
============================================================ */

let isLightTheme = false;

function toggleTheme()
{

    isLightTheme = !isLightTheme;

    if (isLightTheme)
    {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    else
    {
        document.documentElement.removeAttribute('data-theme');
    }

    const label    = document.getElementById('themeToggleLabel');
    const switchEl = document.getElementById('themeToggleSwitch');

    if (label)    { label.textContent = isLightTheme ? 'Dark Mode' : 'Light Mode'; }
    if (switchEl) { switchEl.classList.toggle('isActive', isLightTheme); }

}


/* ============================================================
   TOAST NOTIFICATION SYSTEM
============================================================ */

function showToast(type, message)
{

    let container = document.getElementById('toastContainer');

    if (!container)
    {

        container = document.createElement('div');
        container.id        = 'toastContainer';
        container.className = 'toastContainer';
        document.body.appendChild(container);

    }

    const iconMap =
    {
        success: 'fa-circle-check',
        info:    'fa-circle-info',
        warning: 'fa-triangle-exclamation'
    };

    const toast = document.createElement('div');

    toast.className = 'toast toast' + type.charAt(0).toUpperCase() + type.slice(1);

    toast.innerHTML = `
        <i class="fa-solid ${iconMap[type] || 'fa-circle-info'} toastIcon"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(function()
    {

        toast.style.opacity    = '0';
        toast.style.transform  = 'translateX(20px)';
        toast.style.transition = 'all 0.25s ease';

        setTimeout(function() { toast.remove(); }, 300);

    }, 3200);

}


/* ============================================================
   MOBILE MENU
============================================================ */

function openMobileMenu()
{

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');

    if (sidebar) { sidebar.classList.add('isOpen'); }
    if (overlay) { overlay.classList.add('isVisible'); }

}

function closeMobileMenu()
{

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');

    if (sidebar) { sidebar.classList.remove('isOpen'); }
    if (overlay) { overlay.classList.remove('isVisible'); }

}


/* ============================================================
   EVENT LISTENERS
============================================================ */

document.addEventListener('DOMContentLoaded', function()
{

    // ── Sidebar Navigation ──

    const sidebarNav = document.getElementById('sidebarNav');

    if (sidebarNav)
    {

        sidebarNav.addEventListener('click', function(e)
        {

            const navItem = e.target.closest('.navItem');

            if (!navItem)
            {
                return;
            }

            const page = navItem.dataset.page;

            if (page)
            {
                navigateTo(page);
            }

        });

    }

    // ── Sidebar New Order CTA ──

    const sidebarNewOrderBtn = document.getElementById('sidebarNewOrderBtn');

    if (sidebarNewOrderBtn)
    {
        sidebarNewOrderBtn.addEventListener('click', showNewOrderRequestModal);
    }

    // ── Mobile Hamburger ──

    const hamburgerBtn = document.getElementById('hamburgerBtn');

    if (hamburgerBtn)
    {
        hamburgerBtn.addEventListener('click', openMobileMenu);
    }

    // ── Mobile Overlay ──

    const mobileOverlay = document.getElementById('mobileOverlay');

    if (mobileOverlay)
    {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    // ── Theme Toggle ──

    const themeToggleBtn = document.getElementById('themeToggleBtn');

    if (themeToggleBtn)
    {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

});


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener('DOMContentLoaded', function()
{

    // Nav badge: initial count — updateNavBadge() keeps it live on every re-render
    updateNavBadge();

    // Top bar date
    const topBarDate = document.getElementById('topBarDate');

    if (topBarDate)
    {

        const today = new Date(TODAY_DATE + 'T12:00:00');

        topBarDate.textContent = today.toLocaleDateString('en-US',
        {
            weekday: 'long',
            month:   'long',
            day:     'numeric',
            year:    'numeric'
        });

    }

    // Render initial page
    renderPage('dashboard');

    // Load live orders from Google Sheets via the Apps Script API,
    // then re-render so every order view reflects real data
    loadOrdersFromAPI();

});
