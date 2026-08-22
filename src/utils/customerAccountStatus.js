export function getCustomerAccountStatus(customer) {
  const openingBalance = Number(customer.openingBalance ?? 0);

  if (openingBalance < 0) {
    return {
      value: "credit",
      label: "Credit",
    };
  }

  if (openingBalance === 0) {
    return {
      value: "no_dues",
      label: "No Dues",
    };
  }

  return {
    value: "due",
    label: "Due",
  };
}
