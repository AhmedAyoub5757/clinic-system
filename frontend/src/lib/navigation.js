// One place that decides who sees which menu item.
// New modules add one line here as their Swagger sections arrive.
export const NAV_ITEMS = [
  { label: "Dashboard", to: "/", roles: ["admin", "doctor", "receptionist"] },
  { label: "Patients", to: "/patients", roles: ["admin", "doctor", "receptionist"] },
];