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
   DEMO CONSTANTS
============================================================ */

const DEMO_TODAY = '2026-06-30';

// Demo override: all data was authored as if 2026-06-30 is a Monday.
// In production, remove this constant and compute from the live date.
const DEMO_DAY_OF_WEEK = 'Monday';


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

// [SHEETS HOOK: OrderRequests sheet — new requests arrive here]
// [SUPABASE HOOK: orders table, client_id filtered]
// [STRIPE HOOK: paymentStatus sync from Stripe webhook]
// [TWILIO HOOK: SMS trigger on status change to CONFIRMED]
// [CALENDAR HOOK: Create Google Calendar event on CONFIRMED]
const ORDERS =
[

    {
        id: 'ORD-2201',
        clientId: 'bakery-740eatz-001',
        customer: 'Sarah Mitchell',
        phone: '(740) 555-0182',
        pickupDay: 'Friday',
        pickupDate: '2026-07-03',
        pickupTime: '12:00 PM',
        products: 'Cheesecake Stuffed Strawberries x2',
        productTotal: 54,
        status: 'CONFIRMED',
        paymentStatus: 'paid',
        notes: '',
        submittedAt: '2026-06-28T14:15:00'
    },

    {
        id: 'ORD-2200',
        clientId: 'bakery-740eatz-001',
        customer: 'Keisha Davis',
        phone: '(740) 555-0829',
        pickupDay: 'Monday',
        pickupDate: '2026-06-30',
        pickupTime: '2:00 PM',
        products: 'Large Tray x2',
        productTotal: 80,
        status: 'PENDING_PICKUP',
        paymentStatus: 'paid',
        notes: 'Repeat customer.',
        submittedAt: '2026-06-26T09:00:00'
    },

    {
        id: 'ORD-NEW-001',
        clientId: 'bakery-740eatz-001',
        customer: 'Ashley Williams',
        phone: '(740) 555-0475',
        pickupDay: 'Friday',
        pickupDate: '2026-07-03',
        pickupTime: '10:00 AM',
        products: 'Large Tray x1',
        productTotal: 40,
        status: 'CONFIRMED',
        paymentStatus: 'paid',
        notes: 'Bluerazz and watermelon flavors.',
        submittedAt: '2026-06-27T08:30:00'
    },

    {
        id: 'ORD-NEW-002',
        clientId: 'bakery-740eatz-001',
        customer: 'Tamara Lewis',
        phone: '(740) 555-0738',
        pickupDay: 'Friday',
        pickupDate: '2026-07-03',
        pickupTime: '1:00 PM',
        products: 'Small Tray x1',
        productTotal: 25,
        status: 'CONFIRMED',
        paymentStatus: 'paid',
        notes: '',
        submittedAt: '2026-06-25T10:00:00'
    },

    {
        id: 'ORD-2199',
        clientId: 'bakery-740eatz-001',
        customer: 'Michelle Carter',
        phone: '(614) 555-0647',
        pickupDay: 'Friday',
        pickupDate: '2026-06-27',
        pickupTime: '11:00 AM',
        products: 'Trio Tray x1, Chocolate Covered Strawberries x1',
        productTotal: 70,
        status: 'COMPLETED',
        paymentStatus: 'paid',
        notes: '',
        submittedAt: '2026-06-24T11:00:00'
    },

    {
        id: 'ORD-2198',
        clientId: 'bakery-740eatz-001',
        customer: 'Tamara Lewis',
        phone: '(740) 555-0738',
        pickupDay: 'Tuesday',
        pickupDate: '2026-06-24',
        pickupTime: '1:00 PM',
        products: 'Small Tray x2',
        productTotal: 50,
        status: 'COMPLETED',
        paymentStatus: 'paid',
        notes: '',
        submittedAt: '2026-06-20T14:00:00'
    },

    {
        id: 'ORD-2197',
        clientId: 'bakery-740eatz-001',
        customer: 'Ashley Williams',
        phone: '(740) 555-0475',
        pickupDay: 'Monday',
        pickupDate: '2026-06-23',
        pickupTime: '12:00 PM',
        products: 'Large Tray x1, Chocolate Covered Strawberries x1',
        productTotal: 65,
        status: 'COMPLETED',
        paymentStatus: 'paid',
        notes: '',
        submittedAt: '2026-06-19T09:30:00'
    },

    {
        id: 'REQ-0046',
        clientId: 'bakery-740eatz-001',
        customer: 'Tamara Lewis',
        phone: '(740) 555-0738',
        pickupDay: 'Friday',
        pickupDate: '2026-07-03',
        pickupTime: '',
        products: 'Small Tray x1',
        productTotal: 25,
        status: 'NEW_REQUEST',
        paymentStatus: 'unpaid',
        notes: '',
        submittedAt: '2026-06-30T11:42:00'
    },

    {
        id: 'REQ-0044',
        clientId: 'bakery-740eatz-001',
        customer: 'Destiny Brown',
        phone: '(740) 555-0516',
        pickupDay: 'Tuesday',
        pickupDate: '2026-07-07',
        pickupTime: '',
        products: 'Large Tray x1, Chocolate Covered Strawberries x1',
        productTotal: 65,
        status: 'NEW_REQUEST',
        paymentStatus: 'unpaid',
        notes: 'First time customer — discovered via TikTok.',
        submittedAt: '2026-06-30T09:51:00'
    },

    {
        id: 'REQ-0042',
        clientId: 'bakery-740eatz-001',
        customer: 'Marcus Johnson',
        phone: '(740) 555-0293',
        pickupDay: 'Monday',
        pickupDate: '2026-07-06',
        pickupTime: '',
        products: 'Small Tray x2, Trio Tray x1',
        productTotal: 95,
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'unpaid',
        notes: 'Called Monday, no answer.',
        submittedAt: '2026-06-27T10:08:00'
    },

    {
        id: 'REQ-0041',
        clientId: 'bakery-740eatz-001',
        customer: 'Ashley Williams',
        phone: '(740) 555-0475',
        pickupDay: 'Friday',
        pickupDate: '2026-07-03',
        pickupTime: '',
        products: 'Large Tray x1',
        productTotal: 40,
        status: 'NEW_REQUEST',
        paymentStatus: 'unpaid',
        notes: 'Wants bluerazz and watermelon flavors.',
        submittedAt: '2026-06-27T08:30:00'
    },

    {
        id: 'REQ-0045',
        clientId: 'bakery-740eatz-001',
        customer: 'Jennifer Torres',
        phone: '(614) 555-0384',
        pickupDay: 'Monday',
        pickupDate: '2026-07-06',
        pickupTime: '',
        products: 'Trio Tray x2',
        productTotal: 90,
        status: 'CANCELLED',
        paymentStatus: 'unpaid',
        notes: 'Customer changed mind.',
        submittedAt: '2026-06-29T16:20:00'
    }

];


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
const REVIEWS_DATA =
[

    {
        id: 'fb-001',
        clientId: 'bakery-740eatz-001',
        customer: 'Jennifer Torres',
        phone: '(614) 555-0384',
        rating: 2,
        issue: 'Order was missing a full dozen of chocolate covered strawberries.',
        resolutionStatus: 'open',
        notes: 'Reached out via text on Jun 29, no response yet.',
        date: '2026-06-29'
    },

    {
        id: 'fb-002',
        clientId: 'bakery-740eatz-001',
        customer: 'Marcus Johnson',
        phone: '(740) 555-0293',
        rating: 3,
        issue: 'Candy was partially melted — packaging issue in warm weather.',
        resolutionStatus: 'resolved',
        notes: 'Offered 10% off next order. Marcus accepted and reordered.',
        date: '2026-06-16'
    },

    {
        id: 'fb-003',
        clientId: 'bakery-740eatz-001',
        customer: 'Destiny Brown',
        phone: '(740) 555-0516',
        rating: 3,
        issue: 'Wrong flavor — ordered bluerazz, received original.',
        resolutionStatus: 'open',
        notes: 'Will correct flavor on next order at no extra charge.',
        date: '2026-06-30'
    }

];


/* ============================================================
   REPORTS DATA
============================================================ */

// [SUPABASE HOOK: Aggregate queries on orders table by date range]
const REPORTS_DATA =
{

    weeklyOrders:
    [
        { label: 'Mon 6/23', count: 2, revenue: 105 },
        { label: 'Tue 6/24', count: 1, revenue: 50 },
        { label: 'Fri 6/27', count: 2, revenue: 70 },
        { label: 'Mon 6/30', count: 3, revenue: 80 }
    ],

    productPopularity:
    [
        { name: 'Large Tray', orders: 14 },
        { name: 'Small Tray', orders: 11 },
        { name: 'Trio Tray', orders: 9 },
        { name: 'Choc. Strawberries', orders: 8 },
        { name: 'Cheesecake Strawberries', orders: 6 }
    ],

    weeklyRevenueSummary:
    {
        total: 305,
        orderCount: 8,
        avgOrderValue: 38.13
    },

    repeatCustomers: 6

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
const ACTIVITY_LOG =
[

    {
        type: 'NEW_REQUEST',
        message: 'New order request from Tamara Lewis',
        detail: 'Small Tray x1 — Fri Jul 3',
        time: '11:42 AM',
        icon: 'fa-inbox'
    },

    {
        type: 'NEW_REQUEST',
        message: 'New order request from Destiny Brown',
        detail: 'Large Tray x1, Choc. Strawberries x1 — Tue Jul 7',
        time: '9:51 AM',
        icon: 'fa-inbox'
    },

    {
        type: 'PENDING_PICKUP',
        message: 'ORD-2200 ready for pickup',
        detail: 'Keisha Davis — Mon Jun 30 @ 2:00 PM',
        time: '9:30 AM',
        icon: 'fa-circle-check'
    },

    {
        type: 'CONFIRMED',
        message: 'ORD-2201 confirmed — Sarah Mitchell',
        detail: 'Cheesecake Stuffed Strawberries x2 — Fri Jul 3',
        time: '8:45 AM',
        icon: 'fa-fire-burner'
    },

    {
        type: 'CONFIRMED',
        message: 'ORD-NEW-001 confirmed — Ashley Williams',
        detail: 'Large Tray x1 — Fri Jul 3',
        time: 'Yesterday',
        icon: 'fa-circle-check'
    }

];
