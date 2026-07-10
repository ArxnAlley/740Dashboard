/* ============================================================
   NULOEDGE BAKERY MODULE — DEMO DATA LAYER
   dashboardData.js

   All data in this file acts as the demo backend.

   FUTURE HOOK: Replace individual arrays/objects with
   API calls to the appropriate data source:

   [SHEETS HOOK]     — Google Sheets API v4 (initial integration)
   [SUPABASE HOOK]   — Supabase JS client (production)
   [TWILIO HOOK]     — SMS/call notifications
   [STRIPE HOOK]     — Payment status sync
   [SQUARE HOOK]     — POS integration
   [REVIEWS HOOK]    — Internal feedback collection
   [CALENDAR HOOK]   — Google Calendar event creation

   Each object/array maps directly to a future database table.
   client_id field present throughout for multi-tenant support.
============================================================ */


/* ============================================================
   DATE CONSTANTS
============================================================ */

// Live integration: the dashboard runs against the real local date.
// Built from local time parts — toISOString() would shift to the
// next UTC day during evening hours in Eastern Time.
function getTodayDateString()
{

    const now   = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');

    return now.getFullYear() + '-' + month + '-' + day;

}

const TODAY_DATE = getTodayDateString();


/* ============================================================
   BUSINESS CONFIGURATION
============================================================ */

// [SUPABASE HOOK: clients table — loaded per authenticated session]
const BAKERY_CONFIG =
{

    clientId: 'bakery-740eatz-001',

    businessName: '740Eatz',

    ownerName: 'Brigitte',

    ownerFullName: 'Brigitte Nichols',

    ownerInitials: 'BN',

    onlineStatus: 'online',

    phone: '(220) 240-8435',

    address: '429 2nd St, Portsmouth, OH 45662',

    pickupDays: ['Monday', 'Tuesday', 'Friday'],

    // productionDays drives production queue, Calendar capacity display, and Apps Script scheduling
    productionDays: ['Monday', 'Tuesday', 'Friday'],

    // dailyCapacity is read by getCapacityForDate() and surfaced on the Calendar per-day view
    dailyCapacity:
    {
        Monday:    15,
        Tuesday:   15,
        Wednesday:  0,
        Thursday:  10,
        Friday:    15,
        Saturday:   0,
        Sunday:     0
    },

    pickupInstructions: 'Orders are available for pickup at the address on file. Please bring your order confirmation number. Contact us if you need to reschedule.',

    orderAvailability: 'accepting',

    pickupConfiguration:
    {
        message: '',
        windows: []
    },

    googleReviewLink: '', // [REVIEWS HOOK: populate from client config]

    social:
    {

        facebook: 'https://www.facebook.com/profile.php?id=61558663167143',

        tiktok: 'https://www.tiktok.com/@brigitterheaa',

        instagram: ''

    },

    website: '',

    currency: 'USD'

};


/* ============================================================
   PRODUCTS
============================================================ */

// [SUPABASE HOOK: products table — filtered by client_id]
const BAKERY_PRODUCTS =
[

    {
        id: 'prod-001',
        name: 'Large Tray',
        category: 'Candied Fruit',
        price: 40,
        unit: 'tray',
        visible: true,
        description: 'Large candied fruit tray — choice of flavors',
        sortOrder: 1
    },

    {
        id: 'prod-002',
        name: 'Small Tray',
        category: 'Candied Fruit',
        price: 25,
        unit: 'tray',
        visible: true,
        description: 'Small candied fruit tray — choice of flavors',
        sortOrder: 2
    },

    {
        id: 'prod-003',
        name: 'Trio Tray',
        category: 'Candied Fruit',
        price: 45,
        unit: 'tray',
        visible: true,
        description: 'Three-flavor candied fruit tray',
        sortOrder: 3
    },

    {
        id: 'prod-004',
        name: 'Chocolate Covered Strawberries',
        category: 'Strawberries',
        price: 25,
        unit: 'dozen',
        visible: true,
        description: 'Dozen chocolate covered strawberries — Milk, White, or Dark chocolate',
        sortOrder: 4
    },

    {
        id: 'prod-005',
        name: 'Cheesecake Stuffed Strawberries',
        category: 'Strawberries',
        price: 27,
        unit: 'dozen',
        visible: true,
        description: 'Cheesecake stuffed strawberries by the dozen',
        sortOrder: 5
    }

];


/* ============================================================
   ORDERS
   Unified array — single source of truth for all order data.

   Internal status contract (permanent NuloOS workflow):
   NEW_REQUEST → AWAITING_PAYMENT → CONFIRMED → IN_PRODUCTION → PENDING_PICKUP → COMPLETED
   NEW_REQUEST or AWAITING_PAYMENT may also transition to CANCELLED.
   Apps Script moves CONFIRMED orders into IN_PRODUCTION on production days.

   Status values must match this contract in all future integrations:
   Google Sheets, Apps Script, Supabase, Twilio, and Calendar hooks.
============================================================ */

// [SHEETS HOOK — LIVE] Populated from the Apps Script API at startup:
// loadOrdersFromAPI() in dashboardAPI.js calls orders.list and fills this
// array in place. It starts empty — Google Sheets is the source of truth.
// Order row shape (contract shared with the API's ORDERS_HEADERS):
//   id, clientId, customer, phone, email, product, size, flavor,
//   products, pickupDay, pickupDate, pickupTime, productTotal,
//   status, paymentStatus, notes, source, submittedAt, updatedAt
// [SUPABASE HOOK: orders table, client_id filtered]
// [STRIPE HOOK: paymentStatus sync from Stripe webhook]
// [TWILIO HOOK: SMS trigger on status change to CONFIRMED]
// [CALENDAR HOOK: Create Google Calendar event on CONFIRMED]
const ORDERS = [];


/* ============================================================
   CUSTOMERS
============================================================ */

// [SUPABASE HOOK: customers table — auto-populated from order submissions]
const CUSTOMERS =
[

    {
        id: 'cust-001',
        clientId: 'bakery-740eatz-001',
        name: 'Keisha Davis',
        phone: '(740) 555-0829',
        email: 'keishadavis@gmail.com',
        lifetimeOrders: 9,
        lifetimeSpend: 450,
        lastOrderDate: '2026-06-30',
        notes: 'VIP — orders nearly every pickup day. Very loyal.'
    },

    {
        id: 'cust-002',
        clientId: 'bakery-740eatz-001',
        name: 'Tamara Lewis',
        phone: '(740) 555-0738',
        email: 'tamaralewis@gmail.com',
        lifetimeOrders: 6,
        lifetimeSpend: 290,
        lastOrderDate: '2026-06-30',
        notes: ''
    },

    {
        id: 'cust-003',
        clientId: 'bakery-740eatz-001',
        name: 'Michelle Carter',
        phone: '(614) 555-0647',
        email: 'michellecarter@gmail.com',
        lifetimeOrders: 7,
        lifetimeSpend: 375,
        lastOrderDate: '2026-06-27',
        notes: 'Drives from Columbus. Loyal fan.'
    },

    {
        id: 'cust-004',
        clientId: 'bakery-740eatz-001',
        name: 'Sarah Mitchell',
        phone: '(740) 555-0182',
        email: 'sarahmitchell@gmail.com',
        lifetimeOrders: 5,
        lifetimeSpend: 225,
        lastOrderDate: '2026-06-30',
        notes: ''
    },

    {
        id: 'cust-005',
        clientId: 'bakery-740eatz-001',
        name: 'Ashley Williams',
        phone: '(740) 555-0475',
        email: 'ashleyw@gmail.com',
        lifetimeOrders: 4,
        lifetimeSpend: 185,
        lastOrderDate: '2026-06-28',
        notes: 'Prefers bluerazz and watermelon flavors.'
    },

    {
        id: 'cust-006',
        clientId: 'bakery-740eatz-001',
        name: 'Jennifer Torres',
        phone: '(614) 555-0384',
        email: 'jentorres@gmail.com',
        lifetimeOrders: 3,
        lifetimeSpend: 135,
        lastOrderDate: '2026-05-30',
        notes: ''
    },

    {
        id: 'cust-007',
        clientId: 'bakery-740eatz-001',
        name: 'Marcus Johnson',
        phone: '(740) 555-0293',
        email: 'marcusjohnson@gmail.com',
        lifetimeOrders: 2,
        lifetimeSpend: 95,
        lastOrderDate: '2026-06-16',
        notes: ''
    },

    {
        id: 'cust-008',
        clientId: 'bakery-740eatz-001',
        name: 'Destiny Brown',
        phone: '(740) 555-0516',
        email: 'destinybrown@gmail.com',
        lifetimeOrders: 1,
        lifetimeSpend: 65,
        lastOrderDate: '2026-06-30',
        notes: 'New customer — discovered via TikTok.'
    }

];


/* ============================================================
   REVIEWS — Internal Customer Feedback
   NOT Google reviews — internal recovery tracking only.
   Goal: resolve unhappy customers before they leave a bad review.
============================================================ */

// [REVIEWS HOOK: Internal feedback collection via post-pickup SMS survey]
// [SUPABASE HOOK: customer_feedback table, client_id filtered]
// [FUTURE: Auto-flag orders for follow-up when rating <= 3]
// Live integration: demo feedback removed. Starts empty until the
// post-pickup feedback survey (Reviews Hook) is wired up.
const REVIEWS_DATA = [];


/* ============================================================
   REPORTS DATA
============================================================ */

// [SUPABASE HOOK: Aggregate queries on orders table by date range]
// Live integration: demo metrics and charts removed. Starts at zero
// until real order history accumulates — see renderReportsPage()'s
// empty-state handling for weeklyOrders/productPopularity.
const REPORTS_DATA =
{

    weeklyOrders: [],

    productPopularity: [],

    weeklyRevenueSummary:
    {
        total: 0,
        orderCount: 0,
        avgOrderValue: 0
    },

    repeatCustomers: 0

};


/* ============================================================
   CALENDAR DATA UTILITIES

   These functions are the data layer for the future Calendar page.
   The Calendar renderer calls buildCalendarData(startDate, endDate)
   and receives a pre-grouped map — no scheduling logic needed in the renderer.

   All functions read from BAKERY_CONFIG and ORDERS.
   pickupDate (YYYY-MM-DD) is the canonical scheduling field on every order.
   Apps Script uses the same field when moving orders to IN_PRODUCTION.
============================================================ */

// Returns the weekday name for a YYYY-MM-DD string.
// Parsed at noon to avoid daylight saving time boundary issues.
function getDayOfWeek(dateStr)
{

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d    = new Date(dateStr + 'T12:00:00');

    return days[d.getDay()];

}

// Returns the configured daily capacity for a given date.
// Reads from BAKERY_CONFIG.dailyCapacity via the date's weekday.
function getCapacityForDate(dateStr)
{

    const day = getDayOfWeek(dateStr);

    return BAKERY_CONFIG.dailyCapacity[day] || 0;

}

// Returns true if a given date falls on a configured production day.
function isProductionDay(dateStr)
{

    return BAKERY_CONFIG.productionDays.includes(getDayOfWeek(dateStr));

}

// Returns true if a given date falls on a configured pickup day.
function isPickupDay(dateStr)
{

    return BAKERY_CONFIG.pickupDays.includes(getDayOfWeek(dateStr));

}

// Builds a calendar-ready data map for a date range.
// Returns an object keyed by YYYY-MM-DD. Each entry contains:
//   capacity, isProductionDay, isPickupDay, and orders grouped by status.
// The Calendar renderer iterates this map directly — no further shaping needed.
//
// [CALENDAR HOOK: Replace ORDERS.forEach with Supabase query filtered by date range and client_id]
function buildCalendarData(startDate, endDate)
{

    const map    = {};
    const cursor = new Date(startDate + 'T12:00:00');
    const end    = new Date(endDate   + 'T12:00:00');

    while (cursor <= end)
    {

        const dateStr   = cursor.toISOString().slice(0, 10);
        const dayOfWeek = getDayOfWeek(dateStr);

        map[dateStr] =
        {
            date:            dateStr,
            dayOfWeek:       dayOfWeek,
            capacity:        BAKERY_CONFIG.dailyCapacity[dayOfWeek] || 0,
            isProductionDay: BAKERY_CONFIG.productionDays.includes(dayOfWeek),
            isPickupDay:     BAKERY_CONFIG.pickupDays.includes(dayOfWeek),
            confirmed:       [],
            inProduction:    [],
            pendingPickup:   [],
            completed:       [],
            activeCount:     0
        };

        cursor.setDate(cursor.getDate() + 1);

    }

    ORDERS.forEach(function(order)
    {

        const day = map[order.pickupDate];

        if (!day) { return; }

        if (order.status === 'CONFIRMED')      { day.confirmed.push(order); }
        if (order.status === 'IN_PRODUCTION')  { day.inProduction.push(order); }
        if (order.status === 'PENDING_PICKUP') { day.pendingPickup.push(order); }
        if (order.status === 'COMPLETED')      { day.completed.push(order); }

        if (order.status !== 'CANCELLED' && order.status !== 'COMPLETED')
        {
            day.activeCount++;
        }

    });

    return map;

}


/* ============================================================
   ACTIVITY LOG
============================================================ */

// [SUPABASE HOOK: activity_log table — auto-generated on status changes]
// Live integration: demo entries removed. Activity will be derived from
// real order events (status changes, new requests) in a future sprint.
const ACTIVITY_LOG = [];
