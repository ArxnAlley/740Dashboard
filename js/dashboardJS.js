/* ============================================================
   NULOEDGE BAKERY MODULE — DASHBOARD APPLICATION
   dashboardJS.js

   Single-page application engine for the NuloEdge Bakery Module.
   Handles navigation, page rendering, and UI interactions.

   Architecture:
   1. Constants & Utilities
   2. Navigation System
   3. Page Renderers (one per sidebar item)
   4. Interactive Event Handlers
   5. Toast Notification System
   6. Initialization
============================================================ */


/* ============================================================
   CONSTANTS & UTILITIES
============================================================ */

const PAGE_TITLES =
{
    dashboard:  'Dashboard',
    orders:     'Orders',
    production: 'Production',
    customers:  'Customer List',
    reviews:    'Reviews',
    reports:    'Reports',
    settings:   'Settings',
    help:       'Help & Support'
};

const STATUS_LABELS =
{
    newRequest:     'New Request',
    pendingPayment: 'Pending Payment',
    confirmed:      'Confirmed',
    inProduction:   'In Production',
    readyForPickup: 'Ready for Pickup',
    completed:      'Completed',
    cancelled:      'Cancelled',
    paid:           'Paid',
    unpaid:         'Unpaid'
};

const STATUS_BADGE_MAP =
{
    newRequest:     'badgeNew',
    pendingPayment: 'badgeContacted',
    confirmed:      'badgeConfirmed',
    inProduction:   'badgePreparing',
    readyForPickup: 'badgeReady',
    completed:      'badgePickedUp',
    cancelled:      'badgeCancelled',
    paid:           'badgePaid',
    unpaid:         'badgeUnpaid'
};

const STATUS_NEXT =
{
    newRequest:     'pendingPayment',
    pendingPayment: 'confirmed',
    confirmed:      'inProduction',
    inProduction:   'readyForPickup',
    readyForPickup: 'completed'
};

const STATUS_NEXT_LABEL =
{
    newRequest:     'Mark Contacted',
    pendingPayment: 'Mark Confirmed',
    confirmed:      'Start Making',
    inProduction:   'Mark Ready',
    readyForPickup: 'Mark Picked Up'
};

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

function buildBadge(status)
{

    const cssClass = STATUS_BADGE_MAP[status] || 'badgeGray';

    const label = STATUS_LABELS[status] || status;

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

function buildPhoneDisplay(phone)
{

    if (!phone)
    {
        return '—';
    }

    const digits = phone.replace(/\D/g, '');

    return `<span class="phoneText">${phone}</span><a class="phoneTel" href="tel:${digits}">${phone}</a>`;

}

function countNewRequests()
{

    return ORDERS.filter(function(o) { return o.status === 'newRequest'; }).length;

}

function getTodaysGoodiesInfo()
{

    const day          = DEMO_DAY_OF_WEEK;
    const productionDays = BAKERY_CONFIG.productionDays;
    const allDays      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (productionDays.includes(day))
    {
        return { label: "Today's Goodies", pickupDay: day, pickupDate: DEMO_TODAY };
    }

    const todayIndex = allDays.indexOf(day);

    for (var i = 1; i <= 7; i++)
    {
        const nextDay = allDays[(todayIndex + i) % 7];
        if (productionDays.includes(nextDay))
        {
            return { label: nextDay + "'s Goodies", pickupDay: nextDay, pickupDate: null };
        }
    }

    return { label: "Today's Goodies", pickupDay: day, pickupDate: DEMO_TODAY };

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

    if (page === 'dashboard')
    {
        initializeDashboardActions();
    }

    if (page === 'orders')
    {
        initializeOrdersTabs(opts && opts.tab ? opts.tab : 'newRequest');
        initializeOrdersActions();
    }

    if (page === 'production')
    {
        initializeProductionActions();
    }

    if (page === 'reviews')
    {
        initializeReviewsActions();
    }

    if (page === 'settings')
    {
        initializeSettingsInteractions();
    }

    if (page === 'help')
    {
        initializeHelpAccordion();
    }

}


/* ============================================================
   DASHBOARD PAGE
============================================================ */

function renderDashboardPage()
{

    const greeting = getTimeGreeting();

    const ownerFirstName = BAKERY_CONFIG.ownerFullName
        ? BAKERY_CONFIG.ownerFullName.split(' ')[0]
        : BAKERY_CONFIG.ownerName;

    const greetingSection = `
        <div class="dashGreetingBlock">
            <h1 class="dashGreetingText">${greeting}, ${ownerFirstName}!</h1>
            <p class="dashGreetingSub">Here&rsquo;s what&rsquo;s happening with your bakery today.</p>
        </div>
    `;


    const newRequestCount  = ORDERS.filter(function(o) { return o.status === 'newRequest'; }).length;
    const confirmedCount   = ORDERS.filter(function(o) { return o.status === 'confirmed'; }).length;
    const ordersThisWeek   = REPORTS_DATA.weeklyRevenueSummary.orderCount;
    const todaysGoodies    = getTodaysGoodiesInfo();
    const goodiesCount     = ORDERS.filter(function(o)
    {
        return o.pickupDay === todaysGoodies.pickupDay
            && ['confirmed', 'inProduction', 'readyForPickup'].includes(o.status);
    }).length;

    const kpiCards = `
        <div class="kpiGrid">

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'newRequest'})">
                <div class="kpiTop">
                    <span class="kpiLabel">New Order Requests</span>
                    <span class="kpiIcon iconBlue"><i class="fa-solid fa-inbox"></i></span>
                </div>
                <div class="kpiValue">${newRequestCount}</div>
                <div class="kpiSub">Awaiting your response</div>
            </div>

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'confirmed'})">
                <div class="kpiTop">
                    <span class="kpiLabel">Confirmed Orders</span>
                    <span class="kpiIcon iconGreen"><i class="fa-solid fa-circle-check"></i></span>
                </div>
                <div class="kpiValue">${confirmedCount}</div>
                <div class="kpiSub">Paid &amp; confirmed</div>
            </div>

            <div class="kpiCard">
                <div class="kpiTop">
                    <span class="kpiLabel">Orders This Week</span>
                    <span class="kpiIcon iconPurple"><i class="fa-solid fa-calendar-week"></i></span>
                </div>
                <div class="kpiValue">${ordersThisWeek}</div>
                <div class="kpiSub">Jun 23 – Jun 30</div>
            </div>

            <div class="kpiCard" style="cursor:pointer;" onclick="navigateTo('production')">
                <div class="kpiTop">
                    <span class="kpiLabel">${todaysGoodies.label}</span>
                    <span class="kpiIcon iconAmber"><i class="fa-solid fa-fire-burner"></i></span>
                </div>
                <div class="kpiValue">${goodiesCount}</div>
                <div class="kpiSub">${goodiesCount === 1 ? '1 order' : goodiesCount + ' orders'} in ${todaysGoodies.pickupDay}'s queue</div>
            </div>

        </div>
    `;

    const needsAttention = ORDERS.filter(function(o)
    {
        return o.status === 'newRequest' || o.status === 'pendingPayment';
    });

    const attentionItems = needsAttention.length > 0
        ? needsAttention.map(function(order)
        {
            return `
                <div class="recentRequestItem" style="cursor:pointer;" onclick="navigateTo('orders', {tab:'${order.status}'})">
                    <div class="recentRequestInfo">
                        <div class="recentRequestName">${order.customer}</div>
                        <div class="recentRequestDetail">${order.products} · ${order.pickupDay} ${formatDate(order.pickupDate)}</div>
                    </div>
                    ${buildBadge(order.status)}
                </div>
            `;
        }).join('')
        : `<div class="emptyState"><i class="fa-solid fa-check-circle" style="margin-bottom:0.5rem;font-size:1.5rem;color:var(--clrGreen);"></i><div class="emptyStateTitle">All clear</div><div class="emptyStateSub">No requests need attention</div></div>`;

    const productionActive = ORDERS.filter(function(o)
    {
        return ['inProduction', 'readyForPickup'].includes(o.status);
    });

    const productionItems = productionActive.length > 0
        ? productionActive.map(function(order)
        {
            return `
                <div class="productionQueueItem">
                    <div class="pqiLeft">
                        <div class="pqiCustomer">${order.customer}</div>
                        <div class="pqiProducts">${order.products}</div>
                    </div>
                    <div class="pqiTime">${order.pickupDay}</div>
                    ${buildBadge(order.status)}
                </div>
            `;
        }).join('')
        : `<div class="emptyState"><i class="fa-solid fa-layer-group" style="margin-bottom:0.5rem;font-size:1.5rem;color:var(--clrTextDim);"></i><div class="emptyStateTitle">Nothing in production</div><div class="emptyStateSub">Confirmed orders will appear here</div></div>`;

    const upcomingPickups = ORDERS
        .filter(function(o)
        {
            return o.pickupDate >= DEMO_TODAY
                && !['cancelled', 'completed'].includes(o.status);
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

            <!-- Production Queue -->
            <div class="widgetCard">
                <div class="widgetHeader">
                    <span class="widgetTitle">In Production</span>
                    <span class="widgetMeta">${productionActive.length} active</span>
                </div>
                <div class="widgetBody">
                    ${productionItems}
                </div>
            </div>

            <!-- Upcoming Pickups -->
            <div class="widgetCard">
                <div class="widgetHeader">
                    <span class="widgetTitle">Upcoming Pickups</span>
                    <span class="widgetMeta">Next 7 days</span>
                </div>
                <div class="widgetBody">
                    ${upcomingPickups || '<div class="emptyState"><div class="emptyStateTitle">No upcoming pickups</div></div>'}
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

    // Dashboard page actions wired here

}

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

const ORDER_TABS =
[
    { key: 'newRequest',     label: 'New Requests' },
    { key: 'pendingPayment', label: 'Pending Payment' },
    { key: 'confirmed',      label: 'Confirmed' },
    { key: 'inProduction',   label: 'In Production' },
    { key: 'readyForPickup', label: 'Ready for Pickup' },
    { key: 'completed',      label: 'Completed' },
    { key: 'cancelled',      label: 'Cancelled' }
];

function renderOrdersPage(opts)
{

    const activeTab = (opts && opts.tab) ? opts.tab : 'newRequest';

    const tabsHTML = ORDER_TABS.map(function(tab)
    {

        const count = ORDERS.filter(function(o) { return o.status === tab.key; }).length;

        const badgeHTML = count > 0 ? `<span class="ordersTabBadge">${count}</span>` : '';

        return `<button class="ordersTab ${tab.key === activeTab ? 'isActive' : ''}" data-tab="${tab.key}">${tab.label}${badgeHTML}</button>`;

    }).join('');

    const filteredOrders = ORDERS.filter(function(o) { return o.status === activeTab; });

    const tableRows = filteredOrders.length > 0
        ? filteredOrders.map(function(order)
        {

            const nextStatus = STATUS_NEXT[order.status];

            const actionLabel = STATUS_NEXT_LABEL[order.status];

            const primaryAction = nextStatus
                ? `<button class="btn btnPrimary btnSm btnUpdateStatus" data-id="${order.id}" data-next="${nextStatus}">${actionLabel}</button>`
                : '';

            const cancelAction = !['completed', 'cancelled'].includes(order.status)
                ? `<button class="btn btnRed btnSm btnCancelOrder" data-id="${order.id}">Cancel</button>`
                : '';

            return `
                <tr>
                    <td class="tdId">${order.id}</td>
                    <td class="tdCustomer">${order.customer}</td>
                    <td class="tdMuted">${order.products}</td>
                    <td class="tdMuted">${order.pickupDay}${order.pickupDate ? ' · ' + formatDate(order.pickupDate) : ''}</td>
                    <td>${buildBadge(order.paymentStatus)}</td>
                    <td>
                        <div class="tdActions">
                            ${primaryAction}
                            ${cancelAction}
                        </div>
                    </td>
                </tr>
            `;

        }).join('')
        : `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--clrTextMuted); font-size: 0.84rem;">No orders in this status</td></tr>`;

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Orders</div>
                <div class="pageHeaderSub">${ORDERS.filter(function(o) { return !['completed','cancelled'].includes(o.status); }).length} active · ${ORDERS.length} total</div>
            </div>

            <button class="btn btnPrimary" id="ordersNewRequestBtn">
                <i class="fa-solid fa-plus"></i> New Request
            </button>

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

function initializeOrdersTabs(defaultTab)
{

    const tabs = document.querySelectorAll('.ordersTab');

    tabs.forEach(function(tab)
    {

        tab.addEventListener('click', function()
        {

            const tabKey = tab.dataset.tab;

            navigateTo('orders', { tab: tabKey });

        });

    });

    const ordersNewBtn = document.getElementById('ordersNewRequestBtn');

    if (ordersNewBtn)
    {
        ordersNewBtn.addEventListener('click', showNewOrderRequestModal);
    }

}

function initializeOrdersActions()
{

    const updateBtns = document.querySelectorAll('.btnUpdateStatus');

    updateBtns.forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id = btn.dataset.id;

            const nextStatus = btn.dataset.next;

            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = nextStatus;

                // [SUPABASE HOOK: PATCH orders table status]
                // [TWILIO HOOK: SMS on confirmed/readyForPickup]

                showToast('success', id + ' → ' + STATUS_LABELS[nextStatus]);

                renderPage('orders', { tab: nextStatus });
            }

        });

    });

    const cancelBtns = document.querySelectorAll('.btnCancelOrder');

    cancelBtns.forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id = btn.dataset.id;

            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = 'cancelled';

                showToast('info', id + ' cancelled.');

                renderPage('orders', { tab: 'cancelled' });
            }

        });

    });

}


/* ============================================================
   PRODUCTION PAGE
============================================================ */

function renderProductionPage()
{

    const inProductionOrders   = ORDERS.filter(function(o) { return o.status === 'inProduction'; });
    const confirmedOrders      = ORDERS.filter(function(o) { return o.status === 'confirmed'; });
    const readyForPickupOrders = ORDERS.filter(function(o) { return o.status === 'readyForPickup'; });

    const totalActive = inProductionOrders.length + confirmedOrders.length + readyForPickupOrders.length;

    const dayGroups = BAKERY_CONFIG.productionDays.map(function(day)
    {

        const dayOrders  = inProductionOrders.filter(function(o) { return o.pickupDay === day; });
        const pickupDate = dayOrders.length > 0 ? dayOrders[0].pickupDate : null;
        const dateLabel  = pickupDate ? ' · ' + formatDateShort(pickupDate) : '';

        const cardsHTML = dayOrders.length > 0
            ? dayOrders.map(function(order)
            {
                const nextStatus  = STATUS_NEXT[order.status];
                const actionLabel = STATUS_NEXT_LABEL[order.status];
                const actionBtn   = nextStatus
                    ? `<button class="btn btnSm btnGreen btnAdvanceProduction" data-id="${order.id}" data-next="${nextStatus}">${actionLabel}</button>`
                    : '';
                return `
                    <div class="productionCard">
                        <div class="productionCardId">${order.id}</div>
                        <div class="productionCardCustomer">${order.customer}</div>
                        <div class="productionCardProducts">${order.products}</div>
                        <div class="productionCardFooter">
                            ${buildBadge(order.status)}
                            <div class="productionCardTime">${order.pickupTime || ''}</div>
                            ${actionBtn}
                        </div>
                    </div>
                `;
            }).join('')
            : `<div class="productionEmpty">No orders in production</div>`;

        return `
            <div class="productionDayGroup">
                <div class="productionDayHeader">
                    <div>
                        <div class="productionDayTitle">${day}</div>
                        <div class="productionDayDate">${dateLabel}</div>
                    </div>
                    <div class="productionDayCount">${dayOrders.length}</div>
                </div>
                <div class="productionCards">
                    ${cardsHTML}
                </div>
            </div>
        `;

    }).join('');

    const confirmedRowsHTML = confirmedOrders.length > 0
        ? confirmedOrders.map(function(order)
        {
            const pickupLabel = order.pickupDay + (order.pickupDate ? ' · ' + formatDateShort(order.pickupDate) : '');
            return `
                <div class="productionQueueRow">
                    <div class="pqrId">${order.id}</div>
                    <div class="pqrCustomer">${order.customer}</div>
                    <div class="pqrProducts">${order.products}</div>
                    <div class="pqrPickup">${pickupLabel}</div>
                    <button class="btn btnSm btnPrimary btnAdvanceProduction" data-id="${order.id}" data-next="inProduction">Start Production</button>
                </div>
            `;
        }).join('')
        : `<div class="productionEmpty">No confirmed orders awaiting production</div>`;

    const pickupRowsHTML = readyForPickupOrders.length > 0
        ? readyForPickupOrders.map(function(order)
        {
            const pickupLabel = order.pickupDay + (order.pickupDate ? ' · ' + formatDateShort(order.pickupDate) : '');
            return `
                <div class="pickupQueueRow">
                    <div class="pkrCustomer">${order.customer}</div>
                    <div class="pkrProducts">${order.products}</div>
                    <div class="pkrTime">${pickupLabel}</div>
                    <button class="btn btnSm btnGreen btnAdvanceProduction" data-id="${order.id}" data-next="completed">Mark Picked Up</button>
                </div>
            `;
        }).join('')
        : `<div class="productionEmpty">No orders awaiting pickup</div>`;

    return `

        <div class="pageHeader">
            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Production</div>
                <div class="pageHeaderSub">${totalActive} active order${totalActive !== 1 ? 's' : ''} · ${inProductionOrders.length} in production · ${readyForPickupOrders.length} ready for pickup</div>
            </div>
        </div>

        <div class="productionSectionLabel">In Production</div>
        <div class="productionDayGroups">
            ${dayGroups}
        </div>

        <div class="productionSectionLabel" style="margin-top: 2rem;">Confirmed Queue</div>
        <div class="productionQueueTable">
            ${confirmedRowsHTML}
        </div>

        <div class="productionSectionLabel" style="margin-top: 2rem;">Ready for Pickup</div>
        <div class="pickupQueueTable">
            ${pickupRowsHTML}
        </div>

    `;

}

function initializeProductionActions()
{

    const advanceBtns = document.querySelectorAll('.btnAdvanceProduction');

    advanceBtns.forEach(function(btn)
    {

        btn.addEventListener('click', function()
        {

            const id = btn.dataset.id;

            const nextStatus = btn.dataset.next;

            const order = ORDERS.find(function(o) { return o.id === id; });

            if (order)
            {
                order.status = nextStatus;

                // [SUPABASE HOOK: PATCH orders table status]

                showToast('success', id + ' → ' + STATUS_LABELS[nextStatus]);

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

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <div class="customerAvatar">${getInitials(customer.name)}</div>
                        <span class="tdCustomer">${customer.name}</span>
                    </div>
                </td>
                <td class="tdMuted">${buildPhoneDisplay(customer.phone)}</td>
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
                <div class="pageHeaderTitle">Customer List</div>
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

        return `
            <div class="feedbackCard ${isResolved ? 'isResolved' : 'isOpen'}">
                <div class="feedbackCardTop">
                    <div>
                        <div class="feedbackCustomer">${fb.customer}</div>
                        <div class="feedbackMeta">
                            <span class="feedbackPhone">${buildPhoneDisplay(fb.phone)}</span>
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

    const resolveBtns = document.querySelectorAll('.btnMarkResolved');

    resolveBtns.forEach(function(btn)
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

    const data = REPORTS_DATA;

    const maxOrderCount = Math.max.apply(null, data.weeklyOrders.map(function(d) { return d.count; }));

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

        <!-- Summary KPI Cards -->
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

            <!-- Weekly Orders Chart -->
            <div class="reportCard">
                <div class="reportCardTitle">Weekly Orders — Jun 23 to Jun 30</div>
                <div class="barChart">
                    ${orderBars}
                </div>
            </div>

            <!-- Popular Products -->
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

    const config = BAKERY_CONFIG;

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
                <div class="pageHeaderSub">Bakery control center &mdash; business, schedule, and social</div>
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
                        <input class="formInput" type="text" value="${config.businessName}" placeholder="Business name">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Owner Name</label>
                        <input class="formInput" type="text" value="${config.ownerFullName}" placeholder="Owner name">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Phone</label>
                        <input class="formInput" type="tel" value="${config.phone}" placeholder="Phone number">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Address</label>
                        <input class="formInput" type="text" value="${config.address}" placeholder="Business address">
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn" onclick="showToast('success', 'Business info saved.')">
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
                        <p class="formHint">Select the days you produce and fulfill orders each week.</p>
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

                    <button class="btn btnPrimary settingsSaveBtn" onclick="showToast('success', 'Production schedule saved.')">
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
                        <textarea class="formInput formTextarea formTextareaLg" placeholder="Pickup instructions for customers">${config.pickupInstructions}</textarea>
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn" onclick="showToast('success', 'Pickup instructions saved.')">
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
                        <input class="formInput" type="url" value="${config.googleReviewLink}" placeholder="Google review URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Facebook</label>
                        <input class="formInput" type="url" value="${config.social.facebook}" placeholder="Facebook URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">TikTok</label>
                        <input class="formInput" type="url" value="${config.social.tiktok}" placeholder="TikTok URL">
                    </div>

                    <div class="formGroup">
                        <label class="formLabel">Website</label>
                        <input class="formInput" type="url" value="${config.website}" placeholder="https://yourwebsite.com">
                    </div>

                    <button class="btn btnPrimary settingsSaveBtn" onclick="showToast('success', 'Social links saved.')">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>

                </div>

            </div>

        </div>

    `;

}

function initializeSettingsInteractions()
{

    const dayToggles = document.querySelectorAll('.dayToggle');

    dayToggles.forEach(function(toggle)
    {

        toggle.addEventListener('click', function()
        {

            toggle.classList.toggle('isActive');

            const day = toggle.dataset.day;

            const isNowActive = toggle.classList.contains('isActive');

            const capacityRow = document.querySelector('.capacityRow[data-day="' + day + '"]');

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

}


/* ============================================================
   HELP PAGE
============================================================ */

function renderHelpPage()
{

    const faqItems =
    [
        'How do I confirm an order request?',
        'How do I mark an order as Ready for pickup?',
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
                <i class="fa-solid fa-chevron-right helpFaqIcon"></i>
            </div>
        `;

    }).join('');

    return `

        <div class="pageHeader">

            <div class="pageHeaderLeft">
                <div class="pageHeaderTitle">Help & Support</div>
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

    const faqItems = document.querySelectorAll('.helpFaqItem');

    faqItems.forEach(function(item)
    {

        item.addEventListener('click', function()
        {
            showToast('info', 'Full documentation coming in NuloOS v1.1');
        });

    });

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

    const label = document.getElementById('themeToggleLabel');

    const switchEl = document.getElementById('themeToggleSwitch');

    if (label)
    {
        label.textContent = isLightTheme ? 'Dark Mode' : 'Light Mode';
    }

    if (switchEl)
    {
        switchEl.classList.toggle('isActive', isLightTheme);
    }

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

        container.id = 'toastContainer';

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

        toast.style.opacity = '0';

        toast.style.transform = 'translateX(20px)';

        toast.style.transition = 'all 0.25s ease';

        setTimeout(function()
        {
            toast.remove();
        }, 300);

    }, 3200);

}


/* ============================================================
   MOBILE MENU
============================================================ */

function openMobileMenu()
{

    const sidebar = document.getElementById('sidebar');

    const overlay = document.getElementById('mobileOverlay');

    if (sidebar)
    {
        sidebar.classList.add('isOpen');
    }

    if (overlay)
    {
        overlay.classList.add('isVisible');
    }

}

function closeMobileMenu()
{

    const sidebar = document.getElementById('sidebar');

    const overlay = document.getElementById('mobileOverlay');

    if (sidebar)
    {
        sidebar.classList.remove('isOpen');
    }

    if (overlay)
    {
        overlay.classList.remove('isVisible');
    }

}


/* ============================================================
   EVENT LISTENERS
============================================================ */

document.addEventListener('DOMContentLoaded', function()
{

    // Navigation clicks

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

    // Sidebar: New Order Request CTA

    const sidebarNewOrderBtn = document.getElementById('sidebarNewOrderBtn');

    if (sidebarNewOrderBtn)
    {
        sidebarNewOrderBtn.addEventListener('click', showNewOrderRequestModal);
    }

    // Hamburger menu

    const hamburgerBtn = document.getElementById('hamburgerBtn');

    if (hamburgerBtn)
    {
        hamburgerBtn.addEventListener('click', openMobileMenu);
    }

    // Overlay close

    const mobileOverlay = document.getElementById('mobileOverlay');

    if (mobileOverlay)
    {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    // Theme toggle

    const themeToggleBtn = document.getElementById('themeToggleBtn');

    if (themeToggleBtn)
    {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Logout button

    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn)
    {
        logoutBtn.addEventListener('click', function()
        {
            showToast('info', 'Auth not required in demo mode.');
        });
    }

});


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener('DOMContentLoaded', function()
{

    // Update nav badge for new requests

    const navBadge = document.getElementById('navBadgeRequests');

    if (navBadge)
    {
        navBadge.textContent = countNewRequests();
    }

    // Populate top bar date

    const topBarDate = document.getElementById('topBarDate');

    if (topBarDate)
    {

        const today = new Date(DEMO_TODAY + 'T12:00:00');

        topBarDate.textContent = today.toLocaleDateString('en-US',
        {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

    }

    // Render initial page

    renderPage('dashboard');

});
