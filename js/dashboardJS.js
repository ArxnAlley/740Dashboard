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
        if (page === 'settings') { console.log("✅ Settings page rendered."); }
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

    const attentionItems = needsAttention.length > 0
        ? needsAttention.map(function(order)
        {

            const tabKey = order.status === STATUS.NEW_REQUEST ? 'newRequest' : 'awaitingPayment';

            return `
                <div class="recentRequestItem" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'${tabKey}'})">
                    <div class="recentRequestInfo">
                        <div class="recentRequestName">${order.customer}</div>
                        <div class="recentRequestDetail">${order.products} · ${order.pickupDay} ${formatDate(order.pickupDate)}</div>
                    </div>
                    ${buildBadge(order.status)}
                </div>
            `;

        }).join('')
        : `<div class="emptyState"><i class="fa-solid fa-check-circle" style="margin-bottom:0.5rem;font-size:1.5rem;color:var(--clrGreen);"></i><div class="emptyStateTitle">All clear</div><div class="emptyStateSub">No requests need attention</div></div>`;

    // ── Pending Pickup widget ──

    const pendingPickupOrders = ORDERS.filter(function(o) { return o.status === STATUS.PENDING_PICKUP; });

    const pendingPickupItems = pendingPickupOrders.length > 0
        ? pendingPickupOrders.map(function(order)
        {
            return `
                <div class="productionQueueItem">
                    <div class="pqiLeft">
                        <div class="pqiCustomer">${order.customer}</div>
                        <div class="pqiProducts">${order.products}</div>
                    </div>
                    <div class="pqiTime">${order.pickupTime || order.pickupDay}</div>
                    ${buildBadge(order.status)}
                </div>
            `;
        }).join('')
        : `<div class="emptyState"><i class="fa-solid fa-bag-shopping" style="margin-bottom:0.5rem;font-size:1.5rem;color:var(--clrTextDim);"></i><div class="emptyStateTitle">Nothing waiting for pickup</div><div class="emptyStateSub">Ready orders will appear here</div></div>`;

    // ── Upcoming Confirmed Queue ──

    const upcomingOrders = ORDERS
        .filter(function(o)
        {
            return o.status === STATUS.CONFIRMED && o.pickupDate >= DEMO_TODAY;
        })
        .sort(function(a, b) { return a.pickupDate.localeCompare(b.pickupDate); })
        .slice(0, 5)
        .map(function(order)
        {
            return `
                <div class="pickupItem">
                    <div class="pickupDate">${order.pickupDay} · ${formatDateShort(order.pickupDate)}</div>
                    <div class="pickupCustomer">${order.customer}</div>
                    <div class="pickupProducts">${order.products}${order.pickupTime ? ' · ' + order.pickupTime : ''}</div>
                </div>
            `;
        }).join('');

    // ── Activity Log ──

    const activityItems = ACTIVITY_LOG.map(function(item)
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
    }).join('');

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
                    ${upcomingOrders || '<div class="emptyState"><div class="emptyStateTitle">No upcoming orders</div></div>'}
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

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
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

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="formGroup">
                        <label class="formLabel">Pickup Day</label>
                        <select class="formInput" id="nrPickupDay">
                            <option value="">Select day</option>
                            ${BAKERY_CONFIG.pickupDays.map(function(d) { return '<option value="' + d + '">' + d + '</option>'; }).join('')}
                        </select>
                    </div>
                    <div class="formGroup">
                        <label class="formLabel">Preferred Date</label>
                        <input class="formInput" type="date" id="nrPickupDate">
                    </div>
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

    document.getElementById('closeNewOrderModal').addEventListener('click', function()
    {
        modal.remove();
    });

    document.getElementById('cancelNewOrderModal').addEventListener('click', function()
    {
        modal.remove();
    });

    document.getElementById('submitNewOrderModal').addEventListener('click', function()
    {
        const name = document.getElementById('nrCustomerName').value.trim();

        if (!name)
        {
            showToast('warning', 'Please enter a customer name.');
            return;
        }

        modal.remove();

        showToast('success', 'Order request from ' + name + ' submitted.');

    });

    modal.addEventListener('click', function(e)
    {
        if (e.target === modal)
        {
            modal.remove();
        }
    });

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

    const tableRows = filteredOrders.length > 0
        ? filteredOrders.map(function(order)
        {
            return buildOrderTableRow(order, activeTab, showPhone);
        }).join('')
        : `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--clrTextMuted); font-size: 0.84rem;">No orders in this stage</td></tr>`;

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

        <div class="tableWrapper">

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

    `;

}

function buildOrderTableRow(order, tab, showPhone)
{

    const customerCell = showPhone && order.phone
        ? `<td><div class="tdCustomer">${order.customer}</div><span class="orderPhone">${order.phone}</span></td>`
        : `<td class="tdCustomer">${order.customer}</td>`;

    const pickupCell = order.pickupDate
        ? `${order.pickupDay} · ${formatDate(order.pickupDate)}${order.pickupTime ? ' · ' + order.pickupTime : ''}`
        : order.pickupDay;

    const actions = buildOrderRowActions(order, tab);

    return `
        <tr class="orderTableRow" data-id="${order.id}">
            <td class="tdId">${order.id}</td>
            ${customerCell}
            <td class="tdMuted">${order.products}</td>
            <td class="tdMuted">${pickupCell}</td>
            <td>${buildBadge(order.paymentStatus)}</td>
            <td>
                <div class="tdActions">
                    ${actions}
                </div>
            </td>
        </tr>
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

}

function initializeOrdersActions()
{

    // ── Contact Customer (NEW_REQUEST → AWAITING_PAYMENT) ──

    document.querySelectorAll('.btnContactCustomer').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = STATUS.AWAITING_PAYMENT;

                // [TWILIO HOOK: Log outbound contact attempt]
                // [SUPABASE HOOK: PATCH orders table status]

                showToast('info', 'Call or text ' + order.customer + ' and share payment details.');

                renderPage('orders', { tab: 'awaitingPayment' });
            }

        });

    });

    // ── Mark Paid (→ CONFIRMED, from any pre-confirmation stage) ──

    document.querySelectorAll('.btnMarkPaid').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.paymentStatus = 'paid';
                order.status        = STATUS.CONFIRMED;

                // [SUPABASE HOOK: PATCH orders table paymentStatus + status]
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

        btn.addEventListener('click', function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (!order)
            {
                return;
            }

            const confirmed = window.confirm('Reject order ' + id + ' from ' + order.customer + '?');

            if (!confirmed)
            {
                return;
            }

            order.status = STATUS.CANCELLED;

            // [SUPABASE HOOK: PATCH orders table status]

            showToast('info', id + ' rejected.');

            renderPage('orders', { tab: 'newRequest' });

        });

    });

    // ── Cancel Order (AWAITING_PAYMENT → CANCELLED) ──

    document.querySelectorAll('.btnCancelOrder').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (!order)
            {
                return;
            }

            const confirmed = window.confirm('Cancel order ' + id + ' for ' + order.customer + '?');

            if (!confirmed)
            {
                return;
            }

            order.status = STATUS.CANCELLED;

            // [SUPABASE HOOK: PATCH orders table status]

            showToast('info', id + ' cancelled.');

            renderPage('orders', { tab: 'cancelled' });

        });

    });

    // ── Mark Ready for Pickup (IN_PRODUCTION → PENDING_PICKUP) ──

    document.querySelectorAll('.btnMarkReady').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = STATUS.PENDING_PICKUP;

                // [SUPABASE HOOK: PATCH orders table status]
                // [TWILIO HOOK: SMS to customer — order is ready]

                showToast('success', id + ' ready for pickup.');

                renderPage('orders', { tab: 'pendingPickup' });
            }

        });

    });

    // ── Complete Pickup (PENDING_PICKUP → COMPLETED) ──

    document.querySelectorAll('.btnCompletePickup').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = STATUS.COMPLETED;

                // [SUPABASE HOOK: PATCH orders table status]
                // [REVIEWS HOOK: Trigger post-pickup SMS feedback survey]

                showToast('success', id + ' — pickup completed.');

                renderPage('orders', { tab: 'completed' });
            }

        });

    });

    // ── Row Click → Order Detail Drawer ──

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
                <div class="drawerNotes">${order.notes}</div>
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
                <div class="drawerValue">${order.customer}</div>
                ${order.phone ? `<a class="drawerPhoneLink" href="tel:${order.phone.replace(/\D/g, '')}">${order.phone}</a>` : ''}
            </div>

            <div class="drawerSection">
                <div class="drawerLabel">Products</div>
                <div class="drawerValue">${order.products}</div>
            </div>

            <div class="drawerSection">
                <div class="drawerLabel">Pickup</div>
                <div class="drawerValue">${order.pickupDay}${order.pickupDate ? ' · ' + formatDate(order.pickupDate) : ''}${order.pickupTime ? ' · ' + order.pickupTime : ''}</div>
            </div>

            ${notesSection}

            <div class="drawerSection">
                <div class="drawerLabel">Payment</div>
                <div class="drawerPaymentRow">
                    ${buildBadge(order.paymentStatus)}
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

        drawerContactBtn.addEventListener('click', function()
        {

            const id    = drawerContactBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (found)
            {
                found.status = STATUS.AWAITING_PAYMENT;

                // [TWILIO HOOK: Log outbound contact attempt]
                // [SUPABASE HOOK: PATCH orders table status]

                showToast('info', 'Call or text ' + found.customer + ' and share payment details.');

                closeOrderDrawer();

                renderPage('orders', { tab: 'awaitingPayment' });
            }

        });

    }

    // ── Mark Paid (drawer) ──

    const drawerMarkPaidBtn = drawer.querySelector('.btnDrawerMarkPaid');

    if (drawerMarkPaidBtn)
    {

        drawerMarkPaidBtn.addEventListener('click', function()
        {

            const id    = drawerMarkPaidBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (found)
            {
                found.paymentStatus = 'paid';
                found.status        = STATUS.CONFIRMED;

                // [SUPABASE HOOK: PATCH orders table paymentStatus + status]
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

        drawerRejectBtn.addEventListener('click', function()
        {

            const id    = drawerRejectBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (!found) { return; }

            const ok = window.confirm('Reject order ' + id + ' from ' + found.customer + '?');

            if (!ok) { return; }

            found.status = STATUS.CANCELLED;

            // [SUPABASE HOOK: PATCH orders table status]

            showToast('info', id + ' rejected.');

            closeOrderDrawer();

            renderPage('orders', { tab: 'newRequest' });

        });

    }

    // ── Cancel Order (drawer) ──

    const drawerCancelBtn = drawer.querySelector('.btnDrawerCancelOrder');

    if (drawerCancelBtn)
    {

        drawerCancelBtn.addEventListener('click', function()
        {

            const id    = drawerCancelBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (!found) { return; }

            const ok = window.confirm('Cancel order ' + id + ' for ' + found.customer + '?');

            if (!ok) { return; }

            found.status = STATUS.CANCELLED;

            // [SUPABASE HOOK: PATCH orders table status]

            showToast('info', id + ' cancelled.');

            closeOrderDrawer();

            renderPage('orders', { tab: 'cancelled' });

        });

    }

    // ── Ready for Pickup (drawer) ──

    const drawerReadyBtn = drawer.querySelector('.btnDrawerReadyForPickup');

    if (drawerReadyBtn)
    {

        drawerReadyBtn.addEventListener('click', function()
        {

            const id    = drawerReadyBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (found)
            {
                found.status = STATUS.PENDING_PICKUP;

                // [SUPABASE HOOK: PATCH orders table status]
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

        drawerCompleteBtn.addEventListener('click', function()
        {

            const id    = drawerCompleteBtn.dataset.id;
            const found = ORDERS.find(function(o) { return o.id === id; });

            if (found)
            {
                found.status = STATUS.COMPLETED;

                // [SUPABASE HOOK: PATCH orders table status]
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

    const confirmedQueueHTML = confirmedQueueOrders.length > 0
        ? confirmedQueueOrders.map(function(order)
        {

            return `
                <div class="productionQueueRow">
                    <div class="pqrId">${order.id}</div>
                    <div class="pqrCustomer">${order.customer}</div>
                    <div class="pqrProducts">${order.products}</div>
                    <div class="pqrPickup">${order.pickupDay} · ${formatDateShort(order.pickupDate)}</div>
                    <div class="pqrNote">Scheduled for ${order.pickupDay}</div>
                </div>
            `;

        }).join('')
        : `<div class="productionEmpty">No orders in the confirmed queue</div>`;

    // ── Section 2: Today's Production ──

    const todaysProductionHTML = todaysProductionOrders.length > 0
        ? todaysProductionOrders.map(function(order)
        {
            return `
                <div class="productionCard">
                    <div class="productionCardId">${order.id}</div>
                    <div class="productionCardCustomer">${order.customer}</div>
                    <div class="productionCardProducts">${order.products}</div>
                    ${order.notes ? `<div class="productionCardNotes">${order.notes}</div>` : ''}
                    <div class="productionCardFooter">
                        ${buildBadge(order.status)}
                        <div class="productionCardTime">${order.pickupTime || ''}</div>
                        <button class="btn btnGreen btnSm btnAdvanceProduction" data-id="${order.id}" data-next="${STATUS.PENDING_PICKUP}">Mark Ready for Pickup</button>
                    </div>
                </div>
            `;
        }).join('')
        : `<div class="productionEmpty">No orders currently in production. Apps Script will move confirmed orders here when production begins.</div>`;

    // ── Section 3: Pending Pickup ──

    const pendingPickupHTML = pendingPickupOrders.length > 0
        ? pendingPickupOrders.map(function(order)
        {

            return `
                <div class="pickupQueueRow">
                    <div class="pkrCustomer">${order.customer}</div>
                    <div class="pkrProducts">${order.products}</div>
                    <div class="pkrTime">${order.pickupDay}${order.pickupDate ? ' · ' + formatDateShort(order.pickupDate) : ''}${order.pickupTime ? ' · ' + order.pickupTime : ''}</div>
                    <button class="btn btnPrimary btnSm btnCompletePickupProduction" data-id="${order.id}">Complete Pickup</button>
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

    `;

}

function initializeProductionActions()
{

    // ── Today's Production — Mark Ready for Pickup ──

    document.querySelectorAll('.btnAdvanceProduction').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id         = btn.dataset.id;
            const nextStatus = btn.dataset.next;
            const order      = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = nextStatus;

                // [SUPABASE HOOK: PATCH orders table status]
                // [TWILIO HOOK: SMS to customer — order is ready for pickup]

                showToast('success', id + ' ready for pickup.');

                renderPage('production');
            }

        });

    });

    // ── Pending Pickup — Complete Pickup ──

    document.querySelectorAll('.btnCompletePickupProduction').forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id    = btn.dataset.id;
            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = STATUS.COMPLETED;

                // [SUPABASE HOOK: PATCH orders table status]
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

        const phoneTel    = customer.phone ? customer.phone.replace(/\D/g, '') : '';
        const phoneDisplay = customer.phone
            ? `<a class="phoneTel" href="tel:${phoneTel}">${customer.phone}</a>`
            : '—';

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <div class="customerAvatar">${getInitials(customer.name)}</div>
                        <span class="tdCustomer">${customer.name}</span>
                    </div>
                </td>
                <td class="tdMuted">${phoneDisplay}</td>
                <td class="tdMuted">${customer.email}</td>
                <td style="font-weight: 700; color: var(--clrText);">${customer.lifetimeOrders}</td>
                <td style="font-weight: 700; color: var(--clrGreen);">${formatCurrency(customer.lifetimeSpend)}</td>
                <td class="tdMuted" style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${customer.notes || '—'}</td>
            </tr>
        `;

    }).join('');

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Customers</div>
                <div class="pageHeaderSub">${CUSTOMERS.length} customers on record</div>
            </div>

        </div>

        <div class="tableWrapper">

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

        const phoneTel = fb.phone ? fb.phone.replace(/\D/g, '') : '';

        return `
            <div class="feedbackCard ${isResolved ? 'isResolved' : 'isOpen'}">
                <div class="feedbackCardTop">
                    <div>
                        <div class="feedbackCustomer">${fb.customer}</div>
                        <div class="feedbackMeta">
                            ${fb.phone ? `<a class="feedbackPhone phoneTel" href="tel:${phoneTel}">${fb.phone}</a>` : ''}
                            <span>·</span>
                            <span>${formatDate(fb.date)}</span>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0;">
                        <div class="feedbackRating">${buildStars(fb.rating)}</div>
                        ${statusBadge}
                    </div>
                </div>
                <div class="feedbackIssue">${fb.issue}</div>
                ${fb.notes ? `<div class="feedbackNotes">${fb.notes}</div>` : ''}
                ${resolveBtn ? `<div class="feedbackActions">${resolveBtn}</div>` : ''}
            </div>
        `;

    }).join('');

    const emptyState = REVIEWS_DATA.length === 0
        ? `<div class="emptyState"><i class="fa-solid fa-face-smile" style="font-size:2rem;color:var(--clrGreen);margin-bottom:0.75rem;"></i><div class="emptyStateTitle">No feedback yet</div><div class="emptyStateSub">Customer feedback will appear here</div></div>`
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

    const data = REPORTS_DATA;

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
                <div class="reportsSumCardNewLabel">Revenue This Week</div>
            </div>

            <div class="reportsSumCardNew">
                <div class="reportsSumCardNewValue">${formatCurrency(data.weeklyRevenueSummary.avgOrderValue)}</div>
                <div class="reportsSumCardNewLabel">Avg Order Value</div>
            </div>

            <div class="reportsSumCardNew">
                <div class="reportsSumCardNewValue">${data.repeatCustomers}</div>
                <div class="reportsSumCardNewLabel">Repeat Customers</div>
            </div>

        </div>

        <div class="reportsGrid">

            <div class="reportCard">
                <div class="reportCardTitle">Weekly Orders — Jun 23 to Jun 30</div>
                <div class="barChart">
                    ${orderBars}
                </div>
            </div>

            <div class="reportCard">
                <div class="reportCardTitle">Popular Products — All Time</div>
                <div class="hBarChart" style="margin-top: 0.5rem;">
                    ${productBars}
                </div>
            </div>

        </div>

    `;

}


/* ============================================================
   SETTINGS PAGE
============================================================ */

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
                        <input class="formInput" type="text" id="settBusinessName" value="${config.businessName}" placeholder="Business name">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Owner Name</label>
                        <input class="formInput" type="text" id="settOwnerName" value="${config.ownerFullName}" placeholder="Owner name">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Phone</label>
                        <input class="formInput" type="tel" id="settPhone" value="${config.phone}" placeholder="Phone number">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Address</label>
                        <input class="formInput" type="text" id="settAddress" value="${config.address}" placeholder="Business address">
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
                        <p class="formHint">Shared with customers when their order is confirmed.</p>
                        <textarea class="formInput formTextarea formTextareaLg" id="settPickupInstructions" placeholder="Pickup instructions for customers">${config.pickupInstructions}</textarea>
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn settSavePickupInstructions">
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
                        <input class="formInput" type="url" id="settGoogleReview" value="${config.googleReviewLink}" placeholder="Google review URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Facebook</label>
                        <input class="formInput" type="url" id="settFacebook" value="${config.social.facebook}" placeholder="Facebook URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">TikTok</label>
                        <input class="formInput" type="url" id="settTiktok" value="${config.social.tiktok}" placeholder="TikTok URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Instagram</label>
                        <input class="formInput" type="url" id="settInstagram" value="${config.social.instagram}" placeholder="Instagram URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Website</label>
                        <input class="formInput" type="url" id="settWebsite" value="${config.website}" placeholder="https://yourwebsite.com">
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

    if (nameInput)  { BAKERY_CONFIG.businessName   = nameInput.value.trim(); }
    if (phoneInput) { BAKERY_CONFIG.phone           = phoneInput.value.trim(); }
    if (addrInput)  { BAKERY_CONFIG.address         = addrInput.value.trim(); }

    if (ownerInput)
    {
        BAKERY_CONFIG.ownerFullName = ownerInput.value.trim();
        BAKERY_CONFIG.ownerName     = ownerInput.value.trim().split(' ')[0];
    }

    const payload =
    {
        businessName:  BAKERY_CONFIG.businessName,
        ownerFullName: BAKERY_CONFIG.ownerFullName,
        phone:         BAKERY_CONFIG.phone,
        address:       BAKERY_CONFIG.address
    };

    const btn = document.querySelector('.settSaveBusinessInfo');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);
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

    const activeDays = [];

    document.querySelectorAll('.dayToggle.isActive').forEach(function(toggle)
    {
        activeDays.push(toggle.dataset.day);
    });

    BAKERY_CONFIG.productionDays = activeDays;
    BAKERY_CONFIG.pickupDays     = activeDays.slice();

    document.querySelectorAll('.capacityInput').forEach(function(input)
    {
        const day = input.dataset.day;
        BAKERY_CONFIG.dailyCapacity[day] = parseInt(input.value, 10) || 0;
    });

    const payload =
    {
        productionDays: BAKERY_CONFIG.productionDays,
        pickupDays:     BAKERY_CONFIG.pickupDays,
        dailyCapacity:  BAKERY_CONFIG.dailyCapacity
    };

    const btn = document.querySelector('.settSaveProductionSchedule');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);
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

function savePickupInstructions()
{

    const input = document.getElementById('settPickupInstructions');

    if (input)
    {
        BAKERY_CONFIG.pickupInstructions = input.value.trim();
    }

    // [SUPABASE HOOK: PATCH clients table — pickupInstructions]

    showToast('success', 'Pickup instructions saved.');

}

async function saveSocialLinks()
{

    const googleInput    = document.getElementById('settGoogleReview');
    const facebookInput  = document.getElementById('settFacebook');
    const tiktokInput    = document.getElementById('settTiktok');
    const instagramInput = document.getElementById('settInstagram');
    const websiteInput   = document.getElementById('settWebsite');

    if (googleInput)    { BAKERY_CONFIG.googleReviewLink = googleInput.value.trim(); }
    if (facebookInput)  { BAKERY_CONFIG.social.facebook  = facebookInput.value.trim(); }
    if (tiktokInput)    { BAKERY_CONFIG.social.tiktok    = tiktokInput.value.trim(); }
    if (instagramInput) { BAKERY_CONFIG.social.instagram = instagramInput.value.trim(); }
    if (websiteInput)   { BAKERY_CONFIG.website          = websiteInput.value.trim(); }

    // API keys use "Url" suffix; BAKERY_CONFIG uses different names.
    // Mapping applied here at the API boundary.
    const payload =
    {
        googleReviewUrl: BAKERY_CONFIG.googleReviewLink,
        facebookUrl:     BAKERY_CONFIG.social.facebook,
        tiktokUrl:       BAKERY_CONFIG.social.tiktok,
        instagramUrl:    BAKERY_CONFIG.social.instagram,
        websiteUrl:      BAKERY_CONFIG.website
    };

    const btn = document.querySelector('.settSaveSocialLinks');
    setButtonLoading(btn, true);

    try
    {
        await updateSettings(payload);
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

function initializeSettingsInteractions()
{

    console.log("✅ initializeSettingsInteractions()");

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
                    capacityInput.value = 0;
                }
            }

        });

    });

    // ── Save Buttons ──

    const saveBusinessInfoBtn = document.querySelector('.settSaveBusinessInfo');
    if (saveBusinessInfoBtn) { saveBusinessInfoBtn.addEventListener('click', saveBusinessInfo); }

    const saveScheduleBtn = document.querySelector('.settSaveProductionSchedule');
    if (saveScheduleBtn) { saveScheduleBtn.addEventListener('click', saveProductionSchedule); }

    const savePickupBtn = document.querySelector('.settSavePickupInstructions');
    if (savePickupBtn) { savePickupBtn.addEventListener('click', savePickupInstructions); }

    const saveSocialBtn = document.querySelector('.settSaveSocialLinks');
    if (saveSocialBtn) { saveSocialBtn.addEventListener('click', saveSocialLinks); }

    // Load live settings from API and populate form fields
    console.log("➡️ Calling loadSettingsFromAPI()");
    loadSettingsFromAPI();

}


/* ============================================================
   HELP PAGE
============================================================ */

function renderHelpPage()
{

    const faqItems =
    [
        'How do I confirm an order request?',
        'How do I mark an order as Ready for Pickup?',
        'How do I change my production days?',
        'How do I update my daily order capacity?',
        'How do I log customer feedback?',
        'How do I change the dashboard theme?'
    ];

    const faqHTML = faqItems.map(function(question)
    {
        return `
            <div class="helpFaqItem">
                <span class="helpFaqQ">${question}</span>
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
            Frequently Asked Questions
        </div>

        <div class="helpFaqList">
            ${faqHTML}
        </div>

        <div class="helpContactBox">
            <div class="helpContactTitle">Need help from the NuloEdge team?</div>
            <div class="helpContactSub">Contact your NuloEdge account manager or visit the NuloOS support portal.</div>
        </div>

    `;

}

function initializeHelpAccordion()
{

    // FAQ items are informational — full documentation available in NuloOS v1.1

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

    // Nav badge: new requests count
    const navBadge = document.getElementById('navBadgeRequests');

    if (navBadge)
    {
        navBadge.textContent = ORDERS.filter(function(o)
        {
            return o.status === STATUS.NEW_REQUEST;
        }).length;
    }

    // Top bar date
    const topBarDate = document.getElementById('topBarDate');

    if (topBarDate)
    {

        const today = new Date(DEMO_TODAY + 'T12:00:00');

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

});
