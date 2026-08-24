/**
 * Centralized Header Configuration for FleetCore
 * Data-driven mapping for page titles, sections, breadcrumbs, and contextual primary actions.
 */

export const SECTION_NAMES = {
  OVERVIEW: "Overview",
  OPERATIONS: "Operations",
  MASTERS: "Masters",
  FINANCE: "Finance",
  INSIGHTS: "Insights",
  SYSTEM: "System",
};

/**
 * Static route definitions and route metadata
 */
export const HEADER_ROUTES = [
  // 1. OVERVIEW / DASHBOARD
  {
    pattern: /^\/dashboard$/,
    getConfig: (pathname, searchParams) => {
      const view = searchParams.get("view");
      if (view === "reports") {
        return {
          section: SECTION_NAMES.INSIGHTS,
          title: "Reports",
          breadcrumbs: [
            { label: SECTION_NAMES.INSIGHTS },
            { label: "Reports" },
          ],
          primaryAction: null,
        };
      }
      return {
        section: SECTION_NAMES.OVERVIEW,
        title: "Dashboard",
        breadcrumbs: [
          { label: SECTION_NAMES.OVERVIEW, path: "/dashboard" },
          { label: "Dashboard" },
        ],
        primaryAction: {
          label: "New Dispatch",
          path: "/trips/new",
          icon: "add",
        },
      };
    },
  },

  // 2. OPERATIONS: TRIPS & CALENDAR
  {
    pattern: /^\/trips$/,
    getConfig: (pathname, searchParams) => {
      const tab = searchParams.get("tab");
      const view = searchParams.get("view");

      if (tab === "invoices") {
        return {
          section: SECTION_NAMES.FINANCE,
          title: "Invoices",
          breadcrumbs: [
            { label: SECTION_NAMES.FINANCE, path: "/trips?tab=invoices" },
            { label: "Invoices" },
          ],
          primaryAction: {
            label: "New Invoice",
            path: "/trips/new",
            icon: "add",
          },
        };
      }

      if (tab === "payments") {
        return {
          section: SECTION_NAMES.FINANCE,
          title: "Payments",
          breadcrumbs: [
            { label: SECTION_NAMES.FINANCE, path: "/trips?tab=payments" },
            { label: "Payments" },
          ],
          primaryAction: {
            label: "Record Payment",
            path: "/trips",
            icon: "add",
          },
        };
      }

      if (tab === "ledger") {
        return {
          section: SECTION_NAMES.FINANCE,
          title: "Ledger",
          breadcrumbs: [
            { label: SECTION_NAMES.FINANCE, path: "/trips?tab=ledger" },
            { label: "Ledger" },
          ],
          primaryAction: null,
        };
      }

      if (view === "calendar") {
        return {
          section: SECTION_NAMES.OPERATIONS,
          title: "Trip Calendar",
          breadcrumbs: [
            { label: SECTION_NAMES.OPERATIONS, path: "/trips" },
            { label: "Trips", path: "/trips" },
            { label: "Calendar" },
          ],
          primaryAction: {
            label: "New Trip",
            path: "/trips/new",
            icon: "add",
          },
        };
      }

      return {
        section: SECTION_NAMES.OPERATIONS,
        title: "Trips / Bookings",
        breadcrumbs: [
          { label: SECTION_NAMES.OPERATIONS, path: "/trips" },
          { label: "Trips" },
        ],
        primaryAction: {
          label: "New Trip",
          path: "/trips/new",
          icon: "add",
        },
      };
    },
  },
  {
    pattern: /^\/trips\/new$/,
    getConfig: () => ({
      section: SECTION_NAMES.OPERATIONS,
      title: "Create Trip",
      breadcrumbs: [
        { label: SECTION_NAMES.OPERATIONS, path: "/trips" },
        { label: "Trips", path: "/trips" },
        { label: "Create Trip" },
      ],
      primaryAction: null,
    }),
  },
  {
    pattern: /^\/trips\/([^/]+)\/edit$/,
    getConfig: (pathname) => {
      const match = pathname.match(/^\/trips\/([^/]+)\/edit$/);
      const tripId = match ? match[1] : "";
      return {
        section: SECTION_NAMES.OPERATIONS,
        title: "Edit Trip",
        breadcrumbs: [
          { label: SECTION_NAMES.OPERATIONS, path: "/trips" },
          { label: "Trips", path: "/trips" },
          { label: tripId || "Edit Trip" },
        ],
        primaryAction: null,
      };
    },
  },

  // 3. MASTERS: CUSTOMERS
  {
    pattern: /^\/customers$/,
    getConfig: () => ({
      section: SECTION_NAMES.MASTERS,
      title: "Customers",
      breadcrumbs: [
        { label: SECTION_NAMES.MASTERS, path: "/customers" },
        { label: "Customers" },
      ],
      primaryAction: {
        label: "New Customer",
        path: "/customers/new",
        icon: "add",
      },
    }),
  },
  {
    pattern: /^\/customers\/new$/,
    getConfig: () => ({
      section: SECTION_NAMES.MASTERS,
      title: "Add Customer",
      breadcrumbs: [
        { label: SECTION_NAMES.MASTERS, path: "/customers" },
        { label: "Customers", path: "/customers" },
        { label: "Add Customer" },
      ],
      primaryAction: null,
    }),
  },
  {
    pattern: /^\/customers\/([^/]+)\/edit$/,
    getConfig: (pathname) => {
      const match = pathname.match(/^\/customers\/([^/]+)\/edit$/);
      const customerId = match ? match[1] : "";
      return {
        section: SECTION_NAMES.MASTERS,
        title: "Edit Customer",
        breadcrumbs: [
          { label: SECTION_NAMES.MASTERS, path: "/customers" },
          { label: "Customers", path: "/customers" },
          { label: customerId || "Edit Customer" },
        ],
        primaryAction: null,
      };
    },
  },

  // 4. MASTERS: VEHICLES
  {
    pattern: /^\/vehicles$/,
    getConfig: () => ({
      section: SECTION_NAMES.MASTERS,
      title: "Vehicles",
      breadcrumbs: [
        { label: SECTION_NAMES.MASTERS, path: "/vehicles" },
        { label: "Vehicles" },
      ],
      primaryAction: {
        label: "New Vehicle",
        path: "/vehicles/new",
        icon: "add",
      },
    }),
  },
  {
    pattern: /^\/vehicles\/new$/,
    getConfig: () => ({
      section: SECTION_NAMES.MASTERS,
      title: "Add Vehicle",
      breadcrumbs: [
        { label: SECTION_NAMES.MASTERS, path: "/vehicles" },
        { label: "Vehicles", path: "/vehicles" },
        { label: "Add Vehicle" },
      ],
      primaryAction: null,
    }),
  },
  {
    pattern: /^\/vehicles\/([^/]+)\/edit$/,
    getConfig: (pathname) => {
      const match = pathname.match(/^\/vehicles\/([^/]+)\/edit$/);
      const vehicleId = match ? match[1] : "";
      return {
        section: SECTION_NAMES.MASTERS,
        title: "Edit Vehicle",
        breadcrumbs: [
          { label: SECTION_NAMES.MASTERS, path: "/vehicles" },
          { label: "Vehicles", path: "/vehicles" },
          { label: vehicleId || "Edit Vehicle" },
        ],
        primaryAction: null,
      };
    },
  },

  // 5. MASTERS: DRIVERS
  {
    pattern: /^\/drivers$/,
    getConfig: () => ({
      section: SECTION_NAMES.MASTERS,
      title: "Drivers",
      breadcrumbs: [
        { label: SECTION_NAMES.MASTERS, path: "/drivers" },
        { label: "Drivers" },
      ],
      primaryAction: {
        label: "New Driver",
        path: "/drivers/new",
        icon: "add",
      },
    }),
  },
  {
    pattern: /^\/drivers\/new$/,
    getConfig: () => ({
      section: SECTION_NAMES.MASTERS,
      title: "Add Driver",
      breadcrumbs: [
        { label: SECTION_NAMES.MASTERS, path: "/drivers" },
        { label: "Drivers", path: "/drivers" },
        { label: "Add Driver" },
      ],
      primaryAction: null,
    }),
  },
  {
    pattern: /^\/drivers\/([^/]+)\/edit$/,
    getConfig: (pathname) => {
      const match = pathname.match(/^\/drivers\/([^/]+)\/edit$/);
      const driverId = match ? match[1] : "";
      return {
        section: SECTION_NAMES.MASTERS,
        title: "Edit Driver",
        breadcrumbs: [
          { label: SECTION_NAMES.MASTERS, path: "/drivers" },
          { label: "Drivers", path: "/drivers" },
          { label: driverId || "Edit Driver" },
        ],
        primaryAction: null,
      };
    },
  },

  // 6. SYSTEM: SETTINGS
  {
    pattern: /^\/settings$/,
    getConfig: () => ({
      section: SECTION_NAMES.SYSTEM,
      title: "Settings",
      breadcrumbs: [
        { label: SECTION_NAMES.SYSTEM, path: "/settings" },
        { label: "Settings" },
      ],
      primaryAction: null,
    }),
  },
];

/**
 * Resolves the header configuration for the given pathname and search string
 * @param {string} pathname
 * @param {string} search
 * @returns {{ section: string, title: string, breadcrumbs: Array<{label: string, path?: string}>, primaryAction: {label: string, path: string, icon?: string}|null }}
 */
export function getHeaderConfig(pathname = "/", search = "") {
  const searchParams = new URLSearchParams(search);

  for (const entry of HEADER_ROUTES) {
    if (entry.pattern.test(pathname)) {
      return entry.getConfig(pathname, searchParams);
    }
  }

  // Fallback for custom or unknown routes
  const cleanPath = pathname.replace(/^\//, "").split("/")[0];
  const capitalized = cleanPath
    ? cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1)
    : "Overview";

  return {
    section: "FleetCore",
    title: capitalized,
    breadcrumbs: [
      { label: "FleetCore", path: "/dashboard" },
      { label: capitalized },
    ],
    primaryAction: null,
  };
}
