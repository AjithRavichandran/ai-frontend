import React from "react";
import InlineElementWithAdd from "./InlineElementWithAdd";
import { ACTION_PROPERTIES, ACTION_TYPES } from "./actionProperties";
import { getEditableUserFieldsFromDatatype } from "./userFieldUtils";
import ActionCondition from "./ActionCondition";

export default function ActionSidePanel({
  actionPanel,
  setActionPanel,
  workflows,
  pages,
  tree,
  updateAction,
  updateWorkflow,
  getWorkflowSelectableElements,
  getAllPopups,
  buildInlineOptions,
  datatypes = []

}) {
  const [openDropdowns, setOpenDropdowns] = React.useState([]);

const [doSearchPopup, setDoSearchPopup] = React.useState({
  open: false,
  wfIndex: null,
  actionIndex: null,
  fieldKey: null,
});
const openDoSearchPopup = (wfIndex, actionIndex, fieldKey) => {
  setDoSearchPopup({ open: true, wfIndex, actionIndex, fieldKey });
};

  const userFields = React.useMemo(() => {
  const usersDatatype = (datatypes || []).find((dt) => dt.name === "users");
  if (!usersDatatype) return []; // ✅ Prevent crash
  return getEditableUserFieldsFromDatatype(usersDatatype);
}, [datatypes]);


const wf = workflows?.[actionPanel.wfIndex];
const action = wf?.actions?.[actionPanel.actionIndex];
 
const resolvedThingType =
  action?.thingType ||
  (action?.targetElementId ? "element" : null);

const isEmailVisible = action?.email !== undefined;
  const isPasswordVisible = action?.password !== undefined;

const targetElement = action?.targetElementId
  ? getElementById(tree, action.targetElementId)
  : null;

const actionConditionFields = React.useMemo(() => {
  if (!wf) return [];

  const baseFields = [
    { id: "current_user", displayName: "Current User", type: "current_user" },
  ];

  // Add all page elements
  const pageElements = getWorkflowSelectableElements(wf.pageId, pages, tree);
  pageElements.forEach(el => {
    baseFields.push({
      id: el.id,
      displayName: el.displayName || el.name,
      type: "element",
      elementType: el.elementType,
      inputType: el.inputType,
    });
  });

  // Add user fields
  userFields.forEach(f =>
    baseFields.push({
      id: f.name,
      displayName: f.name,
      type: "user_field",
      datatype: f.type,
    })
  );

  return baseFields;
}, [wf, pages, tree, userFields, getWorkflowSelectableElements]);


const [fieldErrors, setFieldErrors] = React.useState({});

  const nonUserDatatypes = React.useMemo(() => {
  return (datatypes || []).filter(dt => dt.name !== "users");
}, [datatypes]);
const selectedDatatypeFields = React.useMemo(() => {
if (!resolvedThingType || !Array.isArray(datatypes)) return [];

const dt = datatypes?.find?.(d => d.name === resolvedThingType);
  return dt?.fields || [];
}, [action?.thingType, datatypes]);

  // Initialize dropdowns whenever action.fields changes
  React.useEffect(() => {
    if (!action) return;
    setOpenDropdowns((action.fields || []).map(() => false));
  }, [action]);

  if (!actionPanel.open) return null;
  if (!action) return null;

  // Toggle component
  const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <label className="inline-flex items-center cursor-pointer gap-2">
      {/* Hidden checkbox */}
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />

      {/* Toggle background */}
      <div className="w-11 h-6 bg-gray-200 rounded-full relative transition-colors duration-200
                      peer-checked:bg-blue-600">
        {/* Circle */}
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md
                          transform transition-transform duration-200
                          ${checked ? "translate-x-5" : ""}`} />
      </div>
    </label>
  );
};

function getElementById(tree, id) {
  if (!tree || !id) return null;

  let found = null;

  const walk = (node) => {
    if (!node || found) return;

    if (node.id === id) {
      found = node;
      return;
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  };

  // ✅ walk all pages
  tree.pages?.forEach(walk);

  // ✅ walk global popups
  tree.globalPopups?.children?.forEach(walk);

  return found;
}


const elementType = targetElement?.elementType;


  const toggleField = (field) => {
    const isVisible = action[field] !== undefined;
    updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
      ...action,
      [field]: isVisible ? undefined : { source: null, property: null },
    });
  };

  const addNewDropdown = () => {
    setOpenDropdowns((prev) => [...prev, true]);
    updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
      ...action,
      fields: [...(action.fields || []), ""],
      fieldsMap: { ...action.fieldsMap },
    });
  };

  const closeDropdown = (index) => {
    setOpenDropdowns((prev) => prev.map((v, i) => (i === index ? false : v)));
  };

  return (
    <div
      className="fixed right-0 w-[280px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col"
      style={{ top: "56px", height: "calc(100vh - 56px)" }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800 capitalize">
          {action.actionType ? action.actionType.replace(/_/g, " ") : "Select Action"}
        </h3>
        <button
          onClick={() => setActionPanel({ open: false })}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
      </div>

{/* BODY */}
<div className="flex-1 overflow-y-auto p-6 text-gray-700 space-y-4 font-sans">
<p className="text-gray-500 text-base leading-5">
  Configure{" "}
  <span className="font-semibold text-blue-600">
    {action.actionType ? action.actionType.replace(/_/g, " ") : "Select Action"}
  </span>{" "}
  action here
</p>






      {/* ================= UPDATE USER CREDENTIALS ================= */}
{action.actionType === ACTION_TYPES.UPDATE_USER_CREDENTIALS && (
  <div className="flex flex-col gap-4">
    {/* OLD PASSWORD */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 text-sm">Old Password</label>
      <InlineElementWithAdd
        value={action.oldPassword ?? { source: null, property: null }}
        expectedType="text"
        options={buildInlineOptions(wf.pageId, pages, tree)}
        datatypes={datatypes}
        onChange={(val) =>
          updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
            ...action,
            oldPassword: { ...action.oldPassword, ...val },
          })
        }
      />
    </div>

    {/* EMAIL TOGGLE */}
    <div className="flex items-center justify-between">
      <span className="text-gray-700 text-sm">Change Email</span>
      <ToggleSwitch
        checked={isEmailVisible}
        onChange={() => toggleField("email")}
        label=""
      />
    </div>

    {/* EMAIL INPUT */}
    {isEmailVisible && (
      <div className="ml-0">
        <InlineElementWithAdd
          value={action.email ?? { source: null, property: null }}
          expectedType="text"
          options={buildInlineOptions(wf.pageId, pages, tree)}
          datatypes={datatypes}
          onChange={(val) => {
            if (val?.type === "search") {
              openDoSearchPopup(actionPanel.wfIndex, actionPanel.actionIndex, "email");
              return;
            }
            updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
              ...action,
              email: { ...action.email, ...val },
            });
          }}
        />
      </div>
    )}

    {/* PASSWORD TOGGLE */}
    <div className="flex items-center justify-between">
      <span className="text-gray-700 text-sm">Change Password</span>
      <ToggleSwitch
        checked={isPasswordVisible}
        onChange={() => toggleField("password")}
        label=""
      />
    </div>

    {/* PASSWORD INPUT */}
    {isPasswordVisible && (
      <div className="ml-0">
        <InlineElementWithAdd
          value={action.password ?? { source: null, property: null }}
          expectedType="text"
          options={buildInlineOptions(wf.pageId, pages, tree)}
          datatypes={datatypes}
          onChange={(val) =>
            updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
              ...action,
              password: { ...action.password, ...val },
            })
          }
        />
      </div>
    )}

    {/* CONFIRM PASSWORD TOGGLE */}
    <div className="flex items-center justify-between">
      <span className="text-gray-700 text-sm">Required Password Confirm</span>
      <ToggleSwitch
        checked={action.confirmPassword !== undefined}
        onChange={() => toggleField("confirmPassword")}
        label=""
      />
    </div>

    {/* CONFIRM PASSWORD INPUT */}
    {action.confirmPassword !== undefined && (
      <div className="ml-0">
        <InlineElementWithAdd
          value={action.confirmPassword ?? { source: null, property: null }}
          expectedType="text"
          options={buildInlineOptions(wf.pageId, pages, tree)}
          datatypes={datatypes}
          onChange={(val) =>
            updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
              ...action,
              confirmPassword: { ...action.confirmPassword, ...val },
            })
          }
        />
      </div>
    )}
  </div>
)}


{/* ================= DYNAMIC USER FIELDS ================= */}
{action.actionType?.replace(/_/g, " ") === "make changes to current user" &&
  ACTION_PROPERTIES[action.actionType]?.map(
    (prop) =>
      prop.type === "dynamic_user_fields" && (
        <div key={prop.key} className="flex flex-col gap-3 relative">
          <label className="text-gray-700 text-sm">{prop.label}</label>

          {(action.fields || []).map((fieldName, index) => {
            const existingFieldValue =
              action.fieldsMap?.[fieldName] || {
                source: null,
                property: null,
                operators: [],
                returnType: null,
              };
              

            return (
              <div key={index} className="flex flex-col gap-1">

                {/* DROPDOWN — MUST BE INSIDE RETURN */}
    {openDropdowns[index] && (
      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-md max-h-48 overflow-y-auto">
        {userFields.map((f) => (
          <div
            key={f.name}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              const newFields = [...(action.fields || [])];
              newFields[index] = f.name;

              const newFieldsMap = {
                ...action.fieldsMap,
                [f.name]: existingFieldValue,
              };

              updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
                ...action,
                fields: newFields,
                fieldsMap: newFieldsMap,
              });

              closeDropdown(index);
            }}
          >
            {f.name}
          </div>
        ))}
      </div>
    )}
                <div className="flex items-center gap-2">
                  <span className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white">
                    {fieldName || "Select a field"}
                  </span>

                  {/* OPEN FIELD DROPDOWN */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdowns((prev) =>
                        prev.map((v, i) => (i === index ? !v : v))
                      )
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white hover:bg-gray-50"
                  >
                    +
                  </button>

                  {/* REMOVE FIELD */}
                  <button
                    type="button"
                    onClick={() => {
                      const newFields = [...(action.fields || [])];
                      const removedField = newFields[index];
                      newFields.splice(index, 1);

                      const newFieldsMap = { ...action.fieldsMap };
                      delete newFieldsMap[removedField];

                      updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
                        ...action,
                        fields: newFields,
                        fieldsMap: newFieldsMap,
                      });

                      setOpenDropdowns((prev) => prev.filter((_, i) => i !== index));
                    }}
                    className="text-red-500 hover:text-red-700 text-lg px-1"
                    title="Remove field"
                  >
                    ×
                  </button>
                </div>

                {/* FIELD VALUE INPUT */}
                {fieldName && (

                  <InlineElementWithAdd
                    value={action.fieldsMap?.[action.fields[index]]}
                    expectedType={userFields.find(f => f.name === action.fields[index])?.type}
                    options={buildInlineOptions(wf.pageId, pages, tree)}
                    datatypes={datatypes}
                    onChange={(val) => {
                      if (val?.type === "search") {
                        const placeholder = { type: "search", label: "Do a Search" };
                        updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
                          ...action,
                          fieldsMap: {
                            ...action.fieldsMap,
                            [action.fields[index]]: placeholder,
                          },
                        });

                        openDoSearchPopup(
                          actionPanel.wfIndex,
                          actionPanel.actionIndex,
                          action.fields[index]
                        );
                        return;
                      }

                      updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
                        ...action,
                        fieldsMap: { ...action.fieldsMap, [action.fields[index]]: val },
                      });
                    }}
                  />
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addNewDropdown}
            className="mt-1 text-blue-600 text-sm hover:underline"
          >
            + Add Field
          </button>
        </div>
      )
  )}

{/* ================= CREATE A THING ================= */}
{action.category === "data" &&
 action.actionType === "create" && (

  <div className="flex flex-col gap-4">

    {/* Datatype selector */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 text-sm">
        Thing Type
      </label>

      <select
        value={action.thingType || ""}
        onChange={(e) =>
          updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
            ...action,
            thingType: e.target.value,
            fieldsMap: {},
          })
        }
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
      >
        <option value="">Select datatype</option>

        {nonUserDatatypes.map(dt => (
          <option key={dt.name} value={dt.name}>
            {dt.name}
          </option>
        ))}
      </select>
    </div>

    {/* Datatype fields */}
    {action.thingType && selectedDatatypeFields.map(field => {

      const value =
        action.fieldsMap?.[field.name] || {
          source: null,
          property: null,
        };

      return (
        <div key={field.name} className="flex flex-col gap-1">

          <label className="text-sm text-gray-700">
            {field.name}
          </label>

          <InlineElementWithAdd
            value={value}
            expectedType={field.type}
            options={buildInlineOptions(
              wf.pageId,
              pages,
              tree
            )}
            datatypes={datatypes}
            onChange={(val) =>
              updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
                ...action,
                fieldsMap: {
                  ...action.fieldsMap,
                  [field.name]: val,
                },
              })
            }
          />

        </div>
      );
    })}

  </div>
)}

{/* ================= UPDATE A THING ================= */}
{action.category === "data" && action.actionType === "update" && (
  <div className="flex flex-col gap-4">

    {/* Datatype selector */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 text-sm">Thing Type</label>
      <select
        value={action.thingType || ""}
        onChange={(e) =>
          updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
            ...action,
            thingType: e.target.value,
            fieldsMap: {}, // reset fieldsMap on type change
          })
        }
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
      >
        <option value="">Select datatype</option>
        {nonUserDatatypes.map((dt) => (
          <option key={dt.name} value={dt.name}>
            {dt.name}
          </option>
        ))}
      </select>
    </div>

    {/* Datatype fields */}
    {action.thingType &&
      selectedDatatypeFields.map((field) => {
        const value =
          action.fieldsMap?.[field.name] || { source: null, property: null };

        return (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">{field.name}</label>
            <InlineElementWithAdd
              value={value}
              expectedType={field.type}
              options={buildInlineOptions(wf.pageId, pages, tree)}
              datatypes={datatypes}
              onChange={(val) =>
                updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
                  ...action,
                  fieldsMap: { ...action.fieldsMap, [field.name]: val },
                })
              }
            />
          </div>
        );
      })}
  </div>
)}

        {/* DEFAULT ACTION PROPERTIES */}
{action.actionType !== ACTION_TYPES.UPDATE_USER_CREDENTIALS &&
  ACTION_PROPERTIES[action.actionType]?.map((prop) => {
    if (prop.type === "text") {
      return (
        <div key={prop.key} className="flex flex-col gap-1">
          <label className="text-gray-700 text-sm">{prop.label}</label>
          <InlineElementWithAdd
            value={
              action[prop.key] ?? {
                source: null,
                property: null,
                operators: [],
                returnType: null,
              }
            }
            expectedType="text"
            options={buildInlineOptions(wf.pageId, pages, tree)}
            datatypes={datatypes}  // ✅ Added this line
            onChange={(val) => {
              updateAction(actionPanel.wfIndex, actionPanel.actionIndex, {
                ...action,
                [prop.key]: val,
              });
            }}
          />
        </div>
      );
    }
            /* PAGE */
            if (prop.type === "page") {
              return (
                <select
                  key={prop.key}
                  value={action[prop.key] || ""}
                  onChange={(e) =>
                    updateAction(
                      actionPanel.wfIndex,
                      actionPanel.actionIndex,
                      {
                        ...action,
                        [prop.key]: Number(e.target.value),
                      }
                    )
                  }
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm shadow-sm w-full"
                >
                  <option value="">Select page</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              );
            }

            /* POPUP */
            if (prop.type === "popup") {
              return (
                <select
                  key={prop.key}
                  value={action[prop.key] || ""}
                  onChange={(e) =>
                    updateAction(
                      actionPanel.wfIndex,
                      actionPanel.actionIndex,
                      { ...action, [prop.key]: e.target.value }
                    )
                  }
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm shadow-sm w-full"
                >
                  <option value="">Select popup</option>
                  {getAllPopups().map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.value || p.id}
                    </option>
                  ))}
                </select>
              );
            }

            /* ELEMENT */
            if (prop.type === "element") {
              return (
                <div key={prop.key} className="flex flex-col gap-2">
                  <label className="text-gray-700 text-sm">{prop.label}</label>
                  <select
                    value={action[prop.key] || ""}
                    onChange={(e) =>
                      updateAction(
                        actionPanel.wfIndex,
                        actionPanel.actionIndex,
                        { ...action, [prop.key]: e.target.value }
                      )
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm shadow-sm w-full"
                  >
                    <option value="">Select element...</option>
                    {getWorkflowSelectableElements(
                      wf.pageId,
                      pages,
                      tree
                    ).map((el) => (
                      <option key={el.id} value={el.id}>
                        {el.displayName} ({el.elementType})
                        {el.scope === "global" ? " 🌍" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return null;
          })}
{/* ================= ACTION CONDITION ================= */}
<div className="h-0.5" /> {/* adds 2rem space */}
<div className="border-t border-gray-200 pt-4">
  <ActionCondition
    workflow={wf}
    workflowIndex={actionPanel.wfIndex}
    action={action}
    actionIndex={actionPanel.actionIndex}
    updateWorkflow={updateWorkflow}
    pageFields={actionConditionFields}
  />
</div>



      </div>
    </div>
  );
}
