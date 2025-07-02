export const ERROR_TYPES = {
  AUTH_REQUIRED: { code: "AUTH_REQUIRED", message: "Authentication required" },
  INVALID_INPUT: {
    code: "INVALID_INPUT",
    message: "Invalid or missing required fields",
  },
  UNSUPPORTED_WALLET: {
    code: "UNSUPPORTED_WALLET",
    message: "Unsupported wallet type",
  },
  INVALID_SIGNATURE: {
    code: "INVALID_SIGNATURE",
    message: "Invalid wallet signature",
  },
  SIGNATURE_EXPIRED: {
    code: "SIGNATURE_EXPIRED",
    message: "Signature has expired",
  },
  SERVER_ERROR: { code: "SERVER_ERROR", message: "Server error occurred" },
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", message: "User not found" },
};
