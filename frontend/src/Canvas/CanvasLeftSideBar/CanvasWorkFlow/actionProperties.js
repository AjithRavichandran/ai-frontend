// src/Canvas/CanvasLeftSideBar/CanvasWorkFlow/actionProperties.js
export const ACTION_TYPES = {
  UPDATE_USER_CREDENTIALS: "update_user_credentials",
};

export const ACTION_PROPERTIES = {
  login: [
    { key: "email", label: "Email", type: "text" },
    { key: "password", label: "Password", type: "text" },
  ],
  signup: [
    { key: "email", label: "Email", type: "text" },
    { key: "password", label: "Password", type: "text" },
    { key: "confirmPassword", label: "Confirm Password", type: "text" },
  ],
  send_email: [
    { key: "to", label: "To", type: "text" },
    { key: "cc", label: "CC", type: "text" },
    { key: "bcc", label: "BCC", type: "text" },
    { key: "subject", label: "Subject", type: "text" },
    { key: "body", label: "Body", type: "text" },
  ],
  "make changes to current user": [
    {
      key: "fields",
      label: "Fields to update",
      type: "dynamic_user_fields",
    },
  ],
[ACTION_TYPES.UPDATE_USER_CREDENTIALS]: [
  { key: "oldPassword", label: "Old Password", type: "text" },

  {
    key: "fields",
    label: "User Fields",
    type: "dynamic_user_fields",
  },

  { key: "email", label: "Email", type: "text" },
  { key: "password", label: "New Password", type: "text" },
  { key: "confirmPassword", label: "Confirm Password", type: "text" },
],
update: [
    { key: "thingType", label: "Thing Type", type: "datatype" },
    { key: "fieldsMap", label: "Fields", type: "dynamic_fields" },
  ],

  navigate: [{ key: "targetPageId", label: "Target Page", type: "page" }],
  open_popup: [{ key: "popupId", label: "Popup", type: "popup" }],
  show: [{ key: "targetElementId", label: "Element", type: "element" }],
  hide: [{ key: "targetElementId", label: "Element", type: "element" }],
};
