export const capsLockActive = (e) => {
  const capsLockActive = e.getModifierState("CapsLock");
  return capsLockActive;
};

export const isValidMobileNumber = (mobileNumber) => {
  // Regular expression to match 10-digit numbers
  const mobileNumberPattern = /^\d{10}$/;
  return mobileNumberPattern.test(mobileNumber);
};
